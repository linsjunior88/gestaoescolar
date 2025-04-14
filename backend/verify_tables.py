#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Verificador de tabelas para o Sistema de Gestão Escolar.
Este script verifica se todas as tabelas necessárias existem no banco de dados
e mostra informações sobre sua estrutura.
"""

import psycopg2
import sys
from psycopg2 import sql
from psycopg2.extras import RealDictCursor

# Parâmetros de conexão com o banco de dados
DB_PARAMS = {
    "dbname": "gestao_escolar",
    "user": "postgres",
    "password": "4chrOn0s",  # Senha sem o caractere @
    "host": "localhost",
    "port": "5432"
}

# Lista de tabelas esperadas
EXPECTED_TABLES = [
    "turmas",
    "disciplinas",
    "professores",
    "alunos",
    "notas"
]

# Cores para o console
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_color(text, color=Colors.BLUE):
    """Imprime texto colorido no console."""
    print(f"{color}{text}{Colors.ENDC}")

def connect_to_db():
    """Conecta ao banco de dados e retorna a conexão."""
    try:
        print_color("Conectando ao banco de dados...", Colors.BLUE)
        conn = psycopg2.connect(**DB_PARAMS)
        print_color("Conexão estabelecida com sucesso!", Colors.GREEN)
        return conn
    except Exception as e:
        print_color(f"Erro ao conectar ao banco de dados: {e}", Colors.RED)
        sys.exit(1)

def check_table_exists(cursor, table_name):
    """Verifica se uma tabela existe no banco de dados."""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
    """, (table_name,))
    return cursor.fetchone()[0]

def get_table_columns(cursor, table_name):
    """Obtém informações sobre as colunas de uma tabela."""
    cursor.execute("""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    return cursor.fetchall()

def get_table_constraints(cursor, table_name):
    """Obtém informações sobre as restrições de uma tabela."""
    cursor.execute("""
        SELECT conname as constraint_name, 
               contype as constraint_type,
               pg_get_constraintdef(c.oid) as constraint_definition
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE n.nspname = 'public' AND cl.relname = %s
    """, (table_name,))
    return cursor.fetchall()

def get_row_count(cursor, table_name):
    """Obtém o número de linhas em uma tabela."""
    cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table_name)))
    return cursor.fetchone()[0]

def verify_tables():
    """Verifica a estrutura de todas as tabelas esperadas."""
    conn = connect_to_db()
    cursor = conn.cursor()
    dict_cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print_color("\n=== VERIFICAÇÃO DE TABELAS DO SISTEMA DE GESTÃO ESCOLAR ===", Colors.HEADER)
    
    # Verificar tabelas esperadas
    all_tables_exist = True
    for table in EXPECTED_TABLES:
        exists = check_table_exists(cursor, table)
        if exists:
            print_color(f"✓ Tabela '{table}' encontrada", Colors.GREEN)
        else:
            print_color(f"✗ Tabela '{table}' NÃO encontrada", Colors.RED)
            all_tables_exist = False
    
    if not all_tables_exist:
        print_color("\nAlgumas tabelas não foram encontradas. Execute o script create_new_database.py para criar todas as tabelas.", Colors.RED)
        cursor.close()
        conn.close()
        return
    
    # Imprimir detalhes de cada tabela
    for table in EXPECTED_TABLES:
        print_color(f"\n=== DETALHES DA TABELA '{table.upper()}' ===", Colors.HEADER)
        
        # Obter colunas
        columns = get_table_columns(dict_cursor, table)
        print_color("Colunas:", Colors.BOLD)
        for col in columns:
            nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
            default = f"DEFAULT {col['column_default']}" if col['column_default'] else ""
            print(f"  {col['column_name']} ({col['data_type']}) {nullable} {default}")
        
        # Obter restrições
        constraints = get_table_constraints(dict_cursor, table)
        if constraints:
            print_color("\nRestrições:", Colors.BOLD)
            for constraint in constraints:
                c_type = ""
                if constraint['constraint_type'] == 'p':
                    c_type = "PRIMARY KEY"
                elif constraint['constraint_type'] == 'f':
                    c_type = "FOREIGN KEY"
                elif constraint['constraint_type'] == 'u':
                    c_type = "UNIQUE"
                elif constraint['constraint_type'] == 'c':
                    c_type = "CHECK"
                
                print(f"  {constraint['constraint_name']} ({c_type}): {constraint['constraint_definition']}")
        
        # Obter contagem de linhas
        row_count = get_row_count(cursor, table)
        print_color(f"\nNúmero de registros: {row_count}", Colors.BLUE)
    
    print_color("\n=== RESUMO ===", Colors.HEADER)
    print_color("Todas as tabelas necessárias estão presentes no banco de dados!", Colors.GREEN)
    print_color("O sistema está pronto para uso.", Colors.GREEN)
    
    cursor.close()
    dict_cursor.close()
    conn.close()

if __name__ == "__main__":
    verify_tables() 