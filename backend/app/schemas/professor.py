from typing import Optional, List
from pydantic import BaseModel, EmailStr


# Propriedades compartilhadas
class ProfessorBase(BaseModel):
    id_professor: str
    nome_professor: str
    email_professor: Optional[str] = None
    especialidade: Optional[str] = None


class ProfessorCreate(ProfessorBase):
    """Schema para criação de professor"""
    senha_professor: str
    ativo: Optional[bool] = True  # Sempre ativo por padrão ao criar


class ProfessorUpdate(BaseModel):
    """Schema para atualização de professor"""
    id_professor: Optional[str] = None
    nome_professor: Optional[str] = None
    email_professor: Optional[str] = None
    senha_professor: Optional[str] = None
    especialidade: Optional[str] = None
    ativo: Optional[bool] = None


class ProfessorInDB(ProfessorBase):
    """Schema para professor como armazenado no banco de dados"""
    id: int
    senha_professor: Optional[str] = None
    ativo: bool = True  # Campo obrigatório, padrão True

    model_config = {
        "from_attributes": True
    }


class Professor(ProfessorInDB):
    """Schema para resposta de professor"""
    pass


class ProfessorResponse(ProfessorInDB):
    """Schema para resposta de professor (compatibilidade com os endpoints)"""
    pass


# Schemas para ProfessorDisciplinaTurma
class ProfessorDisciplinaTurmaBase(BaseModel):
    id_professor: str
    id_disciplina: str
    id_turma: str


class ProfessorDisciplinaTurmaCreate(ProfessorDisciplinaTurmaBase):
    """Schema para criação de relação professor-disciplina-turma"""
    pass


class ProfessorDisciplinaTurmaInDB(ProfessorDisciplinaTurmaBase):
    """Schema para relação professor-disciplina-turma como armazenada no banco de dados"""
    id: int

    model_config = {
        "from_attributes": True
    }


class ProfessorDisciplinaTurma(ProfessorDisciplinaTurmaInDB):
    """Schema para resposta de relação professor-disciplina-turma"""
    pass


class ProfessorWithRelationships(ProfessorInDB):
    """Schema para professor com disciplinas e turmas"""
    disciplinas_turmas: List[ProfessorDisciplinaTurma] = []

    model_config = {
        "from_attributes": True
    }

# Evitar referência circular
from app.schemas.disciplina import Disciplina
ProfessorWithRelationships.update_forward_refs() 