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
        }
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
        try {
            // Fazer requisições paralelas para melhorar performance
            const [alunos, professores, turmas, disciplinas] = await Promise.all([
                ConfigModule.fetchApi('/alunos').catch(() => []),
                ConfigModule.fetchApi('/professores').catch(() => []),
                ConfigModule.fetchApi('/turmas').catch(() => []),
                ConfigModule.fetchApi('/disciplinas').catch(() => [])
            ]);
            
            // Verificar campo 'ativo' para depuração
            console.log("Dashboard: Verificando campo 'ativo' dos professores:");
            professores.forEach(prof => {
                console.log(`Professor ${prof.id_professor || prof.id} (${prof.nome_professor || "Sem nome"}): ativo=${prof.ativo}`);
            });
            
            // Filtrar professores apenas pelo campo 'ativo'
            const professoresAtivos = professores.filter(professor => {
                // Verificar especificamente se o campo 'ativo' é false
                if (professor.ativo === false) {
                    console.log(`Professor ${professor.id_professor || professor.id} excluído por ativo=false`);
                    return false;
                }
                return true;
            });
            
            console.log(`Dashboard: Professores - Total: ${professores.length}, Ativos: ${professoresAtivos.length}`);
            
            // Garantir que os valores sejam números válidos
            const totalAlunos = Array.isArray(alunos) ? alunos.length : 0;
            const totalProfessores = Array.isArray(professoresAtivos) ? professoresAtivos.length : 0;
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
        } catch (error) {
            console.error("Erro ao carregar dados estatísticos:", error);
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
        console.log("Dashboard: Forçando atualização dos dados");
        this.carregarDadosEstatisticos();
    },
    
    // Inicializar gráficos
    inicializarGraficos: function() {
        // Esta função seria implementada usando uma biblioteca de gráficos como Chart.js
        console.log("Inicializando gráficos (não implementado)");
    }
};

// Exportar módulo
export default DashboardModule;
