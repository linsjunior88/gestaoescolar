import psycopg2

def seed_data():
    """
    Insert initial data into tables
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
        
        # ===== 1. INSERT TURMAS =====
        print("Inserting data into 'turma' table...")
        # Example data for turmas
        turmas = [
            ('T001', '1º Ano A', 2025, True),
            ('T002', '2º Ano A', 2025, True),
            ('T003', '3º Ano A', 2025, True),
            ('T004', '4º Ano A', 2025, True),
            ('T005', '5º Ano A', 2025, True),
        ]
        
        for turma in turmas:
            cursor.execute("""
                INSERT INTO turma (id_turma, nome, ano, ativo)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id_turma) DO UPDATE 
                SET nome = EXCLUDED.nome, 
                    ano = EXCLUDED.ano, 
                    ativo = EXCLUDED.ativo
                RETURNING id;
            """, turma)
            # Get the ID of the inserted turma
            turma_id = cursor.fetchone()[0]
            print(f"Inserted turma {turma[0]} with ID {turma_id}")
            
        # ===== 2. INSERT DISCIPLINAS =====
        print("\nInserting data into 'disciplina' table...")
        # Example data for disciplinas
        disciplinas = [
            ('D001', 'Português', 'Língua Portuguesa e Literatura', 80, True),
            ('D002', 'Matemática', 'Matemática Básica', 80, True),
            ('D003', 'Ciências', 'Ciências Naturais', 60, True),
            ('D004', 'História', 'História Geral e do Brasil', 60, True),
            ('D005', 'Geografia', 'Geografia Geral e do Brasil', 60, True),
            ('D006', 'Educação Física', 'Práticas Esportivas', 40, True),
            ('D007', 'Artes', 'Artes Visuais e Música', 40, True),
        ]
        
        for disciplina in disciplinas:
            cursor.execute("""
                INSERT INTO disciplina (id_disciplina, nome, descricao, carga_horaria, ativo)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id_disciplina) DO UPDATE 
                SET nome = EXCLUDED.nome, 
                    descricao = EXCLUDED.descricao, 
                    carga_horaria = EXCLUDED.carga_horaria, 
                    ativo = EXCLUDED.ativo
                RETURNING id;
            """, disciplina)
            # Get the ID of the inserted disciplina
            disciplina_id = cursor.fetchone()[0]
            print(f"Inserted disciplina {disciplina[0]} with ID {disciplina_id}")
            
        # ===== 3. INSERT PROFESSORES =====
        print("\nInserting data into 'professor' table...")
        # Example data for professores - IMPORTANTE: as senhas devem ser hasheadas em produção!
        professores = [
            ('P001', 'Maria Silva', 'maria.silva@escola.edu.br', 'senha123', True),
            ('P002', 'João Santos', 'joao.santos@escola.edu.br', 'senha123', True),
            ('P003', 'Ana Oliveira', 'ana.oliveira@escola.edu.br', 'senha123', True),
            ('P004', 'Carlos Pereira', 'carlos.pereira@escola.edu.br', 'senha123', True),
            ('P005', 'Juliana Lima', 'juliana.lima@escola.edu.br', 'senha123', True),
        ]
        
        for professor in professores:
            cursor.execute("""
                INSERT INTO professor (id_professor, nome, email, senha, ativo)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id_professor) DO UPDATE 
                SET nome = EXCLUDED.nome, 
                    email = EXCLUDED.email, 
                    senha = EXCLUDED.senha, 
                    ativo = EXCLUDED.ativo
                RETURNING id;
            """, professor)
            # Get the ID of the inserted professor
            professor_id = cursor.fetchone()[0]
            print(f"Inserted professor {professor[0]} with ID {professor_id}")
            
        # ===== 4. INSERT ALUNOS =====
        print("\nInserting data into 'aluno' table...")
        # First, we need to get turma_ids
        cursor.execute("SELECT id, id_turma FROM turma;")
        turmas_map = {id_turma: id for id, id_turma in cursor.fetchall()}
        
        # Example data for alunos - id_aluno, nome, data_nasc, id_turma (ID da turma, não o código), ativo
        alunos = [
            ('A001', 'Pedro Alves', '2018-03-15', turmas_map['T001'], True),
            ('A002', 'Mariana Costa', '2018-05-22', turmas_map['T001'], True),
            ('A003', 'Lucas Ferreira', '2017-09-10', turmas_map['T002'], True),
            ('A004', 'Isabela Martins', '2017-07-05', turmas_map['T002'], True),
            ('A005', 'Gabriel Souza', '2016-11-18', turmas_map['T003'], True),
            ('A006', 'Sophia Ribeiro', '2016-02-28', turmas_map['T003'], True),
            ('A007', 'Mateus Gomes', '2015-12-07', turmas_map['T004'], True),
            ('A008', 'Laura Dias', '2015-04-17', turmas_map['T004'], True),
            ('A009', 'Rafael Castro', '2014-08-25', turmas_map['T005'], True),
            ('A010', 'Valentina Cardoso', '2014-06-12', turmas_map['T005'], True),
        ]
        
        for aluno in alunos:
            cursor.execute("""
                INSERT INTO aluno (id_aluno, nome, data_nasc, id_turma, ativo)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id_aluno) DO UPDATE 
                SET nome = EXCLUDED.nome, 
                    data_nasc = EXCLUDED.data_nasc, 
                    id_turma = EXCLUDED.id_turma, 
                    ativo = EXCLUDED.ativo
                RETURNING id;
            """, aluno)
            # Get the ID of the inserted aluno
            aluno_id = cursor.fetchone()[0]
            print(f"Inserted aluno {aluno[0]} with ID {aluno_id}")
            
        # ===== 5. INSERT DISCIPLINA_PROFESSOR (ASSIGNMENTS) =====
        print("\nInserting data into 'disciplina_professor' table...")
        # Get disciplina_ids and professor_ids
        cursor.execute("SELECT id, id_disciplina FROM disciplina;")
        disciplinas_map = {id_disciplina: id for id, id_disciplina in cursor.fetchall()}
        
        cursor.execute("SELECT id, id_professor FROM professor;")
        professores_map = {id_professor: id for id, id_professor in cursor.fetchall()}
        
        # Example data for disciplina_professor - professor_id, disciplina_id, turma_id
        # Assign professors to disciplines and classes
        assignments = [
            (professores_map['P001'], disciplinas_map['D001'], turmas_map['T001']),  # Maria (Português) para 1º Ano
            (professores_map['P001'], disciplinas_map['D001'], turmas_map['T002']),  # Maria (Português) para 2º Ano
            (professores_map['P002'], disciplinas_map['D002'], turmas_map['T001']),  # João (Matemática) para 1º Ano
            (professores_map['P002'], disciplinas_map['D002'], turmas_map['T002']),  # João (Matemática) para 2º Ano
            (professores_map['P003'], disciplinas_map['D003'], turmas_map['T001']),  # Ana (Ciências) para 1º Ano
            (professores_map['P004'], disciplinas_map['D004'], turmas_map['T003']),  # Carlos (História) para 3º Ano
            (professores_map['P005'], disciplinas_map['D005'], turmas_map['T003']),  # Juliana (Geografia) para 3º Ano
            (professores_map['P003'], disciplinas_map['D006'], turmas_map['T004']),  # Ana (Ed. Física) para 4º Ano
            (professores_map['P005'], disciplinas_map['D007'], turmas_map['T005']),  # Juliana (Artes) para 5º Ano
        ]
        
        for assignment in assignments:
            cursor.execute("""
                INSERT INTO disciplina_professor (professor_id, disciplina_id, turma_id)
                VALUES (%s, %s, %s)
                ON CONFLICT (professor_id, disciplina_id, turma_id) DO NOTHING
                RETURNING id;
            """, assignment)
            # Check if we got an ID back (meaning it was inserted, not skipped due to conflict)
            result = cursor.fetchone()
            if result:
                print(f"Assigned professor {assignment[0]} to teach discipline {assignment[1]} for class {assignment[2]}")
            
        # ===== 6. INSERT NOTAS =====
        print("\nInserting data into 'nota' table...")
        # Get aluno_ids
        cursor.execute("SELECT id, id_aluno FROM aluno;")
        alunos_map = {id_aluno: id for id, id_aluno in cursor.fetchall()}
        
        # Example data for notas - aluno_id, disciplina_id, turma_id, nota1, nota2, nota3, nota4, media, ano, bimestre
        notas = [
            # Aluno Pedro (A001) - Português (D001) - 1º Ano (T001)
            (alunos_map['A001'], disciplinas_map['D001'], turmas_map['T001'], 8.5, 7.0, 9.0, 8.0, 8.125, 2025, 1),
            
            # Aluno Pedro (A001) - Matemática (D002) - 1º Ano (T001)
            (alunos_map['A001'], disciplinas_map['D002'], turmas_map['T001'], 7.5, 8.0, 6.5, 7.0, 7.25, 2025, 1),
            
            # Aluna Mariana (A002) - Português (D001) - 1º Ano (T001)
            (alunos_map['A002'], disciplinas_map['D001'], turmas_map['T001'], 9.0, 9.5, 8.5, 9.0, 9.0, 2025, 1),
            
            # Aluna Mariana (A002) - Matemática (D002) - 1º Ano (T001)
            (alunos_map['A002'], disciplinas_map['D002'], turmas_map['T001'], 8.0, 8.5, 9.0, 8.5, 8.5, 2025, 1),
            
            # Aluno Lucas (A003) - Português (D001) - 2º Ano (T002)
            (alunos_map['A003'], disciplinas_map['D001'], turmas_map['T002'], 7.0, 7.5, 8.0, 7.5, 7.5, 2025, 1),
            
            # Aluno Lucas (A003) - Matemática (D002) - 2º Ano (T002)
            (alunos_map['A003'], disciplinas_map['D002'], turmas_map['T002'], 9.5, 9.0, 9.5, 9.0, 9.25, 2025, 1),
        ]
        
        for nota in notas:
            cursor.execute("""
                INSERT INTO nota (aluno_id, disciplina_id, turma_id, nota1, nota2, nota3, nota4, media, ano, bimestre)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (aluno_id, disciplina_id, ano, bimestre) DO UPDATE 
                SET nota1 = EXCLUDED.nota1, 
                    nota2 = EXCLUDED.nota2, 
                    nota3 = EXCLUDED.nota3, 
                    nota4 = EXCLUDED.nota4, 
                    media = EXCLUDED.media
                RETURNING id;
            """, nota)
            # Get the ID of the inserted nota
            nota_id = cursor.fetchone()[0]
            print(f"Inserted nota for aluno {nota[0]} in disciplina {nota[1]} with ID {nota_id}")
            
        # Commit the transaction
        conn.commit()
        print("\nAll data inserted successfully!")
            
        # Close cursor and connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        # Rollback in case of error
        conn.rollback()
        print(f"Error seeding data: {e}")
        return False

if __name__ == "__main__":
    seed_data() 