from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

# Criar aplicação Flask
app = Flask(__name__)
CORS(app)

# Função para conectar ao banco de dados
def get_db_connection():
    db_path = 'escola.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# Função para inicializar o banco de dados
def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Criar tabelas básicas se não existirem
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alunos (
                id_aluno TEXT PRIMARY KEY,
                nome_aluno TEXT NOT NULL,
                id_turma TEXT,
                serie TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS turmas (
                id_turma TEXT PRIMARY KEY,
                serie TEXT,
                turno TEXT,
                tipo_turma TEXT,
                coordenador TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS disciplinas (
                id_disciplina TEXT PRIMARY KEY,
                nome_disciplina TEXT NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS professores (
                id_professor TEXT PRIMARY KEY,
                nome_professor TEXT NOT NULL,
                email TEXT,
                telefone TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_aluno TEXT,
                id_disciplina TEXT,
                id_turma TEXT,
                bimestre INTEGER,
                nota_mensal REAL,
                nota_bimestral REAL,
                media_bimestral REAL,
                ano INTEGER,
                FOREIGN KEY (id_aluno) REFERENCES alunos (id_aluno),
                FOREIGN KEY (id_disciplina) REFERENCES disciplinas (id_disciplina),
                FOREIGN KEY (id_turma) REFERENCES turmas (id_turma)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Banco de dados inicializado com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco de dados: {e}")

# Endpoints básicos
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "API funcionando"}), 200

@app.route('/api/turmas', methods=['GET'])
def listar_turmas():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM turmas')
        turmas = cursor.fetchall()
        
        result = []
        for turma in turmas:
            result.append({
                'id_turma': turma['id_turma'],
                'serie': turma['serie'],
                'turno': turma['turno'],
                'tipo_turma': turma['tipo_turma'],
                'coordenador': turma['coordenador']
            })
        
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/turmas/<string:turma_id>', methods=['GET'])
def obter_turma(turma_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM turmas WHERE id_turma = ?', (turma_id,))
        turma = cursor.fetchone()
        
        if not turma:
            return jsonify({"error": "Turma não encontrada"}), 404
        
        result = {
            'id_turma': turma['id_turma'],
            'serie': turma['serie'],
            'turno': turma['turno'],
            'tipo_turma': turma['tipo_turma'],
            'coordenador': turma['coordenador']
        }
        
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Adicionar endpoint para criar vínculo entre professor, disciplina e turma
@app.route('/api/professor_disciplina_turma', methods=['POST'])
def criar_vinculo_professor_disciplina_turma():
    data = request.get_json()
    
    # Extrair campos necessários (com verificação para diferentes nomes possíveis)
    id_professor = data.get('id_professor') or data.get('professor_id')
    id_disciplina = data.get('id_disciplina') or data.get('disciplina_id')
    id_turma = data.get('id_turma') or data.get('turma_id')
    
    if not all([id_professor, id_disciplina, id_turma]):
        return jsonify({"error": "Dados incompletos", "detalhes": "Todos os campos (id_professor, id_disciplina, id_turma) são obrigatórios"}), 400
    
    # Inserir no banco de dados
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se o vínculo já existe
        cursor.execute(
            'SELECT id FROM professor_disciplina_turma WHERE id_professor = ? AND id_disciplina = ? AND id_turma = ?',
            (id_professor, id_disciplina, id_turma)
        )
        existing = cursor.fetchone()
        
        if existing:
            # Se já existe, retornar sucesso com mensagem
            return jsonify({"message": "Vínculo já existe", "id": existing[0]}), 200
        
        # Inserir novo vínculo
        cursor.execute(
            'INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma) VALUES (?, ?, ?)',
            (id_professor, id_disciplina, id_turma)
        )
        conn.commit()
        
        # Obter o ID gerado
        last_id = cursor.lastrowid
        
        conn.close()
        return jsonify({
            "message": "Vínculo criado com sucesso",
            "id": last_id,
            "dados": {
                "id_professor": id_professor,
                "id_disciplina": id_disciplina,
                "id_turma": id_turma
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Adicionar endpoint para listar vínculos
@app.route('/api/professor_disciplina_turma', methods=['GET'])
def listar_vinculos_professor_disciplina_turma():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Obter parâmetros para filtro
        id_professor = request.args.get('id_professor') or request.args.get('professor_id')
        id_disciplina = request.args.get('id_disciplina') or request.args.get('disciplina_id')
        id_turma = request.args.get('id_turma') or request.args.get('turma_id')
        
        # Construir a consulta SQL
        query = 'SELECT * FROM professor_disciplina_turma'
        params = []
        conditions = []
        
        if id_professor:
            conditions.append('id_professor = ?')
            params.append(id_professor)
        
        if id_disciplina:
            conditions.append('id_disciplina = ?')
            params.append(id_disciplina)
        
        if id_turma:
            conditions.append('id_turma = ?')
            params.append(id_turma)
        
        if conditions:
            query += ' WHERE ' + ' AND '.join(conditions)
        
        # Executar a consulta
        cursor.execute(query, params)
        vinculos = cursor.fetchall()
        
        # Formatar resultado
        result = []
        for vinculo in vinculos:
            result.append({
                'id': vinculo[0],
                'id_professor': vinculo[1],
                'id_disciplina': vinculo[2],
                'id_turma': vinculo[3]
            })
        
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para excluir vínculo
@app.route('/api/professor_disciplina_turma/<int:id>', methods=['DELETE'])
def excluir_vinculo_professor_disciplina_turma(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se o vínculo existe
        cursor.execute('SELECT id FROM professor_disciplina_turma WHERE id = ?', (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Vínculo não encontrado"}), 404
        
        # Excluir o vínculo
        cursor.execute('DELETE FROM professor_disciplina_turma WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Vínculo excluído com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint alternativo com nome mais amigável
@app.route('/api/vinculos', methods=['POST'])
def criar_vinculo():
    return criar_vinculo_professor_disciplina_turma()

@app.route('/api/vinculos', methods=['GET'])
def listar_vinculos():
    return listar_vinculos_professor_disciplina_turma()

@app.route('/api/vinculos/<int:id>', methods=['DELETE'])
def excluir_vinculo(id):
    return excluir_vinculo_professor_disciplina_turma(id)

# Função para garantir que a tabela professor_disciplina_turma exista
def criar_tabela_vinculos():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='professor_disciplina_turma'")
        if not cursor.fetchone():
            print("Criando tabela professor_disciplina_turma...")
            
            # Criar a tabela
            cursor.execute('''
            CREATE TABLE professor_disciplina_turma (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_professor TEXT NOT NULL,
                id_disciplina TEXT NOT NULL,
                id_turma TEXT NOT NULL,
                UNIQUE(id_professor, id_disciplina, id_turma)
            )
            ''')
            
            conn.commit()
            print("Tabela professor_disciplina_turma criada com sucesso!")
        
        conn.close()
    except Exception as e:
        print(f"Erro ao criar tabela de vínculos: {e}")

# Chamar a função para garantir que a tabela exista
criar_tabela_vinculos()

# Função para inserir dados de exemplo
def inserir_dados_exemplo():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Inserir algumas turmas de exemplo
        turmas_exemplo = [
            ('13CM', '3 ANO C', 'MANHA', 'NORMAL', 'PROF. EXEMPLO'),
            ('13CT', '3 ANO C', 'TARDE', 'NORMAL', 'PROF. EXEMPLO'),
            ('12AM', '2 ANO A', 'MANHA', 'NORMAL', 'PROF. EXEMPLO'),
            ('12AT', '2 ANO A', 'TARDE', 'NORMAL', 'PROF. EXEMPLO'),
            ('11AM', '1 ANO A', 'MANHA', 'NORMAL', 'PROF. EXEMPLO')
        ]
        
        for turma in turmas_exemplo:
            cursor.execute('''
                INSERT OR IGNORE INTO turmas (id_turma, serie, turno, tipo_turma, coordenador)
                VALUES (?, ?, ?, ?, ?)
            ''', turma)
        
        # Inserir alguns alunos de exemplo
        alunos_exemplo = [
            ('77364', 'ANGELO MIGUEL DA SILVA COSTA', '13CM', '3 ANO C'),
            ('77365', 'MARIA FERNANDA SANTOS', '13CM', '3 ANO C'),
            ('77366', 'JOÃO PEDRO OLIVEIRA', '12AM', '2 ANO A')
        ]
        
        for aluno in alunos_exemplo:
            cursor.execute('''
                INSERT OR IGNORE INTO alunos (id_aluno, nome_aluno, id_turma, serie)
                VALUES (?, ?, ?, ?)
            ''', aluno)
        
        # Inserir algumas disciplinas de exemplo
        disciplinas_exemplo = [
            ('MAT', 'MATEMATICA'),
            ('POR', 'PORTUGUES'),
            ('HIS', 'HISTORIA'),
            ('GEO', 'GEOGRAFIA'),
            ('CIE', 'CIENCIAS')
        ]
        
        for disciplina in disciplinas_exemplo:
            cursor.execute('''
                INSERT OR IGNORE INTO disciplinas (id_disciplina, nome_disciplina)
                VALUES (?, ?)
            ''', disciplina)
        
        conn.commit()
        conn.close()
        print("✅ Dados de exemplo inseridos com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao inserir dados de exemplo: {e}")

# Inicializar banco de dados
init_db()

# Inserir dados de exemplo
inserir_dados_exemplo()

# Função principal para executar o servidor
if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask...")
    print("📊 Sistema de Gestão Escolar - API")
    print("🌐 Servidor rodando em: http://localhost:5000")
    print("📋 Health check: http://localhost:5000/api/health")
    print("📚 Turmas: http://localhost:5000/api/turmas")
    
    # Inicializar banco de dados
    init_db()
    
    # Executar servidor
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    ) 