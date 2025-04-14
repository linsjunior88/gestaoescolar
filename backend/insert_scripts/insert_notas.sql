-- Inserção de Notas
INSERT INTO nota (id_aluno, id_disciplina, id_turma, ano, bimestre, nota_mensal, nota_bimestral, recuperacao, media)
VALUES 
    -- Aluna AMELIA GAET - 1º Bimestre de 2024
    ('100922', 'MAT', '01AM', 2025, 1, 7.50, 8.00, NULL, 7.75),
    ('100922', 'POR', '01AM', 2025, 1, 8.00, 7.50, NULL, 7.75),
    ('100922', 'CIE', '01AM', 2025, 1, 6.00, 7.00, NULL, 6.50),
    
    -- Aluna ANA CECILIA - 1º Bimestre de 2024
    ('100907', 'MAT', '01AM', 2025, 1, 9.00, 8.50, NULL, 8.75),
    ('100907', 'POR', '01AM', 2025, 1, 8.50, 9.00, NULL, 8.75),
    ('100907', 'CIE', '01AM', 2025, 1, 7.50, 8.00, NULL, 7.75),
    
    -- Aluna AMELIA GAET - 2º Bimestre de 2024
    ('100922', 'MAT', '01AM', 2025, 2, 6.50, 7.00, NULL, 6.75),
    ('100922', 'POR', '01AM', 2025, 2, 7.00, 6.50, NULL, 6.75),
    
    -- Aluno JOÃO PEDRO - 1º Bimestre de 2024
    ('96123', 'MAT', '01AT', 2025, 1, 5.00, 4.00, 6.00, 5.00),
    ('96123', 'POR', '01AT', 2025, 1, 4.00, 3.50, 5.50, 4.50),
    
    -- Aluno LUCAS - os 4 Bimestres de 2024 (para mostrar a média final)
    ('91234', 'MAT', '02AM', 2025, 1, 8.00, 9.50, NULL, 8.75),
    ('91234', 'MAT', '02AM', 2025, 2, 7.00, 5.00, NULL, 6.00),
    ('91234', 'MAT', '02AM', 2025, 3, 10.00, 5.00, NULL, 7.50),
    ('91234', 'MAT', '02AM', 2025, 4, 8.00, 4.00, NULL, 6.00)
ON CONFLICT (id_aluno, id_disciplina, ano, bimestre) DO UPDATE 
SET id_turma = EXCLUDED.id_turma,
    nota_mensal = EXCLUDED.nota_mensal,
    nota_bimestral = EXCLUDED.nota_bimestral,
    recuperacao = EXCLUDED.recuperacao,
    media = EXCLUDED.media; 