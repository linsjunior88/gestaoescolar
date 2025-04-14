from sqlalchemy import Column, Integer, Float, ForeignKey, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class Nota(Base):
    """
    Modelo de dados para Nota
    """
    __tablename__ = "nota"

    id = Column(Integer, primary_key=True, index=True)
    ano = Column(Integer, nullable=False)
    bimestre = Column(Integer, nullable=False)
    nota_mensal = Column(Float, nullable=True)
    nota_bimestral = Column(Float, nullable=True)
    recuperacao = Column(Float, nullable=True)
    media = Column(Float, nullable=True)
    
    # Chaves estrangeiras
    id_aluno = Column(String(10), ForeignKey("aluno.id_aluno"), nullable=False)
    id_disciplina = Column(String(10), ForeignKey("disciplina.id_disciplina"), nullable=False)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)
    
    # Relacionamentos
    aluno = relationship("Aluno", back_populates="notas")
    disciplina = relationship("Disciplina", back_populates="notas")
    turma = relationship("Turma")
    
    def __repr__(self):
        return f"<Nota {self.id} - Aluno: {self.id_aluno}, Disciplina: {self.id_disciplina}, Bimestre: {self.bimestre}/{self.ano}>" 