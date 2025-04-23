/**
 * Arquivo de configuração CORS para a API FastAPI
 * Este arquivo será importado pela API para permitir acesso de múltiplos domínios
 */

from fastapi.middleware.cors import CORSMiddleware

def configurar_cors(app):
    """
    Configura o middleware CORS para a aplicação FastAPI
    
    Args:
        app: Instância da aplicação FastAPI
    """
    # Configuração de CORS para permitir acesso do frontend
    app.add_middleware(
        CORSMiddleware,
        # Permitir acesso de múltiplos domínios, incluindo localhost para desenvolvimento
        # e os domínios do Render para produção
        allow_origins=[
            "http://localhost:8000",
            "http://localhost:3000",
            "http://localhost:4000",
            "http://localhost:5000",
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://127.0.0.1:8000",
            "https://gestao-escolar-frontend.onrender.com",
            "https://gestao-escolar-frontend-n9aq.onrender.com",
            "https://gestao-escolar-api.onrender.com"
        ],
        allow_credentials=True,
        allow_methods=["*"],  # Permitir todos os métodos HTTP
        allow_headers=["*"],  # Permitir todos os cabeçalhos
    )
    
    return app
