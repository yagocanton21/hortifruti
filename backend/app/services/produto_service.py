from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.historico_preco import HistoricoPreco
from app.models.produto import Produto, UnidadeVenda
from app.schemas.produto import ProdutoCreate, ProdutoPatch, ProdutoUpdate


def criar_produto(db: Session, dados: ProdutoCreate) -> Produto:
    produto = Produto(**dados.model_dump())
    historico = HistoricoPreco(produto=produto, preco=dados.preco_atual)
    db.add_all([produto, historico])
    db.commit()
    db.refresh(produto)
    return produto


def listar_produtos(
    db: Session,
    pesquisa: str | None = None,
    ativo: bool | None = None,
    unidade_venda: UnidadeVenda | None = None,
    pagina: int | None = None,
    tamanho: int = 15,
) -> tuple[list[Produto], int]:
    consulta = select(Produto)

    if pesquisa:
        termo = f"%{pesquisa.strip()}%"
        consulta = consulta.where(
            or_(
                Produto.codigo_interno.ilike(termo),
                Produto.nome.ilike(termo),
            )
        )

    if ativo is not None:
        consulta = consulta.where(Produto.ativo == ativo)

    if unidade_venda is not None:
        consulta = consulta.where(Produto.unidade_venda == unidade_venda)

    total = db.scalar(select(func.count()).select_from(consulta.subquery())) or 0

    consulta = consulta.order_by(Produto.nome)

    if pagina is not None:
        consulta = consulta.offset((pagina - 1) * tamanho).limit(tamanho)

    return list(db.scalars(consulta).all()), total


def buscar_produto(db: Session, produto_id: int) -> Produto | None:
    return db.get(Produto, produto_id)


def substituir_produto(
    db: Session,
    produto: Produto,
    dados: ProdutoUpdate,
) -> Produto:
    preco_anterior = produto.preco_atual
    for campo, valor in dados.model_dump().items():
        setattr(produto, campo, valor)
    if dados.preco_atual != preco_anterior:
        db.add(HistoricoPreco(produto=produto, preco=dados.preco_atual))
    db.commit()
    db.refresh(produto)
    return produto


def alterar_produto(
    db: Session,
    produto: Produto,
    dados: ProdutoPatch,
) -> Produto:
    alteracoes = dados.model_dump(exclude_unset=True)
    preco_anterior = produto.preco_atual
    for campo, valor in alteracoes.items():
        setattr(produto, campo, valor)
    if "preco_atual" in alteracoes and alteracoes["preco_atual"] != preco_anterior:
        db.add(HistoricoPreco(produto=produto, preco=alteracoes["preco_atual"]))
    db.commit()
    db.refresh(produto)
    return produto


def listar_historico_precos(
    db: Session,
    produto_id: int,
    pagina: int,
    tamanho: int,
) -> tuple[list[HistoricoPreco], int]:
    total = db.scalar(
        select(func.count(HistoricoPreco.id)).where(
            HistoricoPreco.produto_id == produto_id
        )
    ) or 0
    consulta = (
        select(HistoricoPreco)
        .where(HistoricoPreco.produto_id == produto_id)
        .order_by(HistoricoPreco.registrado_em.desc(), HistoricoPreco.id.desc())
        .offset((pagina - 1) * tamanho)
        .limit(tamanho)
    )
    return list(db.scalars(consulta).all()), total
