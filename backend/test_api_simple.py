"""
Script para testar a API com acesso direto ao banco de dados.

Este script faz chamadas às APIs para verificar se estão funcionando corretamente,
usando a versão simplificada na porta 4000.
"""
import requests
import json
import time

# URL base da API simplificada
API_URL = "http://localhost:4000"

# Função para imprimir resultados formatados
def print_response(title, response):
    print("\n" + "="*50)
    print(f"📌 {title}")
    print("="*50)
    
    try:
        if response.status_code >= 200 and response.status_code < 300:
            print(f"✅ Status: {response.status_code}")
            data = response.json()
            print("📋 Dados:")
            print(json.dumps(data, indent=4, ensure_ascii=False))
        else:
            print(f"❌ Status: {response.status_code}")
            try:
                data = response.json()
                print("🚫 Erro:")
                print(json.dumps(data, indent=4, ensure_ascii=False))
            except:
                print("🚫 Erro: Não foi possível decodificar a resposta JSON")
                print(response.text)
    except Exception as e:
        print(f"❌ Erro ao processar resposta: {e}")
        print(response.text)

# Testes da API
def test_api():
    print("\n" + "*"*80)
    print("🧪 Testando API simplificada (Acesso Direto ao Banco) em http://localhost:4000")
    print("*"*80)
    
    # Teste 1: Verificar se a API está online
    try:
        response = requests.get(f"{API_URL}/")
        print_response("Verificação de status da API", response)
    except Exception as e:
        print(f"❌ Falha ao conectar com a API: {e}")
        print("⚠️ Verifique se o servidor está rodando na porta 4000")
        print("⚠️ Execute: python direct_db_access_fixed.py")
        return False
    
    # Teste 2: Listar turmas
    try:
        response = requests.get(f"{API_URL}/api/turmas/")
        print_response("Listando todas as turmas", response)
    except Exception as e:
        print(f"❌ Falha ao listar turmas: {e}")
    
    # Teste 3: Listar disciplinas
    try:
        response = requests.get(f"{API_URL}/api/disciplinas/")
        print_response("Listando todas as disciplinas", response)
    except Exception as e:
        print(f"❌ Falha ao listar disciplinas: {e}")
    
    # Teste 4: Buscar uma turma específica (se houver dados)
    turmas = []
    try:
        response = requests.get(f"{API_URL}/api/turmas/")
        if response.status_code == 200:
            turmas = response.json()
            if turmas and len(turmas) > 0:
                turma_id = turmas[0].get("id_turma", "")
                if turma_id:
                    response = requests.get(f"{API_URL}/api/turmas/{turma_id}")
                    print_response(f"Buscando turma com ID '{turma_id}'", response)
    except Exception as e:
        print(f"❌ Falha ao buscar turma específica: {e}")
    
    # Teste 5: Buscar uma disciplina específica (se houver dados)
    disciplinas = []
    try:
        response = requests.get(f"{API_URL}/api/disciplinas/")
        if response.status_code == 200:
            disciplinas = response.json()
            if disciplinas and len(disciplinas) > 0:
                disciplina_id = disciplinas[0].get("id_disciplina", "")
                if disciplina_id:
                    response = requests.get(f"{API_URL}/api/disciplinas/{disciplina_id}")
                    print_response(f"Buscando disciplina com ID '{disciplina_id}'", response)
    except Exception as e:
        print(f"❌ Falha ao buscar disciplina específica: {e}")
    
    print("\n" + "*"*80)
    print("✅ Testes concluídos!")
    print("*"*80)
    return True

if __name__ == "__main__":
    # Aguardar alguns segundos para garantir que o servidor está rodando
    print("Aguardando o servidor iniciar...")
    time.sleep(2)
    
    # Executar os testes
    test_api() 