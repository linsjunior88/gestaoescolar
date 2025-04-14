# Sistema de Gestão Escolar - Backend

Este é o backend da aplicação Sistema de Gestão Escolar, desenvolvido com FastAPI e PostgreSQL.

## Requisitos

- Python 3.7+
- PostgreSQL 12+
- pip (gerenciador de pacotes Python)

## Bibliotecas Principais

- FastAPI - Framework web para construção de APIs
- SQLAlchemy - ORM para acesso ao banco de dados
- Pydantic 2.x - Validação de dados e configurações
- Uvicorn - Servidor ASGI para executar a aplicação
- psycopg2 - Driver PostgreSQL

## Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd gestaoEscolar1/backend
```

2. Crie um ambiente virtual e ative-o:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
pip install pydantic-settings
```

4. Configure o banco de dados PostgreSQL:
```bash
# Crie um banco de dados chamado "gestao_escolar"
# Você pode usar o pgAdmin ou executar:
psql -U postgres -c "CREATE DATABASE gestao_escolar WITH ENCODING 'UTF8'"
```

5. Execute os scripts de criação de tabelas:
```bash
python create_new_database.py
```

## Executando a API

Para iniciar o servidor de desenvolvimento:

```bash
# Método 1: Usando o uvicorn diretamente
python -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload

# Método 2: Usando o script principal
python -m app.main
```

A API estará disponível em http://localhost:3000

## Documentação da API

- Swagger UI (interativa): http://localhost:3000/docs
- ReDoc (apenas leitura): http://localhost:3000/redoc
- Esquema OpenAPI: http://localhost:3000/openapi.json

## Acesso Direto ao Banco de Dados

Se você encontrar problemas com a API principal, pode usar a versão simplificada com acesso direto ao banco:

```bash
python backend/direct_db_access_fixed.py
```

Esta versão alternativa usa uma abordagem diferente de conexão com o banco de dados e estará disponível em http://localhost:4000

## Resolução de Problemas Comuns

### Problema: Erro relacionado ao Pydantic e BaseSettings

**Sintoma**: Erro `pydantic.errors.PydanticImportError: 'BaseSettings' has been moved to the 'pydantic-settings' package.`

**Solução**: 
1. Instale o pacote pydantic-settings: `pip install pydantic-settings`
2. Se o erro persistir, verifique se a versão do Pydantic é 2.x e atualize os imports em seus arquivos:
   ```python
   # De:
   from pydantic import BaseSettings
   
   # Para:
   from pydantic_settings import BaseSettings
   ```
3. Atualize validadores: `@validator` foi substituído por `@field_validator`

### Problema: Erro de codificação ao conectar com o banco

**Sintoma**: Erro `UnicodeDecodeError: 'utf-8' codec can't decode byte...`

**Solução**: 
1. Verifique se o banco de dados foi criado com codificação UTF-8
2. Use a versão alternativa da API com acesso direto ao banco: `python direct_db_access_fixed.py`
3. Crie um novo banco de dados com codificação correta usando: `python create_new_database.py`

### Problema: Erro de circular import

**Sintoma**: Erro `ImportError: cannot import name 'X' from partially initialized module 'Y'`

**Solução**:
1. Verifique os arquivos de esquema para garantir que não haja referências circulares
2. Use forward_refs nas classes Pydantic quando necessário

### Problema: API não inicia na porta 8000

**Sintoma**: Erro `Address already in use`

**Solução**:
1. Use uma porta diferente: `python -m uvicorn app.main:app --port 3000`
2. Encerre o processo que está usando a porta: 
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -i :8000
   kill -9 <PID>
   ```

## Estrutura do Projeto

```
backend/
├── app/                    # Código principal da aplicação
│   ├── api/                # Endpoints da API
│   │   ├── endpoints/      # Rotas específicas (turmas, alunos, etc.)
│   │   └── api.py          # Configuração do router principal
│   ├── core/               # Configurações centrais
│   ├── db/                 # Configuração do banco de dados
│   ├── models/             # Modelos SQLAlchemy
│   └── schemas/            # Schemas Pydantic
├── create_new_database.py  # Script para criar banco de dados
├── direct_db_access.py     # API alternativa com acesso direto ao banco
└── requirements.txt        # Dependências
```

## Endpoints Principais

- `/api/turmas/` - Gerenciamento de turmas
- `/api/disciplinas/` - Gerenciamento de disciplinas
- `/api/professores/` - Gerenciamento de professores
- `/api/alunos/` - Gerenciamento de alunos
- `/api/notas/` - Gerenciamento de notas

## Contribuição

1. Crie um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT. 