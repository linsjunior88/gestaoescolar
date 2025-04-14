-- Inserção de Professores
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