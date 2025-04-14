-- Primeiro, execute os comandos a seguir para obter os IDs das turmas:
SELECT id FROM turma WHERE id_turma = 'T001';
SELECT id FROM turma WHERE id_turma = 'T002';
SELECT id FROM turma WHERE id_turma = 'T003';
SELECT id FROM turma WHERE id_turma = 'T004';
SELECT id FROM turma WHERE id_turma = 'T005';

-- Depois, substitua os valores (1, 2, 3, 4, 5) pelos IDs reais obtidos nas consultas acima
-- Inserção de Alunos
INSERT INTO aluno (id_aluno, nome, data_nasc, id_turma, ativo)
VALUES
    ('A001', 'Pedro Alves', '2018-03-15', 1, TRUE),      -- Aluno do 1º Ano (T001)
    ('A002', 'Mariana Costa', '2018-05-22', 1, TRUE),    -- Aluno do 1º Ano (T001)
    ('A003', 'Lucas Ferreira', '2017-09-10', 2, TRUE),   -- Aluno do 2º Ano (T002)
    ('A004', 'Isabela Martins', '2017-07-05', 2, TRUE),  -- Aluno do 2º Ano (T002)
    ('A005', 'Gabriel Souza', '2016-11-18', 3, TRUE),    -- Aluno do 3º Ano (T003)
    ('A006', 'Sophia Ribeiro', '2016-02-28', 3, TRUE),   -- Aluno do 3º Ano (T003)
    ('A007', 'Mateus Gomes', '2015-12-07', 4, TRUE),     -- Aluno do 4º Ano (T004)
    ('A008', 'Laura Dias', '2015-04-17', 4, TRUE),       -- Aluno do 4º Ano (T004)
    ('A009', 'Rafael Castro', '2014-08-25', 5, TRUE),    -- Aluno do 5º Ano (T005)
    ('A010', 'Valentina Cardoso', '2014-06-12', 5, TRUE) -- Aluno do 5º Ano (T005)
ON CONFLICT (id_aluno) DO UPDATE 
SET nome = EXCLUDED.nome, 
    data_nasc = EXCLUDED.data_nasc, 
    id_turma = EXCLUDED.id_turma, 
    ativo = EXCLUDED.ativo; 