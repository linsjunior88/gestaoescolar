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