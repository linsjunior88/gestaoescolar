from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.turma import Turma
from app.schemas.turma import TurmaCreate, TurmaUpdate, TurmaResponse
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/", response_model=List[TurmaResponse])
def read_turmas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    id_turma: Optional[str] = Query(None, description="Filtrar por ID da turma"),
    serie: Optional[str] = Query(None, description="Filtrar por série"),
    turno: Optional[str] = Query(None, description="Filtrar por turno"),
) -> Any:
    """
    Recupera todas as turmas.
    """
    try:
        query = db.query(Turma)
        
        # Aplicar filtros se fornecidos
        if id_turma:
            query = query.filter(Turma.id_turma == id_turma)
        if serie:
            query = query.filter(Turma.serie.ilike(f"%{serie}%"))
        if turno:
            query = query.filter(Turma.turno == turno)
        
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        # Retorna um array vazio em caso de erro
        print(f"Erro ao consultar turmas: {e}")
        return []


@router.get("/{turma_id}", response_model=TurmaResponse)
def read_turma(
    turma_id: str = Path(..., description="ID interno da turma (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera uma turma específica pelo ID interno.
    Se for um ID numérico, pesquisa pelo campo 'id', caso contrário, pesquisa pelo 'id_turma'.
    """
    try:
        turma = None
        # Verifica se o ID é numérico para buscar pelo id do banco
        if turma_id.isdigit():
            turma = db.query(Turma).filter(Turma.id == int(turma_id)).first()
        
        # Se não encontrou por id ou se não é numérico, tenta buscar por id_turma
        if not turma:
            turma = db.query(Turma).filter(Turma.id_turma == turma_id).first()
        
        if not turma:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Turma não encontrada"
            )
        return turma
    except HTTPException:
        raise
    except Exception as e:
        # Tratar outros erros
        print(f"Erro ao consultar turma: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar turma: {str(e)}"
        )


@router.post("/", response_model=TurmaResponse)
def create_turma(
    *,
    turma_in: TurmaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Cria uma nova turma.
    """
    # Verificar se já existe uma turma com o mesmo ID
    if db.query(Turma).filter(Turma.id_turma == turma_in.id_turma).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uma turma com este ID já existe"
        )
    
    turma = Turma(
        id_turma=turma_in.id_turma,
        serie=turma_in.serie,
        turno=turma_in.turno,
        tipo_turma=turma_in.tipo_turma,
        coordenador=turma_in.coordenador
    )
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


@router.put("/{turma_id}", response_model=TurmaResponse)
def update_turma(
    *,
    turma_id: str = Path(..., description="ID interno da turma (numérico ou alfanumérico)"),
    turma_in: TurmaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Atualiza uma turma.
    """
    turma = None
    # Verifica se o ID é numérico para buscar pelo id do banco
    if turma_id.isdigit():
        turma = db.query(Turma).filter(Turma.id == int(turma_id)).first()
    
    # Se não encontrou por id ou se não é numérico, tenta buscar por id_turma
    if not turma:
        turma = db.query(Turma).filter(Turma.id_turma == turma_id).first()
        
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    # Se o ID da turma está sendo alterado, verificar se já existe
    if turma_in.id_turma and turma_in.id_turma != turma.id_turma:
        if db.query(Turma).filter(Turma.id_turma == turma_in.id_turma).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uma turma com este ID já existe"
            )
    
    # Atualizar os campos
    for field in ["id_turma", "serie", "turno", "tipo_turma", "coordenador"]:
        value = getattr(turma_in, field, None)
        if value is not None:
            setattr(turma, field, value)
    
    db.add(turma)
    db.commit()
    db.refresh(turma)
    return turma


@router.delete("/{turma_id}", response_model=TurmaResponse)
def delete_turma(
    *,
    turma_id: str = Path(..., description="ID interno da turma (numérico ou alfanumérico)"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Exclui uma turma.
    """
    turma = None
    # Verifica se o ID é numérico para buscar pelo id do banco
    if turma_id.isdigit():
        turma = db.query(Turma).filter(Turma.id == int(turma_id)).first()
    
    # Se não encontrou por id ou se não é numérico, tenta buscar por id_turma
    if not turma:
        turma = db.query(Turma).filter(Turma.id_turma == turma_id).first()
        
    if not turma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Turma não encontrada"
        )
    
    # Verificar se há alunos ou disciplinas associados antes de excluir
    # Esta verificação pode ser expandida conforme necessário
    # ...
    
    db.delete(turma)
    db.commit()
    return turma


@router.get("/id/{id_turma}", response_model=TurmaResponse)
def read_turma_by_id_turma(
    id_turma: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera uma turma específica pelo ID da turma (string).
    """
    try:
        turma = db.query(Turma).filter(Turma.id_turma == id_turma).first()
        if not turma:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Turma não encontrada"
            )
        return turma
    except HTTPException:
        raise
    except Exception as e:
        # Tratar outros erros
        print(f"Erro ao consultar turma por ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar turma: {str(e)}"
        ) 