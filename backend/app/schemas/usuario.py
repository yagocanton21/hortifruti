from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.usuario import PerfilUsuario


class UsuarioLogin(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    senha: str = Field(min_length=1)


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    username: str
    perfil: PerfilUsuario
    ativo: bool
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse


class UsuarioCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=50)
    senha: str = Field(min_length=3)
    perfil: PerfilUsuario = PerfilUsuario.OPERADOR
    ativo: bool = True


class UsuarioUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=100)
    senha: str | None = Field(default=None, min_length=3)
    perfil: PerfilUsuario | None = None
    ativo: bool | None = None

