-- =====================================================
-- SCRIPT PARA INSERIR ESCOLA DE EXEMPLO
-- =====================================================

-- Inserir escola EMEF Nazaré Rodrigues
INSERT INTO escolas (
    codigo_inep,
    cnpj,
    razao_social,
    nome_fantasia,
    cep,
    logradouro,
    numero,
    bairro,
    cidade,
    uf,
    telefone_principal,
    email_principal,
    dependencia_administrativa,
    situacao_funcionamento,
    localizacao,
    gestor_nome,
    gestor_email,
    ativo
) VALUES (
    '12345678',  -- Código INEP da escola (8 dígitos)
    '12345678000123',  -- CNPJ da escola
    'ESCOLA MUNICIPAL DE ENSINO FUNDAMENTAL NAZARÉ RODRIGUES',
    'EMEF Nazaré Rodrigues',
    '12345678',  -- CEP
    'Rua Principal',
    '123',
    'Centro',
    'Cidade Exemplo',
    'EX',
    '(11) 1234-5678',
    'emef.nazare@educacao.cidade.gov.br',
    'Municipal',
    'Em Atividade',
    'Urbana',
    'João Silva',
    'joao.silva@educacao.cidade.gov.br',
    TRUE
);

-- Verificar se a inserção foi bem-sucedida
SELECT 
    id_escola,
    codigo_inep,
    razao_social,
    nome_fantasia,
    cidade,
    uf,
    ativo,
    data_cadastro
FROM escolas 
WHERE codigo_inep = '12345678'; 