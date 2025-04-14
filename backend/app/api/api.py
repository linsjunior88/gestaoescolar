from fastapi import APIRouter

from app.api.endpoints import turmas, disciplinas, professores, alunos, notas, auth

api_router = APIRouter()

# Incluir os diversos routers de endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(turmas.router, prefix="/turmas", tags=["Turmas"])
api_router.include_router(disciplinas.router, prefix="/disciplinas", tags=["Disciplinas"])
api_router.include_router(professores.router, prefix="/professores", tags=["Professores"])
api_router.include_router(alunos.router, prefix="/alunos", tags=["Alunos"])
api_router.include_router(notas.router, prefix="/notas", tags=["Notas"]) 