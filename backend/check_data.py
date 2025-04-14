"""
Script para verificar os dados da tabela professor.
"""
import psycopg2

# Parâmetros de conexão para o banco
DB_PARAMS = {
    'dbname': 'gestao_escolar',
    'user': 'postgres',
    'password': '4chrOn0s',
    'host': 'localhost',
    'port': '5432',
}

conn = psycopg2.connect(**DB_PARAMS)
cursor = conn.cursor()

print("Consultando dados da tabela professor...")
cursor.execute("SELECT * FROM professor")
rows = cursor.fetchall()

print("\nDados da tabela professor:")
print("--------------------------")
if rows:
    for row in rows:
        print(row)
else:
    print("Nenhum dado encontrado.")

# Inserir alguns dados de exemplo se não houver nenhum
if not rows:
    print("\nInserindo dados de exemplo...")
    cursor.execute("""
    INSERT INTO professor (id_professor, nome_professor, email_professor, telefone_professor) 
    VALUES 
        ('PROF001', 'Carlos Ferreira', 'carlos.ferreira@escola.edu', '(11) 98765-4321'),
        ('PROF002', 'Marina Santos', 'marina.santos@escola.edu', '(11) 91234-5678'),
        ('PROF003', 'Roberto Alves', 'roberto.alves@escola.edu', '(11) 99876-5432')
    """)
    conn.commit()
    
    print("Dados inseridos. Verificando novamente...")
    cursor.execute("SELECT * FROM professor")
    rows = cursor.fetchall()
    
    print("\nDados da tabela professor após inserção:")
    print("----------------------------------------")
    for row in rows:
        print(row)

conn.close()
print("\nVerificação concluída.") 