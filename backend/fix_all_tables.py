import psycopg2
from fix_turma_table import fix_turma_table
from fix_disciplina_table import fix_disciplina_table
from fix_professor_table import fix_professor_table
from fix_aluno_table import fix_aluno_table
from create_turma_disciplina_table import create_turma_disciplina_table
from create_professor_disciplina_turma_table import create_professor_disciplina_turma_table
from fix_nota_table import fix_nota_table

def fix_all_tables():
    """
    Fix all tables in the correct order to match frontend requirements
    """
    print("\n===== FIXING DATABASE TABLES TO MATCH FRONTEND =====\n")
    
    # Execute each fix in the correct order
    print("\n----- 1. FIXING TURMA TABLE -----")
    success_turma = fix_turma_table()
    if not success_turma:
        print("Failed to fix turma table. Exiting.")
        return False
    
    print("\n----- 2. FIXING DISCIPLINA TABLE -----")
    success_disciplina = fix_disciplina_table()
    if not success_disciplina:
        print("Failed to fix disciplina table. Exiting.")
        return False
    
    print("\n----- 3. CREATING TURMA_DISCIPLINA TABLE -----")
    success_turma_disciplina = create_turma_disciplina_table()
    if not success_turma_disciplina:
        print("Failed to create turma_disciplina table. Exiting.")
        return False
    
    print("\n----- 4. FIXING PROFESSOR TABLE -----")
    success_professor = fix_professor_table()
    if not success_professor:
        print("Failed to fix professor table. Exiting.")
        return False
    
    print("\n----- 5. CREATING PROFESSOR_DISCIPLINA_TURMA TABLE -----")
    success_prof_disc_turma = create_professor_disciplina_turma_table()
    if not success_prof_disc_turma:
        print("Failed to create professor_disciplina_turma table. Exiting.")
        return False
    
    print("\n----- 6. FIXING ALUNO TABLE -----")
    success_aluno = fix_aluno_table()
    if not success_aluno:
        print("Failed to fix aluno table. Exiting.")
        return False
    
    print("\n----- 7. FIXING NOTA TABLE -----")
    success_nota = fix_nota_table()
    if not success_nota:
        print("Failed to fix nota table. Exiting.")
        return False
    
    # Create a list of all tables with their columns to verify final structure
    conn = None
    try:
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s@",
            host="localhost",
            port="5432"
        )
        
        cursor = conn.cursor()
        
        # Get list of all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        
        tables = [row[0] for row in cursor.fetchall()]
        
        print("\n===== FINAL DATABASE STRUCTURE =====\n")
        
        for table in tables:
            cursor.execute(f"""
                SELECT column_name, data_type
                FROM information_schema.columns 
                WHERE table_name = '{table}' 
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            
            print(f"Table: {table}")
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")
            print()
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        if conn:
            conn.close()
        print(f"Error verifying final structure: {e}")
    
    print("\n===== ALL TABLES FIXED SUCCESSFULLY =====\n")
    return True

if __name__ == "__main__":
    fix_all_tables() 