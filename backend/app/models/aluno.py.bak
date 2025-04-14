from sqlalchemy import Column, String, Integer, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Aluno(Base):
    """
    Modelo de dados para Aluno
    """
    __tablename__ = "aluno"

    id = Column(Integer, primary_key=True, index=True)
    id_aluno = Column(String(20), unique=True, index=True, nullable=False)
    nome_aluno = Column(String(100), nullable=False)
    sexo = Column(String(10), nullable=False)
    data_nasc = Column(Date, nullable=True)
    mae = Column(String(100), nullable=True)
    
    # Chave estrangeira para Turma (agora usando id_turma como string)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)
    
    # Relacionamentos
    turma = relationship("Turma", back_populates="alunos")
    notas = relationship("Nota", back_populates="aluno", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Aluno {self.id_aluno} - {self.nome_aluno}>" 