# Instruções para a API Simplificada do Sistema de Gestão Escolar

Este documento fornece instruções passo a passo para configurar e executar a API simplificada do Sistema de Gestão Escolar.

## Pré-requisitos

- Python 3.7 ou superior
- PostgreSQL 12 ou superior
- pip (gerenciador de pacotes Python)

## Passo 1: Configuração do Ambiente

1. Abra o prompt de comando ou terminal.

2. Navegue até o diretório do projeto:
   ```
   cd gestaoEscolar1
   ```

3. Crie um ambiente virtual Python (recomendado):
   ```
   python -m venv venv
   ```

4. Ative o ambiente virtual:
   - No Windows:
     ```
     venv\Scripts\activate
     ```
   - No Linux/Mac:
     ```
     source venv/bin/activate
     ```

5. Instale as dependências necessárias:
   ```
   pip install fastapi uvicorn psycopg2-binary python-jose[cryptography] passlib[bcrypt] requests
   ```

## Passo 2: Configuração do Banco de Dados

1. Verifique se o PostgreSQL está em execução em sua máquina.

2. Certifique-se de que existe um banco de dados chamado `gestao_escolar`.
   - Se não existir, crie-o usando o pgAdmin ou o comando:
     ```
     psql -U postgres -c "CREATE DATABASE gestao_escolar WITH ENCODING 'UTF8';"
     ```

   **Nota importante**: Se você encontrar erros de conexão relacionados à codificação UTF-8, pode ser necessário alterar a senha do usuário postgres para uma sem caracteres especiais:
   - No pgAdmin: Clique com o botão direito em Login/Group Roles > postgres > Properties > Definition > Password
   - Via SQL: Execute `ALTER USER postgres WITH PASSWORD '4chrOn0s';` (ou outra senha sem caracteres especiais)

3. Verifique as credenciais de acesso ao banco de dados no arquivo `simplified_api.py`:
   ```python
   DB_PARAMS = {
       "dbname": "gestao_escolar",
       "user": "postgres",
       "password": "4chrOn0s",  # Altere para sua senha
       "host": "localhost",
       "port": "5432"
   }
   ```
   
   Altere os valores conforme necessário para corresponder à sua configuração do PostgreSQL.

## Passo 3: Combinando os Arquivos da API

1. Execute o script que combina os arquivos da API em um único arquivo:
   ```
   cd backend
   python merge_api_files.py
   ```

   Este script irá combinar `simplified_api.py`, `simplified_api_part2.py` e `simplified_api_part3.py` 
   em um único arquivo chamado `simplified_api_complete.py`.

## Passo 4: Criação e Inicialização das Tabelas

1. Execute o script para criar as tabelas no banco de dados:
   ```
   python create_tables.py
   ```

   Este script irá criar todas as tabelas necessárias para o funcionamento do sistema.

   Alternativamente, se quiser recriar o banco de dados do zero:
   ```
   python create_new_database.py
   ```

2. (Opcional) Preencha o banco de dados com dados iniciais de teste:
   ```
   python seed_database.py
   ```

   Este script irá inserir dados de teste, incluindo turmas, disciplinas, professores, alunos e notas.

## Passo 5: Iniciando a API

1. Execute o script para iniciar a API:
   ```
   python run_simplified_api.py
   ```

2. A API estará disponível em http://localhost:4000

3. Você verá uma mensagem indicando que o servidor está em execução:
   ```
   INFO:     Started server process [xxxx]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:4000 (Press CTRL+C to quit)
   ```

## Passo 6: Testando a API

1. Abra um navegador e acesse a documentação interativa:
   ```
   http://localhost:4000/docs
   ```

2. Você verá a interface Swagger, onde poderá explorar e testar todos os endpoints da API.

3. Alternativamente, você pode executar o script de teste automatizado:
   ```
   # Em um novo prompt de comando (mantenha a API em execução)
   python test_simplified_api.py
   ```

   Este script testará automaticamente os principais endpoints da API.

4. Para verificar a estrutura das tabelas do banco de dados:
   ```
   python verify_tables.py
   ```

## Passo 7: Conectando com o Frontend

1. Configure o frontend para acessar a API no endereço:
   ```
   http://localhost:4000/api
   ```

2. Verifique se todas as requisições do frontend apontam para esta URL.

## Solução de Problemas

### Erro de conexão com o banco de dados

- Verifique se o PostgreSQL está em execução
- Confirme se as credenciais no arquivo `simplified_api.py` estão corretas
- Certifique-se de que o banco de dados `gestao_escolar` existe

### Erro ao iniciar o servidor

- Verifique se a porta 4000 não está sendo usada por outro processo
- Para verificar, execute:
  ```
  # Windows
  netstat -ano | findstr :4000
  
  # Linux/Mac
  lsof -i :4000
  ```
- Se estiver em uso, encerre o processo ou altere a porta no arquivo `run_simplified_api.py`

### Erros nos testes

- Verifique se a API está em execução
- Verifique os logs do servidor para identificar possíveis erros
- Certifique-se de que as tabelas foram criadas corretamente
- Execute `verify_tables.py` para verificar a estrutura das tabelas

## Endpoints Disponíveis

### Turmas
- GET /api/turmas/ - Lista todas as turmas
- GET /api/turmas/{id} - Obtém uma turma específica
- POST /api/turmas/ - Cria uma nova turma
- PUT /api/turmas/{id} - Atualiza uma turma
- DELETE /api/turmas/{id} - Remove uma turma

### Disciplinas
- GET /api/disciplinas/ - Lista todas as disciplinas
- GET /api/disciplinas/{id} - Obtém uma disciplina específica
- POST /api/disciplinas/ - Cria uma nova disciplina
- PUT /api/disciplinas/{id} - Atualiza uma disciplina
- DELETE /api/disciplinas/{id} - Remove uma disciplina

### Professores
- GET /api/professores/ - Lista todos os professores
- GET /api/professores/{id} - Obtém um professor específico
- POST /api/professores/ - Cria um novo professor
- PUT /api/professores/{id} - Atualiza um professor
- DELETE /api/professores/{id} - Remove um professor

### Alunos
- GET /api/alunos/ - Lista todos os alunos
- GET /api/alunos/{id} - Obtém um aluno específico
- POST /api/alunos/ - Cria um novo aluno
- PUT /api/alunos/{id} - Atualiza um aluno
- DELETE /api/alunos/{id} - Remove um aluno

### Notas
- GET /api/notas/ - Lista todas as notas
- GET /api/notas/{id} - Obtém uma nota específica
- POST /api/notas/ - Cria uma nova nota
- PUT /api/notas/{id} - Atualiza uma nota
- DELETE /api/notas/{id} - Remove uma nota
- GET /api/boletim/{aluno_id} - Obtém o boletim de um aluno 