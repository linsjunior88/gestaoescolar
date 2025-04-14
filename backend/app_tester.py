import os
import sys
from datetime import date

# Adicionar o diretório raiz ao path para importações relativas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, SessionLocal, Base
from app.models.turma import Turma
from app.models.disciplina import Disciplina, TurmaDisciplina
from app.models.professor import Professor, ProfessorDisciplinaTurma
from app.models.aluno import Aluno
from app.models.nota import Nota

def test_database():
    """
    Testa a conexão com o banco de dados e executa algumas consultas básicas.
    """
    try:
        # Criar a sessão
        db = SessionLocal()
        
        print("===== Testando conexão com o banco de dados =====")
        
        # Verificar se já existem turmas
        print("\n--- Consultando tabela 'turma' ---")
        turmas = db.query(Turma).all()
        if turmas:
            print(f"Encontradas {len(turmas)} turmas:")
            for turma in turmas:
                print(f"ID: {turma.id}, ID_TURMA: {turma.id_turma}, Série: {turma.serie}, Turno: {turma.turno}")
        else:
            print("Nenhuma turma encontrada.")
        
        # Verificar se já existem disciplinas
        print("\n--- Consultando tabela 'disciplina' ---")
        disciplinas = db.query(Disciplina).all()
        if disciplinas:
            print(f"Encontradas {len(disciplinas)} disciplinas:")
            for disciplina in disciplinas:
                print(f"ID: {disciplina.id}, ID_DISCIPLINA: {disciplina.id_disciplina}, Nome: {disciplina.nome_disciplina}")
        else:
            print("Nenhuma disciplina encontrada.")
        
        # Verificar se já existem professores
        print("\n--- Consultando tabela 'professor' ---")
        professores = db.query(Professor).all()
        if professores:
            print(f"Encontrados {len(professores)} professores:")
            for professor in professores:
                print(f"ID: {professor.id}, ID_PROFESSOR: {professor.id_professor}, Nome: {professor.nome_professor}")
        else:
            print("Nenhum professor encontrado.")
        
        # Verificar se já existem alunos
        print("\n--- Consultando tabela 'aluno' ---")
        alunos = db.query(Aluno).all()
        if alunos:
            print(f"Encontrados {len(alunos)} alunos:")
            for aluno in alunos:
                print(f"ID: {aluno.id}, ID_ALUNO: {aluno.id_aluno}, Nome: {aluno.nome_aluno}, Turma: {aluno.id_turma}")
        else:
            print("Nenhum aluno encontrado.")
        
        # Verificar se já existem notas
        print("\n--- Consultando tabela 'nota' ---")
        notas = db.query(Nota).all()
        if notas:
            print(f"Encontradas {len(notas)} notas:")
            for nota in notas:
                print(f"ID: {nota.id}, Aluno: {nota.id_aluno}, Disciplina: {nota.id_disciplina}, Bimestre: {nota.bimestre}, Média: {nota.media}")
        else:
            print("Nenhuma nota encontrada.")
        
        # Testar inserção de dados (apenas se não houver nenhum registro nas tabelas)
        if not turmas:
            print("\n--- Inserindo turma de teste ---")
            nova_turma = Turma(
                id_turma="TESTE",
                serie="1º Ano",
                turno="Manhã",
                tipo_turma="Regular",
                coordenador="Coordenador Teste"
            )
            db.add(nova_turma)
            db.commit()
            print("Turma inserida com sucesso!")
            
            # Consultar a turma inserida
            turma_inserida = db.query(Turma).filter(Turma.id_turma == "TESTE").first()
            print(f"Turma inserida: ID: {turma_inserida.id}, ID_TURMA: {turma_inserida.id_turma}, Série: {turma_inserida.serie}")
        
        db.close()
        print("\n===== Teste concluído com sucesso! =====")
        
    except Exception as e:
        print(f"Erro durante o teste: {e}")
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    test_database() 