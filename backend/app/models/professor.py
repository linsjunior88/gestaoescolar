from sqlalchemy import Column, String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.session import Base


class Professor(Base):
    """
    Modelo de dados para Professor
    """
    __tablename__ = "professor"  # Alterado para corresponder ao nome da tabela no banco de dados

    id = Column(Integer, primary_key=True, index=True)
    id_professor = Column(String(10), unique=True, index=True, nullable=False)
    nome_professor = Column(String(100), nullable=False)
    email_professor = Column(String(100), nullable=True)
    senha_professor = Column(String(255), nullable=True)
    telefone_professor = Column(String(20), nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    
    # Relacionamentos
    disciplinas_turmas = relationship("ProfessorDisciplinaTurma", back_populates="professor")
    
    def __repr__(self):
        return f"<Professor {self.id_professor} - {self.nome_professor}>"


class ProfessorDisciplinaTurma(Base):
    """
    Modelo de dados para relacionamento Professor-Disciplina-Turma
    """
    __tablename__ = "professor_disciplina_turma"

    id = Column(Integer, primary_key=True, index=True)
    id_professor = Column(String(10), ForeignKey("professor.id_professor"), nullable=False)
    id_disciplina = Column(String(10), ForeignKey("disciplina.id_disciplina"), nullable=False)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)
    
    # Relacionamentos
    professor = relationship("Professor", back_populates="disciplinas_turmas")
    disciplina = relationship("Disciplina", back_populates="professores")
    turma = relationship("Turma", back_populates="professores")
    
    def __repr__(self):
        return f"<ProfessorDisciplinaTurma {self.id_professor} - {self.id_disciplina} - {self.id_turma}>" 