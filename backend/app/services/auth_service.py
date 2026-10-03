from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.usuario import PerfilUsuario, Usuario
from app.schemas.usuario import UsuarioCreate

settings = get_settings()


def gerar_hash_senha(senha: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(senha.encode("utf-8"), salt).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), senha_hash.encode("utf-8"))
    except Exception:
        return False


def criar_token_acesso(usuario: Usuario) -> str:
    expiracao = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {
        "sub": str(usuario.id),
        "username": usuario.username,
        "perfil": usuario.perfil.value,
        "exp": expiracao,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decodificar_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        return None


def autenticar_usuario(db: Session, username: str, senha: str) -> Usuario | None:
    stmt = select(Usuario).where(Usuario.username == username, Usuario.ativo.is_(True))
    usuario = db.execute(stmt).scalar_one_or_none()
    if not usuario:
        return None
    if not verificar_senha(senha, usuario.senha_hash):
        return None
    return usuario


def buscar_usuario_por_id(db: Session, usuario_id: int) -> Usuario | None:
    return db.get(Usuario, usuario_id)


def buscar_usuario_por_username(db: Session, username: str) -> Usuario | None:
    stmt = select(Usuario).where(Usuario.username == username)
    return db.execute(stmt).scalar_one_or_none()


def criar_usuario(db: Session, dados: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        nome=dados.nome.strip(),
        username=dados.username.strip().lower(),
        senha_hash=gerar_hash_senha(dados.senha),
        perfil=dados.perfil,
        ativo=dados.ativo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def listar_usuarios(db: Session) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.id.asc())).all())


def atualizar_usuario(db: Session, usuario_id: int, dados) -> Usuario | None:
    usuario = buscar_usuario_por_id(db, usuario_id)
    if not usuario:
        return None

    if dados.nome is not None:
        usuario.nome = dados.nome.strip()
    if dados.perfil is not None:
        usuario.perfil = dados.perfil
    if dados.ativo is not None:
        usuario.ativo = dados.ativo
    if dados.senha is not None and dados.senha.strip():
        usuario.senha_hash = gerar_hash_senha(dados.senha.strip())

    db.commit()
    db.refresh(usuario)
    return usuario


def garantir_usuarios_iniciais(db: Session) -> None:
    # Garante admin e um operador de teste inicial caso a tabela esteja vazia
    admin = buscar_usuario_por_username(db, "admin")
    if not admin:
        criar_usuario(
            db,
            UsuarioCreate(
                nome="Administrador Gerente",
                username="admin",
                senha="admin",
                perfil=PerfilUsuario.GERENTE,
            ),
        )

    operador = buscar_usuario_por_username(db, "caixa")
    if not operador:
        criar_usuario(
            db,
            UsuarioCreate(
                nome="Operador Caixa",
                username="caixa",
                senha="123",
                perfil=PerfilUsuario.OPERADOR,
            ),
        )
