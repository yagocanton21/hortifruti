from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.produto import Produto, UnidadeVenda
from app.schemas.produto import (
    HistoricoPrecosPage,
    ProdutoCreate,
    ProdutoPatch,
    ProdutoResponse,
    ProdutosPage,
    ProdutoUpdate,
)
from app.services import produto_service

router = APIRouter(prefix="/api/produtos", tags=["produtos"])
DbSession = Annotated[Session, Depends(get_db)]


def obter_produto_ou_404(db: Session, produto_id: int) -> Produto:
    produto = produto_service.buscar_produto(db, produto_id)
    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado.",
        )
    return produto


def salvar_ou_conflito(operacao, db: Session) -> Produto:
    try:
        return operacao()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um produto com este código interno.",
        ) from error


@router.post("", response_model=ProdutoResponse, status_code=status.HTTP_201_CREATED)
def criar_produto(dados: ProdutoCreate, db: DbSession) -> ProdutoResponse:
    return salvar_ou_conflito(lambda: produto_service.criar_produto(db, dados), db)


@router.get("", response_model=ProdutosPage | list[ProdutoResponse])
def listar_produtos(
    db: DbSession,
    pesquisa: Annotated[str | None, Query(max_length=120)] = None,
    ativo: bool | None = None,
    unidade_venda: Annotated[UnidadeVenda | None, Query()] = None,
    pagina: Annotated[int | None, Query(ge=1)] = None,
    tamanho: Annotated[int, Query(ge=1, le=100)] = 6,
) -> ProdutosPage | list[ProdutoResponse]:
    itens, total = produto_service.listar_produtos(
        db,
        pesquisa=pesquisa,
        ativo=ativo,
        unidade_venda=unidade_venda,
        pagina=pagina,
        tamanho=tamanho,
    )
    if pagina is not None:
        total_paginas = (total + tamanho - 1) // tamanho if total > 0 else 1
        return ProdutosPage(
            itens=itens,
            pagina=pagina,
            tamanho=tamanho,
            total=total,
            total_paginas=total_paginas,
        )
    return [ProdutoResponse.model_validate(item) for item in itens]


@router.get("/{produto_id}", response_model=ProdutoResponse)
def buscar_produto(produto_id: int, db: DbSession) -> ProdutoResponse:
    return obter_produto_ou_404(db, produto_id)


@router.get(
    "/{produto_id}/historico-precos",
    response_model=HistoricoPrecosPage,
)
def listar_historico_precos(
    produto_id: int,
    db: DbSession,
    pagina: Annotated[int, Query(ge=1)] = 1,
    tamanho: Annotated[int, Query(ge=1, le=100)] = 20,
) -> HistoricoPrecosPage:
    obter_produto_ou_404(db, produto_id)
    itens, total = produto_service.listar_historico_precos(
        db,
        produto_id,
        pagina,
        tamanho,
    )
    total_paginas = (total + tamanho - 1) // tamanho
    return HistoricoPrecosPage(
        itens=itens,
        pagina=pagina,
        tamanho=tamanho,
        total=total,
        total_paginas=total_paginas,
    )


@router.put("/{produto_id}", response_model=ProdutoResponse)
def substituir_produto(
    produto_id: int,
    dados: ProdutoUpdate,
    db: DbSession,
) -> ProdutoResponse:
    produto = obter_produto_ou_404(db, produto_id)
    return salvar_ou_conflito(
        lambda: produto_service.substituir_produto(db, produto, dados),
        db,
    )


@router.patch("/{produto_id}", response_model=ProdutoResponse)
def alterar_produto(
    produto_id: int,
    dados: ProdutoPatch,
    db: DbSession,
) -> ProdutoResponse:
    produto = obter_produto_ou_404(db, produto_id)
    return salvar_ou_conflito(
        lambda: produto_service.alterar_produto(db, produto, dados),
        db,
    )
