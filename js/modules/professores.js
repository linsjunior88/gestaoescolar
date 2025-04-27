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
        inputEmailProfessor: null,
        inputFormacaoProfessor: null,
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
        this.elements.inputEmailProfessor = document.getElementById('email-professor');
        this.elements.inputFormacaoProfessor = document.getElementById('formacao-professor');
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
            console.log("Disciplinas brutas da API:", disciplinas);
            
            // Normalizar os dados para garantir consistência
            this.state.disciplinas = disciplinas.map(d => {
                // Garantir que temos um objeto com estrutura consistente
                return {
                    id: d.id,
                    id_disciplina: d.id_disciplina || d.id,
                    nome: d.nome_disciplina || d.nome || 'Sem nome',
                    nome_disciplina: d.nome_disciplina || d.nome || 'Sem nome',
                    carga_horaria: d.carga_horaria
                };
            });
            
            console.log("Disciplinas normalizadas:", this.state.disciplinas);
            this.popularSelectDisciplinas();
            console.log("Disciplinas carregadas com sucesso para o módulo de professores");
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
            // Usamos id_disciplina como valor, pois é o que a API espera
            option.value = disciplina.id_disciplina || '';
            // Usamos o nome normalizado para exibição
            option.textContent = disciplina.nome || 'N/A';
            
            // DEBUG: Logar os valores das opções para verificação
            console.log(`Criando option para disciplina: valor=${option.value}, texto=${option.textContent}`);
            
            this.elements.selectDisciplinas.appendChild(option);
        });
        
        console.log("Select de disciplinas populado com", this.state.disciplinas.length, "opções");
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
            this.elements.listaProfessores.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum professor cadastrado</td></tr>';
            return;
        }
        
        this.state.professores.forEach(professor => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${professor.id || 'N/A'}</td>
                <td>${professor.nome || 'N/A'}</td>
                <td>${professor.email || 'N/A'}</td>
                <td>${professor.formacao || 'N/A'}</td>
                <td>${this.formatarDisciplinas(professor.disciplinas)}</td>
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
    
    // Formatar lista de disciplinas para exibição
    formatarDisciplinas: function(disciplinas) {
        if (!disciplinas || !Array.isArray(disciplinas) || disciplinas.length === 0) {
            return 'Nenhuma';
        }
        
        // Se disciplinas são objetos com nome
        if (typeof disciplinas[0] === 'object' && disciplinas[0].nome) {
            return disciplinas.map(d => d.nome).join(', ');
        }
        
        // Se disciplinas são IDs, buscar nomes no array de disciplinas
        if (typeof disciplinas[0] === 'string' || typeof disciplinas[0] === 'number') {
            const nomes = disciplinas.map(id => {
                // Procuramos a disciplina tanto pelo id quanto pelo id_disciplina
                const disc = this.state.disciplinas.find(d => 
                    d.id === id || 
                    d.id === parseInt(id) || 
                    d.id_disciplina === id
                );
                
                // Debug para verificar as correspondências
                console.log(`Procurando disciplina com ID: ${id}`, disc);
                
                return disc ? (disc.nome || disc.nome_disciplina) : `ID: ${id}`;
            });
            return nomes.join(', ');
        }
        
        return 'Formato desconhecido';
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
        
        console.log("Editando professor:", professor);
        
        this.state.modoEdicao = true;
        this.state.professorSelecionado = professor;
        
        if (this.elements.formProfessor) {
            this.elements.formProfessor.classList.remove('d-none');
            this.elements.inputNomeProfessor.value = professor.nome || '';
            this.elements.inputEmailProfessor.value = professor.email || '';
            this.elements.inputFormacaoProfessor.value = professor.formacao || '';
            
            // Selecionar disciplinas do professor
            if (professor.disciplinas && Array.isArray(professor.disciplinas)) {
                console.log("Disciplinas do professor:", professor.disciplinas);
                console.log("Opções disponíveis:", Array.from(this.elements.selectDisciplinas.options).map(o => ({ value: o.value, text: o.textContent })));
                
                // Limpar seleções anteriores
                Array.from(this.elements.selectDisciplinas.options).forEach(option => {
                    option.selected = false;
                });
                
                // Selecionar disciplinas do professor
                professor.disciplinas.forEach(disc => {
                    // Normalizar o valor da disciplina para comparação
                    const disciplinaId = typeof disc === 'object' ? (disc.id_disciplina || disc.id) : disc;
                    
                    console.log(`Procurando option para disciplina: ${disciplinaId}`);
                    
                    // Encontrar a opção correspondente
                    const option = Array.from(this.elements.selectDisciplinas.options).find(
                        opt => opt.value === disciplinaId.toString()
                    );
                    
                    if (option) {
                        console.log(`Marcando disciplina ${disciplinaId} como selecionada`);
                        option.selected = true;
                    } else {
                        console.warn(`Disciplina ${disciplinaId} não encontrada nas opções disponíveis`);
                    }
                });
            }
            
            this.elements.inputNomeProfessor.focus();
        }
    },
    
    // Salvar professor (criar novo ou atualizar existente)
    salvarProfessor: async function() {
        try {
            // Obter disciplinas selecionadas
            const disciplinasSelecionadas = Array.from(this.elements.selectDisciplinas.selectedOptions).map(
                option => option.value
            );
            
            console.log("Disciplinas selecionadas:", disciplinasSelecionadas);
            
            // Se estivermos em modo de edição, precisamos identificar o campo correto para o ID do professor
            let professorId = '';
            if (this.state.modoEdicao && this.state.professorSelecionado) {
                professorId = this.state.professorSelecionado.id_professor || this.state.professorSelecionado.id;
                console.log(`Editando professor ID: ${professorId}`);
            }
            
            const professorDados = {
                nome: this.elements.inputNomeProfessor.value,
                email: this.elements.inputEmailProfessor.value,
                formacao: this.elements.inputFormacaoProfessor.value,
                disciplinas: disciplinasSelecionadas
            };
            
            // Para modo de edição, podemos precisar adicionar mais campos
            if (this.state.modoEdicao && this.state.professorSelecionado) {
                professorDados.id_professor = professorId;
            }
            
            console.log("Dados a serem enviados:", professorDados);
            
            let response;
            
            if (this.state.modoEdicao && this.state.professorSelecionado) {
                // Atualizar professor existente
                response = await ConfigModule.fetchApi(`/professores/${professorId}`, {
                    method: 'PUT',
                    body: JSON.stringify(professorDados)
                });
                
                console.log("Resposta da API (PUT):", response);
                
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
                
                console.log("Resposta da API (POST):", response);
                
                // Adicionar novo professor à lista local
                this.state.professores.push(response);
                
                this.mostrarSucesso("Professor criado com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Atualizar lista de professores
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
