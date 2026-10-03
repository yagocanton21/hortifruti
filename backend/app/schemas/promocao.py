from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class PromocaoCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    produto_id: int
    preco_promocional: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativa: bool = True


class PromocaoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=100)
    preco_promocional: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativa: bool | None = None


class PromocaoResponse(BaseModel):
    id: int
    nome: str
    produto_id: int
    preco_promocional: Decimal
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativa: bool
    criado_em: datetime
    produto_nome: str | None = None
    produto_codigo: str | None = None
    produto_preco_original: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)
