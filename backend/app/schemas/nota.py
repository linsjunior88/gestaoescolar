from typing import Optional, Union, List
from pydantic import BaseModel, Field


# Propriedades compartilhadas
class NotaBase(BaseModel):
    id_aluno: str
    id_disciplina: str
    id_turma: str
    ano: int
    bimestre: int = Field(..., ge=1, le=4)
    nota_mensal: Optional[float] = None
    nota_bimestral: Optional[float] = None
    recuperacao: Optional[float] = None
    media: Optional[float] = None


class NotaCreate(NotaBase):
    """Schema para criação de nota"""
    pass


class NotaUpdate(BaseModel):
    """Schema para atualização de nota"""
    id_aluno: Optional[str] = None
    id_disciplina: Optional[str] = None
    id_turma: Optional[str] = None
    ano: Optional[int] = None
    bimestre: Optional[int] = Field(None, ge=1, le=4)
    nota_mensal: Optional[float] = None
    nota_bimestral: Optional[float] = None
    recuperacao: Optional[float] = None
    media: Optional[float] = None


class NotaInDB(NotaBase):
    """Schema para nota como armazenada no banco de dados"""
    id: int

    model_config = {
"from_attributes": True
}
class Nota(NotaInDB):
    """Schema para resposta de nota"""
    nome_aluno: Optional[str] = None
    nome_disciplina: Optional[str] = None
    nome_turma: Optional[str] = None


class NotaResponse(NotaInDB):
    """Schema para resposta de nota (compatibilidade com os endpoints)"""
    pass


class NotaComDetalhes(NotaInDB):
    """Schema para nota com detalhes adicionais"""
    nome_aluno: str
    nome_disciplina: str
    nome_turma: str


class NotaWithRelationships(NotaInDB):
    """Schema para nota com relacionamentos"""
    # Removendo referências diretas para evitar circularidade
    pass

    model_config = {
"from_attributes": True
}
# Evitar referência circular
from app.schemas.aluno import AlunoBase
from app.schemas.disciplina import DisciplinaBase
NotaWithRelationships.update_forward_refs() 