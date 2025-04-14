from typing import Any, List, Optional, Union
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.aluno import Aluno
from app.models.turma import Turma
from app.schemas.aluno import (
    AlunoCreate, 
    AlunoUpdate, 
    AlunoResponse, 
    AlunoWithRelationships
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=List[AlunoResponse])
def read_alunos(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    id_aluno: Optional[str] = Query(None, description="Filtrar por ID do aluno"),
    nome: Optional[str] = Query(None, description="Filtrar por nome do aluno"),
    turma_id: Optional[str] = Query(None, description="Filtrar por ID da turma"),
) -> Any:
    """
    Recupera todos os alunos.
    """
    try:
        query = db.query(Aluno)
        
        if id_aluno:
            query = query.filter(Aluno.id_aluno == id_aluno)
        if nome:
            query = query.filter(Aluno.nome.ilike(f"%{nome}%"))
        if turma_id:
            query = query.filter(Aluno.turma_id == turma_id)
        
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        # Retorna um array vazio em caso de erro
        print(f"Erro ao consultar alunos: {e}")
        return []


@router.get("/{aluno_id}", response_model=AlunoResponse)
def read_aluno(
    aluno_id: str = Path(..., description="ID interno do aluno (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera um aluno específico pelo ID interno.
    Se for um ID numérico, pesquisa pelo campo 'id', caso contrário, pesquisa pelo 'id_aluno'.
    """
    try:
        aluno = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if aluno_id.isdigit():
            aluno = db.query(Aluno).filter(Aluno.id == int(aluno_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_aluno
        if not aluno:
            aluno = db.query(Aluno).filter(Aluno.id_aluno == aluno_id).first()
        
        if not aluno:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado"
            )
        return aluno
    except HTTPException:
        raise
    except Exception as e:
        # Tratar outros erros
        print(f"Erro ao consultar aluno: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar aluno: {str(e)}"
        )


@router.post("/", response_model=AlunoResponse)
def create_aluno(
    *,
    aluno_in: AlunoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Cria um novo aluno.
    """
    try:
        # Verificar se já existe um aluno com o mesmo ID
        if db.query(Aluno).filter(Aluno.id_aluno == aluno_in.id_aluno).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um aluno com este ID já existe"
            )
        
        aluno = Aluno(
            id_aluno=aluno_in.id_aluno,
            nome=aluno_in.nome,
            email=aluno_in.email,
            telefone=aluno_in.telefone,
            turma_id=aluno_in.turma_id
        )
        db.add(aluno)
        db.commit()
        db.refresh(aluno)
        return aluno
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar aluno: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar aluno: {str(e)}"
        )


@router.put("/{aluno_id}", response_model=AlunoResponse)
def update_aluno(
    *,
    aluno_id: str = Path(..., description="ID interno do aluno (numérico ou alfanumérico)"),
    aluno_in: AlunoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Atualiza um aluno.
    """
    try:
        aluno = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if aluno_id.isdigit():
            aluno = db.query(Aluno).filter(Aluno.id == int(aluno_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_aluno
        if not aluno:
            aluno = db.query(Aluno).filter(Aluno.id_aluno == aluno_id).first()
            
        if not aluno:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado"
            )
        
        # Se o ID do aluno está sendo alterado, verificar se já existe
        if aluno_in.id_aluno and aluno_in.id_aluno != aluno.id_aluno:
            if db.query(Aluno).filter(Aluno.id_aluno == aluno_in.id_aluno).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Um aluno com este ID já existe"
                )
        
        # Atualizar os campos
        for field in ["id_aluno", "nome", "email", "telefone", "turma_id"]:
            value = getattr(aluno_in, field, None)
            if value is not None:
                setattr(aluno, field, value)
        
        db.add(aluno)
        db.commit()
        db.refresh(aluno)
        return aluno
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar aluno: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar aluno: {str(e)}"
        )


@router.delete("/{aluno_id}", response_model=AlunoResponse)
def delete_aluno(
    *,
    aluno_id: str = Path(..., description="ID interno do aluno (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Exclui um aluno.
    """
    try:
        aluno = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if aluno_id.isdigit():
            aluno = db.query(Aluno).filter(Aluno.id == int(aluno_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_aluno
        if not aluno:
            aluno = db.query(Aluno).filter(Aluno.id_aluno == aluno_id).first()
            
        if not aluno:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado"
            )
        
        db.delete(aluno)
        db.commit()
        return aluno
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir aluno: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir aluno: {str(e)}"
        )


@router.get("/id/{id_aluno}", response_model=AlunoResponse)
def read_aluno_by_id_aluno(
    id_aluno: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera um aluno específico pelo ID do aluno (string).
    """
    try:
        aluno = db.query(Aluno).filter(Aluno.id_aluno == id_aluno).first()
        if not aluno:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aluno não encontrado"
            )
        return aluno
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao consultar aluno por ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar aluno: {str(e)}"
        ) 