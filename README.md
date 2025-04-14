# Sistema de Gestão de Notas - EMEF Nazaré Rodrigues

Este é um sistema para gestão de notas da Escola Municipal de Ensino Fundamental (EMEF) Nazaré Rodrigues, permitindo acesso para diferentes perfis de usuários: administração escolar, professores e responsáveis pelos alunos.

## Funcionalidades

- **Tela de login com múltiplos perfis de acesso:**
  - Escola (Administração)
  - Professor
  - Pai/Responsável
- **Segurança:**
  - Autenticação baseada em usuário e senha
  - Diferentes níveis de acesso dependendo do perfil

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- Bootstrap 5
- Font Awesome (ícones)

## Estrutura do Projeto

```
gestaoNazare/
├── css/
│   └── styles.css
├── img/
│   ├── logo.svg
│   └── logo.html (para conversão em PNG)
├── js/
│   └── scripts.js
├── index.html
└── README.md
```

## Como Usar

1. Abra o arquivo `index.html` em um navegador da web moderno
2. Selecione o perfil de acesso (Escola, Professor ou Pai/Responsável)
3. Insira suas credenciais de acesso (usuário e senha)
4. Clique em "Entrar" para acessar o sistema

## Observações para Implementação

- Este é um protótipo de frontend para o sistema de gestão
- A integração com backend e banco de dados deve ser implementada separadamente
- Substitua o logo placeholder por uma imagem oficial da escola
- Implemente validações de segurança adicionais para um ambiente de produção

## Próximos Passos

- Implementar a página principal após o login
- Desenvolver os módulos específicos para cada perfil de usuário
- Integrar com um backend para autenticação real
- Implementar funcionalidades de gestão de notas
- Adicionar relatórios e estatísticas

## Licença

Todos os direitos reservados à EMEF Nazaré Rodrigues © 2023

# Sistema de Gestão Escolar

Sistema de gestão escolar completo para controle de notas, turmas, disciplinas e alunos.

## Implantação no Render

### Pré-requisitos

1. Conta no [Render](https://render.com/)
2. Repositório Git (GitHub, GitLab, etc.)
3. Banco de dados PostgreSQL (pode ser criado no próprio Render)

### Passos para implantação

1. **Preparar o repositório**
   - Clone este repositório para o seu GitHub/GitLab
   - Certifique-se de que todos os arquivos estão presentes, incluindo:
     - `requirements.txt`
     - `Procfile`
     - `render.yaml`

2. **Configurar o banco de dados**
   - No Render, crie um novo banco de dados PostgreSQL
   - Anote os detalhes da conexão (nome, usuário, senha, host, porta)

3. **Implantar o serviço via Blueprint**
   - No Render, vá para "Blueprints"
   - Clique em "New Blueprint"
   - Conecte seu repositório Git
   - O Render detectará automaticamente o arquivo `render.yaml`
   - Configure as variáveis de ambiente para o banco de dados:
     - `DB_NAME`
     - `DB_USER`
     - `DB_PASSWORD`
     - `DB_HOST`
   - Clique em "Apply" para iniciar a implantação

4. **Verificar implantação**
   - O Render implantará o backend e o frontend conforme configurado no `render.yaml`
   - Acesse a URL fornecida pelo Render para verificar se a aplicação está funcionando

## Desenvolvimento local

### Requisitos

- Python 3.8+
- PostgreSQL

### Configuração

1. Clone o repositório
2. Instale as dependências: `pip install -r requirements.txt`
3. Configure o banco de dados PostgreSQL
4. Execute o backend: `python backend/simplified_api.py`
5. Abra `index.html` em um navegador

## Estrutura do projeto

- `backend/` - API em Python usando FastAPI
- `js/` - Arquivos JavaScript para o frontend
- `css/` - Estilos CSS
- `index.html` - Página principal 