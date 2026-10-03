from app.routes.auth import router as auth_router
from app.routes.caixa import router as caixa_router
from app.routes.clientes import router as clientes_router
from app.routes.estoque import router as estoque_router
from app.routes.pesagens import router as pesagens_router
from app.routes.produtos import router as produtos_router
from app.routes.promocoes import router as promocoes_router
from app.routes.vendas import router as vendas_router

__all__ = [
    "auth_router",
    "caixa_router",
    "clientes_router",
    "estoque_router",
    "pesagens_router",
    "produtos_router",
    "promocoes_router",
    "vendas_router",
]

