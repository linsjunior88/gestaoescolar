"""
Instruções para Testar a API no Navegador
=========================================

A API do Sistema de Gestão Escolar está rodando na porta 9000.
Você pode acessar os endpoints diretamente no seu navegador ou usar a documentação interativa.

Documentação Interativa
----------------------
Para testar os endpoints de forma interativa, acesse:

    http://localhost:9000/docs

Esta página Swagger UI permite:
- Ver todos os endpoints disponíveis
- Testar os endpoints diretamente no navegador
- Ver os modelos de dados e exemplos de resposta

Acessando Endpoints Diretamente
-----------------------------
Você também pode acessar os endpoints diretamente no navegador:

1. Página Inicial da API:
   http://localhost:9000/

2. Endpoints principais:
   - Turmas: http://localhost:9000/api/turmas/
   - Disciplinas: http://localhost:9000/api/disciplinas/
   - Professores: http://localhost:9000/api/professores/
   - Alunos: http://localhost:9000/api/alunos/
   - Notas: http://localhost:9000/api/notas/

3. Buscando por ID específico:
   - Turma específica: http://localhost:9000/api/turmas/id/01AM
   - Disciplina específica: http://localhost:9000/api/disciplinas/id/MAT
   - Aluno específico: http://localhost:9000/api/alunos/id/100922

Dicas de Uso
-----------
- Use o Firefox ou Chrome para melhor visualização dos dados JSON
- Instale uma extensão como "JSON Formatter" para visualizar melhor os dados
- Para endpoints que requerem autenticação, use a página Swagger UI para autorizar
""" 