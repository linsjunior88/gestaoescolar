/**
 * Módulo de Disciplinas
 * Contém todas as funções relacionadas à gestão de disciplinas
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const DisciplinasModule = {
    // Estado do módulo
    state: {
        disciplinas: [],
        disciplinaSelecionada: null,
        modoEdicao: false
    },
    
    // Elementos DOM
    elements: {
        listaDisciplinas: null,
        formDisciplina: null,
        inputNomeDisciplina: null,
        inputCargaHoraria: null,
        btnSalvarDisciplina: null,
        btnCancelarDisciplina: null,
        btnNovaDisciplina: null
    },
    
    // Inicializar módulo
    init: function() {
        console.log("Inicializando módulo de disciplinas");
        this.cachearElementos();
        this.adicionarEventListeners();
        this.carregarDisciplinas();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaDisciplinas = document.getElementById('lista-disciplinas');
        this.elements.formDisciplina = document.getElementById('form-disciplina');
        this.elements.inputNomeDisciplina = document.getElementById('nome-disciplina');
        this.elements.inputCargaHoraria = document.getElementById('carga-horaria');
        this.elements.btnSalvarDisciplina = document.getElementById('btn-salvar-disciplina');
        this.elements.btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
        this.elements.btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarDisciplina();
            });
        }
        
        if (this.elements.btnCancelarDisciplina) {
            this.elements.btnCancelarDisciplina.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
        
        if (this.elements.btnNovaDisciplina) {
            this.elements.btnNovaDisciplina.addEventListener('click', () => {
                this.novaDisciplina();
            });
        }
    },
    
    // Carregar disciplinas da API
    carregarDisciplinas: async function() {
        try {
            const disciplinas = await ConfigModule.fetchApi('/disciplinas');
            this.state.disciplinas = disciplinas;
            this.renderizarDisciplinas();
            console.log("Disciplinas carregadas com sucesso:", disciplinas);
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas. Tente novamente mais tarde.");
        }
    },
    
    // Renderizar lista de disciplinas
    renderizarDisciplinas: function() {
        if (!this.elements.listaDisciplinas) return;
        
        this.elements.listaDisciplinas.innerHTML = '';
        
        if (this.state.disciplinas.length === 0) {
            this.elements.listaDisciplinas.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma disciplina cadastrada</td></tr>';
            return;
        }
        
        this.state.disciplinas.forEach(disciplina => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${disciplina.id_disciplina || disciplina.id || 'N/A'}</td>
                <td>${disciplina.nome_disciplina || disciplina.nome || 'N/A'}</td>
                <td>${disciplina.carga_horaria || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-disciplina" data-id="${disciplina.id_disciplina || disciplina.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-disciplina" data-id="${disciplina.id_disciplina || disciplina.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-disciplina');
            const btnExcluir = row.querySelector('.excluir-disciplina');
            
            btnEditar.addEventListener('click', () => this.editarDisciplina(disciplina.id_disciplina || disciplina.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(disciplina.id_disciplina || disciplina.id));
            
            this.elements.listaDisciplinas.appendChild(row);
        });
    },
    
    // Criar nova disciplina
    novaDisciplina: function() {
        this.state.modoEdicao = false;
        this.state.disciplinaSelecionada = null;
        
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.reset();
            this.elements.formDisciplina.classList.remove('d-none');
        }
        
        if (this.elements.inputNomeDisciplina) {
            this.elements.inputNomeDisciplina.focus();
        }
    },
    
    // Editar disciplina existente
    editarDisciplina: function(id) {
        const disciplina = this.state.disciplinas.find(d => d.id === id);
        if (!disciplina) return;
        
        this.state.modoEdicao = true;
        this.state.disciplinaSelecionada = disciplina;
        
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.classList.remove('d-none');
            this.elements.inputNomeDisciplina.value = disciplina.nome;
            this.elements.inputCargaHoraria.value = disciplina.carga_horaria;
            this.elements.inputNomeDisciplina.focus();
        }
    },
    
    // Salvar disciplina (criar nova ou atualizar existente)
    salvarDisciplina: async function() {
        try {
            const disciplinaDados = {
                nome: this.elements.inputNomeDisciplina.value,
                carga_horaria: parseInt(this.elements.inputCargaHoraria.value)
            };
            
            let response;
            
            if (this.state.modoEdicao && this.state.disciplinaSelecionada) {
                // Atualizar disciplina existente
                response = await ConfigModule.fetchApi(`/disciplinas/${this.state.disciplinaSelecionada.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(disciplinaDados)
                });
                
                // Atualizar disciplina na lista local
                const index = this.state.disciplinas.findIndex(d => d.id === this.state.disciplinaSelecionada.id);
                if (index !== -1) {
                    this.state.disciplinas[index] = { ...this.state.disciplinas[index], ...disciplinaDados };
                }
                
                this.mostrarSucesso("Disciplina atualizada com sucesso!");
            } else {
                // Criar nova disciplina
                response = await ConfigModule.fetchApi('/disciplinas', {
                    method: 'POST',
                    body: JSON.stringify(disciplinaDados)
                });
                
                // Adicionar nova disciplina à lista local
                this.state.disciplinas.push(response);
                
                this.mostrarSucesso("Disciplina criada com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Atualizar lista de disciplinas
            this.renderizarDisciplinas();
            
        } catch (error) {
            console.error("Erro ao salvar disciplina:", error);
            this.mostrarErro("Não foi possível salvar a disciplina. Tente novamente mais tarde.");
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.disciplinaSelecionada = null;
        
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.reset();
            this.elements.formDisciplina.classList.add('d-none');
        }
    },
    
    // Confirmar exclusão de disciplina
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita.")) {
            this.excluirDisciplina(id);
        }
    },
    
    // Excluir disciplina
    excluirDisciplina: async function(id) {
        try {
            await ConfigModule.fetchApi(`/disciplinas/${id}`, {
                method: 'DELETE'
            });
            
            // Remover disciplina da lista local
            this.state.disciplinas = this.state.disciplinas.filter(d => d.id !== id);
            
            // Atualizar lista de disciplinas
            this.renderizarDisciplinas();
            
            this.mostrarSucesso("Disciplina excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir disciplina:", error);
            this.mostrarErro("Não foi possível excluir a disciplina. Tente novamente mais tarde.");
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
        
        document.querySelector('#conteudo-disciplinas').insertBefore(alertContainer, document.querySelector('#conteudo-disciplinas').firstChild);
        
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
        
        document.querySelector('#conteudo-disciplinas').insertBefore(alertContainer, document.querySelector('#conteudo-disciplinas').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default DisciplinasModule;
