from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.estoque import TipoMovimentacaoEstoque
from app.models.produto import UnidadeVenda


class MovimentacaoEstoqueCreate(BaseModel):
    produto_id: int
    tipo: TipoMovimentacaoEstoque
    quantidade: Decimal = Field(..., gt=0, description="Quantidade da movimentação")
    motivo: Optional[str] = Field(None, max_length=255)


class MovimentacaoEstoqueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    produto_id: int
    tipo: TipoMovimentacaoEstoque
    quantidade: Decimal
    estoque_anterior: Decimal
    estoque_posterior: Decimal
    motivo: Optional[str] = None
    usuario_id: Optional[int] = None
    criado_em: datetime


class ConfiguracaoEstoqueUpdate(BaseModel):
    estoque_minimo: Optional[Decimal] = Field(None, ge=0)
    controla_estoque: Optional[bool] = None


class ItemEstoqueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo_interno: str
    nome: str
    unidade_venda: UnidadeVenda
    preco_atual: Decimal
    estoque_atual: Decimal
    estoque_minimo: Decimal
    controla_estoque: bool
    status_estoque: str  # NORMAL, BAIXO, ZERADO
    valor_estoque_estimado: Decimal


class ResumoEstoqueResponse(BaseModel):
    total_produtos_controlados: int
    total_baixo_ou_critico: int
    total_zerados: int
    valor_total_estoque: Decimal
