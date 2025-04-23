# Documentação do Sistema de Gestão Escolar

## Visão Geral

O Sistema de Gestão Escolar é uma aplicação web completa para gerenciamento de escolas, permitindo o controle de turmas, disciplinas, professores, alunos e notas. O sistema foi desenvolvido com uma arquitetura moderna, utilizando JavaScript modular no frontend e FastAPI com PostgreSQL no backend.

## Arquitetura

### Frontend
- **HTML/CSS/JavaScript**: Interface de usuário responsiva usando Bootstrap 5
- **Arquitetura Modular**: Código JavaScript organizado em módulos independentes
- **Gráficos**: Visualização de dados com Chart.js

### Backend
- **FastAPI**: API RESTful em Python
- **PostgreSQL**: Banco de dados relacional
- **Psycopg2**: Conexão com o banco de dados PostgreSQL

### Deploy
- **Render**: Plataforma de hospedagem para frontend e backend
- **Configuração CORS**: Suporte a múltiplos domínios para desenvolvimento e produção

## Estrutura do Projeto

```
gestaoescolar/
├── backend/
│   ├── cors_config.py       # Configuração CORS
│   ├── db_config.py         # Configuração do banco de dados
│   ├── init_db.py           # Inicialização do banco de dados
│   ├── simplified_api.py    # API principal
│   └── update_api.py        # Script para atualizar a API
├── css/
│   ├── dashboard.css        # Estilos do dashboard
│   └── styles.css           # Estilos gerais
├── img/
│   └── logo.png             # Logo da escola
├── js/
│   ├── app.js               # Aplicação principal
│   ├── loader.js            # Carregador de módulos
│   └── modules/             # Módulos JavaScript
│       ├── alunos.js        # Módulo de alunos
│       ├── config.js        # Módulo de configuração
│       ├── dashboard.js     # Módulo de dashboard
│       ├── disciplinas.js   # Módulo de disciplinas
│       ├── notas.js         # Módulo de notas
│       ├── professores.js   # Módulo de professores
│       └── turmas.js        # Módulo de turmas
├── escola-dashboard.html    # Página principal
└── render.yaml              # Configuração de deploy
```

## Módulos do Frontend

### Config (config.js)
Gerencia a configuração da aplicação e a comunicação com a API.

### Dashboard (dashboard.js)
Exibe estatísticas e gráficos sobre a escola.

### Turmas (turmas.js)
Gerencia o cadastro e edição de turmas.

### Disciplinas (disciplinas.js)
Gerencia o cadastro e edição de disciplinas.

### Professores (professores.js)
Gerencia o cadastro e edição de professores e suas disciplinas.

### Alunos (alunos.js)
Gerencia o cadastro e edição de alunos e suas turmas.

### Notas (notas.js)
Gerencia o lançamento e cálculo de notas dos alunos.

## API Backend

### Endpoints Principais

#### Turmas
- `GET /turmas`: Lista todas as turmas
- `GET /turmas/{id}`: Obtém uma turma específica
- `POST /turmas`: Cria uma nova turma
- `PUT /turmas/{id}`: Atualiza uma turma existente
- `DELETE /turmas/{id}`: Exclui uma turma

#### Disciplinas
- `GET /disciplinas`: Lista todas as disciplinas
- `GET /disciplinas/{id}`: Obtém uma disciplina específica
- `POST /disciplinas`: Cria uma nova disciplina
- `PUT /disciplinas/{id}`: Atualiza uma disciplina existente
- `DELETE /disciplinas/{id}`: Exclui uma disciplina

#### Professores
- `GET /professores`: Lista todos os professores
- `GET /professores/{id}`: Obtém um professor específico
- `POST /professores`: Cria um novo professor
- `PUT /professores/{id}`: Atualiza um professor existente
- `DELETE /professores/{id}`: Exclui um professor

#### Alunos
- `GET /alunos`: Lista todos os alunos
- `GET /alunos/{id}`: Obtém um aluno específico
- `POST /alunos`: Cria um novo aluno
- `PUT /alunos/{id}`: Atualiza um aluno existente
- `DELETE /alunos/{id}`: Exclui um aluno

#### Notas
- `GET /notas`: Lista todas as notas
- `GET /notas/{id}`: Obtém uma nota específica
- `POST /notas`: Cria uma nova nota
- `PUT /notas/{id}`: Atualiza uma nota existente
- `DELETE /notas/{id}`: Exclui uma nota
- `POST /calcular-medias`: Recalcula todas as médias

#### Estatísticas
- `GET /estatisticas`: Obtém estatísticas gerais
- `GET /desempenho-turmas`: Obtém o desempenho das turmas
- `GET /distribuicao-alunos`: Obtém a distribuição de alunos por turma

## Banco de Dados

### Tabelas

#### turma
- `id`: Identificador único (PK)
- `nome`: Nome da turma
- `ano`: Ano escolar
- `turno`: Turno (Manhã, Tarde, Noite)

#### disciplina
- `id`: Identificador único (PK)
- `nome`: Nome da disciplina
- `carga_horaria`: Carga horária em horas

#### professor
- `id`: Identificador único (PK)
- `nome`: Nome do professor
- `email`: Email do professor
- `formacao`: Formação acadêmica

#### professor_disciplina
- `id`: Identificador único (PK)
- `professor_id`: ID do professor (FK)
- `disciplina_id`: ID da disciplina (FK)

#### aluno
- `id`: Identificador único (PK)
- `nome`: Nome do aluno
- `matricula`: Número de matrícula
- `turma_id`: ID da turma (FK)

#### nota
- `id`: Identificador único (PK)
- `aluno_id`: ID do aluno (FK)
- `disciplina_id`: ID da disciplina (FK)
- `turma_id`: ID da turma (FK)
- `bimestre`: Bimestre (1-4)
- `ano`: Ano letivo
- `nota_mensal`: Nota mensal (0-10)
- `nota_bimestral`: Nota bimestral (0-10)
- `nota_recuperacao`: Nota de recuperação (0-10, opcional)
- `media_final`: Média final (0-10)

## Deploy

### Configuração no Render

O sistema é implantado no Render com dois serviços:

1. **API (gestao-escolar-api)**
   - Tipo: Web Service
   - Ambiente: Python
   - Comando de construção: `pip install -r requirements.txt`
   - Comando de início: `cd backend && python -m uvicorn simplified_api:app --host 0.0.0.0 --port $PORT`

2. **Frontend (gestao-escolar-frontend)**
   - Tipo: Static Site
   - Diretório de publicação: `./`
   - Rewrite: `/api/*` → `https://gestao-escolar-api.onrender.com/api/:splat`

## Instruções de Instalação

### Requisitos
- Python 3.7+
- PostgreSQL 12+
- Node.js 14+ (opcional, para desenvolvimento)

### Passos para Instalação Local

1. Clone o repositório:
   ```
   git clone https://github.com/linsjunior88/gestaoescolar.git
   cd gestaoescolar
   ```

2. Instale as dependências do backend:
   ```
   pip install -r requirements.txt
   ```

3. Configure o banco de dados PostgreSQL:
   - Crie um banco de dados chamado `gestao_escolar`
   - Ajuste as credenciais em `backend/db_config.py` se necessário

4. Inicialize o banco de dados:
   ```
   cd backend
   python init_db.py
   ```

5. Inicie a API:
   ```
   python -m uvicorn simplified_api:app --reload
   ```

6. Abra o arquivo `escola-dashboard.html` em um navegador ou use um servidor web local.

## Melhorias Implementadas

1. **Modularização do Frontend**
   - Código JavaScript dividido em módulos independentes
   - Melhor organização e manutenção do código
   - Redução de conflitos e problemas de escopo

2. **Otimização da API**
   - Configuração CORS para múltiplos domínios
   - Melhor tratamento de erros
   - Separação de configurações em módulos

3. **Melhoria na Integração com Banco de Dados**
   - Módulo dedicado para operações de banco de dados
   - Script de inicialização com dados de exemplo
   - Melhor tratamento de transações

4. **Otimização do Deploy**
   - Configuração atualizada para o Render
   - Política de cache ajustada
   - Comando de inicialização otimizado

## Próximos Passos

1. **Autenticação de Usuários**
   - Implementar sistema de login
   - Definir níveis de acesso (administrador, professor, aluno)

2. **Relatórios Avançados**
   - Boletins escolares
   - Relatórios de desempenho por turma/disciplina

3. **Calendário Escolar**
   - Gerenciamento de eventos e feriados
   - Agendamento de avaliações

4. **Comunicação**
   - Sistema de mensagens entre professores e alunos
   - Notificações de eventos importantes

## Suporte

Para suporte ou dúvidas, entre em contato com o desenvolvedor:
- Email: linsjunior88@gmail.com
- GitHub: https://github.com/linsjunior88
