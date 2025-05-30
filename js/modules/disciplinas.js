/**
 * Módulo de Disciplinas
 * Contém todas as funções relacionadas à gestão de disciplinas
 */

import ConfigModule from './config.js';
import UIModule from './ui.js';

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
        inputIdDisciplina: null,
        inputNomeDisciplina: null,
        inputCargaHoraria: null,
        btnSalvarDisciplina: null,
        btnCancelarDisciplina: null,
        btnNovaDisciplina: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de disciplinas");
        this.cachearElementos();
        this.adicionarEventListeners();
        this.carregarDisciplinas();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaDisciplinas = document.getElementById('lista-disciplinas');
        this.elements.formDisciplina = document.getElementById('form-disciplina');
        this.elements.inputIdDisciplina = document.getElementById('id-disciplina');
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
        if (!this.elements.listaDisciplinas) {
            console.error("Lista de disciplinas não encontrada no DOM");
            return;
        }

        // Limpar a lista
        this.elements.listaDisciplinas.innerHTML = '';

        if (this.state.disciplinas.length === 0) {
            this.elements.listaDisciplinas.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Nenhuma disciplina cadastrada</td>
                </tr>
            `;
            return;
        }

        // Renderizar cada disciplina
        this.state.disciplinas.forEach(disciplina => {
            const row = document.createElement('tr');
            
            // Criar células para cada coluna
            row.innerHTML = `
                <td>${disciplina.id_disciplina || disciplina.id}</td>
                <td>
                    <a href="#" class="disciplina-nome" data-id="${disciplina.id_disciplina || disciplina.id}">
                        ${disciplina.nome_disciplina || disciplina.nome}
                    </a>
                </td>
                <td>${disciplina.carga_horaria || 'N/A'}</td>
                <td>Gerenciado no cadastro de professores</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1 btn-editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger me-1 btn-excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar eventos aos botões
            const btnEditar = row.querySelector('.btn-editar');
            const btnExcluir = row.querySelector('.btn-excluir');
            const linkNome = row.querySelector('.disciplina-nome');
            
            btnEditar.addEventListener('click', () => this.editarDisciplina(disciplina.id_disciplina || disciplina.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(disciplina.id_disciplina || disciplina.id));
            linkNome.addEventListener('click', (e) => {
                e.preventDefault();
                this.mostrarInfoDisciplina(disciplina.id_disciplina || disciplina.id);
            });
            
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
    },
    
    // Mostrar modal de informações da disciplina
    mostrarInfoDisciplina: function(id) {
        const disciplina = this.state.disciplinas.find(d => 
            (d.id_disciplina === id) || (d.id === id)
        );
        
        if (!disciplina) {
            console.error("Disciplina não encontrada:", id);
            return;
        }
        
        // Criar corpo do modal
        const modalBody = `
            <div class="mb-3">
                <strong>ID:</strong> ${disciplina.id_disciplina || disciplina.id}
            </div>
            <div class="mb-3">
                <strong>Nome:</strong> ${disciplina.nome_disciplina || disciplina.nome}
            </div>
            <div class="mb-3">
                <strong>Carga Horária:</strong> ${disciplina.carga_horaria || 'N/A'} horas
            </div>
        `;
        
        // Rodapé do modal
        const modalFooter = `
            <button type="button" class="btn btn-primary btn-editar-disciplina" data-id="${disciplina.id_disciplina || disciplina.id}" autofocus>
                <i class="fas fa-edit"></i> Editar
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
        `;
        
        // Criar e mostrar modal usando UIModule
        const modal = UIModule.criarModal(
            'modal-info-disciplina',
            `Informações da Disciplina: ${disciplina.nome_disciplina || disciplina.nome}`,
            modalBody,
            modalFooter
        );
        
        // Adicionar evento ao botão de editar
        document.querySelector('.btn-editar-disciplina').addEventListener('click', () => {
            modal.hide();
            this.editarDisciplina(disciplina.id_disciplina || disciplina.id);
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
                        ...disciplinaDados
                    };
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
        const disciplina = this.state.disciplinas.find(d => 
            (d.id_disciplina === id) || (d.id === id)
        );
        
        if (!disciplina) {
            return UIModule.mostrarErro("Disciplina não encontrada.");
        }
        
        const disciplinaNome = disciplina.nome_disciplina || disciplina.nome || id;
        
        UIModule.confirmar(
            `Tem certeza que deseja excluir a disciplina "${disciplinaNome}"?`,
            "Excluir Disciplina",
            () => this.excluirDisciplina(id),
            null,
            {
                textoBotaoConfirmar: "Excluir",
                classeBotaoConfirmar: "btn-danger",
                icone: "trash"
            }
        );
    },
    
    // Excluir disciplina
    excluirDisciplina: async function(id) {
        try {
            // Verificar se a disciplina existe
            const disciplina = this.state.disciplinas.find(d => 
                (d.id_disciplina === id) || (d.id === id)
            );
            
            if (!disciplina) {
                console.error("Disciplina não encontrada para exclusão:", id);
                this.mostrarErro("Disciplina não encontrada para exclusão.");
                return;
            }
            
            // Excluir disciplina na API
            await ConfigModule.fetchApi(`/disciplinas/${id}`, {
                method: 'DELETE'
            });
            
            // Remover disciplina da lista local
            this.state.disciplinas = this.state.disciplinas.filter(d => 
                (d.id_disciplina !== id) && (d.id !== id)
            );
            
            // Atualizar lista de disciplinas
            this.renderizarDisciplinas();
            
            this.mostrarSucesso("Disciplina excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir disciplina:", error);
            this.mostrarErro("Não foi possível excluir a disciplina. Tente novamente mais tarde.");
        }
    },
    
    // Mostrar mensagem de erro
    mostrarErro: function(mensagem) {
        UIModule.mostrarErro(mensagem);
    },
    
    // Mostrar mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        UIModule.mostrarSucesso(mensagem);
    }
};

// Exportar módulo
export default DisciplinasModule;
