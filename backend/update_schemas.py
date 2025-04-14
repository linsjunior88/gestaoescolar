#!/usr/bin/env python3
"""
Script para atualizar automaticamente os schemas do projeto para Pydantic 2.x

Este script percorre os arquivos Python nos diretórios especificados
e atualiza os imports e configurações relacionados ao Pydantic 1.x para 2.x.
"""

import os
import re
import sys
from pathlib import Path

# Diretórios a serem processados
DIRS_TO_PROCESS = [
    "app/schemas",
    "app/core",
    "app/api",
    "app/models",
]

# Padrões de substituição para imports
IMPORT_PATTERNS = [
    # BaseSettings import
    (r'from pydantic import (.*?)BaseSettings(.*?)', r'from pydantic_settings import BaseSettings\2'),
    (r'from pydantic import BaseSettings(.*?)', r'from pydantic_settings import BaseSettings\1'),
    
    # validator -> field_validator
    (r'from pydantic import (.*?)validator(.*?)', r'from pydantic import \1field_validator\2'),
    (r'@validator\((.*?)pre=True(.*?)\)', r'@field_validator(\1mode="before"\2)'),
    (r'@validator\((.*?)\)', r'@field_validator(\1mode="after")'),
]

# Padrões para Config class -> model_config
CONFIG_PATTERN = re.compile(r'''
    class\s+Config\s*:\s*
    (.*?)
    (?=\n\S|\Z)  # Match until the next non-indented line or end of string
''', re.VERBOSE | re.DOTALL)

def process_config_class(match):
    """Processa a classe Config e converte para model_config."""
    config_content = match.group(1)
    
    # Substituições específicas dentro da Config
    config_content = re.sub(r'orm_mode\s*=\s*True', r'"from_attributes": True', config_content)
    config_content = re.sub(r'allow_population_by_field_name\s*=\s*True', r'"populate_by_name": True', config_content)
    config_content = re.sub(r'schema_extra\s*=\s*(\{.*?\})', r'"json_schema_extra": \1', config_content)
    config_content = re.sub(r'env_file\s*=\s*["\'](.*?)["\']', r'"env_file": "\1"', config_content)
    
    # Formatar como dicionário, mantendo a indentação
    lines = config_content.strip().split('\n')
    indented_lines = []
    
    for line in lines:
        # Ignorar linhas vazias
        if not line.strip():
            continue
        
        # Encontrar a indentação
        indent_match = re.match(r'(\s+)', line)
        base_indent = indent_match.group(1) if indent_match else ''
        
        # Remover a indentação atual para processamento
        stripped_line = line.strip()
        
        if ':' not in stripped_line and '=' in stripped_line:
            # Converter variáveis com atribuição para formato de dicionário
            key, value = stripped_line.split('=', 1)
            indented_lines.append(f'{base_indent}{key.strip()}: {value.strip()}')
        else:
            # Manter linhas que já estão em formato de dicionário
            indented_lines.append(line)
    
    # Formatação final
    formatted_content = '\n'.join(indented_lines)
    # Substituir último caractere de indentação para fechar corretamente o dicionário
    if formatted_content and indented_lines:
        first_line_indent = re.match(r'(\s+)', indented_lines[0]).group(1) if re.match(r'(\s+)', indented_lines[0]) else ''
        formatted_content = f"model_config = {{\n{formatted_content}\n{first_line_indent}}}"
    else:
        formatted_content = "model_config = {}"

    return formatted_content

def update_file(file_path):
    """Atualiza um arquivo aplicando as substituições de Pydantic."""
    print(f"Processando: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Backp do conteúdo original
        backup_path = f"{file_path}.bak"
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Aplicar substituições de imports
        for pattern, replacement in IMPORT_PATTERNS:
            content = re.sub(pattern, replacement, content)
        
        # Aplicar substituições para Config class
        content = CONFIG_PATTERN.sub(process_config_class, content)
        
        # Salvar o arquivo atualizado
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"  ✓ Atualizado com sucesso")
        return True
    
    except Exception as e:
        print(f"  ✗ Erro ao processar {file_path}: {e}")
        # Restaurar do backup se houver erro
        if os.path.exists(backup_path):
            with open(backup_path, 'r', encoding='utf-8') as f:
                original = f.read()
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(original)
            print(f"  ↺ Restaurado do backup")
        return False

def process_directory(directory):
    """Processa todos os arquivos Python em um diretório."""
    base_path = Path(os.getcwd())
    dir_path = base_path / directory
    
    if not dir_path.exists():
        print(f"Diretório não encontrado: {dir_path}")
        return 0
    
    files_processed = 0
    for root, _, files in os.walk(dir_path):
        for file in files:
            if file.endswith('.py'):
                file_path = Path(root) / file
                if update_file(file_path):
                    files_processed += 1
    
    return files_processed

def main():
    """Função principal do script."""
    print("Iniciando atualização de schemas para Pydantic 2.x")
    total_processed = 0
    
    for directory in DIRS_TO_PROCESS:
        print(f"\nProcessando diretório: {directory}")
        processed = process_directory(directory)
        total_processed += processed
        print(f"Arquivos processados em {directory}: {processed}")
    
    print(f"\nTotal de arquivos processados: {total_processed}")
    print("Processo de atualização concluído!")

if __name__ == "__main__":
    main() 