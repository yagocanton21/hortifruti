from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.venda import FormaPagamento, StatusVenda


class ItemVendaCreate(BaseModel):
    produto_id: int | None = None
    codigo_interno: str
    nome: str
    unidade_venda: str
    quantidade_ou_peso: Decimal = Field(gt=0, max_digits=12, decimal_places=3)
    preco_unitario: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class ItemVendaResponse(BaseModel):
    id: int
    produto_id: int | None = None
    codigo_interno: str
    nome: str
    unidade_venda: str
    quantidade_ou_peso: Decimal
    preco_unitario: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class VendaCreate(BaseModel):
    forma_pagamento: FormaPagamento
    valor_pago: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    desconto: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)
    itens: list[ItemVendaCreate] = Field(min_length=1)
    cliente_id: int | None = None


class VendaCancelamentoCreate(BaseModel):
    motivo: str = Field(min_length=3, max_length=255)


class VendaResponse(BaseModel):
    id: int
    codigo_venda: str
    subtotal: Decimal
    desconto: Decimal
    total: Decimal
    forma_pagamento: FormaPagamento
    valor_pago: Decimal
    troco: Decimal
    status: StatusVenda
    usuario_id: int | None = None
    cliente_id: int | None = None
    cancelada_em: datetime | None = None
    motivo_cancelamento: str | None = None
    criado_em: datetime
    itens: list[ItemVendaResponse]

    model_config = ConfigDict(from_attributes=True)


class ResumoVendasResponse(BaseModel):
    total_faturado: Decimal = Decimal("0.00")
    total_vendas: int = 0
    ticket_medio: Decimal = Decimal("0.00")
    total_dinheiro: Decimal = Decimal("0.00")
    total_pix: Decimal = Decimal("0.00")
    total_debito: Decimal = Decimal("0.00")
    total_credito: Decimal = Decimal("0.00")
    total_fiado: Decimal = Decimal("0.00")
    total_descontos: Decimal = Decimal("0.00")
    total_canceladas: int = 0


