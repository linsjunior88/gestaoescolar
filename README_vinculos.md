# Vínculos Professor-Disciplina-Turma

Este documento descreve os endpoints adicionados ao arquivo `simplified_api.py` para gerenciar vínculos entre professores, disciplinas e turmas.

## Endpoints Adicionados

Foram adicionados os seguintes endpoints à API:

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
- `id_professor` ou `professor_id`: Filtra por ID do professor
- `id_disciplina` ou `disciplina_id`: Filtra por ID da disciplina
- `id_turma` ou `turma_id`: Filtra por ID da turma

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

### Endpoints Alternativos

Para maior facilidade de uso, foram adicionados também os seguintes endpoints alternativos que funcionam da mesma forma:

- `POST /api/vinculos`
- `GET /api/vinculos`
- `DELETE /api/vinculos/<id>`

## Modificações no Front-end

O código JavaScript no módulo `professores.js` foi atualizado para usar diretamente esses endpoints ao salvar vínculos entre professores, disciplinas e turmas. A função `tentarSalvarVinculo` agora:

1. Tenta primeiro usar o endpoint `/professor_disciplina_turma`
2. Se falhar, tenta o endpoint alternativo `/vinculos`
3. Como última opção, tenta atualizar o professor diretamente incluindo os vínculos

## Como Usar

No formulário de professores, ao selecionar disciplinas e turmas e clicar em "Salvar", o sistema automaticamente criará os vínculos usando esses novos endpoints.

## Solução de Problemas

Se ocorrerem erros ao salvar vínculos:

1. Verifique se a API está acessível
2. Confira os logs no console do navegador para detalhes do erro
3. Verifique se os IDs de professor, disciplina e turma existem no banco de dados
4. Certifique-se de que a tabela `professor_disciplina_turma` existe no banco de dados com a estrutura correta

A tabela deve ter a seguinte estrutura:
```sql
CREATE TABLE IF NOT EXISTS professor_disciplina_turma (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_professor TEXT NOT NULL,
    id_disciplina TEXT NOT NULL,
    id_turma TEXT NOT NULL,
    UNIQUE(id_professor, id_disciplina, id_turma)
);
``` 