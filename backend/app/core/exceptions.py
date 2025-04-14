from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class CustomAPIException(Exception):
    """Base class for API exceptions."""
    
    def __init__(
        self, 
        status_code: int, 
        message: str, 
        detail: str = None
    ):
        self.status_code = status_code
        self.message = message
        self.detail = detail
        super().__init__(self.message)


class DatabaseConnectionError(CustomAPIException):
    """Exception raised when database connection fails."""
    
    def __init__(self, detail: str = None):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            message="Falha na conexão com o banco de dados",
            detail=detail
        )


class ItemNotFoundError(CustomAPIException):
    """Exception raised when an item is not found."""
    
    def __init__(self, item_type: str, identifier: str, detail: str = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"{item_type} não encontrado com identificador: {identifier}",
            detail=detail
        )


class AuthenticationError(CustomAPIException):
    """Exception raised for authentication issues."""
    
    def __init__(self, detail: str = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message="Falha na autenticação",
            detail=detail
        )


class AuthorizationError(CustomAPIException):
    """Exception raised for authorization issues."""
    
    def __init__(self, detail: str = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Operação não autorizada",
            detail=detail
        )


class ValidationError(CustomAPIException):
    """Exception raised for validation errors."""
    
    def __init__(self, detail: str = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message="Erro de validação dos dados",
            detail=detail
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register exception handlers for the FastAPI app."""
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "status": "error",
                "message": "Erro de validação dos dados",
                "detail": exc.errors(),
            },
        )
    
    @app.exception_handler(CustomAPIException)
    async def custom_exception_handler(request: Request, exc: CustomAPIException):
        content = {
            "status": "error",
            "message": exc.message
        }
        if exc.detail:
            content["detail"] = exc.detail
        
        return JSONResponse(
            status_code=exc.status_code,
            content=content,
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": "Erro interno do servidor",
                "detail": str(exc),
            },
        ) 