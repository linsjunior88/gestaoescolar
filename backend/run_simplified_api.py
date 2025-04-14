"""
Script para iniciar a API simplificada do Sistema de Gestão Escolar.
Este script importa todas as partes da API e inicia o servidor.
"""
import uvicorn
import os
import sys

# Adicionar o diretório atual ao PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

# Mensagem explicativa
print("""
==============================================================
    Sistema de Gestão Escolar - API Simplificada
==============================================================

Esta versão simplificada da API conecta diretamente ao PostgreSQL
sem usar SQLAlchemy, eliminando problemas de compatibilidade.

Endpoints disponíveis:

1. Turmas:
   - GET /api/turmas/ - Lista todas as turmas
   - GET /api/turmas/{id} - Obtém uma turma específica
   - POST /api/turmas/ - Cria uma nova turma
   - PUT /api/turmas/{id} - Atualiza uma turma
   - DELETE /api/turmas/{id} - Remove uma turma

2. Disciplinas:
   - GET /api/disciplinas/ - Lista todas as disciplinas
   - GET /api/disciplinas/{id} - Obtém uma disciplina específica
   - POST /api/disciplinas/ - Cria uma nova disciplina
   - PUT /api/disciplinas/{id} - Atualiza uma disciplina
   - DELETE /api/disciplinas/{id} - Remove uma disciplina

3. Professores:
   - GET /api/professores/ - Lista todos os professores
   - GET /api/professores/{id} - Obtém um professor específico
   - POST /api/professores/ - Cria um novo professor
   - PUT /api/professores/{id} - Atualiza um professor
   - DELETE /api/professores/{id} - Remove um professor

4. Alunos:
   - GET /api/alunos/ - Lista todos os alunos
   - GET /api/alunos/{id} - Obtém um aluno específico
   - POST /api/alunos/ - Cria um novo aluno
   - PUT /api/alunos/{id} - Atualiza um aluno
   - DELETE /api/alunos/{id} - Remove um aluno

5. Notas:
   - GET /api/notas/ - Lista todas as notas
   - GET /api/notas/{id} - Obtém uma nota específica
   - POST /api/notas/ - Cria uma nova nota
   - PUT /api/notas/{id} - Atualiza uma nota
   - DELETE /api/notas/{id} - Remove uma nota
   - GET /api/boletim/{aluno_id} - Obtém o boletim de um aluno

A documentação completa está disponível em: http://localhost:4000/docs
==============================================================
""")

# Iniciar o servidor quando este script for executado diretamente
if __name__ == "__main__":
    try:
        # Iniciar o servidor FastAPI na porta 4000
        uvicorn.run("simplified_api_complete:app", host="0.0.0.0", port=4000, reload=True)
    except Exception as e:
        print(f"Erro ao iniciar o servidor: {e}")
        sys.exit(1) 