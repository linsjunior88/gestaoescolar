/**
 * API Checker - Ferramenta para verificar a conexão com a API
 */

// Função para verificar o status da API
function checkApiStatus() {
    console.log("Verificando status da API...");
    const statusContainer = document.getElementById('api-status-container');
    
    if (!statusContainer) {
        console.warn("Container de status da API não encontrado");
        return;
    }
    
    statusContainer.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-spinner fa-spin me-2"></i> Verificando conexão com a API...
        </div>
    `;
    
    // Verificar se CONFIG está definido
    if (typeof CONFIG === 'undefined' || typeof CONFIG.getApiUrl !== 'function') {
        statusContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i> Erro: Objeto CONFIG não encontrado ou mal configurado.
            </div>
        `;
        console.error("Objeto CONFIG não encontrado ou getApiUrl não é uma função");
        return;
    }
    
    // Verificar conexão com a API
    // Primeiro tentamos o endpoint /status, se falhar tentamos /turmas
    fetch(CONFIG.getApiUrl('/status'))
        .then(response => {
            if (!response.ok) {
                // Se o endpoint /status não existir, tentar /turmas
                console.log("Endpoint /status não disponível, tentando /turmas...");
                return fetch(CONFIG.getApiUrl('/turmas')).then(response => {
                    if (!response.ok) {
                        throw new Error(`Status: ${response.status} - ${response.statusText}`);
                    }
                    return { status: 'ok', message: 'API disponível (verificado via /turmas)', version: 'N/A' };
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("API status:", data);
            
            statusContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i> API conectada com sucesso!
                    <hr>
                    <small>URL da API: ${CONFIG.apiUrl()}</small><br>
                    <small>Versão: ${data.version || 'N/A'}</small><br>
                    <small>Ambiente: ${CONFIG.isProd ? 'Produção' : 'Desenvolvimento'}</small>
                </div>
            `;
        })
        .catch(error => {
            console.error("Erro ao verificar API:", error);
            
            statusContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i> Não foi possível conectar à API!
                    <hr>
                    <small>URL da API: ${CONFIG.apiUrl()}</small><br>
                    <small>Erro: ${error.message}</small><br>
                    <small>
                        <button class="btn btn-sm btn-outline-danger mt-2" onclick="checkApiStatus()">
                            <i class="fas fa-sync"></i> Tentar novamente
                        </button>
                    </small>
                </div>
            `;
        });
}

// Inicializar verificação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando verificador de API...");
    
    // Criar container para o status da API se não existir
    if (!document.getElementById('api-status-container')) {
        const container = document.createElement('div');
        container.id = 'api-status-container';
        container.className = 'mt-3';
        
        // Inserir no início do conteúdo principal
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.insertBefore(container, mainContent.firstChild);
        } else {
            // Alternativa se mainContent não existir
            document.body.insertBefore(container, document.body.firstChild);
        }
    }
    
    // Verificar status da API
    checkApiStatus();
    
    // Adicionar botão de diagnóstico no menu dropdown
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
        const li = document.createElement('li');
        li.innerHTML = `<a class="dropdown-item" href="#" id="btn-check-api"><i class="fas fa-heartbeat"></i> Verificar API</a>`;
        dropdown.insertBefore(li, dropdown.querySelector('hr'));
        
        // Adicionar evento de clique
        document.getElementById('btn-check-api').addEventListener('click', function(e) {
            e.preventDefault();
            checkApiStatus();
        });
    }
});

// Exportar função para uso global
window.checkApiStatus = checkApiStatus; 