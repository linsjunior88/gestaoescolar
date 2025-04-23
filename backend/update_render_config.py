"""
Script para atualizar a configuração de deploy no Render
Este script atualiza o arquivo render.yaml com as configurações otimizadas
"""
import os
import shutil
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def atualizar_configuracao_render():
    """
    Atualiza o arquivo render.yaml com a versão otimizada
    """
    try:
        # Caminho base do projeto
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Fazer backup do arquivo original
        render_original = os.path.join(base_path, "render.yaml")
        render_backup = os.path.join(base_path, "render.yaml.bak")
        
        if os.path.exists(render_original):
            logger.info(f"Fazendo backup de {render_original} para {render_backup}")
            shutil.copy2(render_original, render_backup)
        
        # Substituir pelo arquivo atualizado
        render_updated = os.path.join(base_path, "render.yaml.updated")
        if os.path.exists(render_updated):
            logger.info(f"Atualizando configuração de deploy com a versão otimizada")
            shutil.copy2(render_updated, render_original)
            logger.info("Configuração de deploy atualizada com sucesso")
        else:
            logger.error(f"Arquivo atualizado não encontrado: {render_updated}")
            return False
        
        return True
    
    except Exception as e:
        logger.error(f"Erro ao atualizar configuração de deploy: {e}")
        return False

if __name__ == "__main__":
    if atualizar_configuracao_render():
        logger.info("Atualização da configuração de deploy concluída com sucesso")
    else:
        logger.error("Falha na atualização da configuração de deploy")
