from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.produto import Produto
from app.models.promocao import Promocao
from app.schemas.promocao import PromocaoCreate, PromocaoUpdate

CASAS_DECIMAIS = Decimal("0.01")


def arredondar(valor: Decimal) -> Decimal:
    return valor.quantize(CASAS_DECIMAIS, rounding=ROUND_HALF_UP)


def listar_promocoes(db: Session, apenas_ativas: bool = False) -> list[Promocao]:
    stmt = (
        select(Promocao)
        .join(Produto, Promocao.produto_id == Produto.id)
        .order_by(Promocao.ativa.desc(), Promocao.id.desc())
    )
    if apenas_ativas:
        agora = datetime.now(timezone.utc)
        stmt = stmt.where(
            Promocao.ativa.is_(True),
            (Promocao.data_inicio.is_(None) | (Promocao.data_inicio <= agora)),
            (Promocao.data_fim.is_(None) | (Promocao.data_fim >= agora)),
        )
    return list(db.scalars(stmt).all())


def criar_promocao(db: Session, dados: PromocaoCreate) -> Promocao:
    produto = db.get(Produto, dados.produto_id)
    if not produto:
        raise ValueError("Produto selecionado não existe.")

    promocao = Promocao(
        nome=dados.nome.strip(),
        produto_id=dados.produto_id,
        preco_promocional=arredondar(dados.preco_promocional),
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        ativa=dados.ativa,
    )
    db.add(promocao)
    db.commit()
    db.refresh(promocao)
    return promocao


def atualizar_promocao(db: Session, promocao_id: int, dados: PromocaoUpdate) -> Promocao | None:
    promocao = db.get(Promocao, promocao_id)
    if not promocao:
        return None

    if dados.nome is not None:
        promocao.nome = dados.nome.strip()
    if dados.preco_promocional is not None:
        promocao.preco_promocional = arredondar(dados.preco_promocional)
    if dados.data_inicio is not None:
        promocao.data_inicio = dados.data_inicio
    if dados.data_fim is not None:
        promocao.data_fim = dados.data_fim
    if dados.ativa is not None:
        promocao.ativa = dados.ativa

    db.commit()
    db.refresh(promocao)
    return promocao


def desativar_promocao(db: Session, promocao_id: int) -> bool:
    promocao = db.get(Promocao, promocao_id)
    if not promocao:
        return False
    promocao.ativa = not promocao.ativa
    db.commit()
    return True


def obter_preco_promocional_ativo(db: Session, produto_id: int) -> Decimal | None:
    agora = datetime.now(timezone.utc)
    stmt = (
        select(Promocao.preco_promocional)
        .where(
            Promocao.produto_id == produto_id,
            Promocao.ativa.is_(True),
            (Promocao.data_inicio.is_(None) | (Promocao.data_inicio <= agora)),
            (Promocao.data_fim.is_(None) | (Promocao.data_fim >= agora)),
        )
        .order_by(Promocao.preco_promocional.asc())
        .limit(1)
    )
    return db.scalar(stmt)
