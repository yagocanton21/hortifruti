from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.estoque import MovimentacaoEstoque, TipoMovimentacaoEstoque
from app.models.produto import Produto, UnidadeVenda
from app.schemas.estoque import (
    ConfiguracaoEstoqueUpdate,
    ItemEstoqueResponse,
    MovimentacaoEstoqueCreate,
    ResumoEstoqueResponse,
)


def registrar_movimentacao(
    db: Session,
    dados: MovimentacaoEstoqueCreate,
    usuario_id: Optional[int] = None,
) -> MovimentacaoEstoque:
    produto = db.get(Produto, dados.produto_id)
    if not produto:
        raise ValueError("Produto não encontrado.")

    estoque_anterior = produto.estoque_atual

    if dados.tipo == TipoMovimentacaoEstoque.ENTRADA:
        estoque_posterior = estoque_anterior + dados.quantidade
    elif dados.tipo == TipoMovimentacaoEstoque.PERDA:
        estoque_posterior = max(Decimal("0.000"), estoque_anterior - dados.quantidade)
    elif dados.tipo == TipoMovimentacaoEstoque.AJUSTE:
        estoque_posterior = dados.quantidade
    elif dados.tipo == TipoMovimentacaoEstoque.VENDA:
        estoque_posterior = estoque_anterior - dados.quantidade
    elif dados.tipo == TipoMovimentacaoEstoque.ESTORNO_VENDA:
        estoque_posterior = estoque_anterior + dados.quantidade
    else:
        raise ValueError(f"Tipo de movimentação inválido: {dados.tipo}")

    produto.estoque_atual = estoque_posterior

    movimentacao = MovimentacaoEstoque(
        produto_id=produto.id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
        estoque_anterior=estoque_anterior,
        estoque_posterior=estoque_posterior,
        motivo=dados.motivo,
        usuario_id=usuario_id,
    )

    db.add(movimentacao)
    db.commit()
    db.refresh(movimentacao)
    return movimentacao


def registrar_baixa_venda(
    db: Session,
    produto_id: Optional[int],
    quantidade_ou_peso: Decimal,
    usuario_id: Optional[int] = None,
    codigo_venda: Optional[str] = None,
) -> Optional[MovimentacaoEstoque]:
    if not produto_id:
        return None
    produto = db.get(Produto, produto_id)
    if not produto or not produto.controla_estoque:
        return None

    dados = MovimentacaoEstoqueCreate(
        produto_id=produto.id,
        tipo=TipoMovimentacaoEstoque.VENDA,
        quantidade=quantidade_ou_peso,
        motivo=f"Baixa automática PDV - Venda #{codigo_venda}" if codigo_venda else "Venda PDV",
    )
    return registrar_movimentacao(db, dados, usuario_id)


def registrar_estorno_venda(
    db: Session,
    produto_id: Optional[int],
    quantidade_ou_peso: Decimal,
    usuario_id: Optional[int] = None,
    codigo_venda: Optional[str] = None,
) -> Optional[MovimentacaoEstoque]:
    if not produto_id:
        return None
    produto = db.get(Produto, produto_id)
    if not produto or not produto.controla_estoque:
        return None

    dados = MovimentacaoEstoqueCreate(
        produto_id=produto.id,
        tipo=TipoMovimentacaoEstoque.ESTORNO_VENDA,
        quantidade=quantidade_ou_peso,
        motivo=f"Estorno de venda #{codigo_venda}" if codigo_venda else "Estorno de venda",
    )
    return registrar_movimentacao(db, dados, usuario_id)


def listar_estoque(
    db: Session,
    busca: str = "",
    apenas_baixo: bool = False,
    apenas_zerados: bool = False,
    unidade_venda: Optional[UnidadeVenda] = None,
) -> List[ItemEstoqueResponse]:
    stmt = select(Produto).where(Produto.ativo.is_(True)).order_by(Produto.nome.asc())

    if busca.strip():
        termo = f"%{busca.strip()}%"
        stmt = stmt.where((Produto.nome.ilike(termo)) | (Produto.codigo_interno.ilike(termo)))

    if unidade_venda:
        stmt = stmt.where(Produto.unidade_venda == unidade_venda)

    produtos = db.scalars(stmt).all()
    resultado: List[ItemEstoqueResponse] = []

    for p in produtos:
        atual = Decimal(str(p.estoque_atual or "0.000"))
        minimo = Decimal(str(p.estoque_minimo or "0.000"))

        if atual <= Decimal("0.001"):
            status = "ZERADO"
        elif atual <= minimo:
            status = "BAIXO"
        else:
            status = "NORMAL"

        if apenas_zerados and status != "ZERADO":
            continue
        if apenas_baixo and status not in ("BAIXO", "ZERADO"):
            continue

        valor_estimado = max(Decimal("0.00"), atual) * Decimal(str(p.preco_atual))

        resultado.append(
            ItemEstoqueResponse(
                id=p.id,
                codigo_interno=p.codigo_interno,
                nome=p.nome,
                unidade_venda=p.unidade_venda,
                preco_atual=p.preco_atual,
                estoque_atual=p.estoque_atual,
                estoque_minimo=p.estoque_minimo,
                controla_estoque=p.controla_estoque,
                status_estoque=status,
                valor_estoque_estimado=valor_estimado,
            )
        )

    return resultado


def obter_resumo_estoque(db: Session) -> ResumoEstoqueResponse:
    produtos = db.scalars(select(Produto).where(Produto.ativo.is_(True))).all()

    total_controlados = 0
    total_baixo = 0
    total_zerados = 0
    valor_total = Decimal("0.00")

    for p in produtos:
        if not p.controla_estoque:
            continue

        total_controlados += 1
        atual = Decimal(str(p.estoque_atual or "0.000"))
        minimo = Decimal(str(p.estoque_minimo or "0.000"))

        if atual <= Decimal("0.001"):
            total_zerados += 1
        elif atual <= minimo:
            total_baixo += 1

        if atual > 0:
            valor_total += atual * Decimal(str(p.preco_atual))

    return ResumoEstoqueResponse(
        total_produtos_controlados=total_controlados,
        total_baixo_ou_critico=total_baixo,
        total_zerados=total_zerados,
        valor_total_estoque=valor_total.quantize(Decimal("0.01")),
    )


def obter_historico_produto(
    db: Session, produto_id: int, limite: int = 50
) -> List[MovimentacaoEstoque]:
    stmt = (
        select(MovimentacaoEstoque)
        .where(MovimentacaoEstoque.produto_id == produto_id)
        .order_by(MovimentacaoEstoque.criado_em.desc())
        .limit(limite)
    )
    return list(db.scalars(stmt).all())


def atualizar_configuracao(
    db: Session, produto_id: int, dados: ConfiguracaoEstoqueUpdate
) -> Produto:
    produto = db.get(Produto, produto_id)
    if not produto:
        raise ValueError("Produto não encontrado.")

    if dados.estoque_minimo is not None:
        produto.estoque_minimo = dados.estoque_minimo
    if dados.controla_estoque is not None:
        produto.controla_estoque = dados.controla_estoque

    db.commit()
    db.refresh(produto)
    return produto
