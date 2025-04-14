"""
Script para acessar o banco de dados diretamente usando psycopg2.
Este script implementa um servidor web usando FastAPI que conecta diretamente
ao banco de dados PostgreSQL sem usar SQLAlchemy.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import psycopg2.extras
import uvicorn

# Configuração da API
app = FastAPI(title="API de Acesso Direto ao Banco")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class Turma(BaseModel):
    id: int
    id_turma: str
    serie: str
    turno: str
    tipo_turma: Optional[str] = None
    coordenador: Optional[str] = None

class Disciplina(BaseModel):
    id: int
    id_disciplina: str
    nome_disciplina: str
    carga_horaria: Optional[int] = None

# Função para conexão com o banco de dados
def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s",
            host="localhost",
            port="5432"
        )
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(status_code=500, detail=f"Erro de conexão com o banco de dados: {str(e)}")

# Rotas da API
@app.get("/")
def read_root():
    return {"message": "API de Acesso Direto ao Banco", "status": "online"}

@app.get("/api/turmas/", response_model=List[Turma])
def read_turmas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma")
        result = cursor.fetchall()
        
        turmas = []
        for row in result:
            # Converter o resultado do banco para um dicionário
            turma_dict = {
                "id": row["id"],
                "id_turma": row["id_turma"],
                "serie": row["serie"],
                "turno": row["turno"],
                "tipo_turma": row["tipo_turma"],
                "coordenador": row["coordenador"]
            }
            turmas.append(turma_dict)
            
        cursor.close()
        conn.close()
        return turmas
    except Exception as e:
        print(f"Erro ao buscar turmas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar turmas: {str(e)}")

@app.get("/api/turmas/{turma_id}")
def read_turma(turma_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Verificar se o ID é numérico
        if turma_id.isdigit():
            cursor.execute(
                "SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma WHERE id = %s",
                (int(turma_id),)
            )
        else:
            cursor.execute(
                "SELECT id, id_turma, serie, turno, tipo_turma, coordenador FROM turma WHERE id_turma = %s",
                (turma_id,)
            )
            
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Turma não encontrada")
        
        # Converter o resultado do banco para um dicionário
        turma = {
            "id": result["id"],
            "id_turma": result["id_turma"],
            "serie": result["serie"],
            "turno": result["turno"],
            "tipo_turma": result["tipo_turma"],
            "coordenador": result["coordenador"]
        }
        
        cursor.close()
        conn.close()
        return turma
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar turma: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar turma: {str(e)}")

@app.get("/api/disciplinas/", response_model=List[Disciplina])
def read_disciplinas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina")
        result = cursor.fetchall()
        
        disciplinas = []
        for row in result:
            # Converter o resultado do banco para um dicionário
            disciplina_dict = {
                "id": row["id"],
                "id_disciplina": row["id_disciplina"],
                "nome_disciplina": row["nome_disciplina"],
                "carga_horaria": row["carga_horaria"]
            }
            disciplinas.append(disciplina_dict)
            
        cursor.close()
        conn.close()
        return disciplinas
    except Exception as e:
        print(f"Erro ao buscar disciplinas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar disciplinas: {str(e)}")

@app.get("/api/disciplinas/{disciplina_id}")
def read_disciplina(disciplina_id: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Verificar se o ID é numérico
        if disciplina_id.isdigit():
            cursor.execute(
                "SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina WHERE id = %s",
                (int(disciplina_id),)
            )
        else:
            cursor.execute(
                "SELECT id, id_disciplina, nome_disciplina, carga_horaria FROM disciplina WHERE id_disciplina = %s",
                (disciplina_id,)
            )
            
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Disciplina não encontrada")
        
        # Converter o resultado do banco para um dicionário
        disciplina = {
            "id": result["id"],
            "id_disciplina": result["id_disciplina"],
            "nome_disciplina": result["nome_disciplina"],
            "carga_horaria": result["carga_horaria"]
        }
        
        cursor.close()
        conn.close()
        return disciplina
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erro ao buscar disciplina: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar disciplina: {str(e)}")

# Execute o servidor se o script for executado diretamente
if __name__ == "__main__":
    uvicorn.run("direct_db_access:app", host="127.0.0.1", port=3000, reload=True) 