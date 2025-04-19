from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Path, status, Body
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.disciplina import Disciplina, TurmaDisciplina
from app.schemas.disciplina import (
    DisciplinaCreate, 
    DisciplinaUpdate, 
    DisciplinaResponse, 
    DisciplinaWithRelationships,
    TurmaDisciplinaCreate,
    TurmaDisciplina as TurmaDisciplinaSchema
)
from app.api.deps import get_current_user, get_current_admin
from app.models.turma import Turma

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


@router.post("/{disciplina_id}/turmas/{turma_id}", response_model=TurmaDisciplinaSchema)
def create_disciplina_turma(
    *,
    disciplina_id: str = Path(..., description="ID da disciplina"),
    turma_id: str = Path(..., description="ID da turma"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Vincula uma turma específica a uma disciplina.
    """
    print(f"DEBUG: Vinculando disciplina {disciplina_id} à turma {turma_id}")
    try:
        # Verificar se a disciplina existe
        disciplina = None
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        # Verificar se a turma existe
        turma = db.query(Turma).filter(Turma.id_turma == turma_id).first()
        if not turma:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Turma não encontrada"
            )
        
        # Verificar se o vínculo já existe
        vinculo_existente = db.query(TurmaDisciplina).filter(
            TurmaDisciplina.id_disciplina == disciplina.id_disciplina,
            TurmaDisciplina.id_turma == turma_id
        ).first()
        
        if vinculo_existente:
            return vinculo_existente
        
        # Criar o vínculo
        vinculo = TurmaDisciplina(
            id_disciplina=disciplina.id_disciplina,
            id_turma=turma_id
        )
        db.add(vinculo)
        db.commit()
        db.refresh(vinculo)
        
        return vinculo
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao vincular turma à disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao vincular turma à disciplina: {str(e)}"
        )


@router.delete("/{disciplina_id}/turmas/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina_turma(
    *,
    disciplina_id: str = Path(..., description="ID da disciplina"),
    turma_id: str = Path(..., description="ID da turma"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Remove o vínculo entre uma disciplina específica e uma turma específica.
    """
    print(f"DEBUG: Removendo vínculo entre disciplina {disciplina_id} e turma {turma_id}")
    try:
        # Verificar se a disciplina existe
        disciplina = None
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        # Remover o vínculo
        result = db.query(TurmaDisciplina).filter(
            TurmaDisciplina.id_disciplina == disciplina.id_disciplina,
            TurmaDisciplina.id_turma == turma_id
        ).delete(synchronize_session=False)
        
        if result == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vínculo não encontrado"
            )
        
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao remover vínculo de turma: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover vínculo de turma: {str(e)}"
        )


@router.post("/{disciplina_id}/turmas", response_model=List[TurmaDisciplinaSchema])
def create_disciplina_turmas(
    *,
    disciplina_id: str = Path(..., description="ID da disciplina"),
    turmas_ids: List[str] = Body(..., embed=True, description="Lista de IDs de turmas para vincular"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Vincula uma ou mais turmas a uma disciplina específica.
    Envie um JSON com o formato: {"turmas_ids": ["id1", "id2", ...]}
    """
    print(f"DEBUG: Endpoint POST disciplina-turmas acessado. Disciplina: {disciplina_id}, Turmas: {turmas_ids}")
    try:
        # Verificar se a disciplina existe
        disciplina = None
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        # Criar uma lista para armazenar os vínculos criados
        vinculos_criados = []
        
        # Para cada ID de turma, verificar se a turma existe e criar o vínculo
        for turma_id in turmas_ids:
            # Verificar se a turma existe
            turma = db.query(Turma).filter(Turma.id_turma == turma_id).first()
            if not turma:
                print(f"DEBUG: Turma {turma_id} não encontrada, pulando")
                continue  # Se a turma não existe, pular
            
            # Verificar se o vínculo já existe
            vinculo_existente = db.query(TurmaDisciplina).filter(
                TurmaDisciplina.id_disciplina == disciplina.id_disciplina,
                TurmaDisciplina.id_turma == turma_id
            ).first()
            
            if not vinculo_existente:
                # Criar o vínculo
                vinculo = TurmaDisciplina(
                    id_disciplina=disciplina.id_disciplina,
                    id_turma=turma_id
                )
                db.add(vinculo)
                vinculos_criados.append(vinculo)
                print(f"DEBUG: Vínculo criado entre {disciplina.id_disciplina} e {turma_id}")
            else:
                print(f"DEBUG: Vínculo já existe entre {disciplina.id_disciplina} e {turma_id}")
        
        db.commit()
        # Atualizar os objetos para obter os IDs gerados
        for vinculo in vinculos_criados:
            db.refresh(vinculo)
        
        return vinculos_criados
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao vincular turmas à disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao vincular turmas à disciplina: {str(e)}"
        )


@router.delete("/{disciplina_id}/turmas", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina_turmas(
    *,
    disciplina_id: str = Path(..., description="ID da disciplina"),
    turma_id: Optional[str] = Query(None, description="ID da turma específica a ser desvinculada"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin)
) -> Any:
    """
    Remove vínculos entre uma disciplina e uma ou todas as turmas.
    Se turma_id for fornecido, remove apenas o vínculo com essa turma.
    Caso contrário, remove todos os vínculos da disciplina.
    """
    print(f"DEBUG: Removendo vínculos da disciplina {disciplina_id}, turma específica: {turma_id}")
    try:
        # Verificar se a disciplina existe
        disciplina = None
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        # Construir a query para remover vínculos
        query = db.query(TurmaDisciplina).filter(TurmaDisciplina.id_disciplina == disciplina.id_disciplina)
        
        # Se um ID de turma específico foi fornecido, filtrar apenas por esse ID
        if turma_id:
            query = query.filter(TurmaDisciplina.id_turma == turma_id)
        
        # Remover os vínculos
        deleted_count = query.delete(synchronize_session=False)
        print(f"DEBUG: {deleted_count} vínculos removidos")
        db.commit()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Erro ao remover vínculos de turmas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover vínculos de turmas: {str(e)}"
        )


@router.get("/{disciplina_id}/turmas", response_model=List[dict])
def read_disciplina_turmas(
    disciplina_id: str = Path(..., description="ID da disciplina"),
    db: Session = Depends(get_db),
) -> Any:
    """
    Recupera todas as turmas vinculadas a uma disciplina específica.
    """
    print(f"DEBUG: Listando turmas da disciplina {disciplina_id}")
    try:
        # Verificar se a disciplina existe
        disciplina = None
        if disciplina_id.isdigit():
            disciplina = db.query(Disciplina).filter(Disciplina.id == int(disciplina_id)).first()
        
        if not disciplina:
            disciplina = db.query(Disciplina).filter(Disciplina.id_disciplina == disciplina_id).first()
            
        if not disciplina:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Disciplina não encontrada"
            )
        
        # Consultar as turmas vinculadas à disciplina
        turmas_vinculadas = (
            db.query(Turma)
            .join(TurmaDisciplina, Turma.id_turma == TurmaDisciplina.id_turma)
            .filter(TurmaDisciplina.id_disciplina == disciplina.id_disciplina)
            .all()
        )
        
        # Converter para formato de resposta
        result = [{"id_turma": turma.id_turma, "serie": turma.serie} for turma in turmas_vinculadas]
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao listar turmas da disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar turmas da disciplina: {str(e)}"
        ) 