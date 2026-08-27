from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.pesagem import Pesagem, StatusPesagem
from app.models.produto import Produto, UnidadeVenda
from app.schemas.pesagem import CalculoPesagemResponse, PesagemResponse


CENTAVOS = Decimal("0.01")


def calcular_pesagem(produto: Produto, peso_kg: Decimal) -> CalculoPesagemResponse:
    if not produto.ativo:
        raise ValueError("Produto inativo não pode ser usado em uma pesagem.")
    if produto.unidade_venda != UnidadeVenda.KG:
        raise ValueError("Somente produtos vendidos por KG podem ser pesados.")

    total = (peso_kg * produto.preco_atual).quantize(
        CENTAVOS,
        rounding=ROUND_HALF_UP,
    )
    return CalculoPesagemResponse(
        produto_id=produto.id,
        codigo_interno=produto.codigo_interno,
        produto_nome=produto.nome,
        peso_kg=peso_kg,
        preco_kg=produto.preco_atual,
        total=total,
    )


def registrar_pesagem(
    db: Session,
    produto: Produto,
    peso_kg: Decimal,
) -> PesagemResponse:
    calculo = calcular_pesagem(produto, peso_kg)
    pesagem = Pesagem(**calculo.model_dump())
    db.add(pesagem)
    db.commit()
    db.refresh(pesagem)
    return PesagemResponse.model_validate(pesagem)


def buscar_pesagem(db: Session, pesagem_id: int) -> Pesagem | None:
    return db.get(Pesagem, pesagem_id)


def cancelar_pesagem(db: Session, pesagem: Pesagem) -> Pesagem:
    if pesagem.status != StatusPesagem.PENDENTE:
        raise ValueError("Somente uma pesagem pendente pode ser cancelada.")
    pesagem.status = StatusPesagem.CANCELADA
    db.commit()
    db.refresh(pesagem)
    return pesagem
