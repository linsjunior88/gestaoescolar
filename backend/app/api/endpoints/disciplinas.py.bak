from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.disciplina import Disciplina
from app.schemas.disciplina import (
    DisciplinaCreate, 
    DisciplinaUpdate, 
    DisciplinaResponse, 
    DisciplinaWithRelationships
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=List[DisciplinaResponse])
def read_disciplinas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    id_disciplina: Optional[str] = Query(None, description="Filtrar por ID da disciplina"),
    nome: Optional[str] = Query(None, description="Filtrar por nome da disciplina"),
) -> Any:
    """
    Recupera todas as disciplinas.
    """
    try:
        query = db.query(Disciplina)
        
        if id_disciplina:
            query = query.filter(Disciplina.id_disciplina == id_disciplina)
        if nome:
            query = query.filter(Disciplina.nome_disciplina.ilike(f"%{nome}%"))
        
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        # Retorna um array vazio em caso de erro
        print(f"Erro ao consultar disciplinas: {e}")
        return []


@router.get("/{disciplina_id}", response_model=DisciplinaResponse)
def read_disciplina(
    disciplina_id: str = Path(..., description="ID interno da disciplina (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera uma disciplina específica pelo ID interno.
    Se for um ID numérico, pesquisa pelo campo 'id', caso contrário, pesquisa pelo 'id_disciplina'.
    """
    try:
        disciplina = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_disciplina
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
        
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        return disciplina
    except HTTPException:
        raise
    except Exception as e:
        # Tratar outros erros
        print(f"Erro ao consultar disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar disciplina: {str(e)}"
        )


@router.post("/", response_model=DisciplinaResponse)
def create_disciplina(
    *,
    disciplina_in: DisciplinaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Cria uma nova disciplina.
    """
    try:
        # Verificar se já existe uma disciplina com o mesmo ID
        if db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_in.id_disciplina).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uma disciplina com este ID já existe"
            )
        
        disciplina = Disciplina(
            id_disciplina=disciplina_in.id_disciplina,
            nome_disciplina=disciplina_in.nome_disciplina,
            carga_horaria=disciplina_in.carga_horaria
        )
        db.add(disciplina)
        db.commit()
        db.refresh(disciplina)
        return disciplina
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar disciplina: {str(e)}"
        )


@router.put("/{disciplina_id}", response_model=DisciplinaResponse)
def update_disciplina(
    *,
    disciplina_id: str = Path(..., description="ID interno da disciplina (numérico ou alfanumérico)"),
    disciplina_in: DisciplinaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Atualiza uma disciplina.
    """
    try:
        disciplina = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_disciplina
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        # Se o ID da disciplina está sendo alterado, verificar se já existe
        if disciplina_in.id_disciplina and disciplina_in.id_disciplina != disciplina.id_disciplina:
            if db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_in.id_disciplina).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uma disciplina com este ID já existe"
                )
        
        # Atualizar os campos
        for field in ["id_disciplina", "nome_disciplina", "carga_horaria"]:
            value = getattr(disciplina_in, field, None)
            if value is not None:
                setattr(disciplina, field, value)
        
        db.add(disciplina)
        db.commit()
        db.refresh(disciplina)
        return disciplina
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar disciplina: {str(e)}"
        )


@router.delete("/{disciplina_id}", response_model=DisciplinaResponse)
def delete_disciplina(
    *,
    disciplina_id: str = Path(..., description="ID interno da disciplina (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Exclui uma disciplina.
    """
    try:
        disciplina = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_disciplina
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        db.delete(disciplina)
        db.commit()
        return disciplina
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir disciplina: {str(e)}"
        )


@router.get("/id/{id_disciplina}", response_model=DisciplinaResponse)
def read_disciplina_by_id_disciplina(
    id_disciplina: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera uma disciplina específica pelo ID da disciplina (string).
    """
    try:
        disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == id_disciplina).first()
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        return disciplina
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao consultar disciplina por ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar disciplina: {str(e)}"
        ) 