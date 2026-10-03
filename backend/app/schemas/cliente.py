from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.cliente import TipoRegistroFiado


class ClienteCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    cpf_cnpj: str | None = Field(default=None, max_length=20)
    telefone: str | None = Field(default=None, max_length=20)
    endereco: str | None = Field(default=None, max_length=255)
    limite_credito: Decimal = Field(default=Decimal("500.00"), ge=0, max_digits=12, decimal_places=2)


class ClienteUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=100)
    cpf_cnpj: str | None = Field(default=None, max_length=20)
    telefone: str | None = Field(default=None, max_length=20)
    endereco: str | None = Field(default=None, max_length=255)
    limite_credito: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    ativo: bool | None = None


class RegistroFiadoResponse(BaseModel):
    id: int
    cliente_id: int
    tipo: TipoRegistroFiado
    valor: Decimal
    saldo_anterior: Decimal
    saldo_posterior: Decimal
    venda_id: int | None = None
    observacao: str | None = None
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class ClienteResponse(BaseModel):
    id: int
    nome: str
    cpf_cnpj: str | None = None
    telefone: str | None = None
    endereco: str | None = None
    limite_credito: Decimal
    saldo_devedor: Decimal
    ativo: bool
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class PagamentoFiadoCreate(BaseModel):
    valor: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    observacao: str | None = Field(default=None, max_length=255)
