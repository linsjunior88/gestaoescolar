// Script para corrigir problemas de URL da API
(function() {
    // Definir a URL da API
    window.API_URL = 'https://apinazarerodrigues.86dynamics.com.br/api';
    
    // Verificar status da API
    fetch('https://apinazarerodrigues.86dynamics.com.br/health')
        .then(response => {
            if (response.ok) {
                console.log('API está online:', window.API_URL);
            } else {
                console.error('API está online, mas retornou status:', response.status);
            }
        })
        .catch(error => {
            console.error('API não pôde ser contatada:', error);
        });
    
    // Se o objeto CONFIG não existir, crie-o
    if (!window.CONFIG) {
        window.CONFIG = {
            getApiUrl: function(endpoint) {
                if (endpoint.startsWith('/')) {
                    return window.API_URL + endpoint;
                }
                return window.API_URL + '/' + endpoint;
            }
        };
    }
    
    console.log('URL da API corrigida para:', window.API_URL);
})();
