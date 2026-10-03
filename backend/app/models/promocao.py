from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class Promocao(Base):
    __tablename__ = "promocoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), index=True)
    preco_promocional: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ativa: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    produto: Mapped["Produto"] = relationship("Produto", back_populates="promocoes")
