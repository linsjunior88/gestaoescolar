import psycopg2

def create_tables_manually():
    """
    Create tables manually in the database
    """
    try:
        # Connect to the database
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s@",
            host="localhost",
            port="5432"
        )
        
        # Create a cursor
        cursor = conn.cursor()
        
        # Turn on autocommit
        conn.autocommit = True
        
        # Create turma table
        print("Creating 'turma' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS turma (
                id SERIAL PRIMARY KEY,
                id_turma VARCHAR(10) UNIQUE NOT NULL,
                nome VARCHAR(100) NOT NULL,
                ano INTEGER NOT NULL,
                ativo BOOLEAN NOT NULL DEFAULT TRUE
            )
        """)
        
        # Create disciplina table
        print("Creating 'disciplina' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disciplina (
                id SERIAL PRIMARY KEY,
                id_disciplina VARCHAR(10) UNIQUE NOT NULL,
                nome VARCHAR(100) NOT NULL,
                descricao TEXT,
                carga_horaria INTEGER NOT NULL,
                ativo BOOLEAN NOT NULL DEFAULT TRUE
            )
        """)
        
        # Create professor table
        print("Creating 'professor' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS professor (
                id SERIAL PRIMARY KEY,
                id_professor VARCHAR(10) UNIQUE NOT NULL,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha VARCHAR(100) NOT NULL,
                ativo BOOLEAN NOT NULL DEFAULT TRUE
            )
        """)
        
        # Create aluno table
        print("Creating 'aluno' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS aluno (
                id SERIAL PRIMARY KEY,
                id_aluno VARCHAR(10) UNIQUE NOT NULL,
                nome VARCHAR(100) NOT NULL,
                data_nasc DATE NOT NULL,
                id_turma INTEGER REFERENCES turma(id),
                ativo BOOLEAN NOT NULL DEFAULT TRUE
            )
        """)
        
        # Create disciplina_professor table (many-to-many)
        print("Creating 'disciplina_professor' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS disciplina_professor (
                id SERIAL PRIMARY KEY,
                professor_id INTEGER REFERENCES professor(id),
                disciplina_id INTEGER REFERENCES disciplina(id),
                turma_id INTEGER REFERENCES turma(id),
                UNIQUE(professor_id, disciplina_id, turma_id)
            )
        """)
        
        # Create nota table
        print("Creating 'nota' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS nota (
                id SERIAL PRIMARY KEY,
                aluno_id INTEGER REFERENCES aluno(id),
                disciplina_id INTEGER REFERENCES disciplina(id),
                turma_id INTEGER REFERENCES turma(id),
                nota1 NUMERIC(5,2),
                nota2 NUMERIC(5,2),
                nota3 NUMERIC(5,2),
                nota4 NUMERIC(5,2),
                media NUMERIC(5,2),
                ano INTEGER NOT NULL,
                bimestre INTEGER NOT NULL,
                UNIQUE(aluno_id, disciplina_id, ano, bimestre)
            )
        """)
        
        # Close cursor and connection
        cursor.close()
        conn.close()
        
        print("Tables created successfully!")
        return True
        
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False

if __name__ == "__main__":
    create_tables_manually() 