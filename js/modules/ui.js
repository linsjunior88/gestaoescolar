/**
 * ui.js
 * Gerencia a interface do usuário, incluindo a barra lateral, 
 * navegação entre seções e outros elementos da UI.
 */

// Função para inicializar os links do menu
function initLinks() {
    console.log("Inicializando links do menu");
    
    // Mapear os links do menu para seus respectivos conteúdos
    links = {
        'dashboard-link': document.getElementById('dashboard-link'),
        'turmas-link': document.getElementById('turmas-link'),
        'disciplinas-link': document.getElementById('disciplinas-link'),
        'professores-link': document.getElementById('professores-link'),
        'alunos-link': document.getElementById('alunos-link'),
        'notas-link': document.getElementById('notas-link')
    };
    
    conteudos = {
        'dashboard-link': document.getElementById('conteudo-dashboard'),
        'turmas-link': document.getElementById('conteudo-turmas'),
        'disciplinas-link': document.getElementById('conteudo-disciplinas'),
        'professores-link': document.getElementById('conteudo-professores'),
        'alunos-link': document.getElementById('conteudo-alunos'),
        'notas-link': document.getElementById('conteudo-notas')
    };
    
    // Adicionar eventos de clique para alternar entre as seções
    for (const key in links) {
        if (links[key]) {
            links[key].addEventListener('click', function(e) {
                e.preventDefault();
                ativarSecao(key);
            });
        }
    }
}

// Função para ativar a seção selecionada
function ativarSecao(linkId) {
    console.log("Ativando seção para o link:", linkId);
    
    // Remover classe ativa de todos os links
    for (const key in links) {
        if (links[key]) {
            links[key].classList.remove('active');
        }
    }
    
    // Adicionar classe ativa ao link clicado
    if (links[linkId]) {
        links[linkId].classList.add('active');
    }
    
    // Ocultar todos os conteúdos
    for (const key in conteudos) {
        if (conteudos[key]) {
            conteudos[key].classList.remove('active');
        }
    }
    
    // Mostrar o conteúdo correspondente
    if (conteudos[linkId]) {
        conteudos[linkId].classList.add('active');
    }
    
    // Atualizar dados específicos com base na seção ativa
    switch(linkId) {
        case 'dashboard-link':
            console.log("Atualizando dashboard");
            if (typeof initGeral === 'function') initGeral();
            break;
        case 'turmas-link':
            console.log("Atualizando turmas");
            if (typeof carregarTurmas === 'function') {
                carregarTurmas();
            } else {
                atualizarTabelaTurmas();
            }
            break;
        case 'disciplinas-link':
            console.log("Atualizando disciplinas");
            if (typeof carregarDisciplinas === 'function') {
                carregarDisciplinas();
            } else {
                atualizarTabelaDisciplinas();
            }
            break;
        case 'professores-link':
            console.log("Atualizando professores");
            if (typeof carregarProfessores === 'function') {
                carregarProfessores();
            } else {
                atualizarTabelaProfessores();
            }
            break;
        case 'alunos-link':
            console.log("Atualizando alunos");
            if (typeof carregarAlunos === 'function') {
                carregarAlunos();
            } else {
                atualizarTabelaAlunos();
            }
            break;
        case 'notas-link':
            console.log("Atualizando notas");
            if (typeof carregarNotas === 'function') {
                carregarNotas();
            } else {
                atualizarTabelaNotas();
            }
            break;
    }
}

// Função para atualizar tabela de turmas (fallback)
function atualizarTabelaTurmas() {
    const turmasTableBody = document.getElementById('turmas-lista');
    if (turmasTableBody) {
        // Mostrar indicador de carregamento
        turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
        
        // Fazer requisição à API
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => response.ok ? response.json() : [])
            .then(data => {
                if (!data || data.length === 0) {
                    turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma turma encontrada.</td></tr>';
                    return;
                }
                
                // Atualizar a tabela
                turmasTableBody.innerHTML = '';
                data.forEach(turma => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${turma.id_turma}</td>
                        <td>${turma.serie || '-'}</td>
                        <td>${turma.turno ? (typeof turno2texto === 'function' ? turno2texto(turma.turno) : turma.turno) : '-'}</td>
                        <td>${turma.tipo_turma || 'Regular'}</td>
                        <td>${turma.coordenador || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary edit-turma" data-id="${turma.id_turma}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-turma" data-id="${turma.id_turma}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    turmasTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas:", error);
                turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar turmas.</td></tr>';
            });
    }
}

// Funções de fallback similares para outras tabelas (implementação básica)
function atualizarTabelaDisciplinas() {
    console.log("Carregando disciplinas (função de fallback)");
    const element = document.getElementById('disciplinas-lista');
    if (element) element.innerHTML = '<tr><td colspan="5" class="text-center">Carregando disciplinas...</td></tr>';
    // Implementação completa seria similar à atualizarTabelaTurmas
}

function atualizarTabelaProfessores() {
    console.log("Carregando professores (função de fallback)");
    const element = document.getElementById('professores-lista');
    if (element) element.innerHTML = '<tr><td colspan="5" class="text-center">Carregando professores...</td></tr>';
    // Implementação completa seria similar à atualizarTabelaTurmas
}

function atualizarTabelaAlunos() {
    console.log("Carregando alunos (função de fallback)");
    const element = document.getElementById('alunos-lista');
    if (element) element.innerHTML = '<tr><td colspan="6" class="text-center">Carregando alunos...</td></tr>';
    // Implementação completa seria similar à atualizarTabelaTurmas
}

function atualizarTabelaNotas() {
    console.log("Carregando notas (função de fallback)");
    const element = document.getElementById('notas-lista');
    if (element) element.innerHTML = '<tr><td colspan="7" class="text-center">Carregando notas...</td></tr>';
    // Implementação completa seria similar à atualizarTabelaTurmas
}

// Função para inicializar a barra lateral
function initSidebar() {
    console.log("Inicializando barra lateral");
    
    // Adicionar evento ao botão de toggle do menu
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleMenu);
    }
    
    // Restaurar estado da barra lateral
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const body = document.querySelector('body');
    
    if (sidebarCollapsed) {
        body.classList.add('sidebar-collapsed');
    } else {
        body.classList.remove('sidebar-collapsed');
    }
}

// Função para alternar o estado da barra lateral
function toggleMenu() {
    const body = document.querySelector('body');
    const isCollapsed = body.classList.contains('sidebar-collapsed');
    
    if (isCollapsed) {
        body.classList.remove('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
    } else {
        body.classList.add('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
    }
}

// Exportar funções para o escopo global
window.initLinks = initLinks;
window.ativarSecao = ativarSecao;
window.initSidebar = initSidebar; 