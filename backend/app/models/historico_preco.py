from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.produto import Produto


class HistoricoPreco(Base):
    __tablename__ = "historico_precos"
    __table_args__ = (
        CheckConstraint("preco >= 0", name="ck_historico_precos_preco_nao_negativo"),
        Index(
            "ix_historico_precos_produto_data",
            "produto_id",
            "registrado_em",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    produto_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="RESTRICT")
    )
    preco: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    registrado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    produto: Mapped["Produto"] = relationship(back_populates="historico_precos")
