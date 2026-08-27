from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.pesagem import (
    CalculoPesagemRequest,
    CalculoPesagemResponse,
    PesagemResponse,
)
from app.services.pesagem_service import (
    buscar_pesagem,
    calcular_pesagem,
    cancelar_pesagem,
    registrar_pesagem,
)
from app.services.produto_service import buscar_produto

router = APIRouter(prefix="/api/pesagens", tags=["pesagens"])
DbSession = Annotated[Session, Depends(get_db)]


@router.post("/calcular", response_model=CalculoPesagemResponse)
def calcular(dados: CalculoPesagemRequest, db: DbSession) -> CalculoPesagemResponse:
    produto = buscar_produto(db, dados.produto_id)
    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado.",
        )
    try:
        return calcular_pesagem(produto, dados.peso_kg)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error


@router.post("", response_model=PesagemResponse, status_code=status.HTTP_201_CREATED)
def registrar(dados: CalculoPesagemRequest, db: DbSession) -> PesagemResponse:
    produto = buscar_produto(db, dados.produto_id)
    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado.",
        )
    try:
        return registrar_pesagem(db, produto, dados.peso_kg)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error


@router.get("/{pesagem_id}", response_model=PesagemResponse)
def buscar(pesagem_id: int, db: DbSession) -> PesagemResponse:
    pesagem = buscar_pesagem(db, pesagem_id)
    if pesagem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pesagem não encontrada.",
        )
    return PesagemResponse.model_validate(pesagem)


@router.patch("/{pesagem_id}/cancelar", response_model=PesagemResponse)
def cancelar(pesagem_id: int, db: DbSession) -> PesagemResponse:
    pesagem = buscar_pesagem(db, pesagem_id)
    if pesagem is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pesagem não encontrada.",
        )
    try:
        return PesagemResponse.model_validate(cancelar_pesagem(db, pesagem))
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
