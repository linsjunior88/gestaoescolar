"""
Script para testar a conexão com o banco de dados PostgreSQL usando LATIN1.
"""
import psycopg2
import psycopg2.extensions
import traceback

def test_db_connection():
    """
    Testa a conexão com o banco de dados usando codificação LATIN1.
    """
    # Configurando a codificação para lidar com caracteres especiais
    psycopg2.extensions.register_type(psycopg2.extensions.UNICODE)
    psycopg2.extensions.register_type(psycopg2.extensions.UNICODEARRAY)
    
    # Parâmetros de conexão
    db_params = {
        'dbname': 'gestao_escolar',
        'user': 'postgres',
        'password': '4chrOn0s',
        'host': 'localhost',
        'port': '5432',
        'client_encoding': 'LATIN1'
    }
    
    try:
        # Tentativa de conexão
        print("Conectando ao banco de dados PostgreSQL com LATIN1...")
        conn = psycopg2.connect(**db_params)
        print("Conexão estabelecida com sucesso!")
        
        # Verificando a versão do PostgreSQL
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"Versão do PostgreSQL: {version[0]}")
        
        # Verificando a codificação de caracteres
        cur.execute("SHOW client_encoding;")
        encoding = cur.fetchone()
        print(f"Codificação do cliente: {encoding[0]}")
        
        cur.execute("SHOW server_encoding;")
        encoding = cur.fetchone()
        print(f"Codificação do servidor: {encoding[0]}")
        
        # Verificando tabelas existentes
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = cur.fetchall()
        print("\nTabelas disponíveis:")
        for table in tables:
            print(f"- {table[0]}")
        
        # Verificando especificamente a tabela turma
        print("\nVerificando a tabela 'turma':")
        try:
            cur.execute("SELECT * FROM turma LIMIT 5;")
            rows = cur.fetchall()
            if rows:
                # Obtendo nomes das colunas
                colnames = [desc[0] for desc in cur.description]
                print(f"Colunas: {colnames}")
                
                # Exibindo dados
                print("\nDados encontrados:")
                for row in rows:
                    print(row)
            else:
                print("Nenhum dado encontrado na tabela 'turma'.")
        except Exception as e:
            print(f"Erro ao consultar a tabela 'turma': {e}")
            if "does not exist" in str(e):
                print("A tabela 'turma' não existe no banco de dados.")
        
        # Fechando conexão
        cur.close()
        conn.close()
        print("\nConexão fechada.")
        
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_db_connection() 