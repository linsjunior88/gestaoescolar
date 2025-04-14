import psycopg2

def fix_nota_table():
    """
    Fix nota table structure to match frontend requirements:
    - Rename columns to match frontend terminology
    - Add necessary fields for nota_mensal, nota_bimestral, recuperacao
    - Add ano and bimestre fields
    - Use string IDs (id_aluno, id_disciplina, id_turma) instead of database IDs
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
        
        # Drop the existing nota table if it exists (complete redesign)
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'nota'
            );
        """)
        
        if cursor.fetchone()[0]:
            print("Dropping existing 'nota' table...")
            cursor.execute("DROP TABLE IF EXISTS nota CASCADE;")
        
        # Create the new nota table
        print("Creating 'nota' table with correct structure...")
        cursor.execute("""
            CREATE TABLE nota (
                id SERIAL PRIMARY KEY,
                id_aluno VARCHAR(10) NOT NULL,
                id_disciplina VARCHAR(10) NOT NULL,
                id_turma VARCHAR(10) NOT NULL,
                ano INTEGER NOT NULL,
                bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
                nota_mensal NUMERIC(5,2),
                nota_bimestral NUMERIC(5,2),
                recuperacao NUMERIC(5,2),
                media NUMERIC(5,2),
                UNIQUE(id_aluno, id_disciplina, ano, bimestre),
                FOREIGN KEY (id_aluno) REFERENCES aluno(id_aluno),
                FOREIGN KEY (id_disciplina) REFERENCES disciplina(id_disciplina),
                FOREIGN KEY (id_turma) REFERENCES turma(id_turma)
            )
        """)
        
        # Create a view or table for media_final (yearly average)
        print("Creating 'media_final' view...")
        cursor.execute("""
            CREATE OR REPLACE VIEW media_final AS
            WITH nota_bimestres AS (
                SELECT 
                    id_aluno,
                    id_disciplina,
                    id_turma,
                    ano,
                    COUNT(bimestre) AS total_bimestres,
                    AVG(media) AS media_final
                FROM nota
                GROUP BY id_aluno, id_disciplina, id_turma, ano
            )
            SELECT 
                nb.*,
                CASE 
                    WHEN total_bimestres < 4 THEN 'Incompleto (' || total_bimestres || '/4 bimestres)'
                    WHEN media_final >= 7 THEN 'Aprovado por média'
                    WHEN media_final >= 5 THEN 'Aprovado com recuperação'
                    ELSE 'Reprovado'
                END AS situacao
            FROM nota_bimestres nb
        """)
        
        # Commit all changes
        conn.commit()
        print("Table 'nota' structure created successfully.")
        
        # Show the new structure
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'nota' 
            ORDER BY ordinal_position;
        """)
        
        print("\nNew 'nota' table structure:")
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
        print(f"Error creating 'nota' table: {e}")
        return False

if __name__ == "__main__":
    fix_nota_table() 