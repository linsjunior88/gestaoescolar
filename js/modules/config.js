/**
 * Módulo de Configuração
 * Contém as configurações da aplicação e funções para conexão com a API
 */

import CORSBypassModule from './cors-bypass.js';

// Namespace para evitar conflitos
const ConfigModule = {
    // Estado
    state: {
        apiUrl: 'https://apinazarerodrigues.86dynamics.com.br/api', // URL da API principal
        proxyUrl: 'https://cors-anywhere.herokuapp.com/', // Proxy CORS para desenvolvimento
        ambiente: 'producao', // 'desenvolvimento' ou 'producao'
        debug: true, // Ativar logs de depuração
        usarProxy: false, // Inicialmente, não usar proxy
        corsErrorCount: 0, // Contador de erros de CORS
        maxCorsRetries: 3  // Número máximo de tentativas
    },
    
    // Detectar ambiente de produção automaticamente
    isProd: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),
    
    // Inicializar o módulo
    init: function() {
        console.log("Módulo de configuração inicializado");
        
        // Definir ambiente baseado na URL
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.state.ambiente = 'desenvolvimento';
        }
        
        console.log(`Ambiente: ${this.state.ambiente === 'desenvolvimento' ? 'Desenvolvimento' : 'Produção'}`);
        console.log(`URL da API: ${this.state.apiUrl}`);
        
        // Detectar suporte a CORS e verificar conexão com a API
        this.verificarConexaoAPI();
    },
    
    // Verificar conexão com a API e definir estratégia para CORS se necessário
    verificarConexaoAPI: async function() {
        try {
            // Tentar uma requisição simples para verificar a conexão
            const response = await fetch(this.state.apiUrl, {
                method: 'HEAD',
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                console.log("Conexão com a API estabelecida com sucesso");
                this.state.usarProxy = false; // Não precisamos de proxy
            }
        } catch (error) {
            console.warn("Erro ao conectar com a API diretamente:", error);
            console.log("Ativando modo proxy para contornar restrições de CORS");
            this.state.usarProxy = true; // Ativar uso de proxy para contornar CORS
        }
    },
    
    // Obter URL da API (com ou sem proxy, dependendo da necessidade)
    getApiUrl: function(endpoint) {
        // Remover barras duplicadas na junção de URLs
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        
        // Verificar se devemos usar o proxy para contornar CORS
        if (this.state.usarProxy) {
            // Usar proxy para contornar CORS, certificando-se de incluir a URL original completa
            return `${this.state.proxyUrl}${this.state.apiUrl}/${cleanEndpoint}`;
        } else {
            // Conectar diretamente à API
            return `${this.state.apiUrl}/${cleanEndpoint}`;
        }
    },
    
    /**
     * Realiza uma requisição para a API
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição
     * @returns {Promise<any>} - Resposta da API
     */
    fetchApi: async function(endpoint, options = {}) {
        try {
            const baseUrl = this.state.apiUrl;
            const url = `${baseUrl}${endpoint}`;
            
            console.log(`Fazendo requisição para: ${url}`);
            
            // Configurar headers
            const headers = {
                'Content-Type': 'application/json',
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
                // Tentar obter detalhes do erro
                let errorDetails;
                try {
                    errorDetails = await response.json();
                } catch (e) {
                    errorDetails = await response.text();
                }
                
                throw new Error(`Erro ${response.status}: ${JSON.stringify(errorDetails)}`);
            }
            
            // Verificar se a resposta está vazia
            const text = await response.text();
            
            // Se a resposta for vazia, retornar um objeto vazio
            if (!text) {
                console.log(`Resposta vazia do servidor para: ${url}`);
                return {};
            }
            
            try {
                const data = JSON.parse(text);
                console.log(`Resposta recebida de ${url}:`, data);
                return data;
            } catch (e) {
                console.warn(`Resposta não é um JSON válido: ${text}`);
                return text;
            }
        } catch (error) {
            console.error(`Erro na requisição para ${this.state.apiUrl}${endpoint}:`, error);
            throw error;
        }
    },
    
    /**
     * Formata um valor monetário em reais
     * @param {number} valor - Valor a ser formatado
     * @returns {string} Valor formatado em BRL
     */
    formatarMoeda: function(valor) {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(valor);
    },
    
    /**
     * Formata uma data no padrão brasileiro (dd/mm/yyyy)
     * @param {string} data - Data em formato ISO ou similar
     * @returns {string} Data formatada
     */
    formatarData: function(data) {
        if (!data) return '';
        
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    },
    
    // Função para converter valores booleanos para exibição
    formatarBooleano: function(valor) {
        return valor ? 'Sim' : 'Não';
    }
};

// Exportar módulo
export default ConfigModule;
