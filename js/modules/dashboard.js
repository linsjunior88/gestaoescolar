/**
 * Módulo de Dashboard
 * Contém todas as funções relacionadas à visualização inicial do dashboard
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const DashboardModule = {
    // Estado do módulo
    state: {
        dadosEstatisticos: {
            totalAlunos: 0,
            totalProfessores: 0,
            totalTurmas: 0,
            totalDisciplinas: 0
        },
        isLoading: false
    },
    
    // Elementos DOM
    elements: {
        cardTotalAlunos: null,
        cardTotalProfessores: null,
        cardTotalTurmas: null,
        cardTotalDisciplinas: null,
        chartDesempenho: null,
        chartDistribuicao: null
    },
    
    // Inicializar módulo
    init: function() {
        console.log("Inicializando módulo de dashboard");
        this.cachearElementos();
        this.carregarDadosEstatisticos();
        
        // Se temos os elementos de gráficos, inicializá-los
        if (this.elements.chartDesempenho && this.elements.chartDistribuicao) {
            this.inicializarGraficos();
        }
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.cardTotalAlunos = document.getElementById('total-alunos');
        this.elements.cardTotalProfessores = document.getElementById('total-professores');
        this.elements.cardTotalTurmas = document.getElementById('total-turmas');
        this.elements.cardTotalDisciplinas = document.getElementById('total-disciplinas');
        this.elements.chartDesempenho = document.getElementById('chart-desempenho');
        this.elements.chartDistribuicao = document.getElementById('chart-distribuicao');
    },
    
    // Carregar dados estatísticos da API
    carregarDadosEstatisticos: async function() {
        console.log("Carregando dados estatísticos do dashboard");
        
        // Evitar múltiplas requisições simultâneas
        if (this.state.isLoading) {
            console.log("Já existe uma requisição em andamento. Ignorando.");
            return;
        }
        
        this.state.isLoading = true;
        
        try {
            // Fazer requisições individuais com tratamento de erro para cada uma
            let alunos = [];
            let professores = [];
            let turmas = [];
            let disciplinas = [];
            
            try {
                alunos = await ConfigModule.fetchApi('/alunos');
                console.log("Alunos carregados:", alunos.length);
            } catch (error) {
                console.warn("Erro ao carregar alunos:", error);
            }
            
            try {
                professores = await ConfigModule.fetchApi('/professores');
                console.log("Professores carregados:", professores.length);
            } catch (error) {
                console.warn("Erro ao carregar professores:", error);
            }
            
            try {
                turmas = await ConfigModule.fetchApi('/turmas');
                console.log("Turmas carregadas:", turmas.length);
            } catch (error) {
                console.warn("Erro ao carregar turmas:", error);
            }
            
            try {
                disciplinas = await ConfigModule.fetchApi('/disciplinas');
                console.log("Disciplinas carregadas:", disciplinas.length);
            } catch (error) {
                console.warn("Erro ao carregar disciplinas:", error);
            }
            
            // Verificar campo 'ativo' para depuração de forma segura
            if (Array.isArray(professores)) {
                console.log("Dashboard: Verificando professores ativos/inativos");
                
                // Filtrar professores apenas pelo campo 'ativo'
                const professoresAtivos = professores.filter(professor => professor.ativo !== false);
                
                console.log(`Dashboard: Professores - Total: ${professores.length}, Ativos: ${professoresAtivos.length}`);
                
                // Garantir que os valores sejam números válidos
                const totalAlunos = Array.isArray(alunos) ? alunos.length : 0;
                const totalProfessores = professoresAtivos.length;
                const totalTurmas = Array.isArray(turmas) ? turmas.length : 0;
                const totalDisciplinas = Array.isArray(disciplinas) ? disciplinas.length : 0;
                
                // Atualizar estado
                this.state.dadosEstatisticos = {
                    totalAlunos,
                    totalProfessores,
                    totalTurmas,
                    totalDisciplinas
                };
                
                // Atualizar UI
                this.atualizarCardsDashboard();
                
                console.log("Dashboard: Dados estatísticos atualizados:", this.state.dadosEstatisticos);
            }
        } catch (error) {
            console.error("Erro ao carregar dados estatísticos:", error);
        } finally {
            // Sempre marcar como não carregando ao final
            this.state.isLoading = false;
        }
    },
    
    // Atualizar cards do dashboard
    atualizarCardsDashboard: function() {
        const stats = this.state.dadosEstatisticos;
        
        if (this.elements.cardTotalAlunos) {
            this.elements.cardTotalAlunos.textContent = stats.totalAlunos;
        }
        
        if (this.elements.cardTotalProfessores) {
            this.elements.cardTotalProfessores.textContent = stats.totalProfessores;
            console.log(`Dashboard: Atualizando card de professores: ${stats.totalProfessores}`);
        }
        
        if (this.elements.cardTotalTurmas) {
            this.elements.cardTotalTurmas.textContent = stats.totalTurmas;
        }
        
        if (this.elements.cardTotalDisciplinas) {
            this.elements.cardTotalDisciplinas.textContent = stats.totalDisciplinas;
        }
    },
    
    // Método para forçar a atualização dos cards
    atualizarDashboard: function() {
        // Evitar múltiplas chamadas muito próximas
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // Agendar atualização com pequeno delay para evitar múltiplas chamadas
        this.updateTimeout = setTimeout(() => {
            console.log("Dashboard: Atualizando dados");
            this.carregarDadosEstatisticos();
        }, 300);
    },
    
    // Inicializar gráficos
    inicializarGraficos: function() {
        // Esta função seria implementada usando uma biblioteca de gráficos como Chart.js
        console.log("Inicializando gráficos (não implementado)");
    }
};

// Exportar módulo
export default DashboardModule;
