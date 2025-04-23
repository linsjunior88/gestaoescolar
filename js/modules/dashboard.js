/**
 * Módulo de Dashboard
 * Contém todas as funções relacionadas à visualização do dashboard principal
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const DashboardModule = {
    // Estado do módulo
    state: {
        estatisticas: {
            totalAlunos: 0,
            totalTurmas: 0,
            totalProfessores: 0,
            totalDisciplinas: 0
        },
        desempenhoTurmas: [],
        distribuicaoAlunos: []
    },
    
    // Elementos DOM
    elements: {
        cardTotalAlunos: null,
        cardTotalTurmas: null,
        cardTotalProfessores: null,
        cardTotalDisciplinas: null,
        chartDesempenho: null,
        chartDistribuicao: null,
        selectAnoDesempenho: null,
        selectBimestreDesempenho: null,
        btnAtualizarGraficos: null
    },
    
    // Instâncias de gráficos
    charts: {
        desempenho: null,
        distribuicao: null
    },
    
    // Inicializar módulo
    init: function() {
        console.log("Inicializando módulo de dashboard");
        this.cachearElementos();
        this.adicionarEventListeners();
        this.carregarEstatisticas();
        this.carregarDadosGraficos();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.cardTotalAlunos = document.getElementById('total-alunos');
        this.elements.cardTotalTurmas = document.getElementById('total-turmas');
        this.elements.cardTotalProfessores = document.getElementById('total-professores');
        this.elements.cardTotalDisciplinas = document.getElementById('total-disciplinas');
        this.elements.chartDesempenho = document.getElementById('chart-desempenho');
        this.elements.chartDistribuicao = document.getElementById('chart-distribuicao');
        this.elements.selectAnoDesempenho = document.getElementById('ano-desempenho');
        this.elements.selectBimestreDesempenho = document.getElementById('bimestre-desempenho');
        this.elements.btnAtualizarGraficos = document.getElementById('btn-atualizar-graficos');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.btnAtualizarGraficos) {
            this.elements.btnAtualizarGraficos.addEventListener('click', () => {
                this.carregarDadosGraficos();
            });
        }
    },
    
    // Carregar estatísticas gerais
    carregarEstatisticas: async function() {
        try {
            const estatisticas = await ConfigModule.fetchApi('/estatisticas');
            this.state.estatisticas = estatisticas;
            this.renderizarEstatisticas();
            console.log("Estatísticas carregadas com sucesso:", estatisticas);
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
            this.mostrarErro("Não foi possível carregar as estatísticas. Tente novamente mais tarde.");
        }
    },
    
    // Renderizar estatísticas nos cards
    renderizarEstatisticas: function() {
        if (this.elements.cardTotalAlunos) {
            this.elements.cardTotalAlunos.textContent = this.state.estatisticas.totalAlunos;
        }
        
        if (this.elements.cardTotalTurmas) {
            this.elements.cardTotalTurmas.textContent = this.state.estatisticas.totalTurmas;
        }
        
        if (this.elements.cardTotalProfessores) {
            this.elements.cardTotalProfessores.textContent = this.state.estatisticas.totalProfessores;
        }
        
        if (this.elements.cardTotalDisciplinas) {
            this.elements.cardTotalDisciplinas.textContent = this.state.estatisticas.totalDisciplinas;
        }
    },
    
    // Carregar dados para os gráficos
    carregarDadosGraficos: async function() {
        try {
            const ano = this.elements.selectAnoDesempenho ? this.elements.selectAnoDesempenho.value : new Date().getFullYear();
            const bimestre = this.elements.selectBimestreDesempenho ? this.elements.selectBimestreDesempenho.value : 1;
            
            // Carregar dados de desempenho das turmas
            const desempenhoTurmas = await ConfigModule.fetchApi(`/desempenho-turmas?ano=${ano}&bimestre=${bimestre}`);
            this.state.desempenhoTurmas = desempenhoTurmas;
            
            // Carregar dados de distribuição de alunos por turma
            const distribuicaoAlunos = await ConfigModule.fetchApi('/distribuicao-alunos');
            this.state.distribuicaoAlunos = distribuicaoAlunos;
            
            // Renderizar gráficos
            this.renderizarGraficos();
            
            console.log("Dados dos gráficos carregados com sucesso");
        } catch (error) {
            console.error("Erro ao carregar dados dos gráficos:", error);
            this.mostrarErro("Não foi possível carregar os dados dos gráficos. Tente novamente mais tarde.");
        }
    },
    
    // Renderizar gráficos
    renderizarGraficos: function() {
        this.renderizarGraficoDesempenho();
        this.renderizarGraficoDistribuicao();
    },
    
    // Renderizar gráfico de desempenho das turmas
    renderizarGraficoDesempenho: function() {
        if (!this.elements.chartDesempenho) return;
        
        // Preparar dados para o gráfico
        const labels = this.state.desempenhoTurmas.map(item => item.turma);
        const data = this.state.desempenhoTurmas.map(item => item.media);
        
        // Definir cores com base nas médias
        const backgroundColors = data.map(media => {
            if (media >= 7) return 'rgba(75, 192, 192, 0.6)'; // Verde para médias boas
            if (media >= 5) return 'rgba(255, 206, 86, 0.6)'; // Amarelo para médias regulares
            return 'rgba(255, 99, 132, 0.6)'; // Vermelho para médias ruins
        });
        
        // Destruir gráfico anterior se existir
        if (this.charts.desempenho) {
            this.charts.desempenho.destroy();
        }
        
        // Criar novo gráfico
        const ctx = this.elements.chartDesempenho.getContext('2d');
        this.charts.desempenho = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Média das Turmas',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Desempenho das Turmas'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Média: ${context.raw.toFixed(1)}`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Renderizar gráfico de distribuição de alunos por turma
    renderizarGraficoDistribuicao: function() {
        if (!this.elements.chartDistribuicao) return;
        
        // Preparar dados para o gráfico
        const labels = this.state.distribuicaoAlunos.map(item => item.turma);
        const data = this.state.distribuicaoAlunos.map(item => item.quantidade);
        
        // Gerar cores aleatórias para cada fatia
        const backgroundColors = labels.map(() => {
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            return `rgba(${r}, ${g}, ${b}, 0.6)`;
        });
        
        // Destruir gráfico anterior se existir
        if (this.charts.distribuicao) {
            this.charts.distribuicao.destroy();
        }
        
        // Criar novo gráfico
        const ctx = this.elements.chartDistribuicao.getContext('2d');
        this.charts.distribuicao = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribuição de Alunos por Turma'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} alunos (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    // Mostrar mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-success alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        document.querySelector('#conteudo-dashboard').insertBefore(alertContainer, document.querySelector('#conteudo-dashboard').firstChild);
        
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
        
        document.querySelector('#conteudo-dashboard').insertBefore(alertContainer, document.querySelector('#conteudo-dashboard').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default DashboardModule;
