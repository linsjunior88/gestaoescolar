// Arquivo para corrigir a URL da API no frontend
document.addEventListener('DOMContentLoaded', function()  {
    // Sobrescrever a URL da API para apontar para o serviço no Render
    window.API_URL = 'https://gestao-escolar-api.onrender.com';
    console.log('URL da API configurada para:', window.API_URL) ;
    
    // Verificar conexão com a API
    fetch(window.API_URL + '/status')
        .then(response => response.json())
        .then(data => {
            console.log('Conexão com a API bem-sucedida:', data);
        })
        .catch(error => {
            console.error('Erro ao conectar com a API:', error);
        });
});
