from datetime import datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SqlEnum, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class UnidadeVenda(str, Enum):
    KG = "KG"
    UN = "UN"


class Produto(Base):
    __tablename__ = "produtos"
    __table_args__ = (
        CheckConstraint("preco_atual >= 0", name="ck_produtos_preco_nao_negativo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo_interno: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    unidade_venda: Mapped[UnidadeVenda] = mapped_column(
        SqlEnum(UnidadeVenda, name="unidade_venda_enum")
    )
    preco_atual: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    alterado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    historico_precos: Mapped[list["HistoricoPreco"]] = relationship(
        back_populates="produto",
        order_by="HistoricoPreco.registrado_em.desc()",
    )


from app.models.historico_preco import HistoricoPreco  # noqa: E402

