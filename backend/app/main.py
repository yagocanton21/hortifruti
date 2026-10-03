from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database.database import SessionLocal, engine
from app.routes import (
    auth_router,
    caixa_router,
    clientes_router,
    estoque_router,
    pesagens_router,
    produtos_router,
    promocoes_router,
    vendas_router,
)
from app.services.auth_service import garantir_usuarios_iniciais

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with SessionLocal() as db:
            garantir_usuarios_iniciais(db)
    except Exception:
        # Tabela pode ainda estar sendo criada na migração
        pass
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(caixa_router)
app.include_router(clientes_router)
app.include_router(estoque_router)
app.include_router(produtos_router)
app.include_router(promocoes_router)
app.include_router(pesagens_router)
app.include_router(vendas_router)


@app.get("/api/health", tags=["infraestrutura"])
def health_check() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
