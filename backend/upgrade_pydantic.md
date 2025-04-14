# Guia de Atualização para Pydantic 2.x

Este guia explica as principais mudanças necessárias para atualizar o código do projeto para compatibilidade com Pydantic 2.x.

## Contexto

O Pydantic 2.0 trouxe várias mudanças que quebram a compatibilidade com versões anteriores. A principal mudança que afeta nosso projeto é a movimentação da classe `BaseSettings` para um pacote separado chamado `pydantic-settings`. Além disso, houve mudanças nos decoradores de validação e em alguns comportamentos de serializaçãp.

## Mudanças Obrigatórias

### 1. Instalação do pacote pydantic-settings

```bash
pip install pydantic-settings
```

### 2. Atualização dos imports

Sempre que utilizar a classe `BaseSettings`, altere o import:

```python
# De:
from pydantic import BaseSettings

# Para:
from pydantic_settings import BaseSettings
```

### 3. Atualização dos validadores

Os validadores foram renomeados e modificados:

```python
# De:
from pydantic import validator

@validator("campo", pre=True)
def validar_campo(cls, v):
    # lógica de validação
    return v

# Para:
from pydantic import field_validator

@field_validator("campo", mode="before")
def validar_campo(cls, v):
    # lógica de validação
    return v
```

As principais mudanças nos validadores:
- `@validator` → `@field_validator`
- `pre=True` → `mode="before"`
- `pre=False` (padrão) → `mode="after"`

### 4. Configuração nas classes Pydantic

A configuração das classes foi modificada:

```python
# De:
class Config:
    orm_mode = True

# Para:
model_config = {
    "from_attributes": True  # substitui orm_mode
}
```

Outras mudanças importantes na configuração:
- `allow_population_by_field_name` → `populate_by_name`
- `extra = "forbid"` → `extra = "forbid"`  (não mudou)

## Exemplo Completo de Atualização

Veja um exemplo de como atualizar uma classe Pydantic:

```python
# Código antigo (Pydantic 1.x)
from pydantic import BaseModel, validator

class Usuario(BaseModel):
    nome: str
    idade: int
    
    @validator("idade")
    def idade_valida(cls, v):
        if v < 0 or v > 120:
            raise ValueError("Idade inválida")
        return v
    
    class Config:
        orm_mode = True
        schema_extra = {"example": {"nome": "João", "idade": 30}}
```

```python
# Código atualizado (Pydantic 2.x)
from pydantic import BaseModel, field_validator

class Usuario(BaseModel):
    nome: str
    idade: int
    
    @field_validator("idade")
    def idade_valida(cls, v):
        if v < 0 or v > 120:
            raise ValueError("Idade inválida")
        return v
    
    model_config = {
        "from_attributes": True,  # substitui orm_mode
        "json_schema_extra": {"example": {"nome": "João", "idade": 30}}  # schema_extra renomeado
    }
```

## Atualização de Settings

Para classes de configuração como nossa `Settings`, a atualização seria:

```python
# Código antigo
from pydantic import BaseSettings, validator

class Settings(BaseSettings):
    APP_NAME: str
    CORS_ORIGINS_LIST: List[AnyHttpUrl] = []
    
    @validator("CORS_ORIGINS_LIST", pre=True)
    def assemble_cors_origins(cls, v):
        # ... lógica
        return v
        
    class Config:
        env_file = ".env"
```

```python
# Código atualizado
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    APP_NAME: str
    CORS_ORIGINS_LIST: List[AnyHttpUrl] = []
    
    @field_validator("CORS_ORIGINS_LIST", mode="before")
    def assemble_cors_origins(cls, v):
        # ... lógica
        return v
        
    model_config = {
        "env_file": ".env"
    }
```

## Problemas Comuns

### Erro de importação circular

Se encontrar erros de importação circular ao usar as anotações de tipo atualizado, tente:

1. Use strings para anotações de tipo em caso de referência circular:
```python
class Turma(BaseModel):
    alunos: List["Aluno"] = []
```

2. Use o módulo `typing.Annotated` para referências mais complexas.

### Serializadores Personalizados

Se estiver usando serializadores personalizados, atualize-os conforme a nova API:

```python
# De:
def json_encoder(v):
    if isinstance(v, datetime):
        return v.isoformat()
    return v

# Para (usando model_serializer decorator):
@computed_field
@property
def serialized_date(self) -> str:
    return self.date.isoformat()
```

## Recursos Adicionais

- [Guia oficial de migração do Pydantic](https://docs.pydantic.dev/latest/migration/)
- [Documentação de Pydantic-Settings](https://docs.pydantic.dev/latest/usage/pydantic_settings/)
- [Guia de validadores no Pydantic 2.x](https://docs.pydantic.dev/latest/usage/validators/) 