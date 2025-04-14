from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

# Corrigindo as importações para funcionar quando executado de diferentes diretórios
try:
    # Quando executado como módulo (ex: python -m backend.app.main)
    from backend.app.core.config import settings
except ImportError:
    # Quando executado diretamente (ex: python app/main.py)
    from app.core.config import settings


def setup_cors(app: FastAPI) -> None:
    """
    Configura o middleware CORS para a aplicação.
    
    Permite solicitações de origens especificadas nas configurações e
    configura cabeçalhos e métodos HTTP permitidos.
    
    Args:
        app: Instância da aplicação FastAPI
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ) 