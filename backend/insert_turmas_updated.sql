-- Inserção de Turmas com a nova estrutura
INSERT INTO turma (id_turma, serie, turno, tipo_turma, coordenador)
VALUES 
    ('01AM', '1 PERIODO', 'MANHA', 'NORMAL', 'GIRLENE ADRIANO DOS ANJOS'),
    ('01AT', '1 PERIODO', 'TARDE', 'EJA', 'GIRLENE ADRIANO DOS ANJOS'),
    ('02AM', '2 PERIODO', 'MANHA', 'MULTI_SERIADO_EJA', 'GIRLENE ADRIANO DOS ANJOS'),
    ('02AT', '2 PERIODO', 'TARDE', 'NORMAL', 'GIRLENE ADRIANO DOS ANJOS')
ON CONFLICT (id_turma) DO UPDATE 
SET serie = EXCLUDED.serie,
    turno = EXCLUDED.turno,
    tipo_turma = EXCLUDED.tipo_turma,
    coordenador = EXCLUDED.coordenador; 