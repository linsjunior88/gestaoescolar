import psycopg2
import traceback

print("Iniciando teste de conexao...")

try:
    print("Tentando conectar ao banco de dados...")
    # Connect to PostgreSQL
    connection = psycopg2.connect(
        dbname="gestao_escolar",
        user="postgres",
        password="4chrOn0s@",
        host="localhost",
        port="5432"
    )
    print("Conexao estabelecida!")
    
    # Create cursor
    print("Criando cursor...")
    cursor = connection.cursor()
    print("Cursor criado!")
    
    # Execute simple query
    print("Executando query simples...")
    cursor.execute("SELECT 1 as test")
    print("Query executada!")
    
    # Get result
    print("Buscando resultado...")
    result = cursor.fetchone()
    print(f"Resultado obtido: {result}")
    
    if result and result[0] == 1:
        print("Database connection successful!")
    else:
        print("Query error.")
    
    # Close cursor and connection
    print("Fechando cursor...")
    cursor.close()
    print("Fechando conexao...")
    connection.close()
    print("Conexao fechada!")

except Exception as e:
    print(f"Connection error: {e}")
    print("Traceback:")
    traceback.print_exc()

print("Test completed.") 