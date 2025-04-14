"""
Script para criar um novo banco de dados e tabelas do zero.

Este script recria o banco de dados 'gestao_escolar' do zero, 
com as tabelas necessárias e estrutura correta.
"""
import psycopg2
from psycopg2 import sql
import sys
import traceback

# Parâmetros de conexão para o banco 'postgres' (para criar um novo banco)
pg_params = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': '4chrOn0s',  # Senha sem o caractere @
    'host': 'localhost',
    'port': '5432',
}

# Nome do novo banco de dados
NEW_DB_NAME = 'gestao_escolar'

def create_new_database():
    """
    Cria um novo banco de dados do zero.
    """
    conn = None
    try:
        # Conectar ao banco postgres para poder criar um novo banco
        print(f"Conectando ao banco 'postgres' para criar um novo banco de dados...")
        conn = psycopg2.connect(**pg_params)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Verificar se o banco novo já existe
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (NEW_DB_NAME,))
        exists = cursor.fetchone()
        
        if exists:
            print(f"O banco de dados '{NEW_DB_NAME}' já existe. Deseja apagá-lo e recriá-lo?")
            confirm = input("Digite 'SIM' para confirmar: ")
            
            if confirm.upper() == 'SIM':
                # Encerrar todas as conexões ao banco antes de dropá-lo
                cursor.execute(f"SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '{NEW_DB_NAME}' AND pid <> pg_backend_pid();")
                
                # Dropar o banco existente
                print(f"Removendo banco de dados '{NEW_DB_NAME}'...")
                cursor.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(NEW_DB_NAME)))
                print("Banco de dados removido com sucesso.")
            else:
                print("Operação cancelada pelo usuário.")
                return False
        
        # Criar o novo banco
        print(f"Criando banco de dados '{NEW_DB_NAME}'...")
        cursor.execute(sql.SQL("CREATE DATABASE {} WITH ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8' LC_CTYPE 'en_US.UTF-8'").format(sql.Identifier(NEW_DB_NAME)))
        
        print(f"Banco de dados '{NEW_DB_NAME}' criado com sucesso.")
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"Erro ao criar banco de dados: {e}")
        traceback.print_exc()
        if conn:
            conn.close()
        return False

def create_tables():
    """
    Cria as tabelas no novo banco de dados.
    """
    # Parâmetros de conexão para o novo banco
    new_db_params = {
        'dbname': NEW_DB_NAME,
        'user': 'postgres',
        'password': '4chrOn0s',  # Senha sem o caractere @
        'host': 'localhost',
        'port': '5432',
    }
    
    conn = None
    try:
        # Conectar ao novo banco
        print(f"Conectando ao banco '{NEW_DB_NAME}' para criar tabelas...")
        conn = psycopg2.connect(**new_db_params)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Criar tabela turma
        print("Criando tabela 'turma'...")
        cursor.execute("""
            CREATE TABLE turma (
                id SERIAL PRIMARY KEY,
                id_turma VARCHAR(10) UNIQUE NOT NULL,
                serie VARCHAR(50) NOT NULL,
                turno VARCHAR(10) NOT NULL,
                tipo_turma VARCHAR(50),
                coordenador VARCHAR(100)
            )
        """)
        
        # Criar tabela disciplina
        print("Criando tabela 'disciplina'...")
        cursor.execute("""
            CREATE TABLE disciplina (
                id SERIAL PRIMARY KEY,
                id_disciplina VARCHAR(10) UNIQUE NOT NULL,
                nome_disciplina VARCHAR(100) NOT NULL,
                carga_horaria INTEGER
            )
        """)
        
        # Criar tabela professor
        print("Criando tabela 'professor'...")
        cursor.execute("""
            CREATE TABLE professor (
                id SERIAL PRIMARY KEY,
                id_professor VARCHAR(20) UNIQUE NOT NULL,
                nome_professor VARCHAR(100) NOT NULL,
                email_professor VARCHAR(100),
                ativo BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Criar tabela aluno
        print("Criando tabela 'aluno'...")
        cursor.execute("""
            CREATE TABLE aluno (
                id SERIAL PRIMARY KEY,
                id_aluno VARCHAR(20) UNIQUE NOT NULL,
                nome_aluno VARCHAR(100) NOT NULL,
                sexo VARCHAR(1),
                data_nasc DATE,
                mae VARCHAR(100),
                id_turma VARCHAR(10) REFERENCES turma(id_turma),
                endereco VARCHAR(200),
                telefone VARCHAR(20),
                email VARCHAR(100)
            )
        """)
        
        # Criar tabela turma_disciplina
        print("Criando tabela 'turma_disciplina'...")
        cursor.execute("""
            CREATE TABLE turma_disciplina (
                id SERIAL PRIMARY KEY,
                id_turma VARCHAR(10) REFERENCES turma(id_turma) NOT NULL,
                id_disciplina VARCHAR(10) REFERENCES disciplina(id_disciplina) NOT NULL
            )
        """)
        
        # Criar tabela professor_disciplina_turma
        print("Criando tabela 'professor_disciplina_turma'...")
        cursor.execute("""
            CREATE TABLE professor_disciplina_turma (
                id SERIAL PRIMARY KEY,
                id_professor VARCHAR(20) REFERENCES professor(id_professor) NOT NULL,
                id_disciplina VARCHAR(10) REFERENCES disciplina(id_disciplina) NOT NULL,
                id_turma VARCHAR(10) REFERENCES turma(id_turma) NOT NULL
            )
        """)
        
        # Criar tabela nota
        print("Criando tabela 'nota'...")
        cursor.execute("""
            CREATE TABLE nota (
                id SERIAL PRIMARY KEY,
                id_aluno VARCHAR(20) REFERENCES aluno(id_aluno) NOT NULL,
                id_disciplina VARCHAR(10) REFERENCES disciplina(id_disciplina) NOT NULL,
                id_turma VARCHAR(10) REFERENCES turma(id_turma) NOT NULL,
                ano INTEGER NOT NULL,
                bimestre INTEGER NOT NULL,
                nota_mensal FLOAT,
                nota_bimestral FLOAT,
                recuperacao FLOAT,
                media FLOAT
            )
        """)
        
        # Criar a view media_final
        print("Criando view 'media_final'...")
        cursor.execute("""
            CREATE OR REPLACE VIEW media_final AS
            SELECT 
                n.id_aluno,
                a.nome_aluno,
                n.id_disciplina,
                d.nome_disciplina,
                n.id_turma,
                t.serie,
                t.turno,
                n.ano,
                ROUND(AVG(n.media), 1) as media_anual,
                CASE 
                    WHEN ROUND(AVG(n.media), 1) >= 7.0 THEN 'Aprovado'
                    WHEN ROUND(AVG(n.media), 1) >= 5.0 THEN 'Recuperação'
                    ELSE 'Reprovado'
                END as situacao
            FROM 
                nota n
                JOIN aluno a ON n.id_aluno = a.id_aluno
                JOIN disciplina d ON n.id_disciplina = d.id_disciplina
                JOIN turma t ON n.id_turma = t.id_turma
            GROUP BY 
                n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, 
                n.id_turma, t.serie, t.turno, n.ano
            ORDER BY 
                a.nome_aluno, d.nome_disciplina;
        """)
        
        # Inserir alguns dados de exemplo na tabela turma
        print("Inserindo dados de exemplo na tabela 'turma'...")
        cursor.execute("""
            INSERT INTO turma (id_turma, serie, turno, tipo_turma, coordenador) VALUES
            ('01AM', '1º Ano', 'Manhã', 'Regular', 'Maria Silva'),
            ('02AM', '2º Ano', 'Manhã', 'Regular', 'João Santos'),
            ('03AM', '3º Ano', 'Manhã', 'Regular', 'Ana Oliveira'),
            ('04AM', '4º Ano', 'Manhã', 'Regular', 'Pedro Costa'),
            ('05AM', '5º Ano', 'Manhã', 'Regular', 'Lucia Ferreira')
        """)
        
        # Inserir alguns dados de exemplo na tabela disciplina
        print("Inserindo dados de exemplo na tabela 'disciplina'...")
        cursor.execute("""
            INSERT INTO disciplina (id_disciplina, nome_disciplina, carga_horaria) VALUES
            ('MAT', 'Matemática', 80),
            ('PORT', 'Português', 80),
            ('CIEN', 'Ciências', 60),
            ('HIST', 'História', 60),
            ('GEO', 'Geografia', 60),
            ('EDFIS', 'Educação Física', 40),
            ('ARTES', 'Artes', 40)
        """)
        
        # Verificar as tabelas criadas
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cursor.fetchall()
        print("\nTabelas criadas:")
        for table in tables:
            print(f"- {table[0]}")
        
        cursor.close()
        conn.close()
        print("\nTabelas criadas com sucesso!")
        
        return True
        
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")
        traceback.print_exc()
        if conn:
            conn.close()
        return False

def main():
    """
    Função principal para criar banco e tabelas.
    """
    print("=== Criação de Novo Banco de Dados ===")
    
    if create_new_database():
        print("\n=== Banco criado com sucesso! ===\n")
        
        if create_tables():
            print("\n=== Todas as tabelas foram criadas com sucesso! ===")
            print(f"Agora você pode usar o banco de dados '{NEW_DB_NAME}' para suas aplicações.")
            print("Lembre-se de atualizar a string de conexão na sua aplicação para apontar para o novo banco.")
        else:
            print("\n=== Falha ao criar as tabelas. ===")
    else:
        print("\n=== Falha ao criar o banco de dados. ===")

if __name__ == "__main__":
    main() 