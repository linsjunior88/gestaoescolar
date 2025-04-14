-- Inserção de Professores
INSERT INTO professor (id_professor, nome_professor, email_professor)
VALUES 
    ('P001', 'João Silva', 'teste@teste.com'),
    ('P003', 'Elda Maria', 'elda@google.com')
ON CONFLICT (id_professor) DO UPDATE 
SET nome_professor = EXCLUDED.nome_professor,
    email_professor = EXCLUDED.email_professor; 