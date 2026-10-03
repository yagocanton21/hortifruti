from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.usuario import (
    TokenResponse,
    UsuarioCreate,
    UsuarioLogin,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["autenticacao"])
security = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]


def obter_usuario_logado(
    credenciais: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: DbSession,
) -> Usuario:
    if not credenciais:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = auth_service.decodificar_token(credenciais.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = auth_service.buscar_usuario_por_id(db, int(payload["sub"]))
    if not usuario or not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo ou não encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario


UsuarioLogado = Annotated[Usuario, Depends(obter_usuario_logado)]


def exigir_gerente(usuario: UsuarioLogado) -> Usuario:
    if usuario.perfil != PerfilUsuario.GERENTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito ao perfil de Gerente.",
        )
    return usuario


@router.post("/login", response_model=TokenResponse)
def login(dados: UsuarioLogin, db: DbSession) -> TokenResponse:
    usuario = auth_service.autenticar_usuario(db, dados.username, dados.senha)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos.",
        )

    token = auth_service.criar_token_acesso(usuario)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario=UsuarioResponse.model_validate(usuario),
    )


@router.get("/me", response_model=UsuarioResponse)
def me(usuario: UsuarioLogado) -> UsuarioResponse:
    return UsuarioResponse.model_validate(usuario)


@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_todos_usuarios(
    db: DbSession,
    _: Annotated[Usuario, Depends(exigir_gerente)],
) -> list[UsuarioResponse]:
    usuarios = auth_service.listar_usuarios(db)
    return [UsuarioResponse.model_validate(u) for u in usuarios]


@router.post("/usuarios", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar_novo_usuario(
    dados: UsuarioCreate,
    db: DbSession,
    _: Annotated[Usuario, Depends(exigir_gerente)],
) -> UsuarioResponse:
    existente = auth_service.buscar_usuario_por_username(db, dados.username.strip().lower())
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe um usuário com o login '{dados.username}'.",
        )

    usuario = auth_service.criar_usuario(db, dados)
    return UsuarioResponse.model_validate(usuario)


@router.patch("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def atualizar_dados_usuario(
    usuario_id: int,
    dados: UsuarioUpdate,
    db: DbSession,
    _: Annotated[Usuario, Depends(exigir_gerente)],
) -> UsuarioResponse:
    usuario = auth_service.atualizar_usuario(db, usuario_id, dados)
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )
    return UsuarioResponse.model_validate(usuario)
