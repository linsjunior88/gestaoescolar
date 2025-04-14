import psycopg2
import sys

def main():
    print("Starting database fix script...")
    
    # Connect to database
    try:
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="postgres",
            host="localhost"
        )
        conn.autocommit = True
        cursor = conn.cursor()
        print("Connected to database successfully")
    except Exception as e:
        print(f"Database connection error: {e}")
        sys.exit(1)
    
    try:
        # 1. Check if professor_disciplina_turma table exists
        cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'professor_disciplina_turma'
        )
        """)
        table_exists = cursor.fetchone()[0]
        
        if not table_exists:
            print("Creating professor_disciplina_turma table...")
            cursor.execute("""
            CREATE TABLE professor_disciplina_turma (
                id SERIAL PRIMARY KEY,
                id_professor VARCHAR(20) NOT NULL,
                id_disciplina VARCHAR(20) NOT NULL,
                id_turma VARCHAR(20) NOT NULL,
                UNIQUE(id_professor, id_disciplina, id_turma)
            )
            """)
            print("Table created successfully")
        else:
            print("professor_disciplina_turma table already exists")
        
        # 2. Insert sample relationships for PROF002
        print("Adding relationships for PROF002...")
        
        # Check if the professor exists
        cursor.execute("SELECT id_professor FROM professor WHERE id_professor = 'PROF002'")
        professor_exists = cursor.fetchone()
        
        if not professor_exists:
            print("Professor PROF002 doesn't exist. Creating...")
            cursor.execute("""
            INSERT INTO professor (id_professor, nome_professor, email_professor, senha_professor)
            VALUES ('PROF002', 'Professor 2', 'prof2@escola.com', 'senha123')
            """)
            print("Professor PROF002 created")
        
        # Check if PORT discipline exists
        cursor.execute("SELECT id_disciplina FROM disciplina WHERE id_disciplina = 'PORT'")
        port_exists = cursor.fetchone()
        
        if not port_exists:
            print("Discipline PORT doesn't exist. Creating...")
            cursor.execute("""
            INSERT INTO disciplina (id_disciplina, nome_disciplina)
            VALUES ('PORT', 'Português')
            """)
            print("Discipline PORT created")
        
        # Check if 1A, 2A, 3A classes exist
        for turma_id in ['1A', '2A', '3A']:
            cursor.execute("SELECT id_turma FROM turma WHERE id_turma = %s", (turma_id,))
            turma_exists = cursor.fetchone()
            
            if not turma_exists:
                print(f"Class {turma_id} doesn't exist. Creating...")
                cursor.execute("""
                INSERT INTO turma (id_turma, serie, turno)
                VALUES (%s, %s, 'manha')
                """, (turma_id, f"{turma_id[0]}º Ano"))
                print(f"Class {turma_id} created")
        
        # Add relationships for PROF002
        relationships = [
            ('PROF002', 'PORT', '1A'),
            ('PROF002', 'PORT', '2A'),
            ('PROF002', 'PORT', '3A')
        ]
        
        for rel in relationships:
            prof_id, disc_id, turma_id = rel
            cursor.execute("""
            INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
            VALUES (%s, %s, %s)
            ON CONFLICT (id_professor, id_disciplina, id_turma) DO NOTHING
            """, (prof_id, disc_id, turma_id))
            print(f"Added relationship: {prof_id} - {disc_id} - {turma_id}")
        
        # 3. Count relationships
        cursor.execute("SELECT COUNT(*) FROM professor_disciplina_turma")
        count = cursor.fetchone()[0]
        print(f"Total relationships in database: {count}")
        
        # 4. List all relationships for PROF002
        cursor.execute("""
        SELECT p.id_professor, p.nome_professor, d.id_disciplina, d.nome_disciplina, t.id_turma, t.serie
        FROM professor_disciplina_turma pdt
        JOIN professor p ON pdt.id_professor = p.id_professor
        JOIN disciplina d ON pdt.id_disciplina = d.id_disciplina
        JOIN turma t ON pdt.id_turma = t.id_turma
        WHERE p.id_professor = 'PROF002'
        ORDER BY p.id_professor, d.id_disciplina, t.id_turma
        """)
        
        print("\nCurrent relationships for PROF002:")
        for row in cursor.fetchall():
            print(f"Professor: {row[0]} ({row[1]}), Subject: {row[2]} ({row[3]}), Class: {row[4]} ({row[5]})")
        
        print("\nScript completed successfully!")
        
    except Exception as e:
        print(f"Error during database operations: {e}")
    finally:
        cursor.close()
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main() 