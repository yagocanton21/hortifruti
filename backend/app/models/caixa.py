from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class StatusTurnoCaixa(str, Enum):
    ABERTO = "ABERTO"
    FECHADO = "FECHADO"


class TipoMovimentacaoCaixa(str, Enum):
    SUPRIMENTO = "SUPRIMENTO"
    SANGRIA = "SANGRIA"


class TurnoCaixa(Base):
    __tablename__ = "turnos_caixa"

    id: Mapped[int] = mapped_column(primary_key=True)
    status: Mapped[StatusTurnoCaixa] = mapped_column(
        SqlEnum(StatusTurnoCaixa, name="status_turno_caixa_enum"),
        default=StatusTurnoCaixa.ABERTO,
        index=True,
    )
    usuario_abertura_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    usuario_fechamento_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    aberto_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    fechado_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    saldo_inicial: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_suprimentos: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_sangrias: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_dinheiro: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_pix: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_debito: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_credito: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total_vendas: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))

    saldo_esperado_gaveta: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    saldo_informado_gaveta: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    diferenca_gaveta: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    movimentacoes: Mapped[list["MovimentacaoCaixa"]] = relationship(
        back_populates="turno",
        cascade="all, delete-orphan",
        order_by="MovimentacaoCaixa.criado_em.asc()",
    )
    vendas: Mapped[list["Venda"]] = relationship(
        back_populates="turno",
        order_by="Venda.criado_em.asc()",
    )


class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacoes_caixa"

    id: Mapped[int] = mapped_column(primary_key=True)
    turno_id: Mapped[int] = mapped_column(ForeignKey("turnos_caixa.id"), index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    tipo: Mapped[TipoMovimentacaoCaixa] = mapped_column(
        SqlEnum(TipoMovimentacaoCaixa, name="tipo_movimentacao_caixa_enum")
    )
    valor: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    motivo: Mapped[str] = mapped_column(String(255))
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    turno: Mapped[TurnoCaixa] = relationship(back_populates="movimentacoes")
