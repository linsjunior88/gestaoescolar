from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.professor import Professor
from app.schemas.professor import (
    ProfessorCreate, 
    ProfessorUpdate, 
    ProfessorResponse
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=List[ProfessorResponse])
def read_professores(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    id_professor: Optional[str] = Query(None, description="Filtrar por ID do professor"),
    nome: Optional[str] = Query(None, description="Filtrar por nome do professor"),
    email: Optional[str] = Query(None, description="Filtrar por email do professor"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo")
) -> Any:
    """
    Recupera todos os professores.
    """
    try:
        query = db.query(Professor)
        
        # Aplicar filtros se fornecidos
        if id_professor:
            query = query.filter(Professor.id_professor == id_professor)
        if nome:
            query = query.filter(Professor.nome_professor.ilike(f"%{nome}%"))
        if email:
            query = query.filter(Professor.email_professor == email)
        if ativo is not None:
            query = query.filter(Professor.ativo == ativo)
        
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        # Retorna um array vazio em caso de erro
        print(f"Erro ao consultar professores: {e}")
        return []


@router.get("/{professor_id}", response_model=ProfessorResponse)
def read_professor(
    professor_id: str = Path(..., description="ID interno do professor (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera um professor específico pelo ID interno.
    Se for um ID numérico, pesquisa pelo campo 'id', caso contrário, pesquisa pelo 'id_professor'.
    """
    try:
        professor = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if professor_id.isdigit():
            professor = db.query(Professor).filter(Professor.id == int(professor_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_professor
        if not professor:
            professor = db.query(Professor).filter(Professor.id_professor == professor_id).first()
        
        if not professor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor não encontrado"
            )
        return professor
    except HTTPException:
        raise
    except Exception as e:
        # Tratar outros erros
        print(f"Erro ao consultar professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar professor: {str(e)}"
        )


@router.post("/", response_model=ProfessorResponse)
def create_professor(
    *,
    professor_in: ProfessorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Cria um novo professor.
    """
    try:
        # Verificar se já existe um professor com o mesmo ID
        if db.query(Professor).filter(Professor.id_professor == professor_in.id_professor).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um professor com este ID já existe"
            )
        
        # Verificar se já existe um professor com o mesmo email
        if db.query(Professor).filter(Professor.email_professor == professor_in.email_professor).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um professor com este email já existe"
            )
        
        professor = Professor(
            id_professor=professor_in.id_professor,
            nome_professor=professor_in.nome_professor,
            email_professor=professor_in.email_professor,
            senha_professor=professor_in.senha_professor,
            especialidade=professor_in.especialidade,
            ativo=True
        )
        db.add(professor)
        db.commit()
        db.refresh(professor)
        return professor
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar professor: {str(e)}"
        )


@router.put("/{professor_id}", response_model=ProfessorResponse)
def update_professor(
    *,
    professor_id: str = Path(..., description="ID interno do professor (numérico ou alfanumérico)"),
    professor_in: ProfessorUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Atualiza um professor.
    """
    try:
        professor = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if professor_id.isdigit():
            professor = db.query(Professor).filter(Professor.id == int(professor_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_professor
        if not professor:
            professor = db.query(Professor).filter(Professor.id_professor == professor_id).first()
            
        if not professor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor não encontrado"
            )
        
        # Se o ID do professor está sendo alterado, verificar se já existe
        if professor_in.id_professor and professor_in.id_professor != professor.id_professor:
            if db.query(Professor).filter(Professor.id_professor == professor_in.id_professor).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Um professor com este ID já existe"
                )
        
        # Se o email está sendo alterado, verificar se já existe
        if professor_in.email_professor and professor_in.email_professor != professor.email_professor:
            if db.query(Professor).filter(Professor.email_professor == professor_in.email_professor).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Um professor com este email já existe"
                )
        
        # Atualizar os campos
        for field in ["id_professor", "nome_professor", "email_professor", "senha_professor", "especialidade", "ativo"]:
            value = getattr(professor_in, field, None)
            if value is not None:
                setattr(professor, field, value)
        
        db.add(professor)
        db.commit()
        db.refresh(professor)
        return professor
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar professor: {str(e)}"
        )


@router.delete("/{professor_id}", response_model=ProfessorResponse)
def delete_professor(
    *,
    professor_id: str = Path(..., description="ID interno do professor (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Exclui um professor.
    """
    try:
        professor = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if professor_id.isdigit():
            professor = db.query(Professor).filter(Professor.id == int(professor_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_professor
        if not professor:
            professor = db.query(Professor).filter(Professor.id_professor == professor_id).first()
            
        if not professor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor não encontrado"
            )
        
        db.delete(professor)
        db.commit()
        return professor
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao excluir professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir professor: {str(e)}"
        )


@router.get("/id/{id_professor}", response_model=ProfessorResponse)
def read_professor_by_id_professor(
    id_professor: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera um professor específico pelo ID do professor (string).
    """
    try:
        professor = db.query(Professor).filter(Professor.id_professor == id_professor).first()
        if not professor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor não encontrado"
            )
        return professor
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao consultar professor por ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar professor: {str(e)}"
        )


@router.put("/{professor_id}/ativo", response_model=ProfessorResponse)
def toggle_professor_ativo(
    *,
    professor_id: str = Path(..., description="ID interno do professor (numérico ou alfanumérico)"),
    ativo: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Ativa ou desativa um professor.
    """
    try:
        professor = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if professor_id.isdigit():
            professor = db.query(Professor).filter(Professor.id == int(professor_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_professor
        if not professor:
            professor = db.query(Professor).filter(Professor.id_professor == professor_id).first()
            
        if not professor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor não encontrado"
            )
        
        # Atualizar apenas o campo ativo
        professor.ativo = ativo
        
        db.add(professor)
        db.commit()
        db.refresh(professor)
        
        status_text = "ativado" if ativo else "desativado"
        print(f"Professor {professor.id_professor} {status_text} com sucesso")
        
        return professor
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao alterar status do professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao alterar status do professor: {str(e)}"
        )


@router.delete("/{professor_id}/desativar", response_model=ProfessorResponse)
def desativar_professor(
    *,
    professor_id: str = Path(..., description="ID interno do professor (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Desativa um professor (exclusão lógica).
    """
    try:
        professor = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if professor_id.isdigit():
            professor = db.query(Professor).filter(Professor.id == int(professor_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_professor
        if not professor:
            professor = db.query(Professor).filter(Professor.id_professor == professor_id).first()
            
        if not professor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Professor não encontrado"
            )
        
        # Desativar o professor (exclusão lógica)
        professor.ativo = False
        
        db.add(professor)
        db.commit()
        db.refresh(professor)
        
        print(f"Professor {professor.id_professor} desativado com sucesso")
        
        return professor
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao desativar professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao desativar professor: {str(e)}"
        ) 