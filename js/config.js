/**
 * Configurações da aplicação
 * Este arquivo contém as configurações da aplicação,
 * incluindo URLs da API para diferentes ambientes.
 */

const CONFIG = {
    // Detectar ambiente de produção
    isProd: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    
    // Flag para usar dados mockados quando a API não está disponível
    useMockData: false,
    
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
        // Se estamos usando dados mockados, retornar endpoint falso
        if (this.useMockData) {
            console.warn(`API indisponível - Usando dados mockados para ${endpoint}`);
            return `/mock-data${endpoint}.json`;
        }
        // Construir e retornar URL completa
        return `${this.apiUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    },
    
    // Testar conexão com a API e configurar fallback se necessário
    testApiConnection: function(callback) {
        console.log("Testando conexão com a API...");
        
        // Endpoint para testar (primeiro tentamos /status, depois um endpoint comum)
        fetch(this.apiUrl() + '/status')
            .then(response => {
                if (!response.ok) {
                    // Se /status falhar, tentar um endpoint comum
                    return fetch(this.apiUrl() + '/turmas')
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('API indisponível');
                            }
                            return { status: 'ok' };
                        });
                }
                return response.json();
            })
            .then(data => {
                console.log("API está disponível:", data);
                // API está disponível, usar dados reais
                this.useMockData = false;
                if (callback) callback(true);
            })
            .catch(error => {
                console.error("API está indisponível:", error);
                // API indisponível, habilitar fallback para dados mockados
                this.useMockData = true;
                if (callback) callback(false);
            });
    },
    
    // Gerar dados mockados para quando a API estiver indisponível
    getMockData: function(endpoint) {
        // Implementação básica de dados mockados
        const mockData = {
            '/turmas': [
                { id: 1, nome: 'Turma A (Mock)', ano: '2023', turno: 'Manhã' },
                { id: 2, nome: 'Turma B (Mock)', ano: '2023', turno: 'Tarde' }
            ],
            '/professores': [
                { id: 1, nome: 'João Silva (Mock)', email: 'joao@exemplo.com' },
                { id: 2, nome: 'Maria Santos (Mock)', email: 'maria@exemplo.com' }
            ],
            '/alunos': [
                { id: 1, nome: 'Pedro Alves (Mock)', email: 'pedro@exemplo.com', matricula: '2023001' },
                { id: 2, nome: 'Ana Costa (Mock)', email: 'ana@exemplo.com', matricula: '2023002' }
            ],
            '/disciplinas': [
                { id: 1, nome: 'Matemática (Mock)' },
                { id: 2, nome: 'Português (Mock)' }
            ]
        };
        
        // Normalizar o endpoint (remover o ponto json se foi adicionado)
        const cleanEndpoint = endpoint.replace('.json', '');
        
        // Retornar dados específicos ou um array vazio
        return mockData[cleanEndpoint] || [];
    }
};

// Testa conexão com a API ao inicializar
document.addEventListener('DOMContentLoaded', function() {
    CONFIG.testApiConnection(function(isAvailable) {
        if (!isAvailable) {
            console.warn("Usando dados mockados - API indisponível");
            
            // Avisar o usuário
            const alertContainer = document.createElement('div');
            alertContainer.className = 'alert alert-warning alert-dismissible fade show';
            alertContainer.innerHTML = `
                <strong>Aviso!</strong> Não foi possível conectar à API. 
                Usando dados de demonstração temporários. 
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            `;
            
            // Inserir aviso no topo da página
            document.body.insertBefore(alertContainer, document.body.firstChild);
        }
    });
});

// Função para fazer requisições à API com tratamento de erros e fallback
CONFIG.fetchApi = function(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
        // Se estamos usando dados mockados, retornar diretamente
        if (this.useMockData) {
            console.log(`Usando dados mockados para ${endpoint}`);
            setTimeout(() => {
                resolve(this.getMockData(endpoint));
            }, 500); // Simulando delay de rede
            return;
        }
        
        // Fazer requisição real à API
        fetch(this.getApiUrl(endpoint), options)
            .then(response => {
                if (!response.ok) {
                    // Se for um erro 500, tentar usar dados mockados
                    if (response.status >= 500) {
                        console.warn(`Erro ${response.status} na API - Usando dados mockados para ${endpoint}`);
                        return this.getMockData(endpoint);
                    }
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error("Erro na requisição à API:", error);
                
                // Em caso de erro de rede, usar dados mockados como fallback
                if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
                    console.warn(`Erro de rede - Usando dados mockados para ${endpoint}`);
                    resolve(this.getMockData(endpoint));
                } else {
                    reject(error);
                }
            });
    });
};

// Exportar configuração para uso global
window.CONFIG = CONFIG; 