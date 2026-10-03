from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.venda import FormaPagamento
from app.routes.auth import security
from app.schemas.venda import ResumoVendasResponse, VendaCreate, VendaResponse
from app.services import auth_service, venda_service

router = APIRouter(prefix="/api/vendas", tags=["vendas"])
DbSession = Annotated[Session, Depends(get_db)]


def usuario_opcional_id(
    credenciais: Annotated[object, Depends(security)],
) -> int | None:
    if not credenciais or not hasattr(credenciais, "credentials"):
        return None
    payload = auth_service.decodificar_token(credenciais.credentials)
    if payload and "sub" in payload:
        try:
            return int(payload["sub"])
        except ValueError:
            return None
    return None


@router.post("", response_model=VendaResponse, status_code=status.HTTP_201_CREATED)
def criar_venda(
    dados: VendaCreate,
    db: DbSession,
    usuario_id: Annotated[int | None, Depends(usuario_opcional_id)] = None,
) -> VendaResponse:
    try:
        venda = venda_service.registrar_venda(db, dados, usuario_id=usuario_id)
        return VendaResponse.model_validate(venda)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error


@router.get("/resumo", response_model=ResumoVendasResponse)
def resumo_vendas(
    db: DbSession,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
) -> ResumoVendasResponse:
    dados = venda_service.obter_resumo_vendas(
        db, data_inicio=data_inicio, data_fim=data_fim
    )
    return ResumoVendasResponse.model_validate(dados)


@router.get("", response_model=list[VendaResponse])
def listar_vendas(
    db: DbSession,
    data_inicio: datetime | None = None,
    data_fim: datetime | None = None,
    forma_pagamento: FormaPagamento | None = None,
    limite: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[VendaResponse]:
    vendas = venda_service.listar_vendas(
        db,
        data_inicio=data_inicio,
        data_fim=data_fim,
        forma_pagamento=forma_pagamento,
        limite=limite,
    )
    return [VendaResponse.model_validate(v) for v in vendas]


@router.get("/{venda_id}", response_model=VendaResponse)
def buscar_venda(venda_id: int, db: DbSession) -> VendaResponse:
    venda = venda_service.buscar_venda(db, venda_id)
    if not venda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venda não encontrada.",
        )
    return VendaResponse.model_validate(venda)


from app.models.usuario import Usuario
from app.routes.auth import obter_usuario_logado
from app.schemas.venda import VendaCancelamentoCreate


@router.post("/{venda_id}/cancelar", response_model=VendaResponse)
def cancelar_venda(
    venda_id: int,
    dados: VendaCancelamentoCreate,
    db: DbSession,
    usuario: Annotated[Usuario, Depends(obter_usuario_logado)],
) -> VendaResponse:
    try:
        venda = venda_service.cancelar_venda(
            db, venda_id=venda_id, usuario_id=usuario.id, motivo=dados.motivo
        )
        return VendaResponse.model_validate(venda)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


