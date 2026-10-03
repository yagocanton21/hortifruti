from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class TipoRegistroFiado(str, Enum):
    COMPRA = "COMPRA"
    PAGAMENTO = "PAGAMENTO"


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100), index=True)
    cpf_cnpj: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    limite_credito: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("500.00"))
    saldo_devedor: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    vendas: Mapped[list["Venda"]] = relationship("Venda", back_populates="cliente")
    registros: Mapped[list["RegistroFiado"]] = relationship(
        "RegistroFiado",
        back_populates="cliente",
        cascade="all, delete-orphan",
        order_by="RegistroFiado.criado_em.desc()",
    )


class RegistroFiado(Base):
    __tablename__ = "registros_fiado"

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), index=True)
    tipo: Mapped[TipoRegistroFiado] = mapped_column(
        SqlEnum(TipoRegistroFiado, name="tipo_registro_fiado_enum")
    )
    valor: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    saldo_anterior: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    saldo_posterior: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    venda_id: Mapped[int | None] = mapped_column(ForeignKey("vendas.id"), nullable=True)
    observacao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    cliente: Mapped[Cliente] = relationship("Cliente", back_populates="registros")
