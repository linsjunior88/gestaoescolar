-- Inserção de Disciplinas
INSERT INTO disciplina (id_disciplina, nome, descricao, carga_horaria, ativo)
VALUES 
    ('D001', 'Português', 'Língua Portuguesa e Literatura', 80, TRUE),
    ('D002', 'Matemática', 'Matemática Básica', 80, TRUE),
    ('D003', 'Ciências', 'Ciências Naturais', 60, TRUE),
    ('D004', 'História', 'História Geral e do Brasil', 60, TRUE),
    ('D005', 'Geografia', 'Geografia Geral e do Brasil', 60, TRUE),
    ('D006', 'Educação Física', 'Práticas Esportivas', 40, TRUE),
    ('D007', 'Artes', 'Artes Visuais e Música', 40, TRUE)
ON CONFLICT (id_disciplina) DO UPDATE 
SET nome = EXCLUDED.nome, 
    descricao = EXCLUDED.descricao, 
    carga_horaria = EXCLUDED.carga_horaria, 
    ativo = EXCLUDED.ativo; 