from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.pesagem import StatusPesagem


class CalculoPesagemRequest(BaseModel):
    produto_id: int = Field(gt=0)
    peso_kg: Decimal = Field(gt=0, max_digits=6, decimal_places=3)


class CalculoPesagemResponse(BaseModel):
    produto_id: int
    codigo_interno: str
    produto_nome: str
    peso_kg: Decimal
    preco_kg: Decimal
    total: Decimal


class PesagemResponse(CalculoPesagemResponse):
    id: int
    codigo_pesagem: str
    status: StatusPesagem
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
