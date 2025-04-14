import os
import re
import shutil
from datetime import datetime

def backup_file(file_path):
    """Cria um backup do arquivo original"""
    backup_path = f"{file_path}.bak_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    try:
        shutil.copy2(file_path, backup_path)
        print(f"Backup criado: {backup_path}")
        return True
    except Exception as e:
        print(f"Erro ao criar backup: {e}")
        return False

def patch_api_file(file_path):
    """Modifica o arquivo da API para corrigir o cálculo de média"""
    print(f"Iniciando modificação do arquivo: {file_path}")
    
    # Verificar se o arquivo existe
    if not os.path.exists(file_path):
        print(f"Arquivo não encontrado: {file_path}")
        return False
    
    # Criar backup do arquivo original
    if not backup_file(file_path):
        return False
    
    try:
        # Ler o conteúdo do arquivo
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Padrão de código a ser substituído - Rota POST
        post_pattern = r"""# Calcular média
        nota_mensal = nota\.nota_mensal or 0
        nota_bimestral = nota\.nota_bimestral or 0
        recuperacao = nota\.recuperacao or 0
        
        # Se tem recuperação, considera na média \(60% maior nota \+ 40% recuperação\)
        if recuperacao > 0:
            maior_nota = max\(nota_mensal, nota_bimestral\)
            media = round\(\(maior_nota \* 0\.6\) \+ \(recuperacao \* 0\.4\), 1\)
        else:
            # Senão, média simples entre mensal e bimestral
            media = round\(\(nota_mensal \+ nota_bimestral\) / 2, 1\) if \(nota_mensal > 0 or nota_bimestral > 0\) else 0"""
        
        # Código de substituição para a rota POST
        post_replacement = """# Calcular média usando a fórmula correta
        nota_mensal = nota.nota_mensal or 0
        nota_bimestral = nota.nota_bimestral or 0
        recuperacao = nota.recuperacao or 0
        
        # Calcular média inicial
        if nota_mensal > 0 and nota_bimestral > 0:
            # Se ambas as notas estão presentes, a média é a média aritmética
            media = round((nota_mensal + nota_bimestral) / 2, 1)
        elif nota_mensal > 0:
            media = nota_mensal
        elif nota_bimestral > 0:
            media = nota_bimestral
        else:
            media = 0
        
        # Se tem recuperação, a média final é a média entre a média anterior e a nota de recuperação
        if recuperacao > 0:
            media = round((media + recuperacao) / 2, 1)"""
        
        # Padrão de código a ser substituído - Rota PUT
        put_pattern = r"""# Calcular média
        nota_mensal = nota\.nota_mensal or 0
        nota_bimestral = nota\.nota_bimestral or 0
        recuperacao = nota\.recuperacao or 0
        
        # Se tem recuperação, considera na média \(60% maior nota \+ 40% recuperação\)
        if recuperacao > 0:
            maior_nota = max\(nota_mensal, nota_bimestral\)
            media = round\(\(maior_nota \* 0\.6\) \+ \(recuperacao \* 0\.4\), 1\)
        else:
            # Senão, média simples entre mensal e bimestral
            media = round\(\(nota_mensal \+ nota_bimestral\) / 2, 1\) if \(nota_mensal > 0 or nota_bimestral > 0\) else 0"""
        
        # Código de substituição para a rota PUT
        put_replacement = """# Calcular média usando a fórmula correta
        nota_mensal = nota.nota_mensal or 0
        nota_bimestral = nota.nota_bimestral or 0
        recuperacao = nota.recuperacao or 0
        
        # Verificar se o parâmetro override_media está presente
        # Se estiver, usar o valor de media fornecido pelo cliente
        if request.query_params.get('override_media') == 'true' and nota.media is not None:
            media = nota.media
            print(f"Usando média fornecida pelo cliente: {media}")
        else:
            # Calcular média inicial
            if nota_mensal > 0 and nota_bimestral > 0:
                # Se ambas as notas estão presentes, a média é a média aritmética
                media = round((nota_mensal + nota_bimestral) / 2, 1)
            elif nota_mensal > 0:
                media = nota_mensal
            elif nota_bimestral > 0:
                media = nota_bimestral
            else:
                media = 0
            
            # Se tem recuperação, a média final é a média entre a média anterior e a nota de recuperação
            if recuperacao > 0:
                media = round((media + recuperacao) / 2, 1)"""
        
        # Realizar as substituições usando expressões regulares flexíveis
        # Procurar blocos de código que incluam os padrões específicos
        
        # Substituição na rota POST
        new_content = re.sub(
            r'(# Calcular média\s+nota_mensal = nota\.nota_mensal or 0\s+nota_bimestral = nota\.nota_bimestral or 0\s+recuperacao = nota\.recuperacao or 0.*?média simples entre mensal e bimestral.*?(\s+media = round\(\(nota_mensal \+ nota_bimestral\) / 2, 1\) if \(nota_mensal > 0 or nota_bimestral > 0\) else 0))',
            post_replacement,
            content,
            flags=re.DOTALL | re.MULTILINE
        )
        
        # Substituição na rota PUT
        new_content = re.sub(
            r'(# Calcular média\s+nota_mensal = nota\.nota_mensal or 0\s+nota_bimestral = nota\.nota_bimestral or 0\s+recuperacao = nota\.recuperacao or 0.*?média simples entre mensal e bimestral.*?(\s+media = round\(\(nota_mensal \+ nota_bimestral\) / 2, 1\) if \(nota_mensal > 0 or nota_bimestral > 0\) else 0))',
            put_replacement,
            new_content,
            flags=re.DOTALL | re.MULTILINE
        )
        
        # Se o conteúdo foi alterado, salvar o arquivo
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
                
            print("Arquivo modificado com sucesso!")
            return True
        else:
            print("Nenhuma alteração foi feita no arquivo. Verifique os padrões de busca.")
            return False
            
    except Exception as e:
        print(f"Erro ao modificar o arquivo: {e}")
        return False

def add_override_media_parameter(file_path):
    """Adiciona o parâmetro override_media à rota PUT"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Padrão para encontrar a definição da rota PUT
        put_route_pattern = r'@app\.put\("/api/notas/\{nota_id\}", response_model=Nota\)\s+def update_nota\(nota_id: int, nota: NotaUpdate\):'
        
        # Substituição para adicionar o parâmetro query
        put_route_replacement = '@app.put("/api/notas/{nota_id}", response_model=Nota)\ndef update_nota(nota_id: int, nota: NotaUpdate, request: Request):'
        
        # Realizar a substituição
        new_content = re.sub(put_route_pattern, put_route_replacement, content)
        
        # Adicionar import da classe Request se não existir
        if 'from fastapi import Request' not in content and 'import Request' not in content:
            import_pattern = r'from fastapi import .*'
            import_line = re.search(import_pattern, content)
            
            if import_line:
                original_import = import_line.group(0)
                if 'Request' not in original_import:
                    new_import = original_import.replace('import ', 'import Request, ')
                    new_content = new_content.replace(original_import, new_import)
        
        # Salvar as alterações
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            
            print("Parâmetro 'request' adicionado à rota PUT com sucesso!")
            return True
        else:
            print("Nenhuma alteração foi feita para adicionar o parâmetro 'request'.")
            return False
            
    except Exception as e:
        print(f"Erro ao adicionar parâmetro 'request': {e}")
        return False

if __name__ == "__main__":
    api_file_path = "simplified_api.py"
    
    print("=== PATCHING API FILE ===")
    
    # Verificar se o arquivo existe
    if not os.path.exists(api_file_path):
        print(f"Arquivo não encontrado: {api_file_path}")
        print("Certifique-se de estar executando este script no diretório correto.")
        exit(1)
    
    # Primeiro adicionar o parâmetro request
    request_added = add_override_media_parameter(api_file_path)
    
    # Depois modificar o cálculo de média
    if patch_api_file(api_file_path):
        print("\nArquivo da API modificado com sucesso!")
        print("\nPróximos passos:")
        print("1. Execute o script fix_media_direct.py para corrigir as médias existentes")
        print("2. Reinicie a API para aplicar as mudanças")
    else:
        print("\nFalha ao modificar o arquivo da API.")
        print("Por favor, verifique o código e tente novamente.")
        
    print("\n=== PROCESSO CONCLUÍDO ===") 