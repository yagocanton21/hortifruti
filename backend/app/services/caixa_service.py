from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.caixa import (
    MovimentacaoCaixa,
    StatusTurnoCaixa,
    TipoMovimentacaoCaixa,
    TurnoCaixa,
)
from app.models.venda import FormaPagamento, StatusVenda, Venda
from app.schemas.caixa import (
    AberturaCaixaCreate,
    FechamentoCaixaCreate,
    MovimentacaoCaixaCreate,
)

CASAS_DECIMAIS = Decimal("0.01")


def arredondar_moeda(valor: Decimal) -> Decimal:
    return valor.quantize(CASAS_DECIMAIS, rounding=ROUND_HALF_UP)


def obter_turno_aberto(db: Session) -> TurnoCaixa | None:
    return db.scalar(
        select(TurnoCaixa)
        .where(TurnoCaixa.status == StatusTurnoCaixa.ABERTO)
        .order_by(TurnoCaixa.id.desc())
        .limit(1)
    )


def recalcular_totais_turno(db: Session, turno: TurnoCaixa) -> None:
    # 1. Soma suprimentos e sangrias
    suprimentos = db.scalar(
        select(func.coalesce(func.sum(MovimentacaoCaixa.valor), Decimal("0.00")))
        .where(
            MovimentacaoCaixa.turno_id == turno.id,
            MovimentacaoCaixa.tipo == TipoMovimentacaoCaixa.SUPRIMENTO,
        )
    ) or Decimal("0.00")

    sangrias = db.scalar(
        select(func.coalesce(func.sum(MovimentacaoCaixa.valor), Decimal("0.00")))
        .where(
            MovimentacaoCaixa.turno_id == turno.id,
            MovimentacaoCaixa.tipo == TipoMovimentacaoCaixa.SANGRIA,
        )
    ) or Decimal("0.00")

    # 2. Soma vendas por forma de pagamento
    vendas_base = select(Venda).where(
        Venda.turno_id == turno.id,
        Venda.status == StatusVenda.FINALIZADA,
    )

    tot_dinheiro = db.scalar(
        select(func.coalesce(func.sum(Venda.total), Decimal("0.00"))).where(
            Venda.turno_id == turno.id,
            Venda.status == StatusVenda.FINALIZADA,
            Venda.forma_pagamento == FormaPagamento.DINHEIRO,
        )
    ) or Decimal("0.00")

    tot_pix = db.scalar(
        select(func.coalesce(func.sum(Venda.total), Decimal("0.00"))).where(
            Venda.turno_id == turno.id,
            Venda.status == StatusVenda.FINALIZADA,
            Venda.forma_pagamento == FormaPagamento.PIX,
        )
    ) or Decimal("0.00")

    tot_debito = db.scalar(
        select(func.coalesce(func.sum(Venda.total), Decimal("0.00"))).where(
            Venda.turno_id == turno.id,
            Venda.status == StatusVenda.FINALIZADA,
            Venda.forma_pagamento == FormaPagamento.CARTAO_DEBITO,
        )
    ) or Decimal("0.00")

    tot_credito = db.scalar(
        select(func.coalesce(func.sum(Venda.total), Decimal("0.00"))).where(
            Venda.turno_id == turno.id,
            Venda.status == StatusVenda.FINALIZADA,
            Venda.forma_pagamento == FormaPagamento.CARTAO_CREDITO,
        )
    ) or Decimal("0.00")

    turno.total_suprimentos = arredondar_moeda(suprimentos)
    turno.total_sangrias = arredondar_moeda(sangrias)
    turno.total_dinheiro = arredondar_moeda(tot_dinheiro)
    turno.total_pix = arredondar_moeda(tot_pix)
    turno.total_debito = arredondar_moeda(tot_debito)
    turno.total_credito = arredondar_moeda(tot_credito)

    turno.total_vendas = arredondar_moeda(
        tot_dinheiro + tot_pix + tot_debito + tot_credito
    )

    # Esperado na gaveta: Fundo Inicial + Vendas Dinheiro + Suprimentos - Sangrias
    turno.saldo_esperado_gaveta = arredondar_moeda(
        turno.saldo_inicial + turno.total_dinheiro + turno.total_suprimentos - turno.total_sangrias
    )


def obter_status_caixa(db: Session) -> dict:
    turno = obter_turno_aberto(db)
    if not turno:
        return {
            "aberto": False,
            "turno": None,
            "saldo_atual_gaveta": Decimal("0.00"),
            "total_clientes_atendidos": 0,
        }

    recalcular_totais_turno(db, turno)
    db.commit()

    total_clientes = db.scalar(
        select(func.count(Venda.id)).where(
            Venda.turno_id == turno.id,
            Venda.status == StatusVenda.FINALIZADA,
        )
    ) or 0

    return {
        "aberto": True,
        "turno": turno,
        "saldo_atual_gaveta": turno.saldo_esperado_gaveta,
        "total_clientes_atendidos": total_clientes,
    }


def abrir_caixa(db: Session, usuario_id: int, dados: AberturaCaixaCreate) -> TurnoCaixa:
    turno_existente = obter_turno_aberto(db)
    if turno_existente:
        raise ValueError("Já existe um caixa aberto no momento. Feche o turno atual antes de abrir outro.")

    saldo_inicial = arredondar_moeda(dados.saldo_inicial)

    novo_turno = TurnoCaixa(
        usuario_abertura_id=usuario_id,
        status=StatusTurnoCaixa.ABERTO,
        saldo_inicial=saldo_inicial,
        saldo_esperado_gaveta=saldo_inicial,
    )
    db.add(novo_turno)
    db.commit()
    db.refresh(novo_turno)
    return novo_turno


def registrar_movimentacao(
    db: Session, usuario_id: int, dados: MovimentacaoCaixaCreate
) -> MovimentacaoCaixa:
    turno = obter_turno_aberto(db)
    if not turno:
        raise ValueError("Não há nenhum caixa aberto para registrar movimentação.")

    recalcular_totais_turno(db, turno)
    valor = arredondar_moeda(dados.valor)

    if dados.tipo == TipoMovimentacaoCaixa.SANGRIA:
        if valor > turno.saldo_esperado_gaveta:
            raise ValueError(
                f"Valor da sangria (R$ {valor}) é maior que o dinheiro disponível na gaveta (R$ {turno.saldo_esperado_gaveta})."
            )

    movimentacao = MovimentacaoCaixa(
        turno_id=turno.id,
        usuario_id=usuario_id,
        tipo=dados.tipo,
        valor=valor,
        motivo=dados.motivo.strip(),
    )
    db.add(movimentacao)
    db.commit()

    recalcular_totais_turno(db, turno)
    db.commit()
    db.refresh(movimentacao)
    return movimentacao


def fechar_caixa(
    db: Session, usuario_id: int, dados: FechamentoCaixaCreate
) -> TurnoCaixa:
    turno = obter_turno_aberto(db)
    if not turno:
        raise ValueError("Não há nenhum caixa aberto para fechar.")

    recalcular_totais_turno(db, turno)

    saldo_informado = arredondar_moeda(dados.saldo_informado_gaveta)
    diferenca = arredondar_moeda(saldo_informado - turno.saldo_esperado_gaveta)

    turno.status = StatusTurnoCaixa.FECHADO
    turno.usuario_fechamento_id = usuario_id
    turno.fechado_em = datetime.now(timezone.utc)
    turno.saldo_informado_gaveta = saldo_informado
    turno.diferenca_gaveta = diferenca
    turno.observacoes = dados.observacoes.strip() if dados.observacoes else None

    db.commit()
    db.refresh(turno)
    return turno


def buscar_turno_por_id(db: Session, turno_id: int) -> TurnoCaixa | None:
    return db.scalar(select(TurnoCaixa).where(TurnoCaixa.id == turno_id))
