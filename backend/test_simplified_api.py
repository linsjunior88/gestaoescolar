"""
Script para testar as principais funcionalidades da API simplificada.
Este script verifica se a API está funcionando corretamente, testando
os principais endpoints de cada entidade.
"""
import requests
import json
import time
import sys

# URL base da API
BASE_URL = "http://localhost:4000"
API_URL = f"{BASE_URL}/api"

# Cores para saída no console
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_color(text, color):
    """Imprime texto colorido no console."""
    print(f"{color}{text}{Colors.ENDC}")

def test_endpoint(method, url, data=None, expected_status=200):
    """Testa um endpoint específico da API."""
    full_url = f"{BASE_URL}{url}"
    
    # Mostrar informações da requisição
    print_color(f"\n{method} {full_url}", Colors.BOLD)
    if data:
        print_color(f"Request data: {json.dumps(data, indent=2, ensure_ascii=False)}", Colors.BLUE)
    
    try:
        # Fazer a requisição
        if method.upper() == "GET":
            response = requests.get(full_url)
        elif method.upper() == "POST":
            response = requests.post(full_url, json=data)
        elif method.upper() == "PUT":
            response = requests.put(full_url, json=data)
        elif method.upper() == "DELETE":
            response = requests.delete(full_url)
        else:
            print_color(f"Método HTTP não suportado: {method}", Colors.RED)
            return False
        
        # Verificar o status da resposta
        if response.status_code == expected_status:
            print_color(f"Status: {response.status_code} ✓", Colors.GREEN)
            
            # Para códigos 200 e 201, mostrar o conteúdo da resposta
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    print_color(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}", Colors.BLUE)
                except:
                    print_color(f"Response: {response.text}", Colors.BLUE)
            
            return True
        else:
            print_color(f"Status: {response.status_code} ✗ (Esperado: {expected_status})", Colors.RED)
            print_color(f"Response: {response.text}", Colors.RED)
            return False
    
    except Exception as e:
        print_color(f"Erro na requisição: {e}", Colors.RED)
        return False

def wait_for_api_startup(max_attempts=30):
    """Aguarda a API iniciar antes de executar os testes."""
    print_color("Aguardando a API iniciar...", Colors.YELLOW)
    
    for i in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print_color("API está online!", Colors.GREEN)
                return True
        except:
            pass
        
        # Esperar 1 segundo antes de tentar novamente
        time.sleep(1)
    
    print_color("Tempo esgotado. A API não parece estar em execução.", Colors.RED)
    return False

def run_tests():
    """Executa todos os testes da API."""
    # Verificar status da API
    if not test_endpoint("GET", "/"):
        return
    
    if not test_endpoint("GET", "/health"):
        return
    
    # Testar endpoints de Turmas
    print_color("\n===== Testando endpoints de Turmas =====", Colors.BOLD)
    test_endpoint("GET", "/api/turmas/")
    
    # Criar uma nova turma
    turma_data = {
        "id_turma": "3A-TESTE",
        "serie": "3º Ano",
        "turno": "Manhã",
        "tipo_turma": "Regular",
        "coordenador": "Professor Teste"
    }
    if test_endpoint("POST", "/api/turmas/", turma_data, 201):
        # Se a criação foi bem-sucedida, buscar a turma específica
        turma_id = "3A-TESTE"  # Usar o id_turma criado
        test_endpoint("GET", f"/api/turmas/{turma_id}")
        
        # Atualizar a turma
        turma_update = {
            "coordenador": "Professor Atualizado"
        }
        test_endpoint("PUT", f"/api/turmas/{turma_id}", turma_update)
        
        # Excluir a turma
        test_endpoint("DELETE", f"/api/turmas/{turma_id}", expected_status=204)
    
    # Testar endpoints de Disciplinas
    print_color("\n===== Testando endpoints de Disciplinas =====", Colors.BOLD)
    test_endpoint("GET", "/api/disciplinas/")
    
    # Criar uma nova disciplina
    disciplina_data = {
        "id_disciplina": "MAT-TESTE",
        "nome_disciplina": "Matemática Teste",
        "carga_horaria": 80
    }
    if test_endpoint("POST", "/api/disciplinas/", disciplina_data, 201):
        # Se a criação foi bem-sucedida, buscar a disciplina específica
        disciplina_id = "MAT-TESTE"  # Usar o id_disciplina criado
        test_endpoint("GET", f"/api/disciplinas/{disciplina_id}")
        
        # Atualizar a disciplina
        disciplina_update = {
            "carga_horaria": 90
        }
        test_endpoint("PUT", f"/api/disciplinas/{disciplina_id}", disciplina_update)
        
        # Excluir a disciplina
        test_endpoint("DELETE", f"/api/disciplinas/{disciplina_id}", expected_status=204)
    
    # Testar endpoints de Professores e Alunos
    print_color("\n===== Testando endpoints de Professores e Alunos =====", Colors.BOLD)
    test_endpoint("GET", "/api/professores/")
    test_endpoint("GET", "/api/alunos/")
    
    # Criação de professores e alunos seria similar aos exemplos acima
    
    # Testar endpoints de Notas
    print_color("\n===== Testando endpoints de Notas =====", Colors.BOLD)
    test_endpoint("GET", "/api/notas/")
    
    # Para testes mais completos de Notas, seria necessário ter
    # alunos e disciplinas já cadastrados no banco
    
    print_color("\n===== Testes concluídos =====", Colors.BOLD)

if __name__ == "__main__":
    # Verificar se a API está em execução
    if wait_for_api_startup():
        run_tests()
    else:
        print_color("Por favor, inicie a API antes de executar os testes.", Colors.RED)
        print_color("Execute: python run_simplified_api.py", Colors.YELLOW)
        sys.exit(1) 