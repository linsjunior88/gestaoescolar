/**
 * Arquivo de configuração para o HTML principal
 * Este arquivo será incluído no HTML para carregar os módulos JavaScript
 */

// Adicionar script type="module" para suportar importação de módulos ES6
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já existe um script de módulo principal
    if (!document.querySelector('script[src*="app.js"][type="module"]')) {
        // Criar elemento script para o módulo principal
        const scriptApp = document.createElement('script');
        scriptApp.type = 'module';
        scriptApp.src = 'js/app.js';
        
        // Adicionar timestamp para evitar cache
        scriptApp.src += '?v=' + Date.now();
        
        // Adicionar ao final do body
        document.body.appendChild(scriptApp);
        
        console.log('Módulo principal carregado dinamicamente');
    }
    
    // Adicionar script para Chart.js se não existir
    if (!document.querySelector('script[src*="chart.js"]')) {
        const scriptChart = document.createElement('script');
        scriptChart.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        
        // Adicionar ao head
        document.head.appendChild(scriptChart);
        
        console.log('Chart.js carregado dinamicamente');
    }
});
