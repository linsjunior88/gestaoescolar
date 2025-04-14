-- Inserção de Relacionamentos Turma-Disciplina
INSERT INTO turma_disciplina (id_disciplina, id_turma)
VALUES 
    ('CIE', '01AM'),
    ('CIE', '01AT'),
    ('ING', '02AM'),
    ('MAT', '01AM'),
    ('MAT', '01AT'),
    ('MAT', '02AM'),
    ('MAT', '02AT'),
    ('POR', '01AM'),
    ('POR', '01AT'),
    ('POR', '02AM'),
    ('POR', '02AT'),
    ('HIS', '01AM'),
    ('HIS', '02AT'),
    ('GEO', '01AT'),
    ('GEO', '02AM')
ON CONFLICT (id_disciplina, id_turma) DO NOTHING; 