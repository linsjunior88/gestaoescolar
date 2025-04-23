/**
 * app.js
 * Arquivo principal para inicialização de todos os módulos do sistema escolar
 */

// Configurações globais do sistema
const CONFIG = {
    // URL base da API
    apiUrl: 'http://localhost:4000/api',
    
    // Função para obter a URL completa da API
    getApiUrl: function(endpoint) {
        // Remover barra no início do endpoint se existir
        if (endpoint.startsWith('/')) {
            endpoint = endpoint.substring(1);
        }
        
        return `${this.apiUrl}/${endpoint}`;
    },
    
    // Função para inicializar o sistema
    init: function() {
        // Implemente a inicialização do sistema
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando aplicação escola-dashboard (modularizada)");
    
    // Inicializar configurações e UI
    if (typeof CONFIG !== 'undefined') {
        CONFIG.init();
    }
    
    // Inicializar UI e sidebar
    if (typeof initSidebar === 'function') {
        initSidebar();
    }
    
    // Inicializar módulos conforme necessário
    
    // Módulo geral de estatísticas na dashboard
    if (typeof initGeral === 'function') {
        initGeral();
    }
    
    // Módulo de gráficos
    if (typeof initCharts === 'function') {
        initCharts();
    }
    
    // Módulos específicos
    
    // Turmas
    if (typeof initTurmas === 'function') {
        initTurmas();
    }
    
    // Disciplinas
    if (typeof initDisciplinas === 'function') {
        initDisciplinas();
    }
    
    // Professores
    if (typeof initProfessores === 'function') {
        initProfessores();
    }
    
    // Alunos
    if (typeof initAlunos === 'function') {
        initAlunos();
    }
    
    // Notas
    if (typeof initNotas === 'function') {
        initNotas();
    }
    
    // Ativar seção inicial e configurar navegação
    if (typeof ativarSecao === 'function') {
        // Verificar URL para ativar a seção correspondente
        const hash = window.location.hash.substring(1);
        if (hash) {
            ativarSecao(hash);
        } else {
            // Seção padrão
            ativarSecao('dashboard');
        }
        
        // Configurar navegação por hash
        window.addEventListener('hashchange', function() {
            const novoHash = window.location.hash.substring(1);
            ativarSecao(novoHash);
        });
    }
    
    console.log("Inicialização da aplicação concluída!");
});

/**
 * Inicializa todos os módulos do sistema
 */
function initModulos() {
    // Inicializar a sidebar e funcionalidades básicas
    if (typeof initSidebar === 'function') {
        initSidebar();
    }
    
    // Módulo de turmas
    if (typeof initTurmas === 'function') {
        initTurmas();
    } else {
        console.warn('Módulo de turmas não encontrado!');
    }
    
    // Módulo de disciplinas
    if (typeof initDisciplinas === 'function') {
        initDisciplinas();
    } else {
        console.warn('Módulo de disciplinas não encontrado!');
    }
    
    // Módulo de professores
    if (typeof initProfessores === 'function') {
        initProfessores();
    }
    
    // Módulo de alunos
    if (typeof initAlunos === 'function') {
        initAlunos();
    }
    
    // Módulo de notas
    if (typeof initNotas === 'function') {
        initNotas();
    }
    
    // Dashboard e indicadores
    if (typeof initGeral === 'function') {
        initGeral();
    }
}

/**
 * Inicializa a navegação entre as seções
 */
function initNavegacao() {
    // Gerenciar links do menu lateral
    const menuLinks = document.querySelectorAll('[data-section]');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obter o ID da seção a ser ativada
            const sectionId = this.getAttribute('data-section');
            
            // Ativar a seção
            ativarSecao(sectionId);
        });
    });
    
    // Ativar a primeira seção por padrão (dashboard)
    ativarSecao('dashboard');
}

/**
 * Ativa uma seção específica da aplicação
 * @param {string} sectionId ID da seção a ser ativada
 */
function ativarSecao(sectionId) {
    console.log(`Ativando seção: ${sectionId}`);
    
    // Esconder todas as seções
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar a seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.error(`Seção não encontrada: ${sectionId}`);
    }
    
    // Atualizar links ativos no menu
    const menuLinks = document.querySelectorAll('[data-section]');
    menuLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Atualizar histórico do navegador e título da página
    const pageTitle = document.querySelector(`[data-section="${sectionId}"]`)?.textContent || 'Gestão Escolar';
    document.title = pageTitle;
    history.pushState({section: sectionId}, pageTitle, `#${sectionId}`);
    
    // Fechar o menu em dispositivos móveis
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.remove('active');
    }
} 