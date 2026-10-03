from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.usuario import Usuario
from app.routes.auth import exigir_gerente, obter_usuario_logado
from app.schemas.promocao import PromocaoCreate, PromocaoResponse, PromocaoUpdate
from app.services import promocao_service

router = APIRouter(prefix="/api/promocoes", tags=["promocoes"])
DbSession = Annotated[Session, Depends(get_db)]
GerenteAtual = Annotated[Usuario, Depends(exigir_gerente)]


def serializar_promocao(p) -> PromocaoResponse:
    return PromocaoResponse(
        id=p.id,
        nome=p.nome,
        produto_id=p.produto_id,
        preco_promocional=p.preco_promocional,
        data_inicio=p.data_inicio,
        data_fim=p.data_fim,
        ativa=p.ativa,
        criado_em=p.criado_em,
        produto_nome=p.produto.nome if p.produto else None,
        produto_codigo=p.produto.codigo_interno if p.produto else None,
        produto_preco_original=p.produto.preco_atual if p.produto else None,
    )


@router.get("", response_model=list[PromocaoResponse])
def listar_promocoes(
    db: DbSession,
    apenas_ativas: bool = False,
) -> list[PromocaoResponse]:
    promocoes = promocao_service.listar_promocoes(db, apenas_ativas=apenas_ativas)
    return [serializar_promocao(p) for p in promocoes]


@router.post("", response_model=PromocaoResponse, status_code=status.HTTP_201_CREATED)
def criar_promocao(
    dados: PromocaoCreate,
    db: DbSession,
    _: GerenteAtual,
) -> PromocaoResponse:
    try:
        promocao = promocao_service.criar_promocao(db, dados)
        return serializar_promocao(promocao)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.patch("/{promocao_id}", response_model=PromocaoResponse)
def atualizar_promocao(
    promocao_id: int,
    dados: PromocaoUpdate,
    db: DbSession,
    _: GerenteAtual,
) -> PromocaoResponse:
    promocao = promocao_service.atualizar_promocao(db, promocao_id, dados)
    if not promocao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promoção não encontrada.",
        )
    return serializar_promocao(promocao)


@router.post("/{promocao_id}/alternar-status", response_model=dict)
def alternar_status_promocao(
    promocao_id: int,
    db: DbSession,
    _: GerenteAtual,
) -> dict:
    sucesso = promocao_service.desativar_promocao(db, promocao_id)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promoção não encontrada.",
        )
    return {"status": "ok"}
