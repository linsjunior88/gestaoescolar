import psycopg2

def create_professor_disciplina_turma_table():
    """
    Create professor_disciplina_turma table to replace disciplina_professor
    This will store the relationships between professors, disciplines and classes
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
        
        # Start a transaction
        conn.autocommit = False
        
        # Check if disciplina_professor table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'disciplina_professor'
            );
        """)
        
        # If old table exists, drop it (we will create a better one)
        if cursor.fetchone()[0]:
            print("Dropping old 'disciplina_professor' table...")
            cursor.execute("DROP TABLE IF EXISTS disciplina_professor CASCADE;")
        
        # Check if the new table already exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'professor_disciplina_turma'
            );
        """)
        
        if cursor.fetchone()[0]:
            print("Table 'professor_disciplina_turma' already exists.")
        else:
            # Create the new table with direct references to IDs (not database IDs)
            print("Creating 'professor_disciplina_turma' table...")
            cursor.execute("""
                CREATE TABLE professor_disciplina_turma (
                    id SERIAL PRIMARY KEY,
                    id_professor VARCHAR(10) NOT NULL,
                    id_disciplina VARCHAR(10) NOT NULL,
                    id_turma VARCHAR(10) NOT NULL,
                    UNIQUE(id_professor, id_disciplina, id_turma),
                    FOREIGN KEY (id_professor) REFERENCES professor(id_professor),
                    FOREIGN KEY (id_disciplina) REFERENCES disciplina(id_disciplina),
                    FOREIGN KEY (id_turma) REFERENCES turma(id_turma)
                )
            """)
            print("Table 'professor_disciplina_turma' created successfully.")
        
        # Commit changes
        conn.commit()
        
        # Show the structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'professor_disciplina_turma' 
            ORDER BY ordinal_position;
        """)
        
        print("\n'professor_disciplina_turma' table structure:")
        for column in cursor.fetchall():
            print(f"- {column[0]}: {column[1]}")
        
        # Close cursor and connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        # Rollback in case of error
        if conn:
            conn.rollback()
        print(f"Error creating 'professor_disciplina_turma' table: {e}")
        return False

if __name__ == "__main__":
    create_professor_disciplina_turma_table() 