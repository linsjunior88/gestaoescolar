from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import traceback

# Importações simplificadas
from app.core.config import settings
from app.api.api import api_router
from app.core.exceptions import register_exception_handlers

# Cria a aplicação FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API para o sistema de gestão escolar",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)

# Adiciona os routers da API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Adicionar manipulador de exceções global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Manipulador global de exceções não tratadas
    """
    # Logar o erro para diagnóstico
    print(f"Erro não tratado: {exc}")
    traceback.print_exc()
    
    # Retornar resposta amigável ao usuário
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocorreu um erro interno. Por favor, tente novamente mais tarde."}
    )

# Melhorar o manipulador de exceções de validação
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Manipulador para erros de validação de entrada
    """
    errors = []
    for error in exc.errors():
        error_msg = {
            "loc": error.get("loc", []),
            "msg": error.get("msg", ""),
            "type": error.get("type", "")
        }
        errors.append(error_msg)
    
    return JSONResponse(
        status_code=422,
        content={"detail": "Erro de validação dos dados", "errors": errors}
    )

# Rota padrão para verificar se a API está funcionando
@app.get("/")
async def root():
    """
    Rota raiz da API, exibe informações básicas sobre a API.
    """
    return JSONResponse(
        content={
            "status": "success",
            "message": "Sistema de Gestão Escolar API",
            "version": "1.0.0",
            "documentation": "/docs",
        }
    )

@app.get("/health")
async def health_check():
    return JSONResponse(
        content={
            "status": "success",
            "message": "Servidor funcionando normalmente",
        }
    )

if __name__ == "__main__":
    # Iniciar o servidor na porta 3000
    uvicorn.run("app.main:app", host="0.0.0.0", port=3000, reload=True)
    print("Servidor iniciado em http://localhost:3000") 