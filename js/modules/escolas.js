/**
 * Módulo de Gestão de Escolas
 * Sistema de Gestão Escolar EMEF Nazaré Rodrigues
 */

// Módulo para gerenciar escolas
const EscolasModule = {
    // Estado do módulo
    state: {
        escolas: [],
        escolaSelecionada: null,
        modoEdicao: false,
        carregandoEscolas: false
    },

    // Elementos DOM
    elements: {
        btnNovaEscola: null,
        listaEscolas: null,
        formEscola: null,
        // Campos do formulário serão adicionados conforme necessário
    },

    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de escolas...");
        
        try {
            this.initElements();
            this.configurarEventos();
            await this.carregarEscolas();
            console.log("Módulo de escolas inicializado com sucesso!");
        } catch (error) {
            console.error("Erro ao inicializar módulo de escolas:", error);
        }
    },

    // Inicializar elementos DOM
    initElements: function() {
        this.elements.btnNovaEscola = document.getElementById('btn-nova-escola');
        this.elements.listaEscolas = document.getElementById('lista-escolas');
        
        console.log("Elementos DOM identificados:", {
            btnNovaEscola: !!this.elements.btnNovaEscola,
            listaEscolas: !!this.elements.listaEscolas
        });
    },

    // Configurar eventos
    configurarEventos: function() {
        if (this.elements.btnNovaEscola) {
            this.elements.btnNovaEscola.addEventListener('click', () => this.novaEscola());
        }
    },

    // Carregar escolas da API
    carregarEscolas: async function() {
        if (this.state.carregandoEscolas) {
            console.log("Carregamento de escolas já em andamento...");
            return;
        }

        this.state.carregandoEscolas = true;

        try {
            console.log("Carregando escolas...");
            const escolas = await ConfigModule.fetchApi('/escolas');
            
            this.state.escolas = escolas || [];
            console.log(`${this.state.escolas.length} escola(s) carregada(s)`);
            
            this.renderizarEscolas();
            
        } catch (error) {
            console.error("Erro ao carregar escolas:", error);
            this.mostrarErro("Não foi possível carregar as escolas.");
        } finally {
            this.state.carregandoEscolas = false;
        }
    },

    // Renderizar lista de escolas
    renderizarEscolas: function() {
        if (!this.elements.listaEscolas) {
            console.warn("Elemento listaEscolas não encontrado");
            return;
        }

        if (!this.state.escolas || this.state.escolas.length === 0) {
            this.elements.listaEscolas.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Nenhuma escola cadastrada</td>
                </tr>
            `;
            return;
        }

        let html = '';
        this.state.escolas.forEach(escola => {
            const statusBadge = escola.ativo ? 
                '<span class="badge bg-success">Ativa</span>' : 
                '<span class="badge bg-secondary">Inativa</span>';
                
            html += `
                <tr>
                    <td>${escola.id_escola || ''}</td>
                    <td>${escola.codigo_inep || ''}</td>
                    <td>${escola.razao_social || ''}</td>
                    <td>${escola.nome_fantasia || ''}</td>
                    <td>${escola.cidade || ''}</td>
                    <td>${escola.uf || ''}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button type="button" class="btn btn-sm btn-primary btn-editar" data-id="${escola.id_escola}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-danger btn-excluir" data-id="${escola.id_escola}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        this.elements.listaEscolas.innerHTML = html;

        // Adicionar event listeners
        this.elements.listaEscolas.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => this.editarEscola(e.currentTarget.dataset.id));
        });

        this.elements.listaEscolas.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', (e) => this.excluirEscola(e.currentTarget.dataset.id));
        });
    },

    // Nova escola
    novaEscola: function() {
        console.log("Iniciando cadastro de nova escola...");
        // TODO: Implementar formulário de nova escola
        alert("Funcionalidade de nova escola será implementada em breve!");
    },

    // Editar escola
    editarEscola: function(id) {
        console.log(`Editando escola ${id}...`);
        // TODO: Implementar edição de escola
        alert(`Edição da escola ${id} será implementada em breve!`);
    },

    // Excluir escola
    excluirEscola: function(id) {
        console.log(`Excluindo escola ${id}...`);
        if (confirm("Tem certeza que deseja excluir esta escola?")) {
            // TODO: Implementar exclusão de escola
            alert(`Exclusão da escola ${id} será implementada em breve!`);
        }
    },

    // Mostrar erro
    mostrarErro: function(mensagem) {
        console.error("Erro no módulo de escolas:", mensagem);
        // TODO: Implementar sistema de notificações
        alert(`Erro: ${mensagem}`);
    }
};

// Exportar módulo
export default EscolasModule; 