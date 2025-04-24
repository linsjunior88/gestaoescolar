// Arquivo para corrigir a navegação do menu
document.addEventListener('DOMContentLoaded', function() {
    console.log('Menu fix carregado');
    
    // Função para mostrar uma seção e esconder as outras
    function mostrarSecao(secaoId) {
        console.log('Tentando mostrar seção:', secaoId);
        
        // Lista de todas as seções possíveis
        const secoes = ['dashboard', 'turmas', 'disciplinas', 'professores', 'alunos', 'notas'];
        
        // Esconder todas as seções
        secoes.forEach(secao => {
            const elemento = document.getElementById('conteudo-' + secao);
            if (elemento) {
                elemento.style.display = 'none';
                console.log('Escondendo seção:', secao);
            } else {
                console.warn('Elemento não encontrado para seção:', secao);
            }
        });
        
        // Mostrar a seção selecionada
        const secaoAtiva = document.getElementById('conteudo-' + secaoId);
        if (secaoAtiva) {
            secaoAtiva.style.display = 'block';
            console.log('Mostrando seção:', secaoId);
        } else {
            console.error('Elemento não encontrado para seção ativa:', secaoId);
        }
    }
    
    // Adicionar event listeners para os links do menu
    const menuLinks = document.querySelectorAll('.navbar-nav .nav-link');
    console.log('Links do menu encontrados:', menuLinks.length);
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe 'active' de todos os links
            menuLinks.forEach(l => l.classList.remove('active'));
            
            // Adicionar classe 'active' ao link clicado
            this.classList.add('active');
            
            // Determinar qual seção mostrar com base no texto ou atributo do link
            let secaoId;
            
            // Tentar obter do atributo data-section
            if (this.getAttribute('data-section')) {
                secaoId = this.getAttribute('data-section');
            } 
            // Tentar obter do texto do link
            else {
                const texto = this.textContent.trim().toLowerCase();
                if (texto === 'dashboard' || texto.includes('painel')) {
                    secaoId = 'dashboard';
                } else if (texto === 'turmas' || texto.includes('turma')) {
                    secaoId = 'turmas';
                } else if (texto === 'disciplinas' || texto.includes('disciplina')) {
                    secaoId = 'disciplinas';
                } else if (texto === 'professores' || texto.includes('professor')) {
                    secaoId = 'professores';
                } else if (texto === 'alunos' || texto.includes('aluno')) {
                    secaoId = 'alunos';
                } else if (texto === 'notas' || texto.includes('nota')) {
                    secaoId = 'notas';
                }
            }
            
            console.log('Link clicado para seção:', secaoId);
            
            if (secaoId) {
                mostrarSecao(secaoId);
                
                // Tentar carregar o módulo correspondente
                try {
                    if (window.ModuloManager && typeof window.ModuloManager.carregarModulo === 'function') {
                        window.ModuloManager.carregarModulo(secaoId);
                        console.log('Módulo carregado via ModuloManager:', secaoId);
                    } else {
                        console.warn('ModuloManager não disponível para carregar módulo:', secaoId);
                    }
                } catch (error) {
                    console.error('Erro ao carregar módulo:', error);
                }
            }
        });
        
        console.log('Event listener adicionado para:', link.textContent.trim());
    });
    
    // Verificar se o app.js está carregado como módulo
    const scripts = document.querySelectorAll('script');
    let appScriptFound = false;
    let appScriptIsModule = false;
    
    scripts.forEach(script => {
        if (script.src.includes('app.js')) {
            appScriptFound = true;
            if (script.type === 'module') {
                appScriptIsModule = true;
            }
        }
    });
    
    console.log('app.js encontrado:', appScriptFound, 'é módulo:', appScriptIsModule);
    
    if (appScriptFound && !appScriptIsModule) {
        console.warn('app.js não está carregado como módulo. Isso pode causar problemas com importações.');
        
        // Adicionar uma versão do app.js como módulo
        const appScript = document.createElement('script');
        appScript.type = 'module';
        appScript.src = 'js/app.js';
        document.body.appendChild(appScript);
        console.log('Versão de módulo do app.js adicionada');
    }
    
    // Mostrar a seção dashboard por padrão
    mostrarSecao('dashboard');
    
    // Ativar o link do dashboard por padrão
    const dashboardLink = document.querySelector('.navbar-nav .nav-link[data-section="dashboard"], .navbar-nav .nav-link:contains("Dashboard")');
    if (dashboardLink) {
        dashboardLink.classList.add('active');
    }
});
