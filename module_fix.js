// Arquivo para corrigir o carregamento de módulos
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se os scripts de módulo estão carregados corretamente
    const scripts = document.querySelectorAll('script');
    let moduleScriptFound = false;
    
    scripts.forEach(script => {
        if (script.type === 'module') {
            moduleScriptFound = true;
            console.log('Script de módulo encontrado:', script.src);
        }
    });
    
    if (!moduleScriptFound) {
        console.log('Nenhum script de módulo encontrado. Adicionando script de app.js como módulo...');
        
        // Remover scripts existentes de app.js que não sejam módulos
        scripts.forEach(script => {
            if (script.src.includes('app.js') && script.type !== 'module') {
                script.remove();
                console.log('Script não-módulo de app.js removido');
            }
        });
        
        // Adicionar script de app.js como módulo
        const appScript = document.createElement('script');
        appScript.type = 'module';
        appScript.src = 'js/app.js';
        document.body.appendChild(appScript);
        console.log('Script de app.js adicionado como módulo');
    }
    
    // Adicionar event listeners para os links do menu
    const menuLinks = {
        'dashboard-link': document.querySelector('a[href="#"][data-section="dashboard"]'),
        'turmas-link': document.querySelector('a[href="#"][data-section="turmas"]'),
        'disciplinas-link': document.querySelector('a[href="#"][data-section="disciplinas"]'),
        'professores-link': document.querySelector('a[href="#"][data-section="professores"]'),
        'alunos-link': document.querySelector('a[href="#"][data-section="alunos"]'),
        'notas-link': document.querySelector('a[href="#"][data-section="notas"]')
    };
    
    // Função para ativar seção
    window.ativarSecao = function(linkId) {
        console.log("Ativando seção para o link:", linkId);
        
        // Mapear link para nome da seção
        const sectionMap = {
            'dashboard-link': 'dashboard',
            'turmas-link': 'turmas',
            'disciplinas-link': 'disciplinas',
            'professores-link': 'professores',
            'alunos-link': 'alunos',
            'notas-link': 'notas'
        };
        
        const sectionName = sectionMap[linkId];
        
        // Desativar todos os links e conteúdos
        Object.keys(menuLinks).forEach(key => {
            if (menuLinks[key]) {
                menuLinks[key].classList.remove('active');
            }
            
            const contentId = `conteudo-${sectionMap[key]}`;
            const contentElement = document.getElementById(contentId);
            if (contentElement) {
                contentElement.classList.add('d-none');
            }
        });
        
        // Ativar link e conteúdo selecionados
        if (menuLinks[linkId]) {
            menuLinks[linkId].classList.add('active');
        }
        
        const contentId = `conteudo-${sectionName}`;
        const contentElement = document.getElementById(contentId);
        if (contentElement) {
            contentElement.classList.remove('d-none');
            console.log(`Seção ${sectionName} ativada`);
        } else {
            console.error(`Elemento de conteúdo não encontrado: ${contentId}`);
        }
    };
    
    // Adicionar event listeners para os links do menu
    Object.keys(menuLinks).forEach(key => {
        if (menuLinks[key]) {
            menuLinks[key].addEventListener('click', function(e) {
                e.preventDefault();
                window.ativarSecao(key);
            });
            console.log(`Event listener adicionado para ${key}`);
        } else {
            console.warn(`Link não encontrado: ${key}`);
        }
    });
    
    // Ativar seção inicial (dashboard)
    window.ativarSecao('dashboard-link');
});
