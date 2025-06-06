-- Script para adicionar coluna 'ativo' à tabela professor
-- Execute este script no banco de dados de produção

-- Verificar se a coluna já existe (para SQLite)
-- Para PostgreSQL ou MySQL, você pode verificar o information_schema

-- Adicionar coluna ativo se não existir
ALTER TABLE professor ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- Atualizar todos os registros existentes para ativo = TRUE
UPDATE professor SET ativo = TRUE WHERE ativo IS NULL;

-- Adicionar outras colunas caso não existam
ALTER TABLE professor ADD COLUMN senha_professor TEXT;
ALTER TABLE professor ADD COLUMN especialidade TEXT;

-- Verificar estrutura final
-- Para SQLite:
PRAGMA table_info(professor);

-- Para PostgreSQL:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'professor';

-- Mostrar alguns registros para verificar
SELECT id_professor, nome_professor, ativo FROM professor LIMIT 5; 