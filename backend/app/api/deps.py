from typing import Generator, Optional, Dict, Any
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.professor import Professor
from app.core.config import settings
from app.api.endpoints.auth import TokenData

# Configuração do esquema OAuth2 para autenticação
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Dict[str, Any]:
    """
    Verifica o token JWT e retorna informações do usuário atual.
    Lança uma exceção se o token for inválido.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        user_type: str = payload.get("user_type", "")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = TokenData(username=username, user_type=user_type)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Identificar o tipo de usuário e buscar os dados adequados
    if token_data.user_type == "admin":
        user = {"id": 0, "username": "admin", "name": "Administrador", "user_type": "admin"}
    elif token_data.user_type == "professor":
        # Buscar dados do professor
        professor = db.query(Professor).filter(Professor.email_professor == token_data.username).first()
        if professor is None or not hasattr(professor, 'ativo') or not professor.ativo:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado ou inativo",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = {
            "id": professor.id, 
            "username": professor.email_professor, 
            "name": professor.nome_professor, 
            "user_type": "professor"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de usuário não reconhecido",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user


async def get_current_user_optional(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Optional[Dict[str, Any]]:
    """
    Versão opcional do get_current_user que não lança exceção se o token for inválido.
    Retorna None se o token for inválido ou não fornecido.
    """
    if not token:
        return None
        
    try:
        user = await get_current_user(db=db, token=token)
        return user
    except HTTPException:
        return None


async def get_current_admin(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Verifica se o usuário atual é um administrador.
    """
    if current_user.get("user_type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissões insuficientes",
        )
    return current_user


# SIMULAÇÃO PARA DESENVOLVIMENTO: substituição temporária para ignorar autenticação
def get_fake_admin() -> Dict[str, Any]:
    """
    APENAS PARA DESENVOLVIMENTO: Retorna um usuário administrador fake.
    """
    return {
        "id": 0, 
        "username": settings.ADMIN_USERNAME,
        "name": "Administrador",
        "user_type": "admin"
    } 