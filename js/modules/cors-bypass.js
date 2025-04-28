/**
 * Módulo para contornar restrições de CORS
 * Fornece alternativas para fazer requisições cross-origin quando o servidor não suporta CORS
 */

const CORSBypassModule = {
    // Lista de serviços proxy CORS públicos que podem ser usados
    proxyServices: [
        'https://cors-anywhere.herokuapp.com/',
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url='
    ],
    
    // Índice do proxy atual
    currentProxyIndex: 0,
    
    // Obter próximo proxy da lista (alterna entre os disponíveis para balancear uso)
    getNextProxy: function() {
        const proxy = this.proxyServices[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyServices.length;
        return proxy;
    },
    
    // Proxy uma URL através de um serviço de proxy CORS
    proxyURL: function(url) {
        return `${this.getNextProxy()}${encodeURIComponent(url)}`;
    },
    
    // Função para fazer requisições contornando CORS, usando fetch com proxy
    fetchWithCORS: async function(url, options = {}) {
        try {
            // Tentar primeiro diretamente (pode funcionar se o servidor permitir CORS)
            return await fetch(url, options);
        } catch (error) {
            console.warn("Erro na requisição direta, tentando com proxy CORS:", error);
            
            // Se falhou, tentar com um proxy CORS
            const proxiedUrl = this.proxyURL(url);
            
            // Adicionar headers necessários para alguns proxies
            const proxyOptions = {
                ...options,
                headers: {
                    ...options.headers || {},
                    'X-Requested-With': 'XMLHttpRequest',
                    'Origin': window.location.origin
                }
            };
            
            return fetch(proxiedUrl, proxyOptions);
        }
    },
    
    // Função para carregar recursos usando JSONP (alternativa útil quando fetch falha devido ao CORS)
    loadWithJSONP: function(url, callback) {
        return new Promise((resolve, reject) => {
            // Criar um ID único para a função callback
            const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
            
            // Criar elemento script
            const script = document.createElement('script');
            
            // Configurar timeout
            let timeoutTrigger = window.setTimeout(() => {
                window[callbackName] = () => {};
                reject(new Error('JSONP request timed out'));
                document.body.removeChild(script);
            }, 10000);
            
            // Configurar função callback global
            window[callbackName] = (data) => {
                window.clearTimeout(timeoutTrigger);
                resolve(data);
                
                // Limpar
                document.body.removeChild(script);
                delete window[callbackName];
            };
            
            // Adicionar parâmetro callback à URL
            const urlWithCallback = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
            
            // Configurar script e adicionar ao DOM
            script.src = urlWithCallback;
            script.async = true;
            script.onerror = () => {
                window.clearTimeout(timeoutTrigger);
                reject(new Error('JSONP request failed'));
                delete window[callbackName];
                document.body.removeChild(script);
            };
            
            document.body.appendChild(script);
        });
    },
    
    // Implementação alternativa usando iframe
    requestViaIframe: function(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            // Criar iframe oculto
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // ID único para a comunicação
            const requestId = 'request_' + Math.round(100000 * Math.random());
            
            // Configurar listener para mensagens do iframe
            const messageListener = function(event) {
                if (event.data && event.data.requestId === requestId) {
                    window.removeEventListener('message', messageListener);
                    document.body.removeChild(iframe);
                    
                    if (event.data.error) {
                        reject(new Error(event.data.error));
                    } else {
                        resolve(event.data.response);
                    }
                }
            };
            
            window.addEventListener('message', messageListener);
            
            // Criar HTML com script para executar a requisição no contexto do iframe
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <script>
                        // Executar requisição
                        async function executeRequest() {
                            try {
                                const response = await fetch('${url}', {
                                    method: '${method}',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: ${data ? JSON.stringify(data) : 'null'}
                                });
                                
                                let responseData;
                                try {
                                    responseData = await response.json();
                                } catch (e) {
                                    responseData = await response.text();
                                }
                                
                                window.parent.postMessage({
                                    requestId: '${requestId}',
                                    response: responseData
                                }, '*');
                            } catch (error) {
                                window.parent.postMessage({
                                    requestId: '${requestId}',
                                    error: error.message
                                }, '*');
                            }
                        }
                        
                        // Executar quando carregar
                        window.onload = executeRequest;
                    </script>
                </head>
                <body>
                    <p>Executando requisição...</p>
                </body>
                </html>
            `;
            
            // Carregar HTML no iframe
            const blob = new Blob([html], { type: 'text/html' });
            iframe.src = URL.createObjectURL(blob);
        });
    }
};

export default CORSBypassModule; 