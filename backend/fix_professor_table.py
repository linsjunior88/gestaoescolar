import psycopg2

def fix_professor_table():
    """
    Fix professor table structure to match frontend requirements:
    - Rename 'nome' column to 'nome_professor'
    - Rename 'email' column to 'email_professor'
    - Remove 'senha' and 'ativo' columns
    - 'Disciplinas' and 'Turmas' virão das tabelas de relacionamento
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
                AND table_name = 'professor'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Table 'professor' does not exist. Creating it with the correct structure.")
            # If table doesn't exist, create it with the correct structure
            cursor.execute("""
                CREATE TABLE professor (
                    id SERIAL PRIMARY KEY,
                    id_professor VARCHAR(10) UNIQUE NOT NULL,
                    nome_professor VARCHAR(100) NOT NULL,
                    email_professor VARCHAR(100) UNIQUE
                )
            """)
            conn.commit()
            print("Table 'professor' created successfully with the correct structure.")
            cursor.close()
            conn.close()
            return True
        
        # Table exists, so we need to modify it
        print("Table 'professor' exists. Modifying its structure...")
        
        # First check if the columns exist to avoid errors
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'professor';
        """)
        existing_columns = [col[0] for col in cursor.fetchall()]
        
        # 1. Rename columns if needed
        if 'nome' in existing_columns and 'nome_professor' not in existing_columns:
            print("Renaming 'nome' column to 'nome_professor'...")
            cursor.execute("""
                ALTER TABLE professor 
                RENAME COLUMN nome TO nome_professor;
            """)
        
        if 'email' in existing_columns and 'email_professor' not in existing_columns:
            print("Renaming 'email' column to 'email_professor'...")
            cursor.execute("""
                ALTER TABLE professor 
                RENAME COLUMN email TO email_professor;
            """)
        
        # 2. Drop unnecessary columns if they exist
        if 'senha' in existing_columns:
            print("Dropping 'senha' column...")
            cursor.execute("""
                ALTER TABLE professor 
                DROP COLUMN senha;
            """)
        
        if 'ativo' in existing_columns:
            print("Dropping 'ativo' column...")
            cursor.execute("""
                ALTER TABLE professor 
                DROP COLUMN ativo;
            """)
        
        # Commit all changes
        conn.commit()
        print("Table 'professor' structure modified successfully.")
        
        # Show the new structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'professor' 
            ORDER BY ordinal_position;
        """)
        
        print("\nNew 'professor' table structure:")
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
        print(f"Error altering 'professor' table: {e}")
        return False

if __name__ == "__main__":
    fix_professor_table() 