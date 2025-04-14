"""
Script para verificar as colunas da tabela professor no banco de dados.
"""
import psycopg2
import sys

# Parâmetros de conexão para o banco
DB_PARAMS = {
    'dbname': 'gestao_escolar',
    'user': 'postgres',
    'password': '4chrOn0s',
    'host': 'localhost',
    'port': '5432',
}

def check_professor_table():
    """
    Verifica as colunas da tabela professor no banco de dados.
    """
    conn = None
    try:
        print(f"Conectando ao banco de dados 'gestao_escolar'...")
        conn = psycopg2.connect(**DB_PARAMS)
        cursor = conn.cursor()
        
        # Verificar as colunas da tabela professor
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'professor'
            ORDER BY ordinal_position
        """)
        
        columns = cursor.fetchall()
        print("\nColunas da tabela professor:")
        print("-----------------------------")
        for column in columns:
            column_name, data_type, max_length = column
            if max_length:
                print(f"- {column_name}: {data_type}({max_length})")
            else:
                print(f"- {column_name}: {data_type}")
        
        # Verificar alguns dados da tabela professor
        cursor.execute("SELECT * FROM professor LIMIT 5")
        rows = cursor.fetchall()
        
        if rows:
            print("\nDados de exemplo (até 5 professores):")
            print("-------------------------------------")
            for row in rows:
                print(f"Professor ID: {row[0]}, Código: {row[1]}, Nome: {row[2]}")
        else:
            print("\nNão há dados na tabela professor.")
        
    except Exception as e:
        print(f"Erro ao verificar tabela professor: {e}")
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            
if __name__ == "__main__":
    check_professor_table()
    print("\nVerificação concluída.") 