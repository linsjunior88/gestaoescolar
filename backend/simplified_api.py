"""
API Simplificada para o Sistema de Gestão Escolar
Este script implementa uma versão simplificada da API usando FastAPI e psycopg2
para conexão direta com o PostgreSQL.
"""
from fastapi import Request, FastAPI, HTTPException, Depends, status, Query, Path, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2
import psycopg2.extras
import uvicorn
import sys
import os
from datetime import date, datetime
import logging

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# Verificar se estamos em ambiente de produção
IS_PRODUCTION = os.environ.get('PRODUCTION', 'False') == 'True'

# Criação da aplicação FastAPI
app = FastAPI(
    title="Sistema de Gestão Escolar API Simplificada",
    description="API simplificada para o Sistema de Gestão Escolar",
    version="1.0.0",
)

# Configuração de CORS para permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://gestao-escolar-frontend-n9aq.onrender.com"],  # Ajuste para os domínios específicos em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de conexão com o banco de dados
# Usar variáveis de ambiente em produção
if IS_PRODUCTION:
    # Para produção no Render
    DB_PARAMS = {
        "dbname": os.environ.get("DB_NAME", "gestao_escolar"),
        "user": os.environ.get("DB_USER", "postgres"),
        "password": os.environ.get("DB_PASSWORD", ""),
        "host": os.environ.get("DB_HOST", "localhost"),
        "port": os.environ.get("DB_PORT", "5432"),
        "sslmode": "require"
    }
else:
    # Para desenvolvimento local
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

# Modelo para Professor
class Professor(BaseModel):
    id: Optional[int] = None
    id_professor: str
    nome_professor: str
    email_professor: Optional[str] = None
    senha_professor: Optional[str] = None
    disciplinas: Optional[List[str]] = []

# Modelo para login de professor
class ProfessorLogin(BaseModel):
    email_professor: str
    senha_professor: str

class ProfessorCreate(Professor):
    pass

class ProfessorUpdate(BaseModel):
    id_professor: Optional[str] = None
    nome_professor: Optional[str] = None
    email_professor: Optional[str] = None
    senha_professor: Optional[str] = None
    disciplinas: Optional[List[str]] = None

# Modelo para vincular professor e disciplina
class ProfessorDisciplinaVinculo(BaseModel):
    id_professor: str
    id_disciplina: str

# Modelo para Aluno
class AlunoBase(BaseModel):
    id_aluno: str
    nome_aluno: str
    data_nasc: Optional[str] = None
    sexo: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    mae: Optional[str] = None
    id_turma: str

class AlunoCreate(AlunoBase):
    pass

class AlunoUpdate(BaseModel):
    id_aluno: Optional[str] = None
    nome_aluno: Optional[str] = None
    data_nasc: Optional[str] = None
    sexo: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    mae: Optional[str] = None
    id_turma: Optional[str] = None

class Aluno(AlunoBase):
    id: Optional[int] = None
    
    class Config:
        from_attributes = True

# Modelos para notas
class NotaBase(BaseModel):
    id_aluno: str
    id_disciplina: str
    id_turma: str
    ano: int
    bimestre: int
    nota_mensal: Optional[float] = None
    nota_bimestral: Optional[float] = None
    recuperacao: Optional[float] = None
    media: Optional[float] = None
    professor_id: Optional[str] = None  # Adicionar campo opcional para o professor_id

class NotaCreate(NotaBase):
    pass

class NotaUpdate(NotaBase):
    pass

class Nota(NotaBase):
    id: int
    
    class Config:
        from_attributes = True

# Modelo para Log de Atividades
class LogAtividade(BaseModel):
    id: Optional[int] = None
    data_hora: Optional[datetime] = None
    usuario: str
    acao: str
    entidade: str
    entidade_id: str
    detalhe: Optional[str] = None
    status: str = "concluído"  # concluído, pendente, erro
    
    class Config:
        from_attributes = True

class LogCreate(BaseModel):
    usuario: str
    acao: str  # criar, atualizar, excluir, visualizar
    entidade: str  # turma, disciplina, professor, aluno, nota
    entidade_id: str
    detalhe: Optional[str] = None
    status: str = "concluído"  # concluído, pendente, erro

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

@app.get("/api/turmas/{turma_id}/alunos")
def read_alunos_turma(turma_id: str = Path(..., description="ID ou código da turma")):
    """Busca todos os alunos de uma turma específica."""
    print(f"=== INICIANDO BUSCA DE ALUNOS DA TURMA {turma_id} ===")
    try:
        # Primeiro verificamos se a turma existe
        query_turma = "SELECT id_turma FROM turma WHERE id_turma = %s"
        turma_result = execute_query(query_turma, (turma_id,), fetch_one=True)
        
        if not turma_result:
            print(f"Turma com ID {turma_id} não encontrada")
            raise HTTPException(status_code=404, detail=f"Turma com ID {turma_id} não encontrada")
        
        # Buscar alunos da turma diretamente da tabela aluno
        query_alunos = """
        SELECT a.id, a.id_aluno, a.nome_aluno, a.data_nasc, a.sexo,
               a.endereco, a.telefone, a.email, a.mae, a.id_turma
        FROM aluno a
        WHERE a.id_turma = %s
        ORDER BY a.nome_aluno
        """
        
        print(f"Executando consulta: {query_alunos} com parâmetro {turma_id}")
        alunos_results = execute_query(query_alunos, (turma_id,))
        
        if not alunos_results:
            print(f"Nenhum aluno encontrado para a turma {turma_id}")
            return []
        
        # Converter os resultados para lista de alunos
        alunos = []
        for row in alunos_results:
            print(f"Processando aluno: {row}")
            data_nasc = row["data_nasc"]
            if isinstance(data_nasc, (date, datetime)):
                data_nasc = data_nasc.isoformat()
                
            aluno = {
                "id": row["id"],
                "id_aluno": row["id_aluno"],
                "nome_aluno": row["nome_aluno"],
                "data_nasc": data_nasc,
                "sexo": row["sexo"],
                "endereco": row["endereco"],
                "telefone": row["telefone"],
                "email": row["email"],
                "mae": row["mae"],
                "id_turma": row["id_turma"]
            }
            alunos.append(aluno)
        
        print(f"Retornando {len(alunos)} alunos para a turma {turma_id}")
        return alunos
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar alunos da turma {turma_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar alunos da turma: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE ALUNOS DA TURMA {turma_id} ===")

@app.get("/api/turmas/{turma_id}/disciplinas")
def read_disciplinas_turma(turma_id: str):
    print(f"=== INICIANDO BUSCA DE DISCIPLINAS DA TURMA {turma_id} ===")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se a turma existe
        cursor.execute("SELECT id_turma FROM turma WHERE id_turma = %s", (turma_id,))
        if cursor.fetchone() is None:
            conn.close()
            print(f"Turma {turma_id} não encontrada")
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        # Buscar disciplinas vinculadas à turma
        cursor.execute("""
            SELECT d.id_disciplina, d.nome_disciplina, d.carga_horaria
            FROM disciplina d
            JOIN turma_disciplina td ON d.id_disciplina = td.id_disciplina
            WHERE td.id_turma = %s
            ORDER BY d.nome_disciplina
        """, (turma_id,))
        
        disciplinas = []
        for row in cursor.fetchall():
            disciplinas.append({
                "id_disciplina": row[0],
                "nome_disciplina": row[1],
                "carga_horaria": row[2]
            })
        
        print(f"Encontradas {len(disciplinas)} disciplinas para a turma {turma_id}")
        print(f"Disciplinas: {disciplinas}")
        conn.close()
        return disciplinas
    except Exception as e:
        conn.close()
        print(f"Erro ao executar consulta: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar disciplinas da turma: {str(e)}")
    finally:
        print(f"=== FINALIZANDO BUSCA DE DISCIPLINAS DA TURMA {turma_id} ===")

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

@app.get("/api/disciplinas/{disciplina_id}/turmas")
def read_turmas_disciplina(disciplina_id: str = Path(..., description="ID ou código da disciplina")):
    """Busca todas as turmas vinculadas a uma disciplina específica."""
    try:
        # Primeiro verificamos se a disciplina existe
        params = None
        if disciplina_id.isdigit():
            query_disciplina = "SELECT id FROM disciplina WHERE id = %s"
            params = (int(disciplina_id),)
        else:
            query_disciplina = "SELECT id FROM disciplina WHERE id_disciplina = %s"
            params = (disciplina_id,)
            
        disciplina_result = execute_query(query_disciplina, params, fetch_one=True)
        
        if not disciplina_result:
            raise HTTPException(status_code=404, detail=f"Disciplina com ID {disciplina_id} não encontrada")
            
        # Buscar turmas vinculadas à disciplina - versão corrigida conforme indicado pelo usuário
        query_turmas = """
        SELECT t.id_turma, t.serie
        FROM turma t
        JOIN turma_disciplina td ON t.id_turma = td.id_turma
        WHERE td.id_disciplina = %s
        ORDER BY t.id_turma
        """
        
        # Ajuste para verificar a estrutura das tabelas
        if disciplina_id.isdigit():
            disciplina_id_param = int(disciplina_id)
        else:
            disciplina_id_param = disciplina_id
            
        turmas_results = execute_query(query_turmas, (disciplina_id_param,))
        
        # Exibir para debug
        print(f"Disciplina ID: {disciplina_id_param}, SQL: {query_turmas}")
        print(f"Resultados: {turmas_results}")
        
        if not turmas_results:
            return []
            
        # Converter os resultados para lista de turmas
        turmas = []
        for row in turmas_results:
            turma = {
                "id_turma": row["id_turma"],
                "serie": row["serie"]
            }
            turmas.append(turma)
            
        # Verificar se os dados estão completos
        print(f"DEBUG - Turmas vinculadas à disciplina {disciplina_id}:", turmas)
        return turmas
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar turmas da disciplina {disciplina_id}: {e}")
        print(f"Query: {query_turmas}")
        print(f"Parâmetros: {disciplina_id_param}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar turmas da disciplina: {str(e)}"
        )

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
# Endpoints para Professores
# ==============================================================

@app.get("/api/professores/", response_model=List[Professor])
def read_professores():
    """Busca todos os professores cadastrados."""
    print("=== INICIANDO BUSCA DE TODOS OS PROFESSORES ===")
    try:
        # Consulta direta sem tentar acessar senha_professor
        query = """
        SELECT p.id, p.id_professor, p.nome_professor, p.email_professor
        FROM professor p
        ORDER BY p.nome_professor
        """
        print(f"Executando consulta: {query}")
        results = execute_query(query)
        
        if not results:
            print("Nenhum professor encontrado")
            return []
        
        print(f"Encontrados {len(results)} professores")
        
        # Converter os resultados para objetos Professor
        professores = []
        for row in results:
            # Para cada professor, buscar suas disciplinas em uma consulta separada
            query_disciplinas = """
            SELECT DISTINCT id_disciplina
            FROM professor_disciplina_turma
            WHERE id_professor = %s
            """
            disciplinas_result = execute_query(query_disciplinas, (row["id_professor"],))
            
            disciplinas = []
            if disciplinas_result:
                disciplinas = [d["id_disciplina"] for d in disciplinas_result]
                print(f"Professor {row['id_professor']} tem {len(disciplinas)} disciplinas: {disciplinas}")
            
            professor = {
                "id": row["id"],
                "id_professor": row["id_professor"],
                "nome_professor": row["nome_professor"],
                "email_professor": row["email_professor"],
                "senha_professor": None,  # Definir como None por padrão
                "disciplinas": disciplinas
            }
            professores.append(professor)
        
        print("Retornando lista de professores com sucesso")
        return professores
    except Exception as e:
        print(f"ERRO ao buscar professores: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar professores: {str(e)}"
        )
    finally:
        print("=== FINALIZANDO BUSCA DE TODOS OS PROFESSORES ===")

@app.get("/api/professores/{professor_id}", response_model=Professor)
def read_professor(professor_id: str = Path(..., description="ID ou código do professor")):
    """Busca um professor específico pelo ID ou código."""
    print(f"=== INICIANDO BUSCA DO PROFESSOR {professor_id} ===")
    try:
        # Consulta direta sem tentar acessar senha_professor
        query = """
        SELECT p.id, p.id_professor, p.nome_professor, p.email_professor
        FROM professor p
        WHERE p.id_professor = %s
        """
        
        print(f"Executando consulta: {query}")
        result = execute_query(query, (professor_id,), fetch_one=True)
        
        if not result:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail="Professor não encontrado")
        
        print(f"Professor {professor_id} encontrado")
        
        # Buscar disciplinas do professor em consulta separada
        query_disciplinas = """
        SELECT DISTINCT id_disciplina
        FROM professor_disciplina_turma
        WHERE id_professor = %s
        """
        disciplinas_result = execute_query(query_disciplinas, (professor_id,))
        
        disciplinas = []
        if disciplinas_result:
            disciplinas = [d["id_disciplina"] for d in disciplinas_result]
            print(f"Professor {professor_id} tem {len(disciplinas)} disciplinas: {disciplinas}")
        
        professor = {
            "id": result["id"],
            "id_professor": result["id_professor"],
            "nome_professor": result["nome_professor"],
            "email_professor": result["email_professor"],
            "senha_professor": None,  # Definir como None por padrão
            "disciplinas": disciplinas
        }
        
        print(f"Retornando dados do professor {professor_id}")
        return professor
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar professor {professor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DO PROFESSOR {professor_id} ===")

@app.get("/api/professores/vinculos/{prof_id}")
def read_vinculos_professor_by_id(prof_id: str = Path(..., description="ID do professor para buscar vínculos")):
    logger.debug(f"Tentando acessar endpoint /api/professores/vinculos/{prof_id}")
    try:
        # Registrar a tentativa de verificar o professor
        logger.debug(f"Verificando professor com ID: {prof_id}")
        query_professor = "SELECT * FROM professor WHERE id_professor = %s"
        professor_result = execute_query(query_professor, (prof_id,), fetch_one=True)
        
        logger.debug(f"Resultado da consulta: {professor_result}")
        
        if not professor_result:
            logger.debug(f"Professor com ID {prof_id} não encontrado")
            raise HTTPException(status_code=404, detail=f"Professor com ID {prof_id} não encontrado")
        
        # Buscar vínculos do professor
        query_vinculos = """
        SELECT 
            pdt.id_professor,
            p.nome_professor,
            pdt.id_disciplina, 
            d.nome_disciplina,
            pdt.id_turma,
            t.serie,
            t.turno
        FROM 
            professor_disciplina_turma pdt
            JOIN professor p ON pdt.id_professor = p.id_professor
            JOIN disciplina d ON pdt.id_disciplina = d.id_disciplina
            JOIN turma t ON pdt.id_turma = t.id_turma
        WHERE 
            pdt.id_professor = %s
        ORDER BY 
            d.nome_disciplina, t.id_turma
        """
        
        vinculos_results = execute_query(query_vinculos, (prof_id,))
        
        if not vinculos_results:
            return []
        
        # Converter resultados em uma lista estruturada
        vinculos = []
        for row in vinculos_results:
            vinculo = {
                "id_professor": row["id_professor"],
                "nome_professor": row["nome_professor"],
                "id_disciplina": row["id_disciplina"],
                "nome_disciplina": row["nome_disciplina"],
                "id_turma": row["id_turma"],
                "serie": row["serie"],
                "turno": row["turno"]
            }
            vinculos.append(vinculo)
        
        return vinculos
        
    except Exception as e:
        logger.exception(f"Erro ao processar requisição: {str(e)}")
        raise

# Endpoint para verificar detalhes de uma turma específica
@app.get("/api/turmas/{turma_id}/detalhes")
def read_turma_detalhes(turma_id: str = Path(..., description="ID da turma")):
    """Busca detalhes completos de uma turma específica."""
    try:
        # Buscar detalhes da turma - Corrigido para usar id_turma em vez de usar id
        query_turma = "SELECT * FROM turma WHERE id_turma = %s"
        turma_result = execute_query(query_turma, (turma_id,), fetch_one=True)
        
        if not turma_result:
            raise HTTPException(status_code=404, detail=f"Turma com ID {turma_id} não encontrada")
        
        # Converter para dict e retornar
        turma = dict(turma_result)
        print(f"Detalhes da turma {turma_id}:", turma)
        return turma
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar detalhes da turma {turma_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar detalhes da turma: {str(e)}"
        )

# Endpoint com nome totalmente diferente para evitar qualquer conflito possível
@app.get("/api/buscar_vinculos_professor_completo/{prof_id}")
def buscar_vinculos_professor_completo(prof_id: str = Path(..., description="ID do professor")):
    """
    Busca todos os vínculos entre professor, disciplinas e turmas direto da tabela de relacionamento.
    Usa uma consulta SQL direta que une as tabelas professor_disciplina_turma, professor, disciplina e turma.
    """
    print(f"=== COMEÇANDO BUSCA DE VÍNCULOS PARA PROFESSOR: {prof_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT * FROM professor WHERE id_professor = %s"
        print(f"Executando query para verificar professor: {query_professor} com parâmetro: {prof_id}")
        professor_result = execute_query(query_professor, (prof_id,), fetch_one=True)
        
        if not professor_result:
            print(f"Professor com ID {prof_id} não encontrado")
            raise HTTPException(status_code=404, detail=f"Professor com ID {prof_id} não encontrado")
        
        print(f"Professor encontrado: {prof_id}, ID interno: {professor_result['id']}")
        
        # Buscar todos os vínculos do professor diretamente da tabela de relacionamento
        query_vinculos = """
        SELECT 
            pdt.id_professor,
            p.nome_professor,
            pdt.id_disciplina, 
            d.nome_disciplina,
            pdt.id_turma,
            t.serie,
            t.turno
        FROM 
            professor_disciplina_turma pdt
            JOIN professor p ON pdt.id_professor = p.id_professor
            JOIN disciplina d ON pdt.id_disciplina = d.id_disciplina
            JOIN turma t ON pdt.id_turma = t.id_turma
        WHERE 
            pdt.id_professor = %s
        ORDER BY 
            d.nome_disciplina, t.id_turma
        """
        
        print(f"Executando query para buscar vínculos: {query_vinculos}")
        vinculos_results = execute_query(query_vinculos, (prof_id,))
        
        print(f"Query executada com sucesso. Resultados encontrados: {len(vinculos_results) if vinculos_results else 0}")
        
        if not vinculos_results:
            print(f"Nenhum vínculo encontrado para o professor {prof_id}")
            return []
        
        # Converter resultados em uma lista estruturada
        vinculos = []
        for row in vinculos_results:
            vinculo = {
                "id_professor": row["id_professor"],
                "nome_professor": row["nome_professor"],
                "id_disciplina": row["id_disciplina"],
                "nome_disciplina": row["nome_disciplina"],
                "id_turma": row["id_turma"],
                "serie": row["serie"],
                "turno": row["turno"]
            }
            vinculos.append(vinculo)
            print(f"Vínculo encontrado: Professor={vinculo['nome_professor']}, Disciplina={vinculo['nome_disciplina']}, Turma={vinculo['id_turma']}, Série={vinculo['serie']}")
        
        print(f"Total de vínculos encontrados: {len(vinculos)}")
        return vinculos
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar vínculos do professor {prof_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar vínculos do professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE VÍNCULOS PARA PROFESSOR: {prof_id} ===")

@app.get("/api/prof001_vinculos")
def get_prof001_vinculos():
    """
    Endpoint específico para PROF001 para garantir funcionamento.
    """
    print(f"=== BUSCANDO VÍNCULOS PARA O PROFESSOR FIXO: PROF001 ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT * FROM professor WHERE id_professor = 'PROF001'"
        professor_result = execute_query(query_professor, (), fetch_one=True)
        
        if not professor_result:
            return {"status": "error", "message": "Professor PROF001 não encontrado"}
        
        # Buscar todos os vínculos do professor
        query_vinculos = """
        SELECT 
            pdt.id_professor,
            p.nome_professor,
            pdt.id_disciplina, 
            d.nome_disciplina,
            pdt.id_turma,
            t.serie,
            t.turno
        FROM 
            professor_disciplina_turma pdt
            JOIN professor p ON pdt.id_professor = p.id_professor
            JOIN disciplina d ON pdt.id_disciplina = d.id_disciplina
            JOIN turma t ON pdt.id_turma = t.id_turma
        WHERE 
            pdt.id_professor = 'PROF001'
        ORDER BY 
            d.nome_disciplina, t.id_turma
        """
        
        vinculos_results = execute_query(query_vinculos, ())
        
        # Converter resultados em lista
        vinculos = []
        for row in vinculos_results:
            vinculo = {
                "id_professor": row["id_professor"],
                "nome_professor": row["nome_professor"],
                "id_disciplina": row["id_disciplina"],
                "nome_disciplina": row["nome_disciplina"],
                "id_turma": row["id_turma"],
                "serie": row["serie"],
                "turno": row["turno"]
            }
            vinculos.append(vinculo)
        
        return vinculos
        
    except Exception as e:
        print(f"ERRO ao buscar vínculos do professor PROF001: {e}")
        return {"status": "error", "message": f"Erro: {str(e)}"}

@app.post("/api/professores/vinculos", status_code=status.HTTP_201_CREATED)
def vincular_professor_disciplina_direto(vinculo: ProfessorDisciplinaVinculo):
    """Endpoint otimizado para vincular um professor a uma disciplina com transação."""
    print(f"=== CRIANDO VÍNCULO: Professor {vinculo.id_professor} - Disciplina {vinculo.id_disciplina} ===")
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Verificar se o professor existe
        cursor.execute("SELECT id FROM professor WHERE id_professor = %s", (vinculo.id_professor,))
        professor_result = cursor.fetchone()
        
        if not professor_result:
            print(f"Professor {vinculo.id_professor} não encontrado")
            return {
                "status": "error",
                "message": f"Professor {vinculo.id_professor} não encontrado"
            }
        
        # Verificar se a disciplina existe
        cursor.execute("SELECT id FROM disciplina WHERE id_disciplina = %s", (vinculo.id_disciplina,))
        disciplina_result = cursor.fetchone()
        
        if not disciplina_result:
            print(f"Disciplina {vinculo.id_disciplina} não encontrada")
            return {
                "status": "error",
                "message": f"Disciplina {vinculo.id_disciplina} não encontrada"
            }
        
        # Buscar turmas vinculadas à disciplina
        cursor.execute("""
            SELECT td.id_turma 
            FROM turma_disciplina td 
            WHERE td.id_disciplina = %s
        """, (vinculo.id_disciplina,))
        
        turmas = cursor.fetchall()
        
        if not turmas:
            print(f"Disciplina {vinculo.id_disciplina} não tem turmas vinculadas")
            return {
                "status": "warning",
                "message": f"Disciplina {vinculo.id_disciplina} não tem turmas vinculadas"
            }
        
        vinculos_criados = 0
        turmas_vinculadas = []
        
        for turma in turmas:
            id_turma = turma['id_turma']
            
            # Verificar se já existe o vínculo
            cursor.execute("""
                SELECT id FROM professor_disciplina_turma 
                WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
            """, (vinculo.id_professor, vinculo.id_disciplina, id_turma))
            
            vinculo_existente = cursor.fetchone()
            
            if not vinculo_existente:
                # Inserir novo vínculo
                cursor.execute("""
                    INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
                    VALUES (%s, %s, %s)
                """, (vinculo.id_professor, vinculo.id_disciplina, id_turma))
                
                vinculos_criados += 1
                turmas_vinculadas.append(id_turma)
                print(f"Vínculo criado: Professor={vinculo.id_professor}, Disciplina={vinculo.id_disciplina}, Turma={id_turma}")
        
        conn.commit()
        print(f"Transação concluída com sucesso, {vinculos_criados} vínculos criados")
        
        # Retornar resultados
        return {
            "status": "success",
            "message": f"Criados {vinculos_criados} vínculos para o professor {vinculo.id_professor} com a disciplina {vinculo.id_disciplina}",
            "vinculos_criados": vinculos_criados,
            "turmas_vinculadas": turmas_vinculadas
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERRO ao criar vínculo: {str(e)}")
        return {
            "status": "error",
            "message": f"Erro ao criar vínculo: {str(e)}"
        }
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print(f"=== FIM DA CRIAÇÃO DE VÍNCULO ===")

@app.put("/api/professores/{professor_id}", response_model=Professor)
def update_professor(
    professor_id: str = Path(..., description="ID do professor"),
    professor: ProfessorUpdate = Body(...)
):
    """Atualiza os dados de um professor existente."""
    print(f"=== INICIANDO ATUALIZAÇÃO DO PROFESSOR {professor_id} ===")
    try:
        # Verificar se o professor existe
        check_query = "SELECT id FROM professor WHERE id_professor = %s"
        existing = execute_query(check_query, (professor_id,), fetch_one=True)
        
        if not existing:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail="Professor não encontrado")
        
        # Verificar quais campos foram fornecidos para atualização
        updates = {}
        if professor.id_professor is not None:
            updates["id_professor"] = professor.id_professor
        if professor.nome_professor is not None:
            updates["nome_professor"] = professor.nome_professor
        if professor.email_professor is not None:
            updates["email_professor"] = professor.email_professor
        if professor.senha_professor is not None:
            # Usamos o campo 'senha' no banco de dados
            updates["senha"] = professor.senha_professor
        
        print(f"Campos a atualizar: {updates}")
        
        if not updates:
            # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
            return read_professor(professor_id)
        
        # Construir a query de atualização
        set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
        query = f"UPDATE professor SET {set_clause} WHERE id = %s RETURNING id, id_professor, nome_professor, email_professor"
        
        # Montar os parâmetros na ordem correta
        params = list(updates.values())
        params.append(existing["id"])
        
        print(f"Executando query: {query} com parâmetros: {params}")
        result = execute_query(query, params, fetch_one=True)
        
        if not result:
            print("Falha ao atualizar professor")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao atualizar professor"
            )
        
        # Se foram fornecidas disciplinas, atualizamos os vínculos
        if professor.disciplinas is not None and isinstance(professor.disciplinas, list):
            # Primeiro removemos os vínculos existentes
            conn = get_db_connection()
            try:
                cursor = conn.cursor()
                
                # Remover vínculos existentes (opcional, dependendo do comportamento desejado)
                # cursor.execute("DELETE FROM professor_disciplina_turma WHERE id_professor = %s", (professor_id,))
                
                # Adicionar novos vínculos para cada disciplina
                for disciplina_id in professor.disciplinas:
                    print(f"Verificando disciplina: {disciplina_id}")
                    # Primeiro verificamos se a disciplina existe
                    cursor.execute("SELECT id FROM disciplina WHERE id_disciplina = %s", (disciplina_id,))
                    disciplina_result = cursor.fetchone()
                    
                    if not disciplina_result:
                        print(f"Disciplina {disciplina_id} não encontrada")
                        continue
                    
                    # Buscar turmas vinculadas à disciplina
                    cursor.execute("""
                        SELECT td.id_turma 
                        FROM turma_disciplina td 
                        WHERE td.id_disciplina = %s
                    """, (disciplina_id,))
                    
                    turmas = cursor.fetchall()
                    
                    if not turmas:
                        print(f"Disciplina {disciplina_id} não tem turmas vinculadas")
                        continue
                    
                    # Para cada turma, criar um vínculo
                    for turma in turmas:
                        id_turma = turma[0]
                        
                        # Verificar se já existe o vínculo
                        cursor.execute("""
                            SELECT id FROM professor_disciplina_turma 
                            WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
                        """, (professor_id, disciplina_id, id_turma))
                        
                        vinculo_existente = cursor.fetchone()
                        
                        if not vinculo_existente:
                            # Inserir novo vínculo
                            cursor.execute("""
                                INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
                                VALUES (%s, %s, %s)
                            """, (professor_id, disciplina_id, id_turma))
                            
                            print(f"Vínculo criado: Professor={professor_id}, Disciplina={disciplina_id}, Turma={id_turma}")
                
                conn.commit()
                print("Vínculos atualizados com sucesso")
            except Exception as e:
                conn.rollback()
                print(f"Erro ao atualizar vínculos: {e}")
            finally:
                if conn:
                    conn.close()
        
        # Buscar dados atualizados com as disciplinas
        updated_professor = read_professor(professor_id if not updates.get("id_professor") else updates["id_professor"])
        print(f"Professor atualizado: {updated_professor}")
        return updated_professor
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao atualizar professor {professor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO ATUALIZAÇÃO DO PROFESSOR {professor_id} ===")

@app.post("/api/professores/login")
def login_professor(login_data: ProfessorLogin):
    """Endpoint para autenticação de professores via email e senha."""
    print(f"=== TENTATIVA DE LOGIN: {login_data.email_professor} ===")
    try:
        # Buscar professor pelo email
        query = "SELECT * FROM professor WHERE email_professor = %s"
        result = execute_query(query, (login_data.email_professor,), fetch_one=True)
        
        if not result:
            print(f"Professor com email {login_data.email_professor} não encontrado")
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Verificar a senha (em produção, usaríamos verificação de hash)
        # Corrigido: usando "senha" ao invés de "senha_professor"
        if result["senha"] != login_data.senha_professor:
            print("Senha incorreta")
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Buscar disciplinas do professor
        query_disciplinas = """
        SELECT id_disciplina FROM professor_disciplina_turma 
        WHERE id_professor = %s 
        GROUP BY id_disciplina
        """
        disciplinas_result = execute_query(query_disciplinas, (result["id_professor"],))
        
        disciplinas = []
        if disciplinas_result:
            disciplinas = [d["id_disciplina"] for d in disciplinas_result]
        
        # Retornar dados do professor (sem a senha)
        professor_data = {
            "id": result["id"],
            "id_professor": result["id_professor"],
            "nome_professor": result["nome_professor"],
            "email_professor": result["email_professor"],
            "disciplinas": disciplinas
        }
        
        # Registrar atividade de login no log
        try:
            log_data = {
                "usuario": result["nome_professor"],
                "acao": "login",
                "entidade": "professor",
                "entidade_id": result["id_professor"],
                "detalhe": "Login realizado com sucesso",
                "status": "concluído"
            }
            
            log_query = """
            INSERT INTO log_atividade (usuario, acao, entidade, entidade_id, detalhe, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            execute_query(log_query, (
                log_data["usuario"], 
                log_data["acao"], 
                log_data["entidade"], 
                log_data["entidade_id"], 
                log_data["detalhe"], 
                log_data["status"]
            ), fetch=False)
            
        except Exception as e:
            print(f"Erro ao registrar log de login: {str(e)}")
        
        print(f"Login bem-sucedido para o professor {result['nome_professor']}")
        return professor_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro durante login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro durante login: {str(e)}")

@app.get("/api/professores/{professor_id}/dashboard")
def get_professor_dashboard(professor_id: str):
    """Retorna dados resumidos para o dashboard do professor."""
    print(f"=== BUSCANDO DADOS DO DASHBOARD PARA O PROFESSOR {professor_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT id_professor FROM professor WHERE id_professor = %s"
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        
        if not professor_result:
            raise HTTPException(status_code=404, detail=f"Professor com ID {professor_id} não encontrado")
        
        # 1. Contar turmas do professor
        query_turmas = """
        SELECT COUNT(DISTINCT id_turma) as total_turmas 
        FROM professor_disciplina_turma 
        WHERE id_professor = %s
        """
        turmas_count = execute_query(query_turmas, (professor_id,), fetch_one=True)
        total_turmas = turmas_count["total_turmas"] if turmas_count else 0
        
        # 2. Contar disciplinas do professor
        query_disciplinas = """
        SELECT COUNT(DISTINCT id_disciplina) as total_disciplinas 
        FROM professor_disciplina_turma 
        WHERE id_professor = %s
        """
        disciplinas_count = execute_query(query_disciplinas, (professor_id,), fetch_one=True)
        total_disciplinas = disciplinas_count["total_disciplinas"] if disciplinas_count else 0
        
        # 3. Contar alunos nas turmas do professor
        query_alunos = """
        SELECT COUNT(DISTINCT a.id_aluno) as total_alunos
        FROM aluno a
        JOIN professor_disciplina_turma pdt ON a.id_turma = pdt.id_turma
        WHERE pdt.id_professor = %s
        """
        alunos_count = execute_query(query_alunos, (professor_id,), fetch_one=True)
        total_alunos = alunos_count["total_alunos"] if alunos_count else 0
        
        # 4. Contar notas lançadas pelo professor
        query_notas = """
        SELECT COUNT(*) as total_notas
        FROM nota n
        JOIN professor_disciplina_turma pdt ON 
            n.id_turma = pdt.id_turma AND
            n.id_disciplina = pdt.id_disciplina
        WHERE pdt.id_professor = %s
        """
        notas_count = execute_query(query_notas, (professor_id,), fetch_one=True)
        total_notas = notas_count["total_notas"] if notas_count else 0
        
        # 5. Buscar atividades recentes do professor
        query_logs = """
        SELECT * FROM log_atividade
        WHERE usuario = (SELECT nome_professor FROM professor WHERE id_professor = %s)
        ORDER BY data_hora DESC
        LIMIT 5
        """
        logs_result = execute_query(query_logs, (professor_id,))
        atividades_recentes = []
        
        if logs_result:
            for log in logs_result:
                atividades_recentes.append({
                    "data_hora": log["data_hora"].isoformat() if log["data_hora"] else None,
                    "acao": log["acao"],
                    "entidade": log["entidade"],
                    "entidade_id": log["entidade_id"],
                    "detalhe": log["detalhe"],
                    "status": log["status"]
                })
        
        return {
            "total_turmas": total_turmas,
            "total_disciplinas": total_disciplinas,
            "total_alunos": total_alunos,
            "total_notas_lancadas": total_notas,
            "atividades_recentes": atividades_recentes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar dados do dashboard do professor: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar dados do dashboard do professor: {str(e)}"
        )

@app.get("/api/professores/{professor_id}/turmas")
def get_professor_turmas(professor_id: str):
    """Retorna todas as turmas associadas a um professor."""
    print(f"=== BUSCANDO TURMAS DO PROFESSOR {professor_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT id_professor FROM professor WHERE id_professor = %s"
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        
        if not professor_result:
            raise HTTPException(status_code=404, detail=f"Professor com ID {professor_id} não encontrado")
        
        # Buscar todas as turmas do professor com contagem de alunos
        query_turmas = """
        SELECT DISTINCT t.*, 
            (SELECT COUNT(*) FROM aluno a WHERE a.id_turma = t.id_turma) as qtd_alunos
        FROM turma t
        JOIN professor_disciplina_turma pdt ON t.id_turma = pdt.id_turma
        WHERE pdt.id_professor = %s
        ORDER BY t.id_turma
        """
        turmas_result = execute_query(query_turmas, (professor_id,))
        
        if not turmas_result:
            print(f"Nenhuma turma encontrada para o professor {professor_id}")
            return []
        
        turmas = []
        for turma in turmas_result:
            # Assegurar que cada campo existe antes de tentar acessá-lo
            serie = turma.get("serie", "")
            turno = turma.get("turno", "")
            
            turmas.append({
                "id": turma["id"],
                "id_turma": turma["id_turma"],
                "serie_turma": serie,
                "turno_turma": turno,
                "qtd_alunos": turma.get("qtd_alunos", 0),
                "ano_letivo": turma.get("ano_letivo", 0)
            })
        
        print(f"Encontradas {len(turmas)} turmas para o professor {professor_id}")
        # Para depuração
        print(f"Dados das turmas: {turmas}")
        return turmas
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar turmas do professor: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar turmas do professor: {str(e)}"
        )

@app.get("/api/professores/{professor_id}/alunos")
def get_professor_alunos(professor_id: str, turma_id: Optional[str] = None):
    """Retorna todos os alunos das turmas de um professor, com filtro opcional por turma."""
    print(f"=== BUSCANDO ALUNOS DO PROFESSOR {professor_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT id_professor FROM professor WHERE id_professor = %s"
        print(f"Executando query para verificar professor: {query_professor} com parâmetro: {professor_id}")
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        print(f"Resultado da query de professor: {professor_result}")
        
        if not professor_result:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail=f"Professor com ID {professor_id} não encontrado")
        
        # Construir a query base
        query_alunos = """
        SELECT DISTINCT a.* 
        FROM aluno a
        JOIN professor_disciplina_turma pdt ON a.id_turma = pdt.id_turma
        WHERE pdt.id_professor = %s
        """
        
        params = [professor_id]
        
        # Adicionar filtro por turma se especificado
        if turma_id:
            query_alunos += " AND a.id_turma = %s"
            params.append(turma_id)
        
        query_alunos += " ORDER BY a.nome_aluno"
        
        print(f"Executando query para buscar alunos: {query_alunos} com parâmetros: {params}")
        alunos_result = execute_query(query_alunos, tuple(params))
        print(f"Resultados retornados: {len(alunos_result) if alunos_result else 0}")
        
        if not alunos_result:
            print(f"Nenhum aluno encontrado para o professor {professor_id}")
            if turma_id:
                print(f"com o filtro de turma {turma_id}")
                
            # Verificar se o professor tem vínculos com turmas
            vinculos_query = """
            SELECT COUNT(*) as total FROM professor_disciplina_turma 
            WHERE id_professor = %s
            """
            vinculos_result = execute_query(vinculos_query, (professor_id,), fetch_one=True)
            print(f"Verificação de vínculos do professor: {vinculos_result}")
            
            # Verificar se existem alunos nas turmas vinculadas ao professor
            alunos_turmas_query = """
            SELECT t.id_turma, COUNT(a.id_aluno) as total_alunos
            FROM professor_disciplina_turma pdt
            JOIN turma t ON pdt.id_turma = t.id_turma
            LEFT JOIN aluno a ON t.id_turma = a.id_turma
            WHERE pdt.id_professor = %s
            GROUP BY t.id_turma
            """
            alunos_turmas_result = execute_query(alunos_turmas_query, (professor_id,))
            print(f"Verificação de alunos nas turmas do professor: {alunos_turmas_result}")
            
            return []
        
        alunos = []
        for aluno in alunos_result:
            print(f"Processando aluno: {aluno['id_aluno']} - {aluno['nome_aluno']}")
            aluno_obj = {
                "id": aluno["id"],
                "id_aluno": aluno["id_aluno"],
                "nome_aluno": aluno["nome_aluno"],
                "id_turma": aluno["id_turma"],
                "email_aluno": aluno.get("email"),  # Using get() to avoid KeyError
                "telefone_aluno": aluno.get("telefone")  # Using get() to avoid KeyError
            }
            alunos.append(aluno_obj)
        
        filtro_msg = f" na turma {turma_id}" if turma_id else ""
        print(f"Encontrados {len(alunos)} alunos para o professor {professor_id}{filtro_msg}")
        return alunos
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar alunos do professor: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar alunos do professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE ALUNOS DO PROFESSOR {professor_id} ===")

@app.get("/api/professores/{professor_id}/turmas/{turma_id}/disciplinas")
def get_professor_disciplinas_turma(professor_id: str, turma_id: str):
    """Retorna todas as disciplinas que um professor leciona em uma turma específica."""
    print(f"=== BUSCANDO DISCIPLINAS DO PROFESSOR {professor_id} NA TURMA {turma_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT id_professor FROM professor WHERE id_professor = %s"
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        
        if not professor_result:
            raise HTTPException(status_code=404, detail=f"Professor com ID {professor_id} não encontrado")
        
        # Verificar se a turma existe
        query_turma = "SELECT id_turma FROM turma WHERE id_turma = %s"
        turma_result = execute_query(query_turma, (turma_id,), fetch_one=True)
        
        if not turma_result:
            raise HTTPException(status_code=404, detail=f"Turma com ID {turma_id} não encontrada")
        
        # Buscar as disciplinas do professor na turma específica
        query_disciplinas = """
        SELECT DISTINCT d.*
        FROM disciplina d
        JOIN professor_disciplina_turma pdt ON d.id_disciplina = pdt.id_disciplina
        WHERE pdt.id_professor = %s AND pdt.id_turma = %s
        ORDER BY d.nome_disciplina
        """
        
        disciplinas_result = execute_query(query_disciplinas, (professor_id, turma_id))
        
        if not disciplinas_result:
            print(f"Nenhuma disciplina encontrada para o professor {professor_id} na turma {turma_id}")
            return []
        
        disciplinas = []
        for disciplina in disciplinas_result:
            disciplinas.append({
                "id": disciplina["id"],
                "id_disciplina": disciplina["id_disciplina"],
                "nome_disciplina": disciplina["nome_disciplina"]
            })
        
        print(f"Encontradas {len(disciplinas)} disciplinas para o professor {professor_id} na turma {turma_id}")
        return disciplinas
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar disciplinas do professor na turma: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar disciplinas do professor na turma: {str(e)}"
        )

# ==============================================================
# Endpoints para Alunos
# ==============================================================

@app.get("/api/alunos/", response_model=List[Aluno])
def read_alunos():
    """Busca todos os alunos cadastrados."""
    print("=== INICIANDO BUSCA DE TODOS OS ALUNOS ===")
    try:
        query = """
        SELECT a.id, a.id_aluno, a.nome_aluno, a.data_nasc, a.sexo,
               a.endereco, a.telefone, a.email, a.mae, a.id_turma
        FROM aluno a
        ORDER BY a.nome_aluno
        """
        
        print(f"Executando consulta: {query}")
        results = execute_query(query)
        
        if not results:
            print("Nenhum aluno encontrado")
            return []
        
        print(f"Encontrados {len(results)} alunos")
        
        # Converter os resultados para objetos Aluno
        alunos = []
        for row in results:
            aluno = {
                "id": row["id"],
                "id_aluno": row["id_aluno"],
                "nome_aluno": row["nome_aluno"],
                "data_nasc": row["data_nasc"].isoformat() if row["data_nasc"] else None,
                "sexo": row["sexo"],
                "endereco": row["endereco"],
                "telefone": row["telefone"],
                "email": row["email"],
                "mae": row["mae"],
                "id_turma": row["id_turma"]
            }
            alunos.append(aluno)
        
        print("Retornando lista de alunos com sucesso")
        return alunos
    except Exception as e:
        print(f"ERRO ao buscar alunos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar alunos: {str(e)}"
        )
    finally:
        print("=== FINALIZANDO BUSCA DE TODOS OS ALUNOS ===")

@app.get("/api/alunos/{aluno_id}", response_model=Aluno)
def read_aluno(aluno_id: str = Path(..., description="ID ou código do aluno")):
    """Busca um aluno específico pelo ID ou código."""
    print(f"=== INICIANDO BUSCA DO ALUNO {aluno_id} ===")
    try:
        query = """
        SELECT a.id, a.id_aluno, a.nome_aluno, a.data_nasc, a.sexo,
               a.endereco, a.telefone, a.email, a.mae, a.id_turma
        FROM aluno a
        WHERE a.id_aluno = %s
        """
        
        print(f"Executando consulta: {query}")
        result = execute_query(query, (aluno_id,), fetch_one=True)
        
        if not result:
            print(f"Aluno com ID {aluno_id} não encontrado")
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        
        print(f"Aluno {aluno_id} encontrado")
        
        aluno = {
            "id": result["id"],
            "id_aluno": result["id_aluno"],
            "nome_aluno": result["nome_aluno"],
            "data_nasc": result["data_nasc"].isoformat() if result["data_nasc"] else None,
            "sexo": result["sexo"],
            "endereco": result["endereco"],
            "telefone": result["telefone"],
            "email": result["email"],
            "mae": result["mae"],
            "id_turma": result["id_turma"]
        }
        
        print(f"Retornando dados do aluno {aluno_id}")
        return aluno
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar aluno {aluno_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar aluno: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DO ALUNO {aluno_id} ===")

@app.post("/api/alunos/", response_model=Aluno, status_code=status.HTTP_201_CREATED)
def create_aluno(aluno: AlunoCreate):
    """Cria um novo aluno."""
    print(f"=== INICIANDO CRIAÇÃO DE ALUNO ===")
    try:
        # Verificar se já existe um aluno com o mesmo id_aluno
        check_query = "SELECT id FROM aluno WHERE id_aluno = %s"
        existing = execute_query(check_query, (aluno.id_aluno,), fetch_one=True)
        
        if existing:
            print(f"Aluno com ID {aluno.id_aluno} já existe")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe um aluno com o código {aluno.id_aluno}"
            )
        
        # Verificar se a turma existe
        turma_query = "SELECT id FROM turma WHERE id_turma = %s"
        turma = execute_query(turma_query, (aluno.id_turma,), fetch_one=True)
        
        if not turma:
            print(f"Turma com ID {aluno.id_turma} não encontrada")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Turma com código {aluno.id_turma} não encontrada"
            )
        
        # Inserir o novo aluno
        insert_query = """
        INSERT INTO aluno (id_aluno, nome_aluno, data_nasc, sexo, endereco, telefone, 
                           email, mae, id_turma)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, id_aluno, nome_aluno, data_nasc, sexo, endereco, telefone, 
                 email, mae, id_turma
        """
        
        params = (
            aluno.id_aluno,
            aluno.nome_aluno,
            aluno.data_nasc,
            aluno.sexo,
            aluno.endereco,
            aluno.telefone,
            aluno.email,
            aluno.mae,
            aluno.id_turma
        )
        
        print(f"Executando inserção: {insert_query} com parâmetros: {params}")
        result = execute_query(insert_query, params, fetch_one=True)
        
        if not result:
            print("Falha ao criar aluno")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao criar aluno"
            )
        
        aluno_criado = {
            "id": result["id"],
            "id_aluno": result["id_aluno"],
            "nome_aluno": result["nome_aluno"],
            "data_nasc": result["data_nasc"].isoformat() if result["data_nasc"] else None,
            "sexo": result["sexo"],
            "endereco": result["endereco"],
            "telefone": result["telefone"],
            "email": result["email"],
            "mae": result["mae"],
            "id_turma": result["id_turma"]
        }
        
        print(f"Aluno criado com sucesso: {aluno_criado}")
        return aluno_criado
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao criar aluno: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar aluno: {str(e)}"
        )
    finally:
        print("=== FINALIZANDO CRIAÇÃO DE ALUNO ===")

@app.put("/api/alunos/{aluno_id}", response_model=Aluno)
def update_aluno(
    aluno_id: str = Path(..., description="ID do aluno"),
    aluno: AlunoUpdate = Body(...)
):
    """Atualiza os dados de um aluno existente."""
    print(f"=== INICIANDO ATUALIZAÇÃO DO ALUNO {aluno_id} ===")
    try:
        # Verificar se o aluno existe
        check_query = "SELECT id FROM aluno WHERE id_aluno = %s"
        existing = execute_query(check_query, (aluno_id,), fetch_one=True)
        
        if not existing:
            print(f"Aluno com ID {aluno_id} não encontrado")
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        
        # Verificar quais campos foram fornecidos para atualização
        updates = {}
        if aluno.id_aluno is not None:
            updates["id_aluno"] = aluno.id_aluno
        if aluno.nome_aluno is not None:
            updates["nome_aluno"] = aluno.nome_aluno
        if aluno.data_nasc is not None:
            updates["data_nasc"] = aluno.data_nasc
        if aluno.sexo is not None:
            updates["sexo"] = aluno.sexo
        if aluno.endereco is not None:
            updates["endereco"] = aluno.endereco
        if aluno.telefone is not None:
            updates["telefone"] = aluno.telefone
        if aluno.email is not None:
            updates["email"] = aluno.email
        if aluno.mae is not None:
            updates["mae"] = aluno.mae
        if aluno.id_turma is not None:
            # Verificar se a turma existe
            turma_query = "SELECT id FROM turma WHERE id_turma = %s"
            turma = execute_query(turma_query, (aluno.id_turma,), fetch_one=True)
            
            if not turma:
                print(f"Turma com ID {aluno.id_turma} não encontrada")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Turma com código {aluno.id_turma} não encontrada"
                )
            
            updates["id_turma"] = aluno.id_turma
        
        print(f"Campos a atualizar: {updates}")
        
        if not updates:
            # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
            return read_aluno(aluno_id)
        
        # Construir a query de atualização
        set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
        query = f"""
        UPDATE aluno
        SET {set_clause}
        WHERE id = %s
        RETURNING id, id_aluno, nome_aluno, data_nasc, sexo, endereco, telefone, 
                  email, mae, id_turma
        """
        
        # Montar os parâmetros na ordem correta
        params = list(updates.values())
        params.append(existing["id"])
        
        print(f"Executando query: {query} com parâmetros: {params}")
        result = execute_query(query, params, fetch_one=True)
        
        if not result:
            print("Falha ao atualizar aluno")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao atualizar aluno"
            )
        
        aluno_atualizado = {
            "id": result["id"],
            "id_aluno": result["id_aluno"],
            "nome_aluno": result["nome_aluno"],
            "data_nasc": result["data_nasc"].isoformat() if result["data_nasc"] else None,
            "sexo": result["sexo"],
            "endereco": result["endereco"],
            "telefone": result["telefone"],
            "email": result["email"],
            "mae": result["mae"],
            "id_turma": result["id_turma"]
        }
        
        print(f"Aluno atualizado: {aluno_atualizado}")
        return aluno_atualizado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao atualizar aluno {aluno_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar aluno: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO ATUALIZAÇÃO DO ALUNO {aluno_id} ===")

@app.delete("/api/alunos/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_aluno(aluno_id: str = Path(..., description="ID ou código do aluno")):
    """Remove um aluno do sistema."""
    print(f"=== INICIANDO EXCLUSÃO DO ALUNO {aluno_id} ===")
    try:
        # Verificar se o aluno existe
        check_query = "SELECT id FROM aluno WHERE id_aluno = %s"
        existing = execute_query(check_query, (aluno_id,), fetch_one=True)
        
        if not existing:
            print(f"Aluno com ID {aluno_id} não encontrado")
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        
        # Verificar se há dependências (por exemplo, notas vinculadas)
        # [Essa verificação pode ser adicionada posteriormente]
        
        # Excluir o aluno
        query = "DELETE FROM aluno WHERE id = %s"
        execute_query(query, (existing["id"],), fetch=False)
        
        print(f"Aluno {aluno_id} excluído com sucesso")
        return None  # HTTP 204 (No Content)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao excluir aluno {aluno_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir aluno: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO EXCLUSÃO DO ALUNO {aluno_id} ===")

@app.get("/api/alunos/turma/{turma_id}")
def read_alunos_by_turma(turma_id: str = Path(..., description="ID ou código da turma")):
    """Busca todos os alunos de uma turma específica."""
    print(f"=== INICIANDO BUSCA DE ALUNOS DA TURMA {turma_id} ===")
    try:
        # Verificar se a turma existe
        turma_query = "SELECT id FROM turma WHERE id_turma = %s"
        turma = execute_query(turma_query, (turma_id,), fetch_one=True)
        
        if not turma:
            print(f"Turma com ID {turma_id} não encontrada")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Turma com código {turma_id} não encontrada"
            )
        
        # Buscar alunos da turma
        query = """
        SELECT a.id, a.id_aluno, a.nome_aluno, a.data_nasc, a.sexo,
               a.endereco, a.telefone, a.email, a.mae, a.id_turma
        FROM aluno a
        WHERE a.id_turma = %s
        ORDER BY a.nome_aluno
        """
        
        print(f"Executando consulta: {query}")
        results = execute_query(query, (turma_id,))
        
        if not results:
            print(f"Nenhum aluno encontrado na turma {turma_id}")
            return []
        
        print(f"Encontrados {len(results)} alunos na turma {turma_id}")
        
        # Converter os resultados para objetos Aluno
        alunos = []
        for row in results:
            aluno = {
                "id": row["id"],
                "id_aluno": row["id_aluno"],
                "nome_aluno": row["nome_aluno"],
                "data_nasc": row["data_nasc"].isoformat() if row["data_nasc"] else None,
                "sexo": row["sexo"],
                "endereco": row["endereco"],
                "telefone": row["telefone"],
                "email": row["email"],
                "mae": row["mae"],
                "id_turma": row["id_turma"]
            }
            alunos.append(aluno)
        
        print(f"Retornando lista de alunos da turma {turma_id}")
        return alunos
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar alunos da turma {turma_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar alunos da turma: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE ALUNOS DA TURMA {turma_id} ===")

# Endpoint para criar uma nota
@app.post("/api/notas/", status_code=status.HTTP_201_CREATED, response_model=Nota)
def create_nota(nota: NotaCreate):
    # Log para depuração - veja exatamente o que está chegando
    print("="*70)
    print(f"DADOS RECEBIDOS PARA CRIAR NOTA: {nota.dict()}")
    print("="*70)
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificações básicas - simplificadas
        cursor.execute("SELECT * FROM aluno WHERE id_aluno = %s", (nota.id_aluno,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        
        cursor.execute("SELECT * FROM disciplina WHERE id_disciplina = %s", (nota.id_disciplina,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        cursor.execute("SELECT * FROM turma WHERE id_turma = %s", (nota.id_turma,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        # Calcular média - algoritmo simplificado
        nota_mensal = nota.nota_mensal or 0
        nota_bimestral = nota.nota_bimestral or 0
        recuperacao = nota.recuperacao or 0
        
        # Cálculo da média
        if recuperacao > 0:
            maior_nota = max(nota_mensal, nota_bimestral)
            media = round((maior_nota * 0.6) + (recuperacao * 0.4), 1)
        else:
            media = round((nota_mensal + nota_bimestral) / 2, 1) if (nota_mensal > 0 or nota_bimestral > 0) else 0
        
        print(f"CÁLCULO DE MÉDIA: Mensal={nota_mensal}, Bimestral={nota_bimestral}, Recuperação={recuperacao} = Média Final={media}")
        
        # Verificar se já existe nota com mesmos critérios
        cursor.execute("""
            SELECT id FROM nota 
            WHERE id_aluno = %s AND id_disciplina = %s AND id_turma = %s 
            AND ano = %s AND bimestre = %s
        """, (nota.id_aluno, nota.id_disciplina, nota.id_turma, nota.ano, nota.bimestre))
        
        existing_nota = cursor.fetchone()
        nota_id = None
        
        # Update ou Insert
        if existing_nota:
            nota_id = existing_nota[0]
            print(f"ATUALIZANDO nota existente: ID={nota_id}")
            
            cursor.execute("""
                UPDATE nota 
                SET nota_mensal = %s, nota_bimestral = %s, recuperacao = %s, media = %s
                WHERE id = %s
            """, (nota.nota_mensal, nota.nota_bimestral, nota.recuperacao, media, nota_id))
            
        else:
            print(f"INSERINDO nova nota: Aluno={nota.id_aluno}, Disciplina={nota.id_disciplina}, Turma={nota.id_turma}")
            
            cursor.execute("""
                INSERT INTO nota (id_aluno, id_disciplina, id_turma, ano, bimestre, 
                                nota_mensal, nota_bimestral, recuperacao, media)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (nota.id_aluno, nota.id_disciplina, nota.id_turma, nota.ano, nota.bimestre,
                nota.nota_mensal, nota.nota_bimestral, nota.recuperacao, media))
            
            nota_id = cursor.fetchone()[0]
        
        # COMMIT EXPLÍCITO - MUITO IMPORTANTE
        conn.commit()
        print(f"TRANSAÇÃO CONFIRMADA - NOTA ID={nota_id} SALVA COM SUCESSO")
        
        # Buscar nota salva para confirmar
        cursor.execute("""
            SELECT id, id_aluno, id_disciplina, id_turma, ano, bimestre, 
                   nota_mensal, nota_bimestral, recuperacao, media
            FROM nota WHERE id = %s
        """, (nota_id,))
        
        nota_data = cursor.fetchone()
        print(f"DADOS DA NOTA CONFIRMADOS: {nota_data}")
        
        # Retornar objeto para API
        return {
            "id": nota_data[0],
            "id_aluno": nota_data[1],
            "id_disciplina": nota_data[2],
            "id_turma": nota_data[3],
            "ano": nota_data[4],
            "bimestre": nota_data[5],
            "nota_mensal": nota_data[6],
            "nota_bimestral": nota_data[7],
            "recuperacao": nota_data[8],
            "media": nota_data[9]
        }
        
    except Exception as e:
        # Em caso de erro, rollback explícito
        print(f"ERRO AO PROCESSAR NOTA: {str(e)}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar/atualizar nota: {str(e)}")
    
    finally:
        # Garantir que a conexão sempre será fechada
        if conn:
            conn.close()
            print("CONEXÃO FECHADA")
        print("="*70)

# Endpoint para listar todas as notas
@app.get("/api/notas/", response_model=List[Nota])
def read_notas():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT n.id, n.id_aluno, n.id_disciplina, n.id_turma, 
                   n.ano, n.bimestre, n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media
            FROM nota n
            ORDER BY n.ano DESC, n.bimestre, n.id_turma, n.id_disciplina, n.id_aluno
        """)
        
        notas_data = cursor.fetchall()
        conn.close()
        
        notas = []
        for nota in notas_data:
            notas.append({
                "id": nota[0],
                "id_aluno": nota[1],
                "id_disciplina": nota[2],
                "id_turma": nota[3],
                "ano": nota[4],
                "bimestre": nota[5],
                "nota_mensal": nota[6],
                "nota_bimestral": nota[7],
                "recuperacao": nota[8],
                "media": nota[9]
            })
        
        return notas
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notas: {str(e)}")

# Endpoint para buscar notas com informações detalhadas (nomes dos alunos, disciplinas, etc)
@app.get("/api/notas/completo/", response_model=List[Dict])
def read_notas_completo(
    professor_id: Optional[str] = None,
    ano: Optional[int] = None,
    bimestre: Optional[int] = None,
    id_turma: Optional[str] = None,
    id_disciplina: Optional[str] = None,
    id_aluno: Optional[str] = None
):
    print("="*70)
    print(f"BUSCANDO NOTAS COMPLETAS COM FILTROS:")
    print(f"- Professor: {professor_id}")
    print(f"- Turma: {id_turma}")
    print(f"- Disciplina: {id_disciplina}")
    print(f"- Aluno: {id_aluno}")
    print(f"- Ano: {ano}")
    print(f"- Bimestre: {bimestre}")
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Base da consulta SQL com JOINS para todos os dados necessários
        query = """
            SELECT 
                n.id, 
                n.id_aluno, 
                a.nome_aluno, 
                n.id_disciplina, 
                d.nome_disciplina, 
                n.id_turma, 
                t.serie, 
                t.turno, 
                n.ano, 
                n.bimestre, 
                n.nota_mensal, 
                n.nota_bimestral, 
                n.recuperacao, 
                n.media
            FROM 
                nota n
                INNER JOIN aluno a ON n.id_aluno = a.id_aluno
                INNER JOIN disciplina d ON n.id_disciplina = d.id_disciplina
                INNER JOIN turma t ON n.id_turma = t.id_turma
        """
        
        # Parâmetros para a consulta
        params = []
        
        # Montar a cláusula WHERE baseada nos filtros
        where_clauses = []
        
        # Se tiver filtro de professor, adicionar JOIN para verificar apenas disciplinas desse professor
        if professor_id:
            query += """
                INNER JOIN professor_disciplina_turma pdt ON 
                    pdt.id_disciplina = n.id_disciplina AND 
                    pdt.id_turma = n.id_turma AND
                    pdt.id_professor = %s
            """
            params.append(professor_id)
        
        # Adicionar outros filtros à cláusula WHERE
        if ano:
            where_clauses.append("n.ano = %s")
            params.append(ano)
        
        if bimestre:
            where_clauses.append("n.bimestre = %s")
            params.append(bimestre)
        
        if id_turma:
            where_clauses.append("n.id_turma = %s")
            params.append(id_turma)
        
        if id_disciplina:
            where_clauses.append("n.id_disciplina = %s")
            params.append(id_disciplina)
        
        if id_aluno:
            where_clauses.append("n.id_aluno = %s")
            params.append(id_aluno)
        
        # Adicionar cláusula WHERE ao query se houver condições
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Ordenação por nome do aluno para melhor organização
        query += " ORDER BY n.ano DESC, n.bimestre, a.nome_aluno"
        
        print(f"CONSULTA SQL:")
        print(query)
        print(f"PARÂMETROS: {params}")
        
        # Executar a consulta
        cursor.execute(query, params)
        notas_data = cursor.fetchall()
        
        # Debug - mostrar resultados antes de formatar
        print(f"ENCONTRADAS {len(notas_data)} NOTAS")
        
        # Converter para o formato desejado
        notas = []
        for nota in notas_data:
            notas.append({
                "id": nota[0],
                "id_aluno": nota[1],
                "nome_aluno": nota[2],
                "id_disciplina": nota[3],
                "nome_disciplina": nota[4],
                "id_turma": nota[5],
                "serie": nota[6],
                "turno": nota[7],
                "ano": nota[8],
                "bimestre": nota[9],
                "nota_mensal": nota[10],
                "nota_bimestral": nota[11],
                "recuperacao": nota[12],
                "media": nota[13]
            })
        
        return notas
        
    except Exception as e:
        print(f"ERRO AO BUSCAR NOTAS COMPLETAS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar notas: {str(e)}")
    
    finally:
        if conn:
            conn.close()
        print("="*70)

# Endpoint para obter uma nota específica pelo ID
@app.get("/api/notas/{nota_id}", response_model=Nota)
def read_nota(nota_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, id_aluno, id_disciplina, id_turma, 
                   ano, bimestre, nota_mensal, nota_bimestral, recuperacao, media
            FROM nota
            WHERE id = %s
        """, (nota_id,))
        
        nota_data = cursor.fetchone()
        conn.close()
        
        if nota_data is None:
            raise HTTPException(status_code=404, detail="Nota não encontrada")
        
        return {
            "id": nota_data[0],
            "id_aluno": nota_data[1],
            "id_disciplina": nota_data[2],
            "id_turma": nota_data[3],
            "ano": nota_data[4],
            "bimestre": nota_data[5],
            "nota_mensal": nota_data[6],
            "nota_bimestral": nota_data[7],
            "recuperacao": nota_data[8],
            "media": nota_data[9]
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar nota: {str(e)}")

# Endpoint para atualizar uma nota
@app.put("/api/notas/{nota_id}", response_model=Nota)
def update_nota(nota_id: int, nota: NotaUpdate, request: Request):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se a nota existe
        cursor.execute("SELECT * FROM nota WHERE id = %s", (nota_id,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Nota não encontrada")
        
        # Verificar se o aluno existe
        cursor.execute("SELECT * FROM aluno WHERE id_aluno = %s", (nota.id_aluno,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        
        # Verificar se a disciplina existe
        cursor.execute("SELECT * FROM disciplina WHERE id_disciplina = %s", (nota.id_disciplina,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        # Verificar se a turma existe
        cursor.execute("SELECT * FROM turma WHERE id_turma = %s", (nota.id_turma,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        # Verificar se o parâmetro override_media está presente
        # Se estiver, usar o valor de media fornecido pelo cliente
        if request.query_params.get('override_media') == 'true' and nota.media is not None:
            media = nota.media
            print(f"Usando média fornecida pelo cliente: {media}")
        else:
            # Calcular média usando a fórmula correta
            nota_mensal = nota.nota_mensal or 0
            nota_bimestral = nota.nota_bimestral or 0
            recuperacao = nota.recuperacao or 0
            
            # Calcular média inicial
            if nota_mensal > 0 and nota_bimestral > 0:
                # Se ambas as notas estão presentes, a média é a média aritmética
                media = round((nota_mensal + nota_bimestral) / 2, 1)
            elif nota_mensal > 0:
                media = nota_mensal
            elif nota_bimestral > 0:
                media = nota_bimestral
            else:
                media = 0
            
            # Se tem recuperação, a média final é a média entre a média anterior e a nota de recuperação
            if recuperacao > 0:
                media = round((media + recuperacao) / 2, 1)
        
        # Atualizar nota
        cursor.execute("""
            UPDATE nota
            SET id_aluno = %s, id_disciplina = %s, id_turma = %s, ano = %s, bimestre = %s,
                nota_mensal = %s, nota_bimestral = %s, recuperacao = %s, media = %s
            WHERE id = %s
            RETURNING id
        """, (nota.id_aluno, nota.id_disciplina, nota.id_turma, nota.ano, nota.bimestre,
              nota.nota_mensal, nota.nota_bimestral, nota.recuperacao, media, nota_id))
        
        nota_id = cursor.fetchone()[0]
        conn.commit()
        
        # Buscar a nota atualizada
        cursor.execute("""
            SELECT id, id_aluno, id_disciplina, id_turma, ano, bimestre, 
                   nota_mensal, nota_bimestral, recuperacao, media
            FROM nota
            WHERE id = %s
        """, (nota_id,))
        
        nota_data = cursor.fetchone()
        conn.close()
        
        return {
            "id": nota_data[0],
            "id_aluno": nota_data[1],
            "id_disciplina": nota_data[2],
            "id_turma": nota_data[3],
            "ano": nota_data[4],
            "bimestre": nota_data[5],
            "nota_mensal": nota_data[6],
            "nota_bimestral": nota_data[7],
            "recuperacao": nota_data[8],
            "media": nota_data[9]
        }
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar nota: {str(e)}")

# Endpoint para excluir uma nota
@app.delete("/api/notas/{nota_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nota(nota_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se a nota existe
        cursor.execute("SELECT * FROM nota WHERE id = %s", (nota_id,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail="Nota não encontrada")
        
        # Excluir nota
        cursor.execute("DELETE FROM nota WHERE id = %s", (nota_id,))
        conn.commit()
        conn.close()
        
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao excluir nota: {str(e)}")

# Endpoint para filtrar notas por turma
@app.get("/api/notas/turma/{turma_id}", response_model=List[Dict])
def read_notas_by_turma(turma_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT n.id, n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, 
                   n.id_turma, t.serie, n.ano, n.bimestre, 
                   n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media
            FROM nota n
            JOIN aluno a ON n.id_aluno = a.id_aluno
            JOIN disciplina d ON n.id_disciplina = d.id_disciplina
            JOIN turma t ON n.id_turma = t.id_turma
            WHERE n.id_turma = %s
            ORDER BY n.ano DESC, n.bimestre, d.nome_disciplina, a.nome_aluno
        """, (turma_id,))
        
        notas_data = cursor.fetchall()
        conn.close()
        
        notas = []
        for nota in notas_data:
            notas.append({
                "id": nota[0],
                "id_aluno": nota[1],
                "nome_aluno": nota[2],
                "id_disciplina": nota[3],
                "nome_disciplina": nota[4],
                "id_turma": nota[5],
                "serie": nota[6],
                "ano": nota[7],
                "bimestre": nota[8],
                "nota_mensal": nota[9],
                "nota_bimestral": nota[10],
                "recuperacao": nota[11],
                "media": nota[12]
            })
        
        return notas
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao filtrar notas por turma: {str(e)}")

# Endpoint para filtrar notas por aluno
@app.get("/api/notas/aluno/{aluno_id}", response_model=List[Dict])
def read_notas_by_aluno(aluno_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT n.id, n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, 
                   n.id_turma, t.serie, n.ano, n.bimestre, 
                   n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media
            FROM nota n
            JOIN aluno a ON n.id_aluno = a.id_aluno
            JOIN disciplina d ON n.id_disciplina = d.id_disciplina
            JOIN turma t ON n.id_turma = t.id_turma
            WHERE n.id_aluno = %s
            ORDER BY n.ano DESC, n.bimestre, t.serie, d.nome_disciplina
        """, (aluno_id,))
        
        notas_data = cursor.fetchall()
        conn.close()
        
        notas = []
        for nota in notas_data:
            notas.append({
                "id": nota[0],
                "id_aluno": nota[1],
                "nome_aluno": nota[2],
                "id_disciplina": nota[3],
                "nome_disciplina": nota[4],
                "id_turma": nota[5],
                "serie": nota[6],
                "ano": nota[7],
                "bimestre": nota[8],
                "nota_mensal": nota[9],
                "nota_bimestral": nota[10],
                "recuperacao": nota[11],
                "media": nota[12]
            })
        
        return notas
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao filtrar notas por aluno: {str(e)}")

# Endpoint para filtrar notas por disciplina
@app.get("/api/notas/disciplina/{disciplina_id}", response_model=List[Dict])
def read_notas_by_disciplina(disciplina_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT n.id, n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, 
                   n.id_turma, t.serie, n.ano, n.bimestre, 
                   n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media
            FROM nota n
            JOIN aluno a ON n.id_aluno = a.id_aluno
            JOIN disciplina d ON n.id_disciplina = d.id_disciplina
            JOIN turma t ON n.id_turma = t.id_turma
            WHERE n.id_disciplina = %s
            ORDER BY n.ano DESC, n.bimestre, t.serie, a.nome_aluno
        """, (disciplina_id,))
        
        notas_data = cursor.fetchall()
        conn.close()
        
        notas = []
        for nota in notas_data:
            notas.append({
                "id": nota[0],
                "id_aluno": nota[1],
                "nome_aluno": nota[2],
                "id_disciplina": nota[3],
                "nome_disciplina": nota[4],
                "id_turma": nota[5],
                "serie": nota[6],
                "ano": nota[7],
                "bimestre": nota[8],
                "nota_mensal": nota[9],
                "nota_bimestral": nota[10],
                "recuperacao": nota[11],
                "media": nota[12]
            })
        
        return notas
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao filtrar notas por disciplina: {str(e)}")

# Endpoint para filtrar notas por combinação de filtros
@app.get("/api/notas/filtro/", response_model=List[Dict])
def read_notas_by_filter(
    ano: Optional[int] = None,
    bimestre: Optional[int] = None,
    id_turma: Optional[str] = None,
    id_disciplina: Optional[str] = None,
    id_aluno: Optional[str] = None,
    professor_id: Optional[str] = None  # Adicionado filtro por professor
):
    """Busca notas com base em diversos filtros, incluindo professor."""
    try:
        print(f"Debug - Filtro de notas recebido: professor_id={professor_id}, turma={id_turma}, disciplina={id_disciplina}, aluno={id_aluno}, ano={ano}, bimestre={bimestre}")
        
        query = """
        SELECT n.id, n.id_aluno, n.id_disciplina, n.id_turma, n.ano, n.bimestre, 
               n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media,
               a.nome_aluno, d.nome_disciplina, t.serie, t.turno
        FROM nota n
        JOIN aluno a ON n.id_aluno = a.id_aluno
        JOIN disciplina d ON n.id_disciplina = d.id_disciplina
        JOIN turma t ON n.id_turma = t.id_turma
        """
        
        # Adicionar JOIN para filtrar por professor se necessário
        if professor_id:
            query += """
            JOIN professor_disciplina_turma pdt ON 
            (pdt.id_disciplina = n.id_disciplina AND pdt.id_turma = n.id_turma)
            """
        
        query += " WHERE 1=1"
        
        params = []
        
        if ano:
            query += " AND n.ano = %s"
            params.append(ano)
        
        if bimestre:
            query += " AND n.bimestre = %s"
            params.append(bimestre)
        
        if id_turma:
            query += " AND n.id_turma = %s"
            params.append(id_turma)
        
        if id_disciplina:
            query += " AND n.id_disciplina = %s"
            params.append(id_disciplina)
        
        if id_aluno:
            query += " AND n.id_aluno = %s"
            params.append(id_aluno)
        
        # Adicionar filtro por professor
        if professor_id:
            query += " AND pdt.id_professor = %s"
            params.append(professor_id)
        
        query += " ORDER BY n.ano DESC, n.bimestre DESC, a.nome_aluno ASC"
        
        print(f"Debug - Query SQL: {query}")
        print(f"Debug - Parâmetros: {params}")
        
        notas_results = execute_query(query, params)
        
        notas = []
        for row in notas_results:
            nota = dict(row)
            notas.append(nota)
        
        print(f"Debug - Total de notas encontradas: {len(notas)}")
        return notas
        
    except Exception as e:
        print(f"Erro ao buscar notas por filtro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar notas: {str(e)}"
        )

# Endpoint para calcular médias finais (visualizar a view media_final)
@app.get("/api/notas/media-final/", response_model=List[Dict])
def read_media_final(ano: Optional[int] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if ano is not None:
            query = """
                SELECT id_aluno, nome_aluno, id_disciplina, nome_disciplina, 
                       id_turma, serie, turno, ano, media_anual, situacao
                FROM media_final
                WHERE ano = %s
                ORDER BY nome_aluno, nome_disciplina
            """
            cursor.execute(query, (ano,))
        else:
            query = """
                SELECT id_aluno, nome_aluno, id_disciplina, nome_disciplina, 
                       id_turma, serie, turno, ano, media_anual, situacao
                FROM media_final
                ORDER BY ano DESC, nome_aluno, nome_disciplina
            """
            cursor.execute(query)
        
        medias_data = cursor.fetchall()
        conn.close()
        
        medias = []
        for media in medias_data:
            medias.append({
                "id_aluno": media[0],
                "nome_aluno": media[1],
                "id_disciplina": media[2],
                "nome_disciplina": media[3],
                "id_turma": media[4],
                "serie": media[5],
                "turno": media[6],
                "ano": media[7],
                "media_anual": media[8],
                "situacao": media[9]
            })
        
        return medias
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar médias finais: {str(e)}")

# Adicionar Endpoint de Resumo para o Dashboard
@app.get("/api/dashboard/resumo")
def get_dashboard_resumo():
    """Retorna um resumo dos dados para o dashboard principal."""
    try:
        # Contar alunos
        query_alunos = "SELECT COUNT(*) FROM aluno"
        alunos_count = execute_query(query_alunos, fetch_one=True)[0]
        
        # Contar professores
        query_professores = "SELECT COUNT(*) FROM professor"
        professores_count = execute_query(query_professores, fetch_one=True)[0]
        
        # Contar turmas
        query_turmas = "SELECT COUNT(*) FROM turma"
        turmas_count = execute_query(query_turmas, fetch_one=True)[0]
        
        # Contar disciplinas
        query_disciplinas = "SELECT COUNT(*) FROM disciplina"
        disciplinas_count = execute_query(query_disciplinas, fetch_one=True)[0]
        
        return {
            "total_alunos": alunos_count,
            "total_professores": professores_count,
            "turmas_ativas": turmas_count,
            "disciplinas": disciplinas_count
        }
    except Exception as e:
        logger.error(f"Erro ao buscar resumo do dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar resumo do dashboard: {str(e)}"
        )

# Endpoint para criar uma tabela de logs se não existir
@app.post("/api/logs/criar-tabela", status_code=status.HTTP_201_CREATED)
def criar_tabela_logs():
    """Cria a tabela de logs se ela não existir."""
    try:
        query = """
        CREATE TABLE IF NOT EXISTS log_atividade (
            id SERIAL PRIMARY KEY,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            usuario VARCHAR(100) NOT NULL,
            acao VARCHAR(50) NOT NULL,
            entidade VARCHAR(50) NOT NULL,
            entidade_id VARCHAR(100) NOT NULL,
            detalhe TEXT,
            status VARCHAR(20) DEFAULT 'concluído'
        )
        """
        execute_query(query, fetch=False)
        return {"mensagem": "Tabela de logs criada ou já existente"}
    except Exception as e:
        logger.error(f"Erro ao criar tabela de logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar tabela de logs: {str(e)}"
        )

# Endpoint para registrar uma atividade no log
@app.post("/api/logs", status_code=status.HTTP_201_CREATED)
def registrar_log(log: LogCreate):
    """Registra uma atividade no log."""
    try:
        # Verificar se a tabela existe
        criar_tabela_logs()
        
        query = """
        INSERT INTO log_atividade (usuario, acao, entidade, entidade_id, detalhe, status)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, data_hora
        """
        params = (log.usuario, log.acao, log.entidade, log.entidade_id, log.detalhe, log.status)
        result = execute_query(query, params, fetch_one=True)
        
        if result:
            return {
                "id": result["id"],
                "data_hora": result["data_hora"],
                "usuario": log.usuario,
                "acao": log.acao,
                "entidade": log.entidade,
                "entidade_id": log.entidade_id,
                "detalhe": log.detalhe,
                "status": log.status
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao registrar log"
            )
    except Exception as e:
        logger.error(f"Erro ao registrar log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registrar log: {str(e)}"
        )

# Endpoint para buscar logs de atividades
@app.get("/api/logs", response_model=List[LogAtividade])
def listar_logs(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    usuario: Optional[str] = None,
    entidade: Optional[str] = None,
    acao: Optional[str] = None
):
    """Lista os logs de atividades com opções de filtragem."""
    try:
        # Verificar se a tabela existe
        criar_tabela_logs()
        
        # Construir consulta básica
        query = "SELECT * FROM log_atividade WHERE 1=1"
        params = []
        
        # Adicionar filtros conforme parâmetros
        if usuario:
            query += " AND usuario ILIKE %s"
            params.append(f"%{usuario}%")
        
        if entidade:
            query += " AND entidade = %s"
            params.append(entidade)
        
        if acao:
            query += " AND acao = %s"
            params.append(acao)
        
        # Ordenar por data/hora decrescente e adicionar paginação
        query += " ORDER BY data_hora DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        result = execute_query(query, params)
        logs = []
        
        for row in result:
            logs.append({
                "id": row["id"],
                "data_hora": row["data_hora"],
                "usuario": row["usuario"],
                "acao": row["acao"],
                "entidade": row["entidade"],
                "entidade_id": row["entidade_id"],
                "detalhe": row["detalhe"],
                "status": row["status"]
            })
        
        return logs
    except Exception as e:
        logger.error(f"Erro ao listar logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar logs: {str(e)}"
        )

# Novo endpoint para buscar notas por professor
@app.get("/api/notas/professor")
def read_notas_professor(
    professor_id: str = Query(None, description="ID do professor"),
    id_turma: str = Query(None, description="ID da turma"),
    id_disciplina: str = Query(None, description="ID da disciplina"),
    id_aluno: str = Query(None, description="ID do aluno"),
    ano: int = Query(None, description="Ano letivo"),
    bimestre: int = Query(None, description="Bimestre")
):
    """Busca notas de alunos filtradas por professor e outros parâmetros opcionais."""
    try:
        logger.debug(f"Buscando notas para o professor: {professor_id} com filtros: turma={id_turma}, disciplina={id_disciplina}, aluno={id_aluno}, ano={ano}, bimestre={bimestre}")
        
        # Verificar se o professor existe e está ativo
        if professor_id:
            query_professor = "SELECT id FROM professor WHERE id_professor = %s"
            professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
            
            if not professor_result:
                raise HTTPException(status_code=404, detail=f"Professor com ID {professor_id} não encontrado")
        
        # Construir a consulta base
        query = """
        SELECT n.id, n.id_aluno, n.id_disciplina, n.id_turma, n.ano, n.bimestre, 
               n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media,
               a.nome_aluno, d.nome_disciplina, t.serie, t.turno
        FROM nota n
        JOIN aluno a ON n.id_aluno = a.id_aluno
        JOIN disciplina d ON n.id_disciplina = d.id_disciplina
        JOIN turma t ON n.id_turma = t.id_turma
        JOIN professor_disciplina_turma pdt ON (
            pdt.id_disciplina = n.id_disciplina AND 
            pdt.id_turma = n.id_turma
        )
        WHERE 1=1
        """
        
        # Parâmetros para a consulta
        params = []
        
        # Adicionar condições com base nos parâmetros de consulta
        if professor_id:
            query += " AND pdt.id_professor = %s"
            params.append(professor_id)
        
        if id_turma:
            query += " AND n.id_turma = %s"
            params.append(id_turma)
            
        if id_disciplina:
            query += " AND n.id_disciplina = %s"
            params.append(id_disciplina)
            
        if id_aluno:
            query += " AND n.id_aluno = %s"
            params.append(id_aluno)
            
        if ano:
            query += " AND n.ano = %s"
            params.append(ano)
            
        if bimestre:
            query += " AND n.bimestre = %s"
            params.append(bimestre)
            
        # Ordenar os resultados
        query += " ORDER BY a.nome_aluno, n.ano, n.bimestre"
        
        logger.debug(f"Query final: {query}")
        logger.debug(f"Parâmetros: {params}")
        
        # Executar a consulta
        notas_results = execute_query(query, params)
        
        # Converter resultados para o formato de resposta
        notas = []
        for row in notas_results:
            nota = dict(row)
            notas.append(nota)
            
        logger.debug(f"Encontradas {len(notas)} notas para o professor {professor_id}")
        return notas
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar notas para o professor {professor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar notas: {str(e)}"
        )

# Endpoint para filtrar notas por professor (usando path parameter)
@app.get("/api/notas/por_professor/{professor_id}", response_model=List[Dict])
def read_notas_by_professor(
    professor_id: str = Path(..., description="ID do professor"),
    ano: Optional[int] = None,
    bimestre: Optional[int] = None,
    id_turma: Optional[str] = None,
    id_disciplina: Optional[str] = None,
    id_aluno: Optional[str] = None
):
    """Busca notas específicas do professor informado."""
    try:
        print(f"=== BUSCANDO NOTAS PARA O PROFESSOR: {professor_id} ===")
        print(f"Parâmetros: ano={ano}, bimestre={bimestre}, id_turma={id_turma}, id_disciplina={id_disciplina}, id_aluno={id_aluno}")
        
        # Verificar se o professor existe
        professor_query = "SELECT id FROM professor WHERE id_professor = %s"
        print(f"Executando query para verificar professor: {professor_query} com parâmetro: {professor_id}")
        professor_result = execute_query(professor_query, (professor_id,), fetch_one=True)
        print(f"Resultado da query de professor: {professor_result}")
        
        if not professor_result:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Professor com ID {professor_id} não encontrado"
            )
        
        # Construir a consulta base
        query = """
        SELECT n.id, n.id_aluno, n.id_disciplina, n.id_turma, n.ano, n.bimestre, 
               n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media,
               a.nome_aluno, d.nome_disciplina, t.serie, t.turno
        FROM nota n
        JOIN aluno a ON n.id_aluno = a.id_aluno
        JOIN disciplina d ON n.id_disciplina = d.id_disciplina
        JOIN turma t ON n.id_turma = t.id_turma
        JOIN professor_disciplina_turma pdt ON (
            pdt.id_disciplina = n.id_disciplina AND 
            pdt.id_turma = n.id_turma
        )
        WHERE pdt.id_professor = %s
        """
        
        # Parâmetros para a consulta
        params = [professor_id]
        
        # Adicionar condições com base nos parâmetros de consulta
        if ano:
            query += " AND n.ano = %s"
            params.append(ano)
        
        if bimestre:
            query += " AND n.bimestre = %s"
            params.append(bimestre)
        
        if id_turma:
            query += " AND n.id_turma = %s"
            params.append(id_turma)
            
        if id_disciplina:
            query += " AND n.id_disciplina = %s"
            params.append(id_disciplina)
            
        if id_aluno:
            query += " AND n.id_aluno = %s"
            params.append(id_aluno)
            
        # Ordenar os resultados
        query += " ORDER BY n.ano DESC, n.bimestre DESC, a.nome_aluno ASC"
        
        print(f"Consulta SQL: {query}")
        print(f"Parâmetros: {params}")
        
        # Executar a consulta
        notas_results = execute_query(query, params)
        print(f"Resultados retornados: {len(notas_results) if notas_results else 0}")
        
        # Converter resultados para o formato de resposta
        notas = []
        for row in notas_results:
            nota = dict(row)
            notas.append(nota)
            
        print(f"Encontradas {len(notas)} notas para o professor {professor_id}")
        
        # Se não houver resultados, retornar uma lista vazia mas com uma mensagem informativa no log
        if not notas:
            print(f"ATENÇÃO: Nenhuma nota encontrada para o professor {professor_id} com os filtros informados")
            # Vamos verificar se há notas sem o relacionamento com professor_disciplina_turma
            verificar_query = """
            SELECT COUNT(*) as total 
            FROM nota n 
            WHERE EXISTS (
                SELECT 1 FROM professor_disciplina_turma pdt 
                WHERE pdt.id_professor = %s 
                AND pdt.id_disciplina = n.id_disciplina 
                AND pdt.id_turma = n.id_turma
            )
            """
            verificar_result = execute_query(verificar_query, (professor_id,), fetch_one=True)
            print(f"Verificação de notas relacionadas: {verificar_result}")
            
            # Verificar vinculações do professor
            vinculos_query = """
            SELECT COUNT(*) as total FROM professor_disciplina_turma 
            WHERE id_professor = %s
            """
            vinculos_result = execute_query(vinculos_query, (professor_id,), fetch_one=True)
            print(f"Verificação de vínculos do professor: {vinculos_result}")
        
        return notas
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar notas do professor {professor_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar notas: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE NOTAS DO PROFESSOR: {professor_id} ===")

# ===============================================================
# ENDPOINTS PARA GERENCIAMENTO DO ESQUEMA DO BANCO DE DADOS
# ===============================================================

@app.post("/api/schema/verificar_campos", status_code=status.HTTP_200_OK)
def verificar_campos_tabelas():
    """Verifica e adiciona campos faltantes em tabelas existentes."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se a coluna professor_id existe na tabela nota
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'nota' AND column_name = 'professor_id'
        """)
        
        if cursor.fetchone() is None:
            # Adicionar a coluna se não existir
            print("Adicionando coluna professor_id à tabela nota")
            cursor.execute("""
                ALTER TABLE nota 
                ADD COLUMN IF NOT EXISTS professor_id VARCHAR(20)
            """)
            conn.commit()
            message = "Coluna professor_id adicionada à tabela nota com sucesso"
        else:
            message = "Coluna professor_id já existe na tabela nota"
        
        conn.close()
        return {"status": "success", "message": message}
        
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Erro ao verificar/modificar esquema: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar/modificar esquema: {str(e)}"
        )

@app.get("/api/professores/{professor_id}/disciplinas")
def get_professor_disciplinas(
    professor_id: str = Path(..., description="ID do professor para buscar disciplinas")
):
    """Recupera todas as disciplinas associadas a um professor específico."""
    print(f"=== BUSCANDO DISCIPLINAS DO PROFESSOR: {professor_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT * FROM professor WHERE id_professor = %s"
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        
        if not professor_result:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail="Professor não encontrado")
        
        print(f"Professor encontrado: {professor_id}")
        
        # Buscar as disciplinas vinculadas ao professor
        query = """
        SELECT DISTINCT d.id_disciplina, d.nome_disciplina
        FROM disciplina d
        JOIN professor_disciplina_turma pdt ON d.id_disciplina = pdt.id_disciplina
        WHERE pdt.id_professor = %s
        """
        results = execute_query(query, (professor_id,))
        
        if not results:
            print(f"Nenhuma disciplina encontrada para o professor {professor_id}")
            return []
        
        # Converter os resultados em um formato mais detalhado
        disciplinas = []
        for row in results:
            disciplina = {
                "id_disciplina": row["id_disciplina"],
                "nome_disciplina": row["nome_disciplina"]
            }
            disciplinas.append(disciplina)
            print(f"Disciplina encontrada: {disciplina['id_disciplina']} - {disciplina['nome_disciplina']}")
        
        print(f"Total de disciplinas encontradas: {len(disciplinas)}")
        return disciplinas
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar disciplinas do professor {professor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar disciplinas do professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE DISCIPLINAS DO PROFESSOR: {professor_id} ===")

@app.get("/api/professores/{professor_id}/estatisticas")
def get_professor_estatisticas(professor_id: str = Path(..., description="ID do professor")):
    """Retorna estatísticas do professor para o dashboard."""
    print(f"=== BUSCANDO ESTATÍSTICAS DO PROFESSOR: {professor_id} ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT * FROM professor WHERE id_professor = %s"
        print(f"Executando query para verificar professor: {query_professor} com parâmetro: {professor_id}")
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        
        print(f"Resultado da query de professor: {professor_result}")
        
        if not professor_result:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail="Professor não encontrado")
        
        print(f"Professor encontrado: {professor_id}")
        
        # Contar turmas do professor
        query_turmas = """
        SELECT COUNT(DISTINCT id_turma) as total_turmas 
        FROM professor_disciplina_turma 
        WHERE id_professor = %s
        """
        print(f"Executando query para contar turmas: {query_turmas} com parâmetro: {professor_id}")
        turmas_result = execute_query(query_turmas, (professor_id,), fetch_one=True)
        print(f"Resultado da query de turmas: {turmas_result}")
        total_turmas = turmas_result["total_turmas"] if turmas_result else 0
        
        # Contar disciplinas do professor
        query_disciplinas = """
        SELECT COUNT(DISTINCT id_disciplina) as total_disciplinas 
        FROM professor_disciplina_turma 
        WHERE id_professor = %s
        """
        print(f"Executando query para contar disciplinas: {query_disciplinas} com parâmetro: {professor_id}")
        disciplinas_result = execute_query(query_disciplinas, (professor_id,), fetch_one=True)
        print(f"Resultado da query de disciplinas: {disciplinas_result}")
        total_disciplinas = disciplinas_result["total_disciplinas"] if disciplinas_result else 0
        
        # Contar alunos do professor (todos os alunos nas turmas que ele leciona)
        query_alunos = """
        SELECT COUNT(DISTINCT a.id_aluno) as total_alunos
        FROM aluno a
        JOIN professor_disciplina_turma pdt ON a.id_turma = pdt.id_turma
        WHERE pdt.id_professor = %s
        """
        print(f"Executando query para contar alunos: {query_alunos} com parâmetro: {professor_id}")
        alunos_result = execute_query(query_alunos, (professor_id,), fetch_one=True)
        print(f"Resultado da query de alunos: {alunos_result}")
        total_alunos = alunos_result["total_alunos"] if alunos_result else 0
        
        # Contar notas lançadas pelo professor (todas as notas das disciplinas que ele leciona)
        query_notas = """
        SELECT COUNT(*) as total_notas
        FROM nota n
        JOIN professor_disciplina_turma pdt ON n.id_disciplina = pdt.id_disciplina AND n.id_turma = pdt.id_turma
        WHERE pdt.id_professor = %s
        """
        print(f"Executando query para contar notas: {query_notas} com parâmetro: {professor_id}")
        notas_result = execute_query(query_notas, (professor_id,), fetch_one=True)
        print(f"Resultado da query de notas: {notas_result}")
        total_notas = notas_result["total_notas"] if notas_result else 0
        
        estatisticas = {
            "total_turmas": total_turmas,
            "total_disciplinas": total_disciplinas,
            "total_alunos": total_alunos,
            "total_notas": total_notas
        }
        
        print(f"Estatísticas do professor {professor_id}: {estatisticas}")
        return estatisticas
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao buscar estatísticas do professor {professor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar estatísticas do professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO BUSCA DE ESTATÍSTICAS DO PROFESSOR: {professor_id} ===")

# Inicialização do servidor (quando executado diretamente)
if __name__ == "__main__":
    uvicorn.run("simplified_api:app", host="0.0.0.0", port=4000, reload=True) 
