import psycopg2

def alter_turma_table():
    """
    Alter turma table structure to match frontend requirements:
    - Rename 'nome' column to 'serie'
    - Add 'tipo_turma' and 'coordenador' columns
    - Remove 'ano' and 'ativo' columns
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
                AND table_name = 'turma'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Table 'turma' does not exist. Creating it with the correct structure.")
            # If table doesn't exist, create it with the correct structure
            cursor.execute("""
                CREATE TABLE turma (
                    id SERIAL PRIMARY KEY,
                    id_turma VARCHAR(10) UNIQUE NOT NULL,
                    serie VARCHAR(100) NOT NULL,
                    turno VARCHAR(20) NOT NULL,
                    tipo_turma VARCHAR(50),
                    coordenador VARCHAR(100)
                )
            """)
            conn.commit()
            print("Table 'turma' created successfully with the correct structure.")
            cursor.close()
            conn.close()
            return True
        
        # Table exists, so we need to modify it
        print("Table 'turma' exists. Modifying its structure...")
        
        # First check if the columns exist to avoid errors
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'turma';
        """)
        existing_columns = [col[0] for col in cursor.fetchall()]
        
        # 1. First add the new columns if they don't exist
        if 'tipo_turma' not in existing_columns:
            print("Adding 'tipo_turma' column...")
            cursor.execute("""
                ALTER TABLE turma 
                ADD COLUMN tipo_turma VARCHAR(50);
            """)
        
        if 'coordenador' not in existing_columns:
            print("Adding 'coordenador' column...")
            cursor.execute("""
                ALTER TABLE turma 
                ADD COLUMN coordenador VARCHAR(100);
            """)
        
        if 'turno' not in existing_columns:
            print("Adding 'turno' column...")
            cursor.execute("""
                ALTER TABLE turma 
                ADD COLUMN turno VARCHAR(20) NOT NULL DEFAULT 'MANHA';
            """)
        
        # 2. Rename 'nome' to 'serie' if 'nome' exists and 'serie' doesn't
        if 'nome' in existing_columns and 'serie' not in existing_columns:
            print("Renaming 'nome' column to 'serie'...")
            cursor.execute("""
                ALTER TABLE turma 
                RENAME COLUMN nome TO serie;
            """)
        
        # 3. Drop 'ano' and 'ativo' columns if they exist
        if 'ano' in existing_columns:
            print("Dropping 'ano' column...")
            cursor.execute("""
                ALTER TABLE turma 
                DROP COLUMN ano;
            """)
        
        if 'ativo' in existing_columns:
            print("Dropping 'ativo' column...")
            cursor.execute("""
                ALTER TABLE turma 
                DROP COLUMN ativo;
            """)
        
        # Commit all changes
        conn.commit()
        print("Table 'turma' structure modified successfully.")
        
        # Show the new structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'turma' 
            ORDER BY ordinal_position;
        """)
        
        print("\nNew 'turma' table structure:")
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
        print(f"Error altering 'turma' table: {e}")
        return False

if __name__ == "__main__":
    alter_turma_table() 