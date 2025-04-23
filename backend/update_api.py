"""
Script para atualizar a API FastAPI
Este script atualiza a API principal com as novas configurações
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

def atualizar_api():
    """
    Atualiza os arquivos da API com as versões otimizadas
    """
    try:
        # Caminho base do projeto
        base_path = os.path.dirname(os.path.abspath(__file__))
        
        # Fazer backup do arquivo original
        api_original = os.path.join(base_path, "simplified_api.py")
        api_backup = os.path.join(base_path, "simplified_api.py.bak")
        
        if os.path.exists(api_original):
            logger.info(f"Fazendo backup de {api_original} para {api_backup}")
            shutil.copy2(api_original, api_backup)
        
        # Substituir pelo arquivo atualizado
        api_updated = os.path.join(base_path, "simplified_api_updated.py")
        if os.path.exists(api_updated):
            logger.info(f"Atualizando API principal com a versão otimizada")
            shutil.copy2(api_updated, api_original)
            logger.info("API atualizada com sucesso")
        else:
            logger.error(f"Arquivo atualizado não encontrado: {api_updated}")
            return False
        
        # Inicializar o banco de dados
        logger.info("Inicializando banco de dados...")
        from init_db import inicializar_banco_dados
        db_status = inicializar_banco_dados()
        
        if db_status:
            logger.info("Banco de dados inicializado com sucesso")
        else:
            logger.warning("Falha na inicialização do banco de dados")
        
        return True
    
    except Exception as e:
        logger.error(f"Erro ao atualizar API: {e}")
        return False

if __name__ == "__main__":
    if atualizar_api():
        logger.info("Atualização da API concluída com sucesso")
    else:
        logger.error("Falha na atualização da API")
