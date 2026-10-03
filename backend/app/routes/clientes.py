from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.usuario import Usuario
from app.routes.auth import obter_usuario_logado
from app.schemas.cliente import (
    ClienteCreate,
    ClienteResponse,
    ClienteUpdate,
    PagamentoFiadoCreate,
    RegistroFiadoResponse,
)
from app.services import cliente_service

router = APIRouter(prefix="/api/clientes", tags=["clientes"])
DbSession = Annotated[Session, Depends(get_db)]
UsuarioAtual = Annotated[Usuario, Depends(obter_usuario_logado)]


@router.get("", response_model=list[ClienteResponse])
def listar_clientes(
    db: DbSession,
    busca: Annotated[str, Query(max_length=100)] = "",
) -> list[ClienteResponse]:
    clientes = cliente_service.listar_clientes(db, busca=busca)
    return [ClienteResponse.model_validate(c) for c in clientes]


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def criar_cliente(
    dados: ClienteCreate,
    db: DbSession,
    _: UsuarioAtual,
) -> ClienteResponse:
    cliente = cliente_service.criar_cliente(db, dados)
    return ClienteResponse.model_validate(cliente)


@router.get("/{cliente_id}", response_model=ClienteResponse)
def buscar_cliente(cliente_id: int, db: DbSession) -> ClienteResponse:
    cliente = cliente_service.buscar_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )
    return ClienteResponse.model_validate(cliente)


@router.patch("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(
    cliente_id: int,
    dados: ClienteUpdate,
    db: DbSession,
    _: UsuarioAtual,
) -> ClienteResponse:
    cliente = cliente_service.atualizar_cliente(db, cliente_id, dados)
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado.",
        )
    return ClienteResponse.model_validate(cliente)


@router.get("/{cliente_id}/extrato", response_model=list[RegistroFiadoResponse])
def obter_extrato_cliente(
    cliente_id: int,
    db: DbSession,
) -> list[RegistroFiadoResponse]:
    registros = cliente_service.obter_extrato_cliente(db, cliente_id)
    return [RegistroFiadoResponse.model_validate(r) for r in registros]


@router.post("/{cliente_id}/pagamento", response_model=RegistroFiadoResponse)
def receber_pagamento_fiado(
    cliente_id: int,
    dados: PagamentoFiadoCreate,
    db: DbSession,
    usuario: UsuarioAtual,
) -> RegistroFiadoResponse:
    try:
        reg = cliente_service.receber_pagamento_fiado(db, cliente_id, usuario.id, dados)
        return RegistroFiadoResponse.model_validate(reg)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
