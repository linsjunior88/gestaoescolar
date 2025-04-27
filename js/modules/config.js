/**
 * Módulo de Configuração
 * Contém as configurações da aplicação e funções para conexão com a API
 */

// Namespace para evitar conflitos
const ConfigModule = {
    // Detectar ambiente de produção automaticamente
    isProd: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
    
    // URLs da API
    apiUrl: function() {
        // Para ambiente de produção no Render
        if (this.isProd) {
            return 'https://gestao-escolar-api.onrender.com/api';
        }
        // Para desenvolvimento local
        return 'http://localhost:8000/api';
    },
    
    // Método para obter URL completa da API
    getApiUrl: function(endpoint) {
        // Construir e retornar URL completa
        return `${this.apiUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    },
    
    // Função para fazer requisições à API com tratamento de erros
    fetchApi: async function(endpoint, options = {}) {
        try {
            // Adicionar cabeçalhos padrão se não foram fornecidos
            const requestOptions = { 
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers || {}
                }
            };
            
            // Fazer requisição à API
            const response = await fetch(this.getApiUrl(endpoint), requestOptions);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            // Para métodos DELETE, geralmente não há resposta em JSON
            if (options.method === 'DELETE') {
                // Verificar se há conteúdo na resposta
                const text = await response.text();
                // Se há texto, tentar converter para JSON
                if (text) {
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        // Se não conseguir converter, retornar um objeto simples
                        return { success: true, message: text || "Operação realizada com sucesso" };
                    }
                } else {
                    // Se não tem texto, retornar um objeto simples indicando sucesso
                    return { success: true, message: "Operação realizada com sucesso" };
                }
            }
            
            // Para outros métodos, tentar converter para JSON normalmente
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    },
    
    // Inicializar módulo
    init: function() {
        console.log("Módulo de configuração inicializado");
        console.log("Ambiente:", this.isProd ? "Produção" : "Desenvolvimento");
        console.log("URL da API:", this.apiUrl());
    }
};

// Exportar módulo
export default ConfigModule;
