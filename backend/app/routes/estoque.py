from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.produto import UnidadeVenda
from app.models.usuario import Usuario
from app.routes.auth import exigir_gerente
from app.schemas.estoque import (
    ConfiguracaoEstoqueUpdate,
    ItemEstoqueResponse,
    MovimentacaoEstoqueCreate,
    MovimentacaoEstoqueResponse,
    ResumoEstoqueResponse,
)
from app.services import estoque_service

router = APIRouter(prefix="/api/estoque", tags=["estoque"])
DbSession = Annotated[Session, Depends(get_db)]
GerenteAtual = Annotated[Usuario, Depends(exigir_gerente)]


@router.get("", response_model=List[ItemEstoqueResponse])
def listar_estoque(
    db: DbSession,
    gerente: GerenteAtual,
    busca: str = Query("", description="Busca por nome ou código"),
    apenas_baixo: bool = Query(False, description="Filtrar apenas itens abaixo do estoque mínimo"),
    apenas_zerados: bool = Query(False, description="Filtrar apenas itens zerados"),
    unidade_venda: Optional[UnidadeVenda] = Query(None, description="Filtrar por unidade (KG ou UN)"),
):
    return estoque_service.listar_estoque(
        db=db,
        busca=busca,
        apenas_baixo=apenas_baixo,
        apenas_zerados=apenas_zerados,
        unidade_venda=unidade_venda,
    )


@router.get("/resumo", response_model=ResumoEstoqueResponse)
def obter_resumo_estoque(
    db: DbSession,
    gerente: GerenteAtual,
):
    return estoque_service.obter_resumo_estoque(db)


@router.post("/movimentacao", response_model=MovimentacaoEstoqueResponse, status_code=status.HTTP_201_CREATED)
def registrar_movimentacao(
    dados: MovimentacaoEstoqueCreate,
    db: DbSession,
    gerente: GerenteAtual,
):
    try:
        return estoque_service.registrar_movimentacao(
            db=db, dados=dados, usuario_id=gerente.id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{produto_id}/historico", response_model=List[MovimentacaoEstoqueResponse])
def obter_historico_produto(
    produto_id: int,
    db: DbSession,
    gerente: GerenteAtual,
    limite: int = Query(50, ge=1, le=200),
):
    return estoque_service.obter_historico_produto(db, produto_id=produto_id, limite=limite)


@router.patch("/{produto_id}/configuracao")
def atualizar_configuracao(
    produto_id: int,
    dados: ConfiguracaoEstoqueUpdate,
    db: DbSession,
    gerente: GerenteAtual,
):
    try:
        produto = estoque_service.atualizar_configuracao(db, produto_id=produto_id, dados=dados)
        return {
            "id": produto.id,
            "estoque_minimo": produto.estoque_minimo,
            "controla_estoque": produto.controla_estoque,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
