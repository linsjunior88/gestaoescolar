"""
Script para corrigir a estrutura da tabela turma.

Este script adiciona as colunas faltantes na tabela turma
e adapta os dados existentes para a nova estrutura.
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

def fix_turma_table():
    """
    Corrige a estrutura da tabela turma.
    """
    conn = None
    try:
        print(f"Conectando ao banco de dados 'gestao_escolar'...")
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Verificando se a tabela turma existe...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'turma'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            print("A tabela turma existe. Verificando se o campo id_turma existe...")
            
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'turma' 
                    AND column_name = 'id_turma'
                );
            """)
            column_exists = cursor.fetchone()[0]
            
            if not column_exists:
                print("Campo id_turma não existe. Fazendo backup da tabela turma...")
                
                # Verifica se existem dependências para a tabela turma
                cursor.execute("""
                    SELECT COUNT(*) FROM (
                        SELECT tc.table_schema, tc.constraint_name, tc.table_name, kcu.column_name, 
                               ccu.table_schema AS foreign_table_schema,
                               ccu.table_name AS foreign_table_name,
                               ccu.column_name AS foreign_column_name 
                        FROM information_schema.table_constraints AS tc 
                        JOIN information_schema.key_column_usage AS kcu
                          ON tc.constraint_name = kcu.constraint_name
                          AND tc.table_schema = kcu.table_schema
                        JOIN information_schema.constraint_column_usage AS ccu
                          ON ccu.constraint_name = tc.constraint_name
                          AND ccu.table_schema = tc.table_schema
                        WHERE tc.constraint_type = 'FOREIGN KEY' 
                        AND ccu.table_name='turma'
                    ) as deps;
                """)
                
                has_dependencies = cursor.fetchone()[0] > 0
                
                if has_dependencies:
                    print("A tabela turma tem dependências. Criando uma nova estrutura temporária...")
                    
                    # Criar tabela turma_temp com a nova estrutura
                    cursor.execute("""
                        CREATE TABLE turma_temp (
                            id SERIAL PRIMARY KEY,
                            id_turma VARCHAR(10) UNIQUE NOT NULL,
                            nome VARCHAR(50) NOT NULL,
                            ano INTEGER NOT NULL,
                            periodo VARCHAR(20) NOT NULL,
                            tipo_turma VARCHAR(50),
                            coordenador VARCHAR(100)
                        );
                    """)
                    
                    # Obter dados da tabela original
                    cursor.execute("SELECT id, nome, ano, periodo FROM turma;")
                    rows = cursor.fetchall()
                    
                    # Inserir os dados na tabela temporária gerando id_turma automaticamente
                    for row in rows:
                        id_orig, nome, ano, periodo = row
                        # Gerar id_turma baseado no id (para manter referências)
                        id_turma = f"T{id_orig:03d}"
                        
                        cursor.execute("""
                            INSERT INTO turma_temp (id, id_turma, nome, ano, periodo, tipo_turma, coordenador) 
                            VALUES (%s, %s, %s, %s, %s, %s, %s);
                        """, (id_orig, id_turma, nome, ano, periodo, 'Regular', 'Coordenador'))
                    
                    print("Dados migrados para tabela temporária. Ajustando chaves estrangeiras...")
                    
                    # A partir daqui, você precisaria ajustar todas as chaves estrangeiras
                    # que apontam para a tabela turma, o que é complexo e específico para cada caso
                    print("ATENÇÃO: Você pode precisar ajustar manualmente as tabelas relacionadas!")
                    print("Este script apenas criou a tabela turma_temp com a estrutura correta.")
                    print("Para completar a migração, você precisará:")
                    print("1. Verificar todas as tabelas que têm chaves estrangeiras para turma")
                    print("2. Atualizar essas referências para usar a nova tabela")
                    print("3. Renomear a tabela turma_temp para turma")
                    
                    print("\nSugestão: é mais simples recriar o banco de dados usando create_new_database.py")
                    
                else:
                    print("A tabela turma não tem dependências. Recriando a tabela...")
                    
                    # Backup dos dados existentes
                    cursor.execute("SELECT id, nome, ano, periodo FROM turma;")
                    rows = cursor.fetchall()
                    
                    # Dropar a tabela existente
                    cursor.execute("DROP TABLE turma;")
                    
                    # Criar a tabela com a estrutura correta
                    cursor.execute("""
                        CREATE TABLE turma (
                            id SERIAL PRIMARY KEY,
                            id_turma VARCHAR(10) UNIQUE NOT NULL,
                            nome VARCHAR(50) NOT NULL,
                            ano INTEGER NOT NULL,
                            periodo VARCHAR(20) NOT NULL,
                            tipo_turma VARCHAR(50),
                            coordenador VARCHAR(100)
                        );
                    """)
                    
                    # Restaurar os dados com id_turma gerado
                    for row in rows:
                        id_orig, nome, ano, periodo = row
                        # Gerar id_turma baseado no id
                        id_turma = f"T{id_orig:03d}"
                        
                        cursor.execute("""
                            INSERT INTO turma (id, id_turma, nome, ano, periodo, tipo_turma, coordenador) 
                            VALUES (%s, %s, %s, %s, %s, %s, %s);
                        """, (id_orig, id_turma, nome, ano, periodo, 'Regular', 'Coordenador'))
                    
                    print("Tabela turma recriada com sucesso com a estrutura correta!")
            else:
                print("O campo id_turma já existe na tabela turma.")
        else:
            print("A tabela turma não existe. Execute create_tables.py para criar as tabelas.")
        
    except Exception as e:
        print(f"Erro ao corrigir tabela turma: {e}")
        traceback.print_exc()
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            
if __name__ == "__main__":
    fix_turma_table()
    print("Script concluído.") 