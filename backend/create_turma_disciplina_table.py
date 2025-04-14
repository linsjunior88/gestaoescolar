import psycopg2

def create_turma_disciplina_table():
    """
    Create the turma_disciplina table to link disciplines to classes
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
        
        # Check if the table already exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'turma_disciplina'
            );
        """)
        
        if cursor.fetchone()[0]:
            print("Table 'turma_disciplina' already exists.")
        else:
            # Create the table
            print("Creating 'turma_disciplina' table...")
            cursor.execute("""
                CREATE TABLE turma_disciplina (
                    id SERIAL PRIMARY KEY,
                    id_disciplina VARCHAR(10) NOT NULL,
                    id_turma VARCHAR(10) NOT NULL,
                    UNIQUE(id_disciplina, id_turma),
                    FOREIGN KEY (id_disciplina) REFERENCES disciplina(id_disciplina),
                    FOREIGN KEY (id_turma) REFERENCES turma(id_turma)
                )
            """)
            print("Table 'turma_disciplina' created successfully.")
        
        # Commit changes
        conn.commit()
        
        # Show the structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'turma_disciplina' 
            ORDER BY ordinal_position;
        """)
        
        print("\n'turma_disciplina' table structure:")
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
        print(f"Error creating 'turma_disciplina' table: {e}")
        return False

if __name__ == "__main__":
    create_turma_disciplina_table() 