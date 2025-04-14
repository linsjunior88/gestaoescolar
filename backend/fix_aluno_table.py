import psycopg2

def fix_aluno_table():
    """
    Fix aluno table structure to match frontend requirements:
    - Rename 'nome' column to 'nome_aluno'
    - Add 'sexo' and 'mae' columns
    - Use id_turma directly (string) instead of a reference to turma.id
    - Remove 'ativo' column
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
                AND table_name = 'aluno'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Table 'aluno' does not exist. Creating it with the correct structure.")
            # If table doesn't exist, create it with the correct structure
            cursor.execute("""
                CREATE TABLE aluno (
                    id SERIAL PRIMARY KEY,
                    id_aluno VARCHAR(10) UNIQUE NOT NULL,
                    nome_aluno VARCHAR(100) NOT NULL,
                    sexo VARCHAR(10) NOT NULL,
                    data_nasc DATE NOT NULL,
                    mae VARCHAR(100),
                    id_turma VARCHAR(10) NOT NULL,
                    FOREIGN KEY (id_turma) REFERENCES turma(id_turma)
                )
            """)
            conn.commit()
            print("Table 'aluno' created successfully with the correct structure.")
            cursor.close()
            conn.close()
            return True
        
        # Table exists, so we need to modify it
        print("Table 'aluno' exists. Modifying its structure...")
        
        # First check if the columns exist to avoid errors
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'aluno';
        """)
        existing_columns = [col[0] for col in cursor.fetchall()]
        
        # We need to be careful with foreign key constraints - need to add new columns first
        
        # 1. Add missing columns
        if 'sexo' not in existing_columns:
            print("Adding 'sexo' column...")
            cursor.execute("""
                ALTER TABLE aluno 
                ADD COLUMN sexo VARCHAR(10) NOT NULL DEFAULT 'MASCULINO';
            """)
        
        if 'mae' not in existing_columns:
            print("Adding 'mae' column...")
            cursor.execute("""
                ALTER TABLE aluno 
                ADD COLUMN mae VARCHAR(100);
            """)
        
        # 2. Check if we need to rename 'nome' to 'nome_aluno'
        if 'nome' in existing_columns and 'nome_aluno' not in existing_columns:
            print("Renaming 'nome' column to 'nome_aluno'...")
            cursor.execute("""
                ALTER TABLE aluno 
                RENAME COLUMN nome TO nome_aluno;
            """)
        
        # 3. Check if we need to handle the id_turma foreign key change
        # This is tricky - we need to:
        # - Add a new id_turma column of type VARCHAR
        # - Populate it with turma.id_turma values based on the old turma_id
        # - Drop the old turma_id column
        # - Rename the new column to id_turma if needed
        
        id_turma_column_type = None
        if 'id_turma' in existing_columns:
            # Check its type
            cursor.execute("""
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'aluno' AND column_name = 'id_turma';
            """)
            id_turma_column_type = cursor.fetchone()[0]
        
        if 'id_turma' not in existing_columns or id_turma_column_type == 'integer':
            # We need to create a proper id_turma column of type VARCHAR
            # First, add a temporary column
            print("Adding temporary 'id_turma_str' column...")
            if 'id_turma_str' not in existing_columns:
                cursor.execute("""
                    ALTER TABLE aluno 
                    ADD COLUMN id_turma_str VARCHAR(10);
                """)
            
            # Populate it based on the old turma_id/id_turma if it exists
            if 'id_turma' in existing_columns and id_turma_column_type == 'integer':
                print("Populating 'id_turma_str' from existing 'id_turma' column...")
                cursor.execute("""
                    UPDATE aluno a
                    SET id_turma_str = t.id_turma
                    FROM turma t
                    WHERE a.id_turma = t.id;
                """)
            
            # Make it NOT NULL after populating
            print("Making 'id_turma_str' NOT NULL...")
            cursor.execute("""
                ALTER TABLE aluno 
                ALTER COLUMN id_turma_str SET NOT NULL;
            """)
            
            # Drop the old column if it exists
            if 'id_turma' in existing_columns:
                print("Dropping old 'id_turma' column...")
                cursor.execute("""
                    ALTER TABLE aluno 
                    DROP COLUMN id_turma;
                """)
            
            # Rename the new column to id_turma
            print("Renaming 'id_turma_str' to 'id_turma'...")
            cursor.execute("""
                ALTER TABLE aluno 
                RENAME COLUMN id_turma_str TO id_turma;
            """)
            
            # Add foreign key constraint
            print("Adding foreign key constraint on 'id_turma'...")
            cursor.execute("""
                ALTER TABLE aluno
                ADD CONSTRAINT fk_aluno_turma
                FOREIGN KEY (id_turma)
                REFERENCES turma(id_turma);
            """)
        
        # 4. Drop 'ativo' column if it exists
        if 'ativo' in existing_columns:
            print("Dropping 'ativo' column...")
            cursor.execute("""
                ALTER TABLE aluno 
                DROP COLUMN ativo;
            """)
        
        # Commit all changes
        conn.commit()
        print("Table 'aluno' structure modified successfully.")
        
        # Show the new structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'aluno' 
            ORDER BY ordinal_position;
        """)
        
        print("\nNew 'aluno' table structure:")
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
        print(f"Error altering 'aluno' table: {e}")
        return False

if __name__ == "__main__":
    fix_aluno_table() 