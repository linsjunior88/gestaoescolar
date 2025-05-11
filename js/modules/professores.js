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
            // Em vez de chamar um endpoint específico para vínculos, vamos usar os dados que já temos
            this.state.disciplinasTurmas = [];
            
            // Para cada disciplina, vamos buscar as turmas associadas
            for (const disciplina of this.state.disciplinas) {
                try {
                    // Buscar turmas para esta disciplina
                    const turmas = await ConfigModule.fetchApi(`/disciplinas/${disciplina.id_disciplina}/turmas`);
                    
                    if (Array.isArray(turmas) && turmas.length > 0) {
                        this.state.disciplinasTurmas.push({
                            disciplina: disciplina.id_disciplina,
                            turmas: turmas
                        });
                    }
                } catch (erro) {
                    console.warn(`Não foi possível carregar turmas para a disciplina ${disciplina.id_disciplina}:`, erro);
                }
            }
            
            console.log("Vínculos de disciplinas e turmas carregados:", this.state.disciplinasTurmas);
        } catch (error) {
            console.error("Erro ao carregar vínculos de disciplinas e turmas:", error);
            this.mostrarErro("Não foi possível carregar os vínculos entre disciplinas e turmas.");
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
            
            // Verificar qual propriedade contém o nome da disciplina
            const nomeDisciplina = disciplina.nome_disciplina || disciplina.nome || disciplina.id_disciplina;
            
            option.textContent = `${nomeDisciplina} (${numTurmas} turmas)`;
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
            
            // Verificar qual propriedade contém o nome da disciplina
            const nomeDisciplina = disciplina.nome_disciplina || disciplina.nome || disciplina.id_disciplina;
            
            // Obter TODAS as turmas disponíveis no sistema
            const allTurmas = this.state.turmas || [];
            
            html += '<tr>';
            html += `<td>${nomeDisciplina}</td>`;
            
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
            // Tentar buscar diretamente os vínculos do professor da tabela professor_disciplina_turma
            try {
                const vinculos = await ConfigModule.fetchApi(`/professores/${idProfessor}/vinculos`);
                if (Array.isArray(vinculos) && vinculos.length > 0) {
                    console.log("Vínculos encontrados na API:", vinculos);
                    return vinculos;
                }
            } catch (error) {
                console.warn("Endpoint de vínculos não disponível, tentando método alternativo:", error);
            }
            
            // Método alternativo: Buscar professor e disciplinas
            const professor = await ConfigModule.fetchApi(`/professores/${idProfessor}`);
            
            // Verificar se o professor possui dados de disciplinas
            if (!professor || !professor.disciplinas || !Array.isArray(professor.disciplinas)) {
                console.warn("Professor não possui disciplinas ou formato incorreto:", professor);
                return [];
            }
            
            // Construir os vínculos manualmente baseado nas disciplinas do professor
            const vinculos = [];
            
            // Para cada disciplina do professor, verificar se há turmas associadas
            for (const disciplina of professor.disciplinas) {
                const disciplinaId = typeof disciplina === 'object' ? disciplina.id_disciplina : disciplina;
                
                try {
                    // Buscar turmas para esta disciplina especificamente para este professor
                    const turmas = await ConfigModule.fetchApi(`/professores/${idProfessor}/disciplinas/${disciplinaId}/turmas`);
                    
                    if (Array.isArray(turmas) && turmas.length > 0) {
                        // Adicionar cada turma como um vínculo
                        turmas.forEach(turma => {
                            vinculos.push({
                                id_professor: idProfessor,
                                id_disciplina: disciplinaId,
                                id_turma: turma.id_turma,
                                serie: turma.serie,
                                turno: turma.turno
                            });
                        });
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar turmas para disciplina ${disciplinaId}:`, error);
                    
                    // Tente outra alternativa se disponível
                    try {
                        const vinculosDisciplina = await ConfigModule.fetchApi(`/professores/${idProfessor}/disciplinas/${disciplinaId}`);
                        if (vinculosDisciplina && Array.isArray(vinculosDisciplina.turmas)) {
                            vinculosDisciplina.turmas.forEach(turma => {
                                vinculos.push({
                                    id_professor: idProfessor,
                                    id_disciplina: disciplinaId,
                                    id_turma: turma.id_turma || turma,
                                    serie: typeof turma === 'object' ? turma.serie : null,
                                    turno: typeof turma === 'object' ? turma.turno : null
                                });
                            });
                        }
                    } catch (innerError) {
                        console.warn(`Alternativa para buscar vínculos falhou:`, innerError);
                    }
                }
            }
            
            console.log("Vínculos gerados para o professor:", vinculos);
            return vinculos;
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
                return disc ? (disc.nome_disciplina || disc.nome || id) : id;
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
            
            // Mostrar spinner durante o carregamento
            const spinnerElement = document.createElement('div');
            spinnerElement.innerHTML = `
                <div id="loading-vinculos" class="position-fixed top-50 start-50 translate-middle">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(spinnerElement);
            
            // Carregar vínculos do professor
            const vinculos = await this.carregarVinculosProfessor(idProfessor);
            
            // Remover spinner
            document.getElementById('loading-vinculos')?.remove();
            
            // Agrupar vínculos por disciplina
            const vinculosPorDisciplina = {};
            vinculos.forEach(vinculo => {
                const disciplinaId = vinculo.id_disciplina || vinculo.disciplina;
                if (!disciplinaId) return;
                
                if (!vinculosPorDisciplina[disciplinaId]) {
                    vinculosPorDisciplina[disciplinaId] = [];
                }
                vinculosPorDisciplina[disciplinaId].push(vinculo);
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
                modalContent += `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Este professor não possui vínculos com disciplinas e turmas.
                </div>
                <p>Dicas para vincular:</p>
                <ul>
                    <li>Edite o professor clicando no botão <button class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></button></li>
                    <li>Selecione as disciplinas desejadas</li>
                    <li>Para cada disciplina, marque as turmas que este professor irá lecionar</li>
                    <li>Salve as alterações</li>
                </ul>`;
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
                    const disciplinaNome = disciplina ? (disciplina.nome_disciplina || disciplina.nome || disciplinaId) : disciplinaId;
                    
                    const turmasIds = vinculosPorDisciplina[disciplinaId].map(v => v.id_turma || v.turma);
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
                                <button type="button" class="btn btn-primary btn-editar-vinculos" data-id="${idProfessor}">
                                    <i class="fas fa-edit"></i> Editar Vínculos
                                </button>
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
            
            // Adicionar evento para botão de editar vínculos
            document.querySelector('.btn-editar-vinculos').addEventListener('click', () => {
                modal.hide();
                this.editarProfessor(idProfessor);
            });
            
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
                        id_disciplina: disciplinaId,
                        id_turma: cb.dataset.turma
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
    
    // Exibir mensagem de erro
    mostrarErro: function(mensagem) {
        console.error(mensagem);
        
        // Criar alerta de erro
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-danger alert-dismissible fade show';
        alertContainer.role = 'alert';
        alertContainer.innerHTML = `
            <strong>Erro!</strong> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Inserir no topo do conteúdo
        const conteudo = this.elements.conteudoProfessores;
        if (conteudo) {
            conteudo.insertBefore(alertContainer, conteudo.firstChild);
            
            // Auto-remover após alguns segundos
            setTimeout(() => {
                alertContainer.remove();
            }, 5000);
        } else {
            // Fallback para alert padrão
            alert(`Erro: ${mensagem}`);
        }
    },

    // Exibir mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        console.log(mensagem);
        
        // Criar alerta de sucesso
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-success alert-dismissible fade show';
        alertContainer.role = 'alert';
        alertContainer.innerHTML = `
            <strong>Sucesso!</strong> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Inserir no topo do conteúdo
        const conteudo = this.elements.conteudoProfessores;
        if (conteudo) {
            conteudo.insertBefore(alertContainer, conteudo.firstChild);
            
            // Auto-remover após alguns segundos
            setTimeout(() => {
                alertContainer.remove();
            }, 5000);
        } else {
            // Fallback para alert padrão
            alert(`Sucesso: ${mensagem}`);
        }
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

    // Editar professor existente
    editarProfessor: async function(id) {
        try {
            // Carregar detalhes completos do professor
            const professor = await ConfigModule.fetchApi(`/professores/${id}`);
            if (!professor) {
                this.mostrarErro("Professor não encontrado.");
                return;
            }
            
            console.log("Editando professor:", professor);
            
            // Carregar vínculos do professor para uso posterior
            this.state.vinculos = await this.carregarVinculosProfessor(id);
            console.log("Vínculos carregados:", this.state.vinculos);
            
            this.state.modoEdicao = true;
            this.state.professorSelecionado = professor;
            
            if (this.elements.formProfessor) {
                this.elements.formProfessor.classList.remove('d-none');
                
                // Preencher campos
                if (this.elements.inputIdProfessor) {
                    this.elements.inputIdProfessor.value = professor.id_professor || '';
                    this.elements.inputIdProfessor.disabled = true; // Não permitir alterar o ID
                }
                
                this.elements.inputNomeProfessor.value = professor.nome_professor || professor.nome || '';
                this.elements.inputEmailProfessor.value = professor.email_professor || professor.email || '';
                
                // Campo de senha não é obrigatório na edição
                if (this.elements.inputSenhaProfessor) {
                    this.elements.inputSenhaProfessor.required = false;
                    this.elements.inputSenhaProfessor.value = '';
                    this.elements.inputSenhaProfessor.closest('.mb-3').classList.add('d-none');
                }
                
                // Selecionar disciplinas do professor
                if (professor.disciplinas && Array.isArray(professor.disciplinas) && this.elements.selectDisciplinas) {
                    console.log("Disciplinas do professor:", professor.disciplinas);
                    
                    // Limpar seleções anteriores
                    Array.from(this.elements.selectDisciplinas.options).forEach(option => {
                        option.selected = false;
                    });
                    
                    // Selecionar disciplinas
                    professor.disciplinas.forEach(disc => {
                        const disciplinaId = typeof disc === 'object' ? (disc.id_disciplina || disc.id) : disc;
                        const option = Array.from(this.elements.selectDisciplinas.options).find(
                            opt => opt.value === disciplinaId.toString()
                        );
                        
                        if (option) option.selected = true;
                    });
                    
                    // Atualizar visualização de turmas
                    this.atualizarTurmasVinculadas();
                }
                
                this.elements.inputNomeProfessor.focus();
            }
        } catch (error) {
            console.error("Erro ao editar professor:", error);
            this.mostrarErro("Não foi possível carregar os dados do professor para edição.");
        }
    }
};

// Exportar módulo
export default ProfessoresModule;
