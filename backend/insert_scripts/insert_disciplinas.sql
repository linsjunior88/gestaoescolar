-- Inserção de Disciplinas
INSERT INTO disciplina (id_disciplina, nome_disciplina, carga_horaria)
VALUES 
    ('MAT', 'MATEMATICA', 60),
    ('POR', 'PORTUGUES', 30),
    ('HIS', 'HISTORIA', 60),
    ('GEO', 'GEOGRAFIA', 40),
    ('CIE', 'CIENCIAS', 40),
    ('ART', 'ARTES', 40),
    ('REL', 'RELIGIAO', 30),
    ('ING', 'INGLES', 30),
    ('EDF', 'ED FISICA', 30)
ON CONFLICT (id_disciplina) DO UPDATE 
SET nome_disciplina = EXCLUDED.nome_disciplina,
    carga_horaria = EXCLUDED.carga_horaria; 