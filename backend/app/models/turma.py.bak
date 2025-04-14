from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.db.session import Base


class Turma(Base):
    """
    Modelo de dados para Turma
    """
    __tablename__ = "turma"

    id = Column(Integer, primary_key=True, index=True)
    id_turma = Column(String(10), unique=True, index=True, nullable=False)
    serie = Column(String(50), nullable=False)
    turno = Column(String(10), nullable=False)
    tipo_turma = Column(String(50))
    coordenador = Column(String(100))
    
    # Relacionamentos
    alunos = relationship("Aluno", back_populates="turma", cascade="all, delete-orphan")
    disciplinas = relationship("TurmaDisciplina", back_populates="turma")
    professores = relationship("ProfessorDisciplinaTurma", back_populates="turma")
    
    def __repr__(self):
        return f"<Turma {self.id_turma} - {self.serie}>" 