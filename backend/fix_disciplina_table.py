import psycopg2

def fix_disciplina_table():
    """
    Fix disciplina table structure to match frontend requirements:
    - Rename 'nome' column to 'nome_disciplina'
    - Keep 'carga_horaria' column
    - Remove 'descricao' and 'ativo' columns
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
        
        # Check if the table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'disciplina'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Table 'disciplina' does not exist. Creating it with the correct structure.")
            # If table doesn't exist, create it with the correct structure
            cursor.execute("""
                CREATE TABLE disciplina (
                    id SERIAL PRIMARY KEY,
                    id_disciplina VARCHAR(10) UNIQUE NOT NULL,
                    nome_disciplina VARCHAR(100) NOT NULL,
                    carga_horaria INTEGER NOT NULL
                )
            """)
            conn.commit()
            print("Table 'disciplina' created successfully with the correct structure.")
            cursor.close()
            conn.close()
            return True
        
        # Table exists, so we need to modify it
        print("Table 'disciplina' exists. Modifying its structure...")
        
        # First check if the columns exist to avoid errors
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'disciplina';
        """)
        existing_columns = [col[0] for col in cursor.fetchall()]
        
        # 1. Rename 'nome' to 'nome_disciplina' if 'nome' exists and 'nome_disciplina' doesn't
        if 'nome' in existing_columns and 'nome_disciplina' not in existing_columns:
            print("Renaming 'nome' column to 'nome_disciplina'...")
            cursor.execute("""
                ALTER TABLE disciplina 
                RENAME COLUMN nome TO nome_disciplina;
            """)
        
        # 2. Drop unnecessary columns if they exist
        if 'descricao' in existing_columns:
            print("Dropping 'descricao' column...")
            cursor.execute("""
                ALTER TABLE disciplina 
                DROP COLUMN descricao;
            """)
        
        if 'ativo' in existing_columns:
            print("Dropping 'ativo' column...")
            cursor.execute("""
                ALTER TABLE disciplina 
                DROP COLUMN ativo;
            """)
        
        # Commit all changes
        conn.commit()
        print("Table 'disciplina' structure modified successfully.")
        
        # Show the new structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'disciplina' 
            ORDER BY ordinal_position;
        """)
        
        print("\nNew 'disciplina' table structure:")
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
        print(f"Error altering 'disciplina' table: {e}")
        return False

if __name__ == "__main__":
    fix_disciplina_table() 