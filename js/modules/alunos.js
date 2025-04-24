/**
 * Módulo de Alunos
 * Contém todas as funções relacionadas à gestão de alunos
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const AlunosModule = {
    // Estado do módulo
    state: {
        alunos: [],
        alunoSelecionado: null,
        modoEdicao: false,
        turmas: [] // Para o select de turmas
    },
    
    // Elementos DOM
    elements: {
        listaAlunos: null,
        formAluno: null,
        inputNomeAluno: null,
        inputMatricula: null,
        selectTurma: null,
        btnSalvarAluno: null,
        btnCancelarAluno: null,
        btnNovoAluno: null,
        filtroTurma: null,
        btnFiltrar: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de alunos");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarTurmas();
        this.carregarAlunos();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaAlunos = document.getElementById('lista-alunos');
        this.elements.formAluno = document.getElementById('form-aluno');
        this.elements.inputNomeAluno = document.getElementById('nome-aluno');
        this.elements.inputMatricula = document.getElementById('matricula');
        this.elements.selectTurma = document.getElementById('turma-aluno');
        this.elements.btnSalvarAluno = document.getElementById('btn-salvar-aluno');
        this.elements.btnCancelarAluno = document.getElementById('btn-cancelar-aluno');
        this.elements.btnNovoAluno = document.getElementById('btn-novo-aluno');
        this.elements.filtroTurma = document.getElementById('filtro-turma');
        this.elements.btnFiltrar = document.getElementById('btn-filtrar-alunos');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.formAluno) {
            this.elements.formAluno.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarAluno();
            });
        }
        
        if (this.elements.btnCancelarAluno) {
            this.elements.btnCancelarAluno.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
        
        if (this.elements.btnNovoAluno) {
            this.elements.btnNovoAluno.addEventListener('click', () => {
                this.novoAluno();
            });
        }
        
        if (this.elements.btnFiltrar) {
            this.elements.btnFiltrar.addEventListener('click', () => {
                this.filtrarAlunos();
            });
        }
    },
    
    // Carregar turmas para o select
    carregarTurmas: async function() {
        try {
            const turmas = await ConfigModule.fetchApi('/turmas');
            this.state.turmas = turmas;
            this.popularSelectTurmas();
            console.log("Turmas carregadas com sucesso para o módulo de alunos:", turmas);
        } catch (error) {
            console.error("Erro ao carregar turmas para o módulo de alunos:", error);
            this.mostrarErro("Não foi possível carregar as turmas. Tente novamente mais tarde.");
        }
    },
    
    // Popular select de turmas
    popularSelectTurmas: function() {
        if (!this.elements.selectTurma || !this.elements.filtroTurma) return;
        
        // Limpar selects
        this.elements.selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        this.elements.filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
        
        // Adicionar opções
        this.state.turmas.forEach(turma => {
            const option1 = document.createElement('option');
            option1.value = turma.id_turma || turma.id;
            option1.textContent = `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})`;
            this.elements.selectTurma.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = turma.id_turma || turma.id;
            option2.textContent = `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})`;
            this.elements.filtroTurma.appendChild(option2);
        });
    },
    
    // Carregar alunos da API
    carregarAlunos: async function(filtroTurmaId = '') {
        try {
            let endpoint = '/alunos';
            if (filtroTurmaId) {
                endpoint += `?turma_id=${filtroTurmaId}`;
            }
            
            const alunos = await ConfigModule.fetchApi(endpoint);
            this.state.alunos = alunos;
            this.renderizarAlunos();
            console.log("Alunos carregados com sucesso:", alunos);
        } catch (error) {
            console.error("Erro ao carregar alunos:", error);
            this.mostrarErro("Não foi possível carregar os alunos. Tente novamente mais tarde.");
        }
    },
    
    // Filtrar alunos por turma
    filtrarAlunos: function() {
        const turmaId = this.elements.filtroTurma.value;
        this.carregarAlunos(turmaId);
    },
    
    // Renderizar lista de alunos
    renderizarAlunos: function() {
        if (!this.elements.listaAlunos) return;
        
        this.elements.listaAlunos.innerHTML = '';
        
        if (this.state.alunos.length === 0) {
            this.elements.listaAlunos.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
        this.state.alunos.forEach(aluno => {
            // Encontrar nome da turma
            const turma = this.state.turmas.find(t => 
                (t.id_turma && t.id_turma === aluno.turma_id) || 
                t.id === aluno.turma_id
            ) || { serie: 'N/A', turno: 'N/A' };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${aluno.id_aluno || aluno.id || 'N/A'}</td>
                <td>${aluno.nome_aluno || aluno.nome || 'N/A'}</td>
                <td>${aluno.matricula || aluno.id_aluno || 'N/A'}</td>
                <td>${turma.serie || 'N/A'} (${turma.turno || 'N/A'})</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-aluno" data-id="${aluno.id_aluno || aluno.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-aluno" data-id="${aluno.id_aluno || aluno.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-aluno');
            const btnExcluir = row.querySelector('.excluir-aluno');
            
            btnEditar.addEventListener('click', () => this.editarAluno(aluno.id_aluno || aluno.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(aluno.id_aluno || aluno.id));
            
            this.elements.listaAlunos.appendChild(row);
        });
    },
    
    // Criar novo aluno
    novoAluno: function() {
        this.state.modoEdicao = false;
        this.state.alunoSelecionado = null;
        
        if (this.elements.formAluno) {
            this.elements.formAluno.reset();
            this.elements.formAluno.classList.remove('d-none');
        }
        
        if (this.elements.inputNomeAluno) {
            this.elements.inputNomeAluno.focus();
        }
    },
    
    // Editar aluno existente
    editarAluno: function(id) {
        const aluno = this.state.alunos.find(a => a.id === id);
        if (!aluno) return;
        
        this.state.modoEdicao = true;
        this.state.alunoSelecionado = aluno;
        
        if (this.elements.formAluno) {
            this.elements.formAluno.classList.remove('d-none');
            this.elements.inputNomeAluno.value = aluno.nome;
            this.elements.inputMatricula.value = aluno.matricula;
            this.elements.selectTurma.value = aluno.turma_id;
            this.elements.inputNomeAluno.focus();
        }
    },
    
    // Salvar aluno (criar novo ou atualizar existente)
    salvarAluno: async function() {
        try {
            const alunoDados = {
                nome: this.elements.inputNomeAluno.value,
                matricula: this.elements.inputMatricula.value,
                turma_id: parseInt(this.elements.selectTurma.value)
            };
            
            let response;
            
            if (this.state.modoEdicao && this.state.alunoSelecionado) {
                // Atualizar aluno existente
                response = await ConfigModule.fetchApi(`/alunos/${this.state.alunoSelecionado.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(alunoDados)
                });
                
                // Atualizar aluno na lista local
                const index = this.state.alunos.findIndex(a => a.id === this.state.alunoSelecionado.id);
                if (index !== -1) {
                    this.state.alunos[index] = { ...this.state.alunos[index], ...alunoDados };
                }
                
                this.mostrarSucesso("Aluno atualizado com sucesso!");
            } else {
                // Criar novo aluno
                response = await ConfigModule.fetchApi('/alunos', {
                    method: 'POST',
                    body: JSON.stringify(alunoDados)
                });
                
                // Adicionar novo aluno à lista local
                this.state.alunos.push(response);
                
                this.mostrarSucesso("Aluno criado com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Atualizar lista de alunos
            this.renderizarAlunos();
            
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
            this.mostrarErro("Não foi possível salvar o aluno. Tente novamente mais tarde.");
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.alunoSelecionado = null;
        
        if (this.elements.formAluno) {
            this.elements.formAluno.reset();
            this.elements.formAluno.classList.add('d-none');
        }
    },
    
    // Confirmar exclusão de aluno
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.")) {
            this.excluirAluno(id);
        }
    },
    
    // Excluir aluno
    excluirAluno: async function(id) {
        try {
            await ConfigModule.fetchApi(`/alunos/${id}`, {
                method: 'DELETE'
            });
            
            // Remover aluno da lista local
            this.state.alunos = this.state.alunos.filter(a => a.id !== id);
            
            // Atualizar lista de alunos
            this.renderizarAlunos();
            
            this.mostrarSucesso("Aluno excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir aluno:", error);
            this.mostrarErro("Não foi possível excluir o aluno. Tente novamente mais tarde.");
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
        
        document.querySelector('#conteudo-alunos').insertBefore(alertContainer, document.querySelector('#conteudo-alunos').firstChild);
        
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
        
        document.querySelector('#conteudo-alunos').insertBefore(alertContainer, document.querySelector('#conteudo-alunos').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default AlunosModule;
