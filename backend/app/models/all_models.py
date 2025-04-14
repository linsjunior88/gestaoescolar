# Import all models here to make them available from a single import
from app.models.turma import Turma
from app.models.disciplina import Disciplina
from app.models.professor import Professor
from app.models.aluno import Aluno
from app.models.nota import Nota

# Update this list when adding new models
__all__ = ["Turma", "Disciplina", "Professor", "Aluno", "Nota"] 