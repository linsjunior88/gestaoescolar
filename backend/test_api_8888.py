import requests
import json
from pprint import pprint

def test_api():
    """
    Testa a API e exibe os resultados das consultas.
    """
    base_url = "http://localhost:8888"
    
    # Testa a rota raiz
    print("\n=== Testando rota raiz ===")
    try:
        response = requests.get(f"{base_url}/")
        pprint(response.json())
    except Exception as e:
        print(f"Erro ao acessar a rota raiz: {e}")
    
    # Testa a rota de turmas
    print("\n=== Testando rota de turmas ===")
    try:
        response = requests.get(f"{base_url}/api/turmas/")
        if response.status_code == 200:
            turmas = response.json()
            if turmas:
                print(f"Encontradas {len(turmas)} turmas:")
                for turma in turmas:
                    print(f"ID: {turma['id_turma']}, Série: {turma['serie']}, Turno: {turma['turno']}")
            else:
                print("Nenhuma turma encontrada.")
        else:
            print(f"Erro ao consultar turmas: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao acessar a rota de turmas: {e}")
    
    # Testa a rota de disciplinas
    print("\n=== Testando rota de disciplinas ===")
    try:
        response = requests.get(f"{base_url}/api/disciplinas/")
        if response.status_code == 200:
            disciplinas = response.json()
            if disciplinas:
                print(f"Encontradas {len(disciplinas)} disciplinas:")
                for disciplina in disciplinas:
                    print(f"ID: {disciplina['id_disciplina']}, Nome: {disciplina['nome_disciplina']}, Carga Horária: {disciplina['carga_horaria']}")
            else:
                print("Nenhuma disciplina encontrada.")
        else:
            print(f"Erro ao consultar disciplinas: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao acessar a rota de disciplinas: {e}")
    
    # Testa a rota de alunos
    print("\n=== Testando rota de alunos ===")
    try:
        response = requests.get(f"{base_url}/api/alunos/")
        if response.status_code == 200:
            alunos = response.json()
            if alunos:
                print(f"Encontrados {len(alunos)} alunos:")
                for aluno in alunos:
                    print(f"ID: {aluno['id_aluno']}, Nome: {aluno['nome_aluno']}, Turma: {aluno['id_turma']}")
            else:
                print("Nenhum aluno encontrado.")
        else:
            print(f"Erro ao consultar alunos: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao acessar a rota de alunos: {e}")
    
    # Testa a rota de professores
    print("\n=== Testando rota de professores ===")
    try:
        response = requests.get(f"{base_url}/api/professores/")
        if response.status_code == 200:
            professores = response.json()
            if professores:
                print(f"Encontrados {len(professores)} professores:")
                for professor in professores:
                    print(f"ID: {professor['id_professor']}, Nome: {professor['nome_professor']}, Email: {professor.get('email_professor', 'N/A')}")
            else:
                print("Nenhum professor encontrado.")
        else:
            print(f"Erro ao consultar professores: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao acessar a rota de professores: {e}")
    
    # Testa a rota de notas
    print("\n=== Testando rota de notas ===")
    try:
        response = requests.get(f"{base_url}/api/notas/")
        if response.status_code == 200:
            notas = response.json()
            if notas:
                print(f"Encontradas {len(notas)} notas:")
                for nota in notas:
                    print(f"Aluno: {nota['id_aluno']}, Disciplina: {nota['id_disciplina']}, Ano: {nota['ano']}, Bimestre: {nota['bimestre']}, Média: {nota['media']}")
            else:
                print("Nenhuma nota encontrada.")
        else:
            print(f"Erro ao consultar notas: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Erro ao acessar a rota de notas: {e}")

if __name__ == "__main__":
    test_api() 