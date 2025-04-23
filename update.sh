#!/bin/bash

# Script de instalação e atualização do Sistema de Gestão Escolar
# Este script aplica todas as melhorias e atualizações ao projeto

echo "=== Sistema de Gestão Escolar - Script de Atualização ==="
echo "Iniciando processo de atualização..."

# Definir diretório base
BASE_DIR=$(pwd)
BACKEND_DIR="$BASE_DIR/backend"

# Verificar se estamos no diretório correto
if [ ! -d "$BACKEND_DIR" ]; then
    echo "Erro: Execute este script no diretório raiz do projeto."
    exit 1
fi

echo "1. Atualizando arquivos HTML..."
# Atualizar arquivo HTML principal
if [ -f "$BASE_DIR/escola-dashboard-updated.html" ]; then
    cp "$BASE_DIR/escola-dashboard-updated.html" "$BASE_DIR/escola-dashboard.html"
    echo "   - Arquivo HTML principal atualizado com sucesso."
else
    echo "   - Arquivo HTML atualizado não encontrado. Pulando."
fi

echo "2. Atualizando configuração da API..."
# Executar script de atualização da API
cd "$BACKEND_DIR"
if [ -f "update_api.py" ]; then
    python update_api.py
    echo "   - API atualizada com sucesso."
else
    echo "   - Script de atualização da API não encontrado. Pulando."
fi

echo "3. Atualizando configuração de deploy..."
# Executar script de atualização da configuração de deploy
if [ -f "update_render_config.py" ]; then
    python update_render_config.py
    echo "   - Configuração de deploy atualizada com sucesso."
else
    echo "   - Script de atualização da configuração de deploy não encontrado. Pulando."
fi

echo "4. Verificando banco de dados..."
# Inicializar banco de dados
if [ -f "init_db.py" ]; then
    python init_db.py
    echo "   - Banco de dados verificado/inicializado com sucesso."
else
    echo "   - Script de inicialização do banco de dados não encontrado. Pulando."
fi

echo "5. Limpando arquivos temporários..."
# Remover arquivos temporários e de backup
find "$BASE_DIR" -name "*.bak" -type f -delete
find "$BASE_DIR" -name "*_updated.py" -type f -delete
if [ -f "$BASE_DIR/render.yaml.updated" ]; then
    rm "$BASE_DIR/render.yaml.updated"
fi
echo "   - Arquivos temporários removidos com sucesso."

echo "=== Atualização concluída com sucesso! ==="
echo "O Sistema de Gestão Escolar foi atualizado e está pronto para uso."
echo "Para iniciar a API localmente, execute:"
echo "   cd backend && python -m uvicorn simplified_api:app --reload"
echo "Para acessar o sistema, abra o arquivo escola-dashboard.html no navegador."
echo "Consulte a documentação.md para mais informações."
