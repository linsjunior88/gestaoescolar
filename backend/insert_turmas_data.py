import psycopg2

def insert_turmas():
    """
    Insert sample data into the turma table
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
        
        # Sample data for turmas - real data from frontend
        turmas = [
            ('01AM', '1 PERIODO', 'MANHA', 'NORMAL', 'GIRLENE ADRIANO DOS ANJOS'),
            ('01AT', '1 PERIODO', 'TARDE', 'EJA', 'GIRLENE ADRIANO DOS ANJOS'),
            ('02AM', '2 PERIODO', 'MANHA', 'MULTI_SERIADO_EJA', 'GIRLENE ADRIANO DOS ANJOS'),
            ('02AT', '2 PERIODO', 'TARDE', 'NORMAL', 'GIRLENE ADRIANO DOS ANJOS')
        ]
        
        # Insert data
        print("Inserting data into 'turma' table...")
        for turma in turmas:
            cursor.execute("""
                INSERT INTO turma (id_turma, serie, turno, tipo_turma, coordenador)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id_turma) DO UPDATE 
                SET serie = EXCLUDED.serie,
                    turno = EXCLUDED.turno,
                    tipo_turma = EXCLUDED.tipo_turma,
                    coordenador = EXCLUDED.coordenador
                RETURNING id;
            """, turma)
            
            turma_id = cursor.fetchone()[0]
            print(f"Inserted turma {turma[0]} with ID {turma_id}")
        
        # Commit changes
        conn.commit()
        
        # Verify the inserted data
        cursor.execute("SELECT * FROM turma ORDER BY id_turma;")
        rows = cursor.fetchall()
        
        print("\nTurma data in database:")
        for row in rows:
            print(row)
        
        # Close cursor and connection
        cursor.close()
        conn.close()
        
        print("\nTurma data inserted successfully!")
        return True
        
    except Exception as e:
        # Rollback in case of error
        if conn:
            conn.rollback()
        print(f"Error inserting turma data: {e}")
        return False

if __name__ == "__main__":
    insert_turmas() 