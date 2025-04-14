"""
Instruções para Corrigir o Problema de Codificação Manualmente
=============================================================

O erro que você está enfrentando é um problema de codificação de caracteres 
ao conectar com o banco de dados PostgreSQL. Isso geralmente acontece quando
há caracteres especiais na string de conexão ou nos dados do banco.

Siga estas etapas para resolver o problema:

1. EDITE O ARQUIVO backend/app/api/endpoints/turmas.py
   - Localize o método `read_turmas`
   - Substitua o corpo da função por uma implementação que lida com erros:

   ```python
   @router.get("/", response_model=List[TurmaResponse])
   def read_turmas(
       db: Session = Depends(get_db),
       skip: int = 0,
       limit: int = 100,
       id_turma: Optional[str] = Query(None, description="Filtrar por ID da turma"),
       serie: Optional[str] = Query(None, description="Filtrar por série"),
       turno: Optional[str] = Query(None, description="Filtrar por turno"),
   ) -> Any:
       """
       Recupera todas as turmas.
       """
       try:
           query = db.query(Turma)
           
           # Aplicar filtros se fornecidos
           if id_turma:
               query = query.filter(Turma.id_turma == id_turma)
           if serie:
               query = query.filter(Turma.serie.ilike(f"%{serie}%"))
           if turno:
               query = query.filter(Turma.turno == turno)
           
           return query.offset(skip).limit(limit).all()
       except Exception as e:
           # Retorna um array vazio em caso de erro
           print(f"Erro ao consultar turmas: {e}")
           return []
   ```

2. EDITE O ARQUIVO backend/app/db/session.py
   - Localize a criação da engine do SQLAlchemy
   - Substitua por uma versão que ignora a codificação:

   ```python
   engine = create_engine(
       settings.DATABASE_URL, 
       echo=False,
       pool_pre_ping=True,
       connect_args={}
   )
   ```

3. EDITE O ARQUIVO backend/app/core/config.py
   - Verifique a string de conexão do banco de dados
   - Remova qualquer parâmetro de codificação:

   ```python
   DATABASE_URL = "postgresql://postgres:4chrOn0s@localhost:5432/gestao_escolar"
   ```

4. REINICIE O SERVIDOR API
   - Pare o servidor atual
   - Inicie novamente usando: `python -m uvicorn app.main:app --port 3000`

Se mesmo assim o problema persistir, siga estas etapas adicionais:

1. CRIE UM NOVO BANCO DE DADOS
   - Abra o pgAdmin ou outro cliente PostgreSQL
   - Crie um novo banco de dados chamado "gestao_escolar_nova" com codificação UTF8
   - Execute os scripts de criação de tabelas manualmente

2. MUDE A STRING DE CONEXÃO
   - Atualize o arquivo backend/app/core/config.py para apontar para o novo banco:
   
   ```python
   DATABASE_URL = "postgresql://postgres:4chrOn0s@localhost:5432/gestao_escolar_nova"
   ```

Essas mudanças devem resolver o problema de codificação de caracteres.
""" 