"""
Patch para adicionar endpoints de gerenciamento de vínculos entre professores, disciplinas e turmas.
Estes endpoints devem ser adicionados ao arquivo simplified_api.py
"""
from fastapi import FastAPI, HTTPException, Path, Body, Query, status
from pydantic import BaseModel
from typing import List, Optional, Dict

# Primeiro, certifique-se de que a tabela existe no banco de dados
from create_professor_disciplina_turma_table import create_professor_disciplina_turma_table

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

# Endpoints para vínculos professor-disciplina-turma

"""
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
"""

# Garantir que a tabela existe
if __name__ == "__main__":
    print("Verificando se a tabela professor_disciplina_turma existe...")
    create_professor_disciplina_turma_table()
    print("Endpoints para vínculos prontos para serem adicionados ao simplified_api.py") 