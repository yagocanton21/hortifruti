from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.caixa import TipoMovimentacaoCaixa
from app.models.cliente import Cliente, RegistroFiado, TipoRegistroFiado
from app.schemas.cliente import ClienteCreate, ClienteUpdate, PagamentoFiadoCreate
from app.services import caixa_service

CASAS_DECIMAIS = Decimal("0.01")


def arredondar(valor: Decimal) -> Decimal:
    return valor.quantize(CASAS_DECIMAIS, rounding=ROUND_HALF_UP)


def listar_clientes(db: Session, busca: str = "") -> list[Cliente]:
    stmt = select(Cliente).order_by(Cliente.nome.asc())
    if busca.strip():
        termo = f"%{busca.strip()}%"
        stmt = stmt.where(
            or_(
                Cliente.nome.ilike(termo),
                Cliente.telefone.ilike(termo),
                Cliente.cpf_cnpj.ilike(termo),
            )
        )
    return list(db.scalars(stmt).all())


def buscar_cliente(db: Session, cliente_id: int) -> Cliente | None:
    return db.get(Cliente, cliente_id)


def criar_cliente(db: Session, dados: ClienteCreate) -> Cliente:
    cliente = Cliente(
        nome=dados.nome.strip(),
        cpf_cnpj=dados.cpf_cnpj.strip() if dados.cpf_cnpj else None,
        telefone=dados.telefone.strip() if dados.telefone else None,
        endereco=dados.endereco.strip() if dados.endereco else None,
        limite_credito=arredondar(dados.limite_credito),
        saldo_devedor=Decimal("0.00"),
        ativo=True,
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


def atualizar_cliente(db: Session, cliente_id: int, dados: ClienteUpdate) -> Cliente | None:
    cliente = buscar_cliente(db, cliente_id)
    if not cliente:
        return None

    if dados.nome is not None:
        cliente.nome = dados.nome.strip()
    if dados.cpf_cnpj is not None:
        cliente.cpf_cnpj = dados.cpf_cnpj.strip() if dados.cpf_cnpj else None
    if dados.telefone is not None:
        cliente.telefone = dados.telefone.strip() if dados.telefone else None
    if dados.endereco is not None:
        cliente.endereco = dados.endereco.strip() if dados.endereco else None
    if dados.limite_credito is not None:
        cliente.limite_credito = arredondar(dados.limite_credito)
    if dados.ativo is not None:
        cliente.ativo = dados.ativo

    db.commit()
    db.refresh(cliente)
    return cliente


def registrar_compra_fiado(
    db: Session, cliente: Cliente, venda_id: int, valor: Decimal
) -> RegistroFiado:
    if not cliente.ativo:
        raise ValueError(f"O cliente {cliente.nome} está inativo para compras a prazo.")

    valor_compra = arredondar(valor)
    novo_saldo = arredondar(cliente.saldo_devedor + valor_compra)

    if novo_saldo > cliente.limite_credito:
        raise ValueError(
            f"Limite de crédito excedido! Limite: R$ {cliente.limite_credito}, Saldo Atual: R$ {cliente.saldo_devedor}, Compra: R$ {valor_compra}."
        )

    registro = RegistroFiado(
        cliente_id=cliente.id,
        tipo=TipoRegistroFiado.COMPRA,
        valor=valor_compra,
        saldo_anterior=cliente.saldo_devedor,
        saldo_posterior=novo_saldo,
        venda_id=venda_id,
        observacao="Compra a prazo no caixa",
    )
    cliente.saldo_devedor = novo_saldo

    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


def estornar_compra_fiado(
    db: Session, cliente_id: int, venda_id: int, valor: Decimal
) -> None:
    cliente = buscar_cliente(db, cliente_id)
    if not cliente:
        return

    valor_estorno = arredondar(valor)
    novo_saldo = max(Decimal("0.00"), arredondar(cliente.saldo_devedor - valor_estorno))

    registro = RegistroFiado(
        cliente_id=cliente.id,
        tipo=TipoRegistroFiado.PAGAMENTO,
        valor=valor_estorno,
        saldo_anterior=cliente.saldo_devedor,
        saldo_posterior=novo_saldo,
        venda_id=venda_id,
        observacao=f"Estorno por cancelamento da venda #{venda_id}",
    )
    cliente.saldo_devedor = novo_saldo
    db.add(registro)
    db.commit()


def receber_pagamento_fiado(
    db: Session, cliente_id: int, usuario_id: int, dados: PagamentoFiadoCreate
) -> RegistroFiado:
    cliente = buscar_cliente(db, cliente_id)
    if not cliente:
        raise ValueError("Cliente não encontrado.")

    valor_pago = arredondar(dados.valor)
    if valor_pago <= Decimal("0.00"):
        raise ValueError("O valor do pagamento deve ser maior que zero.")

    if valor_pago > cliente.saldo_devedor:
        raise ValueError(
            f"Valor do pagamento (R$ {valor_pago}) é maior que a dívida atual (R$ {cliente.saldo_devedor})."
        )

    novo_saldo = arredondar(cliente.saldo_devedor - valor_pago)

    registro = RegistroFiado(
        cliente_id=cliente.id,
        tipo=TipoRegistroFiado.PAGAMENTO,
        valor=valor_pago,
        saldo_anterior=cliente.saldo_devedor,
        saldo_posterior=novo_saldo,
        observacao=dados.observacao.strip() if dados.observacao else "Recebimento de conta no balcão",
    )
    cliente.saldo_devedor = novo_saldo
    db.add(registro)
    db.commit()

    # Se houver caixa aberto, dá entrada do dinheiro físico na gaveta como suprimento
    turno_aberto = caixa_service.obter_turno_aberto(db)
    if turno_aberto:
        from app.schemas.caixa import MovimentacaoCaixaCreate
        caixa_service.registrar_movimentacao(
            db,
            usuario_id,
            MovimentacaoCaixaCreate(
                tipo=TipoMovimentacaoCaixa.SUPRIMENTO,
                valor=valor_pago,
                motivo=f"Recebimento de Fiado: {cliente.nome}",
            ),
        )

    db.refresh(registro)
    return registro


def obter_extrato_cliente(db: Session, cliente_id: int) -> list[RegistroFiado]:
    stmt = (
        select(RegistroFiado)
        .where(RegistroFiado.cliente_id == cliente_id)
        .order_by(RegistroFiado.criado_em.desc(), RegistroFiado.id.desc())
    )
    return list(db.scalars(stmt).all())
