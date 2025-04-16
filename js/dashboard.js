// Variáveis globais
let links = {};
let conteudos = {};
// Variáveis globais para o módulo de notas
let formNota, formModoNota, notaIndex, anoNota, bimestreSelect, turmaNota, disciplinaNota, 
    alunoNota, notaMensal, notaBimestral, notaRecuperacao, mediaFinal, btnSalvarNota, 
    btnNovoLancamento, btnCancelarNota, notasLista, filtroTurma, filtroDisciplina, 
    filtroAluno, filtroBimestre, filtroAno, btnFiltrar, btnCalcularMedias;
// Variável global para armazenar as notas filtradas
let notasFiltradas = [];

// Função para inicializar os links do menu
function initLinks() {
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
        
        // Inicializar o dashboard se a seção ativada for o dashboard
        if (linkId === 'dashboard-link') {
            console.log("Inicializando dashboard geral porque a seção foi ativada");
            initGeral();
        } else if (linkId === 'turmas-link') {
            // Recarregar turmas ao entrar na seção
            carregarTurmas();
        } else if (linkId === 'disciplinas-link') {
            // Recarregar disciplinas ao entrar na seção
            carregarDisciplinas();
        } else if (linkId === 'professores-link') {
            // Recarregar professores ao entrar na seção
            carregarProfessores();
        } else if (linkId === 'alunos-link') {
            // Recarregar alunos ao entrar na seção
            carregarAlunos();
        } else if (linkId === 'notas-link') {
            // Recarregar notas ao entrar na seção
            carregarNotas();
        }
    }
}

// Função para inicializar o menu lateral retrátil
function initSidebar() {
    const sidebar = document.getElementById('sidebarMenu');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const toggleSidebarDesktop = document.getElementById('toggleSidebarDesktop');
    const sidebarIcon = document.getElementById('sidebarIcon');
    const mainContent = document.getElementById('mainContent');
    
    // Função para alternar o estado do menu
    function toggleMenu() {
        sidebar.classList.toggle('collapsed');
        
        // Alterna o ícone do botão
        if (sidebar.classList.contains('collapsed')) {
            sidebarIcon.classList.remove('fa-angle-left');
            sidebarIcon.classList.add('fa-angle-right');
        } else {
            sidebarIcon.classList.remove('fa-angle-right');
            sidebarIcon.classList.add('fa-angle-left');
        }
    }
    
    // Evento para o botão em dispositivos móveis
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }
    
    // Evento para o botão em desktop
    if (toggleSidebarDesktop) {
        toggleSidebarDesktop.addEventListener('click', toggleMenu);
    }
    
    // Em dispositivos móveis, esconder o menu quando clicar fora dele
    document.addEventListener('click', function(event) {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnToggle = toggleSidebar && toggleSidebar.contains(event.target);
        
        if (window.innerWidth < 768 && !isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
    
    // Verificar estado salvo do menu (se estava recolhido ou expandido)
    const sidebarState = localStorage.getItem('sidebarCollapsed');
    if (sidebarState === 'true') {
        toggleMenu();
    }
    
    // Salvar o estado do menu
    function saveSidebarState() {
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }
    
    // Adicionar evento para salvar estado
    if (toggleSidebarDesktop) {
        toggleSidebarDesktop.addEventListener('click', saveSidebarState);
    }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando dashboard administrativo");
    
    // Verificar se o usuário está autenticado como administrador
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile !== 'admin') {
        // Redirecionar para a página de login se não estiver autenticado como administrador
        alert('Você precisa fazer login como administrador para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }
    
    // Inicializar componentes do dashboard
    initSidebar();
    initLinks();
    initCharts();
    
    // Inicializar módulos de gestão
    initTurmas();
    initDisciplinas();
    initProfessores();
    initAlunos();
    initNotas();
    
    // Inicializar o dashboard geral automaticamente na carga da página
    // já que é a seção padrão que é exibida ao abrir a página
    initGeral();
    
    // Inicializar botão para reiniciar dados
    document.getElementById('btn-reset-dados').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja reiniciar todos os dados? Isso irá limpar todas as informações e reiniciar com dados de exemplo.')) {
            localStorage.clear();
            alert('Dados reiniciados com sucesso! A página será recarregada.');
            window.location.reload();
        }
    });
    
    // Configurar função de logout global se ainda não existir
    if (typeof window.fazerLogout !== 'function') {
        window.fazerLogout = function() {
            console.log("Logout global acionado via window.fazerLogout (dashboard.js)");
            // Limpar sessão
            sessionStorage.clear();
            localStorage.removeItem('currentUser');
            // Redirecionar para a página inicial com parâmetro para evitar cache
            window.location.href = 'index.html?logout=' + new Date().getTime();
        };
    }
    
    // Configurar todos os botões de logout na página
    function configurarLogout() {
        // Botões de logout específicos
        const botoes = document.querySelectorAll('#btn-logout, #sidebar-logout');
        
        botoes.forEach(btn => {
            if (btn) {
                // Remover todos os eventos existentes
                const clonedBtn = btn.cloneNode(true);
                if (btn.parentNode) {
                    btn.parentNode.replaceChild(clonedBtn, btn);
                }
                
                // Adicionar novo evento de logout
                clonedBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Clique em botão de logout (${btn.id}) capturado por dashboard.js`);
                    window.fazerLogout();
                    return false;
                });
            }
        });
        
        // Event delegation para capturar cliques em qualquer botão de logout
        document.addEventListener('click', function(e) {
            const target = e.target;
            if (target.id === 'btn-logout' || target.closest('#btn-logout') || 
                target.id === 'sidebar-logout' || target.closest('#sidebar-logout')) {
                e.preventDefault();
                e.stopPropagation();
                console.log("Clique em botão de logout capturado globalmente por dashboard.js");
                window.fazerLogout();
                return false;
            }
        }, true);
        
        // Atalhos de teclado
        document.addEventListener('keydown', function(e) {
            // Alt+Q ou Ctrl+L para logout
            if ((e.altKey && e.key === 'q') || (e.ctrlKey && e.key === 'l')) {
                console.log("Atalho de teclado para logout: " + e.key);
                e.preventDefault();
                window.fazerLogout();
            }
            
            // ESC quando dropdown estiver aberto
            if (e.key === 'Escape' && document.querySelector('.dropdown-menu.show')) {
                console.log("ESC pressionado com dropdown aberto");
                window.fazerLogout();
            }
        });
    }
    
    // Chamar a configuração de logout quando o documento estiver pronto
    configurarLogout();
    
    // Verificar periodicamente se novos botões de logout foram adicionados
    setInterval(configurarLogout, 2000);
    
    // Ao final, após todos os módulos serem inicializados, exportar funções para o escopo global
    window.editarTurma = editarTurma;
    window.excluirTurma = excluirTurma;
    window.editarDisciplina = editarDisciplina;
    window.excluirDisciplina = excluirDisciplina;
    window.editarProfessor = editarProfessor;
    window.excluirProfessor = excluirProfessor;
    window.editarAluno = editarAluno;
    window.excluirAluno = excluirAluno;
    window.editarNota = editarNota;
    window.excluirNota = excluirNota;
});

// Função para inicializar os gráficos
function initCharts() {
    // Gráfico de barras - Desempenho por Turma
    const ctxBar = document.getElementById('graficoDesempenho');
    if (ctxBar) {
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['5º Ano A', '5º Ano B', '6º Ano A', '6º Ano B', '7º Ano A', '8º Ano A', '9º Ano A'],
                datasets: [{
                    label: 'Média de Desempenho',
                    data: [7.8, 6.9, 7.2, 8.1, 6.5, 7.4, 6.8],
                    backgroundColor: 'rgba(78, 115, 223, 0.5)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    // Gráfico de pizza - Distribuição por Série
    const ctxPie = document.getElementById('graficoPizza');
    if (ctxPie) {
        new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano'],
                datasets: [{
                    data: [125, 110, 98, 102, 88],
                    backgroundColor: [
                        'rgba(78, 115, 223, 0.7)',
                        'rgba(28, 200, 138, 0.7)',
                        'rgba(54, 185, 204, 0.7)',
                        'rgba(246, 194, 62, 0.7)',
                        'rgba(231, 74, 59, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false
            }
        });
    }
}

// Inicialização dos gráficos do dashboard
function inicializarGraficos() {
    console.log("Inicializando gráficos do dashboard");
    
    // Gráfico de desempenho
    const ctxDesempenho = document.getElementById('graficoDesempenho');
    if (ctxDesempenho) {
        new Chart(ctxDesempenho, {
            type: 'bar',
            data: {
                labels: ['5º Ano A', '5º Ano B', '6º Ano A', '6º Ano B', '7º Ano A', '7º Ano B'],
                datasets: [{
                    label: 'Média de Desempenho',
                    data: [7.8, 6.5, 8.2, 7.4, 6.9, 7.2],
                    backgroundColor: 'rgba(78, 115, 223, 0.8)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }
    
    // Gráfico de distribuição por série
    const ctxPizza = document.getElementById('graficoPizza');
    if (ctxPizza) {
        new Chart(ctxPizza, {
            type: 'pie',
            data: {
                labels: ['1º ao 5º Ano', '6º ao 9º Ano'],
                datasets: [{
                    data: [250, 273],
                    backgroundColor: ['#4e73df', '#1cc88a'],
                    hoverBackgroundColor: ['#2e59d9', '#17a673'],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Inicialização geral do dashboard
function initGeral() {
    console.log("Inicializando área geral do dashboard");
    
    // Atualizar os cards com dados reais do banco
    atualizarCardsTotalizadores();
    
    // Carregar logs de atividades recentes
    carregarLogsAtividades();
}

// Função para atualizar os cards com dados reais
function atualizarCardsTotalizadores() {
    console.log("Atualizando cards totalizadores...");
    
    // Buscar dados totalizadores da API
    fetch(CONFIG.getApiUrl('/dashboard/totalizadores'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar totalizadores: ' + response.statusText);
            }
            return response.json();
        })
        .then(dados => {
            console.log("Dados totalizadores:", dados);
            
            // Atualizar cada card
            const cards = {
                'total-alunos': { valor: dados.total_alunos || 0, texto: 'alunos' },
                'total-professores': { valor: dados.total_professores || 0, texto: 'professores' },
                'total-turmas': { valor: dados.total_turmas || 0, texto: 'turmas' },
                'total-disciplinas': { valor: dados.total_disciplinas || 0, texto: 'disciplinas' }
            };
            
            for (const [id, info] of Object.entries(cards)) {
                const cardElement = document.getElementById(id);
                if (cardElement) {
                    const valorElement = cardElement.querySelector('.card-value');
                    const textoElement = cardElement.querySelector('.card-text');
                    
                    if (valorElement) {
                        valorElement.textContent = info.valor;
                    }
                    
                    if (textoElement) {
                        textoElement.textContent = info.texto;
                    }
                }
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar cards totalizadores:", error);
            // Mostrar mensagem de erro nos cards
            const cards = ['total-alunos', 'total-professores', 'total-turmas', 'total-disciplinas'];
            cards.forEach(id => {
                const cardElement = document.getElementById(id);
                if (cardElement) {
                    cardElement.innerHTML = `
                        <div class="card-body">
                            <div class="card-value">-</div>
                            <div class="card-text text-danger">Erro ao carregar</div>
                        </div>
                    `;
                }
            });
        });
}

// Função para carregar logs de atividades
function carregarLogsAtividades() {
    console.log("Carregando logs de atividades...");
    
    // Verificar se o container existe
    const logsContainer = document.getElementById('logs-atividades-container');
    if (!logsContainer) {
        console.warn("Container de logs de atividades não encontrado");
        return;
    }
    
    // Mostrar indicador de carregamento
    logsContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-3">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <span class="ms-2">Carregando logs de atividades...</span>
        </div>
    `;
    
    // Buscar logs de atividades da API
    fetch(CONFIG.getApiUrl('/logs'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar logs: ' + response.statusText);
            }
            return response.json();
        })
        .then(logs => {
            console.log("Logs de atividades:", logs);
            
            if (logs.length === 0) {
                logsContainer.innerHTML = `
                    <div class="alert alert-info">
                        Não há logs de atividades registrados.
                    </div>
                `;
                return;
            }
            
            // Construir lista de logs
            let html = '<div class="list-group">';
            
            logs.forEach(log => {
                // Determinar a classe de cor com base no tipo de log
                let badgeClass = 'bg-secondary';
                switch (log.tipo) {
                    case 'info':
                        badgeClass = 'bg-info';
                        break;
                    case 'sucesso':
                        badgeClass = 'bg-success';
                        break;
                    case 'erro':
                        badgeClass = 'bg-danger';
                        break;
                    case 'alerta':
                        badgeClass = 'bg-warning';
                        break;
                }
                
                const data = new Date(log.data_hora);
                const dataFormatada = data.toLocaleDateString() + ' ' + data.toLocaleTimeString();
                
                html += `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between align-items-center">
                            <h6 class="mb-1">${log.usuario || 'Sistema'}</h6>
                            <small>${dataFormatada}</small>
                        </div>
                        <p class="mb-1">${log.mensagem}</p>
                        <div>
                            <span class="badge ${badgeClass}">${log.tipo || 'info'}</span>
                            ${log.entidade ? `<span class="badge bg-dark">${log.entidade}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            
            // Adicionar lista ao container
            logsContainer.innerHTML = html;
        })
        .catch(error => {
            console.error("Erro ao carregar logs de atividades:", error);
            logsContainer.innerHTML = `
                <div class="alert alert-danger">
                    Erro ao carregar logs de atividades: ${error.message}
                </div>
            `;
        });
}

// Função auxiliar para registrar atividades no log
function registrarAtividade(usuario, acao, entidade, entidadeId, detalhe = null, status = "concluído") {
    console.log(`Registrando atividade: ${acao} de ${entidade} - ${entidadeId}`);
    
    // Enviar para a API
    fetch(CONFIG.getApiUrl('/logs'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            usuario,
            acao,
            entidade,
            entidade_id: entidadeId,
            detalhe,
            status
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao registrar atividade: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log("Atividade registrada com sucesso:", data);
        
        // Verificar se o dashboard está ativo para atualizar a lista de atividades
        if (conteudos['dashboard-link'] && conteudos['dashboard-link'].classList.contains('active')) {
            console.log("Dashboard ativo, atualizando lista de atividades");
            setTimeout(carregarLogsAtividades, 500); // Pequeno delay para dar tempo ao servidor
        }
    })
    .catch(error => {
        console.error("Erro ao registrar atividade:", error);
    });
}

// Inicialização do módulo de turmas
function initTurmas() {
    console.log("Inicializando módulo de turmas");
    
    // Elementos do formulário
    const formTurma = document.getElementById('form-turma');
    const formModo = document.getElementById('form-modo');
    const turmaIndex = document.getElementById('turma-index');
    const idTurmaInput = document.getElementById('id_turma_input');
    const serie = document.getElementById('serie');
    const turno = document.getElementById('turno');
    const tipoTurma = document.getElementById('tipo_turma');
    const coordenador = document.getElementById('coordenador');
    const btnCancelarTurma = document.getElementById('btn-cancelar-turma');
    const btnNovaTurma = document.getElementById('btn-nova-turma');
    const turmasLista = document.getElementById('turmas-lista');
    
    // Carregar turmas do localStorage
    carregarTurmas();
    
    // Configurar botões do formulário
    if (btnNovaTurma) {
        btnNovaTurma.onclick = function() {
            resetarFormularioTurma();
            if (formTurma) formTurma.scrollIntoView({behavior: 'smooth'});
        };
    }
    
    if (btnCancelarTurma) {
        btnCancelarTurma.onclick = function() {
            resetarFormularioTurma();
        };
    }
    
    // Configurar formulário
    if (formTurma) {
        formTurma.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulário de turma submetido");
            
            // Validar campos obrigatórios
            if (!idTurmaInput.value || !serie.value || !turno.value) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Coletar dados do formulário
            const turma = {
                id_turma: idTurmaInput.value.trim(),
                serie: serie.value.trim(),
                turno: turno.value,
                tipo_turma: tipoTurma.value.trim(),
                coordenador: coordenador.value.trim()
            };
            
            console.log("Dados da turma:", turma);
            
            // Verificar o modo (novo ou edição)
            if (formModo.value === 'novo') {
                // Criar nova turma via API
                criarTurma(turma);
            } else {
                // Editar turma existente via API
                const turmaId = turma.id_turma;
                
                atualizarTurma(turmaId, turma);
            }
        });
    }
    
    // Função para carregar turmas
    function carregarTurmas() {
        const turmasTableBody = document.getElementById('turmas-table-body');
        
        if (!turmasTableBody) {
            return;
        }
        
        // Exibir spinner de carregamento
        turmasTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar turmas: ' + response.statusText);
                }
                return response.json();
            })
            .then(turmas => {
                if (turmas.length === 0) {
                    turmasTableBody.innerHTML = `
                        <tr>
                            <td colspan="3" class="text-center">Nenhuma turma encontrada</td>
                        </tr>
                    `;
                    return;
                }
                
                // Limpar tabela
                turmasTableBody.innerHTML = '';
                
                // Adicionar linhas
                turmas.forEach(turma => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${turma.id}</td>
                        <td>${turma.nome}</td>
                        <td>
                            <button class="btn btn-sm btn-primary editar-turma" data-id="${turma.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger excluir-turma" data-id="${turma.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    turmasTableBody.appendChild(row);
                });
                
                // Adicionar event listeners para os botões de editar
                document.querySelectorAll('.editar-turma').forEach(button => {
                    button.addEventListener('click', function() {
                        const turmaId = this.getAttribute('data-id');
                        const turma = turmas.find(t => t.id == turmaId);
                        
                        // Preencher o formulário de edição
                        document.getElementById('editar-turma-id').value = turma.id;
                        document.getElementById('editar-turma-nome').value = turma.nome;
                        
                        // Abrir o modal de edição
                        const editarTurmaModal = new bootstrap.Modal(document.getElementById('editar-turma-modal'));
                        editarTurmaModal.show();
                    });
                });
                
                // Adicionar event listeners para os botões de excluir
                document.querySelectorAll('.excluir-turma').forEach(button => {
                    button.addEventListener('click', function() {
                        const turmaId = this.getAttribute('data-id');
                        const turma = turmas.find(t => t.id == turmaId);
                        
                        if (confirm(`Tem certeza que deseja excluir a turma ${turma.nome}?`)) {
                            excluirTurma(turmaId);
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas:", error);
                turmasTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-danger">
                            Erro ao carregar turmas. Por favor, tente novamente.
                        </td>
                    </tr>
                `;
            });
    }
    
    // Função para converter turno para texto legível
    function turno2texto(turno) {
        switch (turno) {
            case 'M': return 'Matutino';
            case 'T': return 'Vespertino';
            case 'N': return 'Noturno';
            case 'I': return 'Integral';
            default: return turno;
        }
    }
    
    // Função para carregar alunos
    function carregarAlunos() {
        const alunosTableBody = document.getElementById('alunos-table-body');
        
        if (!alunosTableBody) {
            return;
        }
        
        // Exibir spinner de carregamento
        alunosTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        fetch(CONFIG.getApiUrl('/alunos'))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar alunos: ' + response.statusText);
                }
                return response.json();
            })
            .then(alunos => {
                if (alunos.length === 0) {
                    alunosTableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center">Nenhum aluno encontrado</td>
                        </tr>
                    `;
                    return;
                }
                
                // Limpar tabela
                alunosTableBody.innerHTML = '';
                
                // Adicionar linhas
                alunos.forEach(aluno => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${aluno.id}</td>
                        <td>${aluno.nome}</td>
                        <td>${aluno.email}</td>
                        <td>${aluno.matricula}</td>
                        <td>
                            <button class="btn btn-sm btn-primary editar-aluno" data-id="${aluno.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger excluir-aluno" data-id="${aluno.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    alunosTableBody.appendChild(row);
                });
                
                // Adicionar event listeners para os botões de editar
                document.querySelectorAll('.editar-aluno').forEach(button => {
                    button.addEventListener('click', function() {
                        const alunoId = this.getAttribute('data-id');
                        const aluno = alunos.find(a => a.id == alunoId);
                        
                        // Preencher o formulário de edição
                        document.getElementById('editar-aluno-id').value = aluno.id;
                        document.getElementById('editar-aluno-nome').value = aluno.nome;
                        document.getElementById('editar-aluno-email').value = aluno.email;
                        document.getElementById('editar-aluno-matricula').value = aluno.matricula;
                        
                        // Abrir o modal de edição
                        const editarAlunoModal = new bootstrap.Modal(document.getElementById('editar-aluno-modal'));
                        editarAlunoModal.show();
                    });
                });
                
                // Adicionar event listeners para os botões de excluir
                document.querySelectorAll('.excluir-aluno').forEach(button => {
                    button.addEventListener('click', function() {
                        const alunoId = this.getAttribute('data-id');
                        const aluno = alunos.find(a => a.id == alunoId);
                        
                        if (confirm(`Tem certeza que deseja excluir o aluno ${aluno.nome}?`)) {
                            excluirAluno(alunoId);
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Erro ao carregar alunos:", error);
                alunosTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-danger">
                            Erro ao carregar alunos. Por favor, tente novamente.
                        </td>
                    </tr>
                `;
            });
    }
    
    // Função para carregar professores
    function carregarProfessores() {
        const professoresTableBody = document.getElementById('professores-table-body');
        
        if (!professoresTableBody) {
            return;
        }
        
        // Exibir spinner de carregamento
        professoresTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        fetch(CONFIG.getApiUrl('/professores'))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar professores: ' + response.statusText);
                }
                return response.json();
            })
            .then(professores => {
                if (professores.length === 0) {
                    professoresTableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center">Nenhum professor encontrado</td>
                        </tr>
                    `;
                    return;
                }
                
                // Limpar tabela
                professoresTableBody.innerHTML = '';
                
                // Adicionar linhas
                professores.forEach(professor => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${professor.id}</td>
                        <td>${professor.nome}</td>
                        <td>${professor.email}</td>
                        <td>
                            <button class="btn btn-sm btn-primary editar-professor" data-id="${professor.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger excluir-professor" data-id="${professor.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    professoresTableBody.appendChild(row);
                });
                
                // Adicionar event listeners para os botões de editar
                document.querySelectorAll('.editar-professor').forEach(button => {
                    button.addEventListener('click', function() {
                        const professorId = this.getAttribute('data-id');
                        const professor = professores.find(p => p.id == professorId);
                        
                        // Preencher o formulário de edição
                        document.getElementById('editar-professor-id').value = professor.id;
                        document.getElementById('editar-professor-nome').value = professor.nome;
                        document.getElementById('editar-professor-email').value = professor.email;
                        
                        // Abrir o modal de edição
                        const editarProfessorModal = new bootstrap.Modal(document.getElementById('editar-professor-modal'));
                        editarProfessorModal.show();
                    });
                });
                
                // Adicionar event listeners para os botões de excluir
                document.querySelectorAll('.excluir-professor').forEach(button => {
                    button.addEventListener('click', function() {
                        const professorId = this.getAttribute('data-id');
                        const professor = professores.find(p => p.id == professorId);
                        
                        if (confirm(`Tem certeza que deseja excluir o professor ${professor.nome}?`)) {
                            excluirProfessor(professorId);
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Erro ao carregar professores:", error);
                professoresTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-danger">
                            Erro ao carregar professores. Por favor, tente novamente.
                        </td>
                    </tr>
                `;
            });
    }
    
    // Função para carregar notas de alunos por disciplina
    function carregarNotas(idProfessor, idDisciplina, idTurma) {
        console.log(`Carregando notas (Professor: ${idProfessor}, Disciplina: ${idDisciplina}, Turma: ${idTurma})...`);
        
        // Verificar se a tabela existe
        const tabelaContainer = document.getElementById('tabela-notas-container');
        if (!tabelaContainer) {
            console.warn("Container da tabela de notas não encontrado");
            return;
        }
        
        // Mostrar indicador de carregamento
        tabelaContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center p-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <span class="ms-2">Carregando notas...</span>
            </div>
        `;
        
        // Buscar dados da turma para mostrar informações
        fetch(CONFIG.getApiUrl(`/turmas/${idTurma}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar informações da turma: ' + response.statusText);
                }
                return response.json();
            })
            .then(turma => {
                console.log("Informações da turma:", turma);
                
                // Buscar dados da disciplina
                return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}`))
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao buscar informações da disciplina: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(disciplina => {
                        console.log("Informações da disciplina:", disciplina);
                        
                        // Buscar dados do professor
                        return fetch(CONFIG.getApiUrl(`/professores/${idProfessor}`))
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Erro ao buscar informações do professor: ' + response.statusText);
                                }
                                return response.json();
                            })
                            .then(professor => {
                                console.log("Informações do professor:", professor);
                                
                                // Mostrar informações no header
                                const headerContainer = document.getElementById('notas-header-container');
                                if (headerContainer) {
                                    headerContainer.innerHTML = `
                                        <div class="card mb-3">
                                            <div class="card-body">
                                                <h5 class="card-title">Lançamento de Notas</h5>
                                                <div class="row">
                                                    <div class="col-md-4">
                                                        <p><strong>Turma:</strong> ${turma.serie} (${turno2texto(turma.turno)}) - ${turma.ano_letivo}</p>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <p><strong>Disciplina:</strong> ${disciplina.nome}</p>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <p><strong>Professor:</strong> ${professor.nome}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }
                                
                                // Buscar alunos da turma
                                return fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`))
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error('Erro ao buscar alunos da turma: ' + response.statusText);
                                        }
                                        return response.json();
                                    })
                                    .then(alunos => {
                                        console.log("Alunos da turma:", alunos);
                                        
                                        if (alunos.length === 0) {
                                            tabelaContainer.innerHTML = `
                                                <div class="alert alert-info">
                                                    Não há alunos matriculados nesta turma.
                                                </div>
                                            `;
                                            return;
                                        }
                                        
                                        // Buscar notas existentes
                                        return fetch(CONFIG.getApiUrl(`/notas/professor/${idProfessor}/disciplina/${idDisciplina}/turma/${idTurma}`))
                                            .then(response => {
                                                if (!response.ok) {
                                                    throw new Error('Erro ao buscar notas: ' + response.statusText);
                                                }
                                                return response.json();
                                            })
                                            .then(notas => {
                                                console.log("Notas carregadas:", notas);
                                                
                                                // Criar mapa de notas por aluno e bimestre
                                                const notasMap = new Map();
                                                
                                                notas.forEach(nota => {
                                                    const chave = `${nota.id_aluno}-${nota.bimestre}`;
                                                    notasMap.set(chave, nota.valor);
                                                });
                                                
                                                // Construir tabela
                                                let tabelaHTML = `
                                                    <div class="table-responsive">
                                                        <table class="table table-striped table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Aluno</th>
                                                                    <th class="text-center">1º Bimestre</th>
                                                                    <th class="text-center">2º Bimestre</th>
                                                                    <th class="text-center">3º Bimestre</th>
                                                                    <th class="text-center">4º Bimestre</th>
                                                                    <th class="text-center">Média</th>
                                                                    <th class="text-center">Situação</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                `;
                                                
                                                // Adicionar linha para cada aluno
                                                alunos.forEach(aluno => {
                                                    // Obter notas dos bimestres
                                                    const nota1 = notasMap.get(`${aluno.id}-1`) || '-';
                                                    const nota2 = notasMap.get(`${aluno.id}-2`) || '-';
                                                    const nota3 = notasMap.get(`${aluno.id}-3`) || '-';
                                                    const nota4 = notasMap.get(`${aluno.id}-4`) || '-';
                                                    
                                                    // Calcular média se todas as notas estiverem presentes
                                                    let media = '-';
                                                    let situacao = 'N/A';
                                                    let situacaoClass = 'bg-secondary';
                                                    
                                                    if (typeof nota1 === 'number' && 
                                                        typeof nota2 === 'number' && 
                                                        typeof nota3 === 'number' && 
                                                        typeof nota4 === 'number') {
                                                        
                                                        media = ((nota1 + nota2 + nota3 + nota4) / 4).toFixed(1);
                                                        
                                                        if (media >= 7) {
                                                            situacao = 'Aprovado';
                                                            situacaoClass = 'bg-success';
                                                        } else if (media >= 4) {
                                                            situacao = 'Recuperação';
                                                            situacaoClass = 'bg-warning text-dark';
                                                        } else {
                                                            situacao = 'Reprovado';
                                                            situacaoClass = 'bg-danger';
                                                        }
                                                    }
                                                    
                                                    tabelaHTML += `
                                                        <tr>
                                                            <td>${aluno.nome}</td>
                                                            <td class="text-center">
                                                                <input type="number" min="0" max="10" step="0.1" 
                                                                    class="form-control form-control-sm text-center nota-input" 
                                                                    data-aluno="${aluno.id}" 
                                                                    data-bimestre="1" 
                                                                    value="${nota1 !== '-' ? nota1 : ''}" 
                                                                    onchange="salvarNota(${idProfessor}, ${idDisciplina}, ${idTurma}, ${aluno.id}, 1, this.value)"
                                                                >
                                                            </td>
                                                            <td class="text-center">
                                                                <input type="number" min="0" max="10" step="0.1" 
                                                                    class="form-control form-control-sm text-center nota-input" 
                                                                    data-aluno="${aluno.id}" 
                                                                    data-bimestre="2" 
                                                                    value="${nota2 !== '-' ? nota2 : ''}" 
                                                                    onchange="salvarNota(${idProfessor}, ${idDisciplina}, ${idTurma}, ${aluno.id}, 2, this.value)"
                                                                >
                                                            </td>
                                                            <td class="text-center">
                                                                <input type="number" min="0" max="10" step="0.1" 
                                                                    class="form-control form-control-sm text-center nota-input" 
                                                                    data-aluno="${aluno.id}" 
                                                                    data-bimestre="3" 
                                                                    value="${nota3 !== '-' ? nota3 : ''}" 
                                                                    onchange="salvarNota(${idProfessor}, ${idDisciplina}, ${idTurma}, ${aluno.id}, 3, this.value)"
                                                                >
                                                            </td>
                                                            <td class="text-center">
                                                                <input type="number" min="0" max="10" step="0.1" 
                                                                    class="form-control form-control-sm text-center nota-input" 
                                                                    data-aluno="${aluno.id}" 
                                                                    data-bimestre="4" 
                                                                    value="${nota4 !== '-' ? nota4 : ''}" 
                                                                    onchange="salvarNota(${idProfessor}, ${idDisciplina}, ${idTurma}, ${aluno.id}, 4, this.value)"
                                                                >
                                                            </td>
                                                            <td class="text-center media-cell">
                                                                ${media}
                                                            </td>
                                                            <td class="text-center">
                                                                <span class="badge ${situacaoClass}">
                                                                    ${situacao}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    `;
                                                });
                                                
                                                // Fechar estrutura da tabela
                                                tabelaHTML += `
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                `;
                                                
                                                // Adicionar tabela ao container
                                                tabelaContainer.innerHTML = tabelaHTML;
                                            });
                                    });
                            });
                    });
            })
            .catch(error => {
                console.error("Erro ao carregar notas:", error);
                tabelaContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Erro ao carregar notas: ${error.message}
                    </div>
                `;
            });
    }
}

// Função para carregar disciplinas
function carregarDisciplinas() {
    const disciplinasTableBody = document.getElementById('disciplinas-table-body');
    
    if (!disciplinasTableBody) {
        return;
    }
    
    // Exibir spinner de carregamento
    disciplinasTableBody.innerHTML = `
        <tr>
            <td colspan="3" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </td>
        </tr>
    `;
    
    fetch(CONFIG.getApiUrl('/disciplinas'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar disciplinas: ' + response.statusText);
            }
            return response.json();
        })
        .then(disciplinas => {
            if (disciplinas.length === 0) {
                disciplinasTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center">Nenhuma disciplina encontrada</td>
                    </tr>
                `;
                return;
            }
            
            // Limpar tabela
            disciplinasTableBody.innerHTML = '';
            
            // Adicionar linhas
            disciplinas.forEach(disciplina => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${disciplina.id}</td>
                    <td>${disciplina.nome}</td>
                    <td>
                        <button class="btn btn-sm btn-primary editar-disciplina" data-id="${disciplina.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger excluir-disciplina" data-id="${disciplina.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                disciplinasTableBody.appendChild(row);
            });
            
            // Adicionar event listeners para os botões de editar
            document.querySelectorAll('.editar-disciplina').forEach(button => {
                button.addEventListener('click', function() {
                    const disciplinaId = this.getAttribute('data-id');
                    const disciplina = disciplinas.find(d => d.id == disciplinaId);
                    
                    // Preencher o formulário de edição
                    document.getElementById('editar-disciplina-id').value = disciplina.id;
                    document.getElementById('editar-disciplina-nome').value = disciplina.nome;
                    
                    // Abrir o modal de edição
                    const editarDisciplinaModal = new bootstrap.Modal(document.getElementById('editar-disciplina-modal'));
                    editarDisciplinaModal.show();
                });
            });
            
            // Adicionar event listeners para os botões de excluir
            document.querySelectorAll('.excluir-disciplina').forEach(button => {
                button.addEventListener('click', function() {
                    const disciplinaId = this.getAttribute('data-id');
                    const disciplina = disciplinas.find(d => d.id == disciplinaId);
                    
                    if (confirm(`Tem certeza que deseja excluir a disciplina ${disciplina.nome}?`)) {
                        excluirDisciplina(disciplinaId);
                    }
                });
            });
        })
        .catch(error => {
            console.error("Erro ao carregar disciplinas:", error);
            disciplinasTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-danger">
                        Erro ao carregar disciplinas. Por favor, tente novamente.
                    </td>
                </tr>
            `;
        });
}

// Função para carregar turmas no select
function carregarTurmasSelect() {
    const selectTurma = document.getElementById('select-turma');
    
    if (!selectTurma) {
        return;
    }
    
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar turmas: ' + response.statusText);
            }
            return response.json();
        })
        .then(turmas => {
            // Limpar select
            selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
            
            // Adicionar opções
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                selectTurma.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas para o select:", error);
            selectTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        });
}

// Função para carregar disciplinas nos selects
function carregarDisciplinasSelect() {
    const selects = document.querySelectorAll('.disciplina-select');
    
    if (selects.length === 0) {
        return;
    }
    
    fetch(CONFIG.getApiUrl('/disciplinas'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar disciplinas: ' + response.statusText);
            }
            return response.json();
        })
        .then(disciplinas => {
            selects.forEach(select => {
                // Limpar select
                select.innerHTML = '<option value="">Selecione uma disciplina</option>';
                
                // Adicionar opções
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id;
                    option.textContent = disciplina.nome;
                    select.appendChild(option);
                });
                
                // Se tiver Choices.js, inicializar
                if (typeof Choices !== 'undefined') {
                    new Choices(select, {
                        searchEnabled: true,
                        itemSelectText: '',
                        position: 'bottom'
                    });
                }
            });
        })
        .catch(error => {
            console.error("Erro ao carregar disciplinas:", error);
            selects.forEach(select => {
                select.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            });
        });
}

// Função para carregar tabela de professores, disciplinas e turmas
function carregarTabelaProfessoresDisciplinasTurmas() {
    console.log("Carregando tabela de professores, disciplinas e turmas...");
    
    // Verificar se a tabela existe
    const tabelaContainer = document.getElementById('tabela-prof-disc-turmas-container');
    if (!tabelaContainer) {
        console.warn("Container da tabela de professores, disciplinas e turmas não encontrado");
        return;
    }
    
    // Mostrar indicador de carregamento
    tabelaContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center p-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <span class="ms-2">Carregando relações...</span>
        </div>
    `;
    
    // Buscar dados da API
    fetch(CONFIG.getApiUrl('/professores-disciplinas-turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar relações: ' + response.statusText);
            }
            return response.json();
        })
        .then(relacoes => {
            console.log("Relações carregadas:", relacoes);
            
            if (relacoes.length === 0) {
                tabelaContainer.innerHTML = `
                    <div class="alert alert-info">
                        Não há atribuições de professores a disciplinas e turmas.
                    </div>
                `;
                return;
            }
            
            // Construir tabela
            let tabelaHTML = `
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Professor</th>
                                <th>Disciplina</th>
                                <th>Turma</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Adicionar linha para cada relação
            relacoes.forEach(relacao => {
                tabelaHTML += `
                    <tr>
                        <td>${relacao.id}</td>
                        <td>${relacao.professor_nome || 'N/D'}</td>
                        <td>${relacao.disciplina_nome || 'N/D'}</td>
                        <td>${relacao.turma_serie || 'N/D'} (${turno2texto(relacao.turma_turno) || 'N/D'}) - ${relacao.turma_ano_letivo || 'N/D'}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-danger" onclick="excluirProfessorDisciplinaTurma(${relacao.id})">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            // Fechar estrutura da tabela
            tabelaHTML += `
                        </tbody>
                    </table>
                </div>
            `;
            
            // Adicionar tabela ao container
            tabelaContainer.innerHTML = tabelaHTML;
        })
        .catch(error => {
            console.error("Erro ao carregar relações:", error);
            tabelaContainer.innerHTML = `
                <div class="alert alert-danger">
                    Erro ao carregar relações: ${error.message}
                </div>
            `;
        });
}

// Função para carregar turmas na página de alunos
function carregarTurmasParaAlunos() {
    const turmasContainer = document.getElementById('turmas-aluno-container');
    
    if (!turmasContainer) {
        console.warn('Container de turmas do aluno não encontrado!');
        return;
    }
    
    const alunoId = document.getElementById('aluno-id')?.value;
    
    if (!alunoId) {
        console.warn('ID do aluno não encontrado!');
        return;
    }
    
    turmasContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>';
    
    fetch(CONFIG.getApiUrl(`/alunos/${alunoId}/turmas`))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar turmas do aluno: ' + response.statusText);
            }
            return response.json();
        })
        .then(turmas => {
            if (turmas.length === 0) {
                turmasContainer.innerHTML = '<div class="alert alert-info">Este aluno não está matriculado em nenhuma turma.</div>';
                return;
            }
            
            let html = '<div class="table-responsive"><table class="table table-hover">';
            html += '<thead><tr><th>ID</th><th>Turma</th><th>Ano</th><th>Período</th><th>Sala</th><th>Ações</th></tr></thead>';
            html += '<tbody>';
            
            turmas.forEach(turma => {
                html += `<tr>
                    <td>${turma.id}</td>
                    <td>${turma.nome}</td>
                    <td>${turma.ano}</td>
                    <td>${turma.periodo}</td>
                    <td>${turma.sala || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-danger remover-turma-aluno" data-turma-id="${turma.id}" data-aluno-id="${alunoId}">
                            <i class="bi bi-trash"></i> Remover
                        </button>
                    </td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
            turmasContainer.innerHTML = html;
            
            // Adicionar event listeners para os botões de remover
            document.querySelectorAll('.remover-turma-aluno').forEach(button => {
                button.addEventListener('click', function() {
                    const turmaId = this.getAttribute('data-turma-id');
                    const alunoId = this.getAttribute('data-aluno-id');
                    removerAlunoTurma(alunoId, turmaId);
                });
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas do aluno:", error);
            turmasContainer.innerHTML = `<div class="alert alert-danger">Erro ao carregar turmas do aluno: ${error.message}</div>`;
        });
}

// Função para enviar formulário de turma
function enviarFormularioTurma(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const turma = {
        nome: formData.get('nome'),
        ano: formData.get('ano'),
        turno: formData.get('turno')
    };
    
    fetch(CONFIG.getApiUrl('/turmas'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(turma)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao criar turma: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Fechar modal e recarregar turmas
        const modal = bootstrap.Modal.getInstance(document.getElementById('adicionar-turma-modal'));
        modal.hide();
        carregarTurmas();
        mostrarAlerta('Turma criada com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao criar turma:', error);
        mostrarAlerta('Erro ao criar turma: ' + error.message, 'danger');
    });
}

// Função para editar turma
function editarTurma(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const id = formData.get('id');
    const turma = {
        nome: formData.get('nome'),
        ano: formData.get('ano'),
        turno: formData.get('turno')
    };
    
    fetch(CONFIG.getApiUrl(`/turmas/${id}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(turma)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar turma: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Fechar modal e recarregar turmas
        const modal = bootstrap.Modal.getInstance(document.getElementById('editar-turma-modal'));
        modal.hide();
        carregarTurmas();
        mostrarAlerta('Turma atualizada com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao atualizar turma:', error);
        mostrarAlerta('Erro ao atualizar turma: ' + error.message, 'danger');
    });
}

// Função para mostrar alertas
function mostrarAlerta(mensagem, tipo) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss após 5 segundos
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
        }, 150);
    }, 5000);
}

// Função para excluir turma
function excluirTurma(id) {
    fetch(CONFIG.getApiUrl(`/turmas/${id}`), {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir turma: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        carregarTurmas();
        mostrarAlerta('Turma excluída com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao excluir turma:', error);
        mostrarAlerta('Erro ao excluir turma: ' + error.message, 'danger');
    });
}

// Função para excluir disciplina
function excluirDisciplina(id) {
    fetch(CONFIG.getApiUrl(`/disciplinas/${id}`), {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir disciplina: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        carregarDisciplinas();
        mostrarAlerta('Disciplina excluída com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao excluir disciplina:', error);
        mostrarAlerta('Erro ao excluir disciplina: ' + error.message, 'danger');
    });
}

// Função para excluir professor
function excluirProfessor(id) {
    fetch(CONFIG.getApiUrl(`/professores/${id}`), {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir professor: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        carregarProfessores();
        mostrarAlerta('Professor excluído com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao excluir professor:', error);
        mostrarAlerta('Erro ao excluir professor: ' + error.message, 'danger');
    });
}

// Função para excluir aluno
function excluirAluno(id) {
    fetch(CONFIG.getApiUrl(`/alunos/${id}`), {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao excluir aluno: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        carregarAlunos();
        mostrarAlerta('Aluno excluído com sucesso!', 'success');
    })
    .catch(error => {
        console.error('Erro ao excluir aluno:', error);
        mostrarAlerta('Erro ao excluir aluno: ' + error.message, 'danger');
    });
}

// Inicialização do módulo de professores
function initProfessores() {
    console.log("Inicializando módulo de professores");
    
    // Elementos do formulário
    const formProfessor = document.getElementById('form-professor');
    const btnNovoProfessor = document.getElementById('btn-novo-professor');
    const btnCancelarProfessor = document.getElementById('btn-cancelar-professor');
    
    // Carregar professores
    carregarProfessores();
    
    // Configurar formulário de novo professor
    if (formProfessor) {
        formProfessor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const professor = {
                nome: formData.get('nome'),
                email: formData.get('email')
            };
            
            if (!professor.nome || !professor.email) {
                mostrarAlerta('Preencha todos os campos obrigatórios', 'warning');
                return;
            }
            
            fetch(CONFIG.getApiUrl('/professores'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(professor)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao criar professor: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                this.reset();
                carregarProfessores();
                mostrarAlerta('Professor criado com sucesso!', 'success');
            })
            .catch(error => {
                console.error("Erro ao criar professor:", error);
                mostrarAlerta('Erro ao criar professor: ' + error.message, 'danger');
            });
        });
    }
    
    // Configurar botão de novo professor
    if (btnNovoProfessor) {
        btnNovoProfessor.addEventListener('click', function() {
            if (formProfessor) {
                formProfessor.reset();
                formProfessor.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
    
    // Configurar botão cancelar
    if (btnCancelarProfessor) {
        btnCancelarProfessor.addEventListener('click', function() {
            if (formProfessor) {
                formProfessor.reset();
            }
        });
    }
}

// Inicialização do módulo de disciplinas
function initDisciplinas() {
    console.log("Inicializando módulo de disciplinas");
    
    // Elementos do formulário
    const formDisciplina = document.getElementById('form-disciplina');
    const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    const btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
    
    // Carregar disciplinas
    carregarDisciplinas();
    
    // Configurar formulário de nova disciplina
    if (formDisciplina) {
        formDisciplina.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const nome = formData.get('nome');
            
            if (!nome) {
                mostrarAlerta('Preencha o nome da disciplina', 'warning');
                return;
            }
            
            fetch(CONFIG.getApiUrl('/disciplinas'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao criar disciplina: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                this.reset();
                carregarDisciplinas();
                mostrarAlerta('Disciplina criada com sucesso!', 'success');
            })
            .catch(error => {
                console.error("Erro ao criar disciplina:", error);
                mostrarAlerta('Erro ao criar disciplina: ' + error.message, 'danger');
            });
        });
    }
    
    // Configurar botão de nova disciplina
    if (btnNovaDisciplina) {
        btnNovaDisciplina.addEventListener('click', function() {
            if (formDisciplina) {
                formDisciplina.reset();
                formDisciplina.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
    
    // Configurar botão cancelar
    if (btnCancelarDisciplina) {
        btnCancelarDisciplina.addEventListener('click', function() {
            if (formDisciplina) {
                formDisciplina.reset();
            }
        });
    }
}

// Inicialização do módulo de alunos
function initAlunos() {
    console.log("Inicializando módulo de alunos");
    
    // Elementos do formulário
    const formAluno = document.getElementById('form-aluno');
    const btnNovoAluno = document.getElementById('btn-novo-aluno');
    const btnCancelarAluno = document.getElementById('btn-cancelar-aluno');
    
    // Carregar alunos
    carregarAlunos();
    
    // Configurar formulário de novo aluno
    if (formAluno) {
        formAluno.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const aluno = {
                nome: formData.get('nome'),
                email: formData.get('email'),
                matricula: formData.get('matricula')
            };
            
            if (!aluno.nome || !aluno.email || !aluno.matricula) {
                mostrarAlerta('Preencha todos os campos obrigatórios', 'warning');
                return;
            }
            
            fetch(CONFIG.getApiUrl('/alunos'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(aluno)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao criar aluno: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                this.reset();
                carregarAlunos();
                mostrarAlerta('Aluno criado com sucesso!', 'success');
            })
            .catch(error => {
                console.error("Erro ao criar aluno:", error);
                mostrarAlerta('Erro ao criar aluno: ' + error.message, 'danger');
            });
        });
    }
    
    // Configurar botão de novo aluno
    if (btnNovoAluno) {
        btnNovoAluno.addEventListener('click', function() {
            if (formAluno) {
                formAluno.reset();
                formAluno.scrollIntoView({behavior: 'smooth'});
            }
        });
    }
    
    // Configurar botão cancelar
    if (btnCancelarAluno) {
        btnCancelarAluno.addEventListener('click', function() {
            if (formAluno) {
                formAluno.reset();
            }
        });
    }
}

// Inicialização do módulo de notas
function initNotas() {
    console.log("Inicializando módulo de notas");
    
    // Elementos do formulário
    const formFiltroNotas = document.getElementById('form-filtro-notas');
    const selectTurma = document.getElementById('select-turma-notas');
    const selectDisciplina = document.getElementById('select-disciplina-notas');
    
    // Carregar turmas e disciplinas nos selects
    carregarTurmasSelect();
    carregarDisciplinasSelect();
    
    // Configurar formulário de filtro
    if (formFiltroNotas) {
        formFiltroNotas.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const turmaId = formData.get('turma');
            const disciplinaId = formData.get('disciplina');
            
            if (!turmaId || !disciplinaId) {
                mostrarAlerta('Selecione a turma e a disciplina', 'warning');
                return;
            }
            
            // Supondo que temos um ID de professor (pode ser obtido da sessão ou de outra forma)
            const professorId = 1; // Valor temporário
            
            // Carregar notas com os filtros
            carregarNotas(professorId, disciplinaId, turmaId);
        });
    }
}