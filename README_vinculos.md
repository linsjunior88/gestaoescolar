# Vínculos Professor-Disciplina-Turma

Este documento descreve os endpoints adicionados ao arquivo `backend/simplified_api.py` para gerenciar vínculos entre professores, disciplinas e turmas.

## Implementação dos Endpoints

Para resolver o problema de 404 nos endpoints de vínculos, foram adicionadas as seguintes funcionalidades à API FastAPI no arquivo `backend/simplified_api.py`:

1. **Modelo de dados Pydantic** para os vínculos:
   - `ProfessorDisciplinaTurmaBase`
   - `ProfessorDisciplinaTurmaCreate`
   - `ProfessorDisciplinaTurma`

2. **Função `criar_tabela_vinculos()`** que:
   - Verifica se a tabela `professor_disciplina_turma` existe
   - Cria a tabela caso não exista
   - Adiciona índices para melhorar a performance
   - É chamada automaticamente quando a API inicia

3. **Endpoints principais:**
   - `POST /api/professor_disciplina_turma`: Cria novo vínculo
   - `GET /api/professor_disciplina_turma`: Lista vínculos (com filtros opcionais)
   - `DELETE /api/professor_disciplina_turma/{id}`: Remove vínculo

4. **Endpoints alternativos** (funcionam da mesma maneira):
   - `POST /api/vinculos`
   - `GET /api/vinculos`
   - `DELETE /api/vinculos/{id}`

## Como Implementar a Solução

Para implementar essa solução, siga os passos abaixo:

1. **Adicione o código à API**: 
   - Abra o arquivo `backend/simplified_api.py`
   - Cole o código dos endpoints no final do arquivo, antes da seção de inicialização
   - Os endpoints adicionados devem ficar antes do bloco `if __name__ == "__main__":`

2. **Execute o script para criar a tabela**:
   ```bash
   cd backend
   python create_professor_disciplina_turma_table.py
   ```

3. **Reinicie o servidor FastAPI**:
   ```bash
   cd backend
   python run_simplified_api.py
   ```

4. **Atualize o deployment no Render**:
   - Faça commit das alterações ao repositório Git
   - Envie para o GitHub
   - Aguarde o deployment automático no Render ou acione-o manualmente

## Detalhes da API

### 1. POST `/api/professor_disciplina_turma`

**Descrição:** Cria um novo vínculo entre professor, disciplina e turma.

**Corpo da requisição:**
```json
{
    "id_professor": "PROF001",
    "id_disciplina": "MAT",
    "id_turma": "1A"
}
```

**Formatos alternativos aceitos:**
```json
{
    "professor_id": "PROF001",
    "disciplina_id": "MAT",
    "turma_id": "1A"
}
```

**Resposta de sucesso (201):**
```json
{
    "message": "Vínculo criado com sucesso",
    "id": 123,
    "dados": {
        "id_professor": "PROF001",
        "id_disciplina": "MAT",
        "id_turma": "1A"
    }
}
```

**Resposta de vínculo já existente (200):**
```json
{
    "message": "Vínculo já existe",
    "id": 123
}
```

### 2. GET `/api/professor_disciplina_turma`

**Descrição:** Lista todos os vínculos ou filtra por professor, disciplina ou turma.

**Parâmetros de consulta (opcionais):**
- `id_professor`: Filtra por ID do professor
- `id_disciplina`: Filtra por ID da disciplina
- `id_turma`: Filtra por ID da turma

**Exemplo:** `/api/professor_disciplina_turma?id_professor=PROF001`

**Resposta de sucesso:**
```json
[
    {
        "id": 123,
        "id_professor": "PROF001",
        "id_disciplina": "MAT",
        "id_turma": "1A"
    },
    {
        "id": 124,
        "id_professor": "PROF001",
        "id_disciplina": "PORT",
        "id_turma": "1B"
    }
]
```

### 3. DELETE `/api/professor_disciplina_turma/<id>`

**Descrição:** Remove um vínculo específico pelo seu ID.

**Exemplo:** `/api/professor_disciplina_turma/123`

**Resposta de sucesso:**
```json
{
    "message": "Vínculo excluído com sucesso"
}
```

## Solução de Problemas

Se ocorrerem erros ao salvar vínculos:

1. **Verifique logs do servidor**:
   - Veja os logs do servidor FastAPI no Render
   - Verifique mensagens de erro específicas sobre falhas na tabela ou permissões

2. **Verifique a estrutura da tabela**:
   - Use o pgAdmin ou outra ferramenta para verificar se a tabela foi criada corretamente
   - Execute uma consulta para ver todas as tabelas:
     ```sql
     SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
     ```

3. **Teste os endpoints diretamente**:
   - Use uma ferramenta como Postman ou curl para testar os endpoints diretamente
   - Para testar a criação de vínculos:
     ```bash
     curl -X POST https://gestao-escolar-api.onrender.com/api/vinculos \
       -H "Content-Type: application/json" \
       -d '{"id_professor":"P001","id_disciplina":"MAT","id_turma":"1A"}'
     ```

4. **Atualize seu cliente JavaScript**:
   - Verifique se o arquivo `js/modules/professores.js` está fazendo os pedidos corretamente
   - Certifique-se que está usando as URLs corretas para os endpoints

## Estrutura da Tabela

A tabela `professor_disciplina_turma` é criada com a seguinte estrutura:

```sql
CREATE TABLE professor_disciplina_turma (
    id SERIAL PRIMARY KEY,
    id_professor VARCHAR(20) NOT NULL,
    id_disciplina VARCHAR(20) NOT NULL,
    id_turma VARCHAR(20) NOT NULL,
    CONSTRAINT unique_vinculo UNIQUE (id_professor, id_disciplina, id_turma)
);

-- Índices para melhorar a performance
CREATE INDEX idx_pdt_professor ON professor_disciplina_turma (id_professor);
CREATE INDEX idx_pdt_disciplina ON professor_disciplina_turma (id_disciplina);
CREATE INDEX idx_pdt_turma ON professor_disciplina_turma (id_turma);
```

## Conclusão

Esta solução permite gerenciar os vínculos entre professores, disciplinas e turmas de forma eficiente, evitando duplicações e facilitando a consulta de quais turmas e disciplinas um professor está vinculado. 