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
        disciplinas: [],
        disciplinasTurmas: [],
        turmas: [],
        modoEdicao: false,
        professorSelecionado: null,
        vinculos: [] // Para armazenar os vínculos de disciplinas e turmas do professor
    },
    
    // Elementos DOM
    elements: {
        conteudoProfessores: null,
        listaProfessores: null,
        formProfessor: null,
        btnNovoProfessor: null,
        btnSalvarProfessor: null,
        btnCancelarProfessor: null,
        inputIdProfessor: null,
        inputNomeProfessor: null,
        inputEmailProfessor: null,
        inputSenhaProfessor: null,
        selectDisciplinas: null,
        vinculosContainer: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de professores...");
        
        try {
            // Inicializar elementos
            this.elements = {
                conteudoProfessores: document.getElementById('conteudo-professores'),
                listaProfessores: document.getElementById('lista-professores'),
                formProfessor: document.getElementById('form-professor'),
                btnNovoProfessor: document.getElementById('btn-novo-professor'),
                btnSalvarProfessor: document.getElementById('btn-salvar-professor'),
                btnCancelarProfessor: document.getElementById('btn-cancelar-professor'),
                inputIdProfessor: document.getElementById('id-professor'),
                inputNomeProfessor: document.getElementById('nome-professor'),
                inputEmailProfessor: document.getElementById('email-professor'),
                inputSenhaProfessor: document.getElementById('senha-professor'),
                selectDisciplinas: document.getElementById('disciplinas-professor'),
                vinculosContainer: document.getElementById('vinculos-container')
            };
            
            // Verificar se elementos necessários existem
            if (!this.elements.listaProfessores || !this.elements.formProfessor) {
                console.error("Elementos necessários para o módulo de professores não encontrados no DOM");
                return;
            }
            
            // Carregar disciplinas (antes de carregar professores)
            await this.carregarDisciplinas();
            
            // Carregar turmas
            await this.carregarTurmas();
            
            // Carregar professores
            await this.carregarProfessores();
            
            // Carregar vínculos entre disciplinas e turmas
            await this.carregarDisciplinasTurmas();
            
            // Configurar eventos
            this.configurarEventos();
            
            // Inicializar selectize para disciplinas
            if (this.elements.selectDisciplinas) {
                $(this.elements.selectDisciplinas).selectize({
                    plugins: ['remove_button'],
                    delimiter: ',',
                    placeholder: 'Selecione as disciplinas',
                    onItemAdd: () => this.atualizarTurmasVinculadas(),
                    onItemRemove: () => this.atualizarTurmasVinculadas()
                });
            }
            
            console.log("Módulo de professores inicializado com sucesso");
        } catch (error) {
            console.error("Erro ao inicializar módulo de professores:", error);
        }
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaProfessores = document.getElementById('lista-professores');
        this.elements.formProfessor = document.getElementById('form-professor');
        this.elements.inputIdProfessor = document.getElementById('id-professor');
        this.elements.inputNomeProfessor = document.getElementById('nome-professor');
        this.elements.inputEmailProfessor = document.getElementById('email-professor');
        this.elements.inputSenhaProfessor = document.getElementById('senha-professor');
        this.elements.selectDisciplinas = document.getElementById('disciplinas-professor');
        this.elements.vinculosContainer = document.getElementById('vinculos-professor-container');
        this.elements.tabelaVinculos = document.getElementById('tabela-vinculos-professor');
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
        
        // Adicionar listener para seleção de disciplinas para mostrar as turmas vinculadas
        if (this.elements.selectDisciplinas) {
            this.elements.selectDisciplinas.addEventListener('change', () => {
                this.atualizarTurmasVinculadas();
            });
        }
        
        // Adicionar tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('vinculosModal');
                if (modal) {
                    const bootstrapModal = bootstrap.Modal.getInstance(modal);
                    if (bootstrapModal) {
                        bootstrapModal.hide();
                    }
                }
            }
        });
    },
    
    // Carregar disciplinas e turmas vinculadas
    carregarDisciplinasTurmas: async function() {
        try {
            // Carregar disciplinas
            const disciplinas = await ConfigModule.fetchApi('/disciplinas');
            console.log("Disciplinas carregadas:", disciplinas);
            
            // Normalizar os dados de disciplinas
            this.state.disciplinas = disciplinas.map(d => ({
                id: d.id,
                id_disciplina: d.id_disciplina,
                nome: d.nome_disciplina || d.nome,
                carga_horaria: d.carga_horaria
            }));
            
            // Carregar relacionamentos disciplina-turma para cada disciplina
            for (const disciplina of this.state.disciplinas) {
                try {
                    const turmas = await ConfigModule.fetchApi(`/disciplinas/${disciplina.id_disciplina}/turmas`);
                    if (Array.isArray(turmas) && turmas.length > 0) {
                        this.state.disciplinasTurmas.push({
                            disciplina: disciplina.id_disciplina,
                            turmas: turmas
                        });
                    }
                } catch (err) {
                    console.warn(`Não foi possível carregar turmas para a disciplina ${disciplina.id_disciplina}:`, err);
                }
            }
            
            console.log("Disciplinas e turmas carregadas:", this.state.disciplinasTurmas);
            this.popularSelectDisciplinas();
            
        } catch (error) {
            console.error("Erro ao carregar disciplinas e turmas:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas e turmas vinculadas.");
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
            option.value = disciplina.id_disciplina;
            
            // Buscar quantas turmas estão vinculadas a esta disciplina
            const disciplinaTurmas = this.state.disciplinasTurmas.find(dt => dt.disciplina === disciplina.id_disciplina);
            const numTurmas = disciplinaTurmas && disciplinaTurmas.turmas ? disciplinaTurmas.turmas.length : 0;
            
            option.textContent = `${disciplina.nome} (${numTurmas} turmas)`;
            this.elements.selectDisciplinas.appendChild(option);
        });
    },
    
    // Atualizar visualização das turmas vinculadas à disciplina selecionada
    atualizarTurmasVinculadas: function() {
        if (!this.elements.vinculosContainer) return;
        
        const disciplinasSelecionadas = Array.from(this.elements.selectDisciplinas.selectedOptions).map(opt => opt.value);
        
        if (disciplinasSelecionadas.length === 0) {
            this.elements.vinculosContainer.innerHTML = '<p class="text-muted">Nenhuma disciplina selecionada</p>';
            return;
        }
        
        let html = '<div class="table-responsive mt-3">';
        html += '<table class="table table-sm table-bordered">';
        html += '<thead><tr><th>Disciplina</th><th>Turmas Disponíveis</th></tr></thead>';
        html += '<tbody>';
        
        // Para cada disciplina selecionada, mostrar as turmas disponíveis com checkboxes
        disciplinasSelecionadas.forEach(disciplinaId => {
            const disciplina = this.state.disciplinas.find(d => d.id_disciplina === disciplinaId);
            if (!disciplina) return;
            
            // Obter todas as turmas da API (podemos filtrar depois se necessário)
            const allTurmas = [];
            this.state.disciplinasTurmas.forEach(dt => {
                if (dt.turmas && Array.isArray(dt.turmas)) {
                    dt.turmas.forEach(turma => {
                        if (!allTurmas.some(t => t.id_turma === turma.id_turma)) {
                            allTurmas.push(turma);
                        }
                    });
                }
            });
            
            html += '<tr>';
            html += `<td>${disciplina.nome}</td>`;
            
            if (allTurmas.length === 0) {
                html += '<td><span class="text-warning">Nenhuma turma disponível no sistema.</span></td>';
            } else {
                html += '<td>';
                html += '<div class="form-group">';
                html += `<div class="mb-2"><button type="button" class="btn btn-sm btn-outline-primary selecionar-todas-turmas" data-disciplina="${disciplinaId}">Selecionar Todas</button> <button type="button" class="btn btn-sm btn-outline-secondary desmarcar-todas-turmas" data-disciplina="${disciplinaId}">Desmarcar Todas</button></div>`;
                html += '<div class="turmas-container" style="max-height: 200px; overflow-y: auto;">';
                
                // Agrupar turmas por turno para melhor organização
                const turnosTurmas = {
                    manha: allTurmas.filter(t => t.turno === 'manha'),
                    tarde: allTurmas.filter(t => t.turno === 'tarde'),
                    noite: allTurmas.filter(t => t.turno === 'noite'),
                    outros: allTurmas.filter(t => !t.turno || !['manha', 'tarde', 'noite'].includes(t.turno))
                };
                
                // Verificar se o professor já possui vínculos com essa disciplina e turmas
                let turmasVinculadas = [];
                if (this.state.modoEdicao && this.state.professorSelecionado) {
                    const idProfessor = this.state.professorSelecionado.id_professor || this.state.professorSelecionado.id;
                    // Verificar em cache de vínculos
                    if (this.state.vinculos.length > 0) {
                        turmasVinculadas = this.state.vinculos
                            .filter(v => v.id_professor === idProfessor && v.id_disciplina === disciplinaId)
                            .map(v => v.id_turma);
                    }
                }
                
                // Renderizar checkboxes por turno
                ['manha', 'tarde', 'noite', 'outros'].forEach(turno => {
                    if (turnosTurmas[turno] && turnosTurmas[turno].length > 0) {
                        const turnoNome = this.traduzirTurno(turno);
                        html += `<div class="mb-2"><strong>${turnoNome}</strong></div>`;
                        html += '<div class="row">';
                        
                        turnosTurmas[turno].forEach(turma => {
                            // Verificar se esta turma já está vinculada
                            const isChecked = turmasVinculadas.includes(turma.id_turma) ? 'checked' : '';
                            
                            html += '<div class="col-md-4 mb-1">';
                            html += `<div class="form-check">
                                <input class="form-check-input checkbox-turma" type="checkbox" ${isChecked}
                                    id="turma-${disciplinaId}-${turma.id_turma}" 
                                    data-disciplina="${disciplinaId}" 
                                    data-turma="${turma.id_turma}" 
                                    data-turma-nome="${turma.serie || turma.id_turma}">
                                <label class="form-check-label" for="turma-${disciplinaId}-${turma.id_turma}">
                                    ${turma.serie || turma.id_turma} (${turma.id_turma})
                                </label>
                            </div>`;
                            html += '</div>';
                        });
                        
                        html += '</div>';
                    }
                });
                
                html += '</div>'; // Fim do container com scroll
                html += '</div>'; // Fim do form-group
                html += '</td>';
            }
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        this.elements.vinculosContainer.innerHTML = html;
        
        // Adicionar event listeners para os botões de selecionar/desmarcar todas
        const selecionarTodos = this.elements.vinculosContainer.querySelectorAll('.selecionar-todas-turmas');
        const desmarcarTodos = this.elements.vinculosContainer.querySelectorAll('.desmarcar-todas-turmas');
        
        selecionarTodos.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const disciplinaId = e.target.dataset.disciplina;
                const checkboxes = this.elements.vinculosContainer.querySelectorAll(`.checkbox-turma[data-disciplina="${disciplinaId}"]`);
                checkboxes.forEach(cb => cb.checked = true);
            });
        });
        
        desmarcarTodos.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const disciplinaId = e.target.dataset.disciplina;
                const checkboxes = this.elements.vinculosContainer.querySelectorAll(`.checkbox-turma[data-disciplina="${disciplinaId}"]`);
                checkboxes.forEach(cb => cb.checked = false);
            });
        });
    },
    
    // Traduzir turno para formato legível
    traduzirTurno: function(turno) {
        const turnos = {
            'manha': 'Manhã',
            'tarde': 'Tarde',
            'noite': 'Noite'
        };
        return turnos[turno] || turno;
    },
    
    // Carregar vínculos de um professor (disciplinas e turmas)
    carregarVinculosProfessor: async function(idProfessor) {
        try {
            // Fazer uma chamada à API para obter os vínculos do professor
            const vinculos = await ConfigModule.fetchApi(`/professores/${idProfessor}/vinculos`);
            return Array.isArray(vinculos) ? vinculos : [];
        } catch (error) {
            console.error(`Erro ao carregar vínculos do professor ${idProfessor}:`, error);
            return [];
        }
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
        
        if (!this.state.professores || this.state.professores.length === 0) {
            this.elements.listaProfessores.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Nenhum professor cadastrado</td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        this.state.professores.forEach(professor => {
            // Obter informações sobre disciplinas
            const disciplinasIds = (professor.disciplinas || []).map(d => typeof d === 'object' ? d.id_disciplina : d);
            const disciplinasNomes = disciplinasIds.map(id => {
                const disc = this.state.disciplinas.find(d => d.id_disciplina === id);
                return disc ? disc.nome : id;
            }).join(', ');
            
            html += `
                <tr>
                    <td>${professor.id_professor || professor.id || ''}</td>
                    <td>${professor.nome_professor || professor.nome || ''}</td>
                    <td>${professor.email_professor || professor.email || ''}</td>
                    <td>
                        <span class="badge bg-info">${disciplinasIds.length} disciplina(s)</span>
                        <button type="button" class="btn btn-sm btn-outline-info ms-2 btn-ver-vinculos" data-id="${professor.id_professor || professor.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                    <td>
                        <button type="button" class="btn btn-sm btn-primary btn-editar" data-id="${professor.id_professor || professor.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger btn-excluir" data-id="${professor.id_professor || professor.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        this.elements.listaProfessores.innerHTML = html;
        
        // Adicionar event listeners para botões de ação
        this.elements.listaProfessores.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => this.editarProfessor(e.currentTarget.dataset.id));
        });
        
        this.elements.listaProfessores.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => this.excluirProfessor(e.currentTarget.dataset.id));
        });
        
        this.elements.listaProfessores.querySelectorAll('.btn-ver-vinculos').forEach(btn => {
            btn.addEventListener('click', (e) => this.mostrarVinculos(e.currentTarget.dataset.id));
        });
    },
    
    // Mostrar vínculos de um professor em um modal
    mostrarVinculos: async function(idProfessor) {
        try {
            // Buscar professor
            const professor = this.state.professores.find(p => (p.id_professor || p.id) === idProfessor);
            if (!professor) {
                this.mostrarErro("Professor não encontrado.");
                return;
            }
            
            // Carregar vínculos do professor
            const vinculos = await this.carregarVinculosProfessor(idProfessor);
            
            // Agrupar vínculos por disciplina
            const vinculosPorDisciplina = {};
            vinculos.forEach(vinculo => {
                if (!vinculosPorDisciplina[vinculo.id_disciplina]) {
                    vinculosPorDisciplina[vinculo.id_disciplina] = [];
                }
                vinculosPorDisciplina[vinculo.id_disciplina].push(vinculo);
            });
            
            // Criar conteúdo do modal
            let modalContent = `
                <div class="modal fade" id="modal-vinculos-professor" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Vínculos do Professor: ${professor.nome_professor || professor.nome}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
            `;
            
            if (Object.keys(vinculosPorDisciplina).length === 0) {
                modalContent += `<p class="text-muted">Este professor não possui vínculos com disciplinas e turmas.</p>`;
            } else {
                modalContent += `<div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Disciplina</th>
                                <th>Turmas</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                for (const disciplinaId in vinculosPorDisciplina) {
                    const disciplina = this.state.disciplinas.find(d => d.id_disciplina === disciplinaId);
                    const disciplinaNome = disciplina ? disciplina.nome : disciplinaId;
                    
                    const turmasIds = vinculosPorDisciplina[disciplinaId].map(v => v.id_turma);
                    const turmasTexto = turmasIds.map(id => {
                        const turma = this.state.turmas.find(t => t.id_turma === id);
                        return turma ? `${turma.serie || id} (${turma.id_turma})` : id;
                    }).join(', ');
                    
                    modalContent += `
                        <tr>
                            <td>${disciplinaNome}</td>
                            <td>${turmasTexto || 'Nenhuma turma vinculada'}</td>
                        </tr>
                    `;
                }
                
                modalContent += `</tbody></table></div>`;
            }
            
            modalContent += `
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar modal ao body e exibi-lo
            const modalElement = document.createElement('div');
            modalElement.innerHTML = modalContent;
            document.body.appendChild(modalElement);
            
            const modal = new bootstrap.Modal(document.getElementById('modal-vinculos-professor'));
            modal.show();
            
            // Remover modal quando fechado
            document.getElementById('modal-vinculos-professor').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });
            
        } catch (error) {
            console.error(`Erro ao mostrar vínculos do professor ${idProfessor}:`, error);
            this.mostrarErro("Não foi possível carregar os vínculos do professor.");
        }
    },
    
    // Iniciar cadastro de novo professor
    novoProfessor: function() {
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        this.state.vinculos = [];
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.classList.remove('d-none');
            this.elements.formProfessor.reset();
            
            // Limpar seleções anteriores no select de disciplinas
            if (this.elements.selectDisciplinas) {
                Array.from(this.elements.selectDisciplinas.options).forEach(option => {
                    option.selected = false;
                });
                
                // Reinicializar select com selectize se estiver usando
                if ($(this.elements.selectDisciplinas).data('selectize')) {
                    $(this.elements.selectDisciplinas).data('selectize').clear();
                }
            }
            
            // Limpar container de turmas vinculadas
            if (this.elements.vinculosContainer) {
                this.elements.vinculosContainer.innerHTML = '<p class="text-muted">Selecione pelo menos uma disciplina para vincular turmas.</p>';
            }
            
            // Habilitar campo de ID do professor para novos registros
            if (this.elements.inputIdProfessor) {
                this.elements.inputIdProfessor.disabled = false;
            }
            
            // Mostrar campo de senha para novos professores
            if (this.elements.inputSenhaProfessor) {
                this.elements.inputSenhaProfessor.required = true;
                this.elements.inputSenhaProfessor.closest('.mb-3').classList.remove('d-none');
            }
            
            // Focar no primeiro campo
            this.elements.inputIdProfessor.focus();
        }
    },
    
    // Cancelar edição/criação
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        this.state.vinculos = [];
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.classList.add('d-none');
            this.elements.formProfessor.reset();
        }
    },
    
    // Excluir professor
    excluirProfessor: async function(id) {
        try {
            if (!confirm('Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.')) {
                return;
            }
            
            await ConfigModule.fetchApi(`/professores/${id}`, {
                method: 'DELETE'
            });
            
            this.mostrarSucesso("Professor excluído com sucesso!");
            
            // Recarregar lista de professores
            await this.carregarProfessores();
        } catch (error) {
            console.error("Erro ao excluir professor:", error);
            this.mostrarErro(`Não foi possível excluir o professor: ${error.message || 'Erro desconhecido'}`);
        }
    },
    
    // Salvar professor (criar novo ou atualizar existente)
    salvarProfessor: async function() {
        try {
            // Obter disciplinas selecionadas
            const disciplinasSelecionadas = this.elements.selectDisciplinas ? 
                Array.from(this.elements.selectDisciplinas.selectedOptions).map(opt => opt.value) : [];
            
            // Preparar dados do professor
            const professorDados = {
                nome_professor: this.elements.inputNomeProfessor.value,
                email_professor: this.elements.inputEmailProfessor.value,
                disciplinas: disciplinasSelecionadas
            };
            
            if (this.elements.inputIdProfessor) {
                professorDados.id_professor = this.elements.inputIdProfessor.value;
            }
            
            // Adicionar senha apenas se for um novo professor ou se foi preenchida
            if (this.elements.inputSenhaProfessor && this.elements.inputSenhaProfessor.value) {
                professorDados.senha_professor = this.elements.inputSenhaProfessor.value;
            }
            
            // Coletar vínculos selecionados entre disciplinas e turmas
            const vinculos = [];
            disciplinasSelecionadas.forEach(disciplinaId => {
                const checkboxes = this.elements.vinculosContainer.querySelectorAll(`.checkbox-turma[data-disciplina="${disciplinaId}"]:checked`);
                checkboxes.forEach(cb => {
                    vinculos.push({
                        disciplina: disciplinaId,
                        turma: cb.dataset.turma
                    });
                });
            });
            
            // Adicionar vínculos aos dados do professor
            professorDados.vinculos = vinculos;
            
            console.log("Dados do professor a serem salvos:", professorDados);
            
            let response;
            
            if (this.state.modoEdicao && this.state.professorSelecionado) {
                // ID para atualização
                const professorId = this.state.professorSelecionado.id_professor || this.state.professorSelecionado.id;
                
                // Atualizar professor existente
                response = await ConfigModule.fetchApi(`/professores/${professorId}`, {
                    method: 'PUT',
                    body: JSON.stringify(professorDados)
                });
                
                this.mostrarSucesso("Professor atualizado com sucesso!");
            } else {
                // Criar novo professor
                response = await ConfigModule.fetchApi('/professores', {
                    method: 'POST',
                    body: JSON.stringify(professorDados)
                });
                
                this.mostrarSucesso("Professor criado com sucesso!");
            }
            
            console.log("Resposta da API:", response);
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Recarregar lista de professores
            await this.carregarProfessores();
            
        } catch (error) {
            console.error("Erro ao salvar professor:", error);
            this.mostrarErro(`Não foi possível salvar o professor: ${error.message || 'Erro desconhecido'}`);
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
    },

    // Configurar eventos
    configurarEventos: function() {
        // Evento para criar novo professor
        if (this.elements.btnNovoProfessor) {
            this.elements.btnNovoProfessor.addEventListener('click', () => this.novoProfessor());
        }
        
        // Evento para salvar professor
        if (this.elements.formProfessor) {
            this.elements.formProfessor.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarProfessor();
            });
        }
        
        // Evento para cancelar edição
        if (this.elements.btnCancelarProfessor) {
            this.elements.btnCancelarProfessor.addEventListener('click', () => this.cancelarEdicao());
        }
        
        // Evento para quando disciplinas são selecionadas
        if (this.elements.selectDisciplinas) {
            this.elements.selectDisciplinas.addEventListener('change', () => this.atualizarTurmasVinculadas());
        }
        
        console.log("Eventos configurados para o módulo de professores");
    },

    // Carregar disciplinas da API
    carregarDisciplinas: async function() {
        try {
            const disciplinas = await ConfigModule.fetchApi('/disciplinas');
            this.state.disciplinas = disciplinas;
            this.popularSelectDisciplinas();
            console.log("Disciplinas carregadas com sucesso:", disciplinas);
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas.");
        }
    },

    // Carregar turmas da API
    carregarTurmas: async function() {
        try {
            const turmas = await ConfigModule.fetchApi('/turmas');
            this.state.turmas = turmas;
            console.log("Turmas carregadas com sucesso:", turmas);
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            this.mostrarErro("Não foi possível carregar as turmas.");
        }
    },

    // Carregar vínculos entre disciplinas e turmas
    carregarDisciplinasTurmas: async function() {
        try {
            const disciplinasTurmas = await ConfigModule.fetchApi('/disciplinas-turmas');
            this.state.disciplinasTurmas = disciplinasTurmas;
            console.log("Vínculos de disciplinas e turmas carregados com sucesso:", disciplinasTurmas);
        } catch (error) {
            console.error("Erro ao carregar vínculos de disciplinas e turmas:", error);
            this.mostrarErro("Não foi possível carregar os vínculos entre disciplinas e turmas.");
        }
    },

    // Exibir mensagem de erro
    mostrarErro: function(mensagem) {
        // Implementar exibição de mensagem de erro
        console.error(mensagem);
        // Exemplo usando Toast do Bootstrap
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toastId = `erro-${Date.now()}`;
            const toast = `
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                    <div class="toast-header bg-danger text-white">
                        <strong class="me-auto">Erro</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>
                    </div>
                    <div class="toast-body">
                        ${mensagem}
                    </div>
                </div>
            `;
            toastContainer.insertAdjacentHTML('beforeend', toast);
            const toastElement = document.getElementById(toastId);
            const bsToast = new bootstrap.Toast(toastElement);
            bsToast.show();
            
            // Remover toast após ser ocultado
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        } else {
            alert(`Erro: ${mensagem}`);
        }
    },

    // Exibir mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        // Implementar exibição de mensagem de sucesso
        console.log(mensagem);
        // Exemplo usando Toast do Bootstrap
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
            const toastId = `sucesso-${Date.now()}`;
            const toast = `
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                    <div class="toast-header bg-success text-white">
                        <strong class="me-auto">Sucesso</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fechar"></button>
                    </div>
                    <div class="toast-body">
                        ${mensagem}
                    </div>
                </div>
            `;
            toastContainer.insertAdjacentHTML('beforeend', toast);
            const toastElement = document.getElementById(toastId);
            const bsToast = new bootstrap.Toast(toastElement);
            bsToast.show();
            
            // Remover toast após ser ocultado
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        } else {
            alert(`Sucesso: ${mensagem}`);
        }
    }
};

// Exportar módulo
export default ProfessoresModule;
