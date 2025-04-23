"""
Script para verificar e inicializar o banco de dados
Este script testa a conexão com o banco de dados, cria as tabelas necessárias
e insere dados de exemplo se o banco estiver vazio.
"""
import sys
import os
import logging
from db_config import test_db_connection, create_tables, execute_query

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def inicializar_banco_dados():
    """
    Inicializa o banco de dados com tabelas e dados de exemplo
    """
    logger.info("Iniciando verificação do banco de dados...")
    
    # Testar conexão com o banco
    status = test_db_connection()
    if status["status"] == "error":
        logger.error(f"Falha na conexão com o banco de dados: {status['message']}")
        return False
    
    logger.info(f"Conexão com o banco de dados estabelecida: {status['version']}")
    
    # Criar tabelas
    tables_status = create_tables()
    if tables_status["status"] == "error":
        logger.error(f"Falha ao criar tabelas: {tables_status['message']}")
        return False
    
    logger.info("Tabelas verificadas/criadas com sucesso")
    
    # Verificar se já existem dados
    try:
        turmas_count = execute_query("SELECT COUNT(*) FROM turma", fetch_one=True)[0]
        if turmas_count > 0:
            logger.info(f"Banco de dados já contém dados ({turmas_count} turmas encontradas)")
            return True
        
        # Inserir dados de exemplo se o banco estiver vazio
        logger.info("Banco de dados vazio. Inserindo dados de exemplo...")
        inserir_dados_exemplo()
        logger.info("Dados de exemplo inseridos com sucesso")
        return True
    
    except Exception as e:
        logger.error(f"Erro ao verificar ou inserir dados: {e}")
        return False

def inserir_dados_exemplo():
    """
    Insere dados de exemplo no banco de dados
    """
    # Inserir turmas
    turmas = [
        ("1º Ano A", 1, "Manhã"),
        ("1º Ano B", 1, "Tarde"),
        ("2º Ano A", 2, "Manhã"),
        ("2º Ano B", 2, "Tarde"),
        ("3º Ano A", 3, "Manhã"),
        ("3º Ano B", 3, "Tarde"),
        ("4º Ano A", 4, "Manhã"),
        ("4º Ano B", 4, "Tarde"),
        ("5º Ano A", 5, "Manhã"),
        ("5º Ano B", 5, "Tarde")
    ]
    
    for turma in turmas:
        execute_query(
            "INSERT INTO turma (nome, ano, turno) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            turma,
            fetch=False
        )
    
    # Inserir disciplinas
    disciplinas = [
        ("Português", 200),
        ("Matemática", 200),
        ("Ciências", 100),
        ("História", 100),
        ("Geografia", 100),
        ("Educação Física", 80),
        ("Artes", 80),
        ("Inglês", 80)
    ]
    
    for disciplina in disciplinas:
        execute_query(
            "INSERT INTO disciplina (nome, carga_horaria) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            disciplina,
            fetch=False
        )
    
    # Inserir professores
    professores = [
        ("Ana Silva", "ana.silva@escola.edu.br", "Licenciatura em Letras"),
        ("Carlos Oliveira", "carlos.oliveira@escola.edu.br", "Licenciatura em Matemática"),
        ("Mariana Santos", "mariana.santos@escola.edu.br", "Licenciatura em Ciências Biológicas"),
        ("Pedro Costa", "pedro.costa@escola.edu.br", "Licenciatura em História"),
        ("Juliana Lima", "juliana.lima@escola.edu.br", "Licenciatura em Geografia"),
        ("Roberto Alves", "roberto.alves@escola.edu.br", "Licenciatura em Educação Física"),
        ("Camila Ferreira", "camila.ferreira@escola.edu.br", "Licenciatura em Artes"),
        ("Lucas Martins", "lucas.martins@escola.edu.br", "Licenciatura em Letras - Inglês")
    ]
    
    for professor in professores:
        execute_query(
            "INSERT INTO professor (nome, email, formacao) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            professor,
            fetch=False
        )
    
    # Associar professores às disciplinas
    # Primeiro, obter IDs dos professores e disciplinas
    professores_db = execute_query("SELECT id, nome FROM professor")
    disciplinas_db = execute_query("SELECT id, nome FROM disciplina")
    
    # Criar um mapeamento de nomes para IDs
    prof_map = {p["nome"]: p["id"] for p in professores_db}
    disc_map = {d["nome"]: d["id"] for d in disciplinas_db}
    
    # Associações professor-disciplina
    associacoes = [
        ("Ana Silva", "Português"),
        ("Carlos Oliveira", "Matemática"),
        ("Mariana Santos", "Ciências"),
        ("Pedro Costa", "História"),
        ("Juliana Lima", "Geografia"),
        ("Roberto Alves", "Educação Física"),
        ("Camila Ferreira", "Artes"),
        ("Lucas Martins", "Inglês")
    ]
    
    for prof_nome, disc_nome in associacoes:
        if prof_nome in prof_map and disc_nome in disc_map:
            execute_query(
                "INSERT INTO professor_disciplina (professor_id, disciplina_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (prof_map[prof_nome], disc_map[disc_nome]),
                fetch=False
            )
    
    # Inserir alunos (5 por turma)
    turmas_db = execute_query("SELECT id, nome FROM turma")
    turma_map = {t["nome"]: t["id"] for t in turmas_db}
    
    nomes_alunos = [
        "Miguel", "Arthur", "Gael", "Théo", "Heitor",
        "Helena", "Alice", "Laura", "Maria", "Valentina",
        "Davi", "Gabriel", "Bernardo", "Samuel", "João",
        "Sophia", "Isabella", "Manuela", "Júlia", "Heloísa",
        "Pedro", "Lorenzo", "Matheus", "Lucas", "Benjamin",
        "Cecília", "Eloá", "Liz", "Giovanna", "Maria Eduarda",
        "Nicolas", "Daniel", "Anthony", "Leonardo", "Vitor",
        "Maria Clara", "Maria Luiza", "Lorena", "Lívia", "Mariana",
        "Emanuel", "Enzo", "Henrique", "Murilo", "Lucca",
        "Antonella", "Beatriz", "Maria Júlia", "Emanuelly", "Isadora"
    ]
    
    aluno_index = 0
    for turma_nome, turma_id in turma_map.items():
        for i in range(5):  # 5 alunos por turma
            if aluno_index < len(nomes_alunos):
                nome_aluno = nomes_alunos[aluno_index]
                matricula = f"{2025}{turma_id:02d}{i+1:03d}"  # Formato: AAAATTTNNN
                
                execute_query(
                    "INSERT INTO aluno (nome, matricula, turma_id) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                    (nome_aluno, matricula, turma_id),
                    fetch=False
                )
                
                aluno_index += 1

if __name__ == "__main__":
    if inicializar_banco_dados():
        logger.info("Inicialização do banco de dados concluída com sucesso")
        sys.exit(0)
    else:
        logger.error("Falha na inicialização do banco de dados")
        sys.exit(1)
