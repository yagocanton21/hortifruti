from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class FormaPagamento(str, Enum):
    DINHEIRO = "DINHEIRO"
    PIX = "PIX"
    CARTAO_DEBITO = "CARTAO_DEBITO"
    CARTAO_CREDITO = "CARTAO_CREDITO"
    FIADO = "FIADO"


class StatusVenda(str, Enum):
    FINALIZADA = "FINALIZADA"
    CANCELADA = "CANCELADA"


class Venda(Base):
    __tablename__ = "vendas"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo_venda: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    desconto: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    forma_pagamento: Mapped[FormaPagamento] = mapped_column(
        SqlEnum(FormaPagamento, name="forma_pagamento_enum")
    )
    valor_pago: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    troco: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    status: Mapped[StatusVenda] = mapped_column(
        SqlEnum(StatusVenda, name="status_venda_enum"),
        default=StatusVenda.FINALIZADA,
        server_default="FINALIZADA",
    )
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    turno_id: Mapped[int | None] = mapped_column(ForeignKey("turnos_caixa.id"), nullable=True, index=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"), nullable=True, index=True)

    cancelada_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    motivo_cancelamento: Mapped[str | None] = mapped_column(String(255), nullable=True)
    usuario_cancelamento_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    itens: Mapped[list["ItemVenda"]] = relationship(
        back_populates="venda",
        cascade="all, delete-orphan",
    )
    turno: Mapped["TurnoCaixa | None"] = relationship(
        "TurnoCaixa",
        back_populates="vendas",
    )
    cliente: Mapped["Cliente | None"] = relationship(
        "Cliente",
        back_populates="vendas",
    )


class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id: Mapped[int] = mapped_column(primary_key=True)
    venda_id: Mapped[int] = mapped_column(ForeignKey("vendas.id"), index=True)
    produto_id: Mapped[int | None] = mapped_column(ForeignKey("produtos.id"), nullable=True)
    codigo_interno: Mapped[str] = mapped_column(String(20))
    nome: Mapped[str] = mapped_column(String(120))
    unidade_venda: Mapped[str] = mapped_column(String(10))
    quantidade_ou_peso: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    venda: Mapped[Venda] = relationship(back_populates="itens")
