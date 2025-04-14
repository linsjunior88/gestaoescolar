"""
API Simplificada para o Sistema de Gestão Escolar
Este script implementa uma versão simplificada da API usando FastAPI e psycopg2
para conexão direta com o PostgreSQL.
"""
from fastapi import FastAPI, HTTPException, Depends, status, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2
import psycopg2.extras
import uvicorn
import sys
from datetime import date, datetime



"""
API Simplificada para o Sistema de Gestão Escolar
Este script implementa uma versão simplificada da API usando FastAPI e psycopg2
para conexão direta com o PostgreSQL.
"""
from fastapi import FastAPI, HTTPException, Depends, status, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2
import psycopg2.extras
import uvicorn
import sys
from datetime import date, datetime

# Configuração de codificação para caracteres especiais
if sys.version_info >= (3, 7):
    import locale
    try:
        locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
    except:
        try:
            locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
        except:
            pass

# Criação da aplicação FastAPI
app = FastAPI(
    title="Sistema de Gestão Escolar API Simplificada",
    description="API simplificada para o Sistema de Gestão Escolar",
    version="1.0.0",
)

# Configuração de CORS para permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajuste para os domínios específicos em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de conexão com o banco de dados
DB_PARAMS = {
    "dbname": "gestao_escolar",
    "user": "postgres",
    "password": "4chrOn0s",
    "host": "localhost",
    "port": "5432"
}

# Função para obter uma conexão com o banco de dados
def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro de conexão com o banco de dados: {str(e)}"
        )

# Função auxiliar para executar consultas
def execute_query(query, params=None, fetch=True, fetch_one=False):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(query, params)
        
        result = None
        if fetch:
            if fetch_one:
                result = cursor.fetchone()
            else:
                result = cursor.fetchall()
                
        cursor.close()
        return result
    except Exception as e:
        print(f"Erro ao executar consulta: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao executar operação no banco de dados: {str(e)}"
        )
    finally:
        if conn:
            conn.close()

# ==============================================================
# Modelos de dados (esquemas Pydantic)
# ==============================================================

# Modelo para Turma
class TurmaBase(BaseModel):
    id_turma: str
    serie: str
    turno: str
    tipo_turma: Optional[str] = None
    coordenador: Optional[str] = None

class TurmaCreate(TurmaBase):
    pass

class TurmaUpdate(BaseModel):
    id_turma: Optional[str] = None
    serie: Optional[str] = None
    turno: Optional[str] = None
    tipo_turma: Optional[str] = None
    coordenador: Optional[str] = None

class Turma(TurmaBase):
    id: int
    
    class Config:
        from_attributes = True

# Modelo para Disciplina
class DisciplinaBase(BaseModel):
    id_disciplina: str
    nome_disciplina: str
    carga_horaria: Optional[int] = None

class DisciplinaCreate(DisciplinaBase):
    pass

class DisciplinaUpdate(BaseModel):
    id_disciplina: Optional[str] = None
    nome_disciplina: Optional[str] = None
    carga_horaria: Optional[int] = None

class Disciplina(DisciplinaBase):
    id: int
    
    class Config:
        from_attributes = True

# ==============================================================
# Rotas
# ==============================================================

# Rota raiz da API
@app.get("/")
def read_root():
    """Rota principal que retorna informações básicas sobre a API."""
    return {
        "message": "Sistema de Gestão Escolar - API Simplificada",
        "status": "online",
        "documentação": "/docs",
        "versão": "1.0.0"
    }

# Verificação de saúde da API
@app.get("/health")
def health_check():
    """Verificação de saúde da API e conexão com o banco de dados."""
    try:
        # Tenta estabelecer uma conexão com o banco
        conn = get_db_connection()
        conn.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "message": "Sistema funcionando normalmente"
        }
    except:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Falha na conexão com o banco de dados"
        )

# ==============================================================
# Endpoints para Turmas
# ==============================================================

@app.get("/api/turmas/", response_model=List[Turma])
def read_turmas():
    """Busca todas as turmas cadastradas."""
    query = "SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma"
    results = execute_query(query)
    
    if not results:
        return []
    
    # Converter os resultados para objetos Turma
    turmas = []
    for row in results:
        turma = {
            "id": row["id"],
            "id_turma": row["id_turma"],
            "serie": row["serie"],
            "turno": row["turno"],
            "tipo_turma": row["tipo_turma"],
            "coordenador": row["coordenador"]
        }
        turmas.append(turma)
    
    return turmas

@app.get("/api/turmas/{turma_id}", response_model=Turma)
def read_turma(turma_id: str = Path(..., description="ID ou código da turma")):
    """Busca uma turma específica pelo ID ou código."""
    # Verificar se o ID é numérico
    params = None
    if turma_id.isdigit():
        query = "SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma WHERE id = %s"
        params = (int(turma_id),)
    else:
        query = "SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma WHERE id_turma = %s"
        params = (turma_id,)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    turma = {
        "id": result["id"],
        "id_turma": result["id_turma"],
        "serie": result["serie"],
        "turno": result["turno"],
        "tipo_turma": result["tipo_turma"],
        "coordenador": result["coordenador"]
    }
    
    return turma

@app.post("/api/turmas/", response_model=Turma, status_code=status.HTTP_201_CREATED)
def create_turma(turma: TurmaCreate):
    """Cria uma nova turma."""
    # Verificar se já existe uma turma com o mesmo id_turma
    query = "SELECT id FROM turma WHERE id_turma = %s"
    existing = execute_query(query, (turma.id_turma,), fetch_one=True)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma turma com o código {turma.id_turma}"
        )
    
    # Inserir a nova turma
    query = """
    INSERT INTO turma (id_turma, serie, turno, tipo_turma, coordenador)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING id, id_turma, serie, turno, tipo_turma, coordenador
    """
    params = (turma.id_turma, turma.serie, turma.turno, turma.tipo_turma, turma.coordenador)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao criar turma"
        )
    
    return {
        "id": result["id"],
        "id_turma": result["id_turma"],
        "serie": result["serie"],
        "turno": result["turno"],
        "tipo_turma": result["tipo_turma"],
        "coordenador": result["coordenador"]
    }

@app.put("/api/turmas/{turma_id}", response_model=Turma)
def update_turma(
    turma_id: str = Path(..., description="ID da turma"),
    turma: TurmaUpdate = Body(...)
):
    """Atualiza os dados de uma turma existente."""
    # Verificar se a turma existe
    if turma_id.isdigit():
        check_query = "SELECT id FROM turma WHERE id = %s"
        check_params = (int(turma_id),)
    else:
        check_query = "SELECT id FROM turma WHERE id_turma = %s"
        check_params = (turma_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    # Verificar quais campos foram fornecidos para atualização
    updates = {}
    if turma.id_turma is not None:
        updates["id_turma"] = turma.id_turma
    if turma.serie is not None:
        updates["serie"] = turma.serie
    if turma.turno is not None:
        updates["turno"] = turma.turno
    if turma.tipo_turma is not None:
        updates["tipo_turma"] = turma.tipo_turma
    if turma.coordenador is not None:
        updates["coordenador"] = turma.coordenador
    
    if not updates:
        # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
        result = execute_query(
            "SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma WHERE id = %s",
            (existing["id"],),
            fetch_one=True
        )
        return result
    
    # Construir a query de atualização
    set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
    query = f"UPDATE turma SET {set_clause} WHERE id = %s RETURNING id, id_turma, serie, turno, tipo_turma, coordenador"
    
    # Montar os parâmetros na ordem correta
    params = list(updates.values())
    params.append(existing["id"])
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao atualizar turma"
        )
    
    return {
        "id": result["id"],
        "id_turma": result["id_turma"],
        "serie": result["serie"],
        "turno": result["turno"],
        "tipo_turma": result["tipo_turma"],
        "coordenador": result["coordenador"]
    }

@app.delete("/api/turmas/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_turma(turma_id: str = Path(..., description="ID ou código da turma")):
    """Remove uma turma do sistema."""
    # Verificar se a turma existe
    if turma_id.isdigit():
        check_query = "SELECT id FROM turma WHERE id = %s"
        check_params = (int(turma_id),)
    else:
        check_query = "SELECT id FROM turma WHERE id_turma = %s"
        check_params = (turma_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    # Verificar se há dependências (por exemplo, alunos vinculados)
    # [Essa verificação pode ser adicionada posteriormente]
    
    # Excluir a turma
    query = "DELETE FROM turma WHERE id = %s"
    execute_query(query, (existing["id"],), fetch=False)
    
    return None  # HTTP 204 (No Content)

# ==============================================================
# Endpoints para Disciplinas
# ==============================================================

@app.get("/api/disciplinas/", response_model=List[Disciplina])
def read_disciplinas():
    """Busca todas as disciplinas cadastradas."""
    query = "SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina"
    results = execute_query(query)
    
    if not results:
        return []
    
    # Converter os resultados para objetos Disciplina
    disciplinas = []
    for row in results:
        disciplina = {
            "id": row["id"],
            "id_disciplina": row["id_disciplina"],
            "nome_disciplina": row["nome_disciplina"],
            "carga_horaria": row["carga_horaria"]
        }
        disciplinas.append(disciplina)
    
    return disciplinas

@app.get("/api/disciplinas/{disciplina_id}", response_model=Disciplina)
def read_disciplina(disciplina_id: str = Path(..., description="ID ou código da disciplina")):
    """Busca uma disciplina específica pelo ID ou código."""
    # Verificar se o ID é numérico
    params = None
    if disciplina_id.isdigit():
        query = "SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina WHERE id = %s"
        params = (int(disciplina_id),)
    else:
        query = "SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina WHERE id_disciplina = %s"
        params = (disciplina_id,)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    disciplina = {
        "id": result["id"],
        "id_disciplina": result["id_disciplina"],
        "nome_disciplina": result["nome_disciplina"],
        "carga_horaria": result["carga_horaria"]
    }
    
    return disciplina

@app.post("/api/disciplinas/", response_model=Disciplina, status_code=status.HTTP_201_CREATED)
def create_disciplina(disciplina: DisciplinaCreate):
    """Cria uma nova disciplina."""
    # Verificar se já existe uma disciplina com o mesmo id_disciplina
    query = "SELECT id FROM disciplina WHERE id_disciplina = %s"
    existing = execute_query(query, (disciplina.id_disciplina,), fetch_one=True)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma disciplina com o código {disciplina.id_disciplina}"
        )
    
    # Inserir a nova disciplina
    query = """
    INSERT INTO disciplina (id_disciplina, nome_disciplina, carga_horaria)
    VALUES (%s, %s, %s)
    RETURNING id, id_disciplina, nome_disciplina, carga_horaria
    """
    params = (disciplina.id_disciplina, disciplina.nome_disciplina, disciplina.carga_horaria)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao criar disciplina"
        )
    
    return {
        "id": result["id"],
        "id_disciplina": result["id_disciplina"],
        "nome_disciplina": result["nome_disciplina"],
        "carga_horaria": result["carga_horaria"]
    }

@app.put("/api/disciplinas/{disciplina_id}", response_model=Disciplina)
def update_disciplina(
    disciplina_id: str = Path(..., description="ID da disciplina"),
    disciplina: DisciplinaUpdate = Body(...)
):
    """Atualiza os dados de uma disciplina existente."""
    # Verificar se a disciplina existe
    if disciplina_id.isdigit():
        check_query = "SELECT id FROM disciplina WHERE id = %s"
        check_params = (int(disciplina_id),)
    else:
        check_query = "SELECT id FROM disciplina WHERE id_disciplina = %s"
        check_params = (disciplina_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Verificar quais campos foram fornecidos para atualização
    updates = {}
    if disciplina.id_disciplina is not None:
        updates["id_disciplina"] = disciplina.id_disciplina
    if disciplina.nome_disciplina is not None:
        updates["nome_disciplina"] = disciplina.nome_disciplina
    if disciplina.carga_horaria is not None:
        updates["carga_horaria"] = disciplina.carga_horaria
    
    if not updates:
        # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
        result = execute_query(
            "SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina WHERE id = %s",
            (existing["id"],),
            fetch_one=True
        )
        return result
    
    # Construir a query de atualização
    set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
    query = f"UPDATE disciplina SET {set_clause} WHERE id = %s RETURNING id, id_disciplina, nome_disciplina, carga_horaria"
    
    # Montar os parâmetros na ordem correta
    params = list(updates.values())
    params.append(existing["id"])
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao atualizar disciplina"
        )
    
    return {
        "id": result["id"],
        "id_disciplina": result["id_disciplina"],
        "nome_disciplina": result["nome_disciplina"],
        "carga_horaria": result["carga_horaria"]
    }

@app.delete("/api/disciplinas/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina(disciplina_id: str = Path(..., description="ID ou código da disciplina")):
    """Remove uma disciplina do sistema."""
    # Verificar se a disciplina existe
    if disciplina_id.isdigit():
        check_query = "SELECT id FROM disciplina WHERE id = %s"
        check_params = (int(disciplina_id),)
    else:
        check_query = "SELECT id FROM disciplina WHERE id_disciplina = %s"
        check_params = (disciplina_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Verificar se há dependências (por exemplo, turmas vinculadas)
    # [Essa verificação pode ser adicionada posteriormente]
    
    # Excluir a disciplina
    query = "DELETE FROM disciplina WHERE id = %s"
    execute_query(query, (existing["id"],), fetch=False)
    
    return None  # HTTP 204 (No Content)

# ==============================================================
# Endpoints para o relacionamento Disciplina-Turma
# ==============================================================

# Modelo para TurmaDisciplina
class TurmaDisciplinaBase(BaseModel):
    id_disciplina: str
    id_turma: str

class TurmaDisciplinaCreate(TurmaDisciplinaBase):
    pass

class TurmaDisciplina(TurmaDisciplinaBase):
    id: int
    
    class Config:
        from_attributes = True

# Endpoints para gerenciar o relacionamento entre disciplinas e turmas

@app.get("/api/disciplinas/{disciplina_id}/turmas", response_model=List[dict])
def read_disciplina_turmas(
    disciplina_id: str = Path(..., description="ID ou código da disciplina")
):
    """Recupera todas as turmas associadas a uma disciplina específica."""
    # Verificar se a disciplina existe
    params = None
    if disciplina_id.isdigit():
        check_query = "SELECT id, id_disciplina FROM disciplina WHERE id = %s"
        params = (int(disciplina_id),)
    else:
        check_query = "SELECT id, id_disciplina FROM disciplina WHERE id_disciplina = %s"
        params = (disciplina_id,)
    
    disciplina = execute_query(check_query, params, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Buscar as turmas vinculadas à disciplina
    query = """
    SELECT t.id_turma
    FROM turma t
    JOIN turma_disciplina td ON t.id_turma = td.id_turma
    WHERE td.id_disciplina = %s
    """
    results = execute_query(query, (disciplina["id_disciplina"],))
    
    if not results:
        return []
    
    # Converter os resultados em um formato simplificado
    turmas = []
    for row in results:
        turma = {
            "id_turma": row["id_turma"]
        }
        turmas.append(turma)
    
    return turmas

@app.post("/api/disciplinas/{disciplina_id}/turmas/{turma_id}", response_model=dict)
def create_disciplina_turma(
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: str = Path(..., description="ID ou código da turma")
):
    """Cria um vínculo entre uma disciplina e uma turma."""
    # Verificar se a disciplina existe
    params_disciplina = None
    if disciplina_id.isdigit():
        disciplina_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        params_disciplina = (int(disciplina_id),)
    else:
        disciplina_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        params_disciplina = (disciplina_id,)
    
    disciplina = execute_query(disciplina_query, params_disciplina, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Verificar se a turma existe
    params_turma = None
    if turma_id.isdigit():
        turma_query = "SELECT id_turma FROM turma WHERE id = %s"
        params_turma = (int(turma_id),)
    else:
        turma_query = "SELECT id_turma FROM turma WHERE id_turma = %s"
        params_turma = (turma_id,)
    
    turma = execute_query(turma_query, params_turma, fetch_one=True)
    
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    # Verificar se o vínculo já existe
    check_query = """
    SELECT id FROM turma_disciplina 
    WHERE id_disciplina = %s AND id_turma = %s
    """
    existing = execute_query(check_query, (disciplina["id_disciplina"], turma["id_turma"]), fetch_one=True)
    
    if existing:
        # Se já existe, retornar sem erro
        return {
            "id": existing["id"],
            "id_disciplina": disciplina["id_disciplina"],
            "id_turma": turma["id_turma"],
            "message": "Vínculo já existente"
        }
    
    # Criar o vínculo
    query = """
    INSERT INTO turma_disciplina (id_disciplina, id_turma)
    VALUES (%s, %s)
    RETURNING id
    """
    
    try:
        result = execute_query(query, (disciplina["id_disciplina"], turma["id_turma"]), fetch_one=True)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao criar vínculo entre disciplina e turma"
            )
        
        return {
            "id": result["id"],
            "id_disciplina": disciplina["id_disciplina"],
            "id_turma": turma["id_turma"],
            "message": "Vínculo criado com sucesso"
        }
    except Exception as e:
        print(f"Erro ao criar vínculo disciplina-turma: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar vínculo: {str(e)}"
        )

@app.delete("/api/disciplinas/{disciplina_id}/turmas", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_disciplina_turmas(
    disciplina_id: str = Path(..., description="ID ou código da disciplina")
):
    """Remove todos os vínculos de uma disciplina com turmas."""
    # Verificar se a disciplina existe
    params = None
    if disciplina_id.isdigit():
        check_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        params = (int(disciplina_id),)
    else:
        check_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        params = (disciplina_id,)
    
    disciplina = execute_query(check_query, params, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Remover todos os vínculos
    query = "DELETE FROM turma_disciplina WHERE id_disciplina = %s"
    execute_query(query, (disciplina["id_disciplina"],), fetch=False)
    
    return None  # HTTP 204 (No Content)

@app.delete("/api/disciplinas/{disciplina_id}/turmas/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina_turma(
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: str = Path(..., description="ID ou código da turma")
):
    """Remove um vínculo específico entre uma disciplina e uma turma."""
    # Verificar se a disciplina existe
    params_disciplina = None
    if disciplina_id.isdigit():
        disciplina_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        params_disciplina = (int(disciplina_id),)
    else:
        disciplina_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        params_disciplina = (disciplina_id,)
    
    disciplina = execute_query(disciplina_query, params_disciplina, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Verificar se a turma existe
    params_turma = None
    if turma_id.isdigit():
        turma_query = "SELECT id_turma FROM turma WHERE id = %s"
        params_turma = (int(turma_id),)
    else:
        turma_query = "SELECT id_turma FROM turma WHERE id_turma = %s"
        params_turma = (turma_id,)
    
    turma = execute_query(turma_query, params_turma, fetch_one=True)
    
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    # Remover o vínculo
    query = "DELETE FROM turma_disciplina WHERE id_disciplina = %s AND id_turma = %s"
    execute_query(query, (disciplina["id_disciplina"], turma["id_turma"]), fetch=False)
    
    return None  # HTTP 204 (No Content)

# ==============================================================
# Modelos de dados para Professores e Alunos
# ==============================================================

# Modelo para Professor
class ProfessorBase(BaseModel):
    id_professor: str
    nome_professor: str
    email_professor: Optional[str] = None
    senha: Optional[str] = None
    telefone_professor: Optional[str] = None
    ativo: bool = True

class ProfessorCreate(ProfessorBase):
    pass

class ProfessorUpdate(BaseModel):
    id_professor: Optional[str] = None
    nome_professor: Optional[str] = None
    email_professor: Optional[str] = None
    senha: Optional[str] = None
    telefone_professor: Optional[str] = None
    ativo: Optional[bool] = None

class Professor(ProfessorBase):
    id: int
    
    class Config:
        from_attributes = True

# Modelo para Aluno
class AlunoBase(BaseModel):
    id_aluno: str
    nome_aluno: str
    data_nascimento: Optional[date] = None
    genero: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    nome_pai: Optional[str] = None
    nome_mae: Optional[str] = None
    id_turma: Optional[int] = None

class AlunoCreate(AlunoBase):
    pass

class AlunoUpdate(BaseModel):
    id_aluno: Optional[str] = None
    nome_aluno: Optional[str] = None
    data_nascimento: Optional[date] = None
    genero: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    nome_pai: Optional[str] = None
    nome_mae: Optional[str] = None
    id_turma: Optional[int] = None

class Aluno(AlunoBase):
    id: int
    
    class Config:
        from_attributes = True
        
# ==============================================================
# Endpoints para Professores
# ==============================================================

@app.get("/api/professores/", response_model=List[Professor])
def read_professores():
    """Busca todos os professores cadastrados."""
    query = """
    SELECT id, id_professor, nome_professor, email_professor, senha, telefone_professor, ativo 
    FROM professor
    """
    results = execute_query(query)
    
    if not results:
        return []
    
    # Converter os resultados para objetos Professor
    professores = []
    for row in results:
        professor = {
            "id": row["id"],
            "id_professor": row["id_professor"],
            "nome_professor": row["nome_professor"],
            "email_professor": row["email_professor"],
            "senha": row["senha"],
            "telefone_professor": row["telefone_professor"],
            "ativo": row["ativo"]
        }
        professores.append(professor)
    
    return professores

@app.get("/api/professores/{professor_id}", response_model=Professor)
def read_professor(professor_id: str = Path(..., description="ID ou código do professor")):
    """Busca um professor específico pelo ID ou código."""
    # Verificar se o ID é numérico
    params = None
    if professor_id.isdigit():
        query = """
        SELECT id, id_professor, nome_professor, email_professor, senha, telefone_professor, ativo 
        FROM professor 
        WHERE id = %s
        """
        params = (int(professor_id),)
    else:
        query = """
        SELECT id, id_professor, nome_professor, email_professor, senha, telefone_professor, ativo 
        FROM professor 
        WHERE id_professor = %s
        """
        params = (professor_id,)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    professor = {
        "id": result["id"],
        "id_professor": result["id_professor"],
        "nome_professor": result["nome_professor"],
        "email_professor": result["email_professor"],
        "senha": result["senha"],
        "telefone_professor": result["telefone_professor"],
        "ativo": result["ativo"]
    }
    
    return professor

@app.post("/api/professores/", response_model=Professor, status_code=status.HTTP_201_CREATED)
def create_professor(professor: ProfessorCreate):
    """Cria um novo professor."""
    # Verificar se já existe um professor com o mesmo id_professor
    query = "SELECT id FROM professor WHERE id_professor = %s"
    existing = execute_query(query, (professor.id_professor,), fetch_one=True)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um professor com o código {professor.id_professor}"
        )
    
    # Inserir o novo professor
    query = """
    INSERT INTO professor (id_professor, nome_professor, email_professor, senha, telefone_professor, ativo)
    VALUES (%s, %s, %s, %s, %s, %s)
    RETURNING id, id_professor, nome_professor, email_professor, senha, telefone_professor, ativo
    """
    params = (
        professor.id_professor,
        professor.nome_professor,
        professor.email_professor,
        professor.senha,
        professor.telefone_professor,
        professor.ativo
    )
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao criar professor"
        )
    
    return {
        "id": result["id"],
        "id_professor": result["id_professor"],
        "nome_professor": result["nome_professor"],
        "email_professor": result["email_professor"],
        "senha": result["senha"],
        "telefone_professor": result["telefone_professor"],
        "ativo": result["ativo"]
    }

@app.put("/api/professores/{professor_id}", response_model=Professor)
def update_professor(
    professor_id: str = Path(..., description="ID do professor"),
    professor: ProfessorUpdate = Body(...)
):
    """Atualiza os dados de um professor existente."""
    # Verificar se o professor existe
    if professor_id.isdigit():
        check_query = "SELECT id FROM professor WHERE id = %s"
        check_params = (int(professor_id),)
    else:
        check_query = "SELECT id FROM professor WHERE id_professor = %s"
        check_params = (professor_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Verificar quais campos foram fornecidos para atualização
    updates = {}
    if professor.id_professor is not None:
        updates["id_professor"] = professor.id_professor
    if professor.nome_professor is not None:
        updates["nome_professor"] = professor.nome_professor
    if professor.email_professor is not None:
        updates["email_professor"] = professor.email_professor
    if professor.senha is not None:
        updates["senha"] = professor.senha
    if professor.telefone_professor is not None:
        updates["telefone_professor"] = professor.telefone_professor
    if professor.ativo is not None:
        updates["ativo"] = professor.ativo
    
    if not updates:
        # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
        query = """
        SELECT id, id_professor, nome_professor, email_professor, senha, telefone_professor, ativo 
        FROM professor 
        WHERE id = %s
        """
        result = execute_query(query, (existing["id"],), fetch_one=True)
        return result
    
    # Construir a query de atualização
    set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
    query = f"""
    UPDATE professor 
    SET {set_clause} 
    WHERE id = %s 
    RETURNING id, id_professor, nome_professor, email_professor, senha, telefone_professor, ativo
    """
    
    # Montar os parâmetros na ordem correta
    params = list(updates.values())
    params.append(existing["id"])
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao atualizar professor"
        )
    
    return {
        "id": result["id"],
        "id_professor": result["id_professor"],
        "nome_professor": result["nome_professor"],
        "email_professor": result["email_professor"],
        "senha": result["senha"],
        "telefone_professor": result["telefone_professor"],
        "ativo": result["ativo"]
    }

@app.delete("/api/professores/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_professor(professor_id: str = Path(..., description="ID ou código do professor")):
    """Remove um professor do sistema."""
    # Verificar se o professor existe
    if professor_id.isdigit():
        check_query = "SELECT id FROM professor WHERE id = %s"
        check_params = (int(professor_id),)
    else:
        check_query = "SELECT id FROM professor WHERE id_professor = %s"
        check_params = (professor_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Verificar se há dependências (por exemplo, disciplinas vinculadas)
    # [Essa verificação pode ser adicionada posteriormente]
    
    # Excluir o professor
    query = "DELETE FROM professor WHERE id = %s"
    execute_query(query, (existing["id"],), fetch=False)
    
    return None  # HTTP 204 (No Content)

# ==============================================================
# Endpoints para Alunos
# ==============================================================

@app.get("/api/alunos/", response_model=List[Aluno])
def read_alunos(turma_id: Optional[str] = Query(None, description="Filtrar por turma")):
    """
    Busca todos os alunos cadastrados.
    Opcionalmente, pode filtrar por turma.
    """
    query_params = []
    base_query = """
    SELECT id, id_aluno, nome_aluno, data_nascimento, genero, 
           cpf, rg, endereco, telefone, email, nome_pai, nome_mae, id_turma
    FROM aluno
    """
    
    # Adicionar filtro por turma, se especificado
    if turma_id:
        if turma_id.isdigit():
            base_query += " WHERE id_turma = %s"
            query_params.append(int(turma_id))
        else:
            # Assumindo que turma_id pode ser o código da turma (id_turma)
            base_query += " WHERE id_turma IN (SELECT id FROM turma WHERE id_turma = %s)"
            query_params.append(turma_id)
    
    results = execute_query(base_query, query_params if query_params else None)
    
    if not results:
        return []
    
    # Converter os resultados para objetos Aluno
    alunos = []
    for row in results:
        aluno = {
            "id": row["id"],
            "id_aluno": row["id_aluno"],
            "nome_aluno": row["nome_aluno"],
            "data_nascimento": row["data_nascimento"],
            "genero": row["genero"],
            "cpf": row["cpf"],
            "rg": row["rg"],
            "endereco": row["endereco"],
            "telefone": row["telefone"],
            "email": row["email"],
            "nome_pai": row["nome_pai"],
            "nome_mae": row["nome_mae"],
            "id_turma": row["id_turma"]
        }
        alunos.append(aluno)
    
    return alunos

@app.get("/api/alunos/{aluno_id}", response_model=Aluno)
def read_aluno(aluno_id: str = Path(..., description="ID ou código do aluno")):
    """Busca um aluno específico pelo ID ou código."""
    # Verificar se o ID é numérico
    params = None
    if aluno_id.isdigit():
        query = """
        SELECT id, id_aluno, nome_aluno, data_nascimento, genero, 
               cpf, rg, endereco, telefone, email, nome_pai, nome_mae, id_turma
        FROM aluno 
        WHERE id = %s
        """
        params = (int(aluno_id),)
    else:
        query = """
        SELECT id, id_aluno, nome_aluno, data_nascimento, genero, 
               cpf, rg, endereco, telefone, email, nome_pai, nome_mae, id_turma
        FROM aluno 
        WHERE id_aluno = %s
        """
        params = (aluno_id,)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    aluno = {
        "id": result["id"],
        "id_aluno": result["id_aluno"],
        "nome_aluno": result["nome_aluno"],
        "data_nascimento": result["data_nascimento"],
        "genero": result["genero"],
        "cpf": result["cpf"],
        "rg": result["rg"],
        "endereco": result["endereco"],
        "telefone": result["telefone"],
        "email": result["email"],
        "nome_pai": result["nome_pai"],
        "nome_mae": result["nome_mae"],
        "id_turma": result["id_turma"]
    }
    
    return aluno

@app.post("/api/alunos/", response_model=Aluno, status_code=status.HTTP_201_CREATED)
def create_aluno(aluno: AlunoCreate):
    """Cria um novo aluno."""
    # Verificar se já existe um aluno com o mesmo id_aluno
    query = "SELECT id FROM aluno WHERE id_aluno = %s"
    existing = execute_query(query, (aluno.id_aluno,), fetch_one=True)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um aluno com o código {aluno.id_aluno}"
        )
    
    # Verificar se a turma existe, se especificada
    if aluno.id_turma:
        turma_query = "SELECT id FROM turma WHERE id = %s"
        turma = execute_query(turma_query, (aluno.id_turma,), fetch_one=True)
        
        if not turma:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Turma com ID {aluno.id_turma} não encontrada"
            )
    
    # Inserir o novo aluno
    query = """
    INSERT INTO aluno (
        id_aluno, nome_aluno, data_nascimento, genero, cpf, rg, 
        endereco, telefone, email, nome_pai, nome_mae, id_turma
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id, id_aluno, nome_aluno, data_nascimento, genero, 
             cpf, rg, endereco, telefone, email, nome_pai, nome_mae, id_turma
    """
    params = (
        aluno.id_aluno,
        aluno.nome_aluno,
        aluno.data_nascimento,
        aluno.genero,
        aluno.cpf,
        aluno.rg,
        aluno.endereco,
        aluno.telefone,
        aluno.email,
        aluno.nome_pai,
        aluno.nome_mae,
        aluno.id_turma
    )
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao criar aluno"
        )
    
    return {
        "id": result["id"],
        "id_aluno": result["id_aluno"],
        "nome_aluno": result["nome_aluno"],
        "data_nascimento": result["data_nascimento"],
        "genero": result["genero"],
        "cpf": result["cpf"],
        "rg": result["rg"],
        "endereco": result["endereco"],
        "telefone": result["telefone"],
        "email": result["email"],
        "nome_pai": result["nome_pai"],
        "nome_mae": result["nome_mae"],
        "id_turma": result["id_turma"]
    }

@app.put("/api/alunos/{aluno_id}", response_model=Aluno)
def update_aluno(
    aluno_id: str = Path(..., description="ID do aluno"),
    aluno: AlunoUpdate = Body(...)
):
    """Atualiza os dados de um aluno existente."""
    # Verificar se o aluno existe
    if aluno_id.isdigit():
        check_query = "SELECT id FROM aluno WHERE id = %s"
        check_params = (int(aluno_id),)
    else:
        check_query = "SELECT id FROM aluno WHERE id_aluno = %s"
        check_params = (aluno_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Verificar se a turma existe, se especificada
    if aluno.id_turma:
        turma_query = "SELECT id FROM turma WHERE id = %s"
        turma = execute_query(turma_query, (aluno.id_turma,), fetch_one=True)
        
        if not turma:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Turma com ID {aluno.id_turma} não encontrada"
            )
    
    # Verificar quais campos foram fornecidos para atualização
    updates = {}
    
    # Mapear todos os campos opcionais
    field_mappings = {
        "id_aluno": aluno.id_aluno,
        "nome_aluno": aluno.nome_aluno,
        "data_nascimento": aluno.data_nascimento,
        "genero": aluno.genero,
        "cpf": aluno.cpf,
        "rg": aluno.rg,
        "endereco": aluno.endereco,
        "telefone": aluno.telefone,
        "email": aluno.email,
        "nome_pai": aluno.nome_pai,
        "nome_mae": aluno.nome_mae,
        "id_turma": aluno.id_turma
    }
    
    # Adicionar apenas os campos não nulos
    for field, value in field_mappings.items():
        if value is not None:
            updates[field] = value
    
    if not updates:
        # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
        query = """
        SELECT id, id_aluno, nome_aluno, data_nascimento, genero, 
               cpf, rg, endereco, telefone, email, nome_pai, nome_mae, id_turma
        FROM aluno 
        WHERE id = %s
        """
        result = execute_query(query, (existing["id"],), fetch_one=True)
        return result
    
    # Construir a query de atualização
    set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
    query = f"""
    UPDATE aluno 
    SET {set_clause} 
    WHERE id = %s 
    RETURNING id, id_aluno, nome_aluno, data_nascimento, genero, 
             cpf, rg, endereco, telefone, email, nome_pai, nome_mae, id_turma
    """
    
    # Montar os parâmetros na ordem correta
    params = list(updates.values())
    params.append(existing["id"])
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao atualizar aluno"
        )
    
    return {
        "id": result["id"],
        "id_aluno": result["id_aluno"],
        "nome_aluno": result["nome_aluno"],
        "data_nascimento": result["data_nascimento"],
        "genero": result["genero"],
        "cpf": result["cpf"],
        "rg": result["rg"],
        "endereco": result["endereco"],
        "telefone": result["telefone"],
        "email": result["email"],
        "nome_pai": result["nome_pai"],
        "nome_mae": result["nome_mae"],
        "id_turma": result["id_turma"]
    }

@app.delete("/api/alunos/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_aluno(aluno_id: str = Path(..., description="ID ou código do aluno")):
    """Remove um aluno do sistema."""
    # Verificar se o aluno existe
    if aluno_id.isdigit():
        check_query = "SELECT id FROM aluno WHERE id = %s"
        check_params = (int(aluno_id),)
    else:
        check_query = "SELECT id FROM aluno WHERE id_aluno = %s"
        check_params = (aluno_id,)
    
    existing = execute_query(check_query, check_params, fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Verificar se há dependências (por exemplo, notas vinculadas)
    # [Essa verificação pode ser adicionada posteriormente]
    
    # Excluir o aluno
    query = "DELETE FROM aluno WHERE id = %s"
    execute_query(query, (existing["id"],), fetch=False)
    
    return None  # HTTP 204 (No Content)

# ==============================================================
# Endpoints para o relacionamento Professor-Disciplina-Turma
# ==============================================================

# Modelo para ProfessorDisciplinaTurma
class ProfessorDisciplinaTurmaBase(BaseModel):
    id_professor: str
    id_disciplina: str
    id_turma: str

class ProfessorDisciplinaTurmaCreate(ProfessorDisciplinaTurmaBase):
    pass

class ProfessorDisciplinaTurma(ProfessorDisciplinaTurmaBase):
    id: int
    
    class Config:
        from_attributes = True

# Endpoints para gerenciar o relacionamento entre professores, disciplinas e turmas

@app.get("/api/professores/{professor_id}/disciplinas", response_model=List[dict])
def read_professor_disciplinas(
    professor_id: str = Path(..., description="ID ou código do professor")
):
    """Recupera todas as disciplinas associadas a um professor específico."""
    # Verificar se o professor existe
    params = None
    if professor_id.isdigit():
        check_query = "SELECT id, id_professor FROM professor WHERE id = %s"
        params = (int(professor_id),)
    else:
        check_query = "SELECT id, id_professor FROM professor WHERE id_professor = %s"
        params = (professor_id,)
    
    professor = execute_query(check_query, params, fetch_one=True)
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Buscar as disciplinas vinculadas ao professor
    query = """
    SELECT DISTINCT d.id_disciplina, d.nome_disciplina
    FROM disciplina d
    JOIN professor_disciplina_turma pdt ON d.id_disciplina = pdt.id_disciplina
    WHERE pdt.id_professor = %s
    """
    results = execute_query(query, (professor["id_professor"],))
    
    if not results:
        return []
    
    # Converter os resultados em um formato mais detalhado
    disciplinas = []
    for row in results:
        disciplina = {
            "id_disciplina": row["id_disciplina"],
            "nome_disciplina": row["nome_disciplina"]
        }
        disciplinas.append(disciplina)
    
    return disciplinas

@app.get("/api/professores/{professor_id}/disciplinas/{disciplina_id}/turmas", response_model=List[dict])
def read_professor_disciplina_turmas(
    professor_id: str = Path(..., description="ID ou código do professor"),
    disciplina_id: str = Path(..., description="ID ou código da disciplina")
):
    """Recupera todas as turmas associadas a um professor e uma disciplina específica."""
    # Verificar se o professor existe
    prof_params = None
    if professor_id.isdigit():
        prof_query = "SELECT id_professor FROM professor WHERE id = %s"
        prof_params = (int(professor_id),)
    else:
        prof_query = "SELECT id_professor FROM professor WHERE id_professor = %s"
        prof_params = (professor_id,)
    
    professor = execute_query(prof_query, prof_params, fetch_one=True)
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Verificar se a disciplina existe
    disc_params = None
    if disciplina_id.isdigit():
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        disc_params = (int(disciplina_id),)
    else:
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        disc_params = (disciplina_id,)
    
    disciplina = execute_query(disc_query, disc_params, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Buscar as turmas vinculadas ao professor e disciplina
    query = """
    SELECT t.id_turma, t.serie, t.turno
    FROM turma t
    JOIN professor_disciplina_turma pdt ON t.id_turma = pdt.id_turma
    WHERE pdt.id_professor = %s AND pdt.id_disciplina = %s
    """
    results = execute_query(query, (professor["id_professor"], disciplina["id_disciplina"]))
    
    if not results:
        return []
    
    # Converter os resultados em um formato mais detalhado
    turmas = []
    for row in results:
        turma = {
            "id_turma": row["id_turma"],
            "serie": row["serie"],
            "turno": row["turno"]
        }
        turmas.append(turma)
    
    return turmas

@app.post("/api/professores/{professor_id}/disciplinas/{disciplina_id}/turmas/{turma_id}", response_model=dict)
def create_professor_disciplina_turma(
    professor_id: str = Path(..., description="ID ou código do professor"),
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: str = Path(..., description="ID ou código da turma")
):
    """Cria um vínculo entre um professor, uma disciplina e uma turma."""
    # Verificar se o professor existe
    prof_params = None
    if professor_id.isdigit():
        prof_query = "SELECT id_professor FROM professor WHERE id = %s"
        prof_params = (int(professor_id),)
    else:
        prof_query = "SELECT id_professor FROM professor WHERE id_professor = %s"
        prof_params = (professor_id,)
    
    professor = execute_query(prof_query, prof_params, fetch_one=True)
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Verificar se a disciplina existe
    disc_params = None
    if disciplina_id.isdigit():
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        disc_params = (int(disciplina_id),)
    else:
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        disc_params = (disciplina_id,)
    
    disciplina = execute_query(disc_query, disc_params, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Verificar se a turma existe
    turma_params = None
    if turma_id.isdigit():
        turma_query = "SELECT id_turma FROM turma WHERE id = %s"
        turma_params = (int(turma_id),)
    else:
        turma_query = "SELECT id_turma FROM turma WHERE id_turma = %s"
        turma_params = (turma_id,)
    
    turma = execute_query(turma_query, turma_params, fetch_one=True)
    
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    # Verificar se o vínculo já existe
    check_query = """
    SELECT id FROM professor_disciplina_turma 
    WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
    """
    existing = execute_query(
        check_query, 
        (professor["id_professor"], disciplina["id_disciplina"], turma["id_turma"]), 
        fetch_one=True
    )
    
    if existing:
        # Se já existe, retornar sem erro
        return {
            "id": existing["id"],
            "id_professor": professor["id_professor"],
            "id_disciplina": disciplina["id_disciplina"],
            "id_turma": turma["id_turma"],
            "message": "Vínculo já existente"
        }
    
    # Criar o vínculo
    query = """
    INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
    VALUES (%s, %s, %s)
    RETURNING id
    """
    
    try:
        result = execute_query(
            query, 
            (professor["id_professor"], disciplina["id_disciplina"], turma["id_turma"]), 
            fetch_one=True
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao criar vínculo entre professor, disciplina e turma"
            )
        
        return {
            "id": result["id"],
            "id_professor": professor["id_professor"],
            "id_disciplina": disciplina["id_disciplina"],
            "id_turma": turma["id_turma"],
            "message": "Vínculo criado com sucesso"
        }
    except Exception as e:
        print(f"Erro ao criar vínculo professor-disciplina-turma: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar vínculo: {str(e)}"
        )

@app.delete("/api/professores/{professor_id}/disciplinas", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_professor_disciplinas(
    professor_id: str = Path(..., description="ID ou código do professor")
):
    """Remove todos os vínculos de um professor com disciplinas e turmas."""
    # Verificar se o professor existe
    params = None
    if professor_id.isdigit():
        check_query = "SELECT id_professor FROM professor WHERE id = %s"
        params = (int(professor_id),)
    else:
        check_query = "SELECT id_professor FROM professor WHERE id_professor = %s"
        params = (professor_id,)
    
    professor = execute_query(check_query, params, fetch_one=True)
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Remover todos os vínculos
    query = "DELETE FROM professor_disciplina_turma WHERE id_professor = %s"
    execute_query(query, (professor["id_professor"],), fetch=False)
    
    return None  # HTTP 204 (No Content)

@app.delete("/api/professores/{professor_id}/disciplinas/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_professor_disciplina(
    professor_id: str = Path(..., description="ID ou código do professor"),
    disciplina_id: str = Path(..., description="ID ou código da disciplina")
):
    """Remove todos os vínculos de um professor com uma disciplina específica (em todas as turmas)."""
    # Verificar se o professor existe
    prof_params = None
    if professor_id.isdigit():
        prof_query = "SELECT id_professor FROM professor WHERE id = %s"
        prof_params = (int(professor_id),)
    else:
        prof_query = "SELECT id_professor FROM professor WHERE id_professor = %s"
        prof_params = (professor_id,)
    
    professor = execute_query(prof_query, prof_params, fetch_one=True)
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Verificar se a disciplina existe
    disc_params = None
    if disciplina_id.isdigit():
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        disc_params = (int(disciplina_id),)
    else:
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        disc_params = (disciplina_id,)
    
    disciplina = execute_query(disc_query, disc_params, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Remover os vínculos dessa disciplina com o professor em todas as turmas
    query = "DELETE FROM professor_disciplina_turma WHERE id_professor = %s AND id_disciplina = %s"
    execute_query(query, (professor["id_professor"], disciplina["id_disciplina"]), fetch=False)
    
    return None  # HTTP 204 (No Content)

@app.delete("/api/professores/{professor_id}/disciplinas/{disciplina_id}/turmas/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_professor_disciplina_turma(
    professor_id: str = Path(..., description="ID ou código do professor"),
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: str = Path(..., description="ID ou código da turma")
):
    """Remove um vínculo específico entre um professor, uma disciplina e uma turma."""
    # Verificar se o professor existe
    prof_params = None
    if professor_id.isdigit():
        prof_query = "SELECT id_professor FROM professor WHERE id = %s"
        prof_params = (int(professor_id),)
    else:
        prof_query = "SELECT id_professor FROM professor WHERE id_professor = %s"
        prof_params = (professor_id,)
    
    professor = execute_query(prof_query, prof_params, fetch_one=True)
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    
    # Verificar se a disciplina existe
    disc_params = None
    if disciplina_id.isdigit():
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id = %s"
        disc_params = (int(disciplina_id),)
    else:
        disc_query = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
        disc_params = (disciplina_id,)
    
    disciplina = execute_query(disc_query, disc_params, fetch_one=True)
    
    if not disciplina:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    # Verificar se a turma existe
    turma_params = None
    if turma_id.isdigit():
        turma_query = "SELECT id_turma FROM turma WHERE id = %s"
        turma_params = (int(turma_id),)
    else:
        turma_query = "SELECT id_turma FROM turma WHERE id_turma = %s"
        turma_params = (turma_id,)
    
    turma = execute_query(turma_query, turma_params, fetch_one=True)
    
    if not turma:
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    
    # Remover o vínculo específico
    query = """
    DELETE FROM professor_disciplina_turma 
    WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
    """
    execute_query(
        query, 
        (professor["id_professor"], disciplina["id_disciplina"], turma["id_turma"]), 
        fetch=False
    )
    
    return None  # HTTP 204 (No Content)

# ==============================================================
# Modelos de dados para Notas
# ==============================================================

# Modelo para Nota
class NotaBase(BaseModel):
    id_aluno: int
    id_disciplina: int
    periodo: str
    valor: float
    
class NotaCreate(NotaBase):
    pass

class NotaUpdate(BaseModel):
    id_aluno: Optional[int] = None
    id_disciplina: Optional[int] = None
    periodo: Optional[str] = None
    valor: Optional[float] = None

class Nota(NotaBase):
    id: int
    
    class Config:
        from_attributes = True

# Modelo para resposta de nota com informações adicionais
class NotaInfo(BaseModel):
    id: int
    id_aluno: int
    nome_aluno: str
    id_disciplina: int
    nome_disciplina: str
    periodo: str
    valor: float

# Modelo para boletim do aluno (todas as notas de um aluno)
class Boletim(BaseModel):
    id_aluno: int
    nome_aluno: str
    disciplinas: List[Dict[str, Any]]

# ==============================================================
# Endpoints para Notas
# ==============================================================

@app.get("/api/notas/", response_model=List[NotaInfo])
def read_notas(
    aluno_id: Optional[str] = Query(None, description="Filtrar por aluno"),
    disciplina_id: Optional[str] = Query(None, description="Filtrar por disciplina"),
    periodo: Optional[str] = Query(None, description="Filtrar por período")
):
    """
    Busca todas as notas cadastradas.
    Opcionalmente, pode filtrar por aluno, disciplina e/ou período.
    """
    base_query = """
    SELECT n.id, n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, n.periodo, n.valor
    FROM nota n
    JOIN aluno a ON n.id_aluno = a.id
    JOIN disciplina d ON n.id_disciplina = d.id
    """
    
    conditions = []
    params = []
    
    # Adicionar filtros, se especificados
    if aluno_id:
        if aluno_id.isdigit():
            conditions.append("n.id_aluno = %s")
            params.append(int(aluno_id))
        else:
            conditions.append("a.id_aluno = %s")
            params.append(aluno_id)
    
    if disciplina_id:
        if disciplina_id.isdigit():
            conditions.append("n.id_disciplina = %s")
            params.append(int(disciplina_id))
        else:
            conditions.append("d.id_disciplina = %s")
            params.append(disciplina_id)
    
    if periodo:
        conditions.append("n.periodo = %s")
        params.append(periodo)
    
    # Adicionar condições à query
    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)
    
    # Ordenar resultados
    base_query += " ORDER BY a.nome_aluno, d.nome_disciplina, n.periodo"
    
    results = execute_query(base_query, params if params else None)
    
    if not results:
        return []
    
    # Converter os resultados para objetos NotaInfo
    notas = []
    for row in results:
        nota = {
            "id": row["id"],
            "id_aluno": row["id_aluno"],
            "nome_aluno": row["nome_aluno"],
            "id_disciplina": row["id_disciplina"],
            "nome_disciplina": row["nome_disciplina"],
            "periodo": row["periodo"],
            "valor": row["valor"]
        }
        notas.append(nota)
    
    return notas

@app.get("/api/notas/{nota_id}", response_model=NotaInfo)
def read_nota(nota_id: int = Path(..., description="ID da nota")):
    """Busca uma nota específica pelo ID."""
    query = """
    SELECT n.id, n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, n.periodo, n.valor
    FROM nota n
    JOIN aluno a ON n.id_aluno = a.id
    JOIN disciplina d ON n.id_disciplina = d.id
    WHERE n.id = %s
    """
    
    result = execute_query(query, (nota_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    nota = {
        "id": result["id"],
        "id_aluno": result["id_aluno"],
        "nome_aluno": result["nome_aluno"],
        "id_disciplina": result["id_disciplina"],
        "nome_disciplina": result["nome_disciplina"],
        "periodo": result["periodo"],
        "valor": result["valor"]
    }
    
    return nota

@app.post("/api/notas/", response_model=NotaInfo, status_code=status.HTTP_201_CREATED)
def create_nota(nota: NotaCreate):
    """Cria uma nova nota."""
    # Verificar se o aluno existe
    aluno_query = "SELECT id, nome_aluno FROM aluno WHERE id = %s"
    aluno = execute_query(aluno_query, (nota.id_aluno,), fetch_one=True)
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Aluno com ID {nota.id_aluno} não encontrado"
        )
    
    # Verificar se a disciplina existe
    disciplina_query = "SELECT id, nome_disciplina FROM disciplina WHERE id = %s"
    disciplina = execute_query(disciplina_query, (nota.id_disciplina,), fetch_one=True)
    
    if not disciplina:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disciplina com ID {nota.id_disciplina} não encontrada"
        )
    
    # Verificar se já existe uma nota para este aluno, disciplina e período
    check_query = """
    SELECT id FROM nota 
    WHERE id_aluno = %s AND id_disciplina = %s AND periodo = %s
    """
    existing = execute_query(
        check_query, 
        (nota.id_aluno, nota.id_disciplina, nota.periodo), 
        fetch_one=True
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma nota para este aluno, disciplina e período"
        )
    
    # Inserir a nova nota
    query = """
    INSERT INTO nota (id_aluno, id_disciplina, periodo, valor)
    VALUES (%s, %s, %s, %s)
    RETURNING id, id_aluno, id_disciplina, periodo, valor
    """
    params = (
        nota.id_aluno,
        nota.id_disciplina,
        nota.periodo,
        nota.valor
    )
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao criar nota"
        )
    
    # Retornar o resultado com informações adicionais
    return {
        "id": result["id"],
        "id_aluno": result["id_aluno"],
        "nome_aluno": aluno["nome_aluno"],
        "id_disciplina": result["id_disciplina"],
        "nome_disciplina": disciplina["nome_disciplina"],
        "periodo": result["periodo"],
        "valor": result["valor"]
    }

@app.put("/api/notas/{nota_id}", response_model=NotaInfo)
def update_nota(
    nota_id: int = Path(..., description="ID da nota"),
    nota: NotaUpdate = Body(...)
):
    """Atualiza os dados de uma nota existente."""
    # Verificar se a nota existe
    check_query = "SELECT id, id_aluno, id_disciplina, periodo, valor FROM nota WHERE id = %s"
    existing = execute_query(check_query, (nota_id,), fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    # Se o aluno foi atualizado, verificar se o novo aluno existe
    aluno = None
    id_aluno = nota.id_aluno if nota.id_aluno is not None else existing["id_aluno"]
    
    aluno_query = "SELECT id, nome_aluno FROM aluno WHERE id = %s"
    aluno = execute_query(aluno_query, (id_aluno,), fetch_one=True)
    
    if not aluno:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Aluno com ID {id_aluno} não encontrado"
        )
    
    # Se a disciplina foi atualizada, verificar se a nova disciplina existe
    disciplina = None
    id_disciplina = nota.id_disciplina if nota.id_disciplina is not None else existing["id_disciplina"]
    
    disciplina_query = "SELECT id, nome_disciplina FROM disciplina WHERE id = %s"
    disciplina = execute_query(disciplina_query, (id_disciplina,), fetch_one=True)
    
    if not disciplina:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Disciplina com ID {id_disciplina} não encontrada"
        )
    
    # Verificar quais campos foram fornecidos para atualização
    updates = {}
    if nota.id_aluno is not None:
        updates["id_aluno"] = nota.id_aluno
    if nota.id_disciplina is not None:
        updates["id_disciplina"] = nota.id_disciplina
    if nota.periodo is not None:
        updates["periodo"] = nota.periodo
    if nota.valor is not None:
        updates["valor"] = nota.valor
    
    if not updates:
        # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
        query = """
        SELECT n.id, n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, n.periodo, n.valor
        FROM nota n
        JOIN aluno a ON n.id_aluno = a.id
        JOIN disciplina d ON n.id_disciplina = d.id
        WHERE n.id = %s
        """
        result = execute_query(query, (nota_id,), fetch_one=True)
        return result
    
    # Construir a query de atualização
    set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
    query = f"""
    UPDATE nota 
    SET {set_clause} 
    WHERE id = %s 
    RETURNING id, id_aluno, id_disciplina, periodo, valor
    """
    
    # Montar os parâmetros na ordem correta
    params = list(updates.values())
    params.append(nota_id)
    
    result = execute_query(query, params, fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Falha ao atualizar nota"
        )
    
    # Retornar o resultado com informações adicionais
    return {
        "id": result["id"],
        "id_aluno": result["id_aluno"],
        "nome_aluno": aluno["nome_aluno"],
        "id_disciplina": result["id_disciplina"],
        "nome_disciplina": disciplina["nome_disciplina"],
        "periodo": result["periodo"],
        "valor": result["valor"]
    }

@app.delete("/api/notas/{nota_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nota(nota_id: int = Path(..., description="ID da nota")):
    """Remove uma nota do sistema."""
    # Verificar se a nota existe
    check_query = "SELECT id FROM nota WHERE id = %s"
    existing = execute_query(check_query, (nota_id,), fetch_one=True)
    
    if not existing:
        raise HTTPException(status_code=404, detail="Nota não encontrada")
    
    # Excluir a nota
    query = "DELETE FROM nota WHERE id = %s"
    execute_query(query, (nota_id,), fetch=False)
    
    return None  # HTTP 204 (No Content)

@app.get("/api/boletim/{aluno_id}", response_model=Boletim)
def get_boletim(
    aluno_id: str = Path(..., description="ID ou código do aluno"),
    periodo: Optional[str] = Query(None, description="Filtrar por período específico")
):
    """
    Obtém o boletim com todas as notas de um aluno, agrupadas por disciplina.
    Opcionalmente, pode filtrar por um período específico.
    """
    # Verificar se o aluno existe
    aluno_params = None
    if aluno_id.isdigit():
        aluno_query = "SELECT id, id_aluno, nome_aluno FROM aluno WHERE id = %s"
        aluno_params = (int(aluno_id),)
    else:
        aluno_query = "SELECT id, id_aluno, nome_aluno FROM aluno WHERE id_aluno = %s"
        aluno_params = (aluno_id,)
    
    aluno = execute_query(aluno_query, aluno_params, fetch_one=True)
    
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Buscar as notas do aluno
    base_query = """
    SELECT n.id, n.id_aluno, n.id_disciplina, d.nome_disciplina, n.periodo, n.valor
    FROM nota n
    JOIN disciplina d ON n.id_disciplina = d.id
    WHERE n.id_aluno = %s
    """
    
    params = [aluno["id"]]
    
    # Adicionar filtro por período, se especificado
    if periodo:
        base_query += " AND n.periodo = %s"
        params.append(periodo)
    
    # Ordenar resultados
    base_query += " ORDER BY d.nome_disciplina, n.periodo"
    
    notas = execute_query(base_query, params)
    
    # Organizar notas por disciplina
    disciplinas = {}
    
    for nota in notas:
        id_disciplina = nota["id_disciplina"]
        
        if id_disciplina not in disciplinas:
            disciplinas[id_disciplina] = {
                "id_disciplina": id_disciplina,
                "nome_disciplina": nota["nome_disciplina"],
                "notas": []
            }
        
        disciplinas[id_disciplina]["notas"].append({
            "id": nota["id"],
            "periodo": nota["periodo"],
            "valor": nota["valor"]
        })
        
        # Calcular média da disciplina se houver notas
        if disciplinas[id_disciplina]["notas"]:
            total = sum(n["valor"] for n in disciplinas[id_disciplina]["notas"])
            count = len(disciplinas[id_disciplina]["notas"])
            disciplinas[id_disciplina]["media"] = round(total / count, 2)
    
    # Montar o boletim
    boletim = {
        "id_aluno": aluno["id"],
        "nome_aluno": aluno["nome_aluno"],
        "disciplinas": list(disciplinas.values())
    }
    
    return boletim 

if __name__ == "__main__":
    uvicorn.run("simplified_api:app", host="0.0.0.0", port=4000, reload=True) 