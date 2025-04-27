/**
 * Módulo de Turmas
 * Contém todas as funções relacionadas à gestão de turmas
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const TurmasModule = {
    // Estado do módulo
    state: {
        turmas: [],
        turmaSelecionada: null,
        modoEdicao: false
    },
    
    // Elementos DOM
    elements: {
        listaTurmas: null,
        formTurma: null,
        inputIdTurma: null,
        inputSerie: null,
        selectTurno: null,
        inputTipoTurma: null,
        inputCoordenador: null,
        btnSalvarTurma: null,
        btnCancelarTurma: null,
        btnNovaTurma: null
    },
    
    // Inicializar módulo
    init: function() {
        console.log("Inicializando módulo de turmas");
        this.cachearElementos();
        this.adicionarEventListeners();
        this.carregarTurmas();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaTurmas = document.getElementById('turmas-lista');
        this.elements.formTurma = document.getElementById('form-turma');
        this.elements.inputIdTurma = document.getElementById('id_turma_input');
        this.elements.inputSerie = document.getElementById('serie');
        this.elements.selectTurno = document.getElementById('turno');
        this.elements.inputTipoTurma = document.getElementById('tipo_turma');
        this.elements.inputCoordenador = document.getElementById('coordenador');
        this.elements.btnSalvarTurma = document.getElementById('btn-salvar-turma');
        this.elements.btnCancelarTurma = document.getElementById('btn-cancelar-turma');
        this.elements.btnNovaTurma = document.getElementById('btn-nova-turma');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.formTurma) {
            this.elements.formTurma.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarTurma();
            });
        }
        
        if (this.elements.btnCancelarTurma) {
            this.elements.btnCancelarTurma.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
        
        if (this.elements.btnNovaTurma) {
            this.elements.btnNovaTurma.addEventListener('click', () => {
                this.novaTurma();
            });
        }
    },
    
    // Carregar turmas da API
    carregarTurmas: async function() {
        try {
            const turmas = await ConfigModule.fetchApi('/turmas');
            this.state.turmas = turmas;
            this.renderizarTurmas();
            console.log("Turmas carregadas com sucesso:", turmas);
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            this.mostrarErro("Não foi possível carregar as turmas. Tente novamente mais tarde.");
        }
    },
    
    // Renderizar lista de turmas
    renderizarTurmas: function() {
        if (!this.elements.listaTurmas) return;
        
        this.elements.listaTurmas.innerHTML = '';
        
        if (this.state.turmas.length === 0) {
            this.elements.listaTurmas.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma turma cadastrada</td></tr>';
            return;
        }
        
        this.state.turmas.forEach(turma => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${turma.id_turma || turma.id || 'N/A'}</td>
                <td>${turma.serie || 'N/A'}</td>
                <td>${this.traduzirTurno(turma.turno) || 'N/A'}</td>
                <td>${turma.tipo_turma || 'Regular'}</td>
                <td>${turma.coordenador || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-turma" data-id="${turma.id_turma || turma.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-turma" data-id="${turma.id_turma || turma.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-turma');
            const btnExcluir = row.querySelector('.excluir-turma');
            
            btnEditar.addEventListener('click', () => this.editarTurma(turma.id_turma || turma.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(turma.id_turma || turma.id));
            
            this.elements.listaTurmas.appendChild(row);
        });
    },
    
    // Traduzir o valor do turno para texto legível
    traduzirTurno: function(turno) {
        const turnos = {
            'manha': 'Manhã',
            'tarde': 'Tarde',
            'noite': 'Noite'
        };
        
        return turnos[turno] || turno;
    },
    
    // Criar nova turma
    novaTurma: function() {
        this.state.modoEdicao = false;
        this.state.turmaSelecionada = null;
        
        if (this.elements.formTurma) {
            this.elements.formTurma.reset();
            this.elements.formTurma.classList.remove('d-none');
        }
        
        if (this.elements.inputIdTurma) {
            this.elements.inputIdTurma.focus();
        }
    },
    
    // Editar turma existente
    editarTurma: function(id) {
        const turma = this.state.turmas.find(t => (t.id_turma === id) || (t.id === id));
        if (!turma) return;
        
        this.state.modoEdicao = true;
        this.state.turmaSelecionada = turma;
        
        if (this.elements.formTurma) {
            this.elements.formTurma.classList.remove('d-none');
            this.elements.inputIdTurma.value = turma.id_turma || turma.id || '';
            this.elements.inputSerie.value = turma.serie || '';
            this.elements.selectTurno.value = turma.turno || '';
            this.elements.inputTipoTurma.value = turma.tipo_turma || 'Regular';
            this.elements.inputCoordenador.value = turma.coordenador || '';
            this.elements.inputIdTurma.focus();
        }
    },
    
    // Salvar turma (criar nova ou atualizar existente)
    salvarTurma: async function() {
        try {
            const turmaDados = {
                id_turma: this.elements.inputIdTurma.value,
                serie: this.elements.inputSerie.value,
                turno: this.elements.selectTurno.value,
                tipo_turma: this.elements.inputTipoTurma.value,
                coordenador: this.elements.inputCoordenador.value
            };
            
            let response;
            
            if (this.state.modoEdicao && this.state.turmaSelecionada) {
                // Identificador para a API
                const turmaId = this.state.turmaSelecionada.id_turma || this.state.turmaSelecionada.id;
                
                // Atualizar turma existente
                response = await ConfigModule.fetchApi(`/turmas/${turmaId}`, {
                    method: 'PUT',
                    body: JSON.stringify(turmaDados)
                });
                
                // Atualizar turma na lista local
                const index = this.state.turmas.findIndex(t => 
                    (t.id_turma === turmaId) || (t.id === turmaId)
                );
                
                if (index !== -1) {
                    this.state.turmas[index] = { ...this.state.turmas[index], ...turmaDados };
                }
                
                this.mostrarSucesso("Turma atualizada com sucesso!");
            } else {
                // Criar nova turma
                response = await ConfigModule.fetchApi('/turmas', {
                    method: 'POST',
                    body: JSON.stringify(turmaDados)
                });
                
                // Adicionar nova turma à lista local
                this.state.turmas.push(response);
                
                this.mostrarSucesso("Turma criada com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Atualizar lista de turmas
            this.renderizarTurmas();
            
        } catch (error) {
            console.error("Erro ao salvar turma:", error);
            this.mostrarErro("Não foi possível salvar a turma. Tente novamente mais tarde.");
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.turmaSelecionada = null;
        
        if (this.elements.formTurma) {
            this.elements.formTurma.reset();
            this.elements.formTurma.classList.add('d-none');
        }
    },
    
    // Confirmar exclusão de turma
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.")) {
            this.excluirTurma(id);
        }
    },
    
    // Excluir turma
    excluirTurma: async function(id) {
        try {
            const turmaId = id;
            
            await ConfigModule.fetchApi(`/turmas/${turmaId}`, {
                method: 'DELETE'
            });
            
            // Remover turma da lista local
            this.state.turmas = this.state.turmas.filter(t => 
                (t.id_turma !== turmaId) && (t.id !== turmaId)
            );
            
            // Atualizar lista de turmas
            this.renderizarTurmas();
            
            this.mostrarSucesso("Turma excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir turma:", error);
            this.mostrarErro("Não foi possível excluir a turma. Tente novamente mais tarde.");
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
        
        document.querySelector('#conteudo-turmas').insertBefore(alertContainer, document.querySelector('#conteudo-turmas').firstChild);
        
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
        
        document.querySelector('#conteudo-turmas').insertBefore(alertContainer, document.querySelector('#conteudo-turmas').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default TurmasModule;