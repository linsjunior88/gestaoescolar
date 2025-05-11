"""
Script para criar a tabela professor_disciplina_turma no PostgreSQL.
Esta tabela armazena os vínculos entre professores, disciplinas e turmas.
"""
import psycopg2
import os
import sys
import logging

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Verificar se estamos em ambiente de produção
IS_PRODUCTION = os.environ.get('PRODUCTION', 'False') == 'True'

# Configuração de conexão com o banco de dados
if IS_PRODUCTION:
    # Para produção no Render
    DB_PARAMS = {
        "dbname": os.environ.get("DB_NAME", "gestao_escolar"),
        "user": os.environ.get("DB_USER", "postgres"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "host": os.environ.get("DB_HOST", "localhost"),
        "port": os.environ.get("DB_PORT", "5432"),
        "sslmode": "require"
    }
else:
    # Para desenvolvimento local
    DB_PARAMS = {
        "dbname": "gestao_escolar",
        "user": "postgres",
        "password": "4chrOn0s",
        "host": "localhost",
        "port": "5432"
    }

def create_professor_disciplina_turma_table():
    """
    Cria a tabela professor_disciplina_turma no banco de dados.
    Esta tabela armazena os vínculos entre professores, disciplinas e turmas.
    """
    connection = None
    try:
        # Conectar ao banco de dados
        logger.info("Conectando ao banco de dados PostgreSQL...")
        connection = psycopg2.connect(**DB_PARAMS)
        connection.autocommit = True
        cursor = connection.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("SELECT to_regclass('public.professor_disciplina_turma');")
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            logger.info("A tabela professor_disciplina_turma já existe.")
        else:
            # Criar a tabela professor_disciplina_turma
            logger.info("Criando tabela professor_disciplina_turma...")
            cursor.execute("""
            CREATE TABLE professor_disciplina_turma (
                id SERIAL PRIMARY KEY,
                id_professor VARCHAR(20) NOT NULL,
                id_disciplina VARCHAR(20) NOT NULL,
                id_turma VARCHAR(20) NOT NULL,
                CONSTRAINT unique_vinculo UNIQUE (id_professor, id_disciplina, id_turma)
            );
            """)
            
            # Adicionar comentário à tabela
            cursor.execute("""
            COMMENT ON TABLE professor_disciplina_turma IS 'Tabela que armazena os vínculos entre professores, disciplinas e turmas';
            """)
            
            logger.info("Tabela professor_disciplina_turma criada com sucesso!")
        
        # Verificar índices
        cursor.execute("""
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'professor_disciplina_turma' AND indexname = 'idx_pdt_professor';
        """)
        if not cursor.fetchone():
            logger.info("Criando índices para melhorar a performance...")
            
            # Criar índices para melhorar a performance das consultas
            cursor.execute("""
            CREATE INDEX idx_pdt_professor ON professor_disciplina_turma (id_professor);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_pdt_disciplina ON professor_disciplina_turma (id_disciplina);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_pdt_turma ON professor_disciplina_turma (id_turma);
            """)
            
            logger.info("Índices criados com sucesso!")
        else:
            logger.info("Índices já existem na tabela.")
            
        logger.info("Processo de verificação e criação da tabela professor_disciplina_turma concluído com sucesso!")
        
    except Exception as e:
        logger.error(f"Erro ao criar tabela professor_disciplina_turma: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            cursor.close()
            connection.close()
            logger.info("Conexão com o banco de dados fechada.")

if __name__ == "__main__":
    create_professor_disciplina_turma_table() 