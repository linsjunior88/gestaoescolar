from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Corrigindo as importações para funcionar quando executado de diferentes diretórios
try:
    # Quando executado como módulo (ex: python -m backend.app.main)
    from backend.app.core.config import settings
except ImportError:
    # Quando executado diretamente (ex: python app/main.py)
    from app.core.config import settings

# Conexão simples, sem parâmetros específicos de codificação
engine_url = settings.DATABASE_URL
# Remover qualquer parâmetro que possa estar causando problemas
if '?' in engine_url:
    engine_url = engine_url.split('?')[0]

# Criar engine com configurações simplificadas
engine = create_engine(
    engine_url, 
    echo=False,
    pool_pre_ping=True,
    connect_args={}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    Dependency function to get a database session.
    
    Yields:
        SQLAlchemy session that will be automatically closed after use
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 