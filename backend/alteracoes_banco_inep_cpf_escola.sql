-- =====================================================
-- SCRIPT DE ALTERAÇÕES: CÓDIGO INEP, CPF E TABELA ESCOLA
-- =====================================================

-- 1. ADICIONAR CAMPO CODIGO_INEP NA TABELA ALUNOS
-- Campo para armazenar o código INEP do aluno (12 dígitos numéricos)
ALTER TABLE alunos ADD COLUMN codigo_inep VARCHAR(12);

-- Comentário da coluna para documentação
COMMENT ON COLUMN alunos.codigo_inep IS 'Código INEP do Aluno - 12 dígitos numéricos';

-- 2. ADICIONAR CAMPO CPF NA TABELA PROFESSORES  
-- Campo para armazenar o CPF do professor (11 dígitos numéricos)
ALTER TABLE professores ADD COLUMN cpf VARCHAR(11);

-- Comentário da coluna para documentação
COMMENT ON COLUMN professores.cpf IS 'CPF do Professor - 11 dígitos numéricos';

-- 3. CRIAR TABELA ESCOLAS
-- Tabela para armazenar informações completas das escolas
CREATE TABLE escolas (
    -- Chave Primária Interna
    id_escola SERIAL PRIMARY KEY,

    -- Identificadores Oficiais (Não podem se repetir)
    codigo_inep VARCHAR(8) UNIQUE NOT NULL,
    cnpj VARCHAR(14) UNIQUE,

    -- Dados Cadastrais da Escola
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    logo VARCHAR(255), -- Caminho do arquivo de logo

    -- Endereço Completo
    cep VARCHAR(8),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),

    -- Contatos
    telefone_principal VARCHAR(20),
    telefone_secundario VARCHAR(20),
    email_principal VARCHAR(255),

    -- Classificação (MEC/INEP)
    dependencia_administrativa VARCHAR(20) DEFAULT 'Municipal' NOT NULL,
    situacao_funcionamento VARCHAR(20) DEFAULT 'Em Atividade' NOT NULL,
    localizacao VARCHAR(10) NOT NULL,
    ato_autorizacao VARCHAR(100),

    -- Dados do Gestor Responsável
    gestor_nome VARCHAR(255),
    gestor_cpf VARCHAR(11),
    gestor_email VARCHAR(255),

    -- Campos de Controle/Auditoria
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comentários das colunas para documentação
COMMENT ON TABLE escolas IS 'Tabela de escolas com informações completas do MEC/INEP';
COMMENT ON COLUMN escolas.codigo_inep IS 'Código INEP da Escola - 8 dígitos (identificador único nacional)';
COMMENT ON COLUMN escolas.cnpj IS 'CNPJ da escola - 14 dígitos';
COMMENT ON COLUMN escolas.dependencia_administrativa IS 'Municipal, Estadual, Federal ou Privada';
COMMENT ON COLUMN escolas.situacao_funcionamento IS 'Em Atividade, Paralisada ou Extinta';
COMMENT ON COLUMN escolas.localizacao IS 'Urbana ou Rural';

-- Índices para melhor performance
CREATE INDEX idx_escolas_codigo_inep ON escolas(codigo_inep);
CREATE INDEX idx_escolas_cnpj ON escolas(cnpj);
CREATE INDEX idx_escolas_ativo ON escolas(ativo);
CREATE INDEX idx_escolas_dependencia ON escolas(dependencia_administrativa);
CREATE INDEX idx_escolas_situacao ON escolas(situacao_funcionamento);

-- 4. TRIGGER PARA ATUALIZAR DATA_ATUALIZACAO AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela escolas
CREATE TRIGGER trigger_update_escolas_data_atualizacao
    BEFORE UPDATE ON escolas
    FOR EACH ROW
    EXECUTE FUNCTION update_data_atualizacao();

-- 5. INSERIR DADOS DE EXEMPLO (OPCIONAL)
-- Escola de exemplo para testes
INSERT INTO escolas (
    codigo_inep, 
    cnpj, 
    razao_social, 
    nome_fantasia, 
    localizacao,
    dependencia_administrativa,
    situacao_funcionamento,
    cidade,
    uf,
    gestor_nome,
    email_principal
) VALUES (
    '12345678',
    '12345678000199',
    'ESCOLA MUNICIPAL NAZARE RODRIGUES',
    'EMEF NAZARÉ RODRIGUES',
    'Urbana',
    'Municipal',
    'Em Atividade',
    'São Paulo',
    'SP',
    'Diretor da Escola',
    'contato@emefnazarerodrigues.edu.br'
);

-- 6. VERIFICAÇÕES FINAIS
-- Verificar se as colunas foram criadas corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('alunos', 'professores', 'escolas')
    AND column_name IN ('codigo_inep', 'cpf')
ORDER BY table_name, column_name;

-- Verificar estrutura da tabela escolas
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'escolas'
ORDER BY ordinal_position;

-- Verificar índices criados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'escolas'; 