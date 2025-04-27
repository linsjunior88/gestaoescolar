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
            
            // Atualizar estado
            this.state.dadosEstatisticos = {
                totalAlunos: alunos.length,
                totalProfessores: professores.length,
                totalTurmas: turmas.length,
                totalDisciplinas: disciplinas.length
            };
            
            // Atualizar UI
            this.atualizarCardsDashboard();
            
            console.log("Dados estatísticos carregados com sucesso:", this.state.dadosEstatisticos);
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
        }
        
        if (this.elements.cardTotalTurmas) {
            this.elements.cardTotalTurmas.textContent = stats.totalTurmas;
        }
        
        if (this.elements.cardTotalDisciplinas) {
            this.elements.cardTotalDisciplinas.textContent = stats.totalDisciplinas;
        }
    },
    
    // Inicializar gráficos
    inicializarGraficos: function() {
        // Esta função seria implementada usando uma biblioteca de gráficos como Chart.js
        console.log("Inicializando gráficos (não implementado)");
    }
};

// Exportar módulo
export default DashboardModule;
