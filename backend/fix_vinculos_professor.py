import psycopg2
from psycopg2.extras import RealDictCursor
import sys

# Database connection function
def get_db_connection():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="postgres",
            host="localhost",
            client_encoding='utf8'
        )
        print("Database connection successful")
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        sys.exit(1)

def execute_query(query, params=None, fetch=True, fetch_one=False):
    """Execute a database query and return results"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            print(f"Executing query: {query}")
            print(f"With parameters: {params}")
            cursor.execute(query, params)
            
            if fetch:
                if fetch_one:
                    result = cursor.fetchone()
                else:
                    result = cursor.fetchall()
                print(f"Query result: {result}")
                return result
            else:
                conn.commit()
                affected = cursor.rowcount
                print(f"Rows affected: {affected}")
                return affected
    except Exception as e:
        conn.rollback()
        print(f"Query execution error: {e}")
        return None
    finally:
        conn.close()

def check_professor(professor_id):
    """Check if a professor exists in the database"""
    print(f"Checking if professor {professor_id} exists...")
    query = "SELECT id, id_professor FROM professor WHERE id_professor = %s"
    result = execute_query(query, (professor_id,), fetch_one=True)
    if result:
        print(f"Professor {professor_id} found with ID {result['id']}")
    else:
        print(f"Professor {professor_id} NOT found")
    return result

def check_turma(turma_id):
    """Check if a class exists in the database"""
    print(f"Checking if class {turma_id} exists...")
    query = "SELECT id, id_turma FROM turma WHERE id_turma = %s"
    result = execute_query(query, (turma_id,), fetch_one=True)
    if result:
        print(f"Class {turma_id} found with ID {result['id']}")
    else:
        print(f"Class {turma_id} NOT found")
    return result

def check_disciplina(disciplina_id):
    """Check if a subject exists in the database"""
    print(f"Checking if subject {disciplina_id} exists...")
    query = "SELECT id, id_disciplina FROM disciplina WHERE id_disciplina = %s"
    result = execute_query(query, (disciplina_id,), fetch_one=True)
    if result:
        print(f"Subject {disciplina_id} found with ID {result['id']}")
    else:
        print(f"Subject {disciplina_id} NOT found")
    return result

def add_vinculo(professor_id, disciplina_id, turma_id):
    """Add a relationship between professor, subject and class"""
    print(f"\nAttempting to add relationship: Professor {professor_id} - Subject {disciplina_id} - Class {turma_id}")
    
    # Check if entities exist
    professor = check_professor(professor_id)
    if not professor:
        print(f"ERROR: Professor {professor_id} not found")
        return False
    
    disciplina = check_disciplina(disciplina_id)
    if not disciplina:
        print(f"ERROR: Subject {disciplina_id} not found")
        return False
    
    turma = check_turma(turma_id)
    if not turma:
        print(f"ERROR: Class {turma_id} not found")
        return False
    
    # Check if relationship already exists
    check_query = """
    SELECT id FROM professor_disciplina_turma
    WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
    """
    existing = execute_query(check_query, (professor_id, disciplina_id, turma_id), fetch_one=True)
    
    if existing:
        print(f"Relationship already exists for professor {professor_id}, discipline {disciplina_id}, class {turma_id}")
        return True
    
    # Create the relationship
    insert_query = """
    INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
    VALUES (%s, %s, %s)
    RETURNING id
    """
    
    try:
        result = execute_query(insert_query, (professor_id, disciplina_id, turma_id), fetch_one=True)
        if result:
            print(f"SUCCESS: Relationship created with ID {result['id']}")
            return True
        else:
            print(f"ERROR: Failed to create relationship")
            return False
    except Exception as e:
        print(f"ERROR creating relationship: {e}")
        return False

def main():
    """Main function to fix professor relationships"""
    print("=" * 80)
    print("STARTING PROFESSOR RELATIONSHIP FIX SCRIPT")
    print("=" * 80)
    
    # Define relationships to create
    relationships = [
        # Professor PROF001
        ("PROF001", "MAT", "1A"),
        ("PROF001", "MAT", "2A"),
        ("PROF001", "FIS", "3A"),
        
        # Professor PROF002
        ("PROF002", "PORT", "1A"),
        ("PROF002", "PORT", "2A"),
        ("PROF002", "PORT", "3A"),
        ("PROF002", "HIST", "1A"),
        
        # Professor PROF003
        ("PROF003", "BIO", "1A"),
        ("PROF003", "BIO", "2A"),
        ("PROF003", "BIO", "3A"),
        ("PROF003", "QUIM", "3A")
    ]
    
    # Count successes and failures
    success_count = 0
    failure_count = 0
    
    # Process each relationship
    for rel in relationships:
        professor_id, disciplina_id, turma_id = rel
        result = add_vinculo(professor_id, disciplina_id, turma_id)
        if result:
            success_count += 1
        else:
            failure_count += 1
    
    # Display results
    print("\n" + "=" * 80)
    print(f"PROCESSING COMPLETE. SUCCESSES: {success_count}, FAILURES: {failure_count}")
    
    # Verify total relationships in the database
    count_query = "SELECT COUNT(*) as total FROM professor_disciplina_turma"
    count_result = execute_query(count_query, fetch_one=True)
    total = count_result['total'] if count_result else 0
    
    print(f"TOTAL RELATIONSHIPS IN DATABASE: {total}")
    
    # List all relationships
    list_query = """
    SELECT p.id_professor, p.nome_professor, d.id_disciplina, d.nome_disciplina, t.id_turma, t.serie
    FROM professor_disciplina_turma pdt
    JOIN professor p ON pdt.id_professor = p.id_professor
    JOIN disciplina d ON pdt.id_disciplina = d.id_disciplina
    JOIN turma t ON pdt.id_turma = t.id_turma
    ORDER BY p.id_professor, d.id_disciplina, t.id_turma
    """
    
    relationships = execute_query(list_query)
    print("\nCURRENT RELATIONSHIPS IN DATABASE:")
    for rel in relationships:
        print(f"Professor: {rel['id_professor']} ({rel['nome_professor']}), " +
              f"Subject: {rel['id_disciplina']} ({rel['nome_disciplina']}), " +
              f"Class: {rel['id_turma']} ({rel['serie']})")
    
    print("=" * 80)
    print("SCRIPT COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    main() 