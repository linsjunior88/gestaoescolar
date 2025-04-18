-- Inserção de Alunos
INSERT INTO aluno (id_aluno, nome_aluno, sexo, data_nasc, mae, id_turma)
VALUES 
    ('100922', 'AMELIA GAET AMORIM DOS SANTOS', 'FEMININO', '2020-09-16', 'CARLA DANIELA DE SOUSA AMORIM', '01AM'),
    ('100907', 'ANA CECILIA ROCHA FERNANDES', 'FEMININO', '2020-11-24', 'DANIELE ROCHA SANTOS', '01AM'),
    ('92598', 'ANNA HELOISA DA SILVA FERNANES', 'FEMININO', '2020-04-12', 'RAIMUNDA LUCIA SILVA FERNANDES', '01AM'),
    ('96866', 'ARTHUR EMANUEL ALVES SILVA', 'MASCULINO', '2020-04-01', 'DANIELA ALVES DA SILVA CUNHA', '01AM'),
    ('96123', 'JOÃO PEDRO SANTOS LIMA', 'MASCULINO', '2019-06-22', 'MARIA SANTOS LIMA', '01AT'),
    ('97456', 'BEATRIZ OLIVEIRA COSTA', 'FEMININO', '2019-08-15', 'ANA OLIVEIRA COSTA', '01AT'),
    ('91234', 'LUCAS FERREIRA MARTINS', 'MASCULINO', '2018-03-10', 'PATRICIA FERREIRA MARTINS', '02AM'),
    ('92345', 'MARIA CLARA SOUZA DIAS', 'FEMININO', '2018-05-05', 'JULIANA SOUZA DIAS', '02AM'),
    ('93456', 'PEDRO HENRIQUE ALMEIDA ROCHA', 'MASCULINO', '2017-11-30', 'CAMILA ALMEIDA ROCHA', '02AT'),
    ('94567', 'SOPHIA VIEIRA CARDOSO', 'FEMININO', '2017-09-18', 'FERNANDA VIEIRA CARDOSO', '02AT')
ON CONFLICT (id_aluno) DO UPDATE 
SET nome_aluno = EXCLUDED.nome_aluno,
    sexo = EXCLUDED.sexo,
    data_nasc = EXCLUDED.data_nasc,
    mae = EXCLUDED.mae,
    id_turma = EXCLUDED.id_turma; 