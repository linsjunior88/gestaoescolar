import psycopg2

try:
    # Tentar conectar ao banco de dados PostgreSQL
    connection = psycopg2.connect(
        dbname="gestao_escolar",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )
    
    # Criar um cursor
    cursor = connection.cursor()
    
    # Executar uma consulta simples
    cursor.execute("SELECT 1")
    
    # Obter o resultado
    result = cursor.fetchone()
    
    if result and result[0] == 1:
        print("Conexao com o banco de dados bem-sucedida!")
    else:
        print("Erro na consulta ao banco de dados.")
    
    # Fechar o cursor e a conexão
    cursor.close()
    connection.close()

except Exception as e:
    print(f"Erro ao conectar com o banco de dados: {e}")

print("Teste concluido.") 