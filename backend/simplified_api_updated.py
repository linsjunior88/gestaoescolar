"""
API Simplificada para o Sistema de Gestão Escolar
Este script implementa uma versão simplificada da API usando FastAPI e psycopg2
para conexão direta com o PostgreSQL.
"""
from fastapi import Request, FastAPI, HTTPException, Depends, status, Query, Path, Body
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

# Importar configuração CORS personalizada
from cors_config import configurar_cors

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
    title="Sistema de Gestão Escolar API",
    description="API para o Sistema de Gestão Escolar",
    version="1.0.0",
)

# Aplicar configuração CORS personalizada
app = configurar_cors(app)

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
        logger.error(f"Erro ao conectar ao banco de dados: {e}")
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
        logger.error(f"Erro ao executar consulta: {e}")
        logger.error(f"Query: {query}")
        logger.error(f"Params: {params}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao executar consulta: {str(e)}"
        )
    finally:
        if conn:
            conn.close()

# Endpoint para verificar status da API
@app.get("/status")
async def status():
    """Verifica o status da API e a conexão com o banco de dados"""
    try:
        # Testar conexão com o banco
        conn = get_db_connection()
        conn.close()
        
        return {
            "status": "ok",
            "message": "API funcionando normalmente",
            "timestamp": datetime.now().isoformat(),
            "database": "conectado",
            "environment": "production" if IS_PRODUCTION else "development"
        }
    except Exception as e:
        logger.error(f"Erro ao verificar status: {e}")
        return {
            "status": "error",
            "message": f"Erro ao conectar ao banco de dados: {str(e)}",
            "timestamp": datetime.now().isoformat(),
            "database": "desconectado",
            "environment": "production" if IS_PRODUCTION else "development"
        }

# Modelos Pydantic para validação de dados

class TurmaBase(BaseModel):
    nome: str
    ano: int
    turno: str

class TurmaCreate(TurmaBase):
    pass

class Turma(TurmaBase):
    id: int
    
    class Config:
        orm_mode = True

class DisciplinaBase(BaseModel):
    nome: str
    carga_horaria: int

class DisciplinaCreate(DisciplinaBase):
    pass

class Disciplina(DisciplinaBase):
    id: int
    
    class Config:
        orm_mode = True

class ProfessorBase(BaseModel):
    nome: str
    email: Optional[str] = None
    formacao: Optional[str] = None
    disciplinas: Optional[List[int]] = []

class ProfessorCreate(ProfessorBase):
    pass

class Professor(ProfessorBase):
    id: int
    
    class Config:
        orm_mode = True

class AlunoBase(BaseModel):
    nome: str
    matricula: str
    turma_id: int

class AlunoCreate(AlunoBase):
    pass

class Aluno(AlunoBase):
    id: int
    
    class Config:
        orm_mode = True

class NotaBase(BaseModel):
    aluno_id: int
    disciplina_id: int
    turma_id: int
    bimestre: int
    ano: int
    nota_mensal: float
    nota_bimestral: float
    nota_recuperacao: Optional[float] = None
    media_final: float

class NotaCreate(NotaBase):
    pass

class Nota(NotaBase):
    id: int
    
    class Config:
        orm_mode = True

# Endpoints para Turmas

@app.get("/turmas", response_model=List[Turma])
async def listar_turmas():
    """Lista todas as turmas cadastradas"""
    query = "SELECT * FROM turma ORDER BY ano, nome"
    result = execute_query(query)
    
    # Converter resultado para lista de dicionários
    turmas = []
    for row in result:
        turmas.append(dict(row))
    
    return turmas

@app.get("/turmas/{turma_id}", response_model=Turma)
async def obter_turma(turma_id: int = Path(..., title="ID da turma")):
    """Obtém uma turma específica pelo ID"""
    query = "SELECT * FROM turma WHERE id = %s"
    result = execute_query(query, (turma_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {turma_id} não encontrada"
        )
    
    return dict(result)

@app.post("/turmas", response_model=Turma, status_code=status.HTTP_201_CREATED)
async def criar_turma(turma: TurmaCreate):
    """Cria uma nova turma"""
    query = """
        INSERT INTO turma (nome, ano, turno)
        VALUES (%s, %s, %s)
        RETURNING id, nome, ano, turno
    """
    result = execute_query(
        query, 
        (turma.nome, turma.ano, turma.turno),
        fetch_one=True
    )
    
    return dict(result)

@app.put("/turmas/{turma_id}", response_model=Turma)
async def atualizar_turma(
    turma_id: int = Path(..., title="ID da turma"),
    turma: TurmaBase = Body(...)
):
    """Atualiza uma turma existente"""
    # Verificar se a turma existe
    check_query = "SELECT id FROM turma WHERE id = %s"
    check_result = execute_query(check_query, (turma_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {turma_id} não encontrada"
        )
    
    # Atualizar a turma
    update_query = """
        UPDATE turma
        SET nome = %s, ano = %s, turno = %s
        WHERE id = %s
        RETURNING id, nome, ano, turno
    """
    result = execute_query(
        update_query,
        (turma.nome, turma.ano, turma.turno, turma_id),
        fetch_one=True
    )
    
    return dict(result)

@app.delete("/turmas/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_turma(turma_id: int = Path(..., title="ID da turma")):
    """Exclui uma turma existente"""
    # Verificar se a turma existe
    check_query = "SELECT id FROM turma WHERE id = %s"
    check_result = execute_query(check_query, (turma_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {turma_id} não encontrada"
        )
    
    # Excluir a turma
    delete_query = "DELETE FROM turma WHERE id = %s"
    execute_query(delete_query, (turma_id,), fetch=False)
    
    return None

# Endpoints para Disciplinas

@app.get("/disciplinas", response_model=List[Disciplina])
async def listar_disciplinas():
    """Lista todas as disciplinas cadastradas"""
    query = "SELECT * FROM disciplina ORDER BY nome"
    result = execute_query(query)
    
    # Converter resultado para lista de dicionários
    disciplinas = []
    for row in result:
        disciplinas.append(dict(row))
    
    return disciplinas

@app.get("/disciplinas/{disciplina_id}", response_model=Disciplina)
async def obter_disciplina(disciplina_id: int = Path(..., title="ID da disciplina")):
    """Obtém uma disciplina específica pelo ID"""
    query = "SELECT * FROM disciplina WHERE id = %s"
    result = execute_query(query, (disciplina_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disciplina com ID {disciplina_id} não encontrada"
        )
    
    return dict(result)

@app.post("/disciplinas", response_model=Disciplina, status_code=status.HTTP_201_CREATED)
async def criar_disciplina(disciplina: DisciplinaCreate):
    """Cria uma nova disciplina"""
    query = """
        INSERT INTO disciplina (nome, carga_horaria)
        VALUES (%s, %s)
        RETURNING id, nome, carga_horaria
    """
    result = execute_query(
        query, 
        (disciplina.nome, disciplina.carga_horaria),
        fetch_one=True
    )
    
    return dict(result)

@app.put("/disciplinas/{disciplina_id}", response_model=Disciplina)
async def atualizar_disciplina(
    disciplina_id: int = Path(..., title="ID da disciplina"),
    disciplina: DisciplinaBase = Body(...)
):
    """Atualiza uma disciplina existente"""
    # Verificar se a disciplina existe
    check_query = "SELECT id FROM disciplina WHERE id = %s"
    check_result = execute_query(check_query, (disciplina_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disciplina com ID {disciplina_id} não encontrada"
        )
    
    # Atualizar a disciplina
    update_query = """
        UPDATE disciplina
        SET nome = %s, carga_horaria = %s
        WHERE id = %s
        RETURNING id, nome, carga_horaria
    """
    result = execute_query(
        update_query,
        (disciplina.nome, disciplina.carga_horaria, disciplina_id),
        fetch_one=True
    )
    
    return dict(result)

@app.delete("/disciplinas/{disciplina_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_disciplina(disciplina_id: int = Path(..., title="ID da disciplina")):
    """Exclui uma disciplina existente"""
    # Verificar se a disciplina existe
    check_query = "SELECT id FROM disciplina WHERE id = %s"
    check_result = execute_query(check_query, (disciplina_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disciplina com ID {disciplina_id} não encontrada"
        )
    
    # Excluir a disciplina
    delete_query = "DELETE FROM disciplina WHERE id = %s"
    execute_query(delete_query, (disciplina_id,), fetch=False)
    
    return None

# Endpoints para Professores

@app.get("/professores", response_model=List[Professor])
async def listar_professores():
    """Lista todos os professores cadastrados"""
    query = """
        SELECT p.id, p.nome, p.email, p.formacao,
               ARRAY_AGG(pd.disciplina_id) AS disciplinas
        FROM professor p
        LEFT JOIN professor_disciplina pd ON p.id = pd.professor_id
        GROUP BY p.id, p.nome, p.email, p.formacao
        ORDER BY p.nome
    """
    result = execute_query(query)
    
    # Converter resultado para lista de dicionários
    professores = []
    for row in result:
        professor = dict(row)
        # Remover valores nulos da lista de disciplinas
        if professor['disciplinas'] and professor['disciplinas'][0] is None:
            professor['disciplinas'] = []
        professores.append(professor)
    
    return professores

@app.get("/professores/{professor_id}", response_model=Professor)
async def obter_professor(professor_id: int = Path(..., title="ID do professor")):
    """Obtém um professor específico pelo ID"""
    query = """
        SELECT p.id, p.nome, p.email, p.formacao,
               ARRAY_AGG(pd.disciplina_id) AS disciplinas
        FROM professor p
        LEFT JOIN professor_disciplina pd ON p.id = pd.professor_id
        WHERE p.id = %s
        GROUP BY p.id, p.nome, p.email, p.formacao
    """
    result = execute_query(query, (professor_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Professor com ID {professor_id} não encontrado"
        )
    
    professor = dict(result)
    # Remover valores nulos da lista de disciplinas
    if professor['disciplinas'] and professor['disciplinas'][0] is None:
        professor['disciplinas'] = []
    
    return professor

@app.post("/professores", response_model=Professor, status_code=status.HTTP_201_CREATED)
async def criar_professor(professor: ProfessorCreate):
    """Cria um novo professor"""
    # Iniciar uma transação
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Inserir professor
        insert_query = """
            INSERT INTO professor (nome, email, formacao)
            VALUES (%s, %s, %s)
            RETURNING id, nome, email, formacao
        """
        cursor.execute(insert_query, (professor.nome, professor.email, professor.formacao))
        result = cursor.fetchone()
        professor_id = result['id']
        
        # Inserir disciplinas do professor
        disciplinas = []
        if professor.disciplinas:
            for disciplina_id in professor.disciplinas:
                # Verificar se a disciplina existe
                cursor.execute("SELECT id FROM disciplina WHERE id = %s", (disciplina_id,))
                if cursor.fetchone():
                    # Inserir relação professor-disciplina
                    cursor.execute(
                        "INSERT INTO professor_disciplina (professor_id, disciplina_id) VALUES (%s, %s)",
                        (professor_id, disciplina_id)
                    )
                    disciplinas.append(disciplina_id)
        
        conn.commit()
        
        # Retornar professor criado
        novo_professor = dict(result)
        novo_professor['disciplinas'] = disciplinas
        
        return novo_professor
    
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao criar professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar professor: {str(e)}"
        )
    finally:
        conn.close()

@app.put("/professores/{professor_id}", response_model=Professor)
async def atualizar_professor(
    professor_id: int = Path(..., title="ID do professor"),
    professor: ProfessorBase = Body(...)
):
    """Atualiza um professor existente"""
    # Iniciar uma transação
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Verificar se o professor existe
        cursor.execute("SELECT id FROM professor WHERE id = %s", (professor_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Professor com ID {professor_id} não encontrado"
            )
        
        # Atualizar professor
        update_query = """
            UPDATE professor
            SET nome = %s, email = %s, formacao = %s
            WHERE id = %s
            RETURNING id, nome, email, formacao
        """
        cursor.execute(update_query, (professor.nome, professor.email, professor.formacao, professor_id))
        result = cursor.fetchone()
        
        # Remover disciplinas existentes
        cursor.execute("DELETE FROM professor_disciplina WHERE professor_id = %s", (professor_id,))
        
        # Inserir novas disciplinas
        disciplinas = []
        if professor.disciplinas:
            for disciplina_id in professor.disciplinas:
                # Verificar se a disciplina existe
                cursor.execute("SELECT id FROM disciplina WHERE id = %s", (disciplina_id,))
                if cursor.fetchone():
                    # Inserir relação professor-disciplina
                    cursor.execute(
                        "INSERT INTO professor_disciplina (professor_id, disciplina_id) VALUES (%s, %s)",
                        (professor_id, disciplina_id)
                    )
                    disciplinas.append(disciplina_id)
        
        conn.commit()
        
        # Retornar professor atualizado
        professor_atualizado = dict(result)
        professor_atualizado['disciplinas'] = disciplinas
        
        return professor_atualizado
    
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao atualizar professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar professor: {str(e)}"
        )
    finally:
        conn.close()

@app.delete("/professores/{professor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_professor(professor_id: int = Path(..., title="ID do professor")):
    """Exclui um professor existente"""
    # Iniciar uma transação
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verificar se o professor existe
        cursor.execute("SELECT id FROM professor WHERE id = %s", (professor_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Professor com ID {professor_id} não encontrado"
            )
        
        # Remover disciplinas do professor
        cursor.execute("DELETE FROM professor_disciplina WHERE professor_id = %s", (professor_id,))
        
        # Excluir o professor
        cursor.execute("DELETE FROM professor WHERE id = %s", (professor_id,))
        
        conn.commit()
        
        return None
    
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao excluir professor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir professor: {str(e)}"
        )
    finally:
        conn.close()

# Endpoints para Alunos

@app.get("/alunos", response_model=List[Aluno])
async def listar_alunos(
    turma_id: Optional[int] = Query(None, title="ID da turma para filtrar alunos")
):
    """Lista todos os alunos cadastrados, com opção de filtrar por turma"""
    if turma_id:
        query = "SELECT * FROM aluno WHERE turma_id = %s ORDER BY nome"
        result = execute_query(query, (turma_id,))
    else:
        query = "SELECT * FROM aluno ORDER BY nome"
        result = execute_query(query)
    
    # Converter resultado para lista de dicionários
    alunos = []
    for row in result:
        alunos.append(dict(row))
    
    return alunos

@app.get("/alunos/{aluno_id}", response_model=Aluno)
async def obter_aluno(aluno_id: int = Path(..., title="ID do aluno")):
    """Obtém um aluno específico pelo ID"""
    query = "SELECT * FROM aluno WHERE id = %s"
    result = execute_query(query, (aluno_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {aluno_id} não encontrado"
        )
    
    return dict(result)

@app.post("/alunos", response_model=Aluno, status_code=status.HTTP_201_CREATED)
async def criar_aluno(aluno: AlunoCreate):
    """Cria um novo aluno"""
    # Verificar se a turma existe
    check_query = "SELECT id FROM turma WHERE id = %s"
    check_result = execute_query(check_query, (aluno.turma_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {aluno.turma_id} não encontrada"
        )
    
    # Inserir aluno
    query = """
        INSERT INTO aluno (nome, matricula, turma_id)
        VALUES (%s, %s, %s)
        RETURNING id, nome, matricula, turma_id
    """
    result = execute_query(
        query, 
        (aluno.nome, aluno.matricula, aluno.turma_id),
        fetch_one=True
    )
    
    return dict(result)

@app.put("/alunos/{aluno_id}", response_model=Aluno)
async def atualizar_aluno(
    aluno_id: int = Path(..., title="ID do aluno"),
    aluno: AlunoBase = Body(...)
):
    """Atualiza um aluno existente"""
    # Verificar se o aluno existe
    check_query = "SELECT id FROM aluno WHERE id = %s"
    check_result = execute_query(check_query, (aluno_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {aluno_id} não encontrado"
        )
    
    # Verificar se a turma existe
    check_turma_query = "SELECT id FROM turma WHERE id = %s"
    check_turma_result = execute_query(check_turma_query, (aluno.turma_id,), fetch_one=True)
    
    if not check_turma_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {aluno.turma_id} não encontrada"
        )
    
    # Atualizar o aluno
    update_query = """
        UPDATE aluno
        SET nome = %s, matricula = %s, turma_id = %s
        WHERE id = %s
        RETURNING id, nome, matricula, turma_id
    """
    result = execute_query(
        update_query,
        (aluno.nome, aluno.matricula, aluno.turma_id, aluno_id),
        fetch_one=True
    )
    
    return dict(result)

@app.delete("/alunos/{aluno_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_aluno(aluno_id: int = Path(..., title="ID do aluno")):
    """Exclui um aluno existente"""
    # Verificar se o aluno existe
    check_query = "SELECT id FROM aluno WHERE id = %s"
    check_result = execute_query(check_query, (aluno_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {aluno_id} não encontrado"
        )
    
    # Excluir o aluno
    delete_query = "DELETE FROM aluno WHERE id = %s"
    execute_query(delete_query, (aluno_id,), fetch=False)
    
    return None

# Endpoints para Notas

@app.get("/notas", response_model=List[Nota])
async def listar_notas(
    turma_id: Optional[int] = Query(None, title="ID da turma para filtrar notas"),
    disciplina_id: Optional[int] = Query(None, title="ID da disciplina para filtrar notas"),
    aluno_id: Optional[int] = Query(None, title="ID do aluno para filtrar notas"),
    bimestre: Optional[int] = Query(None, title="Bimestre para filtrar notas"),
    ano: Optional[int] = Query(None, title="Ano para filtrar notas")
):
    """Lista todas as notas cadastradas, com opções de filtro"""
    query = "SELECT * FROM nota WHERE 1=1"
    params = []
    
    # Adicionar filtros à consulta
    if turma_id:
        query += " AND turma_id = %s"
        params.append(turma_id)
    
    if disciplina_id:
        query += " AND disciplina_id = %s"
        params.append(disciplina_id)
    
    if aluno_id:
        query += " AND aluno_id = %s"
        params.append(aluno_id)
    
    if bimestre:
        query += " AND bimestre = %s"
        params.append(bimestre)
    
    if ano:
        query += " AND ano = %s"
        params.append(ano)
    
    query += " ORDER BY ano DESC, bimestre, turma_id, disciplina_id, aluno_id"
    
    result = execute_query(query, tuple(params) if params else None)
    
    # Converter resultado para lista de dicionários
    notas = []
    for row in result:
        notas.append(dict(row))
    
    return notas

@app.get("/notas/{nota_id}", response_model=Nota)
async def obter_nota(nota_id: int = Path(..., title="ID da nota")):
    """Obtém uma nota específica pelo ID"""
    query = "SELECT * FROM nota WHERE id = %s"
    result = execute_query(query, (nota_id,), fetch_one=True)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota com ID {nota_id} não encontrada"
        )
    
    return dict(result)

@app.post("/notas", response_model=Nota, status_code=status.HTTP_201_CREATED)
async def criar_nota(nota: NotaCreate):
    """Cria uma nova nota"""
    # Verificar se o aluno existe
    check_aluno_query = "SELECT id FROM aluno WHERE id = %s"
    check_aluno_result = execute_query(check_aluno_query, (nota.aluno_id,), fetch_one=True)
    
    if not check_aluno_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {nota.aluno_id} não encontrado"
        )
    
    # Verificar se a disciplina existe
    check_disciplina_query = "SELECT id FROM disciplina WHERE id = %s"
    check_disciplina_result = execute_query(check_disciplina_query, (nota.disciplina_id,), fetch_one=True)
    
    if not check_disciplina_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disciplina com ID {nota.disciplina_id} não encontrada"
        )
    
    # Verificar se a turma existe
    check_turma_query = "SELECT id FROM turma WHERE id = %s"
    check_turma_result = execute_query(check_turma_query, (nota.turma_id,), fetch_one=True)
    
    if not check_turma_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {nota.turma_id} não encontrada"
        )
    
    # Verificar se já existe uma nota para este aluno, disciplina, turma, bimestre e ano
    check_nota_query = """
        SELECT id FROM nota 
        WHERE aluno_id = %s AND disciplina_id = %s AND turma_id = %s AND bimestre = %s AND ano = %s
    """
    check_nota_result = execute_query(
        check_nota_query, 
        (nota.aluno_id, nota.disciplina_id, nota.turma_id, nota.bimestre, nota.ano),
        fetch_one=True
    )
    
    if check_nota_result:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe uma nota cadastrada para este aluno, disciplina, turma, bimestre e ano"
        )
    
    # Inserir nota
    query = """
        INSERT INTO nota (
            aluno_id, disciplina_id, turma_id, bimestre, ano,
            nota_mensal, nota_bimestral, nota_recuperacao, media_final
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, aluno_id, disciplina_id, turma_id, bimestre, ano,
                  nota_mensal, nota_bimestral, nota_recuperacao, media_final
    """
    result = execute_query(
        query, 
        (
            nota.aluno_id, nota.disciplina_id, nota.turma_id, nota.bimestre, nota.ano,
            nota.nota_mensal, nota.nota_bimestral, nota.nota_recuperacao, nota.media_final
        ),
        fetch_one=True
    )
    
    return dict(result)

@app.put("/notas/{nota_id}", response_model=Nota)
async def atualizar_nota(
    nota_id: int = Path(..., title="ID da nota"),
    nota: NotaBase = Body(...)
):
    """Atualiza uma nota existente"""
    # Verificar se a nota existe
    check_query = "SELECT id FROM nota WHERE id = %s"
    check_result = execute_query(check_query, (nota_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota com ID {nota_id} não encontrada"
        )
    
    # Verificar se o aluno existe
    check_aluno_query = "SELECT id FROM aluno WHERE id = %s"
    check_aluno_result = execute_query(check_aluno_query, (nota.aluno_id,), fetch_one=True)
    
    if not check_aluno_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aluno com ID {nota.aluno_id} não encontrado"
        )
    
    # Verificar se a disciplina existe
    check_disciplina_query = "SELECT id FROM disciplina WHERE id = %s"
    check_disciplina_result = execute_query(check_disciplina_query, (nota.disciplina_id,), fetch_one=True)
    
    if not check_disciplina_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Disciplina com ID {nota.disciplina_id} não encontrada"
        )
    
    # Verificar se a turma existe
    check_turma_query = "SELECT id FROM turma WHERE id = %s"
    check_turma_result = execute_query(check_turma_query, (nota.turma_id,), fetch_one=True)
    
    if not check_turma_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turma com ID {nota.turma_id} não encontrada"
        )
    
    # Verificar se já existe outra nota para este aluno, disciplina, turma, bimestre e ano
    check_nota_query = """
        SELECT id FROM nota 
        WHERE aluno_id = %s AND disciplina_id = %s AND turma_id = %s AND bimestre = %s AND ano = %s AND id != %s
    """
    check_nota_result = execute_query(
        check_nota_query, 
        (nota.aluno_id, nota.disciplina_id, nota.turma_id, nota.bimestre, nota.ano, nota_id),
        fetch_one=True
    )
    
    if check_nota_result:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Já existe outra nota cadastrada para este aluno, disciplina, turma, bimestre e ano"
        )
    
    # Atualizar a nota
    update_query = """
        UPDATE nota
        SET aluno_id = %s, disciplina_id = %s, turma_id = %s, bimestre = %s, ano = %s,
            nota_mensal = %s, nota_bimestral = %s, nota_recuperacao = %s, media_final = %s
        WHERE id = %s
        RETURNING id, aluno_id, disciplina_id, turma_id, bimestre, ano,
                  nota_mensal, nota_bimestral, nota_recuperacao, media_final
    """
    result = execute_query(
        update_query,
        (
            nota.aluno_id, nota.disciplina_id, nota.turma_id, nota.bimestre, nota.ano,
            nota.nota_mensal, nota.nota_bimestral, nota.nota_recuperacao, nota.media_final,
            nota_id
        ),
        fetch_one=True
    )
    
    return dict(result)

@app.delete("/notas/{nota_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_nota(nota_id: int = Path(..., title="ID da nota")):
    """Exclui uma nota existente"""
    # Verificar se a nota existe
    check_query = "SELECT id FROM nota WHERE id = %s"
    check_result = execute_query(check_query, (nota_id,), fetch_one=True)
    
    if not check_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nota com ID {nota_id} não encontrada"
        )
    
    # Excluir a nota
    delete_query = "DELETE FROM nota WHERE id = %s"
    execute_query(delete_query, (nota_id,), fetch=False)
    
    return None

@app.post("/calcular-medias", status_code=status.HTTP_200_OK)
async def calcular_medias():
    """Recalcula as médias finais de todas as notas"""
    query = """
        UPDATE nota
        SET media_final = CASE
            WHEN nota_recuperacao IS NOT NULL AND nota_recuperacao > (nota_mensal + nota_bimestral) / 2 THEN nota_recuperacao
            ELSE (nota_mensal + nota_bimestral) / 2
        END
        WHERE 1=1
        RETURNING id
    """
    result = execute_query(query)
    
    return {"message": f"Médias recalculadas com sucesso. {len(result)} notas atualizadas."}

# Endpoints para Estatísticas

@app.get("/estatisticas")
async def obter_estatisticas():
    """Obtém estatísticas gerais do sistema"""
    # Total de alunos
    query_alunos = "SELECT COUNT(*) as total FROM aluno"
    result_alunos = execute_query(query_alunos, fetch_one=True)
    total_alunos = result_alunos['total']
    
    # Total de turmas
    query_turmas = "SELECT COUNT(*) as total FROM turma"
    result_turmas = execute_query(query_turmas, fetch_one=True)
    total_turmas = result_turmas['total']
    
    # Total de professores
    query_professores = "SELECT COUNT(*) as total FROM professor"
    result_professores = execute_query(query_professores, fetch_one=True)
    total_professores = result_professores['total']
    
    # Total de disciplinas
    query_disciplinas = "SELECT COUNT(*) as total FROM disciplina"
    result_disciplinas = execute_query(query_disciplinas, fetch_one=True)
    total_disciplinas = result_disciplinas['total']
    
    return {
        "totalAlunos": total_alunos,
        "totalTurmas": total_turmas,
        "totalProfessores": total_professores,
        "totalDisciplinas": total_disciplinas
    }

@app.get("/desempenho-turmas")
async def obter_desempenho_turmas(
    ano: int = Query(..., title="Ano letivo"),
    bimestre: int = Query(..., title="Bimestre (1-4)")
):
    """Obtém o desempenho médio das turmas em um determinado ano e bimestre"""
    query = """
        SELECT t.nome as turma, AVG(n.media_final) as media
        FROM nota n
        JOIN turma t ON n.turma_id = t.id
        WHERE n.ano = %s AND n.bimestre = %s
        GROUP BY t.nome
        ORDER BY t.nome
    """
    result = execute_query(query, (ano, bimestre))
    
    # Converter resultado para lista de dicionários
    desempenho = []
    for row in result:
        desempenho.append({
            "turma": row['turma'],
            "media": float(row['media']) if row['media'] is not None else 0
        })
    
    return desempenho

@app.get("/distribuicao-alunos")
async def obter_distribuicao_alunos():
    """Obtém a distribuição de alunos por turma"""
    query = """
        SELECT t.nome as turma, COUNT(a.id) as quantidade
        FROM turma t
        LEFT JOIN aluno a ON t.id = a.turma_id
        GROUP BY t.nome
        ORDER BY t.nome
    """
    result = execute_query(query)
    
    # Converter resultado para lista de dicionários
    distribuicao = []
    for row in result:
        distribuicao.append({
            "turma": row['turma'],
            "quantidade": row['quantidade']
        })
    
    return distribuicao

# Iniciar servidor se executado diretamente
if __name__ == "__main__":
    # Determinar porta com base no ambiente
    port = int(os.environ.get("PORT", 8000))
    
    # Iniciar servidor
    uvicorn.run(
        "simplified_api:app",
        host="0.0.0.0",
        port=port,
        reload=not IS_PRODUCTION
    )
