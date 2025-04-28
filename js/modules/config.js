/**
 * Módulo de Configuração
 * Contém as configurações da aplicação e funções para conexão com a API
 */

import CORSBypassModule from './cors-bypass.js';

// Namespace para evitar conflitos
const ConfigModule = {
    // Estado
    state: {
        apiUrl: 'https://gestao-escolar-api.onrender.com/api', // URL da API principal
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
    
    // Função para fazer requisições à API
    fetchApi: async function(endpoint, options = {}) {
        const url = this.getApiUrl(endpoint);
        
        // Configuração padrão para requisições
        const defaultOptions = {
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Combinar opções padrão com as opções fornecidas
        const fetchOptions = { ...defaultOptions, ...options };
        
        // Adicionar headers para contornar CORS se necessário
        if (this.state.usarProxy) {
            fetchOptions.headers = {
                ...fetchOptions.headers,
                'X-Requested-With': 'XMLHttpRequest' // Header necessário para o cors-anywhere
            };
        }
        
        try {
            if (this.state.debug) {
                console.log(`Fazendo requisição para: ${url}`, fetchOptions);
            }
            
            let response;
            
            // Se já tivemos muitos erros de CORS, use diretamente o CORSBypassModule
            if (this.state.corsErrorCount >= this.state.maxCorsRetries) {
                console.log(`Usando CORSBypassModule após ${this.state.corsErrorCount} falhas de CORS`);
                response = await CORSBypassModule.fetchWithCORS(url, fetchOptions);
            } else {
                // Fazer a requisição normal
                response = await fetch(url, fetchOptions);
            }
            
            // Verificar por erros HTTP
            if (!response.ok) {
                const errorData = await response.json().catch(() => {
                    return { message: `Erro HTTP: ${response.status} ${response.statusText}` };
                });
                
                throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
            }
            
            // Verificar se há conteúdo na resposta
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else if (response.status === 204) { // No Content
                return { success: true };
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            
            // Verificar se é um erro de CORS
            const isCORSError = error.message && (
                error.message.includes('CORS') || 
                error.message.includes('cross-origin') || 
                error.message.includes('networkerror') ||
                error.message.includes('NetworkError')
            );
            
            if (isCORSError) {
                this.state.corsErrorCount++;
                console.warn(`Erro de CORS detectado (#${this.state.corsErrorCount}). Tentando alternativa...`);
                
                // Tente uma abordagem alternativa para contornar CORS
                if (this.state.corsErrorCount <= this.state.maxCorsRetries) {
                    // Tente com um proxy CORS
                    this.state.usarProxy = true;
                    
                    console.log(`Tentativa ${this.state.corsErrorCount}/${this.state.maxCorsRetries}: Usando proxy CORS`);
                    return this.fetchApi(endpoint, options);
                } else {
                    // Se já tentamos com proxy e falhou, use o módulo de bypass mais avançado
                    console.log(`Tentativas com proxy esgotadas. Usando CORSBypassModule...`);
                    
                    try {
                        const bypassUrl = this.state.apiUrl + '/' + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
                        
                        // Tentar com fetchWithCORS
                        const response = await CORSBypassModule.fetchWithCORS(bypassUrl, options);
                        
                        if (!response.ok) {
                            throw new Error(`Erro HTTP: ${response.status}`);
                        }
                        
                        // Verificar se há conteúdo na resposta
                        const contentType = response.headers.get('content-type');
                        if (contentType && contentType.includes('application/json')) {
                            return await response.json();
                        } else if (response.status === 204) { // No Content
                            return { success: true };
                        } else {
                            return await response.text();
                        }
                    } catch (bypassError) {
                        console.error("Erro ao usar CORSBypassModule:", bypassError);
                        
                        // Se falhar com fetchWithCORS, tente com iframe como último recurso
                        try {
                            console.log("Tentando com iframe como último recurso...");
                            const bypassUrl = this.state.apiUrl + '/' + (endpoint.startsWith('/') ? endpoint.substring(1) : endpoint);
                            
                            return await CORSBypassModule.requestViaIframe(
                                bypassUrl, 
                                options.method || 'GET', 
                                options.body ? JSON.parse(options.body) : null
                            );
                        } catch (iframeError) {
                            console.error("Todas as tentativas de contornar CORS falharam:", iframeError);
                            
                            // Se a opção catchError for true, retornar o erro como objeto
                            if (options.catchError) {
                                return { 
                                    error: true, 
                                    message: "Não foi possível acessar o servidor devido a restrições de segurança (CORS). Todas as alternativas falharam." 
                                };
                            }
                            
                            // Caso contrário, propagar o erro
                            throw new Error("Falha em todas as tentativas de contornar CORS. Servidor inacessível.");
                        }
                    }
                }
            }
            
            // Se temos a opção de capturar o erro e a requisição falhou sem proxy, tentar com proxy
            if (!this.state.usarProxy && !options.catchError && !isCORSError) {
                console.log(`Tentando novamente com proxy para outros erros: ${endpoint}`);
                this.state.usarProxy = true;
                
                // Tentar novamente com proxy
                return this.fetchApi(endpoint, { ...options, catchError: true });
            }
            
            // Se a opção catchError for true, retornar o erro como objeto
            if (options.catchError) {
                return { error: true, message: error.message };
            }
            
            // Caso contrário, propagar o erro
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
