-- Check and create table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'professor_disciplina_turma'
    ) THEN
        CREATE TABLE professor_disciplina_turma (
            id SERIAL PRIMARY KEY,
            id_professor VARCHAR(20) NOT NULL,
            id_disciplina VARCHAR(20) NOT NULL,
            id_turma VARCHAR(20) NOT NULL,
            UNIQUE(id_professor, id_disciplina, id_turma)
        );
        RAISE NOTICE 'Table professor_disciplina_turma created';
    ELSE
        RAISE NOTICE 'Table professor_disciplina_turma already exists';
    END IF;
END $$;

-- Add relationships for PROF002 (only if they don't already exist)
INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
VALUES ('PROF002', 'PORT', '1A')
ON CONFLICT (id_professor, id_disciplina, id_turma) DO NOTHING;

INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
VALUES ('PROF002', 'PORT', '2A')
ON CONFLICT (id_professor, id_disciplina, id_turma) DO NOTHING;

INSERT INTO professor_disciplina_turma (id_professor, id_disciplina, id_turma)
VALUES ('PROF002', 'PORT', '3A')
ON CONFLICT (id_professor, id_disciplina, id_turma) DO NOTHING;

-- Count relationships
SELECT COUNT(*) AS total_relationships FROM professor_disciplina_turma;

-- List all relationships for PROF002
SELECT 
    p.id_professor, 
    p.nome_professor, 
    d.id_disciplina, 
    d.nome_disciplina, 
    t.id_turma, 
    t.serie
FROM 
    professor_disciplina_turma pdt
JOIN 
    professor p ON pdt.id_professor = p.id_professor
JOIN 
    disciplina d ON pdt.id_disciplina = d.id_disciplina
JOIN 
    turma t ON pdt.id_turma = t.id_turma
WHERE 
    p.id_professor = 'PROF002'
ORDER BY 
    p.id_professor, d.id_disciplina, t.id_turma; 