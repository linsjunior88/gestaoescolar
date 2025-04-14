from sqlalchemy import Column, String, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.db.session import Base


class Disciplina(Base):
    """
    Modelo de dados para Disciplina
    """
    __tablename__ = "disciplina"  # Alterado para corresponder ao nome da tabela no banco de dados

    id = Column(Integer, primary_key=True, index=True)
    id_disciplina = Column(String(10), unique=True, index=True, nullable=False)
    nome_disciplina = Column(String(100), nullable=False)
    carga_horaria = Column(Integer, nullable=True)
    
    # Relacionamentos
    turmas = relationship("TurmaDisciplina", back_populates="disciplina")
    notas = relationship("Nota", back_populates="disciplina", cascade="all, delete-orphan")
    professores = relationship("ProfessorDisciplinaTurma", back_populates="disciplina")
    
    def __repr__(self):
        return f"<Disciplina {self.id_disciplina} - {self.nome_disciplina}>"


class TurmaDisciplina(Base):
    """
    Modelo de dados para relacionamento Turma-Disciplina
    """
    __tablename__ = "turma_disciplina"

    id = Column(Integer, primary_key=True, index=True)
    id_disciplina = Column(String(10), ForeignKey("disciplina.id_disciplina"), nullable=False)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)
    
    # Relacionamentos
    disciplina = relationship("Disciplina", back_populates="turmas")
    turma = relationship("Turma", back_populates="disciplinas")
    
    def __repr__(self):
        return f"<TurmaDisciplina {self.id_disciplina} - {self.id_turma}>" 