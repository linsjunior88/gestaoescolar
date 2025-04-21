/**
 * Configurações da aplicação
 * Este arquivo contém as configurações da aplicação,
 * incluindo URLs da API para diferentes ambientes.
 */

const CONFIG = {
    // Detectar ambiente de produção automaticamente
    isProd: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
    
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
    
    // Obter URL da API local para fallback
    getLocalApiUrl: function(endpoint) {
        return `http://localhost:4000/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    },
    
    // Obter URL da API simplificada para segundo fallback
    getSimpleApiUrl: function(endpoint) {
        return `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    },
    
    // Testar conexão com a API e configurar fallback se necessário
    testApiConnection: function(callback, silencioso = false) {
        console.log("Verificando conexão com a API...");
        console.log("Ambiente: ", this.isProd ? "Produção" : "Desenvolvimento");
        console.log("URL da API: ", this.apiUrl());
        
        // Armazenar url original da API para fallback se necessário
        let originalApiUrl = this.apiUrl;
        
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
                
                // Não exibir mensagem se for no modo silencioso
                if (!silencioso) {
                    // Mostrar mensagem de sucesso apenas quando solicitado explicitamente
                    const alertContainer = document.createElement('div');
                    alertContainer.className = 'alert alert-success alert-dismissible fade show';
                    alertContainer.innerHTML = `
                        <strong>Conectado!</strong> API funcionando normalmente. 
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                    `;
                    
                    // Inserir aviso no topo da página
                    document.body.insertBefore(alertContainer, document.body.firstChild);
                }
            })
            .catch(error => {
                console.error("Erro ao conectar com a API:", error);
                
                // Tentar API local como fallback
                if (this.isProd) {
                    console.log("Tentando fallback para API local...");
                    
                    fetch('http://localhost:4000/api/turmas')
                        .then(response => {
                            if (response.ok) {
                                console.log("Conexão com API local estabelecida, usando como fallback");
                                // Substituir método apiUrl para usar API local
                                this.apiUrl = function() {
                                    return 'http://localhost:4000/api';
                                };
                                
                                // Somente exibir a mensagem se não estiver no modo silencioso
                                if (!silencioso) {
                                    const alertSuccess = document.createElement('div');
                                    alertSuccess.className = 'alert alert-warning alert-dismissible fade show';
                                    alertSuccess.innerHTML = `
                                        <strong>Atenção!</strong> Usando API local como fallback. 
                                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                                    `;
                                    document.body.insertBefore(alertSuccess, document.body.firstChild);
                                }
                                
                                // Informar que está conectado
                                if (callback) callback(true);
                                return;
                            }
                            throw new Error("Fallback para API local também falhou");
                        })
                        .catch(localError => {
                            console.error("Tentativa de fallback para API local falhou:", localError);
                            
                            // Avisar o usuário sobre o problema apenas se não estiver no modo silencioso
                            if (!silencioso) {
                                const alertContainer = document.createElement('div');
                                alertContainer.className = 'alert alert-danger alert-dismissible fade show';
                                alertContainer.innerHTML = `
                                    <strong>Erro de conexão!</strong> Não foi possível conectar à API: ${error.message}
                                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">Tentar novamente</button>
                                `;
                                
                                // Inserir aviso no topo da página
                                document.body.insertBefore(alertContainer, document.body.firstChild);
                            }
                            
                            if (callback) callback(false);
                        });
                } else {
                    // Já estamos em ambiente de desenvolvimento, mostrar erro apenas se não estiver no modo silencioso
                    if (!silencioso) {
                        const alertContainer = document.createElement('div');
                        alertContainer.className = 'alert alert-danger alert-dismissible fade show';
                        alertContainer.innerHTML = `
                            <strong>Erro de conexão!</strong> Não foi possível conectar à API: ${error.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">Tentar novamente</button>
                        `;
                        
                        // Inserir aviso no topo da página
                        document.body.insertBefore(alertContainer, document.body.firstChild);
                    }
                    
                    if (callback) callback(false);
                }
            });
    },
};

// Testa conexão com a API ao inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar a conexão com a API silenciosamente (sem mostrar mensagens na tela)
    CONFIG.testApiConnection(null, true);
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
                
                // Tentar usar a API local como fallback
                if (this.isProd) {
                    console.log(`Tentando fallback para API local: ${endpoint}`);
                    return fetch(this.getLocalApiUrl(endpoint), requestOptions)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ${response.status}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(data => resolve(data))
                        .catch(localError => {
                            console.error(`Erro na requisição local para ${endpoint}:`, localError);
                            reject(error); // Rejeita com o erro original
                        });
                } else {
                    reject(error);
                }
            });
    });
};

// Exportar configuração para uso global
window.CONFIG = CONFIG; 