from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.nota import Nota
from app.models.aluno import Aluno
from app.models.turma import Turma
from app.models.disciplina import Disciplina
from app.schemas.nota import (
    NotaCreate, 
    NotaUpdate, 
    NotaResponse, 
    NotaComDetalhes,
    Nota as NotaSchema,
    NotaWithRelationships
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=List[NotaSchema])
def read_notas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    aluno_id: Optional[int] = Query(None, description="Filtrar por ID do aluno"),
    disciplina_id: Optional[int] = Query(None, description="Filtrar por ID da disciplina"),
    id_aluno: Optional[str] = Query(None, description="Filtrar por ID do aluno (string)"),
    id_disciplina: Optional[str] = Query(None, description="Filtrar por ID da disciplina (string)"),
) -> Any:
    """
    Recupera todas as notas.
    """
    try:
        query = db.query(Nota)
        
        if aluno_id:
            query = query.filter(Nota.aluno_id == aluno_id)
        if disciplina_id:
            query = query.filter(Nota.disciplina_id == disciplina_id)
        if id_aluno:
            query = query.join(Nota.aluno).filter(Aluno.id_aluno == id_aluno)
        if id_disciplina:
            query = query.join(Nota.disciplina).filter(Disciplina.id_disciplina == id_disciplina)
        
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        # Retorna um array vazio em caso de erro
        print(f"Erro ao consultar notas: {e}")
        return []


@router.get("/{nota_id}", response_model=NotaWithRelationships)
def read_nota(
    nota_id: int = Path(..., description="ID da nota"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera uma nota específica pelo ID.
    """
    try:
        nota = db.query(Nota).filter(Nota.id == nota_id).first()
        if not nota:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada"
            )
        return nota
    except HTTPException:
        raise
    except Exception as e:
        # Tratar outros erros
        print(f"Erro ao consultar nota: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar nota: {str(e)}"
        )


@router.post("/", response_model=NotaSchema, status_code=status.HTTP_201_CREATED)
def create_nota(
    *,
    nota_in: NotaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Cria uma nova nota.
    """
    try:
        # Verificar se já existe uma nota para o mesmo aluno, disciplina e período
        nota_existente = db.query(Nota).filter(
            Nota.aluno_id == nota_in.aluno_id,
            Nota.disciplina_id == nota_in.disciplina_id,
            Nota.periodo == nota_in.periodo
        ).first()
        
        if nota_existente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe uma nota para este aluno, disciplina e período"
            )
        
        nota = Nota(
            aluno_id=nota_in.aluno_id,
            disciplina_id=nota_in.disciplina_id,
            periodo=nota_in.periodo,
            valor=nota_in.valor
        )
        db.add(nota)
        db.commit()
        db.refresh(nota)
        return nota
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar nota: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar nota: {str(e)}"
        )


@router.put("/{nota_id}", response_model=NotaSchema)
def update_nota(
    *,
    nota_id: int = Path(..., description="ID da nota"),
    nota_in: NotaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Atualiza uma nota.
    """
    try:
        nota = db.query(Nota).filter(Nota.id == nota_id).first()
        if not nota:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada"
            )
        
        # Se aluno, disciplina ou período está sendo alterado, verificar se já existe
        if (nota_in.aluno_id and nota_in.aluno_id != nota.aluno_id) or \
           (nota_in.disciplina_id and nota_in.disciplina_id != nota.disciplina_id) or \
           (nota_in.periodo and nota_in.periodo != nota.periodo):
            
            nota_existente = db.query(Nota).filter(
                Nota.aluno_id == (nota_in.aluno_id or nota.aluno_id),
                Nota.disciplina_id == (nota_in.disciplina_id or nota.disciplina_id),
                Nota.periodo == (nota_in.periodo or nota.periodo),
                Nota.id != nota_id
            ).first()
            
            if nota_existente:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe uma nota para este aluno, disciplina e período"
                )
        
        # Atualizar os campos
        for field in ["aluno_id", "disciplina_id", "periodo", "valor"]:
            value = getattr(nota_in, field, None)
            if value is not None:
                setattr(nota, field, value)
        
        db.add(nota)
        db.commit()
        db.refresh(nota)
        return nota
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar nota: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar nota: {str(e)}"
        )


@router.delete("/{nota_id}", response_model=NotaResponse)
def delete_nota(
    *,
    nota_id: int = Path(..., description="ID da nota"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Exclui uma nota.
    """
    try:
        nota = db.query(Nota).filter(Nota.id == nota_id).first()
        if not nota:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nota não encontrada"
            )
        
        db.delete(nota)
        db.commit()
        return nota
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir nota: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir nota: {str(e)}"
        )


@router.get("/aluno/{aluno_id}", response_model=List[NotaResponse])
def read_notas_by_aluno(
    aluno_id: int = Path(..., description="ID do aluno"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera todas as notas de um aluno específico.
    """
    try:
        notas = db.query(Nota).filter(Nota.aluno_id == aluno_id).all()
        return notas
    except Exception as e:
        print(f"Erro ao consultar notas do aluno: {e}")
        return []


@router.get("/disciplina/{disciplina_id}", response_model=List[NotaResponse])
def read_notas_by_disciplina(
    disciplina_id: int = Path(..., description="ID da disciplina"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera todas as notas de uma disciplina específica.
    """
    try:
        notas = db.query(Nota).filter(Nota.disciplina_id == disciplina_id).all()
        return notas
    except Exception as e:
        print(f"Erro ao consultar notas da disciplina: {e}")
        return []


@router.get("/aluno/{aluno_id}/disciplina/{disciplina_id}", response_model=List[NotaResponse])
def read_notas_by_aluno_and_disciplina(
    aluno_id: int = Path(..., description="ID do aluno"),
    disciplina_id: int = Path(..., description="ID da disciplina"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera todas as notas de um aluno em uma disciplina específica.
    """
    try:
        notas = db.query(Nota).filter(
            Nota.aluno_id == aluno_id,
            Nota.disciplina_id == disciplina_id
        ).all()
        return notas
    except Exception as e:
        print(f"Erro ao consultar notas do aluno na disciplina: {e}")
        return [] 