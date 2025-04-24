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
            carregarDadosDashboard();
        })
        .catch(error => {
            console.error('Erro ao conectar com a API:', error);
        });
    
    // Função para carregar dados do dashboard
    function carregarDadosDashboard() {
        // Carregar resumo do dashboard
        fetch(window.API_URL + '/dashboard/resumo')
            .then(response => response.json())
            .then(data => {
                console.log('Dados do dashboard carregados:', data);
                
                // Atualizar os contadores no dashboard
                if (data.total_alunos !== undefined) {
                    document.getElementById('total-alunos').textContent = data.total_alunos;
                }
                if (data.total_turmas !== undefined) {
                    document.getElementById('total-turmas').textContent = data.total_turmas;
                }
                if (data.total_professores !== undefined) {
                    document.getElementById('total-professores').textContent = data.total_professores;
                }
                if (data.total_disciplinas !== undefined) {
                    document.getElementById('total-disciplinas').textContent = data.total_disciplinas;
                }
                
                // Se o endpoint de resumo não retornar todos os dados necessários,
                // podemos usar a abordagem alternativa de carregar cada tipo de dado separadamente
                if (!data.total_alunos || !data.total_turmas || !data.total_professores || !data.total_disciplinas) {
                    carregarDadosSeparadamente();
                }
            })
            .catch(error => {
                console.error('Erro ao carregar dados do dashboard:', error);
                // Em caso de erro, tentar a abordagem alternativa
                carregarDadosSeparadamente();
            });
    }
    
    // Função alternativa para carregar dados separadamente
    function carregarDadosSeparadamente() {
        console.log('Carregando dados separadamente...');
        
        // Carregar turmas
        fetch(window.API_URL + '/turmas')
            .then(response => response.json())
            .then(data => {
                console.log('Turmas carregadas:', data);
                document.getElementById('total-turmas').textContent = data.length;
            })
            .catch(error => {
                console.error('Erro ao carregar turmas:', error);
            });
        
        // Carregar disciplinas
        fetch(window.API_URL + '/disciplinas')
            .then(response => response.json())
            .then(data => {
                console.log('Disciplinas carregadas:', data);
                document.getElementById('total-disciplinas').textContent = data.length;
            })
            .catch(error => {
                console.error('Erro ao carregar disciplinas:', error);
            });
        
        // Carregar professores
        fetch(window.API_URL + '/professores')
            .then(response => response.json())
            .then(data => {
                console.log('Professores carregados:', data);
                document.getElementById('total-professores').textContent = data.length;
            })
            .catch(error => {
                console.error('Erro ao carregar professores:', error);
            });
        
        // Carregar alunos
        fetch(window.API_URL + '/alunos')
            .then(response => response.json())
            .then(data => {
                console.log('Alunos carregados:', data);
                document.getElementById('total-alunos').textContent = data.length;
            })
            .catch(error => {
                console.error('Erro ao carregar alunos:', error);
            });
    }
});
