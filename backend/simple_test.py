import psycopg2

def test_connection():
    """
    Testa a conexão com o banco de dados PostgreSQL usando psycopg2 diretamente.
    """
    try:
        # Conectar ao banco de dados
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s@",
            host="localhost",
            port="5432"
        )
        
        # Criar um cursor
        cursor = conn.cursor()
        
        print("Conexão estabelecida com sucesso!")
        
        # Listar todas as tabelas no esquema public
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        tables = cursor.fetchall()
        
        if tables:
            print(f"Tabelas encontradas no banco de dados ({len(tables)}):")
            for table in tables:
                print(f"- {table[0]}")
                
                # Mostrar estrutura da tabela
                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table[0]}'
                """)
                
                columns = cursor.fetchall()
                print(f"  Colunas ({len(columns)}):")
                for column in columns:
                    print(f"    {column[0]} ({column[1]})")
                
                # Contar registros na tabela
                cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                count = cursor.fetchone()[0]
                print(f"  Total de registros: {count}")
                
                # Se houver registros, mostrar alguns exemplos (máximo 5)
                if count > 0:
                    cursor.execute(f"SELECT * FROM {table[0]} LIMIT 5")
                    records = cursor.fetchall()
                    print(f"  Exemplos de registros:")
                    for record in records:
                        print(f"    {record}")
                
                print("")
        else:
            print("Nenhuma tabela encontrada no banco de dados.")
        
        # Fechar cursor e conexão
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Erro ao conectar com o banco de dados: {e}")

if __name__ == "__main__":
    test_connection() 