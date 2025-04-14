"""
Script simples para testar a conexão com o banco de dados.
"""
import psycopg2
import traceback

def test_connection():
    """
    Testa a conexão básica com o banco de dados, sem especificar codificação.
    """
    try:
        print("Tentando conectar ao banco de dados...")
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s",
            host="localhost",
            port="5432"
        )
        
        print("Conexão bem-sucedida!")
        
        # Testar uma consulta simples
        cur = conn.cursor()
        cur.execute("SELECT current_database();")
        db_name = cur.fetchone()[0]
        print(f"Banco de dados atual: {db_name}")
        
        # Verificar se a tabela turma existe
        cur.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'turma');")
        table_exists = cur.fetchone()[0]
        
        if table_exists:
            print("A tabela 'turma' existe no banco de dados.")
            
            # Tentar contar registros na tabela turma
            cur.execute("SELECT COUNT(*) FROM turma;")
            count = cur.fetchone()[0]
            print(f"Quantidade de registros na tabela turma: {count}")
            
            if count > 0:
                # Verificar estrutura da tabela
                cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'turma';")
                columns = cur.fetchall()
                print("\nEstrutura da tabela turma:")
                for col in columns:
                    print(f"- {col[0]}: {col[1]}")
                    
                # Obter alguns dados
                cur.execute("SELECT id, id_turma, serie, turno FROM turma LIMIT 3;")
                rows = cur.fetchall()
                print("\nAlguns registros de turma:")
                for row in rows:
                    print(f"ID: {row[0]}, ID_Turma: {row[1]}, Série: {row[2]}, Turno: {row[3]}")
        else:
            print("A tabela 'turma' não existe no banco de dados.")
            
        # Fechar conexão
        cur.close()
        conn.close()
        print("\nConexão fechada.")
        
    except Exception as e:
        print(f"Erro ao conectar ou consultar o banco de dados: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_connection() 