-- Primeiro, execute os comandos a seguir para obter os IDs necessários:

-- IDs dos professores
SELECT id, id_professor FROM professor ORDER BY id;

-- IDs das disciplinas
SELECT id, id_disciplina FROM disciplina ORDER BY id;

-- IDs das turmas
SELECT id, id_turma FROM turma ORDER BY id;

-- Depois, substitua os valores pelos IDs reais obtidos nas consultas acima
-- Inserção de Disciplina-Professor (atribuições)
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