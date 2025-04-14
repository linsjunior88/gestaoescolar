-- Script SQL para recriar as tabelas do banco de dados gestao_escolar

-- Remover todas as tabelas existentes
DROP VIEW IF EXISTS media_final CASCADE;
DROP TABLE IF EXISTS nota CASCADE;
DROP TABLE IF EXISTS professor_disciplina_turma CASCADE;
DROP TABLE IF EXISTS turma_disciplina CASCADE;
DROP TABLE IF EXISTS aluno CASCADE;
DROP TABLE IF EXISTS professor CASCADE;
DROP TABLE IF EXISTS disciplina CASCADE;
DROP TABLE IF EXISTS turma CASCADE;

-- Criar tabela turma com a estrutura esperada pela API
CREATE TABLE turma (
    id SERIAL PRIMARY KEY,
    id_turma VARCHAR(10) UNIQUE NOT NULL,
    serie VARCHAR(50) NOT NULL,
    turno VARCHAR(10) NOT NULL,
    tipo_turma VARCHAR(50),
    coordenador VARCHAR(100)
);

-- Criar tabela disciplina
CREATE TABLE disciplina (
    id SERIAL PRIMARY KEY,
    id_disciplina VARCHAR(10) UNIQUE NOT NULL,
    nome_disciplina VARCHAR(100) NOT NULL,
    carga_horaria INTEGER
);

-- Criar tabela professor
CREATE TABLE professor (
    id SERIAL PRIMARY KEY,
    id_professor VARCHAR(20) UNIQUE NOT NULL,
    nome_professor VARCHAR(100) NOT NULL,
    email_professor VARCHAR(100),
    senha VARCHAR(100),
    telefone_professor VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE
);

-- Criar tabela aluno
CREATE TABLE aluno (
    id SERIAL PRIMARY KEY,
    id_aluno VARCHAR(20) UNIQUE NOT NULL,
    nome_aluno VARCHAR(100) NOT NULL,
    sexo VARCHAR(1),
    data_nasc DATE,
    mae VARCHAR(100),
    id_turma VARCHAR(10) REFERENCES turma(id_turma),
    endereco VARCHAR(200),
    telefone VARCHAR(20),
    email VARCHAR(100)
);

-- Criar tabela turma_disciplina
CREATE TABLE turma_disciplina (
    id SERIAL PRIMARY KEY,
    id_turma VARCHAR(10) REFERENCES turma(id_turma) NOT NULL,
    id_disciplina VARCHAR(10) REFERENCES disciplina(id_disciplina) NOT NULL
);

-- Criar tabela professor_disciplina_turma
CREATE TABLE professor_disciplina_turma (
    id SERIAL PRIMARY KEY,
    id_professor VARCHAR(20) REFERENCES professor(id_professor) NOT NULL,
    id_disciplina VARCHAR(10) REFERENCES disciplina(id_disciplina) NOT NULL,
    id_turma VARCHAR(10) REFERENCES turma(id_turma) NOT NULL
);

-- Criar tabela nota
CREATE TABLE nota (
    id SERIAL PRIMARY KEY,
    id_aluno VARCHAR(20) REFERENCES aluno(id_aluno) NOT NULL,
    id_disciplina VARCHAR(10) REFERENCES disciplina(id_disciplina) NOT NULL,
    id_turma VARCHAR(10) REFERENCES turma(id_turma) NOT NULL,
    ano INTEGER NOT NULL,
    bimestre INTEGER NOT NULL,
    nota_mensal FLOAT,
    nota_bimestral FLOAT,
    recuperacao FLOAT,
    media FLOAT
);

-- Criar view media_final
CREATE OR REPLACE VIEW media_final AS
SELECT 
    n.id_aluno,
    a.nome_aluno,
    n.id_disciplina,
    d.nome_disciplina,
    n.id_turma,
    t.serie,
    t.turno,
    n.ano,
    ROUND(AVG(n.media)::numeric, 1) as media_anual,
    CASE 
        WHEN ROUND(AVG(n.media)::numeric, 1) >= 7.0 THEN 'Aprovado'
        WHEN ROUND(AVG(n.media)::numeric, 1) >= 5.0 THEN 'Recuperação'
        ELSE 'Reprovado'
    END as situacao
FROM 
    nota n
    JOIN aluno a ON n.id_aluno = a.id_aluno
    JOIN disciplina d ON n.id_disciplina = d.id_disciplina
    JOIN turma t ON n.id_turma = t.id_turma
GROUP BY 
    n.id_aluno, a.nome_aluno, n.id_disciplina, d.nome_disciplina, 
    n.id_turma, t.serie, t.turno, n.ano
ORDER BY 
    a.nome_aluno, d.nome_disciplina;

-- Inserir alguns dados de exemplo
INSERT INTO turma (id_turma, serie, turno, tipo_turma, coordenador) VALUES
    ('1A', '1º Ano', 'Manhã', 'Regular', 'Maria Silva'),
    ('2A', '2º Ano', 'Manhã', 'Regular', 'João Santos'),
    ('3A', '3º Ano', 'Manhã', 'Regular', 'Ana Oliveira');

INSERT INTO disciplina (id_disciplina, nome_disciplina, carga_horaria) VALUES
    ('MAT', 'Matemática', 80),
    ('PORT', 'Português', 80),
    ('HIST', 'História', 60),
    ('GEO', 'Geografia', 60);

INSERT INTO professor (id_professor, nome_professor, email_professor, telefone_professor) VALUES
    ('PROF001', 'Carlos Ferreira', 'carlos.ferreira@escola.edu', '(11) 98765-4321'),
    ('PROF002', 'Marina Santos', 'marina.santos@escola.edu', '(11) 91234-5678'),
    ('PROF003', 'Roberto Alves', 'roberto.alves@escola.edu', '(11) 99876-5432'); 