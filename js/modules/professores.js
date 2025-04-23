/**
 * Módulo de Professores
 * Contém todas as funções relacionadas à gestão de professores
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const ProfessoresModule = {
    // Estado do módulo
    state: {
        professores: [],
        professorSelecionado: null,
        modoEdicao: false,
        disciplinas: [] // Para o select de disciplinas
    },
    
    // Elementos DOM
    elements: {
        listaProfessores: null,
        formProfessor: null,
        inputNomeProfessor: null,
        inputEmail: null,
        inputFormacao: null,
        selectDisciplinas: null,
        btnSalvarProfessor: null,
        btnCancelarProfessor: null,
        btnNovoProfessor: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de professores");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarDisciplinas();
        this.carregarProfessores();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaProfessores = document.getElementById('lista-professores');
        this.elements.formProfessor = document.getElementById('form-professor');
        this.elements.inputNomeProfessor = document.getElementById('nome-professor');
        this.elements.inputEmail = document.getElementById('email-professor');
        this.elements.inputFormacao = document.getElementById('formacao-professor');
        this.elements.selectDisciplinas = document.getElementById('disciplinas-professor');
        this.elements.btnSalvarProfessor = document.getElementById('btn-salvar-professor');
        this.elements.btnCancelarProfessor = document.getElementById('btn-cancelar-professor');
        this.elements.btnNovoProfessor = document.getElementById('btn-novo-professor');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.formProfessor) {
            this.elements.formProfessor.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarProfessor();
            });
        }
        
        if (this.elements.btnCancelarProfessor) {
            this.elements.btnCancelarProfessor.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
        
        if (this.elements.btnNovoProfessor) {
            this.elements.btnNovoProfessor.addEventListener('click', () => {
                this.novoProfessor();
            });
        }
    },
    
    // Carregar disciplinas para o select
    carregarDisciplinas: async function() {
        try {
            const disciplinas = await ConfigModule.fetchApi('/disciplinas');
            this.state.disciplinas = disciplinas;
            this.popularSelectDisciplinas();
            console.log("Disciplinas carregadas com sucesso para o módulo de professores:", disciplinas);
        } catch (error) {
            console.error("Erro ao carregar disciplinas para o módulo de professores:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas. Tente novamente mais tarde.");
        }
    },
    
    // Popular select de disciplinas
    popularSelectDisciplinas: function() {
        if (!this.elements.selectDisciplinas) return;
        
        // Limpar select
        this.elements.selectDisciplinas.innerHTML = '';
        
        // Adicionar opções
        this.state.disciplinas.forEach(disciplina => {
            const option = document.createElement('option');
            option.value = disciplina.id;
            option.textContent = disciplina.nome;
            this.elements.selectDisciplinas.appendChild(option);
        });
    },
    
    // Carregar professores da API
    carregarProfessores: async function() {
        try {
            const professores = await ConfigModule.fetchApi('/professores');
            this.state.professores = professores;
            this.renderizarProfessores();
            console.log("Professores carregados com sucesso:", professores);
        } catch (error) {
            console.error("Erro ao carregar professores:", error);
            this.mostrarErro("Não foi possível carregar os professores. Tente novamente mais tarde.");
        }
    },
    
    // Renderizar lista de professores
    renderizarProfessores: function() {
        if (!this.elements.listaProfessores) return;
        
        this.elements.listaProfessores.innerHTML = '';
        
        if (this.state.professores.length === 0) {
            this.elements.listaProfessores.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum professor cadastrado</td></tr>';
            return;
        }
        
        this.state.professores.forEach(professor => {
            const row = document.createElement('tr');
            
            // Encontrar disciplinas do professor
            let disciplinasTexto = 'Nenhuma';
            if (professor.disciplinas && professor.disciplinas.length > 0) {
                const disciplinasNomes = professor.disciplinas.map(id => {
                    const disciplina = this.state.disciplinas.find(d => d.id === id);
                    return disciplina ? disciplina.nome : 'Desconhecida';
                });
                disciplinasTexto = disciplinasNomes.join(', ');
            }
            
            row.innerHTML = `
                <td>${professor.id}</td>
                <td>${professor.nome}</td>
                <td>${professor.email || 'N/A'}</td>
                <td>${professor.formacao || 'N/A'}</td>
                <td>${disciplinasTexto}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-professor" data-id="${professor.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-professor" data-id="${professor.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-professor');
            const btnExcluir = row.querySelector('.excluir-professor');
            
            btnEditar.addEventListener('click', () => this.editarProfessor(professor.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(professor.id));
            
            this.elements.listaProfessores.appendChild(row);
        });
    },
    
    // Criar novo professor
    novoProfessor: function() {
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.reset();
            this.elements.formProfessor.classList.remove('d-none');
        }
        
        if (this.elements.inputNomeProfessor) {
            this.elements.inputNomeProfessor.focus();
        }
    },
    
    // Editar professor existente
    editarProfessor: function(id) {
        const professor = this.state.professores.find(p => p.id === id);
        if (!professor) return;
        
        this.state.modoEdicao = true;
        this.state.professorSelecionado = professor;
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.classList.remove('d-none');
            this.elements.inputNomeProfessor.value = professor.nome;
            this.elements.inputEmail.value = professor.email || '';
            this.elements.inputFormacao.value = professor.formacao || '';
            
            // Selecionar disciplinas
            if (this.elements.selectDisciplinas) {
                Array.from(this.elements.selectDisciplinas.options).forEach(option => {
                    option.selected = professor.disciplinas && professor.disciplinas.includes(parseInt(option.value));
                });
            }
            
            this.elements.inputNomeProfessor.focus();
        }
    },
    
    // Salvar professor (criar novo ou atualizar existente)
    salvarProfessor: async function() {
        try {
            // Obter disciplinas selecionadas
            const disciplinasSelecionadas = Array.from(this.elements.selectDisciplinas.selectedOptions).map(option => parseInt(option.value));
            
            const professorDados = {
                nome: this.elements.inputNomeProfessor.value,
                email: this.elements.inputEmail.value,
                formacao: this.elements.inputFormacao.value,
                disciplinas: disciplinasSelecionadas
            };
            
            let response;
            
            if (this.state.modoEdicao && this.state.professorSelecionado) {
                // Atualizar professor existente
                response = await ConfigModule.fetchApi(`/professores/${this.state.professorSelecionado.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(professorDados)
                });
                
                // Atualizar professor na lista local
                const index = this.state.professores.findIndex(p => p.id === this.state.professorSelecionado.id);
                if (index !== -1) {
                    this.state.professores[index] = { ...this.state.professores[index], ...professorDados };
                }
                
                this.mostrarSucesso("Professor atualizado com sucesso!");
            } else {
                // Criar novo professor
                response = await ConfigModule.fetchApi('/professores', {
                    method: 'POST',
                    body: JSON.stringify(professorDados)
                });
                
                // Adicionar novo professor à lista local
                this.state.professores.push(response);
                
                this.mostrarSucesso("Professor criado com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Atualizar lista de professores
            this.renderizarProfessores();
            
        } catch (error) {
            console.error("Erro ao salvar professor:", error);
            this.mostrarErro("Não foi possível salvar o professor. Tente novamente mais tarde.");
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.reset();
            this.elements.formProfessor.classList.add('d-none');
        }
    },
    
    // Confirmar exclusão de professor
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.")) {
            this.excluirProfessor(id);
        }
    },
    
    // Excluir professor
    excluirProfessor: async function(id) {
        try {
            await ConfigModule.fetchApi(`/professores/${id}`, {
                method: 'DELETE'
            });
            
            // Remover professor da lista local
            this.state.professores = this.state.professores.filter(p => p.id !== id);
            
            // Atualizar lista de professores
            this.renderizarProfessores();
            
            this.mostrarSucesso("Professor excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir professor:", error);
            this.mostrarErro("Não foi possível excluir o professor. Tente novamente mais tarde.");
        }
    },
    
    // Mostrar mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-success alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        document.querySelector('#conteudo-professores').insertBefore(alertContainer, document.querySelector('#conteudo-professores').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    },
    
    // Mostrar mensagem de erro
    mostrarErro: function(mensagem) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-danger alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        document.querySelector('#conteudo-professores').insertBefore(alertContainer, document.querySelector('#conteudo-professores').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default ProfessoresModule;
