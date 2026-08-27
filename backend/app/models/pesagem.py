from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    Enum as SqlEnum,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class StatusPesagem(str, Enum):
    PENDENTE = "PENDENTE"
    VENDIDA = "VENDIDA"
    CANCELADA = "CANCELADA"


class Pesagem(Base):
    __tablename__ = "pesagens"
    __table_args__ = (
        CheckConstraint("peso_kg > 0", name="ck_pesagens_peso_positivo"),
        CheckConstraint("preco_kg >= 0", name="ck_pesagens_preco_nao_negativo"),
        CheckConstraint("total >= 0", name="ck_pesagens_total_nao_negativo"),
        UniqueConstraint("codigo_pesagem", name="uq_pesagens_codigo_pesagem"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo_pesagem: Mapped[str] = mapped_column(
        String(13),
        Computed("'P' || lpad(id::text, 12, '0')", persisted=True),
    )
    produto_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="RESTRICT"),
        index=True,
    )
    codigo_interno: Mapped[str] = mapped_column(String(20))
    produto_nome: Mapped[str] = mapped_column(String(120))
    peso_kg: Mapped[Decimal] = mapped_column(Numeric(7, 3))
    preco_kg: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[StatusPesagem] = mapped_column(
        SqlEnum(StatusPesagem, name="status_pesagem_enum"),
        default=StatusPesagem.PENDENTE,
        server_default=StatusPesagem.PENDENTE.value,
        index=True,
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
