/**
 * Configurações da aplicação
 * Este arquivo contém as configurações da aplicação,
 * incluindo URLs da API para diferentes ambientes.
 */

const CONFIG = {
    // Detectar ambiente de produção
    isProd: true, // Configurado para ambiente de produção
    
    // URLs da API
    apiUrl: function() {
        // Para ambiente de produção no Render
        if (this.isProd) {
            return 'https://gestao-escolar-api.onrender.com/api';
        }
        // Para desenvolvimento local
        return 'http://localhost:4000/api';
    },
    
    // Método para obter URL completa da API
    getApiUrl: function(endpoint) {
        // Construir e retornar URL completa
        return `${this.apiUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    },
    
    // Testar conexão com a API e configurar fallback se necessário
    testApiConnection: function(callback) {
        console.log("Verificando conexão com a API...");
        
        // Endpoint para testar (primeiro tentamos /status, depois um endpoint comum)
        fetch(this.apiUrl() + '/status')
            .then(response => {
                if (!response.ok) {
                    // Se /status falhar, tentar um endpoint comum
                    return fetch(this.apiUrl() + '/turmas')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('API respondeu com status: ' + response.status);
                            }
                            return { status: 'ok', message: 'API disponível via /turmas' };
                        });
                }
                return response.json();
            })
            .then(data => {
                console.log("API conectada com sucesso:", data);
                // API está disponível
                if (callback) callback(true);
                
                // Mostrar mensagem de sucesso
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-success alert-dismissible fade show';
                alertContainer.innerHTML = `
                    <strong>Conectado!</strong> API funcionando normalmente. 
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                `;
                
                // Inserir aviso no topo da página
                document.body.insertBefore(alertContainer, document.body.firstChild);
            })
            .catch(error => {
                console.error("Erro ao conectar com a API:", error);
                
                // Avisar o usuário sobre o problema
                const alertContainer = document.createElement('div');
                alertContainer.className = 'alert alert-danger alert-dismissible fade show';
                alertContainer.innerHTML = `
                    <strong>Erro de conexão!</strong> Não foi possível conectar à API: ${error.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">Tentar novamente</button>
                `;
                
                // Inserir aviso no topo da página
                document.body.insertBefore(alertContainer, document.body.firstChild);
                
                if (callback) callback(false);
            });
    },
};

// Testa conexão com a API ao inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar a conexão com a API
    CONFIG.testApiConnection();
});

// Função para fazer requisições à API com tratamento de erros
CONFIG.fetchApi = function(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        // Adicionar cabeçalhos padrão se não foram fornecidos
        const requestOptions = { 
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers || {}
            }
        };
        
        // Fazer requisição à API
        fetch(this.getApiUrl(endpoint), requestOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(`Erro na requisição para ${endpoint}:`, error);
                reject(error);
            });
    });
};

// Exportar configuração para uso global
window.CONFIG = CONFIG; 