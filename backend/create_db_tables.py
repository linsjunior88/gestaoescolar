import os
import sys

# Adicionar o diretório raiz ao path para importações relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, Base
from app.models.all_models import __all__

# Importar explicitamente todos os modelos para garantir que sejam 
# registrados na Base antes de criar as tabelas
from app.models.turma import Turma
from app.models.disciplina import Disciplina, TurmaDisciplina
from app.models.professor import Professor, ProfessorDisciplinaTurma
from app.models.aluno import Aluno
from app.models.nota import Nota

def create_tables():
    """
    Cria todas as tabelas no banco de dados com base nos modelos SQLAlchemy
    """
    try:
        print("Criando tabelas no banco de dados...")
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso!")

        # Verificar quais tabelas foram criadas
        inspector = engine.dialect.inspector(engine)
        tables = inspector.get_table_names()
        print(f"Tabelas existentes no banco de dados: {tables}")

        return True
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        return False

if __name__ == "__main__":
    create_tables() 