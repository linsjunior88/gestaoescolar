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
    allow_origins=["*"],  # Permitir todas as origens temporariamente para debug
    allow_credentials=False,  # Desabilitar credentials quando allow_origins é "*"
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

# Modelo para TurmaDisciplina
class TurmaDisciplinaBase(BaseModel):
    id_disciplina: str
    id_turma: str

class TurmaDisciplinaCreate(TurmaDisciplinaBase):
    pass

class TurmaDisciplina(TurmaDisciplinaBase):
    id: Optional[int] = None
    
    class Config:
        from_attributes = True

# Modelo para Professor
class Professor(BaseModel):
    id: Optional[int] = None
    id_professor: str
    nome_professor: str
    email_professor: Optional[str] = None
    senha_professor: Optional[str] = None
    ativo: Optional[bool] = True  # Campo ativo adicionado
    cpf: Optional[str] = None  # CPF do professor - 11 dígitos
    disciplinas: Optional[List[str]] = []
    mensagens: Optional[List[str]] = []

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
    ativo: Optional[bool] = None  # Campo ativo adicionado
    cpf: Optional[str] = None  # CPF do professor - 11 dígitos
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
    codigo_inep: Optional[str] = None  # Código INEP do aluno - 12 dígitos

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
    codigo_inep: Optional[str] = None  # Código INEP do aluno - 12 dígitos

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
    frequencia: Optional[int] = None  # Número de faltas no bimestre
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

# Modelos para Calendário Escolar
class EventoCalendarioBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    data_inicio: str  # Formato: YYYY-MM-DD
    data_fim: str  # Formato: YYYY-MM-DD
    hora_inicio: Optional[str] = None  # Formato: HH:MM
    hora_fim: Optional[str] = None  # Formato: HH:MM
    tipo_evento: str  # feriado_nacional, feriado_estadual, feriado_municipal, evento_escolar, reuniao, etc.
    cor: Optional[str] = "#3498db"  # Cor em hexadecimal para customização visual
    recorrente: Optional[bool] = False
    frequencia_recorrencia: Optional[str] = None  # diaria, semanal, mensal, anual
    observacoes: Optional[str] = None

class EventoCalendarioCreate(EventoCalendarioBase):
    criado_por: str  # ID ou nome de quem está criando o evento

class EventoCalendarioUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    tipo_evento: Optional[str] = None
    cor: Optional[str] = None
    recorrente: Optional[bool] = None
    frequencia_recorrencia: Optional[str] = None
    observacoes: Optional[str] = None
    ativo: Optional[bool] = None

class EventoCalendario(EventoCalendarioBase):
    id: int
    criado_por: str
    data_criacao: Optional[datetime] = None
    ativo: Optional[bool] = True
    
    class Config:
        from_attributes = True

# Modelos para Escola
class EscolaBase(BaseModel):
    codigo_inep: str  # Código INEP da escola - 8 dígitos
    cnpj: Optional[str] = None  # CNPJ da escola - 14 dígitos
    razao_social: str
    nome_fantasia: Optional[str] = None
    logo: Optional[str] = None
    
    # Endereço
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    
    # Contatos
    telefone_principal: Optional[str] = None
    telefone_secundario: Optional[str] = None
    email_principal: Optional[str] = None
    
    # Classificação MEC/INEP
    dependencia_administrativa: Optional[str] = "Municipal"
    situacao_funcionamento: Optional[str] = "Em Atividade"
    localizacao: str  # Urbana ou Rural
    ato_autorizacao: Optional[str] = None
    
    # Gestor
    gestor_nome: Optional[str] = None
    gestor_cpf: Optional[str] = None
    gestor_email: Optional[str] = None

class EscolaCreate(EscolaBase):
    pass

class EscolaUpdate(BaseModel):
    codigo_inep: Optional[str] = None
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    logo: Optional[str] = None
    
    # Endereço
    cep: Optional[str] = None
    logradouro: Optional[str] = None
    numero: Optional[str] = None
    complemento: Optional[str] = None
    bairro: Optional[str] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None
    
    # Contatos
    telefone_principal: Optional[str] = None
    telefone_secundario: Optional[str] = None
    email_principal: Optional[str] = None
    
    # Classificação MEC/INEP
    dependencia_administrativa: Optional[str] = None
    situacao_funcionamento: Optional[str] = None
    localizacao: Optional[str] = None
    ato_autorizacao: Optional[str] = None
    
    # Gestor
    gestor_nome: Optional[str] = None
    gestor_cpf: Optional[str] = None
    gestor_email: Optional[str] = None
    
    # Controle
    ativo: Optional[bool] = None

class Escola(EscolaBase):
    id_escola: int
    ativo: Optional[bool] = True
    data_cadastro: Optional[datetime] = None
    data_atualizacao: Optional[datetime] = None
    
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
               a.endereco, a.telefone, a.email, a.mae, a.id_turma, a.codigo_inep
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
                "id_turma": row["id_turma"],
                "codigo_inep": row["codigo_inep"]
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

@app.get("/api/professores/filtro/", response_model=List[Professor])
def read_professores_filtro(
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo (true/false)")
):
    """Busca professores com filtro opcional por status ativo."""
    print(f"=== INICIANDO BUSCA DE PROFESSORES COM FILTRO (ativo={ativo}) ===")
    try:
        # Construir query com filtro opcional
        if ativo is not None:
            query = """
            SELECT p.id, p.id_professor, p.nome_professor, p.email_professor, p.ativo, p.cpf
            FROM professor p
            WHERE p.ativo = %s
            ORDER BY p.nome_professor
            """
            params = (ativo,)
        else:
            query = """
            SELECT p.id, p.id_professor, p.nome_professor, p.email_professor, p.ativo, p.cpf
            FROM professor p
            ORDER BY p.nome_professor
            """
            params = None
            
        print(f"Executando consulta: {query}")
        results = execute_query(query, params)
        
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
                "ativo": row["ativo"],
                "cpf": row["cpf"],  # Adicionar campo CPF
                "disciplinas": disciplinas
            }
            professores.append(professor)
        
        print("Retornando lista de professores filtrada com sucesso")
        return professores
    except Exception as e:
        print(f"ERRO ao buscar professores com filtro: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar professores: {str(e)}"
        )
    finally:
        print("=== FINALIZANDO BUSCA DE PROFESSORES COM FILTRO ===")

@app.get("/api/professores/", response_model=List[Professor])
def read_professores():
    """Busca todos os professores cadastrados."""
    print("=== INICIANDO BUSCA DE TODOS OS PROFESSORES ===")
    try:
        # Consulta direta incluindo campo ativo e cpf
        query = """
        SELECT p.id, p.id_professor, p.nome_professor, p.email_professor, p.ativo, p.cpf
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
                "ativo": row["ativo"],  # Adicionar campo ativo
                "cpf": row["cpf"],  # Adicionar campo CPF
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
        # Consulta direta incluindo campo ativo e cpf
        query = """
        SELECT p.id, p.id_professor, p.nome_professor, p.email_professor, p.ativo, p.cpf
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
            "ativo": result["ativo"],  # Adicionar campo ativo
            "cpf": result["cpf"],  # Adicionar campo CPF
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

@app.post("/api/professores/", response_model=Professor, status_code=status.HTTP_201_CREATED)
def create_professor(professor: ProfessorCreate):
    """Cria um novo professor."""
    print(f"=== INICIANDO CRIAÇÃO DE PROFESSOR: {professor.id_professor} ===")
    try:
        # Verificar se já existe um professor com o mesmo id_professor
        query = "SELECT id FROM professor WHERE id_professor = %s"
        existing = execute_query(query, (professor.id_professor,), fetch_one=True)
        
        if existing:
            print(f"Professor com ID {professor.id_professor} já existe")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe um professor com o código {professor.id_professor}"
            )
        
        # Inserir o novo professor
        query = """
        INSERT INTO professor (id_professor, nome_professor, email_professor, senha, ativo, cpf)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, id_professor, nome_professor, email_professor, ativo, cpf
        """
        params = (
            professor.id_professor,
            professor.nome_professor,
            professor.email_professor,
            professor.senha_professor,
            professor.ativo,
            professor.cpf
        )
        
        print(f"Executando query de inserção: {query}")
        result = execute_query(query, params, fetch_one=True)
        
        if not result:
            print("Falha ao criar professor")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao criar professor"
            )
        
        print(f"Professor criado com sucesso: {result}")
        
        # Lista para armazenar mensagens informativas
        mensagens = []
        
        # Verificar se há disciplinas para vincular
        disciplinas_com_turmas = []
        disciplinas_sem_turmas = []
        
        if hasattr(professor, 'disciplinas') and professor.disciplinas:
            print(f"Verificando disciplinas: {professor.disciplinas}")
            conn = None
            try:
                conn = get_db_connection()
                cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
                
                for disciplina_id in professor.disciplinas:
                    # Verificar se a disciplina existe
                    cursor.execute("SELECT id FROM disciplina WHERE id_disciplina = %s", (disciplina_id,))
                    disciplina_result = cursor.fetchone()
                    
                    if not disciplina_result:
                        mensagens.append(f"Disciplina {disciplina_id} não encontrada")
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
                        disciplinas_sem_turmas.append(disciplina_id)
                        mensagem = f"Disciplina {disciplina_id} não tem turmas vinculadas. É necessário realizar o vínculo de turmas e disciplinas primeiro no módulo de disciplinas."
                        mensagens.append(mensagem)
                        print(mensagem)
                        continue
                    
                    disciplinas_com_turmas.append(disciplina_id)
                    
                    # Para cada turma, criar um vínculo
                    for turma in turmas:
                        id_turma = turma['id_turma']
                        
                        # Verificar se já existe o vínculo
                        cursor.execute("""
                            SELECT id FROM professor_disciplina_turma 
                            WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
                        """, (professor.id_professor, disciplina_id, id_turma))
                        
                        vinculo_existente = cursor.fetchone()
                        
                        if not vinculo_existente:
                            # Inserir novo vínculo
                            cursor.execute("""
                                INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
                                VALUES (%s, %s, %s)
                            """, (professor.id_professor, disciplina_id, id_turma))
                            
                            mensagem = f"Vínculo criado: Professor={professor.id_professor}, Disciplina={disciplina_id}, Turma={id_turma}"
                            mensagens.append(mensagem)
                            print(mensagem)
                
                conn.commit()
                print("Vínculos de disciplinas e turmas processados com sucesso")
                
            except Exception as e:
                if conn:
                    conn.rollback()
                erro = f"Erro ao vincular disciplinas: {str(e)}"
                mensagens.append(erro)
                print(erro)
            finally:
                if conn:
                    conn.close()
        
        # Preparar a resposta
        response = {
            "id": result["id"],
            "id_professor": result["id_professor"],
            "nome_professor": result["nome_professor"],
            "email_professor": result["email_professor"],
            "senha_professor": None,  # Não retornar a senha
            "ativo": result["ativo"],  # Adicionar campo ativo
            "disciplinas": disciplinas_com_turmas,
            "mensagens": mensagens
        }
        
        print(f"Retornando resposta: {response}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao criar professor: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO CRIAÇÃO DE PROFESSOR ===")

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
        if professor.ativo is not None:
            updates["ativo"] = professor.ativo  # Adicionar suporte ao campo ativo
        if professor.cpf is not None:
            updates["cpf"] = professor.cpf  # Adicionar suporte ao campo CPF
        
        print(f"Campos a atualizar: {updates}")
        
        if not updates:
            # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
            return read_professor(professor_id)
        
        # Construir a query de atualização
        set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
        query = f"UPDATE professor SET {set_clause} WHERE id = %s RETURNING id, id_professor, nome_professor, email_professor, ativo, cpf"
        
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
        # Buscar professor pelo email incluindo o campo ativo
        query = "SELECT * FROM professor WHERE email_professor = %s"
        result = execute_query(query, (login_data.email_professor,), fetch_one=True)
        
        if not result:
            print(f"Professor com email {login_data.email_professor} não encontrado")
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Verificar se o professor está ativo
        if not result["ativo"]:
            print(f"Professor {result['nome_professor']} está inativo")
            raise HTTPException(
                status_code=401, 
                detail="Professor inativo. Entre em contato com a administração."
            )
        
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
            "ativo": result["ativo"],
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
        return {
            "message": "Login realizado com sucesso",
            "professor": professor_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO no login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno no servidor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO LOGIN DO PROFESSOR ===")

@app.patch("/api/professores/{professor_id}/status", response_model=Professor)
def toggle_professor_status(
    professor_id: str = Path(..., description="ID do professor"),
    ativo: bool = Body(..., embed=True, description="Status ativo do professor")
):
    """Ativa ou inativa um professor."""
    print(f"=== ALTERANDO STATUS DO PROFESSOR {professor_id} PARA {'ATIVO' if ativo else 'INATIVO'} ===")
    try:
        # Verificar se o professor existe
        check_query = "SELECT id FROM professor WHERE id_professor = %s"
        existing = execute_query(check_query, (professor_id,), fetch_one=True)
        
        if not existing:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail="Professor não encontrado")
        
        # Atualizar o status do professor
        query = """
        UPDATE professor 
        SET ativo = %s 
        WHERE id_professor = %s
        RETURNING id, id_professor, nome_professor, email_professor, ativo
        """
        
        print(f"Executando query: {query} com parâmetros: {ativo}, {professor_id}")
        result = execute_query(query, (ativo, professor_id), fetch_one=True)
        
        if not result:
            print("Falha ao atualizar status do professor")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao atualizar status do professor"
            )
        
        # Registrar atividade no log
        try:
            log_data = {
                "usuario": "Sistema",
                "acao": "atualizar",
                "entidade": "professor",
                "entidade_id": professor_id,
                "detalhe": f"Status alterado para {'ativo' if ativo else 'inativo'}",
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
            print(f"Erro ao registrar log de alteração de status: {str(e)}")
        
        # Buscar dados atualizados com as disciplinas
        updated_professor = read_professor(professor_id)
        print(f"Status do professor alterado com sucesso: {updated_professor}")
        return updated_professor
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao alterar status do professor {professor_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao alterar status do professor: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO ALTERAÇÃO DE STATUS DO PROFESSOR {professor_id} ===")

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
               a.endereco, a.telefone, a.email, a.mae, a.id_turma, a.codigo_inep
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
                "id_turma": row["id_turma"],
                "codigo_inep": row["codigo_inep"]
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
               a.endereco, a.telefone, a.email, a.mae, a.id_turma, a.codigo_inep
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
            "id_turma": result["id_turma"],
            "codigo_inep": result["codigo_inep"]
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
                           email, mae, id_turma, codigo_inep)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, id_aluno, nome_aluno, data_nasc, sexo, endereco, telefone, 
                 email, mae, id_turma, codigo_inep
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
            aluno.id_turma,
            aluno.codigo_inep
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
            "id_turma": result["id_turma"],
            "codigo_inep": result["codigo_inep"]
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
        if aluno.codigo_inep is not None:
            updates["codigo_inep"] = aluno.codigo_inep
        
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
                  email, mae, id_turma, codigo_inep
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
            "id_turma": result["id_turma"],
            "codigo_inep": result["codigo_inep"]
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
               a.endereco, a.telefone, a.email, a.mae, a.id_turma, a.codigo_inep
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
                "id_turma": row["id_turma"],
                "codigo_inep": row["codigo_inep"]
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
                SET nota_mensal = %s, nota_bimestral = %s, recuperacao = %s, media = %s, frequencia = %s
                WHERE id = %s
            """, (nota.nota_mensal, nota.nota_bimestral, nota.recuperacao, media, nota.frequencia, nota_id))
            
        else:
            print(f"INSERINDO nova nota: Aluno={nota.id_aluno}, Disciplina={nota.id_disciplina}, Turma={nota.id_turma}")
            
            cursor.execute("""
                INSERT INTO nota (id_aluno, id_disciplina, id_turma, ano, bimestre, 
                                nota_mensal, nota_bimestral, recuperacao, media, frequencia)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (nota.id_aluno, nota.id_disciplina, nota.id_turma, nota.ano, nota.bimestre,
                nota.nota_mensal, nota.nota_bimestral, nota.recuperacao, media, nota.frequencia))
            
            nota_id = cursor.fetchone()[0]
        
        # COMMIT EXPLÍCITO - MUITO IMPORTANTE
        conn.commit()
        print(f"TRANSAÇÃO CONFIRMADA - NOTA ID={nota_id} SALVA COM SUCESSO")
        
        # Buscar nota salva para confirmar
        cursor.execute("""
            SELECT id, id_aluno, id_disciplina, id_turma, ano, bimestre, 
                   nota_mensal, nota_bimestral, recuperacao, media, frequencia
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
            "media": nota_data[9],
            "frequencia": nota_data[10]
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
                   n.ano, n.bimestre, n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia
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
                "media": nota[9],
                "frequencia": nota[10]
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
                n.media, 
                n.frequencia
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
                "media": nota[13],
                "frequencia": nota[14]
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
                   ano, bimestre, nota_mensal, nota_bimestral, recuperacao, media, frequencia
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
            "media": nota_data[9],
            "frequencia": nota_data[10]
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
                nota_mensal = %s, nota_bimestral = %s, recuperacao = %s, media = %s, frequencia = %s
            WHERE id = %s
            RETURNING id
        """, (nota.id_aluno, nota.id_disciplina, nota.id_turma, nota.ano, nota.bimestre,
              nota.nota_mensal, nota.nota_bimestral, nota.recuperacao, media, nota.frequencia, nota_id))
        
        nota_id = cursor.fetchone()[0]
        conn.commit()
        
        # Buscar a nota atualizada
        cursor.execute("""
            SELECT id, id_aluno, id_disciplina, id_turma, ano, bimestre, 
                   nota_mensal, nota_bimestral, recuperacao, media, frequencia
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
            "media": nota_data[9],
            "frequencia": nota_data[10]
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
                   n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia
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
                "media": nota[12],
                "frequencia": nota[13]
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
                   n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia
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
                "media": nota[12],
                "frequencia": nota[13]
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
                   n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia
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
                "media": nota[12],
                "frequencia": nota[13]
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
               n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia,
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
               n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia,
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
               n.nota_mensal, n.nota_bimestral, n.recuperacao, n.media, n.frequencia,
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

@app.delete("/api/professores/{professor_id}/disciplinas", status_code=status.HTTP_204_NO_CONTENT)
def delete_professor_disciplinas(
    professor_id: str = Path(..., description="ID do professor para remover vínculos com disciplinas")
):
    """Remove todos os vínculos entre um professor e suas disciplinas."""
    print(f"=== REMOVENDO VÍNCULOS DO PROFESSOR: {professor_id} COM TODAS AS DISCIPLINAS ===")
    try:
        # Verificar se o professor existe
        query_professor = "SELECT * FROM professor WHERE id_professor = %s"
        professor_result = execute_query(query_professor, (professor_id,), fetch_one=True)
        
        if not professor_result:
            print(f"Professor com ID {professor_id} não encontrado")
            raise HTTPException(status_code=404, detail="Professor não encontrado")
        
        print(f"Professor encontrado: {professor_id}, removendo vínculos com disciplinas")
        
        # Remover todos os vínculos entre o professor e suas disciplinas
        delete_query = """
        DELETE FROM professor_disciplina_turma 
        WHERE id_professor = %s
        """
        # Executar a query sem fetch (para DELETE)
        execute_query(delete_query, (professor_id,), fetch=False)
        
        print(f"Vínculos do professor {professor_id} com disciplinas removidos com sucesso")
        return None
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao remover vínculos do professor {professor_id} com disciplinas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover vínculos do professor com disciplinas: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO REMOÇÃO DE VÍNCULOS DO PROFESSOR: {professor_id} ===")

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

# ==============================================================
# Endpoints para vincular Disciplinas e Turmas
# ==============================================================

@app.post("/api/disciplinas/{disciplina_id}/turmas", response_model=List[TurmaDisciplina])
def create_disciplina_turmas(
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turmas_ids: List[str] = Body(..., embed=True, description="Lista de IDs de turmas para vincular")
):
    """
    Vincula uma ou mais turmas a uma disciplina específica.
    Envie um JSON com o formato: {"turmas_ids": ["id1", "id2", ...]}
    """
    print(f"DEBUG: Endpoint POST disciplina-turmas acessado. Disciplina: {disciplina_id}, Turmas: {turmas_ids}")
    try:
        # Verificar se a disciplina existe
        if disciplina_id.isdigit():
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id = %s"
            params = (int(disciplina_id),)
        else:
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
            params = (disciplina_id,)
        
        disciplina = execute_query(query_disciplina, params, fetch_one=True)
        
        if not disciplina:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        id_disciplina = disciplina["id_disciplina"]
        
        # Lista para armazenar os vínculos criados
        vinculos_criados = []
        
        # Para cada ID de turma, verificar se a turma existe e criar o vínculo
        for turma_id in turmas_ids:
            # Verificar se a turma existe
            query_turma = "SELECT id_turma FROM turma WHERE id_turma = %s"
            turma = execute_query(query_turma, (turma_id,), fetch_one=True)
            
            if not turma:
                print(f"DEBUG: Turma {turma_id} não encontrada, pulando")
                continue  # Se a turma não existe, pular
            
            # Verificar se o vínculo já existe
            query_vinculo = """
            SELECT id FROM turma_disciplina 
            WHERE id_disciplina = %s AND id_turma = %s
            """
            vinculo_existente = execute_query(query_vinculo, (id_disciplina, turma_id), fetch_one=True)
            
            if not vinculo_existente:
                # Criar o vínculo
                query_insert = """
                INSERT INTO turma_disciplina (id_disciplina, id_turma)
                VALUES (%s, %s)
                RETURNING id, id_disciplina, id_turma
                """
                novo_vinculo = execute_query(query_insert, (id_disciplina, turma_id), fetch_one=True)
                
                vinculos_criados.append({
                    "id": novo_vinculo["id"],
                    "id_disciplina": novo_vinculo["id_disciplina"],
                    "id_turma": novo_vinculo["id_turma"]
                })
                
                print(f"DEBUG: Vínculo criado entre {id_disciplina} e {turma_id}")
            else:
                print(f"DEBUG: Vínculo já existe entre {id_disciplina} e {turma_id}")
                vinculos_criados.append({
                    "id": vinculo_existente["id"],
                    "id_disciplina": id_disciplina,
                    "id_turma": turma_id
                })
        
        return vinculos_criados
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao vincular turmas à disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao vincular turmas à disciplina: {str(e)}"
        )

@app.delete("/api/disciplinas/{disciplina_id}/turmas", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina_turmas(
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: Optional[str] = Query(None, description="ID da turma específica a ser desvinculada")
):
    """
    Remove vínculos entre uma disciplina e uma ou todas as turmas.
    Se turma_id for fornecido como query parameter, remove apenas o vínculo com essa turma.
    Caso contrário, remove todos os vínculos da disciplina.
    """
    print(f"DEBUG: Removendo vínculos da disciplina {disciplina_id}, turma específica: {turma_id}")
    try:
        # Verificar se a disciplina existe
        if disciplina_id.isdigit():
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id = %s"
            params = (int(disciplina_id),)
        else:
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
            params = (disciplina_id,)
        
        disciplina = execute_query(query_disciplina, params, fetch_one=True)
        
        if not disciplina:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        id_disciplina = disciplina["id_disciplina"]
        
        # Construir a query para remover vínculos
        if turma_id:
            # Verificar se a turma existe
            query_turma = "SELECT id_turma FROM turma WHERE id_turma = %s"
            turma = execute_query(query_turma, (turma_id,), fetch_one=True)
            
            if not turma:
                raise HTTPException(status_code=404, detail="Turma não encontrada")
            
            query_delete = "DELETE FROM turma_disciplina WHERE id_disciplina = %s AND id_turma = %s"
            execute_query(query_delete, (id_disciplina, turma_id), fetch=False)
            print(f"DEBUG: Vínculo entre disciplina {id_disciplina} e turma {turma_id} removido")
        else:
            # Remover todos os vínculos da disciplina
            query_delete = "DELETE FROM turma_disciplina WHERE id_disciplina = %s"
            execute_query(query_delete, (id_disciplina,), fetch=False)
            print(f"DEBUG: Todos os vínculos da disciplina {id_disciplina} removidos")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao remover vínculos de turmas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover vínculos de turmas: {str(e)}"
        )

@app.post("/api/disciplinas/{disciplina_id}/turmas/{turma_id}", response_model=TurmaDisciplina)
def create_disciplina_turma(
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: str = Path(..., description="ID da turma")
):
    """
    Vincula uma turma específica a uma disciplina.
    """
    print(f"DEBUG: Vinculando disciplina {disciplina_id} à turma {turma_id}")
    try:
        # Verificar se a disciplina existe
        if disciplina_id.isdigit():
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id = %s"
            params = (int(disciplina_id),)
        else:
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
            params = (disciplina_id,)
        
        disciplina = execute_query(query_disciplina, params, fetch_one=True)
        
        if not disciplina:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        id_disciplina = disciplina["id_disciplina"]
        
        # Verificar se a turma existe
        query_turma = "SELECT id_turma FROM turma WHERE id_turma = %s"
        turma = execute_query(query_turma, (turma_id,), fetch_one=True)
        
        if not turma:
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        # Verificar se o vínculo já existe
        query_vinculo = """
        SELECT id FROM turma_disciplina 
        WHERE id_disciplina = %s AND id_turma = %s
        """
        vinculo_existente = execute_query(query_vinculo, (id_disciplina, turma_id), fetch_one=True)
        
        if vinculo_existente:
            print(f"DEBUG: Vínculo já existe, retornando existente")
            return {
                "id": vinculo_existente["id"],
                "id_disciplina": id_disciplina,
                "id_turma": turma_id
            }
        
        # Criar o vínculo
        query_insert = """
        INSERT INTO turma_disciplina (id_disciplina, id_turma)
        VALUES (%s, %s)
        RETURNING id, id_disciplina, id_turma
        """
        novo_vinculo = execute_query(query_insert, (id_disciplina, turma_id), fetch_one=True)
        
        print(f"DEBUG: Novo vínculo criado com id {novo_vinculo['id']}")
        return {
            "id": novo_vinculo["id"],
            "id_disciplina": novo_vinculo["id_disciplina"],
            "id_turma": novo_vinculo["id_turma"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao vincular turma à disciplina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao vincular turma à disciplina: {str(e)}"
        )

@app.delete("/api/disciplinas/{disciplina_id}/turmas/{turma_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_disciplina_turma(
    disciplina_id: str = Path(..., description="ID ou código da disciplina"),
    turma_id: str = Path(..., description="ID da turma")
):
    """
    Remove o vínculo entre uma disciplina específica e uma turma específica.
    """
    print(f"DEBUG: Removendo vínculo entre disciplina {disciplina_id} e turma {turma_id}")
    try:
        # Verificar se a disciplina existe
        if disciplina_id.isdigit():
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id = %s"
            params = (int(disciplina_id),)
        else:
            query_disciplina = "SELECT id_disciplina FROM disciplina WHERE id_disciplina = %s"
            params = (disciplina_id,)
        
        disciplina = execute_query(query_disciplina, params, fetch_one=True)
        
        if not disciplina:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        id_disciplina = disciplina["id_disciplina"]
        
        # Verificar se a turma existe
        query_turma = "SELECT id_turma FROM turma WHERE id_turma = %s"
        turma = execute_query(query_turma, (turma_id,), fetch_one=True)
        
        if not turma:
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        # Remover o vínculo
        query_delete = """
        DELETE FROM turma_disciplina 
        WHERE id_disciplina = %s AND id_turma = %s
        """
        result = execute_query(query_delete, (id_disciplina, turma_id), fetch=False)
        
        print(f"DEBUG: Vínculo removido entre disciplina {id_disciplina} e turma {turma_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao remover vínculo de turma: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover vínculo de turma: {str(e)}"
        )

# =================================================================
# ENDPOINTS PARA VÍNCULOS PROFESSOR-DISCIPLINA-TURMA
# =================================================================

# Modelo Pydantic para vínculos
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

# Função para garantir que a tabela professor_disciplina_turma exista
def criar_tabela_vinculos():
    try:
        logger.info("Verificando se a tabela professor_disciplina_turma existe...")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("SELECT to_regclass('public.professor_disciplina_turma');")
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            logger.info("A tabela professor_disciplina_turma já existe.")
        else:
            # Criar a tabela professor_disciplina_turma
            logger.info("Criando tabela professor_disciplina_turma...")
            cursor.execute("""
            CREATE TABLE professor_disciplina_turma (
                id SERIAL PRIMARY KEY,
                id_professor VARCHAR(20) NOT NULL,
                id_disciplina VARCHAR(20) NOT NULL,
                id_turma VARCHAR(20) NOT NULL,
                CONSTRAINT unique_vinculo UNIQUE (id_professor, id_disciplina, id_turma)
            );
            """)
            
            # Adicionar comentário à tabela
            cursor.execute("""
            COMMENT ON TABLE professor_disciplina_turma IS 'Tabela que armazena os vínculos entre professores, disciplinas e turmas';
            """)
            
            logger.info("Tabela professor_disciplina_turma criada com sucesso!")
        
        # Verificar índices
        cursor.execute("""
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'professor_disciplina_turma' AND indexname = 'idx_pdt_professor';
        """)
        if not cursor.fetchone():
            logger.info("Criando índices para melhorar a performance...")
            
            # Criar índices para melhorar a performance das consultas
            cursor.execute("""
            CREATE INDEX idx_pdt_professor ON professor_disciplina_turma (id_professor);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_pdt_disciplina ON professor_disciplina_turma (id_disciplina);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_pdt_turma ON professor_disciplina_turma (id_turma);
            """)
            
            logger.info("Índices criados com sucesso!")
        else:
            logger.info("Índices já existem na tabela.")
            
        cursor.close()
        conn.close()
        logger.info("Processo de verificação e criação da tabela professor_disciplina_turma concluído com sucesso!")
        
    except Exception as e:
        logger.error(f"Erro ao criar tabela professor_disciplina_turma: {e}")


@app.post("/api/professor_disciplina_turma", response_model=Dict, status_code=status.HTTP_201_CREATED)
def criar_vinculo_professor_disciplina_turma(vinculo: ProfessorDisciplinaTurmaCreate):
    """Cria um novo vínculo entre professor, disciplina e turma."""
    try:
        # Verificar se todos os campos obrigatórios foram fornecidos
        if not all([vinculo.id_professor, vinculo.id_disciplina, vinculo.id_turma]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Todos os campos (id_professor, id_disciplina, id_turma) são obrigatórios"
            )
        
        # Consultar se o vínculo já existe
        query = """
        SELECT id FROM professor_disciplina_turma 
        WHERE id_professor = %s AND id_disciplina = %s AND id_turma = %s
        """
        result = execute_query(query, (vinculo.id_professor, vinculo.id_disciplina, vinculo.id_turma), fetch_one=True)
        
        if result:
            # Vínculo já existe, retornar sem erro
            return {
                "message": "Vínculo já existe",
                "id": result["id"]
            }
        
        # Inserir novo vínculo
        query = """
        INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma) 
        VALUES (%s, %s, %s) RETURNING id
        """
        result = execute_query(
            query, 
            (vinculo.id_professor, vinculo.id_disciplina, vinculo.id_turma),
            fetch_one=True
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao inserir vínculo"
            )
        
        return {
            "message": "Vínculo criado com sucesso",
            "id": result["id"],
            "dados": {
                "id_professor": vinculo.id_professor,
                "id_disciplina": vinculo.id_disciplina,
                "id_turma": vinculo.id_turma
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar vínculo: {str(e)}"
        )

@app.get("/api/professor_disciplina_turma", response_model=List[Dict])
def listar_vinculos_professor_disciplina_turma(
    id_professor: Optional[str] = Query(None, description="ID do professor"),
    id_disciplina: Optional[str] = Query(None, description="ID da disciplina"),
    id_turma: Optional[str] = Query(None, description="ID da turma")
):
    """Lista todos os vínculos ou filtra por professor, disciplina ou turma."""
    try:
        # Construir a consulta SQL
        query = "SELECT * FROM professor_disciplina_turma"
        params = []
        conditions = []
        
        if id_professor:
            conditions.append("id_professor = %s")
            params.append(id_professor)
        
        if id_disciplina:
            conditions.append("id_disciplina = %s")
            params.append(id_disciplina)
        
        if id_turma:
            conditions.append("id_turma = %s")
            params.append(id_turma)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        # Executar a consulta
        result = execute_query(query, params)
        
        # Formatar o resultado
        vinculos = []
        for vinculo in result:
            vinculos.append({
                "id": vinculo["id"],
                "id_professor": vinculo["id_professor"],
                "id_disciplina": vinculo["id_disciplina"],
                "id_turma": vinculo["id_turma"]
            })
        
        return vinculos
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar vínculos: {str(e)}"
        )

@app.delete("/api/professor_disciplina_turma/{vinculo_id}", status_code=status.HTTP_200_OK)
def excluir_vinculo_professor_disciplina_turma(
    vinculo_id: int = Path(..., description="ID do vínculo a ser excluído")
):
    """Exclui um vínculo específico pelo seu ID."""
    try:
        # Verificar se o vínculo existe
        query = "SELECT id FROM professor_disciplina_turma WHERE id = %s"
        result = execute_query(query, (vinculo_id,), fetch_one=True)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vínculo com ID {vinculo_id} não encontrado"
            )
        
        # Excluir o vínculo
        query = "DELETE FROM professor_disciplina_turma WHERE id = %s"
        execute_query(query, (vinculo_id,), fetch=False)
        
        return {"message": "Vínculo excluído com sucesso"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir vínculo: {str(e)}"
        )

# Endpoints alternativos com nomes mais amigáveis

@app.post("/api/vinculos", response_model=Dict, status_code=status.HTTP_201_CREATED)
def criar_vinculo(vinculo: ProfessorDisciplinaTurmaCreate):
    """Endpoint alternativo para criar vínculo entre professor, disciplina e turma."""
    return criar_vinculo_professor_disciplina_turma(vinculo)

@app.get("/api/vinculos", response_model=List[Dict])
def listar_vinculos(
    id_professor: Optional[str] = Query(None, description="ID do professor"),
    id_disciplina: Optional[str] = Query(None, description="ID da disciplina"),
    id_turma: Optional[str] = Query(None, description="ID da turma")
):
    """Endpoint alternativo para listar vínculos entre professor, disciplina e turma."""
    return listar_vinculos_professor_disciplina_turma(
        id_professor=id_professor,
        id_disciplina=id_disciplina,
        id_turma=id_turma
    )

@app.delete("/api/vinculos/{vinculo_id}", status_code=status.HTTP_200_OK)
def excluir_vinculo(
    vinculo_id: int = Path(..., description="ID do vínculo a ser excluído")
):
    """Endpoint alternativo para excluir vínculo entre professor, disciplina e turma."""
    return excluir_vinculo_professor_disciplina_turma(vinculo_id)

# Chamar a função para garantir que a tabela existe
criar_tabela_vinculos()

# ==============================================================
# Função para criar tabela do Calendário Escolar
# ==============================================================

def criar_tabela_calendario():
    """Cria a tabela calendario_escolar se ela não existir."""
    try:
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        logger.info("Verificando se a tabela calendario_escolar existe...")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("SELECT to_regclass('public.calendario_escolar');")
        result = cursor.fetchone()
        table_exists = result[0] if result else None
        
        if table_exists:
            logger.info("A tabela calendario_escolar já existe.")
        else:
            # Criar a tabela calendario_escolar
            logger.info("Criando tabela calendario_escolar...")
            cursor.execute("""
            CREATE TABLE calendario_escolar (
                id SERIAL PRIMARY KEY,
                titulo VARCHAR(200) NOT NULL,
                descricao TEXT,
                data_inicio DATE NOT NULL,
                data_fim DATE NOT NULL,
                hora_inicio TIME,
                hora_fim TIME,
                tipo_evento VARCHAR(50) NOT NULL DEFAULT 'evento_escolar',
                cor VARCHAR(7) DEFAULT '#3498db',
                recorrente BOOLEAN DEFAULT FALSE,
                frequencia_recorrencia VARCHAR(20),
                observacoes TEXT,
                criado_por VARCHAR(100) NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ativo BOOLEAN DEFAULT TRUE,
                CHECK (data_fim >= data_inicio),
                CHECK (tipo_evento IN ('feriado_nacional', 'feriado_estadual', 'feriado_municipal', 'evento_escolar', 'reuniao', 'conselho_classe', 'formatura', 'festa_junina', 'semana_pedagogica', 'outro'))
            );
            """)
            
            # Adicionar comentário à tabela
            cursor.execute("""
            COMMENT ON TABLE calendario_escolar IS 'Tabela que armazena os eventos do calendário escolar';
            """)
            
            # Criar índices para melhorar a performance
            cursor.execute("""
            CREATE INDEX idx_calendario_data_inicio ON calendario_escolar (data_inicio);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_calendario_data_fim ON calendario_escolar (data_fim);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_calendario_tipo_evento ON calendario_escolar (tipo_evento);
            """)
            
            cursor.execute("""
            CREATE INDEX idx_calendario_ativo ON calendario_escolar (ativo);
            """)
            
            # Inserir alguns eventos padrão (feriados nacionais principais)
            cursor.execute("""
            INSERT INTO calendario_escolar (titulo, data_inicio, data_fim, tipo_evento, cor, criado_por, observacoes) VALUES
            ('Confraternização Universal', '2024-01-01', '2024-01-01', 'feriado_nacional', '#e74c3c', 'Sistema', 'Feriado Nacional'),
            ('Carnaval', '2024-02-12', '2024-02-13', 'feriado_nacional', '#9b59b6', 'Sistema', 'Feriado Nacional'),
            ('Sexta-feira Santa', '2024-03-29', '2024-03-29', 'feriado_nacional', '#8b4513', 'Sistema', 'Feriado Nacional'),
            ('Tiradentes', '2024-04-21', '2024-04-21', 'feriado_nacional', '#27ae60', 'Sistema', 'Feriado Nacional'),
            ('Dia do Trabalhador', '2024-05-01', '2024-05-01', 'feriado_nacional', '#e67e22', 'Sistema', 'Feriado Nacional'),
            ('Independência do Brasil', '2024-09-07', '2024-09-07', 'feriado_nacional', '#f1c40f', 'Sistema', 'Feriado Nacional'),
            ('Nossa Senhora Aparecida', '2024-10-12', '2024-10-12', 'feriado_nacional', '#3498db', 'Sistema', 'Feriado Nacional'),
            ('Finados', '2024-11-02', '2024-11-02', 'feriado_nacional', '#34495e', 'Sistema', 'Feriado Nacional'),
            ('Proclamação da República', '2024-11-15', '2024-11-15', 'feriado_nacional', '#2ecc71', 'Sistema', 'Feriado Nacional'),
            ('Natal', '2024-12-25', '2024-12-25', 'feriado_nacional', '#c0392b', 'Sistema', 'Feriado Nacional');
            """)
            
            logger.info("Tabela calendario_escolar criada com dados iniciais!")
        
        cursor.close()
        conn.close()
        logger.info("Processo de verificação e criação da tabela calendario_escolar concluído!")
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erro ao criar tabela calendario_escolar: {e}")
        print(f"Erro ao criar tabela calendario_escolar: {e}")  # Fallback para print

# ==============================================================
# Endpoints para Calendário Escolar
# ==============================================================

@app.get("/api/calendario/teste")
def teste_calendario():
    """Endpoint de teste para verificar se o calendário está funcionando."""
    try:
        # Garantir que a tabela existe
        criar_tabela_calendario()
        return {
            "status": "success",
            "message": "Calendário escolar está funcionando!",
            "endpoints": [
                "GET /api/calendario/eventos - Listar eventos",
                "POST /api/calendario/eventos - Criar evento",
                "GET /api/calendario/eventos/{id} - Obter evento específico",
                "PUT /api/calendario/eventos/{id} - Atualizar evento",
                "DELETE /api/calendario/eventos/{id} - Deletar evento",
                "GET /api/calendario/tipos-evento - Listar tipos de evento",
                "GET /api/calendario/resumo-mensal/{ano}/{mes} - Resumo mensal"
            ]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Erro no calendário: {str(e)}"
        }

@app.post("/api/calendario/eventos", response_model=EventoCalendario, status_code=status.HTTP_201_CREATED)
def criar_evento_calendario(evento: EventoCalendarioCreate):
    """Cria um novo evento no calendário escolar."""
    print(f"=== CRIANDO EVENTO DO CALENDÁRIO: {evento.titulo} ===")
    try:
        # Garantir que a tabela existe
        criar_tabela_calendario()
        
        # Validar datas
        from datetime import datetime
        try:
            data_inicio = datetime.strptime(evento.data_inicio, '%Y-%m-%d').date()
            data_fim = datetime.strptime(evento.data_fim, '%Y-%m-%d').date()
            
            if data_fim < data_inicio:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A data de fim não pode ser anterior à data de início"
                )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de data inválido. Use YYYY-MM-DD"
            )
        
        # Validar horários se fornecidos
        if evento.hora_inicio:
            try:
                datetime.strptime(evento.hora_inicio, '%H:%M')
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de hora de início inválido. Use HH:MM"
                )
        
        if evento.hora_fim:
            try:
                datetime.strptime(evento.hora_fim, '%H:%M')
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de hora de fim inválido. Use HH:MM"
                )
        
        # Inserir evento no banco
        query = """
        INSERT INTO calendario_escolar (
            titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim,
            tipo_evento, cor, recorrente, frequencia_recorrencia, observacoes, criado_por
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim,
                  tipo_evento, cor, recorrente, frequencia_recorrencia, observacoes,
                  criado_por, data_criacao, ativo
        """
        
        params = (
            evento.titulo,
            evento.descricao,
            evento.data_inicio,
            evento.data_fim,
            evento.hora_inicio,
            evento.hora_fim,
            evento.tipo_evento,
            evento.cor,
            evento.recorrente,
            evento.frequencia_recorrencia,
            evento.observacoes,
            evento.criado_por
        )
        
        result = execute_query(query, params, fetch_one=True)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao criar evento"
            )
        
        # Formatar resposta
        evento_criado = {
            "id": result["id"],
            "titulo": result["titulo"],
            "descricao": result["descricao"],
            "data_inicio": result["data_inicio"].strftime('%Y-%m-%d'),
            "data_fim": result["data_fim"].strftime('%Y-%m-%d'),
            "hora_inicio": result["hora_inicio"].strftime('%H:%M') if result["hora_inicio"] else None,
            "hora_fim": result["hora_fim"].strftime('%H:%M') if result["hora_fim"] else None,
            "tipo_evento": result["tipo_evento"],
            "cor": result["cor"],
            "recorrente": result["recorrente"],
            "frequencia_recorrencia": result["frequencia_recorrencia"],
            "observacoes": result["observacoes"],
            "criado_por": result["criado_por"],
            "data_criacao": result["data_criacao"],
            "ativo": result["ativo"]
        }
        
        print(f"Evento criado com sucesso: {evento_criado}")
        return evento_criado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao criar evento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar evento: {str(e)}"
        )
    finally:
        print("=== FINALIZANDO CRIAÇÃO DE EVENTO ===")

@app.get("/api/calendario/eventos", response_model=List[EventoCalendario])
def listar_eventos_calendario(
    mes: Optional[int] = Query(None, description="Mês (1-12)"),
    ano: Optional[int] = Query(None, description="Ano"),
    tipo_evento: Optional[str] = Query(None, description="Tipo do evento"),
    data_inicio: Optional[str] = Query(None, description="Data de início do período (YYYY-MM-DD)"),
    data_fim: Optional[str] = Query(None, description="Data de fim do período (YYYY-MM-DD)")
):
    """Lista eventos do calendário com filtros opcionais."""
    print(f"=== LISTANDO EVENTOS DO CALENDÁRIO ===")
    try:
        # Garantir que a tabela existe
        criar_tabela_calendario()
        
        # Construir query base
        query = """
        SELECT id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim,
               tipo_evento, cor, recorrente, frequencia_recorrencia, observacoes,
               criado_por, data_criacao, ativo
        FROM calendario_escolar
        WHERE ativo = TRUE
        """
        params = []
        
        # Adicionar filtros
        if mes and ano:
            query += " AND EXTRACT(MONTH FROM data_inicio) = %s AND EXTRACT(YEAR FROM data_inicio) = %s"
            params.extend([mes, ano])
        elif ano:
            query += " AND EXTRACT(YEAR FROM data_inicio) = %s"
            params.append(ano)
        
        if tipo_evento:
            query += " AND tipo_evento = %s"
            params.append(tipo_evento)
        
        if data_inicio and data_fim:
            query += " AND data_inicio >= %s AND data_fim <= %s"
            params.extend([data_inicio, data_fim])
        elif data_inicio:
            query += " AND data_inicio >= %s"
            params.append(data_inicio)
        elif data_fim:
            query += " AND data_fim <= %s"
            params.append(data_fim)
        
        # Ordenar por data
        query += " ORDER BY data_inicio ASC, hora_inicio ASC"
        
        results = execute_query(query, params)
        
        if not results:
            return []
        
        # Formatar resultados
        eventos = []
        for row in results:
            evento = {
                "id": row["id"],
                "titulo": row["titulo"],
                "descricao": row["descricao"],
                "data_inicio": row["data_inicio"].strftime('%Y-%m-%d'),
                "data_fim": row["data_fim"].strftime('%Y-%m-%d'),
                "hora_inicio": row["hora_inicio"].strftime('%H:%M') if row["hora_inicio"] else None,
                "hora_fim": row["hora_fim"].strftime('%H:%M') if row["hora_fim"] else None,
                "tipo_evento": row["tipo_evento"],
                "cor": row["cor"],
                "recorrente": row["recorrente"],
                "frequencia_recorrencia": row["frequencia_recorrencia"],
                "observacoes": row["observacoes"],
                "criado_por": row["criado_por"],
                "data_criacao": row["data_criacao"],
                "ativo": row["ativo"]
            }
            eventos.append(evento)
        
        print(f"Encontrados {len(eventos)} eventos")
        return eventos
        
    except Exception as e:
        print(f"ERRO ao listar eventos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar eventos: {str(e)}"
        )
    finally:
        print("=== FINALIZANDO LISTAGEM DE EVENTOS ===")

@app.get("/api/calendario/eventos/{evento_id}", response_model=EventoCalendario)
def obter_evento_calendario(evento_id: int = Path(..., description="ID do evento")):
    """Obtém um evento específico do calendário."""
    print(f"=== OBTENDO EVENTO {evento_id} ===")
    try:
        query = """
        SELECT id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim,
               tipo_evento, cor, recorrente, frequencia_recorrencia, observacoes,
               criado_por, data_criacao, ativo
        FROM calendario_escolar
        WHERE id = %s AND ativo = TRUE
        """
        
        result = execute_query(query, (evento_id,), fetch_one=True)
        
        if not result:
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        # Formatar resposta
        evento = {
            "id": result["id"],
            "titulo": result["titulo"],
            "descricao": result["descricao"],
            "data_inicio": result["data_inicio"].strftime('%Y-%m-%d'),
            "data_fim": result["data_fim"].strftime('%Y-%m-%d'),
            "hora_inicio": result["hora_inicio"].strftime('%H:%M') if result["hora_inicio"] else None,
            "hora_fim": result["hora_fim"].strftime('%H:%M') if result["hora_fim"] else None,
            "tipo_evento": result["tipo_evento"],
            "cor": result["cor"],
            "recorrente": result["recorrente"],
            "frequencia_recorrencia": result["frequencia_recorrencia"],
            "observacoes": result["observacoes"],
            "criado_por": result["criado_por"],
            "data_criacao": result["data_criacao"],
            "ativo": result["ativo"]
        }
        
        return evento
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao obter evento {evento_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter evento: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO OBTENÇÃO DO EVENTO {evento_id} ===")

@app.put("/api/calendario/eventos/{evento_id}", response_model=EventoCalendario)
def atualizar_evento_calendario(
    evento_id: int = Path(..., description="ID do evento"),
    evento: EventoCalendarioUpdate = Body(...)
):
    """Atualiza um evento do calendário."""
    print(f"=== ATUALIZANDO EVENTO {evento_id} ===")
    try:
        # Verificar se o evento existe
        check_query = "SELECT id FROM calendario_escolar WHERE id = %s AND ativo = TRUE"
        existing = execute_query(check_query, (evento_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        # Construir campos para atualização
        updates = {}
        if evento.titulo is not None:
            updates["titulo"] = evento.titulo
        if evento.descricao is not None:
            updates["descricao"] = evento.descricao
        if evento.data_inicio is not None:
            # Validar formato de data
            try:
                datetime.strptime(evento.data_inicio, '%Y-%m-%d')
                updates["data_inicio"] = evento.data_inicio
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de data de início inválido. Use YYYY-MM-DD"
                )
        if evento.data_fim is not None:
            try:
                datetime.strptime(evento.data_fim, '%Y-%m-%d')
                updates["data_fim"] = evento.data_fim
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Formato de data de fim inválido. Use YYYY-MM-DD"
                )
        if evento.hora_inicio is not None:
            if evento.hora_inicio:
                try:
                    datetime.strptime(evento.hora_inicio, '%H:%M')
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Formato de hora de início inválido. Use HH:MM"
                    )
            updates["hora_inicio"] = evento.hora_inicio
        if evento.hora_fim is not None:
            if evento.hora_fim:
                try:
                    datetime.strptime(evento.hora_fim, '%H:%M')
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Formato de hora de fim inválido. Use HH:MM"
                    )
            updates["hora_fim"] = evento.hora_fim
        if evento.tipo_evento is not None:
            updates["tipo_evento"] = evento.tipo_evento
        if evento.cor is not None:
            updates["cor"] = evento.cor
        if evento.recorrente is not None:
            updates["recorrente"] = evento.recorrente
        if evento.frequencia_recorrencia is not None:
            updates["frequencia_recorrencia"] = evento.frequencia_recorrencia
        if evento.observacoes is not None:
            updates["observacoes"] = evento.observacoes
        if evento.ativo is not None:
            updates["ativo"] = evento.ativo
        
        if not updates:
            # Se não há nada para atualizar, retornar o evento atual
            return obter_evento_calendario(evento_id)
        
        # Construir query de atualização
        set_clause = ", ".join(f"{field} = %s" for field in updates.keys())
        query = f"""
        UPDATE calendario_escolar 
        SET {set_clause}
        WHERE id = %s
        RETURNING id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim,
                  tipo_evento, cor, recorrente, frequencia_recorrencia, observacoes,
                  criado_por, data_criacao, ativo
        """
        
        params = list(updates.values())
        params.append(evento_id)
        
        result = execute_query(query, params, fetch_one=True)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Falha ao atualizar evento"
            )
        
        # Formatar resposta
        evento_atualizado = {
            "id": result["id"],
            "titulo": result["titulo"],
            "descricao": result["descricao"],
            "data_inicio": result["data_inicio"].strftime('%Y-%m-%d'),
            "data_fim": result["data_fim"].strftime('%Y-%m-%d'),
            "hora_inicio": result["hora_inicio"].strftime('%H:%M') if result["hora_inicio"] else None,
            "hora_fim": result["hora_fim"].strftime('%H:%M') if result["hora_fim"] else None,
            "tipo_evento": result["tipo_evento"],
            "cor": result["cor"],
            "recorrente": result["recorrente"],
            "frequencia_recorrencia": result["frequencia_recorrencia"],
            "observacoes": result["observacoes"],
            "criado_por": result["criado_por"],
            "data_criacao": result["data_criacao"],
            "ativo": result["ativo"]
        }
        
        print(f"Evento atualizado: {evento_atualizado}")
        return evento_atualizado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao atualizar evento {evento_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar evento: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO ATUALIZAÇÃO DO EVENTO {evento_id} ===")

@app.delete("/api/calendario/eventos/{evento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_evento_calendario(evento_id: int = Path(..., description="ID do evento")):
    """Deleta (inativa) um evento do calendário."""
    print(f"=== DELETANDO EVENTO {evento_id} ===")
    try:
        # Verificar se o evento existe
        check_query = "SELECT id FROM calendario_escolar WHERE id = %s AND ativo = TRUE"
        existing = execute_query(check_query, (evento_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(status_code=404, detail="Evento não encontrado")
        
        # Soft delete - marcar como inativo
        query = "UPDATE calendario_escolar SET ativo = FALSE WHERE id = %s"
        execute_query(query, (evento_id,), fetch=False)
        
        print(f"Evento {evento_id} deletado com sucesso")
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERRO ao deletar evento {evento_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar evento: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO DELEÇÃO DO EVENTO {evento_id} ===")

@app.get("/api/calendario/tipos-evento")
def listar_tipos_evento():
    """Lista os tipos de evento disponíveis."""
    return {
        "tipos": [
            {"valor": "feriado_nacional", "label": "Feriado Nacional"},
            {"valor": "feriado_estadual", "label": "Feriado Estadual"},
            {"valor": "feriado_municipal", "label": "Feriado Municipal"},
            {"valor": "evento_escolar", "label": "Evento Escolar"},
            {"valor": "reuniao", "label": "Reunião"},
            {"valor": "conselho_classe", "label": "Conselho de Classe"},
            {"valor": "formatura", "label": "Formatura"},
            {"valor": "festa_junina", "label": "Festa Junina"},
            {"valor": "semana_pedagogica", "label": "Semana Pedagógica"},
            {"valor": "outro", "label": "Outro"}
        ]
    }

@app.get("/api/calendario/resumo-mensal/{ano}/{mes}")
def resumo_mensal_calendario(
    ano: int = Path(..., description="Ano"),
    mes: int = Path(..., ge=1, le=12, description="Mês (1-12)")
):
    """Retorna um resumo dos eventos do mês especificado."""
    print(f"=== RESUMO MENSAL DO CALENDÁRIO {mes}/{ano} ===")
    try:
        # Garantir que a tabela existe
        criar_tabela_calendario()
        
        # Buscar eventos do mês
        query = """
        SELECT COUNT(*) as total_eventos,
               tipo_evento,
               COUNT(*) as quantidade
        FROM calendario_escolar
        WHERE EXTRACT(MONTH FROM data_inicio) = %s 
        AND EXTRACT(YEAR FROM data_inicio) = %s
        AND ativo = TRUE
        GROUP BY tipo_evento
        ORDER BY quantidade DESC
        """
        
        results = execute_query(query, (mes, ano))
        
        # Contar total de eventos
        total_query = """
        SELECT COUNT(*) as total
        FROM calendario_escolar
        WHERE EXTRACT(MONTH FROM data_inicio) = %s 
        AND EXTRACT(YEAR FROM data_inicio) = %s
        AND ativo = TRUE
        """
        
        total_result = execute_query(total_query, (mes, ano), fetch_one=True)
        total_eventos = total_result["total"] if total_result else 0
        
        # Formatar resposta
        resumo = {
            "ano": ano,
            "mes": mes,
            "total_eventos": total_eventos,
            "por_tipo": []
        }
        
        for row in results:
            resumo["por_tipo"].append({
                "tipo": row["tipo_evento"],
                "quantidade": row["quantidade"]
            })
        
        return resumo
        
    except Exception as e:
        print(f"ERRO ao gerar resumo mensal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar resumo mensal: {str(e)}"
        )
    finally:
        print(f"=== FINALIZANDO RESUMO MENSAL {mes}/{ano} ===")

# Chamar a função para garantir que a tabela do calendário existe
criar_tabela_calendario()

# Endpoint para calcular médias de todas as notas
@app.post("/api/calcular-medias", status_code=status.HTTP_200_OK)
def calcular_medias():
    """Recalcula as médias finais de todas as notas"""
    try:
        # Atualizar todas as médias usando a fórmula correta com casts explícitos para PostgreSQL
        query = """
            UPDATE nota
            SET media = CASE
                WHEN nota_mensal IS NOT NULL AND nota_bimestral IS NOT NULL THEN
                    CASE 
                        WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                            ROUND(((nota_mensal::numeric + nota_bimestral::numeric) / 2 + recuperacao::numeric) / 2, 1)
                        ELSE
                            ROUND((nota_mensal::numeric + nota_bimestral::numeric) / 2, 1)
                    END
                WHEN nota_mensal IS NOT NULL THEN
                    CASE 
                        WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                            ROUND((nota_mensal::numeric + recuperacao::numeric) / 2, 1)
                        ELSE
                            nota_mensal
                    END
                WHEN nota_bimestral IS NOT NULL THEN
                    CASE 
                        WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                            ROUND((nota_bimestral::numeric + recuperacao::numeric) / 2, 1)
                        ELSE
                            nota_bimestral
                    END
                ELSE
                    0
            END
            WHERE nota_mensal IS NOT NULL OR nota_bimestral IS NOT NULL
        """
        
        result = execute_query(query, fetch=False)
        return {"message": "Médias recalculadas com sucesso!"}
        
    except Exception as e:
        print(f"ERRO ao calcular médias: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular médias: {str(e)}"
        )

# Endpoint para gerar boletim de médias
@app.get("/api/boletim-medias")
def gerar_boletim_medias(
    ano: int = Query(..., description="Ano letivo"),
    turma_id: Optional[str] = Query(None, description="ID da turma (opcional)"),
    disciplina_id: Optional[str] = Query(None, description="ID da disciplina (opcional)"),
    aluno_id: Optional[str] = Query(None, description="ID do aluno (opcional)")
):
    """Gera boletim com médias bimestrais e situação final dos alunos"""
    try:
        # Query base para buscar notas com informações completas
        base_query = """
            SELECT 
                n.id_aluno,
                a.nome_aluno,
                n.id_disciplina,
                d.nome_disciplina,
                n.id_turma,
                t.serie,
                n.bimestre,
                n.nota_mensal,
                n.nota_bimestral,
                n.recuperacao,
                n.frequencia,
                n.media,
                n.ano
            FROM nota n
            JOIN aluno a ON n.id_aluno = a.id_aluno
            JOIN disciplina d ON n.id_disciplina = d.id_disciplina
            JOIN turma t ON n.id_turma = t.id_turma
            WHERE n.ano = %s
        """
        
        params = [ano]
        
        # Adicionar filtros opcionais
        if turma_id:
            base_query += " AND n.id_turma = %s"
            params.append(turma_id)
        
        if disciplina_id:
            base_query += " AND n.id_disciplina = %s"
            params.append(disciplina_id)
        
        if aluno_id:
            base_query += " AND n.id_aluno = %s"
            params.append(aluno_id)
        
        base_query += " ORDER BY a.nome_aluno, d.nome_disciplina, n.bimestre"
        
        notas = execute_query(base_query, params)
        
        # Organizar dados por aluno e disciplina
        boletim = {}
        
        for nota in notas:
            aluno_id = nota['id_aluno']
            disciplina_id = nota['id_disciplina']
            
            # Inicializar estrutura do aluno se não existir
            if aluno_id not in boletim:
                boletim[aluno_id] = {
                    'id_aluno': aluno_id,
                    'nome_aluno': nota['nome_aluno'],
                    'id_turma': nota['id_turma'],
                    'serie': nota['serie'],
                    'disciplinas': {}
                }
            
            # Inicializar disciplina se não existir
            if disciplina_id not in boletim[aluno_id]['disciplinas']:
                boletim[aluno_id]['disciplinas'][disciplina_id] = {
                    'id_disciplina': disciplina_id,
                    'nome_disciplina': nota['nome_disciplina'],
                    'notas_bimestrais': {},
                    'media_anual': 0,
                    'situacao': 'Sem notas'
                }
            
            # Adicionar nota do bimestre
            bimestre = nota['bimestre']
            boletim[aluno_id]['disciplinas'][disciplina_id]['notas_bimestrais'][bimestre] = {
                'nota_mensal': nota['nota_mensal'],
                'nota_bimestral': nota['nota_bimestral'],
                'recuperacao': nota['recuperacao'],
                'frequencia': nota['frequencia'],
                'media_bimestral': nota['media']
            }
        
        # Calcular médias anuais e situações
        for aluno_id in boletim:
            for disciplina_id in boletim[aluno_id]['disciplinas']:
                disciplina = boletim[aluno_id]['disciplinas'][disciplina_id]
                notas_bimestrais = disciplina['notas_bimestrais']
                
                # Calcular média anual (soma das médias bimestrais / 4)
                medias_validas = []
                for bim in range(1, 5):  # Bimestres 1 a 4
                    if bim in notas_bimestrais and notas_bimestrais[bim]['media_bimestral'] is not None:
                        medias_validas.append(float(notas_bimestrais[bim]['media_bimestral']))
                
                if medias_validas:
                    # Se tem menos de 4 bimestres, calcular com os disponíveis
                    if len(medias_validas) == 4:
                        media_anual = sum(medias_validas) / 4
                    else:
                        # Estimar média anual com base nos bimestres disponíveis
                        media_anual = sum(medias_validas) / len(medias_validas)
                    
                    disciplina['media_anual'] = round(media_anual, 1)
                    
                    # Determinar situação
                    if media_anual >= 6.0:
                        disciplina['situacao'] = 'Aprovado'
                    elif media_anual >= 4.0:
                        disciplina['situacao'] = 'Recuperação Final'
                    else:
                        disciplina['situacao'] = 'Reprovado'
                else:
                    disciplina['media_anual'] = 0
                    disciplina['situacao'] = 'Sem notas'
        
        # Converter para lista para facilitar o uso no frontend
        resultado = []
        for aluno_id, dados_aluno in boletim.items():
            disciplinas_lista = []
            for disciplina_id, dados_disciplina in dados_aluno['disciplinas'].items():
                disciplinas_lista.append(dados_disciplina)
            
            dados_aluno['disciplinas'] = disciplinas_lista
            resultado.append(dados_aluno)
        
        return {
            'ano': ano,
            'total_alunos': len(resultado),
            'boletim': resultado
        }
        
    except Exception as e:
        print(f"ERRO ao gerar boletim: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar boletim: {str(e)}"
        )

# ==============================================================
# ENDPOINTS PARA ESCOLAS
# ==============================================================

@app.get("/api/escolas/", response_model=List[Escola])
def read_escolas():
    """
    Lista todas as escolas cadastradas.
    """
    try:
        query = """
            SELECT id_escola, codigo_inep, cnpj, razao_social, nome_fantasia, logo,
                   cep, logradouro, numero, complemento, bairro, cidade, uf,
                   telefone_principal, telefone_secundario, email_principal,
                   dependencia_administrativa, situacao_funcionamento, localizacao, ato_autorizacao,
                   gestor_nome, gestor_cpf, gestor_email,
                   ativo, data_cadastro, data_atualizacao
            FROM escolas
            ORDER BY razao_social
        """
        
        escolas = execute_query(query)
        
        if not escolas:
            return []
        
        return [
            {
                "id_escola": escola["id_escola"],
                "codigo_inep": escola["codigo_inep"],
                "cnpj": escola["cnpj"],
                "razao_social": escola["razao_social"],
                "nome_fantasia": escola["nome_fantasia"],
                "logo": escola["logo"],
                "cep": escola["cep"],
                "logradouro": escola["logradouro"],
                "numero": escola["numero"],
                "complemento": escola["complemento"],
                "bairro": escola["bairro"],
                "cidade": escola["cidade"],
                "uf": escola["uf"],
                "telefone_principal": escola["telefone_principal"],
                "telefone_secundario": escola["telefone_secundario"],
                "email_principal": escola["email_principal"],
                "dependencia_administrativa": escola["dependencia_administrativa"],
                "situacao_funcionamento": escola["situacao_funcionamento"],
                "localizacao": escola["localizacao"],
                "ato_autorizacao": escola["ato_autorizacao"],
                "gestor_nome": escola["gestor_nome"],
                "gestor_cpf": escola["gestor_cpf"],
                "gestor_email": escola["gestor_email"],
                "ativo": escola["ativo"],
                "data_cadastro": escola["data_cadastro"],
                "data_atualizacao": escola["data_atualizacao"]
            }
            for escola in escolas
        ]
        
    except Exception as e:
        print(f"Erro ao buscar escolas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar escolas: {str(e)}"
        )

@app.get("/api/escolas/{escola_id}", response_model=Escola)
def read_escola(escola_id: int = Path(..., description="ID da escola")):
    """
    Busca uma escola específica por ID.
    """
    try:
        query = """
            SELECT id_escola, codigo_inep, cnpj, razao_social, nome_fantasia, logo,
                   cep, logradouro, numero, complemento, bairro, cidade, uf,
                   telefone_principal, telefone_secundario, email_principal,
                   dependencia_administrativa, situacao_funcionamento, localizacao, ato_autorizacao,
                   gestor_nome, gestor_cpf, gestor_email,
                   ativo, data_cadastro, data_atualizacao
            FROM escolas
            WHERE id_escola = %s
        """
        
        escola = execute_query(query, (escola_id,), fetch_one=True)
        
        if not escola:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Escola com ID {escola_id} não encontrada"
            )
        
        return {
            "id_escola": escola["id_escola"],
            "codigo_inep": escola["codigo_inep"],
            "cnpj": escola["cnpj"],
            "razao_social": escola["razao_social"],
            "nome_fantasia": escola["nome_fantasia"],
            "logo": escola["logo"],
            "cep": escola["cep"],
            "logradouro": escola["logradouro"],
            "numero": escola["numero"],
            "complemento": escola["complemento"],
            "bairro": escola["bairro"],
            "cidade": escola["cidade"],
            "uf": escola["uf"],
            "telefone_principal": escola["telefone_principal"],
            "telefone_secundario": escola["telefone_secundario"],
            "email_principal": escola["email_principal"],
            "dependencia_administrativa": escola["dependencia_administrativa"],
            "situacao_funcionamento": escola["situacao_funcionamento"],
            "localizacao": escola["localizacao"],
            "ato_autorizacao": escola["ato_autorizacao"],
            "gestor_nome": escola["gestor_nome"],
            "gestor_cpf": escola["gestor_cpf"],
            "gestor_email": escola["gestor_email"],
            "ativo": escola["ativo"],
            "data_cadastro": escola["data_cadastro"],
            "data_atualizacao": escola["data_atualizacao"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar escola: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar escola: {str(e)}"
        )

@app.post("/api/escolas/", response_model=Escola, status_code=status.HTTP_201_CREATED)
def create_escola(escola: EscolaCreate):
    """
    Cria uma nova escola.
    """
    try:
        # Verificar se já existe escola com o mesmo código INEP
        check_query = "SELECT id_escola FROM escolas WHERE codigo_inep = %s"
        existing = execute_query(check_query, (escola.codigo_inep,), fetch_one=True)
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Já existe uma escola com o código INEP {escola.codigo_inep}"
            )
        
        # Inserir nova escola
        insert_query = """
            INSERT INTO escolas (
                codigo_inep, cnpj, razao_social, nome_fantasia, logo,
                cep, logradouro, numero, complemento, bairro, cidade, uf,
                telefone_principal, telefone_secundario, email_principal,
                dependencia_administrativa, situacao_funcionamento, localizacao, ato_autorizacao,
                gestor_nome, gestor_cpf, gestor_email,
                data_cadastro, data_atualizacao
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING id_escola, data_cadastro, data_atualizacao
        """
        
        params = (
            escola.codigo_inep, escola.cnpj, escola.razao_social, escola.nome_fantasia, escola.logo,
            escola.cep, escola.logradouro, escola.numero, escola.complemento, escola.bairro, escola.cidade, escola.uf,
            escola.telefone_principal, escola.telefone_secundario, escola.email_principal,
            escola.dependencia_administrativa, escola.situacao_funcionamento, escola.localizacao, escola.ato_autorizacao,
            escola.gestor_nome, escola.gestor_cpf, escola.gestor_email
        )
        
        result = execute_query(insert_query, params, fetch_one=True)
        
        return {
            "id_escola": result["id_escola"],
            "codigo_inep": escola.codigo_inep,
            "cnpj": escola.cnpj,
            "razao_social": escola.razao_social,
            "nome_fantasia": escola.nome_fantasia,
            "logo": escola.logo,
            "cep": escola.cep,
            "logradouro": escola.logradouro,
            "numero": escola.numero,
            "complemento": escola.complemento,
            "bairro": escola.bairro,
            "cidade": escola.cidade,
            "uf": escola.uf,
            "telefone_principal": escola.telefone_principal,
            "telefone_secundario": escola.telefone_secundario,
            "email_principal": escola.email_principal,
            "dependencia_administrativa": escola.dependencia_administrativa,
            "situacao_funcionamento": escola.situacao_funcionamento,
            "localizacao": escola.localizacao,
            "ato_autorizacao": escola.ato_autorizacao,
            "gestor_nome": escola.gestor_nome,
            "gestor_cpf": escola.gestor_cpf,
            "gestor_email": escola.gestor_email,
            "ativo": True,
            "data_cadastro": result["data_cadastro"],
            "data_atualizacao": result["data_atualizacao"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao criar escola: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar escola: {str(e)}"
        )

@app.put("/api/escolas/{escola_id}", response_model=Escola)
def update_escola(
    escola_id: int = Path(..., description="ID da escola"),
    escola: EscolaUpdate = Body(...)
):
    """
    Atualiza uma escola existente.
    """
    try:
        # Verificar se a escola existe
        check_query = "SELECT id_escola FROM escolas WHERE id_escola = %s"
        existing = execute_query(check_query, (escola_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Escola com ID {escola_id} não encontrada"
            )
        
        # Verificar se código INEP não está sendo usado por outra escola
        if escola.codigo_inep:
            inep_check_query = "SELECT id_escola FROM escolas WHERE codigo_inep = %s AND id_escola != %s"
            inep_existing = execute_query(inep_check_query, (escola.codigo_inep, escola_id), fetch_one=True)
            
            if inep_existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Código INEP {escola.codigo_inep} já está sendo usado por outra escola"
                )
        
        # Construir query de atualização dinamicamente
        update_fields = []
        params = []
        
        if escola.codigo_inep is not None:
            update_fields.append("codigo_inep = %s")
            params.append(escola.codigo_inep)
        if escola.cnpj is not None:
            update_fields.append("cnpj = %s")
            params.append(escola.cnpj)
        if escola.razao_social is not None:
            update_fields.append("razao_social = %s")
            params.append(escola.razao_social)
        if escola.nome_fantasia is not None:
            update_fields.append("nome_fantasia = %s")
            params.append(escola.nome_fantasia)
        if escola.logo is not None:
            update_fields.append("logo = %s")
            params.append(escola.logo)
        if escola.cep is not None:
            update_fields.append("cep = %s")
            params.append(escola.cep)
        if escola.logradouro is not None:
            update_fields.append("logradouro = %s")
            params.append(escola.logradouro)
        if escola.numero is not None:
            update_fields.append("numero = %s")
            params.append(escola.numero)
        if escola.complemento is not None:
            update_fields.append("complemento = %s")
            params.append(escola.complemento)
        if escola.bairro is not None:
            update_fields.append("bairro = %s")
            params.append(escola.bairro)
        if escola.cidade is not None:
            update_fields.append("cidade = %s")
            params.append(escola.cidade)
        if escola.uf is not None:
            update_fields.append("uf = %s")
            params.append(escola.uf)
        if escola.telefone_principal is not None:
            update_fields.append("telefone_principal = %s")
            params.append(escola.telefone_principal)
        if escola.telefone_secundario is not None:
            update_fields.append("telefone_secundario = %s")
            params.append(escola.telefone_secundario)
        if escola.email_principal is not None:
            update_fields.append("email_principal = %s")
            params.append(escola.email_principal)
        if escola.dependencia_administrativa is not None:
            update_fields.append("dependencia_administrativa = %s")
            params.append(escola.dependencia_administrativa)
        if escola.situacao_funcionamento is not None:
            update_fields.append("situacao_funcionamento = %s")
            params.append(escola.situacao_funcionamento)
        if escola.localizacao is not None:
            update_fields.append("localizacao = %s")
            params.append(escola.localizacao)
        if escola.ato_autorizacao is not None:
            update_fields.append("ato_autorizacao = %s")
            params.append(escola.ato_autorizacao)
        if escola.gestor_nome is not None:
            update_fields.append("gestor_nome = %s")
            params.append(escola.gestor_nome)
        if escola.gestor_cpf is not None:
            update_fields.append("gestor_cpf = %s")
            params.append(escola.gestor_cpf)
        if escola.gestor_email is not None:
            update_fields.append("gestor_email = %s")
            params.append(escola.gestor_email)
        if escola.ativo is not None:
            update_fields.append("ativo = %s")
            params.append(escola.ativo)
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum campo válido fornecido para atualização"
            )
        
        # Sempre atualizar data_atualizacao
        update_fields.append("data_atualizacao = CURRENT_TIMESTAMP")
        params.append(escola_id)
        
        update_query = f"""
            UPDATE escolas 
            SET {', '.join(update_fields)}
            WHERE id_escola = %s
            RETURNING id_escola, codigo_inep, cnpj, razao_social, nome_fantasia, logo,
                      cep, logradouro, numero, complemento, bairro, cidade, uf,
                      telefone_principal, telefone_secundario, email_principal,
                      dependencia_administrativa, situacao_funcionamento, localizacao, ato_autorizacao,
                      gestor_nome, gestor_cpf, gestor_email,
                      ativo, data_cadastro, data_atualizacao
        """
        
        result = execute_query(update_query, params, fetch_one=True)
        
        return {
            "id_escola": result["id_escola"],
            "codigo_inep": result["codigo_inep"],
            "cnpj": result["cnpj"],
            "razao_social": result["razao_social"],
            "nome_fantasia": result["nome_fantasia"],
            "logo": result["logo"],
            "cep": result["cep"],
            "logradouro": result["logradouro"],
            "numero": result["numero"],
            "complemento": result["complemento"],
            "bairro": result["bairro"],
            "cidade": result["cidade"],
            "uf": result["uf"],
            "telefone_principal": result["telefone_principal"],
            "telefone_secundario": result["telefone_secundario"],
            "email_principal": result["email_principal"],
            "dependencia_administrativa": result["dependencia_administrativa"],
            "situacao_funcionamento": result["situacao_funcionamento"],
            "localizacao": result["localizacao"],
            "ato_autorizacao": result["ato_autorizacao"],
            "gestor_nome": result["gestor_nome"],
            "gestor_cpf": result["gestor_cpf"],
            "gestor_email": result["gestor_email"],
            "ativo": result["ativo"],
            "data_cadastro": result["data_cadastro"],
            "data_atualizacao": result["data_atualizacao"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao atualizar escola: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar escola: {str(e)}"
        )

@app.delete("/api/escolas/{escola_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_escola(escola_id: int = Path(..., description="ID da escola")):
    """
    Exclui uma escola.
    """
    try:
        # Verificar se a escola existe
        check_query = "SELECT id_escola FROM escolas WHERE id_escola = %s"
        existing = execute_query(check_query, (escola_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Escola com ID {escola_id} não encontrada"
            )
        
        # Excluir escola
        delete_query = "DELETE FROM escolas WHERE id_escola = %s"
        execute_query(delete_query, (escola_id,), fetch=False)
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao excluir escola: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao excluir escola: {str(e)}"
        )

@app.patch("/api/escolas/{escola_id}/status", response_model=Escola)
def toggle_escola_status(
    escola_id: int = Path(..., description="ID da escola"),
    ativo: bool = Body(..., embed=True, description="Status ativo da escola")
):
    """
    Altera o status ativo/inativo de uma escola.
    """
    try:
        # Verificar se a escola existe
        check_query = "SELECT id_escola FROM escolas WHERE id_escola = %s"
        existing = execute_query(check_query, (escola_id,), fetch_one=True)
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Escola com ID {escola_id} não encontrada"
            )
        
        # Atualizar status
        update_query = """
            UPDATE escolas 
            SET ativo = %s, data_atualizacao = CURRENT_TIMESTAMP
            WHERE id_escola = %s
            RETURNING id_escola, codigo_inep, cnpj, razao_social, nome_fantasia, logo,
                      cep, logradouro, numero, complemento, bairro, cidade, uf,
                      telefone_principal, telefone_secundario, email_principal,
                      dependencia_administrativa, situacao_funcionamento, localizacao, ato_autorizacao,
                      gestor_nome, gestor_cpf, gestor_email,
                      ativo, data_cadastro, data_atualizacao
        """
        
        result = execute_query(update_query, (ativo, escola_id), fetch_one=True)
        
        return {
            "id_escola": result["id_escola"],
            "codigo_inep": result["codigo_inep"],
            "cnpj": result["cnpj"],
            "razao_social": result["razao_social"],
            "nome_fantasia": result["nome_fantasia"],
            "logo": result["logo"],
            "cep": result["cep"],
            "logradouro": result["logradouro"],
            "numero": result["numero"],
            "complemento": result["complemento"],
            "bairro": result["bairro"],
            "cidade": result["cidade"],
            "uf": result["uf"],
            "telefone_principal": result["telefone_principal"],
            "telefone_secundario": result["telefone_secundario"],
            "email_principal": result["email_principal"],
            "dependencia_administrativa": result["dependencia_administrativa"],
            "situacao_funcionamento": result["situacao_funcionamento"],
            "localizacao": result["localizacao"],
            "ato_autorizacao": result["ato_autorizacao"],
            "gestor_nome": result["gestor_nome"],
            "gestor_cpf": result["gestor_cpf"],
            "gestor_email": result["gestor_email"],
            "ativo": result["ativo"],
            "data_cadastro": result["data_cadastro"],
            "data_atualizacao": result["data_atualizacao"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao alterar status da escola: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao alterar status da escola: {str(e)}"
        )

@app.get("/api/escolas/filtro/", response_model=List[Escola])
def read_escolas_filtro(
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo (true/false)"),
    codigo_inep: Optional[str] = Query(None, description="Filtrar por código INEP"),
    cidade: Optional[str] = Query(None, description="Filtrar por cidade"),
    uf: Optional[str] = Query(None, description="Filtrar por UF"),
    dependencia_administrativa: Optional[str] = Query(None, description="Filtrar por dependência administrativa"),
    situacao_funcionamento: Optional[str] = Query(None, description="Filtrar por situação de funcionamento"),
    localizacao: Optional[str] = Query(None, description="Filtrar por localização (Urbana/Rural)")
):
    """
    Lista escolas com filtros opcionais.
    """
    try:
        base_query = """
            SELECT id_escola, codigo_inep, cnpj, razao_social, nome_fantasia, logo,
                   cep, logradouro, numero, complemento, bairro, cidade, uf,
                   telefone_principal, telefone_secundario, email_principal,
                   dependencia_administrativa, situacao_funcionamento, localizacao, ato_autorizacao,
                   gestor_nome, gestor_cpf, gestor_email,
                   ativo, data_cadastro, data_atualizacao
            FROM escolas
            WHERE 1=1
        """
        
        params = []
        
        if ativo is not None:
            base_query += " AND ativo = %s"
            params.append(ativo)
        
        if codigo_inep:
            base_query += " AND codigo_inep ILIKE %s"
            params.append(f"%{codigo_inep}%")
        
        if cidade:
            base_query += " AND cidade ILIKE %s"
            params.append(f"%{cidade}%")
        
        if uf:
            base_query += " AND uf ILIKE %s"
            params.append(f"%{uf}%")
        
        if dependencia_administrativa:
            base_query += " AND dependencia_administrativa ILIKE %s"
            params.append(f"%{dependencia_administrativa}%")
        
        if situacao_funcionamento:
            base_query += " AND situacao_funcionamento ILIKE %s"
            params.append(f"%{situacao_funcionamento}%")
        
        if localizacao:
            base_query += " AND localizacao ILIKE %s"
            params.append(f"%{localizacao}%")
        
        base_query += " ORDER BY razao_social"
        
        escolas = execute_query(base_query, params if params else None)
        
        if not escolas:
            return []
        
        return [
            {
                "id_escola": escola["id_escola"],
                "codigo_inep": escola["codigo_inep"],
                "cnpj": escola["cnpj"],
                "razao_social": escola["razao_social"],
                "nome_fantasia": escola["nome_fantasia"],
                "logo": escola["logo"],
                "cep": escola["cep"],
                "logradouro": escola["logradouro"],
                "numero": escola["numero"],
                "complemento": escola["complemento"],
                "bairro": escola["bairro"],
                "cidade": escola["cidade"],
                "uf": escola["uf"],
                "telefone_principal": escola["telefone_principal"],
                "telefone_secundario": escola["telefone_secundario"],
                "email_principal": escola["email_principal"],
                "dependencia_administrativa": escola["dependencia_administrativa"],
                "situacao_funcionamento": escola["situacao_funcionamento"],
                "localizacao": escola["localizacao"],
                "ato_autorizacao": escola["ato_autorizacao"],
                "gestor_nome": escola["gestor_nome"],
                "gestor_cpf": escola["gestor_cpf"],
                "gestor_email": escola["gestor_email"],
                "ativo": escola["ativo"],
                "data_cadastro": escola["data_cadastro"],
                "data_atualizacao": escola["data_atualizacao"]
            }
            for escola in escolas
        ]
        
    except Exception as e:
        print(f"Erro ao buscar escolas com filtro: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar escolas com filtro: {str(e)}"
        )

# Inicialização do servidor (quando executado diretamente)
if __name__ == "__main__":
    uvicorn.run("simplified_api:app", host="0.0.0.0", port=8000, reload=True) 

@app.post("/api/schema/adicionar_frequencia", status_code=status.HTTP_200_OK)
def adicionar_campo_frequencia():
    """
    Adiciona o campo 'frequencia' à tabela 'nota' caso ainda não exista.
    Endpoint melhorado para maior robustez.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se o campo já existe
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'nota' AND column_name = 'frequencia'
        """)
        campo_existe = cursor.fetchone()[0] > 0
        
        if not campo_existe:
            print("🔧 Campo 'frequencia' não encontrado. Adicionando...")
            
            # Adicionar o campo frequencia com IF NOT EXISTS para segurança extra
            cursor.execute("""
                ALTER TABLE nota 
                ADD COLUMN IF NOT EXISTS frequencia INTEGER DEFAULT 0
            """)
            print("✅ Campo 'frequencia' adicionado à tabela 'nota' com sucesso!")
            
            # Atualizar registros existentes para ter valor padrão 0
            cursor.execute("""
                UPDATE nota 
                SET frequencia = 0 
                WHERE frequencia IS NULL
            """)
            print("🔄 Registros existentes atualizados com frequencia = 0")
            
            conn.commit()
            
            return {
                "status": "success",
                "message": "Campo 'frequencia' adicionado com sucesso à tabela 'nota'",
                "details": {
                    "campo_criado": True,
                    "registros_atualizados": True
                }
            }
        else:
            print("ℹ️ Campo 'frequencia' já existe na tabela 'nota'")
            return {
                "status": "info", 
                "message": "Campo 'frequencia' já existe na tabela 'nota'",
                "details": {
                    "campo_criado": False,
                    "registros_atualizados": False
                }
            }
            
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Erro ao adicionar campo 'frequencia': {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao adicionar campo frequencia: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
