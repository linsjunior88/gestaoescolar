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
        disciplinas: [], // Para o select de disciplinas
        disciplinasTurmas: [], // Relacionamento entre disciplinas e turmas
        vinculos: [] // Vínculos de professor-disciplina-turma
    },
    
    // Elementos DOM
    elements: {
        listaProfessores: null,
        formProfessor: null,
        inputIdProfessor: null,
        inputNomeProfessor: null,
        inputEmailProfessor: null,
        inputSenhaProfessor: null,
        selectDisciplinas: null,
        vinculosContainer: null,
        btnSalvarProfessor: null,
        btnCancelarProfessor: null,
        btnNovoProfessor: null,
        btnVerVinculos: null,
        tabelaVinculos: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de professores");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarDisciplinasTurmas();
        this.carregarProfessores();
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
        html += '<thead><tr><th>Disciplina</th><th>Turmas Vinculadas</th></tr></thead>';
        html += '<tbody>';
        
        disciplinasSelecionadas.forEach(disciplinaId => {
            const disciplina = this.state.disciplinas.find(d => d.id_disciplina === disciplinaId);
            if (!disciplina) return;
            
            const disciplinaTurmas = this.state.disciplinasTurmas.find(dt => dt.disciplina === disciplinaId);
            const turmas = disciplinaTurmas && disciplinaTurmas.turmas ? disciplinaTurmas.turmas : [];
            
            html += '<tr>';
            html += `<td>${disciplina.nome}</td>`;
            
            if (turmas.length === 0) {
                html += '<td><span class="text-warning">Nenhuma turma vinculada</span></td>';
            } else {
                html += '<td>';
                html += '<ul class="list-unstyled mb-0">';
                turmas.forEach(turma => {
                    html += `<li>
                        <span class="badge bg-info">${turma.id_turma}</span> 
                        ${turma.serie}
                    </li>`;
                });
                html += '</ul>';
                html += '</td>';
            }
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        this.elements.vinculosContainer.innerHTML = html;
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
    
    // Carregar vínculos de um professor específico
    carregarVinculosProfessor: async function(idProfessor) {
        try {
            const vinculos = await ConfigModule.fetchApi(`/professores/vinculos/${idProfessor}`);
            console.log(`Vínculos do professor ${idProfessor}:`, vinculos);
            return vinculos;
        } catch (error) {
            console.error(`Erro ao carregar vínculos do professor ${idProfessor}:`, error);
            return [];
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
            
            // Determinar o campo de ID correto
            const professorId = professor.id_professor || professor.id;
            
            row.innerHTML = `
                <td>${professorId || 'N/A'}</td>
                <td>${professor.nome_professor || professor.nome || 'N/A'}</td>
                <td>${professor.email_professor || professor.email || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info ver-vinculos" data-id="${professorId}">
                        <i class="fas fa-list"></i> Ver Vínculos
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary editar-professor" data-id="${professorId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-professor" data-id="${professorId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-professor');
            const btnExcluir = row.querySelector('.excluir-professor');
            const btnVerVinculos = row.querySelector('.ver-vinculos');
            
            btnEditar.addEventListener('click', () => this.editarProfessor(professorId));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(professorId));
            btnVerVinculos.addEventListener('click', () => this.mostrarVinculos(professorId));
            
            this.elements.listaProfessores.appendChild(row);
        });
    },
    
    // Mostrar vínculos de um professor
    mostrarVinculos: async function(idProfessor) {
        try {
            const vinculos = await this.carregarVinculosProfessor(idProfessor);
            
            if (!vinculos || vinculos.length === 0) {
                alert("Este professor não possui vínculos com disciplinas e turmas.");
                return;
            }
            
            // Encontrar o professor
            const professor = this.state.professores.find(p => 
                p.id_professor === idProfessor || p.id === idProfessor
            );
            
            if (!professor) {
                console.error("Professor não encontrado:", idProfessor);
                return;
            }
            
            const nomeProfessor = professor.nome_professor || professor.nome;
            
            // Remover qualquer modal existente antes
            const existingModal = document.getElementById('vinculosModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Criar modal para mostrar os vínculos
            const modalHtml = `
                <div class="modal fade" id="vinculosModal" tabindex="-1" aria-labelledby="vinculosModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="vinculosModalLabel">Vínculos do Professor: ${nomeProfessor}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <div class="table-responsive">
                                    <table class="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Disciplina</th>
                                                <th>Turma</th>
                                                <th>Série</th>
                                                <th>Turno</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.renderizarLinhasVinculos(vinculos)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar modal ao body
            const modalElement = document.createElement('div');
            modalElement.innerHTML = modalHtml;
            document.body.appendChild(modalElement.firstElementChild);
            
            // Buscar o elemento modal no DOM
            const modalElement2 = document.getElementById('vinculosModal');
            
            // Configurar e mostrar o modal usando Bootstrap
            const modal = new bootstrap.Modal(modalElement2, {
                backdrop: true, // Permite clicar fora para fechar
                keyboard: true, // Permite usar ESC para fechar
                focus: true     // Foca o modal quando abrir
            });
            
            // Garantir que o modal tenha foco quando abrir
            modalElement2.addEventListener('shown.bs.modal', function() {
                // Focar no botão de fechar
                const closeButton = modalElement2.querySelector('.btn-close');
                if (closeButton) {
                    closeButton.focus();
                }
                
                // Adicionar uma classe para garantir que o modal fique acima de outros elementos
                modalElement2.style.zIndex = "1060";
            });
            
            // Garantir que o modal possa ser fechado e removido do DOM quando fechado
            modalElement2.addEventListener('hidden.bs.modal', function() {
                // Remover o modal do DOM quando for fechado
                modalElement2.remove();
            });
            
            // Mostrar o modal
            modal.show();
            
        } catch (error) {
            console.error("Erro ao mostrar vínculos:", error);
            this.mostrarErro("Não foi possível carregar os vínculos do professor.");
        }
    },
    
    // Renderizar linhas da tabela de vínculos
    renderizarLinhasVinculos: function(vinculos) {
        if (!vinculos || vinculos.length === 0) {
            return '<tr><td colspan="4" class="text-center">Nenhum vínculo encontrado</td></tr>';
        }
        
        return vinculos.map(vinculo => {
            // Buscar nome da disciplina
            const disciplina = this.state.disciplinas.find(d => 
                d.id_disciplina === vinculo.id_disciplina
            );
            const nomeDisciplina = disciplina ? disciplina.nome : vinculo.id_disciplina;
            
            return `
                <tr>
                    <td>${nomeDisciplina}</td>
                    <td>${vinculo.id_turma}</td>
                    <td>${vinculo.serie || 'N/A'}</td>
                    <td>${this.traduzirTurno(vinculo.turno)}</td>
                </tr>
            `;
        }).join('');
    },
    
    // Criar novo professor
    novoProfessor: function() {
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.reset();
            this.elements.formProfessor.classList.remove('d-none');
            
            // Mostrar campo de senha e torná-lo obrigatório
            if (this.elements.inputSenhaProfessor) {
                this.elements.inputSenhaProfessor.required = true;
                this.elements.inputSenhaProfessor.closest('.mb-3').classList.remove('d-none');
            }
            
            // Mostrar campo de ID do professor
            if (this.elements.inputIdProfessor) {
                this.elements.inputIdProfessor.disabled = false;
                this.elements.inputIdProfessor.required = true;
            }
        }
        
        // Limpar seleção de disciplinas
        if (this.elements.selectDisciplinas) {
            Array.from(this.elements.selectDisciplinas.options).forEach(option => {
                option.selected = false;
            });
            this.atualizarTurmasVinculadas();
        }
        
        if (this.elements.inputIdProfessor) {
            this.elements.inputIdProfessor.focus();
        } else if (this.elements.inputNomeProfessor) {
            this.elements.inputNomeProfessor.focus();
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
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.professorSelecionado = null;
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.reset();
            this.elements.formProfessor.classList.add('d-none');
        }
        
        // Limpar turmas vinculadas
        if (this.elements.vinculosContainer) {
            this.elements.vinculosContainer.innerHTML = '';
        }
    },
    
    // Confirmar exclusão de professor
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita e removerá todos os vínculos com disciplinas e turmas.")) {
            this.excluirProfessor(id);
        }
    },
    
    // Excluir professor
    excluirProfessor: async function(id) {
        try {
            await ConfigModule.fetchApi(`/professores/${id}`, {
                method: 'DELETE'
            });
            
            this.mostrarSucesso("Professor excluído com sucesso!");
            
            // Recarregar lista de professores
            await this.carregarProfessores();
            
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
