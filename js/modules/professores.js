/**
 * Módulo de Professores
 * Contém todas as funções relacionadas à gestão de professores
 */

import ConfigModule from './config.js';
import UIModule from './ui.js';
import DashboardModule from './dashboard.js';

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
        vinculos: [], // Para armazenar os vínculos de disciplinas e turmas do professor
        carregandoProfessores: false // Flag para evitar chamadas múltiplas
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
        console.log("Inicializando módulo de professores");
        
        try {
            // Inicializar elementos
            this.cachearElementos();
            
            // Configurar eventos
            this.adicionarEventListeners();
            
            // Carregar dados necessários
            await this.carregarDisciplinas();
            await this.carregarTurmas();
            await this.carregarDisciplinasTurmas();
            await this.carregarProfessores();
            
            // Garantir que o dashboard seja atualizado após a inicialização
            setTimeout(() => {
                this.atualizarDashboard();
            }, 1000);
            
            console.log("Módulo de professores inicializado com sucesso");
            return this;
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
        this.elements.inputCpfProfessor = document.getElementById('cpf-professor');
        this.elements.selectDisciplinas = document.getElementById('disciplinas-professor');
        this.elements.vinculosContainer = document.getElementById('vinculos-container');
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
                console.log("=== EVENT CHANGE DISPARADO no select de disciplinas ===");
                this.atualizarTurmasVinculadas();
            });
            console.log("Event listener adicionado ao select de disciplinas");
        } else {
            console.error("Select de disciplinas não encontrado para adicionar event listener");
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
        console.log("=== POPULANDO SELECT DE DISCIPLINAS ===");
        if (!this.elements.selectDisciplinas) {
            console.error("Select de disciplinas não encontrado");
            return;
        }
        
        console.log("Disciplinas disponíveis:", this.state.disciplinas.length);
        
        // Limpar select
        this.elements.selectDisciplinas.innerHTML = '';
        
        // Adicionar opções
        this.state.disciplinas.forEach(disciplina => {
            const option = document.createElement('option');
            option.value = disciplina.id_disciplina;
            
            // Verificar qual propriedade contém o nome da disciplina
            const nomeDisciplina = disciplina.nome_disciplina || disciplina.nome || disciplina.id_disciplina;
            
            // Se estivermos editando um professor, mostrar quantas turmas ele tem vinculadas nesta disciplina
            let numTurmasVinculadas = 0;
            if (this.state.modoEdicao && this.state.vinculos && this.state.vinculos.length > 0) {
                // Contar turmas vinculadas para esta disciplina específica
                numTurmasVinculadas = this.state.vinculos.filter(vinculo => {
                    const vIdDisciplina = String(vinculo.id_disciplina || vinculo.disciplina);
                    return vIdDisciplina === String(disciplina.id_disciplina);
                }).length;
                
                console.log(`Disciplina ${nomeDisciplina}: ${numTurmasVinculadas} turmas vinculadas para este professor`);
            } else {
                // Para novo professor, mostrar total de turmas disponíveis no sistema
                numTurmasVinculadas = this.state.turmas ? this.state.turmas.length : 0;
                console.log(`Novo professor - Disciplina ${nomeDisciplina}: ${numTurmasVinculadas} turmas disponíveis`);
            }
            
            option.textContent = `${nomeDisciplina} (${numTurmasVinculadas} turmas)`;
            this.elements.selectDisciplinas.appendChild(option);
            
            console.log(`Disciplina adicionada: ${nomeDisciplina} (ID: ${disciplina.id_disciplina})`);
        });
        
        console.log("Select de disciplinas populado com", this.elements.selectDisciplinas.options.length, "opções");
    },
    
    // Atualizar visualização das turmas vinculadas à disciplina selecionada
    atualizarTurmasVinculadas: function() {
        console.log("=== INICIANDO atualizarTurmasVinculadas ===");
        console.log("Container:", this.elements.vinculosContainer);
        console.log("Select disciplinas:", this.elements.selectDisciplinas);
        
        if (!this.elements.vinculosContainer) {
            console.error("Container de vínculos não encontrado - ID: vinculos-container");
            // Tentar encontrar o elemento novamente
            this.elements.vinculosContainer = document.getElementById('vinculos-container');
            if (!this.elements.vinculosContainer) {
                console.error("Ainda não foi possível encontrar o container de vínculos");
                return;
            }
        }
        
        if (!this.elements.selectDisciplinas) {
            console.error("Select de disciplinas não encontrado");
            return;
        }
        
        const disciplinasSelecionadas = Array.from(this.elements.selectDisciplinas.selectedOptions).map(opt => opt.value);
        console.log("Disciplinas selecionadas:", disciplinasSelecionadas);
        console.log("Total disciplinas disponíveis:", this.state.disciplinas.length);
        console.log("Total turmas disponíveis:", this.state.turmas.length);
        
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
            console.log(`Turmas disponíveis para disciplina ${disciplinaId}:`, allTurmas);
            
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
                    const idProfessor = String(this.state.professorSelecionado.id_professor || this.state.professorSelecionado.id);
                    // Verificar em cache de vínculos
                    if (this.state.vinculos && this.state.vinculos.length > 0) {
                        console.log("Verificando vínculos para disciplina", disciplinaId, "e professor", idProfessor);
                        console.log("Vínculos disponíveis:", this.state.vinculos);
                        
                        turmasVinculadas = this.state.vinculos
                            .filter(v => {
                                const vIdProfessor = String(v.id_professor || v.professor);
                                const vIdDisciplina = String(v.id_disciplina || v.disciplina);
                                const match = vIdProfessor === idProfessor && vIdDisciplina === disciplinaId;
                                
                                console.log(`Vínculo: prof=${vIdProfessor}, disc=${vIdDisciplina}, turma=${v.id_turma || v.turma}, match=${match}`);
                                return match;
                            })
                            .map(v => String(v.id_turma || v.turma));
                            
                        console.log("Turmas vinculadas para disciplina", disciplinaId, ":", turmasVinculadas);
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
                            const turmaIdStr = String(turma.id_turma);
                            const isChecked = turmasVinculadas.includes(turmaIdStr) ? 'checked' : '';
                            
                            console.log(`Turma ${turmaIdStr}: vinculada=${turmasVinculadas.includes(turmaIdStr)}, checked=${isChecked}`);
                            
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
        
        console.log("HTML gerado para turmas:", html);
        this.elements.vinculosContainer.innerHTML = html;
        
        // Adicionar event listeners para os botões de selecionar/desmarcar todas
        const selecionarTodos = this.elements.vinculosContainer.querySelectorAll('.selecionar-todas-turmas');
        const desmarcarTodos = this.elements.vinculosContainer.querySelectorAll('.desmarcar-todas-turmas');
        
        selecionarTodos.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const disciplinaId = e.target.dataset.disciplina;
                const checkboxes = this.elements.vinculosContainer.querySelectorAll(`.checkbox-turma[data-disciplina="${disciplinaId}"]`);
                checkboxes.forEach(cb => cb.checked = true);
                this.atualizarContadorTurmasSelect();
            });
        });
        
        desmarcarTodos.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const disciplinaId = e.target.dataset.disciplina;
                const checkboxes = this.elements.vinculosContainer.querySelectorAll(`.checkbox-turma[data-disciplina="${disciplinaId}"]`);
                checkboxes.forEach(cb => cb.checked = false);
                this.atualizarContadorTurmasSelect();
            });
        });
        
        // Adicionar listeners para checkboxes individuais para atualizar contador
        const checkboxes = this.elements.vinculosContainer.querySelectorAll('.checkbox-turma');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.atualizarContadorTurmasSelect();
            });
        });
        
        // Atualizar contador inicial
        this.atualizarContadorTurmasSelect();
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
    
    // Atualizar contador de turmas no select de disciplinas
    atualizarContadorTurmasSelect: function() {
        if (!this.elements.selectDisciplinas) return;
        
        console.log("Atualizando contador de turmas no select...");
        
        // Para cada opção no select, atualizar o contador
        Array.from(this.elements.selectDisciplinas.options).forEach(option => {
            const disciplinaId = option.value;
            const disciplina = this.state.disciplinas.find(d => d.id_disciplina === disciplinaId);
            
            if (disciplina) {
                const nomeDisciplina = disciplina.nome_disciplina || disciplina.nome || disciplina.id_disciplina;
                
                // Contar quantas turmas estão marcadas para esta disciplina
                const checkboxesMarcados = this.elements.vinculosContainer.querySelectorAll(`.checkbox-turma[data-disciplina="${disciplinaId}"]:checked`);
                const numTurmasMarcadas = checkboxesMarcados.length;
                
                // Atualizar o texto da opção
                option.textContent = `${nomeDisciplina} (${numTurmasMarcadas} turmas)`;
                
                console.log(`Disciplina ${nomeDisciplina}: ${numTurmasMarcadas} turmas marcadas`);
            }
        });
    },
    
    // Carregar vínculos de um professor (disciplinas e turmas)
    carregarVinculosProfessor: async function(idProfessor) {
        try {
            console.log(`Buscando vínculos para o professor ${idProfessor}`);
            
            // Garantir que idProfessor seja uma string para comparações consistentes
            idProfessor = String(idProfessor);
            
            // Tentar buscar diretamente da tabela professor_disciplina_turma
            try {
                console.log("Tentando buscar da tabela professor_disciplina_turma");
                
                // Primeiro tentar o endpoint específico que funciona
                const vinculosEspecifico = await ConfigModule.fetchApi(`/buscar_vinculos_professor_completo/${idProfessor}`);
                
                if (Array.isArray(vinculosEspecifico) && vinculosEspecifico.length > 0) {
                    console.log("Vínculos encontrados via endpoint específico:", vinculosEspecifico);
                    return vinculosEspecifico;
                }
                
                // Se não funcionou, tentar o endpoint geral
                const vinculosDireta = await ConfigModule.fetchApi(`/professor_disciplina_turma?professor_id=${idProfessor}`);
                
                if (Array.isArray(vinculosDireta) && vinculosDireta.length > 0) {
                    // Filtrar para garantir que só retornamos vínculos deste professor
                    const vinculosFiltrados = vinculosDireta.filter(v => 
                        String(v.id_professor) === idProfessor || 
                        String(v.professor) === idProfessor
                    );
                    
                    console.log("Vínculos encontrados na tabela professor_disciplina_turma:", vinculosFiltrados);
                    return vinculosFiltrados;
                }
            } catch (error) {
                console.warn("Erro ao buscar da tabela professor_disciplina_turma:", error);
                
                // Tentar formato alternativo
                try {
                    console.log("Tentando formato alternativo: id_professor");
                    const vinculosAlt = await ConfigModule.fetchApi(`/professor_disciplina_turma?id_professor=${idProfessor}`);
                    
                    if (Array.isArray(vinculosAlt) && vinculosAlt.length > 0) {
                        // Filtrar para garantir que só retornamos vínculos deste professor
                        const vinculosFiltrados = vinculosAlt.filter(v => 
                            String(v.id_professor) === idProfessor || 
                            String(v.professor) === idProfessor
                        );
                        
                        console.log("Vínculos encontrados com formato alternativo:", vinculosFiltrados);
                        return vinculosFiltrados;
                    }
                } catch (errorAlt) {
                    console.warn("Erro ao buscar com formato alternativo:", errorAlt);
                }
            }
            
            // Se chegou aqui, não conseguiu encontrar vínculos
            console.log("Nenhum vínculo encontrado para o professor. Usando disciplinas associadas.");
            
            // Buscar as disciplinas associadas ao professor
            const professor = await ConfigModule.fetchApi(`/professores/${idProfessor}`);
            
            if (!professor || !professor.disciplinas || !Array.isArray(professor.disciplinas)) {
                console.warn("Professor não possui disciplinas:", professor);
                return [];
            }
            
            // Se o professor tem disciplinas, mas não temos os vínculos específicos de turmas,
            // vamos ao menos retornar as disciplinas para exibição
            const disciplinas = professor.disciplinas;
            console.log("Disciplinas do professor:", disciplinas);
            
            // Criar vínculos fictícios apenas para exibição
            const vinculosFicticios = [];
            
            disciplinas.forEach(disc => {
                const disciplinaId = typeof disc === 'object' ? disc.id_disciplina : disc;
                
                vinculosFicticios.push({
                    id_professor: idProfessor,
                    id_disciplina: disciplinaId,
                    // Não temos informação sobre turmas, então deixamos vazio
                    turmas: []
                });
            });
            
            console.log("Vínculos fictícios criados a partir das disciplinas:", vinculosFicticios);
            return vinculosFicticios;
            
        } catch (error) {
            console.error(`Erro ao carregar vínculos do professor ${idProfessor}:`, error);
            return [];
        }
    },
    
    // Carregar professores da API
    carregarProfessores: async function() {
        // Evitar chamadas múltiplas simultâneas
        if (this.state.carregandoProfessores) {
            console.log("Carregamento de professores já em andamento, ignorando chamada duplicada");
            return this.state.professores;
        }
        
        this.state.carregandoProfessores = true;
        
        try {
            const professores = await ConfigModule.fetchApi('/professores');
            
            console.log("Professores carregados (total):", professores.length);
            
            // Mostrar log detalhado dos professores para debug
            professores.forEach((p, idx) => {
                console.log(`Professor ${idx+1}/${professores.length}: ID=${p.id_professor || p.id}, Nome=${p.nome_professor || p.nome}, Ativo=${p.ativo}`);
            });
            
            // Filtrar professores usando múltiplos critérios (igual ao dashboard)
            const professoresAtivos = professores.filter(professor => {
                // Verificação explícita para o campo 'ativo'
                if (professor.ativo === false) {
                    console.log(`Professor ${professor.id_professor || professor.id} excluído por ativo=false`);
                    return false;
                }
                
                // Professor está ativo (ativo=true, ativo=undefined, ou ativo=null são considerados ativos)
                return true;
            });
            
            console.log(`Professores - Total: ${professores.length}, Ativos: ${professoresAtivos.length}, Inativos: ${professores.length - professoresAtivos.length}`);
            
            this.state.professores = professoresAtivos;
            this.renderizarProfessores();
            console.log("Professores ativos carregados com sucesso:", professoresAtivos);
            
            // Forçar atualização do dashboard para refletir o número correto de professores
            this.atualizarDashboard();
            
            return professoresAtivos;
        } catch (error) {
            console.error("Erro ao carregar professores:", error);
            this.mostrarErro("Não foi possível carregar os professores. Tente novamente mais tarde.");
            return [];
        } finally {
            this.state.carregandoProfessores = false;
        }
    },
    
    // Renderizar lista de professores
    renderizarProfessores: function() {
        if (!this.elements.listaProfessores) return;
        
        if (!this.state.professores || this.state.professores.length === 0) {
            this.elements.listaProfessores.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Nenhum professor cadastrado</td>
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
                    <td>${professor.cpf || 'N/A'}</td>
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
    
    // Mostrar mensagem de erro
    mostrarErro: function(mensagem) {
        UIModule.mostrarErro(mensagem);
    },
    
    // Mostrar mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        UIModule.mostrarSucesso(mensagem);
    },
    
    // Confirmar exclusão
    confirmarExclusao: function(id) {
        const professor = this.state.professores.find(p => (p.id_professor || p.id) === id);
        if (!professor) {
            return this.mostrarErro("Professor não encontrado.");
        }
        
        const professorNome = professor.nome_professor || professor.nome || id;
        
        UIModule.confirmar(
            `Tem certeza que deseja excluir o professor "${professorNome}"?`,
            "Excluir Professor",
            () => this.excluirProfessor(id),
            null,
            {
                textoBotaoConfirmar: "Excluir",
                classeBotaoConfirmar: "btn-danger",
                icone: "trash"
            }
        );
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
            
            // CORREÇÃO: Garantir que estamos trabalhando apenas com os vínculos deste professor específico
            const vinculosFiltrados = vinculos.filter(vinculo => 
                (vinculo.id_professor === idProfessor || vinculo.professor === idProfessor)
            );
            
            console.log(`Vínculos filtrados para o professor ${idProfessor}:`, vinculosFiltrados);
            
            // Agrupar vínculos por disciplina
            const vinculosPorDisciplina = {};
            vinculosFiltrados.forEach(vinculo => {
                const disciplinaId = vinculo.id_disciplina || vinculo.disciplina;
                if (!disciplinaId) return;
                
                if (!vinculosPorDisciplina[disciplinaId]) {
                    vinculosPorDisciplina[disciplinaId] = [];
                }
                vinculosPorDisciplina[disciplinaId].push(vinculo);
            });
            
            // Criar conteúdo do corpo do modal
            let modalBody = '';
            
            if (Object.keys(vinculosPorDisciplina).length === 0) {
                modalBody = `
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
                modalBody = `<div class="table-responsive">
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
                    
                    modalBody += `
                        <tr>
                            <td>${disciplinaNome}</td>
                            <td>${turmasTexto || 'Nenhuma turma vinculada'}</td>
                        </tr>
                    `;
                }
                
                modalBody += `</tbody></table></div>`;
            }
            
            // Rodapé do modal
            const modalFooter = `
                <button type="button" class="btn btn-primary btn-editar-vinculos" data-id="${idProfessor}" autofocus>
                    <i class="fas fa-edit"></i> Editar Vínculos
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            `;
            
            // Usar a função criarModal para gerar o modal com melhor usabilidade
            const modal = UIModule.criarModal(
                'modal-vinculos-professor',
                `Vínculos do Professor: ${professor.nome_professor || professor.nome}`,
                modalBody,
                modalFooter
            );
            
            // Adicionar evento para botão de editar vínculos
            const btnEditarVinculos = document.querySelector('.btn-editar-vinculos');
            if (btnEditarVinculos) {
                btnEditarVinculos.addEventListener('click', () => {
                    modal.hide();
                    this.editarProfessor(idProfessor);
                });
                
                // Focar no botão de editar vínculos automaticamente
                setTimeout(() => {
                    btnEditarVinculos.focus();
                }, 300);
            }
            
        } catch (error) {
            console.error(`Erro ao mostrar vínculos do professor ${idProfessor}:`, error);
            this.mostrarErro("Não foi possível carregar os vínculos do professor.");
        }
    },
    
    // Iniciar cadastro de novo professor
    novoProfessor: function() {
        console.log("=== INICIANDO NOVO PROFESSOR ===");
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        this.state.vinculos = [];
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.classList.remove('d-none');
            this.elements.formProfessor.reset();
            
            // Repopular o select de disciplinas para mostrar a contagem correta (turmas disponíveis)
            this.popularSelectDisciplinas();
            
            // Limpar seleções anteriores no select de disciplinas
            if (this.elements.selectDisciplinas) {
                Array.from(this.elements.selectDisciplinas.options).forEach(option => {
                    option.selected = false;
                });
                console.log("Disciplinas desmarcadas para novo professor");
            }
            
            // Limpar container de turmas vinculadas
            if (this.elements.vinculosContainer) {
                this.elements.vinculosContainer.innerHTML = '<p class="text-muted">Selecione pelo menos uma disciplina para vincular turmas.</p>';
                console.log("Container de vínculos limpo para novo professor");
            } else {
                console.error("Container de vínculos não encontrado em novoProfessor");
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
        
        // CORREÇÃO: Limpar explicitamente o array de vínculos para evitar dados residuais
        this.state.vinculos = [];
            
            if (this.elements.formProfessor) {
            this.elements.formProfessor.classList.add('d-none');
            this.elements.formProfessor.reset();
        }
    },
    
    // Excluir professor
    excluirProfessor: async function(id) {
        try {
            if (!confirm('Tem certeza que deseja excluir este professor? Esta ação irá desativá-lo no sistema.')) {
                return;
            }
            
            console.log(`Iniciando exclusão do professor ${id}`);
            
            // Primeiro, excluir todos os vínculos do professor na tabela professor_disciplina_turma
            try {
                console.log("Excluindo vínculos do professor...");
                
                // Buscar vínculos existentes do professor
                const vinculos = await ConfigModule.fetchApi(`/professor_disciplina_turma?id_professor=${id}`);
                console.log("Vínculos encontrados para exclusão:", vinculos);
                
                // Excluir cada vínculo individualmente
                for (const vinculo of vinculos) {
                    try {
                        await ConfigModule.fetchApi(`/professor_disciplina_turma/${vinculo.id}`, {
                            method: 'DELETE'
                        });
                        console.log(`Vínculo ${vinculo.id} excluído com sucesso`);
                    } catch (error) {
                        console.warn(`Erro ao excluir vínculo ${vinculo.id}:`, error);
                    }
                }
                
                console.log("Vínculos excluídos com sucesso");
            } catch (error) {
                console.warn("Erro ao excluir vínculos, continuando com a desativação do professor:", error);
            }
            
            // Exclusão lógica: marcar professor como inativo
            try {
                console.log(`Desativando professor ${id}...`);
                
                // Obter dados atuais do professor
                const professor = await ConfigModule.fetchApi(`/professores/${id}`);
                console.log("Dados atuais do professor:", professor);
                
                if (!professor || (!professor.id_professor && !professor.id)) {
                    throw new Error("Professor não encontrado ou resposta inválida da API");
                }
                
                // Marcar como inativo usando apenas o campo ativo
                const dadosAtualizacao = {
                    id_professor: professor.id_professor,
                    nome_professor: professor.nome_professor,
                    email_professor: professor.email_professor,
                    senha_professor: professor.senha_professor,
                    telefone_professor: professor.telefone_professor || null,
                    ativo: false
                };
                
                console.log("Desativando professor com dados:", dadosAtualizacao);
                
                const resultado = await ConfigModule.fetchApi(`/professores/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(dadosAtualizacao)
                });
                
                console.log("Professor desativado com sucesso:", resultado);
                this.mostrarSucesso("Professor removido com sucesso!");
                
                // Remover da interface e recarregar dados
                this.state.professores = this.state.professores.filter(
                    p => (p.id_professor || p.id) !== id
                );
                
                this.renderizarProfessores();
                this.atualizarDashboard();
                
            } catch (error) {
                console.error("Erro ao desativar professor:", error);
                this.mostrarErro(`Erro ao desativar professor: ${error.message || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error("Erro geral ao excluir professor:", error);
            this.mostrarErro(`Não foi possível excluir o professor: ${error.message || 'Erro desconhecido'}`);
        }
    },
    
    // Atualizar dashboard após mudanças
    atualizarDashboard: function() {
        console.log("Atualizando dashboard após modificação de professores");
        if (typeof DashboardModule !== 'undefined' && DashboardModule.atualizarDashboard) {
            DashboardModule.atualizarDashboard();
        } else {
            console.warn("Módulo de dashboard não encontrado para atualização");
            
            // Tentar atualizar o contador de professores diretamente
            const totalProfessoresElement = document.getElementById('total-professores');
            if (totalProfessoresElement) {
                totalProfessoresElement.textContent = this.state.professores.length;
            }
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
                cpf: this.elements.inputCpfProfessor.value || null,
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
            
            // Armazenar vínculos para uso posterior
            const vinculosSalvar = vinculos;
            
            console.log("Dados do professor a serem salvos:", professorDados);
            console.log("Vínculos a serem salvos:", vinculosSalvar);
            
            let response;
            let idProfessor;
            
            if (this.state.modoEdicao && this.state.professorSelecionado) {
                // ID para atualização
                idProfessor = this.state.professorSelecionado.id_professor || this.state.professorSelecionado.id;
                
                try {
                // Atualizar professor existente
                    response = await ConfigModule.fetchApi(`/professores/${idProfessor}`, {
                    method: 'PUT',
                    body: JSON.stringify(professorDados)
                });
                
                this.mostrarSucesso("Professor atualizado com sucesso!");
                    
                    console.log("Resposta da API (professor atualizado):", response);
                } catch (error) {
                    console.error("Erro ao atualizar professor:", error);
                    this.mostrarErro(`Não foi possível atualizar o professor: ${error.message || 'Erro desconhecido'}`);
                    return; // Parar execução se não conseguir atualizar o professor
                }
            } else {
                try {
                // Criar novo professor
                response = await ConfigModule.fetchApi('/professores', {
                    method: 'POST',
                    body: JSON.stringify(professorDados)
                });
                    
                    // Obter ID do professor recém-criado
                    idProfessor = response.id_professor || response.id;
                
                this.mostrarSucesso("Professor criado com sucesso!");
                    
                    console.log("Resposta da API (professor criado):", response);
                } catch (error) {
                    console.error("Erro ao criar professor:", error);
                    this.mostrarErro(`Não foi possível criar o professor: ${error.message || 'Erro desconhecido'}`);
                    return; // Parar execução se não conseguir criar o professor
                }
            }
            
            // Para cada vínculo, criar um registro na tabela professor_disciplina_turma
            const sucessos = [];
            const falhas = [];
            
            // Função simplificada para salvar um vínculo (já foi atualizada para usar String nos IDs)
            const tentarSalvarVinculo = async (vinculo) => {
                try {
                    console.log(`Tentando salvar vínculo: Professor ${idProfessor}, Disciplina ${vinculo.id_disciplina}, Turma ${vinculo.id_turma}`);
                    
                    // Preparar payload com os dados do vínculo
                    const payload = {
                        id_professor: String(idProfessor),
                        id_disciplina: String(vinculo.id_disciplina),
                        id_turma: String(vinculo.id_turma)
                    };
                    
                    // Usar o endpoint direto para professor_disciplina_turma
                    const resultado = await ConfigModule.fetchApi('/professor_disciplina_turma', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    
                    console.log("Vínculo salvo com sucesso:", resultado);
                    return true;
                } catch (erro) {
                    console.error("Erro ao salvar vínculo:", erro);
                    
                    // Tentar endpoint alternativo (/vinculos)
                    try {
                        console.log("Tentando endpoint alternativo /vinculos...");
                        
                        const payload = {
                            id_professor: String(idProfessor),
                            id_disciplina: String(vinculo.id_disciplina),
                            id_turma: String(vinculo.id_turma)
                        };
                        
                        const resultado = await ConfigModule.fetchApi('/vinculos', {
                            method: 'POST',
                            body: JSON.stringify(payload)
                        });
                        
                        console.log("Vínculo salvo com sucesso via endpoint alternativo:", resultado);
                        return true;
                    } catch (erroAlt) {
                        console.error("Erro também no endpoint alternativo:", erroAlt);
                        
                        // Última tentativa: atualizar o professor com seus vínculos
                        try {
                            console.log("Tentando método alternativo: atualizando o professor com o vínculo");
                            
                            // Buscar as disciplinas atuais do professor
                            const professor = await ConfigModule.fetchApi(`/professores/${idProfessor}`);
                            const disciplinasAtuais = professor.disciplinas || [];
                            
                            // Garantir que a disciplina deste vínculo está incluída
                            if (!disciplinasAtuais.includes(vinculo.id_disciplina)) {
                                disciplinasAtuais.push(vinculo.id_disciplina);
                            }
                            
                            // Atualizar o professor com as disciplinas
                            const dadosAtualizados = {
                                disciplinas: disciplinasAtuais
                            };
                            
                            // Incluir também uma propriedade de vínculos se a API suportar
                            if (professor.vinculos !== undefined) {
                                dadosAtualizados.vinculos = [
                                    ...(professor.vinculos || []),
                                    {
                                        id_professor: String(idProfessor),
                                        id_disciplina: String(vinculo.id_disciplina),
                                        id_turma: String(vinculo.id_turma)
                                    }
                                ];
                            }
                            
                            console.log("Atualizando professor com:", dadosAtualizados);
                            
                            const resultado = await ConfigModule.fetchApi(`/professores/${idProfessor}`, {
                                method: "PUT",
                                body: JSON.stringify(dadosAtualizados)
                            });
                            
                            console.log("Professor atualizado com vinculos:", resultado);
                            return true;
                        } catch (erroProf) {
                            console.error("Todas as tentativas falharam:", erroProf);
                            return false;
                        }
                    }
                }
            };
            
            // Tentar salvar cada vínculo
            for (const vinculo of vinculosSalvar) {
                const salvou = await tentarSalvarVinculo(vinculo);
                if (salvou) {
                    sucessos.push(vinculo);
                } else {
                    falhas.push(vinculo);
                }
            }
            
            if (sucessos.length > 0) {
                console.log(`${sucessos.length} vínculos salvos com sucesso.`);
                this.mostrarSucesso(`${sucessos.length} vínculos de disciplinas e turmas foram salvos.`);
            }
            
            if (falhas.length > 0) {
                console.warn(`${falhas.length} vínculos não puderam ser salvos.`);
                this.mostrarErro(`Atenção: ${falhas.length} vínculos não puderam ser salvos. Verifique a conexão com a API.`);
            }
            
            // CORREÇÃO: Limpar o cache de vínculos para evitar problemas de exibição
            this.state.vinculos = [];
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Recarregar lista de professores
            await this.carregarProfessores();
            
        } catch (error) {
            console.error("Erro ao salvar professor:", error);
            this.mostrarErro(`Não foi possível salvar o professor: ${error.message || 'Erro desconhecido'}`);
        }
    },
    
    // Editar professor existente
    editarProfessor: async function(id) {
        try {
            console.log(`Editando professor com ID ${id}`);
            
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
            
            // Repopular o select de disciplinas para mostrar a contagem correta de turmas vinculadas
            this.popularSelectDisciplinas();
            
            if (this.elements.formProfessor) {
                this.elements.formProfessor.classList.remove('d-none');
                
                // Preencher campos
                if (this.elements.inputIdProfessor) {
                    this.elements.inputIdProfessor.value = professor.id_professor || '';
                    this.elements.inputIdProfessor.disabled = true; // Não permitir alterar o ID
                }
                
                this.elements.inputNomeProfessor.value = professor.nome_professor || professor.nome || '';
                this.elements.inputEmailProfessor.value = professor.email_professor || professor.email || '';
                this.elements.inputCpfProfessor.value = professor.cpf || '';
                
                // Campo de senha não é obrigatório na edição
                if (this.elements.inputSenhaProfessor) {
                    this.elements.inputSenhaProfessor.required = false;
                    this.elements.inputSenhaProfessor.value = '';
                    this.elements.inputSenhaProfessor.closest('.mb-3').classList.add('d-none');
                }
                
                // Selecionar disciplinas do professor
                if (professor.disciplinas && Array.isArray(professor.disciplinas) && this.elements.selectDisciplinas) {
                    console.log("=== SELECIONANDO DISCIPLINAS DO PROFESSOR ===");
                    console.log("Disciplinas do professor:", professor.disciplinas);
                    console.log("Opções disponíveis no select:", Array.from(this.elements.selectDisciplinas.options).map(opt => ({ value: opt.value, text: opt.text })));
                    
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
                        
                        if (option) {
                            option.selected = true;
                            console.log(`✓ Disciplina ${disciplinaId} selecionada no select`);
                        } else {
                            console.warn(`✗ Disciplina ${disciplinaId} não encontrada no select`);
                        }
                    });
                    
                    console.log("Disciplinas selecionadas após aplicar:", Array.from(this.elements.selectDisciplinas.selectedOptions).map(opt => opt.value));
                    
                    // Atualizar visualização de turmas de forma explícita
                    console.log("Chamando atualizarTurmasVinculadas após selecionar disciplinas");
                    setTimeout(() => this.atualizarTurmasVinculadas(), 100);
                } else {
                    console.warn("Professor não tem disciplinas ou select não encontrado");
                    console.log("professor.disciplinas:", professor.disciplinas);
                    console.log("this.elements.selectDisciplinas:", this.elements.selectDisciplinas);
                }
                
                this.elements.inputNomeProfessor.focus();
            } else {
                console.error("Formulário do professor não encontrado");
            }
        } catch (error) {
            console.error("Erro ao editar professor:", error);
            this.mostrarErro("Não foi possível carregar os dados do professor para edição.");
        }
    },

    // Configurar eventos
    configurarEventos: function() {
        console.log("Configurando eventos do módulo de professores");
        
        // Evento para criar novo professor
        if (this.elements.btnNovoProfessor) {
            this.elements.btnNovoProfessor.addEventListener('click', () => this.novoProfessor());
            console.log("Event listener adicionado: btnNovoProfessor");
        } else {
            console.warn("Elemento não encontrado: btnNovoProfessor");
        }
        
        // Evento para salvar professor
        if (this.elements.formProfessor) {
            this.elements.formProfessor.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarProfessor();
            });
            console.log("Event listener adicionado: formProfessor (submit)");
        } else {
            console.warn("Elemento não encontrado: formProfessor");
        }
        
        // Evento para cancelar edição
        if (this.elements.btnCancelarProfessor) {
            this.elements.btnCancelarProfessor.addEventListener('click', () => this.cancelarEdicao());
            console.log("Event listener adicionado: btnCancelarProfessor");
        } else {
            console.warn("Elemento não encontrado: btnCancelarProfessor");
        }
        
        // Evento para quando disciplinas são selecionadas
        if (this.elements.selectDisciplinas) {
            // Remover event listeners anteriores para evitar duplicação
            this.elements.selectDisciplinas.removeEventListener('change', this.atualizarTurmasVinculadasHandler);
            
            // Criar uma função de handler que podemos referênciar para remoção
            this.atualizarTurmasVinculadasHandler = () => {
                console.log("Event change acionado no select de disciplinas");
                this.atualizarTurmasVinculadas();
            };
            
            // Adicionar o novo event listener
            this.elements.selectDisciplinas.addEventListener('change', this.atualizarTurmasVinculadasHandler);
            console.log("Event listener adicionado: selectDisciplinas (change)");
            
            // Disparar o evento manualmente para carregar as turmas se já houverem disciplinas selecionadas
            if (this.elements.selectDisciplinas.selectedOptions.length > 0) {
                console.log("Disciplinas já selecionadas, atualizando turmas iniciais...");
                this.atualizarTurmasVinculadas();
            }
        } else {
            console.warn("Elemento não encontrado: selectDisciplinas");
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

    // Função de teste para debug (temporária)
    testarEndpointDebug: async function() {
        try {
            console.log("Testando endpoint debug...");
            const resultado = await ConfigModule.fetchApi('/professores/debug');
            console.log("Resultado do debug:", resultado);
            
            if (resultado && resultado.length > 0) {
                const professor = resultado[0];
                console.log("Primeiro professor debug:");
                console.log("- ID:", professor.id);
                console.log("- ID Professor:", professor.id_professor);
                console.log("- Nome:", professor.nome_professor);
                console.log("- Ativo:", professor.ativo);
                console.log("- Campos disponíveis:", professor.campos_disponiveis);
            }
        } catch (error) {
            console.error("Erro no teste debug:", error);
        }
    }
};

// Exportar módulo
export default ProfessoresModule;
