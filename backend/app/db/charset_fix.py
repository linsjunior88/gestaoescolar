"""
Módulo para corrigir problemas de codificação de caracteres na conexão com o PostgreSQL.
"""
import psycopg2
import psycopg2.extensions

def register_unicode():
    """
    Registra o tipo unicode para garantir que o PostgreSQL trabalhe corretamente com caracteres especiais.
    Deve ser chamado antes de iniciar qualquer conexão com o banco de dados.
    """
    psycopg2.extensions.register_type(psycopg2.extensions.UNICODE)
    psycopg2.extensions.register_type(psycopg2.extensions.UNICODEARRAY)
    print("Configuração Unicode registrada para conexões PostgreSQL") 