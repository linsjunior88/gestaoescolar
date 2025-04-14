import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Criar o banco de dados gestao_escolar se ele não existir"""
    try:
        # Conectar ao banco de dados postgres padrão
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        # Criar um cursor
        cursor = conn.cursor()
        
        # Verificar se o banco de dados ja existe
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'gestao_escolar'")
        exists = cursor.fetchone()
        
        if not exists:
            print("Criando banco de dados 'gestao_escolar'...")
            # Criar o banco de dados
            cursor.execute("CREATE DATABASE gestao_escolar")
            print("Banco de dados criado com sucesso!")
        else:
            print("Banco de dados 'gestao_escolar' ja existe.")
        
        # Fechar o cursor e a conexao
        cursor.close()
        conn.close()
        
        print("Conexao com o PostgreSQL bem-sucedida!")
        return True
        
    except Exception as e:
        print(f"Erro ao conectar com o PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    create_database() 