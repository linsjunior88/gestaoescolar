/**
 * Configurações da aplicação
 * Este arquivo contém as configurações da aplicação,
 * incluindo URLs da API para diferentes ambientes.
 */

const CONFIG = {
    // Detectar ambiente de produção
    isProd: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    
    // URLs da API
    apiUrl: function() {
        return this.isProd 
            ? 'https://gestao-escolar-api.onrender.com/api'  // URL de produção no Render
            : 'http://localhost:4000/api';                  // URL de desenvolvimento local
    },
    
    // Método para obter URL completa da API
    getApiUrl: function(endpoint) {
        return `${this.apiUrl()}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    }
};

// Exportar configuração para uso global
window.CONFIG = CONFIG; 