from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base

if TYPE_CHECKING:
    from app.models.produto import Produto
    from app.models.usuario import Usuario


class TipoMovimentacaoEstoque(str, Enum):
    ENTRADA = "ENTRADA"  # Compra / reposição de mercadoria
    PERDA = "PERDA"      # Quebra, perda, descarte de hortifruti estragado
    AJUSTE = "AJUSTE"    # Inventário / acerto manual de contagem
    VENDA = "VENDA"      # Baixa automática realizada pelo PDV
    ESTORNO_VENDA = "ESTORNO_VENDA"  # Devolução de venda cancelada


class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"

    id: Mapped[int] = mapped_column(primary_key=True)
    produto_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="CASCADE"), index=True
    )
    tipo: Mapped[TipoMovimentacaoEstoque] = mapped_column(
        SqlEnum(TipoMovimentacaoEstoque, name="tipo_movimentacao_estoque_enum")
    )
    quantidade: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    estoque_anterior: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    estoque_posterior: Mapped[Decimal] = mapped_column(Numeric(12, 3))
    motivo: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    usuario_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    produto: Mapped["Produto"] = relationship(
        "Produto", back_populates="movimentacoes_estoque"
    )
    usuario: Mapped[Optional["Usuario"]] = relationship("Usuario")
