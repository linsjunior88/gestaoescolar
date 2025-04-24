/**
 * Módulo de configuração
 * Responsável por gerenciar as configurações da aplicação
 */

const ConfigModule = {
    // Estado do módulo
    state: {
        apiUrl: 'https://gestao-escolar-api.onrender.com/api', // URL da API COM o /api no final
        isLoading: false,
        error: null
    },
    
    // Inicializar módulo
    init: function()  {
        console.log("Módulo de configuração inicializado");
        this.verificarStatusApi();
    },
    
    // Verificar status da API
    verificarStatusApi: function() {
        this.state.isLoading = true;
        
        // Aqui usamos a URL base sem o /api porque o endpoint /health está na raiz
        fetch('https://gestao-escolar-api.onrender.com/health') 
            .then(response => response.json())
            .then(data => {
                console.log("Status da API:", data);
                this.state.isLoading = false;
            })
            .catch(error => {
                console.error("Erro ao verificar status da API:", error);
                this.state.error = error;
                this.state.isLoading = false;
            });
    },
    
    // Obter URL da API
    getApiUrl: function() {
        return this.state.apiUrl;
    }
};

export default ConfigModule;
