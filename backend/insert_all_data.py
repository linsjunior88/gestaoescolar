import psycopg2
import os

def insert_all_data():
    """
    Execute all SQL insert scripts in the correct order
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
        
        # Path to scripts directory
        script_dir = os.path.join(os.path.dirname(__file__), "insert_scripts")
        
        # Define scripts and their execution order
        scripts = [
            "insert_turmas.sql",
            "insert_disciplinas.sql",
            "insert_turma_disciplina.sql",
            "insert_professores.sql",
            "insert_prof_disc_turma.sql",
            "insert_alunos.sql",
            "insert_notas.sql"
        ]
        
        # Execute each script
        for script_name in scripts:
            script_path = os.path.join(script_dir, script_name)
            
            if os.path.exists(script_path):
                print(f"Executing {script_name}...")
                with open(script_path, 'r') as f:
                    script_content = f.read()
                    cursor.execute(script_content)
                print(f"Successfully executed {script_name}")
            else:
                print(f"Warning: Script {script_path} not found, skipping")
        
        # Commit all changes
        conn.commit()
        print("All data inserted successfully!")
        
        # Close cursor and connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        # Rollback in case of error
        if conn:
            conn.rollback()
        print(f"Error inserting data: {e}")
        return False

if __name__ == "__main__":
    # Make sure the insert_scripts directory exists
    script_dir = os.path.join(os.path.dirname(__file__), "insert_scripts")
    os.makedirs(script_dir, exist_ok=True)
    
    insert_all_data() 