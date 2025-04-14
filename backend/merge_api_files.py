#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script para mesclar os arquivos da API simplificada em um único arquivo.
Este script combina simplified_api.py, simplified_api_part2.py e simplified_api_part3.py
em um único arquivo simplified_api_complete.py.
"""

import os
import sys

# Arquivos a serem mesclados
BASE_FILE = "simplified_api.py"
PART2_FILE = "simplified_api_part2.py"
PART3_FILE = "simplified_api_part3.py"
OUTPUT_FILE = "simplified_api_complete.py"

# Verificar se todos os arquivos existem
files_to_check = [BASE_FILE, PART2_FILE, PART3_FILE]
for file in files_to_check:
    if not os.path.exists(file):
        print(f"Erro: O arquivo {file} não foi encontrado.")
        sys.exit(1)

print("Todos os arquivos foram encontrados. Iniciando a mesclagem...")

try:
    # Ler o conteúdo dos arquivos
    with open(BASE_FILE, 'r', encoding='utf-8') as f:
        base_content = f.read()
    
    with open(PART2_FILE, 'r', encoding='utf-8') as f:
        part2_content = f.read()
    
    with open(PART3_FILE, 'r', encoding='utf-8') as f:
        part3_content = f.read()
    
    print("Todos os arquivos foram lidos com sucesso.")
    
    # Dividir o conteúdo do arquivo base para encontrar o ponto onde inserir os outros arquivos
    if 'if __name__ == "__main__"' in base_content:
        # Encontrar a posição do bloco "if __name__ == '__main__'"
        main_block_pos = base_content.find('if __name__ == "__main__"')
        
        # Dividir o conteúdo em duas partes: antes e depois do bloco main
        base_part1 = base_content[:main_block_pos]
        base_part2 = base_content[main_block_pos:]
        
        # Extrair as importações dos arquivos part2 e part3
        part2_imports = []
        part3_imports = []
        
        for line in part2_content.split('\n'):
            if line.startswith('import ') or line.startswith('from '):
                part2_imports.append(line)
                
        for line in part3_content.split('\n'):
            if line.startswith('import ') or line.startswith('from '):
                part3_imports.append(line)
                
        # Remover as importações duplicadas
        all_imports = set(part2_imports + part3_imports)
        
        # Adicionar as importações ao início do arquivo base
        base_imports_end = 0
        for i, line in enumerate(base_content.split('\n')):
            if line.startswith('import ') or line.startswith('from '):
                base_imports_end = base_content.find('\n', base_content.find(line)) + 1
                
        # Criar o arquivo mesclado
        merged_content = (
            base_content[:base_imports_end] + 
            '\n' + '\n'.join(all_imports) + '\n\n' +
            base_part1 + 
            '\n\n# ================== CONTEÚDO DE simplified_api_part2.py ==================\n\n' +
            part2_content +
            '\n\n# ================== CONTEÚDO DE simplified_api_part3.py ==================\n\n' +
            part3_content +
            '\n\n' + base_part2
        )
    else:
        # Se não encontrar o bloco main, simplesmente concatenar os arquivos
        merged_content = (
            base_content + 
            '\n\n# ================== CONTEÚDO DE simplified_api_part2.py ==================\n\n' + 
            part2_content + 
            '\n\n# ================== CONTEÚDO DE simplified_api_part3.py ==================\n\n' + 
            part3_content
        )
    
    # Escrever o arquivo mesclado
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(merged_content)
    print(f"Arquivo {OUTPUT_FILE} criado com sucesso!")
    
    # Atualizar o script run_simplified_api.py para usar o arquivo completo
    if os.path.exists('run_simplified_api.py'):
        with open('run_simplified_api.py', 'r', encoding='utf-8') as f:
            run_script_content = f.read()
        
        # Se o script já está referenciando simplified_api_complete.py, não precisa atualizar
        if "simplified_api:app" in run_script_content and "simplified_api_complete:app" not in run_script_content:
            updated_run_script = run_script_content.replace(
                "simplified_api:app", 
                "simplified_api_complete:app"
            )
            
            with open('run_simplified_api.py', 'w', encoding='utf-8') as f:
                f.write(updated_run_script)
            
            print("Script run_simplified_api.py atualizado para usar o arquivo completo!")
        else:
            print("Script run_simplified_api.py já está configurado ou não precisa de atualização.")
    
except Exception as e:
    print(f"Erro ao mesclar os arquivos: {e}")
    sys.exit(1)

print("""
=============================================
Mesclagem concluída com sucesso!
=============================================

Para executar a API completa, use um destes comandos:

1. Usando o script de execução:
   python run_simplified_api.py
   
2. Usando uvicorn diretamente:
   uvicorn simplified_api_complete:app --host 0.0.0.0 --port 4000 --reload

A documentação da API estará disponível em:
http://localhost:4000/docs
=============================================
""") 