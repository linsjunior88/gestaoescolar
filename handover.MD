Documento de Transferência - Sistema de Gestão Escolar
1. Visão Geral do Projeto
O sistema é uma aplicação web para gestão escolar da EMEF Nazaré Rodrigues, desenvolvida com HTML, CSS, JavaScript no frontend e atualmente em processo de migração para uma arquitetura mais robusta com FastAPI e SQL Server.
2. Estado Atual do Desenvolvimento
2.1 Frontend (Concluído)
Interface administrativa completa para escola
Interface do professor
Sistema de login implementado
Dashboard responsivo com sidebar retrátil
Gerenciamento de turmas, disciplinas, professores e alunos
Sistema de notas e frequência
Implementado usando HTML, CSS e JavaScript vanilla
Atualmente usando localStorage para simulação de dados
2.2 Banco de Dados (Concluído)
SQL Server implementado com as seguintes tabelas:
Turmas
Disciplinas
Professores
Alunos
TurmasAlunos (relacionamento)
ProfessoresDisciplinas (relacionamento)
TurmasDisciplinasProfessores (grade curricular)
Notas
Frequencia
Usuarios
2.3 Estrutura de Arquivos
/gestaoNazare
├── css/
│   └── dashboard.css
├── js/
│   └── professor.js
├── img/
│   └── logo.png
├── escola-dashboard.html
├── professor-dashboard.html
└── index.html
3. Funcionalidades Implementadas
3.1 Dashboard da Escola
Visão geral do sistema
Gestão de turmas
Gestão de disciplinas
Gestão de professores
Gestão de alunos
Gestão de notas
Relatórios básicos
3.2 Dashboard do Professor
Visualização de turmas e disciplinas
Gestão de notas
Registro de frequência
Visualização de alunos
Perfil do professor
3.3 Sistema de Autenticação
Login com validação
Diferentes níveis de acesso (Admin, Professor)
Controle de sessão via localStorage
4. Próximos Passos Planejados
4.1 Migração para Arquitetura Moderna
Implementação da API com FastAPI
Migração do frontend para Netlify
Configuração de DNS dinâmico para o servidor local
4.2 Banco de Dados
Inserção de dados iniciais (seed data)
Configuração de backups
Implementação de índices de performance
4.3 Segurança
Implementação de JWT
HTTPS
Proteção contra SQL Injection
Validação de dados
5. Decisões Técnicas
5.1 Frontend
Uso de Bootstrap 5.3.2 para layout
Font Awesome 6.4.2 para ícones
Chart.js para gráficos
JavaScript vanilla para lógica de negócios
5.2 Banco de Dados
SQL Server como SGBD
Normalização adequada das tabelas
Constraints para integridade referencial
Índices para otimização de consultas
5.3 Arquitetura
Decisão de usar FastAPI para a API
Plano de hospedagem híbrida (frontend no Netlify, backend local)
Uso de DNS dinâmico para acesso ao servidor local
6. Regras de Negócio Implementadas
6.1 Turmas
Capacidade máxima de 30 alunos
Turnos: Manhã, Tarde, Noite
Controle de ano letivo
6.2 Notas
Sistema de 0 a 10
Controle por período (bimestre)
Validação de notas por disciplina
6.3 Frequência
Registro diário
Controle de presença/ausência
Sistema de justificativas
7. Desafios e Considerações
7.1 Infraestrutura
Necessidade de IP fixo ou DNS dinâmico
Backup regular do banco de dados
Monitoramento de performance
7.2 Segurança
Proteção de dados sensíveis
Controle de acesso granular
Logs de auditoria
7.3 Performance
Otimização de consultas SQL
Caching quando apropriado
Carregamento assíncrono de dados
8. Documentação Pendente
8.1 Técnica
Documentação da API
Diagramas de banco de dados
Fluxos de autenticação
8.2 Usuário
Manual do administrador
Manual do professor
Guias de uso
9. Contatos e Recursos
Dados reais de turmas, disciplinas, professores e alunos em planilhas Excel/Google Sheets
Necessidade de migração destes dados para o novo banco de dados
10. Próximos Passos Imediatos
Inserção de dados iniciais no banco
Estruturação do projeto FastAPI
Configuração do ambiente de desenvolvimento
Preparação do frontend para Netlify
Este documento fornece uma visão abrangente do estado atual do projeto e deve ser suficiente para que outra IA possa continuar o desenvolvimento de forma consistente com as decisões e implementações já realizadas.