/**
 * Módulo de Gestão de Escolas
 * Sistema de Gestão Escolar EMEF Nazaré Rodrigues
 */

import ConfigModule from './config.js';

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
        // Campos do formulário
        inputCodigoInep: null,
        inputCnpj: null,
        inputRazaoSocial: null,
        inputNomeFantasia: null,
        inputEmail: null,
        inputTelefone: null,
        selectCidade: null,
        selectUf: null,
        btnSalvarEscola: null,
        btnCancelarEscola: null
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
        // Elementos principais
        this.elements.btnNovaEscola = document.getElementById('btn-nova-escola');
        this.elements.listaEscolas = document.getElementById('lista-escolas');
        this.elements.formEscola = document.getElementById('form-escola');
        
        // Campos do formulário
        this.elements.inputCodigoInep = document.getElementById('codigo-inep-escola');
        this.elements.inputCnpj = document.getElementById('cnpj-escola');
        this.elements.inputRazaoSocial = document.getElementById('razao-social-escola');
        this.elements.inputNomeFantasia = document.getElementById('nome-fantasia-escola');
        this.elements.inputEmail = document.getElementById('email-escola');
        this.elements.inputTelefone = document.getElementById('telefone-escola');
        this.elements.selectCidade = document.getElementById('cidade-escola');
        this.elements.selectUf = document.getElementById('uf-escola');
        this.elements.btnSalvarEscola = document.getElementById('btn-salvar-escola');
        this.elements.btnCancelarEscola = document.getElementById('btn-cancelar-escola');
        
        console.log("Elementos DOM identificados:", {
            btnNovaEscola: !!this.elements.btnNovaEscola,
            listaEscolas: !!this.elements.listaEscolas,
            formEscola: !!this.elements.formEscola,
            camposFormulario: {
                inputCodigoInep: !!this.elements.inputCodigoInep,
                inputRazaoSocial: !!this.elements.inputRazaoSocial,
                btnSalvarEscola: !!this.elements.btnSalvarEscola
            }
        });
    },

    // Configurar eventos
    configurarEventos: function() {
        if (this.elements.btnNovaEscola) {
            this.elements.btnNovaEscola.addEventListener('click', () => this.novaEscola());
        }
        
        if (this.elements.formEscola) {
            this.elements.formEscola.addEventListener('submit', (e) => this.salvarEscola(e));
        }
        
        if (this.elements.btnCancelarEscola) {
            this.elements.btnCancelarEscola.addEventListener('click', () => this.cancelarEdicao());
        }
        
        // Evento para carregar cidades quando UF for selecionada
        if (this.elements.selectUf) {
            this.elements.selectUf.addEventListener('change', (e) => this.carregarCidades(e.target.value));
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
            console.log("URL da API:", ConfigModule.API_BASE_URL + '/escolas/');
            
            const escolas = await ConfigModule.fetchApi('/escolas/');
            
            console.log("Resposta da API de escolas:", escolas);
            console.log("Tipo da resposta:", typeof escolas);
            console.log("É array?", Array.isArray(escolas));
            
            this.state.escolas = escolas || [];
            console.log(`${this.state.escolas.length} escola(s) carregada(s)`);
            
            if (this.state.escolas.length > 0) {
                console.log("Primeira escola:", this.state.escolas[0]);
            }
            
            this.renderizarEscolas();
            
        } catch (error) {
            console.error("Erro detalhado ao carregar escolas:", error);
            console.error("Stack trace:", error.stack);
            this.mostrarErro("Não foi possível carregar as escolas.");
        } finally {
            this.state.carregandoEscolas = false;
        }
    },

    // Carregar cidades de uma UF usando API do IBGE
    carregarCidades: async function(uf) {
        if (!uf || !this.elements.selectCidade) {
            return;
        }

        console.log(`Carregando cidades para UF: ${uf}`);

        try {
            // Desabilitar select e mostrar carregando
            this.elements.selectCidade.disabled = true;
            this.elements.selectCidade.innerHTML = '<option value="">Carregando cidades...</option>';

            // Buscar cidades da UF na API do IBGE
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const cidades = await response.json();
            
            console.log(`${cidades.length} cidades carregadas para ${uf}`);

            // Limpar select e adicionar opção padrão
            this.elements.selectCidade.innerHTML = '<option value="">Selecione a cidade</option>';

            // Ordenar cidades por nome
            cidades.sort((a, b) => a.nome.localeCompare(b.nome));

            // Adicionar cidades ao select
            cidades.forEach(cidade => {
                const option = document.createElement('option');
                option.value = cidade.nome;
                option.textContent = cidade.nome;
                this.elements.selectCidade.appendChild(option);
            });

            // Habilitar select
            this.elements.selectCidade.disabled = false;

        } catch (error) {
            console.error("Erro ao carregar cidades:", error);
            
            // Em caso de erro, permitir entrada manual
            this.elements.selectCidade.innerHTML = `
                <option value="">Erro ao carregar cidades</option>
                <option value="manual">Digite manualmente</option>
            `;
            this.elements.selectCidade.disabled = false;
            
            // Mostrar mensagem de erro
            alert("Não foi possível carregar as cidades. Você pode digitar manualmente se necessário.");
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
                    <td colspan="7" class="text-center">Nenhuma escola cadastrada</td>
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
                    <td>${escola.codigo_inep || 'N/A'}</td>
                    <td>${escola.nome_fantasia || 'N/A'}</td>
                    <td>${escola.razao_social || 'N/A'}</td>
                    <td>${escola.cnpj || 'N/A'}</td>
                    <td>${escola.cidade || 'N/A'}</td>
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
        
        this.state.modoEdicao = false;
        this.state.escolaSelecionada = null;
        
        // Limpar formulário
        if (this.elements.formEscola) {
            this.elements.formEscola.reset();
            this.elements.formEscola.classList.remove('d-none');
        }
        
        // Resetar select de cidades
        if (this.elements.selectCidade) {
            this.elements.selectCidade.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
            this.elements.selectCidade.disabled = true;
        }
        
        // Focar no primeiro campo
        if (this.elements.inputCodigoInep) {
            this.elements.inputCodigoInep.focus();
        }
    },

    // Salvar escola (criar ou editar)
    salvarEscola: async function(e) {
        e.preventDefault();
        
        console.log("Salvando escola...");
        
        // Coletar dados do formulário
        const dadosEscola = {
            codigo_inep: this.elements.inputCodigoInep?.value || '',
            cnpj: this.elements.inputCnpj?.value || '',
            razao_social: this.elements.inputRazaoSocial?.value || '',
            nome_fantasia: this.elements.inputNomeFantasia?.value || '',
            email_principal: this.elements.inputEmail?.value || '',
            telefone_principal: this.elements.inputTelefone?.value || '',
            cidade: this.elements.selectCidade?.value || '',
            uf: this.elements.selectUf?.value || '',
            localizacao: 'Urbana' // Valor padrão
        };
        
        console.log("Dados da escola:", dadosEscola);
        
        // Validar campos obrigatórios
        if (!dadosEscola.codigo_inep || !dadosEscola.razao_social) {
            alert("Por favor, preencha os campos obrigatórios: Código INEP e Razão Social.");
            return;
        }
        
        try {
            let resultado;
            
            if (this.state.modoEdicao && this.state.escolaSelecionada) {
                // Editar escola existente
                console.log(`Editando escola ID: ${this.state.escolaSelecionada.id_escola}`);
                resultado = await ConfigModule.fetchApi(`/escolas/${this.state.escolaSelecionada.id_escola}`, {
                    method: 'PUT',
                    body: JSON.stringify(dadosEscola)
                });
            } else {
                // Criar nova escola
                console.log("Criando nova escola");
                resultado = await ConfigModule.fetchApi('/escolas/', {
                    method: 'POST',
                    body: JSON.stringify(dadosEscola)
                });
            }
            
            console.log("Escola salva com sucesso:", resultado);
            
            // Fechar formulário e recarregar lista
            this.cancelarEdicao();
            await this.carregarEscolas();
            
            alert(this.state.modoEdicao ? "Escola atualizada com sucesso!" : "Escola cadastrada com sucesso!");
            
        } catch (error) {
            console.error("Erro ao salvar escola:", error);
            alert("Erro ao salvar escola: " + error.message);
        }
    },

    // Editar escola
    editarEscola: async function(id) {
        console.log(`Editando escola ${id}...`);
        
        try {
            // Buscar dados da escola
            const escola = await ConfigModule.fetchApi(`/escolas/${id}`);
            
            console.log("Dados da escola carregados:", escola);
            
            // Definir modo de edição
            this.state.modoEdicao = true;
            this.state.escolaSelecionada = escola;
            
            // Preencher formulário
            if (this.elements.inputCodigoInep) this.elements.inputCodigoInep.value = escola.codigo_inep || '';
            if (this.elements.inputCnpj) this.elements.inputCnpj.value = escola.cnpj || '';
            if (this.elements.inputRazaoSocial) this.elements.inputRazaoSocial.value = escola.razao_social || '';
            if (this.elements.inputNomeFantasia) this.elements.inputNomeFantasia.value = escola.nome_fantasia || '';
            if (this.elements.inputEmail) this.elements.inputEmail.value = escola.email_principal || '';
            if (this.elements.inputTelefone) this.elements.inputTelefone.value = escola.telefone_principal || '';
            // Carregar cidades da UF primeiro, depois selecionar a cidade
            if (escola.uf) {
                await this.carregarCidades(escola.uf);
                if (this.elements.selectCidade && escola.cidade) {
                    this.elements.selectCidade.value = escola.cidade;
                }
            }
            if (this.elements.selectUf) this.elements.selectUf.value = escola.uf || '';
            
            // Mostrar formulário
            if (this.elements.formEscola) {
                this.elements.formEscola.classList.remove('d-none');
            }
            
        } catch (error) {
            console.error("Erro ao carregar escola para edição:", error);
            alert("Erro ao carregar dados da escola: " + error.message);
        }
    },

    // Cancelar edição
    cancelarEdicao: function() {
        console.log("Cancelando edição...");
        
        this.state.modoEdicao = false;
        this.state.escolaSelecionada = null;
        
        // Ocultar formulário
        if (this.elements.formEscola) {
            this.elements.formEscola.classList.add('d-none');
            this.elements.formEscola.reset();
        }
        
        // Resetar select de cidades
        if (this.elements.selectCidade) {
            this.elements.selectCidade.innerHTML = '<option value="">Selecione primeiro o Estado</option>';
            this.elements.selectCidade.disabled = true;
        }
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
        
        // Exibir erro na interface
        if (this.elements.listaEscolas) {
            this.elements.listaEscolas.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-danger">
                        <strong>Erro:</strong> ${mensagem}
                        <br><br>
                        <button class="btn btn-primary btn-sm" onclick="window.App.modules.escolas.carregarEscolas()">
                            Tentar Novamente
                        </button>
                    </td>
                </tr>
            `;
        }
        
        // Também mostrar um alert para debug
        console.log(`Erro: ${mensagem}`);
    }
};

// Exportar módulo
export default EscolasModule;

// Adicionar ao window para debug
if (typeof window !== 'undefined') {
    window.EscolasModule = EscolasModule;
} 