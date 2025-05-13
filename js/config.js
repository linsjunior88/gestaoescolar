/**
 * Módulo de configuração
 * Responsável por gerenciar as configurações da aplicação
 */

const ConfigModule = {
    // Estado do módulo
    state: {
        apiUrl: 'https://gestao-escolar-api.onrender.com/api', // URL da API COM o /api no final
        proxyServices: [
            'https://cors-anywhere.herokuapp.com/',
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url='
        ],
        currentProxyIndex: 0,
        usarProxy: false,
        isLoading: false,
        error: null
    },
    
    // Inicializar módulo
    init: function()  {
        console.log("Módulo de configuração inicializado");
        this.verificarConexaoAPI();
    },
    
    // Verificar status da API e se precisa usar proxy
    verificarConexaoAPI: function() {
        this.state.isLoading = true;
        
        // Aqui usamos a URL base sem o /api porque o endpoint /health está na raiz
        fetch('https://gestao-escolar-api.onrender.com/health') 
            .then(response => response.json())
            .then(data => {
                console.log("Status da API:", data);
                this.state.isLoading = false;
                this.state.usarProxy = false;
            })
            .catch(error => {
                console.error("Erro ao verificar status da API:", error);
                console.log("Ativando modo proxy para contornar restrições de CORS");
                this.state.error = error;
                this.state.isLoading = false;
                this.state.usarProxy = true;
            });
    },
    
    // Obter próximo proxy da lista (alterna entre os disponíveis)
    getNextProxy: function() {
        const proxy = this.state.proxyServices[this.state.currentProxyIndex];
        this.state.currentProxyIndex = (this.state.currentProxyIndex + 1) % this.state.proxyServices.length;
        return proxy;
    },
    
    // Obter URL da API (com ou sem proxy, dependendo da necessidade)
    getApiUrl: function(endpoint = '') {
        const base = this.state.apiUrl;
        
        // Se não foi fornecido um endpoint, retorne a URL base
        if (!endpoint) return base;
        
        // Garantir que a junção de URLs seja feita corretamente
        let url;
        if (endpoint.startsWith('/')) {
            url = `${base}${endpoint}`;
        } else {
            url = `${base}/${endpoint}`;
        }
        
        // Se precisamos usar proxy, aplicar o proxy à URL
        if (this.state.usarProxy) {
            console.log(`Usando proxy para acessar: ${url}`);
            return `${this.getNextProxy()}${encodeURIComponent(url)}`;
        }
        
        return url;
    },
    
    // Função para fazer requisições contornando CORS, se necessário
    fetchApi: async function(endpoint, options = {}) {
        try {
            const url = this.getApiUrl(endpoint);
            
            console.log(`Fazendo requisição para: ${url}`);
            
            // Configurar headers
            const headers = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest', // Necessário para alguns proxies
                ...options.headers
            };
            
            // Configurar opções de requisição
            const fetchOptions = {
                ...options,
                headers
            };
            
            // Log de informações para debug
            console.log(`Método: ${fetchOptions.method || 'GET'}`);
            if (fetchOptions.body) {
                console.log(`Payload: ${fetchOptions.body}`);
            }
            
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            
            // Se ocorreu um erro e ainda não estamos usando proxy, tentar ativar o proxy
            if (!this.state.usarProxy) {
                console.log("Erro na requisição direta, ativando proxy CORS");
                this.state.usarProxy = true;
                
                // Tentar novamente com proxy
                return this.fetchApi(endpoint, options);
            }
            
            throw error;
        }
    }
};

// Exportar o módulo para o escopo global para uso em scripts não-modularizados
window.CONFIG = ConfigModule;

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', function() {
    ConfigModule.init();
});
