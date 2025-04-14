# ==============================================================
# Modelos de dados para Professores e Alunos
# ==============================================================

# Modelo para Professor
class ProfessorBase(BaseModel):
    id_professor: str
    nome_professor: str
    email_professor: Optional[str] = None
    telefone_professor: Optional[str] = None
    ativo: bool = True

class ProfessorCreate(ProfessorBase):
    pass

class ProfessorUpdate(BaseModel):
    id_professor: Optional[str] = None
    nome_professor: Optional[str] = None
    email_professor: Optional[str] = None
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
    SELECT id, id_professor, nome_professor, email_professor, telefone_professor, ativo 
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
        SELECT id, id_professor, nome_professor, email_professor, telefone_professor, ativo 
        FROM professor 
        WHERE id = %s
        """
        params = (int(professor_id),)
    else:
        query = """
        SELECT id, id_professor, nome_professor, email_professor, telefone_professor, ativo 
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
    INSERT INTO professor (id_professor, nome_professor, email_professor, telefone_professor, ativo)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING id, id_professor, nome_professor, email_professor, telefone_professor, ativo
    """
    params = (
        professor.id_professor,
        professor.nome_professor,
        professor.email_professor,
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
    if professor.telefone_professor is not None:
        updates["telefone_professor"] = professor.telefone_professor
    if professor.ativo is not None:
        updates["ativo"] = professor.ativo
    
    if not updates:
        # Se não houver campos para atualizar, buscamos e retornamos os dados atuais
        query = """
        SELECT id, id_professor, nome_professor, email_professor, telefone_professor, ativo 
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
    RETURNING id, id_professor, nome_professor, email_professor, telefone_professor, ativo
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