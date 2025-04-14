-- ===== 1. INSERT TURMAS =====
INSERT INTO turma (id_turma, nome, ano, ativo)
VALUES 
    ('T001', '1º Ano A', 2025, TRUE),
    ('T002', '2º Ano A', 2025, TRUE),
    ('T003', '3º Ano A', 2025, TRUE),
    ('T004', '4º Ano A', 2025, TRUE),
    ('T005', '5º Ano A', 2025, TRUE)
ON CONFLICT (id_turma) DO UPDATE 
SET nome = EXCLUDED.nome, 
    ano = EXCLUDED.ano, 
    ativo = EXCLUDED.ativo;

-- ===== 2. INSERT DISCIPLINAS =====
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

-- ===== 3. INSERT PROFESSORES =====
-- IMPORTANTE: as senhas devem ser hasheadas em produção!
INSERT INTO professor (id_professor, nome, email, senha, ativo)
VALUES 
    ('P001', 'Maria Silva', 'maria.silva@escola.edu.br', 'senha123', TRUE),
    ('P002', 'João Santos', 'joao.santos@escola.edu.br', 'senha123', TRUE),
    ('P003', 'Ana Oliveira', 'ana.oliveira@escola.edu.br', 'senha123', TRUE),
    ('P004', 'Carlos Pereira', 'carlos.pereira@escola.edu.br', 'senha123', TRUE),
    ('P005', 'Juliana Lima', 'juliana.lima@escola.edu.br', 'senha123', TRUE)
ON CONFLICT (id_professor) DO UPDATE 
SET nome = EXCLUDED.nome, 
    email = EXCLUDED.email, 
    senha = EXCLUDED.senha, 
    ativo = EXCLUDED.ativo;

-- ===== 4. INSERT ALUNOS =====
-- Precisamos primeiro obter os IDs das turmas a partir dos códigos (id_turma)
-- Estes SELECTs podem ser usados para encontrar os IDs antes de executar os inserts:
/*
    SELECT id FROM turma WHERE id_turma = 'T001';
    SELECT id FROM turma WHERE id_turma = 'T002';
    SELECT id FROM turma WHERE id_turma = 'T003';
    SELECT id FROM turma WHERE id_turma = 'T004';
    SELECT id FROM turma WHERE id_turma = 'T005';
*/

-- Substitua os valores [TURMA_ID] pelos IDs obtidos nas consultas acima
-- Exemplo assumindo que os IDs das turmas são de 1 a 5:
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

-- ===== 5. INSERT DISCIPLINA_PROFESSOR =====
-- Precisamos primeiro obter os IDs das entidades a partir dos códigos
-- Estes SELECTs podem ser usados para encontrar os IDs antes de executar os inserts:
/*
    -- IDs dos professores
    SELECT id FROM professor WHERE id_professor = 'P001';
    SELECT id FROM professor WHERE id_professor = 'P002';
    SELECT id FROM professor WHERE id_professor = 'P003';
    SELECT id FROM professor WHERE id_professor = 'P004';
    SELECT id FROM professor WHERE id_professor = 'P005';
    
    -- IDs das disciplinas
    SELECT id FROM disciplina WHERE id_disciplina = 'D001';
    SELECT id FROM disciplina WHERE id_disciplina = 'D002';
    SELECT id FROM disciplina WHERE id_disciplina = 'D003';
    SELECT id FROM disciplina WHERE id_disciplina = 'D004';
    SELECT id FROM disciplina WHERE id_disciplina = 'D005';
    SELECT id FROM disciplina WHERE id_disciplina = 'D006';
    SELECT id FROM disciplina WHERE id_disciplina = 'D007';
    
    -- IDs das turmas
    SELECT id FROM turma WHERE id_turma = 'T001';
    SELECT id FROM turma WHERE id_turma = 'T002';
    SELECT id FROM turma WHERE id_turma = 'T003';
    SELECT id FROM turma WHERE id_turma = 'T004';
    SELECT id FROM turma WHERE id_turma = 'T005';
*/

-- Substitua os valores [PROFESSOR_ID], [DISCIPLINA_ID] e [TURMA_ID] pelos IDs obtidos nas consultas acima
-- Exemplo assumindo ids específicos (você precisará ajustar com os valores reais):
INSERT INTO disciplina_professor (professor_id, disciplina_id, turma_id)
VALUES
    (1, 1, 1),  -- Maria (P001) ensina Português (D001) para 1º Ano (T001)
    (1, 1, 2),  -- Maria (P001) ensina Português (D001) para 2º Ano (T002)
    (2, 2, 1),  -- João (P002) ensina Matemática (D002) para 1º Ano (T001)
    (2, 2, 2),  -- João (P002) ensina Matemática (D002) para 2º Ano (T002)
    (3, 3, 1),  -- Ana (P003) ensina Ciências (D003) para 1º Ano (T001)
    (4, 4, 3),  -- Carlos (P004) ensina História (D004) para 3º Ano (T003)
    (5, 5, 3),  -- Juliana (P005) ensina Geografia (D005) para 3º Ano (T003)
    (3, 6, 4),  -- Ana (P003) ensina Ed. Física (D006) para 4º Ano (T004)
    (5, 7, 5)   -- Juliana (P005) ensina Artes (D007) para 5º Ano (T005)
ON CONFLICT (professor_id, disciplina_id, turma_id) DO NOTHING; 