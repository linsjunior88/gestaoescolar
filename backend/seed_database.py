"""
Script para preencher o banco de dados com dados iniciais de teste.

Este script insere dados de teste nas tabelas do sistema de gestão escolar,
incluindo turmas, disciplinas, professores, alunos e notas.
"""
import psycopg2
import sys
import traceback
from datetime import date, timedelta
import random

# Parâmetros de conexão para o banco
DB_PARAMS = {
    'dbname': 'gestao_escolar',
    'user': 'postgres',
    'password': '4chrOn0s',  # Senha sem o caractere @
    'host': 'localhost',
    'port': '5432',
}

def seed_database():
    """
    Preenche o banco de dados com dados iniciais de teste.
    """
    conn = None
    try:
        print(f"Conectando ao banco de dados 'gestao_escolar'...")
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = False
        cursor = conn.cursor()
        
        # Limpar dados existentes (opcional)
        print("Limpando dados existentes...")
        cursor.execute("DELETE FROM nota")
        cursor.execute("DELETE FROM professor_disciplina_turma")
        cursor.execute("DELETE FROM turma_disciplina")
        cursor.execute("DELETE FROM aluno")
        cursor.execute("DELETE FROM professor")
        cursor.execute("DELETE FROM disciplina")
        cursor.execute("DELETE FROM turma")
        
        # Inserir turmas
        print("Inserindo turmas...")
        turmas = [
            ('1A', '1º Ano A', 2023, 'Matutino', 'Regular', 'Maria Silva'),
            ('2B', '2º Ano B', 2023, 'Vespertino', 'Regular', 'João Santos'),
            ('3C', '3º Ano C', 2023, 'Noturno', 'Regular', 'Ana Oliveira'),
        ]
        for turma in turmas:
            cursor.execute(
                "INSERT INTO turma (id_turma, nome, ano, periodo, tipo_turma, coordenador) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                turma
            )
        
        # Coletar IDs das turmas inseridas
        cursor.execute("SELECT id FROM turma")
        turma_ids = [row[0] for row in cursor.fetchall()]
        
        # Inserir disciplinas
        print("Inserindo disciplinas...")
        disciplinas = [
            ('Matemática', 'Estudo dos números, formas e padrões', 80),
            ('Português', 'Estudo da língua portuguesa e literatura', 80),
            ('História', 'Estudo de eventos e processos históricos', 60),
            ('Geografia', 'Estudo dos aspectos físicos e humanos do planeta', 60),
            ('Física', 'Estudo da matéria, energia e suas interações', 60),
            ('Química', 'Estudo das substâncias e suas transformações', 60),
            ('Biologia', 'Estudo dos seres vivos e suas interações', 60),
            ('Inglês', 'Estudo da língua inglesa', 40),
        ]
        for disciplina in disciplinas:
            cursor.execute(
                "INSERT INTO disciplina (nome, descricao, carga_horaria) VALUES (%s, %s, %s) RETURNING id",
                disciplina
            )
        
        # Coletar IDs das disciplinas inseridas
        cursor.execute("SELECT id FROM disciplina")
        disciplina_ids = [row[0] for row in cursor.fetchall()]
        
        # Inserir professores
        print("Inserindo professores...")
        professores = [
            ('Ana Silva', 'ana.silva@escola.edu', 'Matemática'),
            ('Carlos Oliveira', 'carlos.oliveira@escola.edu', 'Português'),
            ('Mariana Santos', 'mariana.santos@escola.edu', 'História'),
            ('Ricardo Almeida', 'ricardo.almeida@escola.edu', 'Geografia'),
            ('Patrícia Lima', 'patricia.lima@escola.edu', 'Física'),
            ('Fernando Costa', 'fernando.costa@escola.edu', 'Química'),
            ('Juliana Ferreira', 'juliana.ferreira@escola.edu', 'Biologia'),
            ('Roberto Martins', 'roberto.martins@escola.edu', 'Inglês'),
        ]
        for professor in professores:
            cursor.execute(
                "INSERT INTO professor (nome, email, especialidade) VALUES (%s, %s, %s) RETURNING id",
                professor
            )
        
        # Coletar IDs dos professores inseridos
        cursor.execute("SELECT id FROM professor")
        professor_ids = [row[0] for row in cursor.fetchall()]
        
        # Relacionar turmas e disciplinas
        print("Relacionando turmas e disciplinas...")
        for turma_id in turma_ids:
            # Cada turma terá todas as disciplinas
            for disciplina_id in disciplina_ids:
                cursor.execute(
                    "INSERT INTO turma_disciplina (turma_id, disciplina_id) VALUES (%s, %s)",
                    (turma_id, disciplina_id)
                )
        
        # Relacionar professores, disciplinas e turmas
        print("Relacionando professores, disciplinas e turmas...")
        for i, professor_id in enumerate(professor_ids):
            # Cada professor terá uma disciplina específica em todas as turmas
            disciplina_id = disciplina_ids[i % len(disciplina_ids)]
            for turma_id in turma_ids:
                cursor.execute(
                    "INSERT INTO professor_disciplina_turma (professor_id, disciplina_id, turma_id) VALUES (%s, %s, %s)",
                    (professor_id, disciplina_id, turma_id)
                )
        
        # Inserir alunos
        print("Inserindo alunos...")
        nomes = [
            'João', 'Maria', 'Pedro', 'Ana', 'Lucas', 'Juliana', 'Gabriel', 'Beatriz',
            'Mateus', 'Carolina', 'Rafael', 'Larissa', 'Guilherme', 'Amanda', 'Vinícius',
            'Isabela', 'Gustavo', 'Manuela', 'Felipe', 'Laura'
        ]
        sobrenomes = [
            'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida',
            'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Alves'
        ]
        
        # Gerar 15 alunos distribuídos entre as turmas
        alunos_por_turma = {}
        for i in range(15):
            nome = f"{random.choice(nomes)} {random.choice(sobrenomes)}"
            email = f"{nome.lower().replace(' ', '.')}@aluno.edu"
            data_nascimento = date(2000 + random.randint(0, 10), random.randint(1, 12), random.randint(1, 28))
            endereco = f"Rua {random.randint(1, 100)}, Bairro {random.choice(['Centro', 'Jardim', 'Vila', 'Parque'])}"
            turma_id = random.choice(turma_ids)
            
            cursor.execute(
                "INSERT INTO aluno (nome, email, data_nascimento, endereco, turma_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (nome, email, data_nascimento, endereco, turma_id)
            )
            aluno_id = cursor.fetchone()[0]
            
            if turma_id not in alunos_por_turma:
                alunos_por_turma[turma_id] = []
            alunos_por_turma[turma_id].append(aluno_id)
        
        # Inserir notas
        print("Inserindo notas...")
        tipos_avaliacao = ['Prova 1', 'Prova 2', 'Trabalho', 'Participação']
        data_atual = date.today()
        
        for turma_id, aluno_ids in alunos_por_turma.items():
            # Obter disciplinas para esta turma
            cursor.execute("SELECT disciplina_id FROM turma_disciplina WHERE turma_id = %s", (turma_id,))
            disciplina_ids_turma = [row[0] for row in cursor.fetchall()]
            
            for aluno_id in aluno_ids:
                for disciplina_id in disciplina_ids_turma:
                    for tipo_avaliacao in tipos_avaliacao:
                        # Gerar nota entre 0 e 10, com até 2 casas decimais
                        valor = round(random.uniform(3.0, 10.0), 2)
                        data_avaliacao = data_atual - timedelta(days=random.randint(0, 180))
                        
                        cursor.execute(
                            "INSERT INTO nota (aluno_id, disciplina_id, valor, data_avaliacao, tipo_avaliacao) VALUES (%s, %s, %s, %s, %s)",
                            (aluno_id, disciplina_id, valor, data_avaliacao, tipo_avaliacao)
                        )
        
        # Commit da transação
        conn.commit()
        print("Dados de teste inseridos com sucesso!")
        
    except Exception as e:
        print(f"Erro ao inserir dados de teste: {e}")
        traceback.print_exc()
        if conn:
            conn.rollback()
        sys.exit(1)
    finally:
        if conn:
            conn.close()
            
if __name__ == "__main__":
    seed_database()
    print("Script concluído. Banco de dados populado com dados de teste.") 