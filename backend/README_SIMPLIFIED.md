# API Simplificada do Sistema de Gestão Escolar

Esta é uma versão simplificada da API para o Sistema de Gestão Escolar, projetada para facilitar o desenvolvimento e testes.

## Visão Geral

A API simplificada combina todas as funcionalidades essenciais em um único arquivo, facilitando a execução e permitindo testes rápidos sem a necessidade de configurar o ambiente completo.

## Estrutura de Arquivos

- `simplified_api.py`, `simplified_api_part2.py`, `simplified_api_part3.py` - Arquivos separados da API simplificada
- `simplified_api_complete.py` - Arquivo completo da API gerado pelo script de mesclagem
- `merge_api_files.py` - Script para combinar os arquivos da API em um único arquivo
- `run_simplified_api.py` - Script para iniciar o servidor da API
- `test_simplified_api.py` - Testes automatizados para a API
- `create_tables.py` - Script para criar as tabelas no banco de dados
- `create_new_database.py` - Script para criar um novo banco de dados do zero
- `seed_database.py` - Script para preencher o banco de dados com dados de teste
- `verify_tables.py` - Script para verificar a estrutura das tabelas no banco de dados
- `INSTRUCOES.md` - Instruções passo a passo para configurar e executar a API

## Banco de Dados

O sistema utiliza o PostgreSQL e requer as seguintes tabelas:

1. `turma` - Armazena informações sobre as turmas
2. `disciplina` - Armazena informações sobre as disciplinas
3. `professor` - Armazena informações sobre os professores
4. `aluno` - Armazena informações sobre os alunos
5. `turma_disciplina` - Relacionamento entre turmas e disciplinas
6. `professor_disciplina_turma` - Relacionamento entre professores, disciplinas e turmas
7. `nota` - Armazena as notas dos alunos

## Endpoints da API

A API expõe endpoints para gerenciar todas as entidades do sistema:

### Turmas
- `GET /api/turmas/` - Lista todas as turmas
- `GET /api/turmas/{id}` - Obtém uma turma específica
- `POST /api/turmas/` - Cria uma nova turma
- `PUT /api/turmas/{id}` - Atualiza uma turma
- `DELETE /api/turmas/{id}` - Remove uma turma

### Disciplinas
- `GET /api/disciplinas/` - Lista todas as disciplinas
- `GET /api/disciplinas/{id}` - Obtém uma disciplina específica
- `POST /api/disciplinas/` - Cria uma nova disciplina
- `PUT /api/disciplinas/{id}` - Atualiza uma disciplina
- `DELETE /api/disciplinas/{id}` - Remove uma disciplina

### Professores
- `GET /api/professores/` - Lista todos os professores
- `GET /api/professores/{id}` - Obtém um professor específico
- `POST /api/professores/` - Cria um novo professor
- `PUT /api/professores/{id}` - Atualiza um professor
- `DELETE /api/professores/{id}` - Remove um professor

### Alunos
- `GET /api/alunos/` - Lista todos os alunos
- `GET /api/alunos/{id}` - Obtém um aluno específico
- `POST /api/alunos/` - Cria um novo aluno
- `PUT /api/alunos/{id}` - Atualiza um aluno
- `DELETE /api/alunos/{id}` - Remove um aluno

### Notas
- `GET /api/notas/` - Lista todas as notas
- `GET /api/notas/{id}` - Obtém uma nota específica
- `POST /api/notas/` - Cria uma nova nota
- `PUT /api/notas/{id}` - Atualiza uma nota
- `DELETE /api/notas/{id}` - Remove uma nota
- `GET /api/boletim/{aluno_id}` - Obtém o boletim de um aluno

## Fluxo de Trabalho Recomendado

1. Configure o ambiente conforme as instruções em `INSTRUCOES.md`
2. Combine os arquivos da API usando `merge_api_files.py`
3. Crie as tabelas do banco de dados usando `create_tables.py`
4. (Opcional) Preencha o banco com dados de teste usando `seed_database.py`
5. Inicie a API usando `run_simplified_api.py`
6. Teste a API acessando `http://localhost:4000/docs`
7. Execute os testes automatizados usando `test_simplified_api.py`

## Solução de Problemas

1. Se ocorrerem erros de conexão com o banco de dados, verifique:
   - Se o PostgreSQL está em execução
   - Se as credenciais estão corretas
   - Se o banco de dados `gestao_escolar` existe

2. Se ocorrerem erros ao iniciar o servidor:
   - Verifique se a porta 4000 não está sendo usada por outro processo
   - Verifique se todas as dependências foram instaladas

3. Para verificar a estrutura do banco de dados:
   - Execute `verify_tables.py` para obter informações sobre as tabelas

## Próximos Passos

Após configurar e testar com sucesso a API simplificada, você pode:

1. Integrar com o frontend
2. Expandir as funcionalidades
3. Implementar autenticação e autorização
4. Adicionar validações adicionais

Para mais detalhes, consulte o arquivo `INSTRUCOES.md`. 