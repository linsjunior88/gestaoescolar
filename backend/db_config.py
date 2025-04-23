"""
Módulo de configuração do banco de dados PostgreSQL
Este arquivo contém funções para gerenciar a conexão com o banco de dados
e executar operações comuns de forma segura.
"""
import os
import psycopg2
import psycopg2.extras
import logging
from fastapi import HTTPException, status

# Configurar logging
logger = logging.getLogger(__name__)

# Verificar se estamos em ambiente de produção
IS_PRODUCTION = os.environ.get('PRODUCTION', 'False') == 'True'

# Configuração de conexão com o banco de dados
# Usar variáveis de ambiente em produção
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

def get_db_connection():
    """
    Obtém uma conexão com o banco de dados PostgreSQL
    
    Returns:
        Connection: Objeto de conexão com o banco de dados
        
    Raises:
        HTTPException: Se não for possível conectar ao banco de dados
    """
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
        return conn
    except Exception as e:
        logger.error(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro de conexão com o banco de dados: {str(e)}"
        )

def execute_query(query, params=None, fetch=True, fetch_one=False):
    """
    Executa uma consulta SQL no banco de dados
    
    Args:
        query (str): Consulta SQL a ser executada
        params (tuple, optional): Parâmetros para a consulta. Defaults to None.
        fetch (bool, optional): Se deve retornar resultados. Defaults to True.
        fetch_one (bool, optional): Se deve retornar apenas um resultado. Defaults to False.
        
    Returns:
        list or dict: Resultados da consulta, se fetch=True
        
    Raises:
        HTTPException: Se ocorrer um erro ao executar a consulta
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(query, params)
        
        result = None
        if fetch:
            if fetch_one:
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
        
        cursor.close()
        return result
    except Exception as e:
        logger.error(f"Erro ao executar consulta: {e}")
        logger.error(f"Query: {query}")
        logger.error(f"Params: {params}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao executar consulta: {str(e)}"
        )
    finally:
        if conn:
            conn.close()

def test_db_connection():
    """
    Testa a conexão com o banco de dados
    
    Returns:
        dict: Status da conexão
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return {
            "status": "ok",
            "message": "Conexão com o banco de dados estabelecida com sucesso",
            "version": version,
            "database": DB_PARAMS["dbname"],
            "host": DB_PARAMS["host"],
            "port": DB_PARAMS["port"],
            "user": DB_PARAMS["user"],
            "production": IS_PRODUCTION
        }
    except Exception as e:
        logger.error(f"Erro ao testar conexão com o banco de dados: {e}")
        return {
            "status": "error",
            "message": f"Erro ao conectar ao banco de dados: {str(e)}",
            "database": DB_PARAMS["dbname"],
            "host": DB_PARAMS["host"],
            "port": DB_PARAMS["port"],
            "user": DB_PARAMS["user"],
            "production": IS_PRODUCTION
        }

def create_tables():
    """
    Cria as tabelas necessárias no banco de dados se não existirem
    
    Returns:
        dict: Status da operação
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Criar tabela de turmas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS turma (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                ano INTEGER NOT NULL,
                turno VARCHAR(50) NOT NULL
            )
        """)
        
        # Criar tabela de disciplinas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disciplina (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                carga_horaria INTEGER NOT NULL
            )
        """)
        
        # Criar tabela de professores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS professor (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                formacao VARCHAR(100)
            )
        """)
        
        # Criar tabela de relação professor-disciplina
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS professor_disciplina (
                id SERIAL PRIMARY KEY,
                professor_id INTEGER REFERENCES professor(id) ON DELETE CASCADE,
                disciplina_id INTEGER REFERENCES disciplina(id) ON DELETE CASCADE,
                UNIQUE(professor_id, disciplina_id)
            )
        """)
        
        # Criar tabela de alunos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS aluno (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                matricula VARCHAR(50) NOT NULL UNIQUE,
                turma_id INTEGER REFERENCES turma(id) ON DELETE CASCADE
            )
        """)
        
        # Criar tabela de notas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nota (
                id SERIAL PRIMARY KEY,
                aluno_id INTEGER REFERENCES aluno(id) ON DELETE CASCADE,
                disciplina_id INTEGER REFERENCES disciplina(id) ON DELETE CASCADE,
                turma_id INTEGER REFERENCES turma(id) ON DELETE CASCADE,
                bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
                ano INTEGER NOT NULL,
                nota_mensal NUMERIC(4,1) NOT NULL CHECK (nota_mensal BETWEEN 0 AND 10),
                nota_bimestral NUMERIC(4,1) NOT NULL CHECK (nota_bimestral BETWEEN 0 AND 10),
                nota_recuperacao NUMERIC(4,1) CHECK (nota_recuperacao BETWEEN 0 AND 10),
                media_final NUMERIC(4,1) NOT NULL CHECK (media_final BETWEEN 0 AND 10),
                UNIQUE(aluno_id, disciplina_id, turma_id, bimestre, ano)
            )
        """)
        
        conn.commit()
        cursor.close()
        
        return {
            "status": "ok",
            "message": "Tabelas criadas com sucesso"
        }
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Erro ao criar tabelas: {e}")
        return {
            "status": "error",
            "message": f"Erro ao criar tabelas: {str(e)}"
        }
    finally:
        if conn:
            conn.close()
