from typing import Optional, List
from pydantic import BaseModel


# Schemas para TurmaDisciplina
class TurmaDisciplinaBase(BaseModel):
    id_disciplina: str
    id_turma: str


class TurmaDisciplinaCreate(TurmaDisciplinaBase):
    """Schema para criação de relação turma-disciplina"""
    pass


class TurmaDisciplinaInDB(TurmaDisciplinaBase):
    """Schema para relação turma-disciplina como armazenada no banco de dados"""
    id: int

    model_config = {
"from_attributes": True
}
class TurmaDisciplina(TurmaDisciplinaInDB):
    """Schema para resposta de relação turma-disciplina"""
    pass


# Propriedades compartilhadas para Disciplina
class DisciplinaBase(BaseModel):
    id_disciplina: str
    nome_disciplina: str
    carga_horaria: Optional[int] = None


class DisciplinaCreate(DisciplinaBase):
    """Schema para criação de disciplina"""
    pass


class DisciplinaUpdate(BaseModel):
    """Schema para atualização de disciplina"""
    id_disciplina: Optional[str] = None
    nome_disciplina: Optional[str] = None
    carga_horaria: Optional[int] = None


class DisciplinaInDB(DisciplinaBase):
    """Schema para disciplina como armazenada no banco de dados"""
    id: int

    model_config = {
"from_attributes": True
}
class Disciplina(DisciplinaInDB):
    """Schema para resposta de disciplina"""
    pass


class DisciplinaResponse(DisciplinaInDB):
    """Schema para resposta de disciplina (compatibilidade com os endpoints)"""
    pass


# Evitar erro circular - importar depois de definir as classes
from app.schemas.turma import Turma
from app.schemas.professor import Professor


class DisciplinaWithRelationships(DisciplinaInDB):
    """Schema para disciplina com turmas e professores"""
    turmas: List[Turma] = []
    professores: List[Professor] = []

    model_config = {
"from_attributes": True
}