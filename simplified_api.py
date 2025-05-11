from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

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