// Arquivo para corrigir a URL da API no frontend
document.addEventListener('DOMContentLoaded', function() {
    // Sobrescrever a URL da API para apontar para o serviço no Render
    window.API_URL = 'https://gestao-escolar-api.onrender.com/api';
    console.log('URL da API configurada para:', window.API_URL) ;
    
    // Verificar conexão com a API usando o endpoint /health
    fetch('https://gestao-escolar-api.onrender.com/health') 
        .then(response => response.json())
        .then(data => {
            console.log('Conexão com a API bem-sucedida:', data);
            
            // Se a conexão com a API for bem-sucedida, vamos tentar carregar os dados
            carregarDados();
        })
        .catch(error => {
            console.error('Erro ao conectar com a API:', error);
        });
    
    // Função para carregar dados da API
    function carregarDados() {
        // Carregar estatísticas
        fetch(window.API_URL + '/estatisticas')
            .then(response => response.json())
            .then(data => {
                console.log('Estatísticas carregadas:', data);
                
                // Atualizar os contadores no dashboard
                if (data.totalAlunos !== undefined) {
                    document.getElementById('total-alunos').textContent = data.totalAlunos;
                }
                if (data.totalTurmas !== undefined) {
                    document.getElementById('total-turmas').textContent = data.totalTurmas;
                }
                if (data.totalProfessores !== undefined) {
                    document.getElementById('total-professores').textContent = data.totalProfessores;
                }
                if (data.totalDisciplinas !== undefined) {
                    document.getElementById('total-disciplinas').textContent = data.totalDisciplinas;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar estatísticas:', error);
            });
    }
});
