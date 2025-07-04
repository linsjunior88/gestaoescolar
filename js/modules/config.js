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
    
    // Getter para API_BASE_URL para compatibilidade
    get API_BASE_URL() {
        return this.state.apiUrl;
    },
    
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
        // Adicionar contador de tentativas para evitar loops infinitos
        const maxRetries = options.maxRetries || 1; // Padrão: apenas 1 tentativa (sem retry)
        let retryCount = 0;
        let lastError = null;
        
        while (retryCount <= maxRetries) {
            try {
                const baseUrl = this.state.apiUrl;
                const url = `${baseUrl}${endpoint}`;
                
                if (retryCount > 0) {
                    console.log(`Tentativa ${retryCount}/${maxRetries} para ${url}`);
                } else {
                    console.log(`Fazendo requisição para: ${url}`);
                }
                
                // Configurar headers
                const headers = {
                    'Content-Type': 'application/json',
                    ...options.headers
                };
                
                // Configurar opções de requisição
                const fetchOptions = {
                    ...options,
                    headers,
                    // Adicionar timeout para evitar requisições penduradas
                    signal: options.signal || (options.timeout ? AbortSignal.timeout(options.timeout) : undefined)
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
                lastError = error;
                
                // Verificar se é um erro de rede/conexão
                const isNetworkError = 
                    error.name === 'TypeError' && 
                    error.message.includes('NetworkError') ||
                    error.message.includes('Failed to fetch') ||
                    error.message.includes('Network request failed');
                
                // Verificar se é um erro de timeout
                const isTimeoutError = 
                    error.name === 'AbortError' || 
                    error.name === 'TimeoutError';
                
                // Verificar se é um erro de CORS
                const isCORSError = 
                    error.message.includes('CORS') || 
                    error.message.includes('Cross-Origin');
                
                // Logar o erro de forma mais detalhada
                if (isNetworkError) {
                    console.warn(`Erro de rede na requisição para ${endpoint} (tentativa ${retryCount+1}/${maxRetries+1}):`, error);
                } else if (isTimeoutError) {
                    console.warn(`Timeout na requisição para ${endpoint} (tentativa ${retryCount+1}/${maxRetries+1}):`, error);
                } else if (isCORSError) {
                    console.warn(`Erro de CORS na requisição para ${endpoint} (tentativa ${retryCount+1}/${maxRetries+1}):`, error);
                } else {
                    console.error(`Erro na requisição para ${endpoint} (tentativa ${retryCount+1}/${maxRetries+1}):`, error);
                }
                
                // Incrementar contador de tentativas
                retryCount++;
                
                // Se ainda não atingiu o máximo de tentativas e é um erro de rede ou timeout,
                // esperar um pouco antes de tentar novamente
                if (retryCount <= maxRetries && (isNetworkError || isTimeoutError)) {
                    const delayMs = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // Backoff exponencial (max 5s)
                    console.log(`Aguardando ${delayMs}ms antes da próxima tentativa...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                }
                
                // Se chegou aqui, ou atingiu o máximo de tentativas ou não é um erro que justifique retry
                throw error;
            }
        }
        
        // Se chegou aqui, é porque todas as tentativas falharam
        throw lastError;
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
