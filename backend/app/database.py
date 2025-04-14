import logging
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.exceptions import DatabaseConnectionError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # Create SQLAlchemy engine
    engine = create_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        pool_pre_ping=True,
        echo=False
    )
    
    # Create SessionLocal class
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Base class for models
    Base = declarative_base()
    
    logger.info("Database connection established successfully")
    
except SQLAlchemyError as e:
    logger.error(f"Database connection error: {e}")
    raise DatabaseConnectionError(detail=str(e))


def get_db() -> Generator:
    """
    Dependency for FastAPI that provides a SQLAlchemy session for each request.
    Automatically closes the session at the end of the request.
    
    Yields:
        Session: SQLAlchemy Session
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database operation error: {e}")
        db.rollback()
        raise DatabaseConnectionError(detail=str(e))
    finally:
        db.close()


def init_db() -> None:
    """Initialize the database and create all tables."""
    try:
        # Import all models here to ensure they are in the metadata
        from app.models.all_models import Base
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except SQLAlchemyError as e:
        logger.error(f"Failed to create database tables: {e}")
        raise DatabaseConnectionError(detail=str(e)) 