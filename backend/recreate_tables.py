"""
Script para recriar as tabelas do banco de dados do zero.
"""
import sys
import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, ForeignKey, Float, Date, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine.url import URL

# Adicionar diretório pai ao path para importar módulos corretamente
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

Base = declarative_base()

# Classe para representar a tabela Turma
class Turma(Base):
    __tablename__ = "turma"
    
    id = Column(Integer, primary_key=True)
    id_turma = Column(String(10), unique=True, index=True, nullable=False)
    serie = Column(String(50), nullable=False)
    turno = Column(String(10), nullable=False)
    tipo_turma = Column(String(50))
    coordenador = Column(String(100))

# Classe para representar a tabela Disciplina
class Disciplina(Base):
    __tablename__ = "disciplina"
    
    id = Column(Integer, primary_key=True)
    id_disciplina = Column(String(10), unique=True, index=True, nullable=False)
    nome_disciplina = Column(String(100), nullable=False)
    carga_horaria = Column(Integer)

# Classe para representar a tabela Professor
class Professor(Base):
    __tablename__ = "professor"
    
    id = Column(Integer, primary_key=True)
    id_professor = Column(String(20), unique=True, index=True, nullable=False)
    nome_professor = Column(String(100), nullable=False)
    email_professor = Column(String(100))
    ativo = Column(Boolean, default=True)

# Classe para representar a tabela Aluno
class Aluno(Base):
    __tablename__ = "aluno"
    
    id = Column(Integer, primary_key=True)
    id_aluno = Column(String(20), unique=True, index=True, nullable=False)
    nome_aluno = Column(String(100), nullable=False)
    sexo = Column(String(1))
    data_nasc = Column(Date)
    mae = Column(String(100))
    id_turma = Column(String(10), ForeignKey("turma.id_turma"))
    endereco = Column(String(200))
    telefone = Column(String(20))
    email = Column(String(100))

# Classe para representar a tabela TurmaDisciplina
class TurmaDisciplina(Base):
    __tablename__ = "turma_disciplina"
    
    id = Column(Integer, primary_key=True)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)
    id_disciplina = Column(String(10), ForeignKey("disciplina.id_disciplina"), nullable=False)

# Classe para representar a tabela ProfessorDisciplinaTurma
class ProfessorDisciplinaTurma(Base):
    __tablename__ = "professor_disciplina_turma"
    
    id = Column(Integer, primary_key=True)
    id_professor = Column(String(20), ForeignKey("professor.id_professor"), nullable=False)
    id_disciplina = Column(String(10), ForeignKey("disciplina.id_disciplina"), nullable=False)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)

# Classe para representar a tabela Nota
class Nota(Base):
    __tablename__ = "nota"
    
    id = Column(Integer, primary_key=True)
    id_aluno = Column(String(20), ForeignKey("aluno.id_aluno"), nullable=False)
    id_disciplina = Column(String(10), ForeignKey("disciplina.id_disciplina"), nullable=False)
    id_turma = Column(String(10), ForeignKey("turma.id_turma"), nullable=False)
    ano = Column(Integer, nullable=False)
    bimestre = Column(Integer, nullable=False)
    nota_mensal = Column(Float)
    nota_bimestral = Column(Float)
    recuperacao = Column(Float)
    media = Column(Float)

def recreate_database():
    """
    Recria as tabelas do banco de dados.
    
    Atenção: Esta função irá apagar todas as tabelas existentes!
    """
    # Dados de conexão sem especificar encoding
    db_url = URL.create(
        drivername="postgresql",
        username="postgres",
        password="4chrOn0s",
        host="localhost",
        port=5432,
        database="gestao_escolar",
    )
    
    # Tenta estabelecer conexão usando psycopg2 diretamente para verificar o banco
    try:
        import psycopg2
        import psycopg2.extensions
        psycopg2.extensions.register_type(psycopg2.extensions.UNICODE)
        psycopg2.extensions.register_type(psycopg2.extensions.UNICODEARRAY)
        
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s",
            host="localhost",
            port="5432"
        )
        conn.close()
        print("Teste de conexão básica com psycopg2 bem-sucedido")
    except Exception as e:
        print(f"Erro no teste de conexão com psycopg2: {e}")
        return

    try:
        print("Criando engine SQLAlchemy...")
        engine = create_engine(db_url)
        print("Engine criada. Verificando conexão...")
        
        # Testa a conexão
        conn = engine.connect()
        conn.close()
        print("Conexão SQLAlchemy bem-sucedida.")
        
        # Confirmação do usuário antes de destruir dados existentes
        print("\nAVISO: Esta operação irá apagar todas as tabelas e dados existentes.")
        confirm = input("Digite 'SIM' para continuar: ")
        
        if confirm.upper() != "SIM":
            print("Operação cancelada pelo usuário.")
            return
        
        print("\nApagando todas as tabelas existentes...")
        Base.metadata.drop_all(engine)
        print("Tabelas apagadas.")
        
        print("\nCriando novas tabelas...")
        Base.metadata.create_all(engine)
        print("Tabelas criadas com sucesso.")
        
        print("\nEstrutura atual do banco de dados:")
        metadata = MetaData()
        metadata.reflect(bind=engine)
        for table_name in metadata.tables:
            print(f"- {table_name}")
        
    except Exception as e:
        print(f"Erro ao recriar o banco de dados: {e}")

if __name__ == "__main__":
    recreate_database() 