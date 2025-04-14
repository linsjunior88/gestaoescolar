import psycopg2

def test_connection():
    try:
        # Conectar diretamente usando psycopg2
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="postgres",
            host="localhost",
            port="5432"
        )
        
        # Abrir um cursor
        cur = conn.cursor()
        
        # Executar uma consulta simples
        cur.execute("SELECT 1")
        
        # Obter o resultado
        result = cur.fetchone()
        
        # Fechar conexões
        cur.close()
        conn.close()
        
        if result[0] == 1:
            print("Conexao com o banco de dados bem-sucedida!")
            return True
        else:
            print("Erro na consulta ao banco de dados.")
            return False
            
    except Exception as e:
        print(f"Erro ao conectar com o banco de dados: {e}")
        return False

if __name__ == "__main__":
    test_connection() 