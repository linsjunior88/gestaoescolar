from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.professor import Professor
from app.core.config import settings

router = APIRouter()

# Modelos de dados para autenticação
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    user_type: Optional[str] = None


# Configuração da segurança
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def verify_password(plain_password, hashed_password):
    """Verifica se a senha fornecida corresponde ao hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Gera um hash para a senha fornecida."""
    return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str):
    """Autentica um usuário pelo nome de usuário e senha."""
    # Verificar se é um acesso de administrador da escola
    if username == "admin" and password == "admin":
        # Para o protótipo inicial, permitir um login admin fixo
        return {"id": 0, "username": "admin", "name": "Administrador", "user_type": "admin"}
    
    # Verificar se é um professor
    professor = db.query(Professor).filter(Professor.email_professor == username).first()
    if professor and professor.ativo:
        # Temporariamente, para desenvolvimento, permitir senhas em texto claro
        if professor.senha_professor == password:
            return {
                "id": professor.id, 
                "username": professor.email_professor, 
                "name": professor.nome_professor, 
                "user_type": "professor"
            }
    
    return None


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Cria um token JWT com os dados fornecidos.
    
    Args:
        data: Dados a serem codificados no token
        expires_delta: Tempo de expiração do token
        
    Returns:
        Token JWT
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.timestamp()})
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtém o usuário atual com base no token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        user_type: str = payload.get("user_type", "")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, user_type=user_type)
    except JWTError:
        raise credentials_exception
    
    # Identificar o tipo de usuário e buscar os dados adequados
    if token_data.user_type == "admin":
        user = {"id": 0, "username": "admin", "name": "Administrador", "user_type": "admin"}
    elif token_data.user_type == "professor":
        # Buscar dados do professor
        user = db.query(Professor).filter(Professor.email_professor == token_data.username).first()
        if user is None or not user.ativo:
            raise credentials_exception
        user = {
            "id": user.id, 
            "username": user.email_professor, 
            "name": user.nome_professor, 
            "user_type": "professor"
        }
    else:
        raise credentials_exception
        
    return user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    Endpoint para obter um token de acesso.
    
    Args:
        form_data: Formulário com credenciais
        
    Returns:
        Token JWT
    """
    # Implementação simplificada: apenas verifica se é o administrador
    if form_data.username == settings.ADMIN_USERNAME and form_data.password == settings.ADMIN_PASSWORD:
        # É o administrador
        token_data = {
            "sub": form_data.username,
            "user_type": "admin"
        }
        
        token = create_access_token(data=token_data)
        
        return {
            "access_token": token,
            "token_type": "bearer"
        }
    else:
        # Verificar se é um professor (simplificado para exemplo)
        # Na implementação real, você deve verificar no banco de dados
        
        # Se não for nem admin nem professor, falha na autenticação
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        ) 