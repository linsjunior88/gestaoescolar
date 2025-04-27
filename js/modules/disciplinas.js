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
        modoEdicao: false,
        turmas: [], // Para vincular turmas às disciplinas
        turmasVinculadas: [] // Armazenar as turmas vinculadas à disciplina selecionada
    },
    
    // Elementos DOM
    elements: {
        listaDisciplinas: null,
        formDisciplina: null,
        inputIdDisciplina: null,
        inputNomeDisciplina: null,
        inputCargaHoraria: null,
        selectTurmas: null,
        btnSalvarDisciplina: null,
        btnCancelarDisciplina: null,
        btnNovaDisciplina: null,
        btnSalvarTurmas: null,
        btnCancelarTurmas: null,
        formTurmasVinculadas: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de disciplinas");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarTurmas();
        this.carregarDisciplinas();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaDisciplinas = document.getElementById('lista-disciplinas');
        this.elements.formDisciplina = document.getElementById('form-disciplina');
        this.elements.formTurmasVinculadas = document.getElementById('form-turmas-vinculadas');
        this.elements.inputIdDisciplina = document.getElementById('id-disciplina');
        this.elements.inputNomeDisciplina = document.getElementById('nome-disciplina');
        this.elements.inputCargaHoraria = document.getElementById('carga-horaria');
        this.elements.selectTurmas = document.getElementById('turmas-disciplina');
        this.elements.btnSalvarDisciplina = document.getElementById('btn-salvar-disciplina');
        this.elements.btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
        this.elements.btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
        this.elements.btnSalvarTurmas = document.getElementById('btn-salvar-turmas');
        this.elements.btnCancelarTurmas = document.getElementById('btn-cancelar-turmas');
        
        // Verificar se os elementos críticos foram encontrados
        if (!this.elements.btnSalvarTurmas) {
            console.warn('Botão "Salvar Turmas" não encontrado no DOM');
        }
        if (!this.elements.btnCancelarTurmas) {
            console.warn('Botão "Cancelar Turmas" não encontrado no DOM');
        }
        if (!this.elements.formTurmasVinculadas) {
            console.warn('Formulário de turmas vinculadas não encontrado no DOM');
        }
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
        
        if (this.elements.btnSalvarTurmas) {
            this.elements.btnSalvarTurmas.addEventListener('click', () => {
                this.salvarTurmasVinculadas();
            });
        }
        
        if (this.elements.btnCancelarTurmas) {
            this.elements.btnCancelarTurmas.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
    },
    
    // Carregar turmas da API
    carregarTurmas: async function() {
        try {
            const turmas = await ConfigModule.fetchApi('/turmas');
            this.state.turmas = turmas;
            console.log("Turmas carregadas com sucesso para o módulo de disciplinas:", turmas);
        } catch (error) {
            console.error("Erro ao carregar turmas para o módulo de disciplinas:", error);
            this.mostrarErro("Não foi possível carregar as turmas. Tente novamente mais tarde.");
        }
    },
    
    // Popular select de turmas
    popularSelectTurmas: function() {
        if (!this.elements.selectTurmas) {
            console.error("Elemento select de turmas não encontrado");
            return;
        }
        
        // Limpar select
        this.elements.selectTurmas.innerHTML = '';
        
        // Debug para verificar o conteúdo das turmas e turmas vinculadas
        console.log("Turmas disponíveis:", this.state.turmas);
        console.log("Turmas vinculadas:", this.state.turmasVinculadas);
        
        // Criar uma lista de IDs de turmas vinculadas para comparação fácil
        const turmasVinculadasIds = this.state.turmasVinculadas.map(t => {
            if (typeof t === 'object') {
                return t.id_turma || t.id;
            }
            return t;
        });
        
        // Adicionar opções
        this.state.turmas.forEach(turma => {
            const turmaId = turma.id_turma || turma.id;
            const option = document.createElement('option');
            option.value = turmaId;
            option.textContent = `${turma.serie || 'N/A'} (${this.traduzirTurno(turma.turno) || 'N/A'})`;
            
            // Verificar se esta turma está vinculada
            option.selected = turmasVinculadasIds.includes(turmaId);
            
            this.elements.selectTurmas.appendChild(option);
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
    
    // Carregar turmas vinculadas a uma disciplina
    carregarTurmasVinculadas: async function(disciplinaId) {
        try {
            console.log(`Carregando turmas vinculadas para disciplina ${disciplinaId}`);
            const turmasVinculadas = await ConfigModule.fetchApi(`/disciplinas/${disciplinaId}/turmas`);
            
            // Verificar se é um array
            if (!Array.isArray(turmasVinculadas)) {
                console.warn(`Resposta inesperada ao carregar turmas vinculadas para ${disciplinaId}:`, turmasVinculadas);
                // Se não for um array, tratar como array vazio
                this.state.turmasVinculadas = [];
                return [];
            }
            
            this.state.turmasVinculadas = turmasVinculadas;
            console.log("Turmas vinculadas carregadas com sucesso:", turmasVinculadas);
            return turmasVinculadas;
        } catch (error) {
            console.error(`Erro ao carregar turmas vinculadas para disciplina ${disciplinaId}:`, error);
            this.mostrarErro(`Não foi possível carregar as turmas vinculadas: ${error.message}`);
            this.state.turmasVinculadas = [];
            return [];
        }
    },
    
    // Salvar turmas vinculadas
    salvarTurmasVinculadas: async function() {
        if (!this.state.disciplinaSelecionada) {
            this.mostrarErro("Nenhuma disciplina selecionada para vincular turmas.");
            return;
        }
        
        if (!this.elements.selectTurmas) {
            this.mostrarErro("Elemento de seleção de turmas não encontrado.");
            return;
        }
        
        try {
            const disciplinaId = this.state.disciplinaSelecionada.id_disciplina || this.state.disciplinaSelecionada.id;
            const turmasIds = Array.from(this.elements.selectTurmas.selectedOptions).map(option => option.value);
            
            console.log(`Salvando turmas vinculadas para disciplina ${disciplinaId}:`, turmasIds);
            
            // Primeiro remover todos os vínculos existentes
            try {
                const resultadoDelete = await ConfigModule.fetchApi(`/disciplinas/${disciplinaId}/turmas`, {
                    method: 'DELETE'
                });
                console.log("Vínculos removidos com sucesso:", resultadoDelete);
            } catch (deleteError) {
                console.error("Erro ao remover vínculos existentes:", deleteError);
                // Continuar de qualquer forma, pois talvez não haja vínculos existentes
            }
            
            // Depois adicionar os novos vínculos
            if (turmasIds.length > 0) {
                try {
                    const resultadoPost = await ConfigModule.fetchApi(`/disciplinas/${disciplinaId}/turmas`, {
                        method: 'POST',
                        body: JSON.stringify({ turmas_ids: turmasIds })
                    });
                    console.log("Novos vínculos adicionados com sucesso:", resultadoPost);
                } catch (postError) {
                    console.error("Erro ao adicionar novos vínculos:", postError);
                    this.mostrarErro(`Erro ao adicionar turmas: ${postError.message}`);
                    return;
                }
            }
            
            // Atualizar a lista de turmas vinculadas
            const turmasAtualizadas = await this.carregarTurmasVinculadas(disciplinaId);
            console.log("Lista de turmas vinculadas atualizada:", turmasAtualizadas);
            
            // Atualizar a lista de disciplinas para mostrar as turmas vinculadas
            await this.carregarDisciplinas();
            
            // Fechar o formulário
            if (this.elements.formTurmasVinculadas) {
                this.elements.formTurmasVinculadas.classList.add('d-none');
            }
            
            this.mostrarSucesso("Turmas vinculadas atualizadas com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar turmas vinculadas:", error);
            this.mostrarErro(`Não foi possível salvar as turmas vinculadas: ${error.message}`);
        }
    },
    
    // Formatar lista de turmas para exibição
    formatarTurmasVinculadas: function(turmas) {
        if (!turmas || !Array.isArray(turmas) || turmas.length === 0) {
            return 'Nenhuma';
        }
        
        // Se são objetos com série
        if (typeof turmas[0] === 'object' && (turmas[0].serie || turmas[0].id_turma)) {
            return turmas.map(t => t.serie || t.id_turma).join(', ');
        }
        
        // Se são IDs de turmas, buscar nomes no array de turmas
        if (typeof turmas[0] === 'string' || typeof turmas[0] === 'number') {
            const nomes = turmas.map(id => {
                const turma = this.state.turmas.find(t => 
                    (t.id_turma === id) || (t.id === id)
                );
                return turma ? (turma.serie || turma.id_turma) : id;
            });
            
            return nomes.join(', ');
        }
        
        return 'Formato desconhecido';
    },
    
    // Carregar disciplinas da API
    carregarDisciplinas: async function() {
        try {
            const disciplinas = await ConfigModule.fetchApi('/disciplinas');
            
            // Para cada disciplina, carregar as turmas vinculadas
            for (const disciplina of disciplinas) {
                try {
                    const turmasVinculadas = await ConfigModule.fetchApi(`/disciplinas/${disciplina.id_disciplina || disciplina.id}/turmas`);
                    disciplina.turmas = turmasVinculadas;
                } catch (error) {
                    console.warn("Erro ao carregar turmas para disciplina:", disciplina.id_disciplina || disciplina.id);
                    disciplina.turmas = [];
                }
            }
            
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
            this.elements.listaDisciplinas.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma disciplina cadastrada</td></tr>';
            return;
        }
        
        this.state.disciplinas.forEach(disciplina => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${disciplina.id_disciplina || 'N/A'}</td>
                <td>${disciplina.nome_disciplina || disciplina.nome || 'N/A'}</td>
                <td>${disciplina.carga_horaria || 'N/A'}</td>
                <td>${this.formatarTurmasVinculadas(disciplina.turmas || [])}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-disciplina" data-id="${disciplina.id_disciplina || disciplina.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-disciplina" data-id="${disciplina.id_disciplina || disciplina.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="btn btn-sm btn-info vincular-turmas" data-id="${disciplina.id_disciplina || disciplina.id}">
                        <i class="fas fa-link"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-disciplina');
            const btnExcluir = row.querySelector('.excluir-disciplina');
            const btnVincular = row.querySelector('.vincular-turmas');
            
            btnEditar.addEventListener('click', () => this.editarDisciplina(disciplina.id_disciplina || disciplina.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(disciplina.id_disciplina || disciplina.id));
            btnVincular.addEventListener('click', () => this.vincularTurmas(disciplina.id_disciplina || disciplina.id));
            
            this.elements.listaDisciplinas.appendChild(row);
        });
    },
    
    // Criar nova disciplina
    novaDisciplina: function() {
        this.state.modoEdicao = false;
        this.state.disciplinaSelecionada = null;
        this.state.turmasVinculadas = [];
        
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.reset();
            this.elements.formDisciplina.classList.remove('d-none');
        }
        
        if (this.elements.inputIdDisciplina) {
            this.elements.inputIdDisciplina.focus();
        }
    },
    
    // Editar disciplina existente
    editarDisciplina: function(id) {
        const disciplina = this.state.disciplinas.find(d => 
            (d.id_disciplina === id) || (d.id === id)
        );
        if (!disciplina) {
            console.error("Disciplina não encontrada para edição:", id);
            return;
        }
        
        this.state.modoEdicao = true;
        this.state.disciplinaSelecionada = disciplina;
        
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.classList.remove('d-none');
            this.elements.inputIdDisciplina.value = disciplina.id_disciplina || '';
            this.elements.inputNomeDisciplina.value = disciplina.nome_disciplina || disciplina.nome || '';
            this.elements.inputCargaHoraria.value = disciplina.carga_horaria || '';
            this.elements.inputIdDisciplina.focus();
        }
        
        // Carregar e mostrar turmas vinculadas
        this.carregarTurmasVinculadas(id).then(() => {
            this.popularSelectTurmas();
        });
    },
    
    // Vincular turmas a uma disciplina
    vincularTurmas: function(id) {
        const disciplina = this.state.disciplinas.find(d => 
            (d.id_disciplina === id) || (d.id === id)
        );
        if (!disciplina) return;
        
        this.state.disciplinaSelecionada = disciplina;
        
        // Mostrar modal ou formulário de vínculo
        if (this.elements.formTurmasVinculadas) {
            this.elements.formTurmasVinculadas.classList.remove('d-none');
        } else {
            console.error("Formulário de vinculação de turmas não encontrado");
            this.mostrarErro("Erro ao abrir o formulário de vinculação de turmas");
            return;
        }
        
        // Carregar e mostrar turmas vinculadas
        this.carregarTurmasVinculadas(id).then(() => {
            this.popularSelectTurmas();
        });
    },
    
    // Salvar disciplina (criar nova ou atualizar existente)
    salvarDisciplina: async function() {
        try {
            const disciplinaDados = {
                id_disciplina: this.elements.inputIdDisciplina.value,
                nome_disciplina: this.elements.inputNomeDisciplina.value,
                carga_horaria: parseInt(this.elements.inputCargaHoraria.value)
            };
            
            let response;
            
            if (this.state.modoEdicao && this.state.disciplinaSelecionada) {
                // Identificador para a API
                const disciplinaId = this.state.disciplinaSelecionada.id_disciplina || this.state.disciplinaSelecionada.id;
                
                // Atualizar disciplina existente
                response = await ConfigModule.fetchApi(`/disciplinas/${disciplinaId}`, {
                    method: 'PUT',
                    body: JSON.stringify(disciplinaDados)
                });
                
                // Atualizar disciplina na lista local
                const index = this.state.disciplinas.findIndex(d => 
                    (d.id_disciplina === disciplinaId) || (d.id === disciplinaId)
                );
                
                if (index !== -1) {
                    this.state.disciplinas[index] = { 
                        ...this.state.disciplinas[index], 
                        ...disciplinaDados,
                        turmas: this.state.disciplinas[index].turmas || []
                    };
                }
                
                this.mostrarSucesso("Disciplina atualizada com sucesso!");
            } else {
                // Criar nova disciplina
                response = await ConfigModule.fetchApi('/disciplinas', {
                    method: 'POST',
                    body: JSON.stringify(disciplinaDados)
                });
                
                // Adicionar turmas vazias ao objeto de resposta
                response.turmas = [];
                
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
        this.state.turmasVinculadas = [];
        
        if (this.elements.formDisciplina) {
            this.elements.formDisciplina.reset();
            this.elements.formDisciplina.classList.add('d-none');
        }
        
        // Esconder formulário de vínculo de turmas
        if (this.elements.formTurmasVinculadas) {
            this.elements.formTurmasVinculadas.classList.add('d-none');
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
            const disciplinaId = id;
            
            await ConfigModule.fetchApi(`/disciplinas/${disciplinaId}`, {
                method: 'DELETE'
            });
            
            // Remover disciplina da lista local
            this.state.disciplinas = this.state.disciplinas.filter(d => 
                (d.id_disciplina !== disciplinaId) && (d.id !== disciplinaId)
            );
            
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
