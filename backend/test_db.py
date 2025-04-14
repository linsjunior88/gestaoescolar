from sqlalchemy import create_engine, text

def test_database_connection():
    # URL de conexão direta sem usar o módulo de configuração
    database_url = "postgresql://postgres:postgres@localhost:5432/gestao_escolar"
    
    try:
        # Criar engine de conexão
        engine = create_engine(database_url)
        
        # Tentar conectar e executar uma consulta simples
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            row = result.fetchone()
            if row[0] == 1:
                print("Conexao com o banco de dados bem-sucedida!")
                return True
            else:
                print("Erro na consulta ao banco de dados.")
                return False
    except Exception as e:
        print(f"Erro ao conectar com o banco de dados: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()