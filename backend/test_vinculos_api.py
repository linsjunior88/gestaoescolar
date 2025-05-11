"""
Script para testar os endpoints de vínculos entre professores, disciplinas e turmas.
Para executar: python test_vinculos_api.py
"""
import requests
import json
import sys
import os
import time

# URL base da API (altere para o ambiente apropriado)
BASE_URL = "http://localhost:4000/api"  # Local
# BASE_URL = "https://gestao-escolar-api.onrender.com/api"  # Produção

# Cores para melhor visualização
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_header(text):
    """Imprime um cabeçalho formatado"""
    print(f"\n{Colors.BLUE}{'=' * 60}")
    print(f" {text}")
    print(f"{'=' * 60}{Colors.RESET}\n")

def print_success(text):
    """Imprime uma mensagem de sucesso"""
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    """Imprime uma mensagem de erro"""
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text):
    """Imprime uma mensagem de aviso"""
    print(f"{Colors.YELLOW}! {text}{Colors.RESET}")

def print_json(data):
    """Imprime dados JSON formatados"""
    print(json.dumps(data, indent=2, ensure_ascii=False))

def test_create_vinculo():
    """Testa a criação de um vínculo entre professor, disciplina e turma"""
    print_header("Testando criação de vínculo")
    
    # Dados para o teste
    vinculo_data = {
        "id_professor": "P001",
        "id_disciplina": "MAT",
        "id_turma": "14AM"
    }
    
    try:
        # Tentar criar o vínculo
        print(f"Enviando POST para {BASE_URL}/professor_disciplina_turma")
        print(f"Dados: {vinculo_data}")
        
        response = requests.post(
            f"{BASE_URL}/professor_disciplina_turma",
            json=vinculo_data
        )
        
        # Verificar resposta
        if response.status_code in [200, 201]:
            print_success(f"Vínculo criado com sucesso (Status: {response.status_code})")
            print_json(response.json())
            return response.json().get("id")
        else:
            print_error(f"Erro ao criar vínculo (Status: {response.status_code})")
            print_json(response.json())
            
            # Tentar endpoint alternativo
            print_warning("Tentando endpoint alternativo /vinculos")
            alt_response = requests.post(
                f"{BASE_URL}/vinculos",
                json=vinculo_data
            )
            
            if alt_response.status_code in [200, 201]:
                print_success(f"Vínculo criado com sucesso via endpoint alternativo (Status: {alt_response.status_code})")
                print_json(alt_response.json())
                return alt_response.json().get("id")
            else:
                print_error(f"Também falhou no endpoint alternativo (Status: {alt_response.status_code})")
                print_json(alt_response.json() if alt_response.text else {"message": "Sem resposta"})
                return None
    except Exception as e:
        print_error(f"Exceção: {str(e)}")
        return None

def test_list_vinculos():
    """Testa a listagem de vínculos"""
    print_header("Testando listagem de vínculos")
    
    try:
        # Listar todos os vínculos
        print(f"Enviando GET para {BASE_URL}/professor_disciplina_turma")
        response = requests.get(f"{BASE_URL}/professor_disciplina_turma")
        
        # Verificar resposta
        if response.status_code == 200:
            vinculos = response.json()
            print_success(f"Recebidos {len(vinculos)} vínculos (Status: {response.status_code})")
            if vinculos:
                print_json(vinculos[:3] if len(vinculos) > 3 else vinculos)
                if len(vinculos) > 3:
                    print_warning(f"... e mais {len(vinculos) - 3} vínculos (limitando a saída)")
            else:
                print_warning("Nenhum vínculo encontrado")
            return vinculos
        else:
            print_error(f"Erro ao listar vínculos (Status: {response.status_code})")
            
            # Tentar endpoint alternativo
            print_warning("Tentando endpoint alternativo /vinculos")
            alt_response = requests.get(f"{BASE_URL}/vinculos")
            
            if alt_response.status_code == 200:
                vinculos = alt_response.json()
                print_success(f"Recebidos {len(vinculos)} vínculos via endpoint alternativo (Status: {alt_response.status_code})")
                if vinculos:
                    print_json(vinculos[:3] if len(vinculos) > 3 else vinculos)
                    if len(vinculos) > 3:
                        print_warning(f"... e mais {len(vinculos) - 3} vínculos (limitando a saída)")
                else:
                    print_warning("Nenhum vínculo encontrado")
                return vinculos
            else:
                print_error(f"Também falhou no endpoint alternativo (Status: {alt_response.status_code})")
                return []
    except Exception as e:
        print_error(f"Exceção: {str(e)}")
        return []

def test_filter_vinculos(professor_id="P001"):
    """Testa a filtragem de vínculos por professor"""
    print_header(f"Testando filtragem de vínculos para professor {professor_id}")
    
    try:
        # Filtrar vínculos por professor
        print(f"Enviando GET para {BASE_URL}/professor_disciplina_turma?id_professor={professor_id}")
        response = requests.get(f"{BASE_URL}/professor_disciplina_turma?id_professor={professor_id}")
        
        # Verificar resposta
        if response.status_code == 200:
            vinculos = response.json()
            print_success(f"Recebidos {len(vinculos)} vínculos para professor {professor_id} (Status: {response.status_code})")
            if vinculos:
                print_json(vinculos)
            else:
                print_warning(f"Nenhum vínculo encontrado para professor {professor_id}")
            return vinculos
        else:
            print_error(f"Erro ao filtrar vínculos (Status: {response.status_code})")
            
            # Tentar endpoint alternativo
            print_warning("Tentando endpoint alternativo /vinculos")
            alt_response = requests.get(f"{BASE_URL}/vinculos?id_professor={professor_id}")
            
            if alt_response.status_code == 200:
                vinculos = alt_response.json()
                print_success(f"Recebidos {len(vinculos)} vínculos via endpoint alternativo (Status: {alt_response.status_code})")
                if vinculos:
                    print_json(vinculos)
                else:
                    print_warning(f"Nenhum vínculo encontrado para professor {professor_id}")
                return vinculos
            else:
                print_error(f"Também falhou no endpoint alternativo (Status: {alt_response.status_code})")
                return []
    except Exception as e:
        print_error(f"Exceção: {str(e)}")
        return []

def test_delete_vinculo(vinculo_id):
    """Testa a remoção de um vínculo"""
    if not vinculo_id:
        print_warning("Sem ID de vínculo para excluir. Pulando teste de exclusão.")
        return False
        
    print_header(f"Testando remoção de vínculo (ID: {vinculo_id})")
    
    try:
        # Excluir o vínculo
        print(f"Enviando DELETE para {BASE_URL}/professor_disciplina_turma/{vinculo_id}")
        response = requests.delete(f"{BASE_URL}/professor_disciplina_turma/{vinculo_id}")
        
        # Verificar resposta
        if response.status_code in [200, 204]:
            print_success(f"Vínculo excluído com sucesso (Status: {response.status_code})")
            if response.text:
                print_json(response.json())
            return True
        else:
            print_error(f"Erro ao excluir vínculo (Status: {response.status_code})")
            
            # Tentar endpoint alternativo
            print_warning("Tentando endpoint alternativo /vinculos")
            alt_response = requests.delete(f"{BASE_URL}/vinculos/{vinculo_id}")
            
            if alt_response.status_code in [200, 204]:
                print_success(f"Vínculo excluído com sucesso via endpoint alternativo (Status: {alt_response.status_code})")
                if alt_response.text:
                    print_json(alt_response.json())
                return True
            else:
                print_error(f"Também falhou no endpoint alternativo (Status: {alt_response.status_code})")
                return False
    except Exception as e:
        print_error(f"Exceção: {str(e)}")
        return False

def main():
    """Função principal que executa todos os testes"""
    print_header("TESTE DOS ENDPOINTS DE VÍNCULOS PROFESSOR-DISCIPLINA-TURMA")
    
    # Verificar conexão com a API
    try:
        health_response = requests.get(f"{BASE_URL.split('/api')[0]}/health")
        if health_response.status_code == 200:
            print_success(f"API está ativa! ({BASE_URL})")
        else:
            print_error(f"Falha no healthcheck da API: Status {health_response.status_code}")
            sys.exit(1)
    except Exception as e:
        print_error(f"Erro ao conectar à API: {str(e)}")
        print_warning(f"Verifique se a URL base está correta: {BASE_URL}")
        print_warning("Se estiver usando a URL local, certifique-se de que o servidor está rodando.")
        sys.exit(1)
    
    # Executar os testes
    
    # 1. Listar vínculos existentes
    vinculos_antes = test_list_vinculos()
    
    # 2. Criar um novo vínculo
    vinculo_id = test_create_vinculo()
    
    # Pequena pausa para garantir que a operação anterior foi concluída
    time.sleep(1)
    
    # 3. Listar vínculos novamente para confirmar a criação
    vinculos_depois = test_list_vinculos()
    
    if len(vinculos_depois) > len(vinculos_antes):
        print_success(f"Confirmação: Número de vínculos aumentou de {len(vinculos_antes)} para {len(vinculos_depois)}")
    else:
        print_warning(f"Aviso: Número de vínculos não aumentou ({len(vinculos_antes)} -> {len(vinculos_depois)})")
    
    # 4. Filtrar vínculos por professor
    test_filter_vinculos("P001")
    
    # 5. Excluir o vínculo criado
    if vinculo_id:
        success = test_delete_vinculo(vinculo_id)
        
        # Pequena pausa para garantir que a operação anterior foi concluída
        time.sleep(1)
        
        # 6. Listar vínculos novamente para confirmar a exclusão
        vinculos_apos_exclusao = test_list_vinculos()
        
        if success and len(vinculos_apos_exclusao) < len(vinculos_depois):
            print_success(f"Confirmação: Número de vínculos diminuiu de {len(vinculos_depois)} para {len(vinculos_apos_exclusao)}")
        else:
            print_warning(f"Aviso: Número de vínculos não diminuiu ({len(vinculos_depois)} -> {len(vinculos_apos_exclusao)})")
    
    print_header("RESUMO DOS TESTES")
    if vinculo_id:
        print_success("✓ Criação de vínculos: SUCESSO")
    else:
        print_error("✗ Criação de vínculos: FALHA")
    
    if len(vinculos_depois) > 0:
        print_success("✓ Listagem de vínculos: SUCESSO")
    else:
        print_warning("! Listagem de vínculos: PARCIAL (nenhum vínculo encontrado)")
    
    if vinculo_id and success:
        print_success("✓ Exclusão de vínculos: SUCESSO")
    elif vinculo_id:
        print_error("✗ Exclusão de vínculos: FALHA")
    else:
        print_warning("! Exclusão de vínculos: NÃO TESTADO")

if __name__ == "__main__":
    main() 