-- Inserção de Relacionamentos Professor-Disciplina-Turma
INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
VALUES 
    -- Elda Maria (P003) leciona Ciências
    ('P003', 'CIE', '01AM'),
    ('P003', 'CIE', '01AT'),
    
    -- Elda Maria (P003) leciona Matemática
    ('P003', 'MAT', '01AM'),
    ('P003', 'MAT', '01AT'),
    ('P003', 'MAT', '02AM'),
    
    -- João Silva (P001) leciona Português
    ('P001', 'POR', '01AM'),
    ('P001', 'POR', '01AT'),
    ('P001', 'POR', '02AM')
ON CONFLICT (id_professor, id_disciplina, id_turma) DO NOTHING; 