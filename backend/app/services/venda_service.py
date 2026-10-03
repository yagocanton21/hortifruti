from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.venda import FormaPagamento, ItemVenda, StatusVenda, Venda
from app.schemas.venda import VendaCreate

CASAS_DECIMAIS = Decimal("0.01")


def arredondar_moeda(valor: Decimal) -> Decimal:
    return valor.quantize(CASAS_DECIMAIS, rounding=ROUND_HALF_UP)


def gerar_codigo_venda(db: Session) -> str:
    hoje = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefixo = f"V{hoje}"
    total_hoje = db.scalar(
        select(func.count(Venda.id)).where(Venda.codigo_venda.like(f"{prefixo}%"))
    ) or 0
    sequencial = total_hoje + 1
    return f"{prefixo}{sequencial:04d}"


def registrar_venda(
    db: Session, dados: VendaCreate, usuario_id: int | None = None
) -> Venda:
    subtotal = Decimal("0.00")
    itens_model: list[ItemVenda] = []

    for item in dados.itens:
        item_subtotal = arredondar_moeda(item.quantidade_ou_peso * item.preco_unitario)
        subtotal += item_subtotal

        itens_model.append(
            ItemVenda(
                produto_id=item.produto_id,
                codigo_interno=item.codigo_interno,
                nome=item.nome,
                unidade_venda=item.unidade_venda,
                quantidade_ou_peso=item.quantidade_ou_peso,
                preco_unitario=item.preco_unitario,
                subtotal=item_subtotal,
            )
        )

    desconto = arredondar_moeda(dados.desconto)
    if desconto > subtotal:
        raise ValueError("O desconto não pode ser maior que o subtotal da venda.")

    total = max(Decimal("0.00"), subtotal - desconto)
    if dados.forma_pagamento == FormaPagamento.FIADO:
        valor_pago = Decimal("0.00")
        troco = Decimal("0.00")
    else:
        valor_pago = arredondar_moeda(dados.valor_pago)
        if valor_pago < total:
            raise ValueError(f"Valor pago (R$ {valor_pago}) é menor que o total da venda (R$ {total}).")
        troco = arredondar_moeda(valor_pago - total)

    codigo_venda = gerar_codigo_venda(db)

    # Validação para venda em Fiado
    if dados.forma_pagamento == FormaPagamento.FIADO:
        if not dados.cliente_id:
            raise ValueError("Para vendas na modalidade FIADO, é obrigatório selecionar um cliente cadastrado.")
        from app.services import cliente_service
        cliente = cliente_service.buscar_cliente(db, dados.cliente_id)
        if not cliente:
            raise ValueError("Cliente informado não foi encontrado.")
        if not cliente.ativo:
            raise ValueError(f"O cliente {cliente.nome} está inativo para compras a prazo.")

    # Associa ao turno de caixa aberto, se houver
    from app.services import caixa_service
    turno_aberto = caixa_service.obter_turno_aberto(db)

    venda = Venda(
        codigo_venda=codigo_venda,
        subtotal=subtotal,
        desconto=desconto,
        total=total,
        forma_pagamento=dados.forma_pagamento,
        valor_pago=valor_pago,
        troco=troco,
        status=StatusVenda.FINALIZADA,
        usuario_id=usuario_id,
        turno_id=turno_aberto.id if turno_aberto else None,
        cliente_id=dados.cliente_id if dados.forma_pagamento == FormaPagamento.FIADO else None,
        itens=itens_model,
    )

    db.add(venda)
    db.commit()

    # Dá baixa automática no estoque para os itens vendidos
    from app.services import estoque_service
    for it in itens_model:
        estoque_service.registrar_baixa_venda(
            db=db,
            produto_id=it.produto_id,
            quantidade_ou_peso=it.quantidade_ou_peso,
            usuario_id=usuario_id,
            codigo_venda=venda.codigo_venda,
        )

    # Se for fiado, debita na conta do cliente
    if dados.forma_pagamento == FormaPagamento.FIADO:
        from app.services import cliente_service
        cliente = cliente_service.buscar_cliente(db, dados.cliente_id)
        cliente_service.registrar_compra_fiado(db, cliente, venda.id, total)

    if turno_aberto:
        caixa_service.recalcular_totais_turno(db, turno_aberto)
        db.commit()

    db.refresh(venda)
    return venda


def cancelar_venda(
    db: Session, venda_id: int, usuario_id: int, motivo: str
) -> Venda:
    venda = db.get(Venda, venda_id)
    if not venda:
        raise ValueError("Venda não encontrada.")
    if venda.status == StatusVenda.CANCELADA:
        raise ValueError("Esta venda já se encontra cancelada.")

    venda.status = StatusVenda.CANCELADA
    venda.cancelada_em = datetime.now(timezone.utc)
    venda.motivo_cancelamento = motivo.strip()
    venda.usuario_cancelamento_id = usuario_id

    # Estorna os produtos de volta ao estoque
    from app.services import estoque_service
    for it in venda.itens:
        estoque_service.registrar_estorno_venda(
            db=db,
            produto_id=it.produto_id,
            quantidade_ou_peso=it.quantidade_ou_peso,
            usuario_id=usuario_id,
            codigo_venda=venda.codigo_venda,
        )

    # Se era fiado, estorna o saldo devedor do cliente
    if venda.forma_pagamento == FormaPagamento.FIADO and venda.cliente_id:
        from app.services import cliente_service
        cliente_service.estornar_compra_fiado(db, venda.cliente_id, venda.id, venda.total)

    db.commit()

    # Se estava associada a um turno, recalcula os totais do turno
    if venda.turno_id:
        from app.services import caixa_service
        turno = caixa_service.buscar_turno_por_id(db, venda.turno_id)
        if turno:
            caixa_service.recalcular_totais_turno(db, turno)
            db.commit()

    db.refresh(venda)
    return venda


def listar_vendas(
    db: Session,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
    forma_pagamento: FormaPagamento | None = None,
    limite: int = 100,
) -> list[Venda]:
    stmt = select(Venda).order_by(Venda.criado_em.desc(), Venda.id.desc())

    if data_inicio:
        stmt = stmt.where(Venda.criado_em >= data_inicio)
    if data_fim:
        stmt = stmt.where(Venda.criado_em <= data_fim)
    if forma_pagamento:
        stmt = stmt.where(Venda.forma_pagamento == forma_pagamento)

    return list(db.scalars(stmt.limit(limite)).all())


def obter_resumo_vendas(
    db: Session,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
) -> dict:
    stmt_ativas = select(Venda).where(Venda.status == StatusVenda.FINALIZADA)
    stmt_canc = select(func.count(Venda.id)).where(Venda.status == StatusVenda.CANCELADA)

    if data_inicio:
        stmt_ativas = stmt_ativas.where(Venda.criado_em >= data_inicio)
        stmt_canc = stmt_canc.where(Venda.criado_em >= data_inicio)
    if data_fim:
        stmt_ativas = stmt_ativas.where(Venda.criado_em <= data_fim)
        stmt_canc = stmt_canc.where(Venda.criado_em <= data_fim)

    vendas = list(db.scalars(stmt_ativas).all())
    total_canceladas = db.scalar(stmt_canc) or 0

    total_faturado = Decimal("0.00")
    total_descontos = Decimal("0.00")
    total_dinheiro = Decimal("0.00")
    total_pix = Decimal("0.00")
    total_debito = Decimal("0.00")
    total_credito = Decimal("0.00")
    total_fiado = Decimal("0.00")

    for v in vendas:
        total_faturado += v.total
        total_descontos += v.desconto
        if v.forma_pagamento == FormaPagamento.DINHEIRO:
            total_dinheiro += v.total
        elif v.forma_pagamento == FormaPagamento.PIX:
            total_pix += v.total
        elif v.forma_pagamento == FormaPagamento.CARTAO_DEBITO:
            total_debito += v.total
        elif v.forma_pagamento == FormaPagamento.CARTAO_CREDITO:
            total_credito += v.total
        elif v.forma_pagamento == FormaPagamento.FIADO:
            total_fiado += v.total

    total_vendas = len(vendas)
    ticket_medio = (
        arredondar_moeda(total_faturado / Decimal(total_vendas))
        if total_vendas > 0
        else Decimal("0.00")
    )

    return {
        "total_faturado": total_faturado,
        "total_vendas": total_vendas,
        "ticket_medio": ticket_medio,
        "total_dinheiro": total_dinheiro,
        "total_pix": total_pix,
        "total_debito": total_debito,
        "total_credito": total_credito,
        "total_fiado": total_fiado,
        "total_descontos": total_descontos,
        "total_canceladas": total_canceladas,
    }


def buscar_venda(db: Session, venda_id: int) -> Venda | None:
    return db.get(Venda, venda_id)


