/**
 * charts.js
 * Gerencia os gráficos e visualizações de dados do dashboard.
 */

// Função para inicializar os gráficos
function initCharts() {
    console.log("Inicializando gráficos do dashboard");
    
    // Destruir gráficos existentes para evitar erro de "Canvas is already in use"
    if (chartDesempenho) {
        chartDesempenho.destroy();
        chartDesempenho = null;
    }
    
    if (chartPizza) {
        chartPizza.destroy();
        chartPizza = null;
    }
    
    // Gráfico de barras - Desempenho por Turma
    const ctxBar = document.getElementById('graficoDesempenho');
    if (ctxBar) {
        chartDesempenho = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['5º Ano A', '5º Ano B', '6º Ano A', '6º Ano B', '7º Ano A', '8º Ano A', '9º Ano A'],
                datasets: [{
                    label: 'Média de Desempenho',
                    data: [7.8, 6.9, 7.2, 8.1, 6.5, 7.4, 6.8],
                    backgroundColor: 'rgba(78, 115, 223, 0.5)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Gráfico de pizza - Distribuição por Série
    const ctxPie = document.getElementById('graficoPizza');
    if (ctxPie) {
        chartPizza = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'],
                datasets: [{
                    data: [125, 110, 98, 102, 88],
                    backgroundColor: [
                        'rgba(78, 115, 223, 0.7)',
                        'rgba(28, 200, 138, 0.7)',
                        'rgba(54, 185, 204, 0.7)',
                        'rgba(246, 194, 62, 0.7)',
                        'rgba(231, 74, 59, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Função para inicializar o dashboard geral
function initGeral() {
    console.log("Inicializando dashboard geral");
    
    // Atualizar cards e gráficos
    atualizarCardsDashboard();
    
    // Recarregar gráficos
    if (typeof initCharts === 'function') {
        initCharts();
    }
}

// Função para atualizar os cards do dashboard
function atualizarCardsDashboard() {
    console.log("Atualizando cards do dashboard");
    
    // Carregar dados do backend ou usar dados mockados
    const dadosTurmas = getLocalData('turmas') || [];
    const dadosAlunos = getLocalData('alunos') || [];
    const dadosProfessores = getLocalData('professores') || [];
    const dadosDisciplinas = getLocalData('disciplinas') || [];
    
    // Atualizar contadores nos cards
    document.getElementById('contador-turmas').textContent = dadosTurmas.length || '0';
    document.getElementById('contador-disciplinas').textContent = dadosDisciplinas.length || '0';
    document.getElementById('contador-professores').textContent = dadosProfessores.length || '0';
    document.getElementById('contador-alunos').textContent = dadosAlunos.length || '0';
    
    // Fazer chamadas à API para obter dados atualizados (se disponível)
    try {
        // Obter contagem de turmas
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data && Array.isArray(data)) {
                    document.getElementById('contador-turmas').textContent = data.length;
                }
            })
            .catch(error => console.error("Erro ao atualizar contador de turmas:", error));
        
        // Obter contagem de alunos
        fetch(CONFIG.getApiUrl('/alunos'))
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data && Array.isArray(data)) {
                    document.getElementById('contador-alunos').textContent = data.length;
                }
            })
            .catch(error => console.error("Erro ao atualizar contador de alunos:", error));
        
        // Obter contagem de professores
        fetch(CONFIG.getApiUrl('/professores'))
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data && Array.isArray(data)) {
                    document.getElementById('contador-professores').textContent = data.length;
                }
            })
            .catch(error => console.error("Erro ao atualizar contador de professores:", error));
        
        // Obter contagem de disciplinas
        fetch(CONFIG.getApiUrl('/disciplinas'))
            .then(response => response.ok ? response.json() : null)
            .then(data => {
                if (data && Array.isArray(data)) {
                    document.getElementById('contador-disciplinas').textContent = data.length;
                }
            })
            .catch(error => console.error("Erro ao atualizar contador de disciplinas:", error));
    } catch (e) {
        console.error("Erro ao atualizar cards do dashboard:", e);
    }
}

// Função auxiliar para obter dados do localStorage
const getLocalData = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Erro ao obter dados de ${key}:`, error);
        return null;
    }
};

// Exportar funções para o escopo global
window.initCharts = initCharts;
window.initGeral = initGeral;
window.atualizarCardsDashboard = atualizarCardsDashboard; 