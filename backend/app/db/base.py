from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Corrigindo as importações para funcionar quando executado de diferentes diretórios
try:
    # Quando executado como módulo (ex: python -m backend.app.main)
    from backend.app.db.session import Base
except ImportError:
    # Quando executado diretamente (ex: python app/main.py)
    from app.db.session import Base

# Define tipos genéricos para os modelos SQLAlchemy e schemas Pydantic
ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Classe base de CRUD com métodos padrão para Create, Read, Update, Delete
    """

    def __init__(self, model: Type[ModelType]):
        """
        Inicializa a classe CRUD com o modelo SQLAlchemy.
        
        Args:
            model: Um modelo SQLAlchemy
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Obtém um registro pelo ID.
        
        Args:
            db: Sessão do banco de dados
            id: ID do registro a ser recuperado
            
        Returns:
            O objeto do modelo ou None se não encontrado
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Obtém múltiplos registros com paginação.
        
        Args:
            db: Sessão do banco de dados
            skip: Número de registros para pular
            limit: Número máximo de registros para retornar
            
        Returns:
            Lista de objetos do modelo
        """
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Cria um novo registro.
        
        Args:
            db: Sessão do banco de dados
            obj_in: Schema Pydantic com os dados para criar
            
        Returns:
            O objeto do modelo criado
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)  # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Atualiza um registro existente.
        
        Args:
            db: Sessão do banco de dados
            db_obj: Objeto do modelo a ser atualizado
            obj_in: Schema Pydantic ou dicionário com os dados para atualizar
            
        Returns:
            O objeto do modelo atualizado
        """
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: Any) -> ModelType:
        """
        Remove um registro.
        
        Args:
            db: Sessão do banco de dados
            id: ID do registro a ser removido
            
        Returns:
            O objeto do modelo removido
        """
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj 