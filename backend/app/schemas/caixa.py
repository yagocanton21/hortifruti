from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.caixa import StatusTurnoCaixa, TipoMovimentacaoCaixa


class AberturaCaixaCreate(BaseModel):
    saldo_inicial: Decimal = Field(
        default=Decimal("100.00"),
        ge=0,
        max_digits=12,
        decimal_places=2,
        description="Fundo de troco para abertura da gaveta",
    )


class MovimentacaoCaixaCreate(BaseModel):
    tipo: TipoMovimentacaoCaixa
    valor: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    motivo: str = Field(min_length=3, max_length=255)


class FechamentoCaixaCreate(BaseModel):
    saldo_informado_gaveta: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    observacoes: str | None = Field(default=None, max_length=500)


class MovimentacaoCaixaResponse(BaseModel):
    id: int
    turno_id: int
    tipo: TipoMovimentacaoCaixa
    valor: Decimal
    motivo: str
    usuario_id: int
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class TurnoCaixaResponse(BaseModel):
    id: int
    status: StatusTurnoCaixa
    usuario_abertura_id: int
    usuario_fechamento_id: int | None = None
    aberto_em: datetime
    fechado_em: datetime | None = None

    saldo_inicial: Decimal
    total_suprimentos: Decimal
    total_sangrias: Decimal
    total_dinheiro: Decimal
    total_pix: Decimal
    total_debito: Decimal
    total_credito: Decimal
    total_vendas: Decimal

    saldo_esperado_gaveta: Decimal
    saldo_informado_gaveta: Decimal | None = None
    diferenca_gaveta: Decimal | None = None
    observacoes: str | None = None

    movimentacoes: list[MovimentacaoCaixaResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StatusCaixaResponse(BaseModel):
    aberto: bool
    turno: TurnoCaixaResponse | None = None
    saldo_atual_gaveta: Decimal = Decimal("0.00")
    total_clientes_atendidos: int = 0
