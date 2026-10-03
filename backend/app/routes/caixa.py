from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.usuario import Usuario
from app.routes.auth import obter_usuario_logado
from app.schemas.caixa import (
    AberturaCaixaCreate,
    FechamentoCaixaCreate,
    MovimentacaoCaixaCreate,
    MovimentacaoCaixaResponse,
    StatusCaixaResponse,
    TurnoCaixaResponse,
)
from app.services import caixa_service

router = APIRouter(prefix="/api/caixa", tags=["caixa"])
DbSession = Annotated[Session, Depends(get_db)]
UsuarioAtual = Annotated[Usuario, Depends(obter_usuario_logado)]


@router.get("/status", response_model=StatusCaixaResponse)
def status_caixa(db: DbSession) -> StatusCaixaResponse:
    info = caixa_service.obter_status_caixa(db)
    return StatusCaixaResponse.model_validate(info)


@router.post("/abrir", response_model=TurnoCaixaResponse, status_code=status.HTTP_201_CREATED)
def abrir_caixa(
    dados: AberturaCaixaCreate,
    db: DbSession,
    usuario: UsuarioAtual,
) -> TurnoCaixaResponse:
    try:
        turno = caixa_service.abrir_caixa(db, usuario.id, dados)
        return TurnoCaixaResponse.model_validate(turno)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/movimentacoes", response_model=MovimentacaoCaixaResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimentacao(
    dados: MovimentacaoCaixaCreate,
    db: DbSession,
    usuario: UsuarioAtual,
) -> MovimentacaoCaixaResponse:
    try:
        mov = caixa_service.registrar_movimentacao(db, usuario.id, dados)
        return MovimentacaoCaixaResponse.model_validate(mov)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.post("/fechar", response_model=TurnoCaixaResponse)
def fechar_caixa(
    dados: FechamentoCaixaCreate,
    db: DbSession,
    usuario: UsuarioAtual,
) -> TurnoCaixaResponse:
    try:
        turno = caixa_service.fechar_caixa(db, usuario.id, dados)
        return TurnoCaixaResponse.model_validate(turno)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get("/relatorio/{turno_id}", response_model=TurnoCaixaResponse)
def relatorio_turno(turno_id: int, db: DbSession) -> TurnoCaixaResponse:
    turno = caixa_service.buscar_turno_por_id(db, turno_id)
    if not turno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turno de caixa não encontrado.",
        )
    return TurnoCaixaResponse.model_validate(turno)
