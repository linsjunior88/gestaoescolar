from typing import Optional, List, Union
from datetime import date
from pydantic import BaseModel


# Propriedades compartilhadas
class AlunoBase(BaseModel):
    id_aluno: str
    nome_aluno: str
    sexo: str
    data_nasc: Optional[Union[date, str]] = None
    mae: Optional[str] = None
    id_turma: str
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None


class AlunoCreate(AlunoBase):
    """Schema para criação de aluno"""
    pass


class AlunoUpdate(BaseModel):
    """Schema para atualização de aluno"""
    id_aluno: Optional[str] = None
    nome_aluno: Optional[str] = None
    sexo: Optional[str] = None
    data_nasc: Optional[Union[date, str]] = None
    mae: Optional[str] = None
    id_turma: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None


class AlunoInDB(AlunoBase):
    """Schema para aluno como armazenado no banco de dados"""
    id: int

    model_config = {
"from_attributes": True
}
class Aluno(AlunoInDB):
    """Schema para resposta de aluno"""
    pass


class AlunoResponse(AlunoInDB):
    """Schema para resposta de aluno (compatibilidade com os endpoints)"""
    pass


class AlunoWithRelationships(AlunoInDB):
    """Schema para aluno com notas"""
    notas: List = []

    model_config = {
"from_attributes": True
}