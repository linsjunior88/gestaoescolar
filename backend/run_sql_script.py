"""
Script para executar o script SQL que recria as tabelas do banco de dados.
"""
import psycopg2
import os
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

def run_sql_script():
    """
    Executa o script SQL que recria as tabelas do banco de dados.
    """
    conn = None
    try:
        print(f"Conectando ao banco de dados 'gestao_escolar'...")
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Carregar o script SQL
        sql_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recreate_db.sql")
        print(f"Carregando script SQL de {sql_file_path}...")
        
        with open(sql_file_path, 'r', encoding='utf-8') as sql_file:
            sql_script = sql_file.read()
        
        print("Script SQL carregado. Executando...")
        
        # Confirmar com o usuário antes de executar
        print("\nAVISO: Este script irá apagar todas as tabelas e dados existentes.")
        confirm = input("Digite 'SIM' para continuar: ")
        
        if confirm.upper() != "SIM":
            print("Operação cancelada pelo usuário.")
            return
        
        # Executar o script SQL
        cursor.execute(sql_script)
        
        print("Script SQL executado com sucesso!")
        
        # Verificar as tabelas criadas
        print("\nTabelas criadas no banco de dados:")
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = cursor.fetchall()
        for table in tables:
            print(f"- {table[0]}")
        
        # Verificar view criada
        print("\nViews criadas no banco de dados:")
        cursor.execute("SELECT table_name FROM information_schema.views WHERE table_schema = 'public'")
        views = cursor.fetchall()
        for view in views:
            print(f"- {view[0]}")
        
    except Exception as e:
        print(f"Erro ao executar script SQL: {e}")
        traceback.print_exc()
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            
if __name__ == "__main__":
    run_sql_script()
    print("Script concluído.") 