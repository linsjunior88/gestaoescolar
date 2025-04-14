"""
Script para criar as tabelas no banco de dados gestao_escolar.

Este script cria todas as tabelas necessárias no banco de dados
gestao_escolar, sem recriar o banco de dados.
"""
import psycopg2
import sys
import traceback

# Parâmetros de conexão para o banco
DB_PARAMS = {
    'dbname': 'gestao_escolar',
    'user': 'postgres',
    'password': '4chrOn0s',  # Senha sem o caractere @
    'host': 'localhost',
    'port': '5432',
}

def create_tables():
    """
    Cria as tabelas no banco de dados gestao_escolar.
    """
    conn = None
    try:
        print(f"Conectando ao banco de dados 'gestao_escolar'...")
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Criando tabelas...")
        
        # Tabela Turma
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS turma (
            id SERIAL PRIMARY KEY,
            id_turma VARCHAR(10) UNIQUE NOT NULL,
            nome VARCHAR(50) NOT NULL,
            ano INTEGER NOT NULL,
            periodo VARCHAR(20) NOT NULL,
            tipo_turma VARCHAR(50),
            coordenador VARCHAR(100)
        )
        """)
        
        # Tabela Disciplina
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS disciplina (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            descricao TEXT,
            carga_horaria INTEGER NOT NULL
        )
        """)
        
        # Tabela Professor
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS professor (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            especialidade VARCHAR(100)
        )
        """)
        
        # Tabela Aluno
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS aluno (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            data_nascimento DATE NOT NULL,
            endereco TEXT,
            turma_id INTEGER REFERENCES turma(id)
        )
        """)
        
        # Tabela de relacionamento Turma-Disciplina
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS turma_disciplina (
            id SERIAL PRIMARY KEY,
            turma_id INTEGER REFERENCES turma(id),
            disciplina_id INTEGER REFERENCES disciplina(id),
            UNIQUE(turma_id, disciplina_id)
        )
        """)
        
        # Tabela de relacionamento Professor-Disciplina-Turma
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS professor_disciplina_turma (
            id SERIAL PRIMARY KEY,
            professor_id INTEGER REFERENCES professor(id),
            disciplina_id INTEGER REFERENCES disciplina(id),
            turma_id INTEGER REFERENCES turma(id),
            UNIQUE(professor_id, disciplina_id, turma_id)
        )
        """)
        
        # Tabela Nota
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS nota (
            id SERIAL PRIMARY KEY,
            aluno_id INTEGER REFERENCES aluno(id),
            disciplina_id INTEGER REFERENCES disciplina(id),
            valor NUMERIC(4,2) NOT NULL CHECK (valor >= 0 AND valor <= 10),
            data_avaliacao DATE NOT NULL,
            tipo_avaliacao VARCHAR(50) NOT NULL,
            UNIQUE(aluno_id, disciplina_id, tipo_avaliacao)
        )
        """)
        
        # View para calcular média final
        cursor.execute("""
        CREATE OR REPLACE VIEW media_final AS
        SELECT 
            a.id as aluno_id, 
            a.nome as aluno_nome,
            d.id as disciplina_id,
            d.nome as disciplina_nome,
            t.id as turma_id,
            t.nome as turma_nome,
            ROUND(AVG(n.valor)::numeric, 2) as media
        FROM 
            aluno a
            JOIN nota n ON a.id = n.aluno_id
            JOIN disciplina d ON n.disciplina_id = d.id
            JOIN turma t ON a.turma_id = t.id
        GROUP BY 
            a.id, a.nome, d.id, d.nome, t.id, t.nome
        """)
        
        print("Todas as tabelas foram criadas com sucesso!")
        
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        traceback.print_exc()
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            
if __name__ == "__main__":
    create_tables()
    print("Script concluído. Banco de dados pronto para uso.") 