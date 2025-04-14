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
    console.log("Atualizando cards totalizadores");
    
    // Elementos dos cards - seleção mais específica
    const cardsContainers = document.querySelectorAll('.card.border-left-primary, .card.border-left-success, .card.border-left-info, .card.border-left-warning');
    
    if (cardsContainers.length !== 4) {
        console.error(`Elementos dos cards não encontrados corretamente. Encontrados: ${cardsContainers.length}`);
        return;
    }
    
    // Mapear cada card para seu elemento de valor
    const totalAlunosElement = cardsContainers[0].querySelector('.h5');
    const totalProfessoresElement = cardsContainers[1].querySelector('.h5');
    const turmasAtivasElement = cardsContainers[2].querySelector('.h5');
    const disciplinasElement = cardsContainers[3].querySelector('.h5');
    
    console.log("Elementos dos cards:", {
        alunos: totalAlunosElement,
        professores: totalProfessoresElement, 
        turmas: turmasAtivasElement,
        disciplinas: disciplinasElement
    });
    
    // Verificar se os elementos foram encontrados
    if (!totalAlunosElement || !totalProfessoresElement || !turmasAtivasElement || !disciplinasElement) {
        console.error("Elementos dos cards não encontrados");
        return;
    }
    
    // Exibir indicador de carregamento nos cards
    totalAlunosElement.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Carregando...</span></div>';
    totalProfessoresElement.innerHTML = '<div class="spinner-border spinner-border-sm text-success" role="status"><span class="visually-hidden">Carregando...</span></div>';
    turmasAtivasElement.innerHTML = '<div class="spinner-border spinner-border-sm text-info" role="status"><span class="visually-hidden">Carregando...</span></div>';
    disciplinasElement.innerHTML = '<div class="spinner-border spinner-border-sm text-warning" role="status"><span class="visually-hidden">Carregando...</span></div>';
    
    // Buscar dados do resumo do dashboard via API
    fetch('http://localhost:4000/api/dashboard/resumo')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar resumo do dashboard: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados de resumo do dashboard:", data);
            
            // Atualizar os elementos com os valores reais
            totalAlunosElement.textContent = data.total_alunos;
            totalProfessoresElement.textContent = data.total_professores;
            turmasAtivasElement.textContent = data.turmas_ativas;
            disciplinasElement.textContent = data.disciplinas;
        })
        .catch(error => {
            console.error("Erro ao atualizar cards totalizadores:", error);
            
            // Exibir mensagem de erro nos cards
            totalAlunosElement.innerHTML = '<span class="text-danger">Erro</span>';
            totalProfessoresElement.innerHTML = '<span class="text-danger">Erro</span>';
            turmasAtivasElement.innerHTML = '<span class="text-danger">Erro</span>';
            disciplinasElement.innerHTML = '<span class="text-danger">Erro</span>';
        });
}

// Função para carregar logs de atividades recentes
function carregarLogsAtividades() {
    console.log("Carregando logs de atividades recentes");
    
    // Elemento da tabela de atividades
    const tabelaAtividades = document.getElementById('tabela-atividades');
    
    if (!tabelaAtividades) {
        console.error("Tabela de atividades não encontrada");
        return;
    }
    
    // Elemento do corpo da tabela
    const tabelaBody = tabelaAtividades.querySelector('tbody');
    
    if (!tabelaBody) {
        console.error("Corpo da tabela de atividades não encontrado");
        return;
    }
    
    // Exibir mensagem de carregamento
    tabelaBody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                Carregando atividades recentes...
            </td>
        </tr>
    `;
    
    // Buscar logs de atividades via API (últimos 15 registros)
    fetch('http://localhost:4000/api/logs?limit=15')
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    // A tabela de logs ainda não existe, vamos criar
                    return fetch('http://localhost:4000/api/logs/criar-tabela', {
                        method: 'POST'
                    }).then(createResponse => {
                        if (createResponse.ok) {
                            // Tabela criada, mas não temos logs ainda
                            return { logs: [] };
                        } else {
                            throw new Error('Erro ao criar tabela de logs: ' + createResponse.statusText);
                        }
                    });
                }
                throw new Error('Erro ao buscar logs de atividades: ' + response.statusText);
            }
            return response.json();
        })
        .then(logs => {
            console.log("Logs de atividades:", logs);
            
            // Limpar a tabela
            tabelaBody.innerHTML = '';
            
            // Verificar se temos logs para exibir
            if (!logs || logs.length === 0) {
                tabelaBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            Nenhum registro de atividade encontrado.
                            As atividades serão registradas conforme o sistema for utilizado.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Adicionar cada log à tabela
            logs.forEach(log => {
                // Formatar a data
                const dataHora = new Date(log.data_hora);
                const dataFormatada = dataHora.toLocaleDateString('pt-BR');
                
                // Determinar a classe da badge com base no status
                let badgeClass = 'bg-secondary';
                
                if (log.status === 'concluído') {
                    badgeClass = 'bg-success';
                } else if (log.status === 'pendente') {
                    badgeClass = 'bg-warning text-dark';
                } else if (log.status === 'erro') {
                    badgeClass = 'bg-danger';
                }
                
                // Formatar a descrição da atividade
                let atividade = `${log.acao.charAt(0).toUpperCase() + log.acao.slice(1)} de ${log.entidade} - ${log.entidade_id}`;
                
                // Incluir detalhes se disponíveis
                if (log.detalhe) {
                    atividade += `: ${log.detalhe}`;
                }
                
                // Criar a linha da tabela
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td>${log.usuario}</td>
                    <td>${atividade}</td>
                    <td><span class="badge ${badgeClass}">${log.status.charAt(0).toUpperCase() + log.status.slice(1)}</span></td>
                `;
                
                tabelaBody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar logs de atividades:", error);
            
            // Exibir mensagem de erro na tabela
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar atividades recentes: ${error.message}
                    </td>
                </tr>
            `;
        });
}

// Função auxiliar para registrar atividades no log
function registrarAtividade(acao, entidade, entidadeId, detalhe = null, status = "concluído") {
    console.log(`Registrando atividade: ${acao} de ${entidade} - ${entidadeId}`);
    
    // Obter o usuário logado (ou usar um padrão)
    const usuarioLogado = localStorage.getItem('usuarioLogado') || "Administrador";
    
    // Dados do log
    const logData = {
        usuario: usuarioLogado,
        acao: acao,
        entidade: entidade,
        entidade_id: entidadeId,
        detalhe: detalhe,
        status: status
    };
    
    // Enviar para a API
    fetch('http://localhost:4000/api/logs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
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
                fetch('http://localhost:4000/api/turmas/', {
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
                    console.log('Turma cadastrada com sucesso:', data);
                    alert('Turma cadastrada com sucesso!');
                    
                    // Registrar atividade no log
                    registrarAtividade('criar', 'turma', data.id_turma, `Nova turma ${data.serie} (${turno2texto(data.turno)})`);
                    
                    // Limpar formulário e recarregar lista
                    resetarFormularioTurma();
                    carregarTurmas();
                })
                .catch(error => {
                    console.error('Erro ao cadastrar turma:', error);
                    if (error.message.includes('400')) {
                        alert('Já existe uma turma com este ID. Por favor, use outro ID.');
                    } else {
                        alert('Erro ao cadastrar turma: ' + error.message);
                    }
                });
            } else {
                // Editar turma existente via API
                const turmaId = turma.id_turma;
                
                fetch(`http://localhost:4000/api/turmas/${turmaId}`, {
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
                    console.log('Turma atualizada com sucesso:', data);
                    
                    // Atualizar referências se o ID da turma mudou
                    const antigoId = turmaIndex.value;
                    if (antigoId !== turma.id_turma) {
                        atualizarReferenciasAposMudancaIdTurma(antigoId, turma.id_turma);
                        
                        // Registrar a mudança de ID no log
                        registrarAtividade('atualizar', 'turma', turma.id_turma, `ID da turma alterado de ${antigoId} para ${turma.id_turma}`);
                    } else {
                        // Registrar atualização normal
                        registrarAtividade('atualizar', 'turma', turma.id_turma, `Turma ${turma.serie} atualizada`);
                    }
                    
                    alert('Turma atualizada com sucesso!');
                    
                    // Limpar formulário e recarregar lista
                    resetarFormularioTurma();
                    carregarTurmas();
                })
                .catch(error => {
                    console.error('Erro ao atualizar turma:', error);
                    alert('Erro ao atualizar turma: ' + error.message);
                });
            }
        });
    }
    
    // Função para carregar turmas
    function carregarTurmas() {
        console.log("Carregando turmas da API");
        
        if (turmasLista) {
            // Exibir indicador de carregamento
            turmasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="6">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
                        </div>
                        <p>Carregando turmas...</p>
                    </td>
                </tr>
            `;
            
            // Buscar turmas da API
            fetch('http://localhost:4000/api/turmas/')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao carregar turmas: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(turmas => {
                    console.log("Turmas recuperadas da API:", turmas.length);
                    
            turmasLista.innerHTML = '';
            
            if (turmas.length === 0) {
                turmasLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="6">Nenhuma turma cadastrada</td>
                    </tr>
                `;
                return;
            }
            
                    // Ordenar turmas por ID
                    turmas.sort((a, b) => a.id_turma.localeCompare(b.id_turma));
                    
                    // Adicionar cada turma à tabela
                    turmas.forEach(turma => {
                        // Formatar turno para exibição
                        const turnoTexto = turno2texto(turma.turno);
                        
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${turma.id_turma}</td>
                            <td>${turma.serie}</td>
                            <td>${turnoTexto}</td>
                            <td>${turma.tipo_turma || 'Regular'}</td>
                            <td>${turma.coordenador || '-'}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-primary me-1 btn-editar-turma" data-id="${turma.id_turma}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger btn-excluir-turma" data-id="${turma.id_turma}">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        `;
                        
                        turmasLista.appendChild(tr);
                    });
                    
                    // Adicionar event listeners para os botões
                    document.querySelectorAll('.btn-editar-turma').forEach(button => {
                        button.addEventListener('click', function() {
                            const id = this.getAttribute('data-id');
                            editarTurma(id);
                        });
                    });
                    
                    document.querySelectorAll('.btn-excluir-turma').forEach(button => {
                        button.addEventListener('click', function() {
                            const id = this.getAttribute('data-id');
                            excluirTurma(id);
                        });
                    });
                    
                    // Também salvar no localStorage para manter compatibilidade com o resto do sistema
                    localStorage.setItem('turmas', JSON.stringify(turmas));
                })
                .catch(error => {
                    console.error("Erro ao carregar turmas:", error);
                    turmasLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="6" class="text-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Erro ao carregar turmas: ${error.message}
                            </td>
                        </tr>
                    `;
                    
                    // Tentar usar dados do localStorage como fallback
                    const turmasLocal = JSON.parse(localStorage.getItem('turmas') || '[]');
                    if (turmasLocal.length > 0) {
                        console.log("Usando dados de turmas do localStorage como fallback");
                        turmasLista.innerHTML = '';
                        
                        // Ordenar turmas por ID
                        turmasLocal.sort((a, b) => a.id_turma.localeCompare(b.id_turma));
                        
                        // Adicionar cada turma à tabela
                        turmasLocal.forEach(turma => {
                            // Formatar turno para exibição
                            const turnoTexto = turno2texto(turma.turno);
                            
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${turma.id_turma}</td>
                    <td>${turma.serie}</td>
                                <td>${turnoTexto}</td>
                                <td>${turma.tipo_turma || 'Regular'}</td>
                                <td>${turma.coordenador || '-'}</td>
                    <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary me-1 btn-editar-turma" data-id="${turma.id_turma}">
                            <i class="fas fa-edit"></i>
                        </button>
                                    <button class="btn btn-sm btn-outline-danger btn-excluir-turma" data-id="${turma.id_turma}">
                                        <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                
                turmasLista.appendChild(tr);
            });
            
                        // Adicionar event listeners para os botões
                        document.querySelectorAll('.btn-editar-turma').forEach(button => {
                            button.addEventListener('click', function() {
                                const id = this.getAttribute('data-id');
                                editarTurma(id);
                });
            });
            
                        document.querySelectorAll('.btn-excluir-turma').forEach(button => {
                            button.addEventListener('click', function() {
                                const id = this.getAttribute('data-id');
                                excluirTurma(id);
                            });
                        });
                    }
            });
        }
    }
    
    // Função auxiliar para converter valor do turno para texto
    function turno2texto(turno) {
        switch(turno) {
            case 'manha': return 'Manhã';
            case 'tarde': return 'Tarde';
            case 'noite': return 'Noite';
            default: return turno;
        }
    }
    
    // Função para editar uma turma
    function editarTurma(turmaId) {
        console.log("Editando turma:", turmaId);
        
        // Elementos do formulário
        const formTurma = document.getElementById('form-turma');
        const formModo = document.getElementById('form-modo');
        const turmaIndex = document.getElementById('turma-index');
        const idTurmaInput = document.getElementById('id_turma_input');
        const serie = document.getElementById('serie');
        const turno = document.getElementById('turno');
        const tipoTurma = document.getElementById('tipo_turma');
        const coordenador = document.getElementById('coordenador');
        
        // Verificar se todos os elementos foram encontrados
        if (!formModo || !idTurmaInput || !serie || !turno || !tipoTurma || !coordenador || !turmaIndex) {
            console.error("Elementos do formulário não encontrados:", {
                formModo, idTurmaInput, serie, turno, tipoTurma, coordenador, turmaIndex
            });
            alert("Erro ao carregar o formulário. Por favor, recarregue a página.");
            return;
        }
        
        // Buscar dados da turma da API
        fetch(`http://localhost:4000/api/turmas/${turmaId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar turma: ' + response.statusText);
                }
                return response.json();
            })
            .then(turma => {
                console.log("Dados da turma recuperados:", turma);
                
                // Preencher o formulário com os dados da turma
            formModo.value = 'editar';
                idTurmaInput.value = turma.id_turma;
            serie.value = turma.serie;
            turno.value = turma.turno;
                tipoTurma.value = turma.tipo_turma || '';
                coordenador.value = turma.coordenador || '';
                
                // Desabilitar alteração do ID da turma
                idTurmaInput.disabled = true;
            
            // Atualizar título e mostrar botão de cancelar
                const formTurmaTitulo = document.getElementById('form-turma-titulo');
                if (formTurmaTitulo) {
                    formTurmaTitulo.textContent = 'Editar Turma';
                }
                
                const btnCancelarTurma = document.getElementById('btn-cancelar-turma');
                if (btnCancelarTurma) {
            btnCancelarTurma.style.display = 'block';
                }
                
                // Armazenar o ID antigo para referência
                turmaIndex.value = turma.id_turma;
                
                // Rolar até o formulário
                const turmaForm = document.getElementById('turmaForm');
                if (turmaForm) {
                    turmaForm.scrollIntoView({behavior: 'smooth'});
                }
            })
            .catch(error => {
                console.error("Erro ao editar turma:", error);
                alert('Erro ao carregar dados da turma: ' + error.message);
                
                // Tentar buscar no localStorage como fallback
        const turmas = JSON.parse(localStorage.getItem('turmas') || '[]');
                const turma = turmas.find(t => t.id_turma === turmaId);
                
                if (turma) {
                    console.log("Usando dados do localStorage como fallback");
                    
                    // Verificar novamente se os elementos existem antes de preencher
                    if (!formModo || !idTurmaInput || !serie || !turno || !tipoTurma || !coordenador || !turmaIndex) {
                        console.error("Elementos do formulário não encontrados no fallback");
                        alert("Erro ao carregar o formulário. Por favor, recarregue a página.");
            return;
        }
        
                    // Preencher o formulário com os dados da turma do localStorage
                    formModo.value = 'editar';
                    idTurmaInput.value = turma.id_turma;
                    serie.value = turma.serie;
                    turno.value = turma.turno;
                    tipoTurma.value = turma.tipo_turma || '';
                    coordenador.value = turma.coordenador || '';
                    
                    // Desabilitar alteração do ID da turma
                    idTurmaInput.disabled = true;
                    
                    // Atualizar título e mostrar botão de cancelar
                    const formTurmaTitulo = document.getElementById('form-turma-titulo');
                    if (formTurmaTitulo) {
                        formTurmaTitulo.textContent = 'Editar Turma';
                    }
                    
                    const btnCancelarTurma = document.getElementById('btn-cancelar-turma');
                    if (btnCancelarTurma) {
                        btnCancelarTurma.style.display = 'block';
                    }
                    
                    // Armazenar o ID antigo para referência
                    turmaIndex.value = turma.id_turma;
                    
                    // Rolar até o formulário
                    const turmaForm = document.getElementById('turmaForm');
                    if (turmaForm) {
                        turmaForm.scrollIntoView({behavior: 'smooth'});
                    }
                } else {
                    alert('Turma não encontrada no sistema.');
                }
            });
    }
    
    // Função para excluir uma turma
    function excluirTurma(turmaId) {
        console.log("Excluindo turma:", turmaId);
        
        // Confirmar exclusão
        if (!confirm(`Tem certeza que deseja excluir a turma ${turmaId}?`)) {
                return;
            }
            
        // Excluir turma via API
        fetch(`http://localhost:4000/api/turmas/${turmaId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir turma: ' + response.statusText);
            }
            
            console.log('Turma excluída com sucesso');
            
            // Também remover do localStorage para manter sincronização
            const turmasLocal = JSON.parse(localStorage.getItem('turmas') || '[]');
            const index = turmasLocal.findIndex(t => t.id_turma === turmaId);
            
            if (index !== -1) {
                turmasLocal.splice(index, 1);
                localStorage.setItem('turmas', JSON.stringify(turmasLocal));
            }
            
            // Registrar atividade no log
            registrarAtividade('excluir', 'turma', turmaId, `Turma ${turmaId} excluída`);
            
            alert('Turma excluída com sucesso!');
            
            // Recarregar lista de turmas
            carregarTurmas();
        })
        .catch(error => {
            console.error('Erro ao excluir turma:', error);
            alert('Erro ao excluir turma: ' + error.message);
        });
    }
    
    // Função para resetar o formulário
    function resetarFormularioTurma() {
        if (!formTurma) return;
        
        formTurma.reset();
        formModo.value = 'novo';
        turmaIndex.value = '';
        document.getElementById('form-turma-titulo').textContent = 'Nova Turma';
        btnCancelarTurma.style.display = 'none';
        
        // Remover readonly do ID
        idTurmaInput.readOnly = false;
    }
    
    // Função para atualizar referências após mudança de ID da turma
    function atualizarReferenciasAposMudancaIdTurma(antigoId, novoId) {
        if (antigoId === novoId) return;
        
        // Atualizar disciplinas
        const disciplinas = JSON.parse(localStorage.getItem('disciplinas') || '[]');
        let disciplinasModificadas = false;
        
        disciplinas.forEach(disciplina => {
            if (disciplina.turmas_vinculadas && disciplina.turmas_vinculadas.includes(antigoId)) {
                const index = disciplina.turmas_vinculadas.indexOf(antigoId);
                disciplina.turmas_vinculadas[index] = novoId;
                disciplinasModificadas = true;
            }
        });
        
        if (disciplinasModificadas) {
            localStorage.setItem('disciplinas', JSON.stringify(disciplinas));
        }
        
        // Atualizar alunos
        const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
        let alunosModificados = false;
        
        alunos.forEach(aluno => {
            if (aluno.id_turma === antigoId) {
                aluno.id_turma = novoId;
                alunosModificados = true;
            }
        });
        
        if (alunosModificados) {
            localStorage.setItem('alunos', JSON.stringify(alunos));
        }
        
        // Atualizar notas
        const notas = JSON.parse(localStorage.getItem('notas') || '[]');
        let notasModificadas = false;
        
        notas.forEach(nota => {
            if (nota.id_turma === antigoId) {
                nota.id_turma = novoId;
                // Atualizar também o nome da turma
                const turma = JSON.parse(localStorage.getItem('turmas') || '[]')
                    .find(t => t.id_turma === novoId);
                if (turma) {
                    nota.nome_turma = turma.serie + ' ' + turma.id_turma;
                }
                notasModificadas = true;
            }
        });
        
        if (notasModificadas) {
            localStorage.setItem('notas', JSON.stringify(notas));
        }
    }
}

// Inicialização do módulo de disciplinas
function initDisciplinas() {
    console.log("Inicializando módulo de disciplinas");
    
    // Elementos do formulário
    const formDisciplina = document.getElementById('form-disciplina');
    const formModoDisciplina = document.getElementById('form-modo-disciplina');
    const disciplinaIndex = document.getElementById('disciplina-index');
    const idDisciplina = document.getElementById('id_disciplina');
    const nomeDisciplina = document.getElementById('nome_disciplina');
    const cargaHoraria = document.getElementById('carga_horaria');
    const vinculoTurmas = document.getElementById('vinculo_turmas');
    const btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
    const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    const disciplinasLista = document.getElementById('disciplinas-lista');
    
    // Carregar disciplinas e turmas para o select
    carregarDisciplinas();
    carregarTurmasSelect();
    
    // Configurar botões do formulário
    if (btnNovaDisciplina) {
        btnNovaDisciplina.onclick = function() {
            if (formDisciplina) formDisciplina.scrollIntoView({behavior: 'smooth'});
        };
    }
    
    if (btnCancelarDisciplina) {
        btnCancelarDisciplina.onclick = function() {
        };
    }
    
    // Configurar formulário
    if (formDisciplina) {
        formDisciplina.addEventListener('submit', function(e) {
            e.preventDefault(); // Impedir o envio padrão do formulário
            console.log("Formulário de disciplina submetido");
            
            // Validar campos obrigatórios
            if (!idDisciplina.value || !nomeDisciplina.value) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Obter turmas selecionadas
            const turmasVinculadas = Array.from(vinculoTurmas.selectedOptions).map(option => option.value);
            
            // Obter valores do formulário já referenciados anteriormente
            const idDisciplinaValue = idDisciplina.value.trim();
            const nomeDisciplinaValue = nomeDisciplina.value.trim();
            const cargaHorariaValue = cargaHoraria.value;
            const modo = formModoDisciplina.value;
            const turmasVinculadasIds = Array.from(vinculoTurmas.selectedOptions).map(option => option.value);
            
            // Montar objeto da disciplina (sem incluir turmas_vinculadas)
            const disciplina = {
                id_disciplina: idDisciplinaValue,
                nome_disciplina: nomeDisciplinaValue,
                carga_horaria: cargaHorariaValue
            };
            console.log("Salvando disciplina:", disciplina, "Modo:", modo);
            console.log("Turmas vinculadas:", turmasVinculadasIds);
            
            // Verificar se já existe uma disciplina com este ID (exceto no modo de edição)
            if (modo === 'novo') {
                // Verificar se já existe uma disciplina com este ID
                fetch(`http://localhost:4000/api/disciplinas/${idDisciplinaValue}`)
                    .then(response => {
                        if (response.ok) {
                            return response.json().then(data => {
                                throw new Error(`Já existe uma disciplina com o código ${idDisciplinaValue}`);
                            });
                        }
                        
                        // Se chegarmos aqui, a disciplina não existe e podemos criar
                        return fetch('http://localhost:4000/api/disciplinas/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(disciplina)
                        });
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao criar disciplina: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log("Disciplina criada com sucesso:", data);
                        
                        // Se tiver turmas selecionadas, vincular as turmas
                        if (turmasVinculadasIds.length > 0) {
                            return vincularTurmasDisciplina(idDisciplinaValue, turmasVinculadasIds);
                        }
                        return Promise.resolve();
                    })
                    .then(() => {
                        // Mostrar mensagem de sucesso
                        alert('Disciplina criada com sucesso!');
                        
                        // Limpar formulário
                        resetarFormularioDisciplina();
                        
                        // Recarregar lista de disciplinas
                        carregarDisciplinas();
                    })
                    .catch(error => {
                        console.error("Erro ao criar disciplina:", error);
                        alert(`Erro ao criar disciplina: ${error.message}`);
                    });
            } else {
                // Modo de edição - Atualizar disciplina existente
                fetch(`http://localhost:4000/api/disciplinas/${idDisciplinaValue}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(disciplina)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao atualizar disciplina: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Disciplina atualizada com sucesso:", data);
                    
                    // Agora remover todos os vínculos antigos e criar os novos
                    return fetch(`http://localhost:4000/api/disciplinas/${idDisciplinaValue}/turmas`, {
                        method: 'DELETE'
                    });
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao remover vínculos antigos: ' + response.statusText);
                    }
                    
                    // Se tiver turmas selecionadas, criar os novos vínculos
                    if (turmasVinculadasIds.length > 0) {
                        return vincularTurmasDisciplina(idDisciplinaValue, turmasVinculadasIds);
                    }
                    return Promise.resolve();
                })
                .then(() => {
                    // Mostrar mensagem de sucesso
                    alert('Disciplina atualizada com sucesso!');
                    
                    // Limpar formulário
                    resetarFormularioDisciplina();
                    
                    // Recarregar lista de disciplinas
                    carregarDisciplinas();
                })
                .catch(error => {
                    console.error("Erro ao atualizar disciplina:", error);
                    alert(`Erro ao atualizar disciplina: ${error.message}`);
                });
            }
        });
    }
    
    // Função para carregar as turmas no select
    function carregarTurmasSelect() {
        console.log("Carregando turmas para o select");
        
        if (!vinculoTurmas) {
            console.error("Elemento vinculoTurmas não encontrado");
            return;
        }
        
        // Mostrar indicador de carregamento
        vinculoTurmas.innerHTML = '<option value="">Carregando turmas...</option>';
        
        // Buscar turmas da API
        fetch('http://localhost:4000/api/turmas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar turmas: ' + response.statusText);
                }
                return response.json();
            })
            .then(turmas => {
                console.log("Turmas recuperadas da API:", turmas.length);
                
                // Limpar select
            vinculoTurmas.innerHTML = '';
            
            if (turmas.length === 0) {
                const option = document.createElement('option');
                option.value = "";
                    option.textContent = "Nenhuma turma cadastrada";
                option.disabled = true;
                vinculoTurmas.appendChild(option);
                return;
            }
            
            // Ordenar turmas por série e ID
            turmas.sort((a, b) => {
                if (a.serie !== b.serie) return a.serie.localeCompare(b.serie);
                return a.id_turma.localeCompare(b.id_turma);
            });
            
            // Adicionar cada turma ao select
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id_turma;
                option.textContent = `${turma.id_turma} - ${turma.serie}`;
                vinculoTurmas.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas:", error);
                vinculoTurmas.innerHTML = '<option value="" disabled>Erro ao carregar turmas</option>';
            });
    }
    
    // Função para carregar disciplinas
    function carregarDisciplinas() {
        console.log("Carregando disciplinas da API");
        
        if (disciplinasLista) {
            // Exibir indicador de carregamento
            disciplinasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
                        </div>
                        <p>Carregando disciplinas...</p>
                    </td>
                </tr>
            `;
            
            // Buscar disciplinas da API
            fetch('http://localhost:4000/api/disciplinas/')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao carregar disciplinas: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(disciplinas => {
                    console.log("Disciplinas recuperadas da API:", disciplinas.length);
                    
                    disciplinasLista.innerHTML = '';
                    
                    if (disciplinas.length === 0) {
                        disciplinasLista.innerHTML = `
                            <tr class="text-center">
                                <td colspan="5">Nenhuma disciplina cadastrada</td>
                            </tr>
                        `;
                        return;
                    }
                    
                    // Ordenar disciplinas por nome
                    disciplinas.sort((a, b) => a.nome_disciplina.localeCompare(b.nome_disciplina));
                    
                    // Obter turmas para exibir nomes das turmas vinculadas
                    const turmas = JSON.parse(localStorage.getItem('turmas') || '[]');
                    
                    // Array para armazenar promessas de busca de turmas vinculadas
                    const promises = [];
                    
                    // Para cada disciplina, criar uma promessa para buscar suas turmas vinculadas
                    disciplinas.forEach(disciplina => {
                        const promise = fetch(`http://localhost:4000/api/disciplinas/${disciplina.id_disciplina}/turmas`)
                            .then(response => {
                                if (!response.ok) {
                                    console.error(`Erro ao carregar turmas para disciplina ${disciplina.id_disciplina}: ${response.statusText}`);
                                    return [];
                                }
                                return response.json();
                            })
                            .then(turmasVinculadas => {
                                // Adicionar a lista de turmas_vinculadas à disciplina
                                disciplina.turmas_vinculadas = turmasVinculadas.map(turma => turma.id_turma);
                                return disciplina;
                            })
                            .catch(error => {
                                console.error(`Erro ao buscar turmas vinculadas para ${disciplina.id_disciplina}:`, error);
                                disciplina.turmas_vinculadas = [];
                                return disciplina;
                            });
                        
                        promises.push(promise);
                    });
                    
                    // Aguardar todas as promessas serem resolvidas
                    Promise.all(promises)
                        .then(() => {
                            // Agora que temos todas as disciplinas com suas turmas vinculadas, podemos exibi-las
                            disciplinasLista.innerHTML = '';
                            
                            disciplinas.forEach(disciplina => {
                                const turmasVinculadasIds = disciplina.turmas_vinculadas || [];
                                
                                // Formatar informações de turmas vinculadas
                                let turmasTexto = 'Nenhuma';
                                if (turmasVinculadasIds.length > 0) {
                                    const turmasVinculadas = turmasVinculadasIds.map(idTurma => {
                                        const turma = turmas.find(t => t.id_turma === idTurma);
                                        return turma ? `${turma.id_turma} (${turma.serie})` : idTurma;
                                    });
                                    turmasTexto = turmasVinculadas.join(', ');
                                }
                                
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td>${disciplina.id_disciplina}</td>
                                    <td>${disciplina.nome_disciplina}</td>
                                    <td>${disciplina.carga_horaria || '-'}</td>
                                    <td>${turmasTexto}</td>
                                    <td class="text-center">
                                        <button type="button" class="btn btn-sm btn-outline-primary editar-disciplina" data-id="${disciplina.id_disciplina}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button type="button" class="btn btn-sm btn-outline-danger excluir-disciplina" data-id="${disciplina.id_disciplina}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                disciplinasLista.appendChild(tr);
                            });
                            
                            // Configurar os botões de ação
                            configurarBotoesDisciplina();
                            
                            // Também salvar no localStorage para manter compatibilidade com o resto do sistema
                            localStorage.setItem('disciplinas', JSON.stringify(disciplinas));
                        });
                })
                .catch(error => {
                    console.error("Erro ao carregar disciplinas:", error);
                    disciplinasLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="5" class="text-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Erro ao carregar disciplinas: ${error.message}
                            </td>
                        </tr>
                    `;
                    
                    // Tentar usar dados do localStorage como fallback
                    const disciplinasLocal = JSON.parse(localStorage.getItem('disciplinas') || '[]');
                    if (disciplinasLocal.length > 0) {
                        console.log("Usando dados de disciplinas do localStorage como fallback");
                        disciplinasLista.innerHTML = '';
                        
                        // Ordenar disciplinas por nome
                        disciplinasLocal.sort((a, b) => a.nome_disciplina.localeCompare(b.nome_disciplina));
                        
                        // Obter turmas para exibir nomes
                        const turmas = JSON.parse(localStorage.getItem('turmas') || '[]');
                        
                        // Adicionar cada disciplina à tabela
                        disciplinasLocal.forEach(disciplina => {
                            // Formatar informações de turmas vinculadas
                            let turmasTexto = 'Nenhuma';
                            if (disciplina.turmas_vinculadas && disciplina.turmas_vinculadas.length > 0) {
                                const turmasVinculadas = disciplina.turmas_vinculadas.map(idTurma => {
                                    const turma = turmas.find(t => t.id_turma === idTurma);
                                    return turma ? `${turma.id_turma} (${turma.serie})` : idTurma;
                                });
                                turmasTexto = turmasVinculadas.join(', ');
                            }
                            
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${disciplina.id_disciplina}</td>
                                <td>${disciplina.nome_disciplina}</td>
                                <td>${disciplina.carga_horaria || '-'}</td>
                                <td>${turmasTexto}</td>
                                <td class="text-center">
                                    <button type="button" class="btn btn-sm btn-outline-primary editar-disciplina" data-id="${disciplina.id_disciplina}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline-danger excluir-disciplina" data-id="${disciplina.id_disciplina}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            `;
                            disciplinasLista.appendChild(tr);
                        });
                        
                        // Configurar os botões de ação
                        configurarBotoesDisciplina();
                    }
                });
        }
    }
    
    // Função para configurar os botões de ação das disciplinas
    function configurarBotoesDisciplina() {
        // Configurar botões de edição
        document.querySelectorAll('.editar-disciplina').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarDisciplina(id);
            });
        });
        
        // Configurar botões de exclusão
        document.querySelectorAll('.excluir-disciplina').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                excluirDisciplina(id);
            });
        });
    }
    
    // Função para editar disciplina
    function editarDisciplina(idDisciplina) {
        console.log("Editando disciplina:", idDisciplina);
        // Verificar se o formulário existe
        const disciplinaForm = document.getElementById('form-disciplina');
        if (!disciplinaForm) {
            console.error("Formulário de disciplina não encontrado");
            alert("Erro ao carregar o formulário. Por favor, recarregue a página.");
            return;
        }
        // Buscar dados da disciplina da API
        fetch(`http://localhost:4000/api/disciplinas/${idDisciplina}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar disciplina: ' + response.statusText);
                }
                return response.json();
            })
            .then(disciplina => {
                console.log("Disciplina recuperada da API:", disciplina);
                
                // Obter os elementos do formulário
                const formModoDisciplina = document.getElementById('form-modo-disciplina');
                const idDisciplinaInput = document.getElementById('id_disciplina');
                const nomeDisciplina = document.getElementById('nome_disciplina');
                const cargaHoraria = document.getElementById('carga_horaria');
                const vinculoTurmas = document.getElementById('vinculo_turmas');
                // Verificar se os elementos existem
                if (!formModoDisciplina || !idDisciplinaInput || !nomeDisciplina || !cargaHoraria) {
                    console.error("Elementos do formulário não encontrados");
                    alert("Erro ao carregar o formulário. Por favor, recarregue a página.");
            return;
        }
                // Preencher o formulário com os dados da disciplina
                formModoDisciplina.value = 'editar';
                idDisciplinaInput.value = disciplina.id_disciplina;
                nomeDisciplina.value = disciplina.nome_disciplina;
                cargaHoraria.value = disciplina.carga_horaria || '';
                // Desabilitar o campo de ID pois estamos editando
                idDisciplinaInput.disabled = true;
                // Buscar turmas vinculadas do banco de dados
                fetch(`http://localhost:4000/api/disciplinas/${idDisciplina}/turmas`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao carregar turmas vinculadas: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(turmasVinculadas => {
                        console.log("Turmas vinculadas recuperadas da API:", turmasVinculadas);
                        
                        // Marcar as turmas vinculadas no formulário
                        if (vinculoTurmas && turmasVinculadas && turmasVinculadas.length > 0) {
                            // Desmarcar todas as opções primeiro
                            for (let i = 0; i < vinculoTurmas.options.length; i++) {
                                vinculoTurmas.options[i].selected = false;
                            }
                            
                            // Marcar as turmas vinculadas
                            turmasVinculadas.forEach(turma => {
                                for (let i = 0; i < vinculoTurmas.options.length; i++) {
                                    if (vinculoTurmas.options[i].value === turma.id_turma) {
                                        vinculoTurmas.options[i].selected = true;
                                        break;
                                    }
                                }
                            });
                        }
                    })
                    .catch(error => {
                        console.error("Erro ao carregar turmas vinculadas:", error);
                    });
                // Atualizar título do formulário e exibir botão cancelar
                const formTitulo = document.getElementById('form-disciplina-titulo');
                if (formTitulo) {
                    formTitulo.textContent = 'Editar Disciplina';
                }
                const btnCancelar = document.getElementById('btn-cancelar-disciplina');
                if (btnCancelar) {
                    btnCancelar.style.display = 'inline-block';
                }
                // Rolar até o formulário
                disciplinaForm.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error("Erro ao carregar disciplina:", error);
                alert("Erro ao carregar a disciplina: " + error.message);
                
                // Restaurar o formulário em caso de erro
                const cardBody = disciplinaForm.querySelector('.card-body');
                if (cardBody) {
                    cardBody.innerHTML = "<div class='alert alert-danger'>Erro ao carregar a disciplina. Por favor, tente novamente.</div>";
                }
            });
    }
    function excluirDisciplina(idDisciplina) {
        if (confirm(`Tem certeza que deseja excluir a disciplina ${idDisciplina}?`)) {
            console.log("Excluindo disciplina:", idDisciplina);
            
            // Enviar solicitação para excluir disciplina via API
            fetch(`http://localhost:4000/api/disciplinas/${idDisciplina}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao excluir disciplina: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log("Disciplina excluída com sucesso:", data);
                
                // Exibir mensagem de sucesso
                alert('Disciplina excluída com sucesso!');
                
                // Recarregar lista de disciplinas
                carregarDisciplinas();
            })
            .catch(error => {
            console.error("Erro ao excluir disciplina:", error);
                alert(`Erro ao excluir disciplina: ${error.message}`);
            });
        }
    }
    // Função auxiliar para restaurar o formulário de disciplina ao estado original
    function resetarFormularioDisciplina() {
        console.log("Resetando formulário de disciplina");
        
        // Elementos do formulário
        const formModoDisciplina = document.getElementById('form-modo-disciplina');
        const disciplinaIndex = document.getElementById('disciplina-index');
        const idDisciplina = document.getElementById('id_disciplina');
        const nomeDisciplina = document.getElementById('nome_disciplina');
        const cargaHoraria = document.getElementById('carga_horaria');
        const vinculoTurmas = document.getElementById('vinculo_turmas');
        const btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
        const formTitulo = document.getElementById('form-disciplina-titulo');
        
        // Resetar valores
        if (formModoDisciplina) formModoDisciplina.value = 'novo';
        if (disciplinaIndex) disciplinaIndex.value = '';
        if (idDisciplina) {
            idDisciplina.value = '';
            idDisciplina.disabled = false;
        }
        if (nomeDisciplina) nomeDisciplina.value = '';
        if (cargaHoraria) cargaHoraria.value = '';
        
        // Desmarcar todas as turmas
        if (vinculoTurmas) {
            for (let i = 0; i < vinculoTurmas.options.length; i++) {
                vinculoTurmas.options[i].selected = false;
            }
        }
        
        // Atualizar título e esconder botão cancelar
        if (formTitulo) formTitulo.textContent = 'Nova Disciplina';
        if (btnCancelarDisciplina) btnCancelarDisciplina.style.display = 'none';
    }
    
    // Função para vincular turmas a uma disciplina
    function vincularTurmasDisciplina(idDisciplina, turmasIds) {
        console.log(`Vinculando ${turmasIds.length} turmas à disciplina ${idDisciplina}`);
        
        // Criar um array de promessas para vincular cada turma
        const promessas = turmasIds.map(idTurma => {
            return fetch(`http://localhost:4000/api/disciplinas/${idDisciplina}/turmas/${idTurma}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao vincular turma ${idTurma}: ${response.statusText}`);
                }
                return response.json();
            });
        });
        
        // Aguardar todas as promessas serem resolvidas
        return Promise.all(promessas)
            .then(resultados => {
                console.log(`${resultados.length} turmas vinculadas com sucesso`);
                return resultados;
            })
            .catch(error => {
                console.error("Erro ao vincular turmas:", error);
                throw new Error(`Erro ao vincular turmas: ${error.message}`);
            });
    }
}

// Inicialização do módulo de professores
function initProfessores() {
    console.log("Inicializando módulo de professores");
    
    // Elementos DOM
    const professoresLista = document.getElementById('professores-lista');
    const formProfessor = document.getElementById('form-professor');
    const vinculoDisciplinas = document.getElementById('vinculo_disciplinas');
    const disciplinasTurmasLista = document.getElementById('disciplinas-turmas-lista');
    const btnNovoProfessor = document.getElementById('btn-novo-professor');
    const btnCancelarProfessor = document.getElementById('btn-cancelar-professor');
    const formProfessorTitulo = document.getElementById('form-professor-titulo');
    const formModoProfessor = document.getElementById('form-modo-professor');
    
    // Verificar se os elementos principais existem
    if (!professoresLista || !formProfessor) {
        console.error("Elementos do módulo de professores não encontrados.");
        return;
    }
    
    // Exibir elementos encontrados para debug
    console.log("Elementos do módulo de professores encontrados:");
    console.log("professoresLista:", professoresLista);
    console.log("formProfessor:", formProfessor);
    console.log("vinculoDisciplinas:", vinculoDisciplinas);
    console.log("btnNovoProfessor:", btnNovoProfessor);
    
    // Carregar professores
    carregarProfessores();
    
    // Carregar tabela de vínculos
    carregarTabelaProfessoresDisciplinasTurmas();
    
    // Carregar disciplinas para o select
    if (vinculoDisciplinas) {
        carregarDisciplinasSelect();
    }
    
    // Inicializar listeners
    if (btnNovoProfessor) {
        btnNovoProfessor.addEventListener('click', function() {
            // Resetar o formulário
            formProfessor.reset();
            formModoProfessor.value = 'novo';
            
            // Atualizar título do formulário
            if (formProfessorTitulo) formProfessorTitulo.textContent = 'Novo Professor';
            
            // Ocultar botão cancelar
            if (btnCancelarProfessor) btnCancelarProfessor.style.display = 'none';
            
            // Habilitar campo de ID
            const idProfessorInput = document.getElementById('id_professor');
            if (idProfessorInput) idProfessorInput.disabled = false;
            
            // Limpar seleções de disciplinas
            if (vinculoDisciplinas) {
                for (let i = 0; i < vinculoDisciplinas.options.length; i++) {
                    vinculoDisciplinas.options[i].selected = false;
                }
            }
            
            // Limpar tabela de disciplinas e turmas
            if (disciplinasTurmasLista) {
                disciplinasTurmasLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="2">Selecione disciplinas para ver as turmas vinculadas</td>
                    </tr>
                `;
            }
            
            // Rolar até o formulário
            formProfessor.scrollIntoView({behavior: 'smooth'});
        });
    }
    
    // Configurar botão cancelar
    if (btnCancelarProfessor) {
        btnCancelarProfessor.addEventListener('click', function() {
            resetFormProfessor();
        });
    }
    
    // Event listener para mudança nas disciplinas selecionadas
    if (vinculoDisciplinas) {
        vinculoDisciplinas.addEventListener('change', function() {
            atualizarTabelaDisciplinasTurmas();
        });
    }
    
    // Configurar formulário
    if (formProfessor) {
        formProfessor.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const idProfessor = document.getElementById('id_professor').value.trim();
            const nomeProfessor = document.getElementById('nome_professor').value.trim();
            const emailProfessor = document.getElementById('email_professor').value.trim();
            const senhaProfessor = document.getElementById('senha_professor').value.trim();
            
            // Validações básicas
            if (!idProfessor || !nomeProfessor) {
                alert('Por favor, preencha o ID e o nome do professor');
                return;
            }
            
            // Capturar disciplinas selecionadas
            const disciplinasSelecionadas = vinculoDisciplinas ? 
                Array.from(vinculoDisciplinas.selectedOptions).map(option => option.value) : [];
            
            console.log("Disciplinas selecionadas:", disciplinasSelecionadas);
            
            // Criar objeto professor
            const professor = {
                id_professor: idProfessor,
                nome_professor: nomeProfessor,
                email_professor: emailProfessor,
                senha_professor: senhaProfessor,
                disciplinas: disciplinasSelecionadas  // Usar a propriedade correta para API
            };
            
            // Verificar se é novo ou edição
            const modo = formModoProfessor.value;
            
            if (modo === 'editar') {
                // Atualizar via API
                fetch(`http://localhost:4000/api/professores/${idProfessor}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(professor)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao atualizar professor: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Professor atualizado com sucesso:", data);
                    
                    // Agora vamos atualizar os vínculos com disciplinas
                    // Primeiro, remover todos os vínculos existentes
                    return fetch(`http://localhost:4000/api/professores/${idProfessor}/disciplinas`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok && response.status !== 404) { // Ignorar 404 (não encontrado)
                            throw new Error('Erro ao remover vínculos existentes: ' + response.statusText);
                        }
                        
                        // Criar vínculos usando o novo endpoint para todas as disciplinas selecionadas
                        console.log("Criando vínculos para disciplinas:", disciplinasSelecionadas);
                        
                        // Para cada disciplina selecionada, criar vínculo usando o novo endpoint
                        const promessas = disciplinasSelecionadas.map(idDisciplina => {
                            // Usar o novo endpoint que corrige os vínculos
                            return fetch('http://localhost:4000/api/professores/vinculos', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    id_professor: idProfessor,
                                    id_disciplina: idDisciplina
                                })
                            })
                            .then(response => {
                                if (!response.ok) {
                                    console.warn(`Aviso ao vincular disciplina ${idDisciplina}: ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                console.log(`Resultado da vinculação para disciplina ${idDisciplina}:`, data);
                                return data;
                            })
                            .catch(err => {
                                console.error(`Erro ao vincular disciplina ${idDisciplina}:`, err);
                                return null;
                            });
                        });
                        
                        // Executar todas as promessas de vinculação
                        return Promise.all(promessas);
                    });
                })
                .then(() => {
                    alert('Professor atualizado com sucesso!');
                    
                    // Resetar formulário e carregar lista atualizada
                    resetFormProfessor();
                    carregarProfessores();
                    carregarTabelaProfessoresDisciplinasTurmas();
                })
                .catch(error => {
                    console.error("Erro ao atualizar professor:", error);
                    alert(`Erro ao atualizar professor: ${error.message}`);
                    
                    // Atualizar no localStorage como fallback
                    const professores = JSON.parse(localStorage.getItem('professores') || '[]');
                    const index = professores.findIndex(p => p.id_professor === idProfessor);
                    
                    if (index !== -1) {
                        professores[index] = professor;
                    } else {
                        professores.push(professor);
                    }
                    
                    localStorage.setItem('professores', JSON.stringify(professores));
                    
                    alert(`Professor ${nomeProfessor} atualizado localmente.`);
                    resetFormProfessor();
                    carregarProfessores();
                });
            } else {
                // Adicionar novo professor via API
                fetch('http://localhost:4000/api/professores', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(professor)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao adicionar professor: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Professor adicionado com sucesso:", data);
                    
                    // Criar vínculos para as disciplinas selecionadas usando o novo endpoint
                    console.log("Criando vínculos para disciplinas:", disciplinasSelecionadas);
                    
                    // Para cada disciplina selecionada, usar o novo endpoint
                    const promessas = disciplinasSelecionadas.map(idDisciplina => {
                        return fetch('http://localhost:4000/api/professores/vinculos', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                id_professor: idProfessor,
                                id_disciplina: idDisciplina
                            })
                        })
                        .then(response => {
                            if (!response.ok) {
                                console.warn(`Aviso ao vincular disciplina ${idDisciplina}: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log(`Resultado da vinculação para disciplina ${idDisciplina}:`, data);
                            return data;
                        })
                        .catch(err => {
                            console.error(`Erro ao vincular disciplina ${idDisciplina}:`, err);
                            return null;
                        });
                    });
                    
                    // Executar todas as promessas de vinculação
                    return Promise.all(promessas);
                })
                .then(() => {
                    alert('Professor adicionado com sucesso!');
                    resetFormProfessor();
                    carregarProfessores();
                    carregarTabelaProfessoresDisciplinasTurmas();
                })
                .catch(error => {
                    console.error("Erro ao adicionar professor:", error);
                    alert(`Erro ao adicionar professor: ${error.message}`);
                    
                    // Adicionar no localStorage como fallback
                    const professores = JSON.parse(localStorage.getItem('professores') || '[]');
                    
                    // Verificar se já existe professor com o mesmo ID
                    if (professores.some(p => p.id_professor === idProfessor)) {
                        alert('Já existe um professor com este ID. Por favor, use outro ID.');
                        return;
                    }
                    
                    professores.push(professor);
                    localStorage.setItem('professores', JSON.stringify(professores));
                    
                    alert(`Professor ${nomeProfessor} adicionado localmente.`);
                    resetFormProfessor();
                    carregarProfessores();
                });
            }
        });
    }
    
    // Função para carregar professores
    function carregarProfessores() {
        console.log("Carregando professores...");
        
        if (!professoresLista) {
            console.error("Lista de professores não encontrada!");
            return;
        }
        
        // Indicador de carregamento
        professoresLista.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Primeiro, buscar disciplinas para ter os nomes corretos
        fetch('http://localhost:4000/api/disciplinas')
            .then(response => response.ok ? response.json() : [])
            .then(disciplinas => {
                // Agora, carregar professores
                return fetch('http://localhost:4000/api/professores')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao carregar professores: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(professores => {
                        console.log("Professores carregados da API:", professores.length);
                        
                        if (professores.length === 0) {
                            professoresLista.innerHTML = `
                                <tr class="text-center">
                                    <td colspan="6">Nenhum professor cadastrado</td>
                                </tr>
                            `;
                            return;
                        }
                        
                        // Limpar a lista existente
                        professoresLista.innerHTML = '';
                        
                        // Criar uma linha na tabela para cada professor
                        const linhasPromessas = professores.map(professor => {
                            // Encontrar nomes das disciplinas
                            let disciplinasNomes = '-';
                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                const nomesDisciplinas = professor.disciplinas.map(idDisc => {
                                    const disc = disciplinas.find(d => d.id_disciplina === idDisc);
                                    return disc ? `${disc.id_disciplina} - ${disc.nome_disciplina}` : idDisc;
                                });
                                disciplinasNomes = nomesDisciplinas.join('<br>');
                            }
                            
                            // Para cada professor com disciplinas, buscar as turmas associadas
                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                // Criar um array de promessas para buscar as turmas de cada disciplina
                                const turmasPromessas = professor.disciplinas.map(disciplinaId => {
                                    return fetch(`http://localhost:4000/api/disciplinas/${disciplinaId}/turmas`)
                                        .then(response => response.ok ? response.json() : [])
                                        .then(turmas => {
                                            // Retornar a lista de turmas para esta disciplina
                                            return {
                                                disciplinaId: disciplinaId,
                                                turmas: turmas
                                            };
                                        });
                                });
                                
                                // Aguardar todas as promessas de turmas
                                return Promise.all(turmasPromessas)
                                    .then(resultadosTurmas => {
                                        // Construir a coluna de turmas
                                        let turmasHTML = '-';
                                        if (resultadosTurmas.length > 0) {
                                            const turmasPorDisciplina = resultadosTurmas.map(resultado => {
                                                const disciplina = disciplinas.find(d => d.id_disciplina === resultado.disciplinaId);
                                                const nomeDisciplina = disciplina ? disciplina.id_disciplina : resultado.disciplinaId;
                                                
                                                if (resultado.turmas.length > 0) {
                                                    const turmasTexto = resultado.turmas.map(t => 
                                                        `${t.id_turma} (${t.serie || 'Série não informada'})`
                                                    ).join(', ');
                                                    return `<strong>${nomeDisciplina}</strong>: ${turmasTexto}`;
                                                } else {
                                                    return `<strong>${nomeDisciplina}</strong>: <span class="text-warning">Nenhuma turma</span>`;
                                                }
                                            });
                                            turmasHTML = turmasPorDisciplina.join('<br>');
                                        }
                                        
                                        // Criar a linha da tabela
                                        const tr = document.createElement('tr');
                                        tr.dataset.professor = professor.id_professor; // Adicionar data attribute para identificar o professor
                                        tr.classList.add('professor-row'); // Adicionar classe para estilização
                                        tr.style.cursor = 'pointer'; // Mudar cursor para indicar que é clicável
                                        
                                        tr.innerHTML = `
                                            <td>${professor.id_professor}</td>
                                            <td>${professor.nome_professor}</td>
                                            <td>${professor.email_professor || '-'}</td>
                                            <td>${disciplinasNomes}</td>
                                            <td>${turmasHTML}</td>
                                            <td class="text-center">
                                                <button class="btn btn-sm btn-primary editar-professor me-1" data-id="${professor.id_professor}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-danger excluir-professor" data-id="${professor.id_professor}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        `;
                                        
                                        // Adicionar evento de clique para detalhar
                                        tr.addEventListener('click', function(e) {
                                            // Não executar se o clique foi em um botão
                                            if (e.target.closest('button')) return;
                                            
                                            // Remover seleção anterior
                                            document.querySelectorAll('.professor-row').forEach(row => {
                                                row.classList.remove('table-primary');
                                            });
                                            
                                            // Adicionar seleção a esta linha
                                            this.classList.add('table-primary');
                                            
                                            // Filtrar a tabela de vínculos para mostrar apenas este professor
                                            const professorId = this.dataset.professor;
                                            mostrarVinculosProfessor(professorId);
                                        });
                                        
                                        return tr;
                                    });
                            } else {
                                // Professor sem disciplinas
                                const tr = document.createElement('tr');
                                tr.dataset.professor = professor.id_professor;
                                tr.classList.add('professor-row');
                                tr.style.cursor = 'pointer';
                                
                                tr.innerHTML = `
                                    <td>${professor.id_professor}</td>
                                    <td>${professor.nome_professor}</td>
                                    <td>${professor.email_professor || '-'}</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-primary editar-professor me-1" data-id="${professor.id_professor}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger excluir-professor" data-id="${professor.id_professor}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                
                                // Adicionar evento de clique para detalhar
                                tr.addEventListener('click', function(e) {
                                    // Não executar se o clique foi em um botão
                                    if (e.target.closest('button')) return;
                                    
                                    // Remover seleção anterior
                                    document.querySelectorAll('.professor-row').forEach(row => {
                                        row.classList.remove('table-primary');
                                    });
                                    
                                    // Adicionar seleção a esta linha
                                    this.classList.add('table-primary');
                                    
                                    // Filtrar a tabela de vínculos para mostrar apenas este professor
                                    const professorId = this.dataset.professor;
                                    mostrarVinculosProfessor(professorId);
                                });
                                
                                return Promise.resolve(tr);
                            }
                        });
                        
                        // Aguardar todas as linhas serem criadas
                        return Promise.all(linhasPromessas)
                            .then(linhas => {
                                // Adicionar todas as linhas à tabela
                                linhas.forEach(linha => {
                                    professoresLista.appendChild(linha);
                                });
                                
                                // Adicionar event listeners aos botões
                                document.querySelectorAll('.editar-professor').forEach(btn => {
                                    btn.addEventListener('click', function() {
                                        const idProfessor = this.getAttribute('data-id');
                                        editarProfessor(idProfessor);
                                    });
                                });
                                
                                document.querySelectorAll('.excluir-professor').forEach(btn => {
                                    btn.addEventListener('click', function() {
                                        const idProfessor = this.getAttribute('data-id');
                                        excluirProfessor(idProfessor);
                                    });
                                });
                            });
                    });
            })
            .catch(error => {
                console.error("Erro ao carregar professores:", error);
                
                // Fallback para localStorage
                const professores = JSON.parse(localStorage.getItem('professores') || '[]');
                
                if (professores.length === 0) {
                    professoresLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="6">Nenhum professor cadastrado (usando cache local)</td>
                        </tr>
                    `;
                    return;
                }
                
                professoresLista.innerHTML = '';
                
                professores.forEach(professor => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${professor.id_professor}</td>
                        <td>${professor.nome_professor}</td>
                        <td>${professor.email_professor || '-'}</td>
                        <td>${professor.disciplinas ? professor.disciplinas.join(', ') : '-'}</td>
                        <td>-</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-primary editar-professor me-1" data-id="${professor.id_professor}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger excluir-professor" data-id="${professor.id_professor}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    professoresLista.appendChild(tr);
                });
                
                // Adicionar event listeners aos botões
                document.querySelectorAll('.editar-professor').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idProfessor = this.getAttribute('data-id');
                        editarProfessor(idProfessor);
                    });
                });
                
                document.querySelectorAll('.excluir-professor').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idProfessor = this.getAttribute('data-id');
                        excluirProfessor(idProfessor);
                    });
                });
            });
    }
    
    // Função para mostrar vínculos específicos de um professor
    function mostrarVinculosProfessor(professorId) {
        console.log("Buscando vínculos do professor diretamente da tabela de relacionamento:", professorId);
        
        // Verificar se a seção de vínculos existe
        const tabelaVinculos = document.getElementById('tabela-vinculos-pdt-corpo');
        if (!tabelaVinculos) {
            console.error("Tabela de vínculos não encontrada!");
            return;
        }
        
        // Atualizar título da seção de vínculos detalhados
        const tituloVinculos = document.getElementById('vinculos-detalhados-titulo');
        if (tituloVinculos) {
            tituloVinculos.textContent = `Vínculos Detalhados - Professor: ${professorId}`;
        }
        
        // Rolar até a seção de vínculos
        if (tituloVinculos) {
            tituloVinculos.scrollIntoView({behavior: 'smooth'});
        }
        
        // Mostrar carregamento na tabela
        tabelaVinculos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Usar o endpoint dinâmico que funciona com qualquer professor
        const apiUrl = `http://localhost:4000/api/buscar_vinculos_professor_completo/${professorId}`;
        console.log("Chamando API:", apiUrl);
        
        fetch(apiUrl)
            .then(response => {
                console.log(`API Vínculos Status: ${response.status} - ${response.statusText}`);
                if (!response.ok) {
                    throw new Error(`Erro ao buscar vínculos (${response.status}): ${response.statusText}`);
                }
                return response.json();
            })
            .then(vinculos => {
                console.log("Vínculos obtidos diretamente da tabela:", vinculos);
                
                // Limpar tabela (removendo o spinner)
                tabelaVinculos.innerHTML = '';
                
                if (!vinculos || vinculos.length === 0) {
                    const row = document.createElement('tr');
                    row.className = 'text-center';
                    row.innerHTML = `
                        <td colspan="4">Professor sem disciplinas e turmas vinculadas</td>
                    `;
                    tabelaVinculos.appendChild(row);
                    return;
                }
                
                // Adicionar cada vínculo à tabela
                vinculos.forEach(vinculo => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${vinculo.nome_professor}</td>
                        <td>${vinculo.id_disciplina} - ${vinculo.nome_disciplina}</td>
                        <td>${vinculo.id_turma} (${vinculo.serie || 'Série não informada'})</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-danger remover-vinculo"
                                data-professor="${vinculo.id_professor}" 
                                data-disciplina="${vinculo.id_disciplina}">
                                <i class="fas fa-unlink"></i>
                            </button>
                        </td>
                    `;
                    tabelaVinculos.appendChild(row);
                });
                
                // Adicionar eventos para os botões de remover vínculo
                document.querySelectorAll('.remover-vinculo').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const professorId = this.getAttribute('data-professor');
                        const disciplinaId = this.getAttribute('data-disciplina');
                        
                        if (confirm(`Deseja remover o vínculo do professor ${professorId} com a disciplina ${disciplinaId}?`)) {
                            removerVinculoProfessorDisciplina(professorId, disciplinaId);
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Erro ao buscar vínculos do professor:", error);
                // Mostrar mensagem de erro na tabela
                tabelaVinculos.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4" class="text-danger">
                            Erro ao carregar vínculos: ${error.message}
                        </td>
                    </tr>
                `;
            });
    }
    
    // Função para carregar a tabela de vínculos detalhados
    function carregarTabelaProfessoresDisciplinasTurmas() {
        console.log("Carregando tabela de vínculos detalhados...");
        
        const tabelaVinculos = document.getElementById('tabela-vinculos-pdt-corpo');
        if (!tabelaVinculos) {
            console.error("Tabela de vínculos não encontrada!");
            return;
        }
        
        // Indicador de carregamento
        tabelaVinculos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Buscar professores, disciplinas e turmas em paralelo
        Promise.all([
            fetch('http://localhost:4000/api/professores').then(response => response.ok ? response.json() : []),
            fetch('http://localhost:4000/api/disciplinas').then(response => response.ok ? response.json() : [])
        ])
        .then(([professores, disciplinas]) => {
            console.log("Professores carregados:", professores.length);
            console.log("Disciplinas carregadas:", disciplinas.length);
            
            if (professores.length === 0) {
                tabelaVinculos.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4">Nenhum professor cadastrado</td>
                    </tr>
                `;
                return;
            }
            
            // Limpar a tabela existente
            tabelaVinculos.innerHTML = '';
            
            // Inicialmente vazio, para ser preenchido com vínculos
            let temVinculos = false;
            let vinculosPromessas = [];
            
            // Para cada professor
            professores.forEach(professor => {
                // Verificar se o professor tem disciplinas
                if (professor.disciplinas && professor.disciplinas.length > 0) {
                    // Para cada disciplina do professor
                    professor.disciplinas.forEach(disciplinaId => {
                        // Encontrar os detalhes da disciplina
                        const disciplina = disciplinas.find(d => d.id_disciplina === disciplinaId);
                        const disciplinaNome = disciplina ? disciplina.nome_disciplina : disciplinaId;
                        
                        // Criar uma promessa para buscar as turmas vinculadas a esta disciplina
                        const promessaTurmas = fetch(`http://localhost:4000/api/disciplinas/${disciplinaId}/turmas`)
                            .then(response => response.ok ? response.json() : [])
                            .then(turmasVinculadas => {
                                // Adicionar uma linha para cada vínculo
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td>${professor.nome_professor}</td>
                                    <td>${disciplinaNome}</td>
                                    <td>${turmasVinculadas.length > 0 
                                        ? turmasVinculadas.map(t => `${t.id_turma} (${t.serie || 'Série não informada'})`).join(', ') 
                                        : '<span class="text-warning">Nenhuma turma vinculada</span>'}
                                    </td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-danger remover-vinculo" 
                                            data-professor="${professor.id_professor}" 
                                            data-disciplina="${disciplinaId}">
                                            <i class="fas fa-unlink"></i>
                                        </button>
                                    </td>
                                `;
                                
                                return tr;
                            })
                            .catch(error => {
                                console.error(`Erro ao buscar turmas da disciplina ${disciplinaId}:`, error);
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td>${professor.nome_professor}</td>
                                    <td>${disciplinaNome}</td>
                                    <td class="text-danger">Erro ao buscar turmas vinculadas</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-danger remover-vinculo" 
                                            data-professor="${professor.id_professor}" 
                                            data-disciplina="${disciplinaId}">
                                            <i class="fas fa-unlink"></i>
                                        </button>
                                    </td>
                                `;
                                return tr;
                            });
                        
                        vinculosPromessas.push(promessaTurmas);
                        temVinculos = true;
                    });
                } else {
                    // Professor sem disciplinas - criar uma linha simples
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${professor.nome_professor}</td>
                        <td colspan="3" class="text-center">Nenhuma disciplina vinculada</td>
                    `;
                    
                    // Criar uma promessa já resolvida com este TR
                    vinculosPromessas.push(Promise.resolve(tr));
                }
            });
            
            if (!temVinculos && professores.length > 0) {
                // Se não temos vínculos mas temos professores
                tabelaVinculos.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4">Nenhum vínculo entre professor e disciplina encontrado</td>
                    </tr>
                `;
                return;
            }
            
            // Aguardar todas as promessas e adicionar os resultados à tabela
            return Promise.all(vinculosPromessas)
                .then(linhas => {
                    // Adicionar todas as linhas à tabela
                    linhas.forEach(linha => {
                        tabelaVinculos.appendChild(linha);
                    });
                    
                    // Adicionar event listeners aos botões de remover vínculo
                    document.querySelectorAll('.remover-vinculo').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const professorId = this.getAttribute('data-professor');
                            const disciplinaId = this.getAttribute('data-disciplina');
                            removerVinculoProfessorDisciplina(professorId, disciplinaId);
                        });
                    });
                });
        })
        .catch(error => {
            console.error("Erro ao carregar vínculos:", error);
            tabelaVinculos.innerHTML = `
                <tr class="text-center">
                    <td colspan="4">Erro ao carregar vínculos: ${error.message}</td>
                </tr>
            `;
        });
    }
    
    // Função para carregar disciplinas no select
    function carregarDisciplinasSelect() {
        if (!vinculoDisciplinas) {
            console.error("Select de disciplinas não encontrado!");
            return;
        }
        
        vinculoDisciplinas.innerHTML = '<option value="" disabled>Carregando disciplinas...</option>';
        
        fetch('http://localhost:4000/api/disciplinas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar disciplinas: ' + response.statusText);
                }
                return response.json();
            })
            .then(disciplinas => {
                vinculoDisciplinas.innerHTML = '';
                
                if (disciplinas.length === 0) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "Nenhuma disciplina cadastrada";
                    option.disabled = true;
                    vinculoDisciplinas.appendChild(option);
                    return;
                }
                
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina;
                    option.textContent = `${disciplina.id_disciplina} - ${disciplina.nome_disciplina}`;
                    vinculoDisciplinas.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar disciplinas:", error);
                vinculoDisciplinas.innerHTML = '<option value="" disabled>Erro ao carregar disciplinas</option>';
            });
    }
    
    // Função para atualizar a tabela de disciplinas e turmas
    function atualizarTabelaDisciplinasTurmas() {
        if (!vinculoDisciplinas || !disciplinasTurmasLista) {
            console.error("Elementos para atualizar tabela não encontrados!");
            return;
        }
        
        const disciplinasSelecionadas = Array.from(vinculoDisciplinas.selectedOptions).map(option => option.value);
        
        if (disciplinasSelecionadas.length === 0) {
            disciplinasTurmasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="2">Selecione disciplinas para ver as turmas vinculadas</td>
                </tr>
            `;
            return;
        }
        
        disciplinasTurmasLista.innerHTML = `
            <tr>
                <td colspan="2" class="text-center">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Buscar apenas as disciplinas selecionadas
        fetch('http://localhost:4000/api/disciplinas')
            .then(response => response.ok ? response.json() : [])
            .then(disciplinas => {
                console.log("Disciplinas carregadas:", disciplinas.length);
                
                // Limpar a tabela
                disciplinasTurmasLista.innerHTML = '';
                
                // Filtrar apenas as disciplinas selecionadas
                const disciplinasFiltradas = disciplinas.filter(d => 
                    disciplinasSelecionadas.includes(d.id_disciplina)
                );
                
                if (disciplinasFiltradas.length === 0) {
                    disciplinasTurmasLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="2">Nenhuma informação disponível para as disciplinas selecionadas</td>
                        </tr>
                    `;
                    return;
                }
                
                // Para cada disciplina selecionada, buscar as turmas diretamente do endpoint específico
                const promessas = disciplinasFiltradas.map(disciplina => {
                    return fetch(`http://localhost:4000/api/disciplinas/${disciplina.id_disciplina}/turmas`)
                        .then(response => response.ok ? response.json() : [])
                        .then(turmas => {
                            console.log(`Turmas vinculadas à disciplina ${disciplina.id_disciplina}:`, turmas);
                            
                            // Se temos turmas, buscar detalhes completos de cada uma
                            if (turmas.length > 0) {
                                // Para cada turma, buscar seus detalhes completos
                                const turmasPromises = turmas.map(turma => {
                                    return fetch(`http://localhost:4000/api/turmas/${turma.id_turma}`)
                                        .then(response => response.ok ? response.json() : null)
                                        .then(detalhes => {
                                            console.log(`Detalhes da turma ${turma.id_turma}:`, detalhes);
                                            return {
                                                id_turma: turma.id_turma,
                                                serie: detalhes ? detalhes.serie : turma.serie || 'Sem série'
                                            };
                                        })
                                        .catch(err => {
                                            console.warn(`Erro ao buscar detalhes da turma ${turma.id_turma}:`, err);
                                            return turma; // Manter a turma original em caso de erro
                                        });
                                });
                                
                                return Promise.all(turmasPromises).then(turmasDetalhadas => {
                                    const tr = document.createElement('tr');
                                    tr.innerHTML = `
                                        <td>${disciplina.id_disciplina} - ${disciplina.nome_disciplina}</td>
                                        <td>${turmasDetalhadas.length > 0 
                                            ? turmasDetalhadas.map(t => `${t.id_turma} (${t.serie || 'Série não informada'})`).join(', ') 
                                            : '<span class="text-warning">Nenhuma turma vinculada</span>'}
                                        </td>
                                    `;
                                    return tr;
                                });
                            } else {
                                const tr = document.createElement('tr');
                                tr.innerHTML = `
                                    <td>${disciplina.id_disciplina} - ${disciplina.nome_disciplina}</td>
                                    <td><span class="text-warning">Nenhuma turma vinculada</span></td>
                                `;
                                return tr;
                            }
                        })
                        .catch(error => {
                            console.error(`Erro ao buscar turmas da disciplina ${disciplina.id_disciplina}:`, error);
                            
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${disciplina.id_disciplina} - ${disciplina.nome_disciplina}</td>
                                <td class="text-danger">Erro ao buscar turmas vinculadas</td>
                            `;
                            
                            return tr;
                        });
                });
                
                // Aguardar todas as promessas e adicionar os resultados à tabela
                Promise.all(promessas)
                    .then(linhas => {
                        if (linhas.length === 0) {
                            disciplinasTurmasLista.innerHTML = `
                                <tr class="text-center">
                                    <td colspan="2">Nenhuma informação disponível</td>
                                </tr>
                            `;
                            return;
                        }
                        
                        // Adicionar todas as linhas à tabela
                        linhas.forEach(linha => {
                            disciplinasTurmasLista.appendChild(linha);
                        });
                    });
            })
            .catch(error => {
                console.error("Erro ao atualizar tabela:", error);
                disciplinasTurmasLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="2">Erro ao carregar informações: ${error.message}</td>
                    </tr>
                `;
            });
    }
    
    // Função para editar professor
    function editarProfessor(idProfessor) {
        console.log(`Editando professor com ID: ${idProfessor}`);
        
        // Buscar dados do professor na API
        fetch(`http://localhost:4000/api/professores/${idProfessor}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar professor: ' + response.statusText);
                }
                return response.json();
            })
            .then(professor => {
                console.log("Dados do professor para edição:", professor);
                
                // Preencher formulário com dados do professor
                document.getElementById('id_professor').value = professor.id_professor;
                document.getElementById('id_professor').readOnly = true;
                document.getElementById('nome_professor').value = professor.nome_professor;
                document.getElementById('email_professor').value = professor.email_professor || '';
                document.getElementById('senha_professor').value = professor.senha_professor || '';
                
                // Marcar disciplinas lecionadas no select múltiplo
                if (vinculoDisciplinas) {
                    // Primeiro, limpar todas as seleções existentes
                    Array.from(vinculoDisciplinas.options).forEach(option => {
                        option.selected = false;
                    });
                    
                    // Verificar se o professor tem disciplinas vinculadas
                    if (professor.disciplinas && Array.isArray(professor.disciplinas)) {
                        console.log("Disciplinas do professor:", professor.disciplinas);
                        
                        // Marcar cada disciplina do professor como selecionada
                        professor.disciplinas.forEach(disciplinaId => {
                            Array.from(vinculoDisciplinas.options).forEach(option => {
                                if (option.value === disciplinaId) {
                                    option.selected = true;
                                }
                            });
                        });
                    } else {
                        console.log("Professor não tem disciplinas ou formato inválido:", professor.disciplinas);
                    }
                    
                    // Atualizar a tabela de disciplinas e turmas
                    atualizarTabelaDisciplinasTurmas();
                }
                
                // Atualizar modo do formulário e título
                formModoProfessor.value = 'editar';
                formProfessorTitulo.textContent = 'Editar Professor';
                
                // Mostrar botão cancelar
                btnCancelarProfessor.style.display = 'block';
                
                // Rolar até o formulário
                formProfessor.scrollIntoView({behavior: 'smooth'});
            })
            .catch(error => {
                console.error("Erro ao buscar professor:", error);
                alert("Erro ao buscar dados do professor. Tentando usar cache local.");
                
                // Tentar buscar do localStorage como fallback
                const professores = JSON.parse(localStorage.getItem('professores') || '[]');
                const professor = professores.find(p => p.id_professor === idProfessor);
                
                if (professor) {
                    // Preencher formulário com dados do cache local
                    document.getElementById('id_professor').value = professor.id_professor;
                    document.getElementById('id_professor').readOnly = true;
                    document.getElementById('nome_professor').value = professor.nome_professor;
                    document.getElementById('email_professor').value = professor.email_professor || '';
                    document.getElementById('senha_professor').value = professor.senha_professor || '';
                    
                    // Marcar disciplinas lecionadas
                    if (vinculoDisciplinas && professor.disciplinas_lecionadas) {
                        Array.from(vinculoDisciplinas.options).forEach(option => {
                            option.selected = professor.disciplinas_lecionadas.includes(option.value);
                        });
                        
                        // Atualizar a tabela de disciplinas e turmas
                        atualizarTabelaDisciplinasTurmas();
                    }
                    
                    // Atualizar modo do formulário e título
                    formModoProfessor.value = 'editar';
                    formProfessorTitulo.textContent = 'Editar Professor';
                    
                    // Mostrar botão cancelar
                    btnCancelarProfessor.style.display = 'block';
                    
                    // Rolar até o formulário
                    formProfessor.scrollIntoView({behavior: 'smooth'});
                } else {
                    alert("Professor não encontrado!");
                }
            });
    }
    
    // Função para excluir professor
    function excluirProfessor(idProfessor) {
        console.log(`Excluindo professor com ID: ${idProfessor}`);
        
        if (confirm(`Tem certeza que deseja excluir o professor com ID ${idProfessor}?`)) {
            // Excluir professor via API
            fetch(`http://localhost:4000/api/professores/${idProfessor}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao excluir professor: ' + response.statusText);
                }
                return response.text();
            })
            .then(() => {
                alert('Professor excluído com sucesso!');
                carregarProfessores();
                carregarTabelaProfessoresDisciplinasTurmas();
            })
            .catch(error => {
                console.error("Erro ao excluir professor:", error);
                alert('Erro ao excluir professor. Usando cache local como fallback.');
                
                // Excluir do localStorage como fallback
                let professores = JSON.parse(localStorage.getItem('professores') || '[]');
                const index = professores.findIndex(p => p.id_professor === idProfessor);
                
                if (index !== -1) {
                    professores.splice(index, 1);
                    localStorage.setItem('professores', JSON.stringify(professores));
                    carregarProfessores();
                } else {
                    alert("Professor não encontrado no cache local!");
                }
            });
        }
    }
    
    // Função para remover vínculo entre professor e disciplina
    function removerVinculoProfessorDisciplina(professorId, disciplinaId) {
        console.log(`Removendo vínculo: Professor ${professorId} - Disciplina ${disciplinaId}`);
        
        if (confirm(`Deseja remover o vínculo entre o professor e a disciplina ${disciplinaId}?`)) {
            // Remover vínculo via API
            fetch(`http://localhost:4000/api/professores/${professorId}/disciplinas/${disciplinaId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao remover vínculo: ' + response.statusText);
                }
                return response.text();
            })
            .then(() => {
                alert('Vínculo removido com sucesso!');
                carregarTabelaProfessoresDisciplinasTurmas();
            })
            .catch(error => {
                console.error("Erro ao remover vínculo:", error);
                alert('Erro ao remover vínculo.');
            });
        }
    }
    
    // Função para resetar o formulário
    function resetFormProfessor() {
        formProfessor.reset();
        formModoProfessor.value = 'novo';
        
        // Atualizar título e esconder botão cancelar
        formProfessorTitulo.textContent = 'Novo Professor';
        btnCancelarProfessor.style.display = 'none';
        
        // Remover readonly do ID
        document.getElementById('id_professor').readOnly = false;
        
        // Desmarcar todas as disciplinas
        if (vinculoDisciplinas) {
            Array.from(vinculoDisciplinas.options).forEach(option => {
                option.selected = false;
            });
        }
        
        // Limpar tabela de disciplinas e turmas
        if (disciplinasTurmasLista) {
            disciplinasTurmasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="2">Selecione disciplinas para ver as turmas vinculadas</td>
                </tr>
            `;
        }
    }
}

// Inicialização do módulo de alunos
function initAlunos() {
    console.log("Inicializando módulo de alunos");
    
    // Elementos do formulário
    const formAluno = document.getElementById('form-aluno');
    const formModoAluno = document.getElementById('form-modo-aluno');
    const alunoIndex = document.getElementById('aluno-index');
    const idAluno = document.getElementById('id_aluno');
    const nomeAluno = document.getElementById('nome_aluno');
    const idTurma = document.getElementById('id_turma');
    const sexo = document.getElementById('sexo');
    const dataNasc = document.getElementById('data_nasc');
    const mae = document.getElementById('mae');
    const btnCancelarAluno = document.getElementById('btn-cancelar-aluno');
    const btnNovoAluno = document.getElementById('btn-novo-aluno');
    const alunosLista = document.getElementById('alunos-lista');
    
    // Verificar se os elementos existem
    if (!formAluno || !alunosLista) {
        console.error("Elementos do módulo de alunos não encontrados.");
        return;
    }
    
    // Carregar alunos e turmas para o select
    carregarAlunos();
    carregarTurmasParaAlunos();
    
    // Configurar botões do formulário
    if (btnNovoAluno) {
        btnNovoAluno.addEventListener('click', function() {
            resetarFormularioAluno();
            if (formAluno) formAluno.scrollIntoView({behavior: 'smooth'});
        });
    }
    
    if (btnCancelarAluno) {
        btnCancelarAluno.addEventListener('click', function() {
            resetarFormularioAluno();
        });
    }
    
    // Configurar formulário
    if (formAluno) {
        formAluno.addEventListener('submit', function(e) {
            e.preventDefault(); // Impedir o envio padrão do formulário
            console.log("Formulário de aluno submetido");
            
            // Validar campos obrigatórios
            if (!idAluno.value || !nomeAluno.value || !idTurma.value || !sexo.value || !dataNasc.value || !mae.value) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Coletar dados do formulário
            const aluno = {
                id_aluno: idAluno.value.trim(),
                nome_aluno: nomeAluno.value.trim(),
                id_turma: idTurma.value,
                sexo: sexo.value,
                data_nasc: dataNasc.value,
                mae: mae.value.trim()
            };
            
            console.log("Dados do aluno:", aluno);
            
            // Verificar modo de operação (novo ou edição)
            if (formModoAluno.value === 'novo') {
                // Adicionar novo aluno via API
                fetch('http://localhost:4000/api/alunos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(aluno)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao adicionar aluno: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Aluno adicionado com sucesso:', data);
                    
                    // Registrar atividade no log
                    registrarAtividade('criar', 'aluno', data.id_aluno, `Novo aluno: ${data.nome_aluno} (Turma: ${data.id_turma})`);
                    
                    alert('Aluno cadastrado com sucesso!');
                    resetarFormularioAluno();
                    carregarAlunos();
                })
                .catch(error => {
                    console.error('Erro ao adicionar aluno:', error);
                    alert('Erro ao adicionar aluno. Usando armazenamento local como fallback.');
                    
                    // Fallback para localStorage
                    let alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
                    if (alunos.some(a => a.id_aluno === aluno.id_aluno)) {
                        alert('Já existe um aluno com este ID. Por favor, use outro ID.');
                        return;
                    }
                    alunos.push(aluno);
                    localStorage.setItem('alunos', JSON.stringify(alunos));
                    resetarFormularioAluno();
                    carregarAlunos();
                });
            } else {
                // Editar aluno existente via API
                fetch(`http://localhost:4000/api/alunos/${aluno.id_aluno}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(aluno)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao atualizar aluno: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Aluno atualizado com sucesso:', data);
                    alert('Aluno atualizado com sucesso!');
                    resetarFormularioAluno();
                    carregarAlunos();
                })
                .catch(error => {
                    console.error('Erro ao atualizar aluno:', error);
                    alert('Erro ao atualizar aluno. Usando armazenamento local como fallback.');
                    
                    // Fallback para localStorage
                    let alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
                    const index = parseInt(alunoIndex.value);
                    if (index >= 0 && index < alunos.length) {
                        const antigoId = alunos[index].id_aluno;
                        alunos[index] = aluno;
                        localStorage.setItem('alunos', JSON.stringify(alunos));
                        
                        // Atualizar referências se o ID mudou
                        if (antigoId !== aluno.id_aluno) {
                            atualizarReferenciasAposMudancaIdAluno(antigoId, aluno.id_aluno);
                        }
                        
                        resetarFormularioAluno();
                        carregarAlunos();
                    }
                });
            }
        });
    }
    
    // Funções auxiliares para o módulo de alunos
    function carregarTurmasParaAlunos() {
        console.log("Carregando turmas para o select de alunos");
        
        if (!idTurma) {
            console.error("Select de turmas para alunos não encontrado!");
            return;
        }
        
        // Mostrar indicador de carregamento
        idTurma.innerHTML = '<option value="">Carregando turmas...</option>';
        
        // Buscar turmas da API
        fetch('http://localhost:4000/api/turmas')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar turmas: ' + response.statusText);
                }
                return response.json();
            })
            .then(turmas => {
                console.log("Turmas recuperadas da API:", turmas.length);
                
                idTurma.innerHTML = '<option value="">Selecione uma turma</option>';
                
                if (turmas.length === 0) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "Nenhuma turma cadastrada";
                    option.disabled = true;
                    idTurma.appendChild(option);
                    return;
                }
                
                // Adicionar cada turma ao select
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id_turma;
                    option.textContent = `${turma.id_turma} - ${turma.serie}`;
                    idTurma.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas para alunos:", error);
                idTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                
                // Tentar carregar do localStorage como fallback
                const turmas = JSON.parse(localStorage.getItem('turmas') || '[]');
                if (turmas.length > 0) {
                    idTurma.innerHTML = '<option value="">Selecione uma turma</option>';
                    turmas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma.id_turma;
                        option.textContent = `${turma.id_turma} - ${turma.serie}`;
                        idTurma.appendChild(option);
                    });
                }
            });
    }
    
    function carregarAlunos() {
        console.log("Carregando alunos");
        
        if (!alunosLista) {
            console.error("Lista de alunos não encontrada!");
            return;
        }
        
        // Mostrar indicador de carregamento
        alunosLista.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Buscar alunos da API
        fetch('http://localhost:4000/api/alunos')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar alunos: ' + response.statusText);
                }
                return response.json();
            })
            .then(alunos => {
                console.log("Alunos recuperados da API:", alunos.length);
                
                if (alunos.length === 0) {
                    alunosLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="7">Nenhum aluno cadastrado</td>
                        </tr>
                    `;
                    return;
                }
                
                // Limpar lista e preenchê-la com os alunos
                alunosLista.innerHTML = '';
                
                // Adicionar cada aluno à lista
                alunos.forEach(aluno => {
                    // Formatar data de nascimento - Corrigindo problema de timezone
                    let dataNascFormatada = '-';
                    if (aluno.data_nasc) {
                        // Garantir que a data seja interpretada no timezone local
                        const [ano, mes, dia] = aluno.data_nasc.split('-');
                        const dataCorrigida = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                        dataNascFormatada = dataCorrigida.toLocaleDateString('pt-BR');
                    }
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${aluno.id_aluno}</td>
                        <td>${aluno.nome_aluno}</td>
                        <td>${aluno.id_turma}</td>
                        <td>${aluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
                        <td>${dataNascFormatada}</td>
                        <td>${aluno.mae}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-primary editar-aluno me-1" data-id="${aluno.id_aluno}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger excluir-aluno" data-id="${aluno.id_aluno}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    alunosLista.appendChild(tr);
                });
                
                // Adicionar eventos para botões de editar e excluir
                document.querySelectorAll('.editar-aluno').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idAluno = this.getAttribute('data-id');
                        editarAluno(idAluno);
                    });
                });
                
                document.querySelectorAll('.excluir-aluno').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idAluno = this.getAttribute('data-id');
                        excluirAluno(idAluno);
                    });
                });
            })
            .catch(error => {
                console.error("Erro ao carregar alunos:", error);
                
                // Tentar carregar do localStorage como fallback
                const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
                
                if (alunos.length === 0) {
                    alunosLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="7">Nenhum aluno cadastrado (usando cache local)</td>
                        </tr>
                    `;
                    return;
                }
                
                alunosLista.innerHTML = '';
                
                // Adicionar cada aluno do localStorage à lista
                alunos.forEach(aluno => {
                    // Formatar data de nascimento - Corrigindo problema de timezone
                    let dataNascFormatada = '-';
                    if (aluno.data_nasc) {
                        // Garantir que a data seja interpretada no timezone local
                        const [ano, mes, dia] = aluno.data_nasc.split('-');
                        const dataCorrigida = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                        dataNascFormatada = dataCorrigida.toLocaleDateString('pt-BR');
                    }
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${aluno.id_aluno}</td>
                        <td>${aluno.nome_aluno}</td>
                        <td>${aluno.id_turma}</td>
                        <td>${aluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
                        <td>${dataNascFormatada}</td>
                        <td>${aluno.mae}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-primary editar-aluno me-1" data-id="${aluno.id_aluno}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger excluir-aluno" data-id="${aluno.id_aluno}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    alunosLista.appendChild(tr);
                });
                
                // Adicionar eventos para botões de editar e excluir
                document.querySelectorAll('.editar-aluno').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idAluno = this.getAttribute('data-id');
                        editarAluno(idAluno);
                    });
                });
                
                document.querySelectorAll('.excluir-aluno').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const idAluno = this.getAttribute('data-id');
                        excluirAluno(idAluno);
                    });
                });
            });
    }
    
    function editarAluno(alunoId) {
        console.log(`Editando aluno com ID: ${alunoId}`);
        
        // Buscar dados do aluno na API
        fetch(`http://localhost:4000/api/alunos/${alunoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar aluno: ' + response.statusText);
                }
                return response.json();
            })
            .then(aluno => {
                // Preencher formulário com dados do aluno
                formModoAluno.value = 'editar';
                idAluno.value = aluno.id_aluno;
                idAluno.readOnly = true; // Tornar ID somente leitura na edição
                nomeAluno.value = aluno.nome_aluno;
                idTurma.value = aluno.id_turma;
                sexo.value = aluno.sexo;
                
                // Formatar a data corretamente para o campo de data HTML
                if (aluno.data_nasc) {
                    // A data já vem no formato ISO (YYYY-MM-DD) do backend, que é o formato esperado
                    // pelo input type="date", então podemos usá-la diretamente
                    dataNasc.value = aluno.data_nasc;
                } else {
                    dataNasc.value = '';
                }
                
                mae.value = aluno.mae;
                
                // Atualizar título e mostrar botão cancelar
                document.getElementById('form-aluno-titulo').textContent = 'Editar Aluno';
                btnCancelarAluno.style.display = 'block';
                
                // Rolar para o formulário
                formAluno.scrollIntoView({behavior: 'smooth'});
            })
            .catch(error => {
                console.error("Erro ao buscar aluno para edição:", error);
                alert("Erro ao buscar dados do aluno. Tentando usar cache local.");
                
                // Tentar buscar do localStorage como fallback
                const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
                const aluno = alunos.find(a => a.id_aluno === alunoId);
                
                if (aluno) {
                    // Preencher formulário com dados do aluno
                    formModoAluno.value = 'editar';
                    alunoIndex.value = alunos.indexOf(aluno);
                    idAluno.value = aluno.id_aluno;
                    idAluno.readOnly = true; // Tornar ID somente leitura na edição
                    nomeAluno.value = aluno.nome_aluno;
                    idTurma.value = aluno.id_turma;
                    sexo.value = aluno.sexo;
                    
                    // Formatar a data corretamente para o campo de data HTML
                    if (aluno.data_nasc) {
                        // A data já vem no formato ISO (YYYY-MM-DD) do backend, que é o formato esperado
                        // pelo input type="date", então podemos usá-la diretamente
                        dataNasc.value = aluno.data_nasc;
                    } else {
                        dataNasc.value = '';
                    }
                    
                    mae.value = aluno.mae;
                    
                    // Atualizar título e mostrar botão cancelar
                    document.getElementById('form-aluno-titulo').textContent = 'Editar Aluno';
                    btnCancelarAluno.style.display = 'block';
                    
                    // Rolar para o formulário
                    formAluno.scrollIntoView({behavior: 'smooth'});
                } else {
                    alert("Aluno não encontrado!");
                }
            });
    }
    
    function excluirAluno(alunoId) {
        console.log(`Excluindo aluno com ID: ${alunoId}`);
        
        // Primeiro buscar os dados do aluno para registrar o nome na atividade
        fetch(`http://localhost:4000/api/alunos/${alunoId}`)
            .then(response => {
                if (!response.ok) {
                    // Se não conseguir buscar, prosseguir com a exclusão mesmo assim
                    return null;
                }
                return response.json();
            })
            .then(aluno => {
                const nomeAluno = aluno ? aluno.nome_aluno : "desconhecido";
                
                if (confirm(`Tem certeza que deseja excluir o aluno ${nomeAluno} (ID: ${alunoId})?`)) {
                    // Excluir aluno via API
                    fetch(`http://localhost:4000/api/alunos/${alunoId}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao excluir aluno: ' + response.statusText);
                        }
                        return response.text();
                    })
                    .then(() => {
                        // Registrar atividade no log
                        registrarAtividade('excluir', 'aluno', alunoId, `Aluno ${nomeAluno} excluído`);
                        
                        alert('Aluno excluído com sucesso!');
                        carregarAlunos();
                    })
                    .catch(error => {
                        console.error("Erro ao excluir aluno:", error);
                        alert('Erro ao excluir aluno. Usando cache local como fallback.');
                        
                        // Excluir do localStorage como fallback
                        let alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
                        const index = alunos.findIndex(a => a.id_aluno === alunoId);
                        
                        if (index !== -1) {
                            alunos.splice(index, 1);
                            localStorage.setItem('alunos', JSON.stringify(alunos));
                            carregarAlunos();
                        } else {
                            alert("Aluno não encontrado no cache local!");
                        }
                    });
                }
            })
            .catch(error => {
                console.error("Erro ao buscar informações do aluno:", error);
                
                // Fallback se não conseguir buscar os dados do aluno
                if (confirm(`Tem certeza que deseja excluir o aluno com ID ${alunoId}?`)) {
                    fetch(`http://localhost:4000/api/alunos/${alunoId}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao excluir aluno: ' + response.statusText);
                        }
                        
                        // Registrar atividade sem o nome do aluno
                        registrarAtividade('excluir', 'aluno', alunoId, `Aluno excluído`);
                        
                        alert('Aluno excluído com sucesso!');
                        carregarAlunos();
                    })
                    .catch(error => {
                        console.error("Erro ao excluir aluno:", error);
                        alert('Erro ao excluir aluno: ' + error.message);
                    });
                }
            });
    }
    
    function resetarFormularioAluno() {
        console.log("Resetando formulário de aluno");
        
        // Resetar formulário
        formAluno.reset();
        formModoAluno.value = 'novo';
        alunoIndex.value = '';
        
        // Remover readonly do ID
        idAluno.readOnly = false;
        
        // Atualizar título e esconder botão cancelar
        document.getElementById('form-aluno-titulo').textContent = 'Novo Aluno';
        btnCancelarAluno.style.display = 'none';
    }
    
    function atualizarReferenciasAposMudancaIdAluno(antigoId, novoId) {
        if (antigoId === novoId) return;
        
        // Neste caso, precisamos atualizar as notas que referenciam este aluno
        // Implementação para manter compatibilidade com o localStorage
        const notas = JSON.parse(localStorage.getItem('notas') || '[]');
        let modificado = false;
        
        notas.forEach(nota => {
            if (nota.id_aluno === antigoId) {
                nota.id_aluno = novoId;
                modificado = true;
            }
        });
        
        if (modificado) {
            localStorage.setItem('notas', JSON.stringify(notas));
        }
    }
}

// Função para inicializar o módulo de notas
function initNotas() {
    console.log("Inicializando módulo de notas");
    
    // Elementos DOM para o gerenciamento de notas
    const tabelaNotas = document.getElementById('tabela-notas');
    const formNota = document.getElementById('form-nota');
    const selectTurmaNota = document.getElementById('turma_nota');
    const selectDisciplinaNota = document.getElementById('disciplina_nota');
    const selectAlunoNota = document.getElementById('aluno_nota');
    const inputAnoNota = document.getElementById('ano_nota');
    const inputBimestre = document.getElementById('bimestre');
    const inputNotaMensal = document.getElementById('nota_mensal');
    const inputNotaBimestral = document.getElementById('nota_bimestral');
    const inputRecuperacao = document.getElementById('recuperacao');
    const inputMedia = document.getElementById('media');
    const formModoNota = document.getElementById('form-modo-nota');
    const formNotaTitulo = document.getElementById('form-nota-titulo');
    const btnCancelarNota = document.getElementById('btn-cancelar-nota');
    const btnSalvarNota = document.getElementById('btn-salvar-nota');
    const notasLista = document.getElementById('notas-lista');
    
    // Elementos de filtro
    const filtroAno = document.getElementById('filtro-ano');
    const filtroBimestre = document.getElementById('filtro-bimestre');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroAluno = document.getElementById('filtro-aluno');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnCalcularMedias = document.getElementById('btn-calcular-medias');
    const btnNovoLancamento = document.getElementById('btn-novo-lancamento');
    
    // Verificar se estamos na página correta
    if (!tabelaNotas) {
        console.log("Módulo de notas não inicializado (página diferente)");
        return;
    }
    
    console.log("Módulo de notas inicializado com sucesso", {
        tabelaNotas, formNota, selectTurmaNota, inputAnoNota, inputBimestre,
        formModoNota, filtroAno, filtroBimestre
    });
    
    // Carregar notas ao inicializar
    carregarNotas();
    
    // PASSO 1: Carregar anos letivos (2025 a 2030)
    if (inputAnoNota) {
        console.log("Carregando anos letivos (2025-2030)");
        inputAnoNota.innerHTML = '';
        for (let ano = 2025; ano <= 2030; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            inputAnoNota.appendChild(option);
        }
        console.log("Anos letivos carregados:", inputAnoNota.innerHTML);
    } else {
        console.error("Elemento 'ano_nota' não encontrado!");
    }
    
    // Inicializar valores do filtro de ano
    if (filtroAno) {
        console.log("Carregando filtro de anos (2025-2030)");
        filtroAno.innerHTML = '<option value="">Todos</option>';
        for (let ano = 2025; ano <= 2030; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAno.appendChild(option);
        }
        console.log("Filtro de anos carregado:", filtroAno.innerHTML);
    } else {
        console.error("Elemento 'filtro-ano' não encontrado!");
    }
    
    // PASSO 2: Carregar bimestres (1 a 4)
    if (inputBimestre) {
        console.log("Carregando bimestres (1-4)");
        inputBimestre.innerHTML = '';
        for (let bimestre = 1; bimestre <= 4; bimestre++) {
            const option = document.createElement('option');
            option.value = bimestre;
            option.textContent = `${bimestre}º Bimestre`;
            inputBimestre.appendChild(option);
        }
        console.log("Bimestres carregados:", inputBimestre.innerHTML);
    } else {
        console.error("Elemento 'bimestre' não encontrado!");
    }
    
    // Inicializar valores do filtro de bimestre
    if (filtroBimestre) {
        console.log("Carregando filtro de bimestres (1-4)");
        filtroBimestre.innerHTML = '<option value="">Todos</option>';
        for (let bimestre = 1; bimestre <= 4; bimestre++) {
            const option = document.createElement('option');
            option.value = bimestre;
            option.textContent = `${bimestre}º Bimestre`;
            filtroBimestre.appendChild(option);
        }
        console.log("Filtro de bimestres carregado:", filtroBimestre.innerHTML);
    } else {
        console.error("Elemento 'filtro-bimestre' não encontrado!");
    }
    
    // PASSO 3: Carregar turmas do banco de dados
    if (selectTurmaNota) {
        console.log("Carregando turmas do banco de dados");
        selectTurmaNota.innerHTML = '<option value="" selected disabled>Carregando turmas...</option>';
        
        fetch('http://localhost:4000/api/turmas')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar turmas: ${response.status}`);
                }
                return response.json();
            })
            .then(turmas => {
                console.log("Turmas carregadas:", turmas);
                selectTurmaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma</option>';
                
                if (turmas.length === 0) {
                    console.warn("Nenhuma turma encontrada no banco de dados");
                    selectTurmaNota.innerHTML = '<option value="" disabled>Nenhuma turma cadastrada</option>';
                } else {
                    turmas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma.id_turma;
                        // Usar o campo serie da turma em vez de nome_turma
                        option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem série'}`;
                        selectTurmaNota.appendChild(option);
                    });
                }
                
                console.log("Select de turmas preenchido:", selectTurmaNota.innerHTML);
                
                // Também carregar turmas para o filtro
                if (filtroTurma) {
                    console.log("Carregando filtro de turmas");
                    filtroTurma.innerHTML = '<option value="">Todas</option>';
                    turmas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma.id_turma;
                        option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem série'}`;
                        filtroTurma.appendChild(option);
                    });
                    console.log("Filtro de turmas preenchido:", filtroTurma.innerHTML);
                }
            })
            .catch(error => {
                console.error("Erro ao carregar turmas:", error);
                selectTurmaNota.innerHTML = '<option value="" disabled>Erro ao carregar turmas</option>';
                if (filtroTurma) {
                    filtroTurma.innerHTML = '<option value="" disabled>Erro ao carregar turmas</option>';
                }
            });
    } else {
        console.error("Elemento 'turma_nota' não encontrado!");
    }
    
    // Carregar disciplinas quando uma turma for selecionada
    if (selectTurmaNota && selectDisciplinaNota) {
        selectTurmaNota.addEventListener('change', function() {
            const idTurma = this.value;
            console.log(`Turma selecionada: ${idTurma}`);
            
            if (!idTurma) {
                console.log("Nenhuma turma selecionada.");
                selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma primeiro</option>';
                selectDisciplinaNota.disabled = true;
                
                if (selectAlunoNota) {
                    selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione uma turma primeiro</option>';
                    selectAlunoNota.disabled = true;
                }
                return;
            }
            
            // Buscar disciplinas da turma
            console.log(`Buscando disciplinas da turma ${idTurma}...`);
            selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Carregando disciplinas...</option>';
            selectDisciplinaNota.disabled = true;
            
            fetch(`http://localhost:4000/api/turmas/${idTurma}/disciplinas`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar disciplinas: ${response.status} ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(disciplinas => {
                    console.log(`Disciplinas da turma ${idTurma}:`, disciplinas);
                    selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina</option>';
                    
                    if (disciplinas.length === 0) {
                        console.warn(`Nenhuma disciplina vinculada à turma ${idTurma}`);
                        selectDisciplinaNota.innerHTML = '<option value="" disabled>Nenhuma disciplina vinculada a esta turma</option>';
                    } else {
                        disciplinas.forEach(disciplina => {
                            const option = document.createElement('option');
                            option.value = disciplina.id_disciplina;
                            option.textContent = disciplina.nome_disciplina;
                            selectDisciplinaNota.appendChild(option);
                        });
                    }
                    
                    // Habilitar o select de disciplinas
                    selectDisciplinaNota.disabled = false;
                    console.log("Select de disciplinas preenchido:", selectDisciplinaNota.innerHTML);
                    
                    // Também carregar disciplinas para o filtro
                    if (filtroDisciplina) {
                        console.log("Carregando filtro de disciplinas");
                        filtroDisciplina.innerHTML = '<option value="">Todas</option>';
                        disciplinas.forEach(disciplina => {
                            const option = document.createElement('option');
                            option.value = disciplina.id_disciplina;
                            option.textContent = disciplina.nome_disciplina;
                            filtroDisciplina.appendChild(option);
                        });
                    }
                })
                .catch(error => {
                    console.error(`Erro ao carregar disciplinas da turma ${idTurma}:`, error);
                    selectDisciplinaNota.innerHTML = '<option value="" disabled>Erro ao carregar disciplinas</option>';
                    selectDisciplinaNota.disabled = true;
                });
                
            // Carregar alunos da turma selecionada
            if (selectAlunoNota) {
                console.log(`Buscando alunos da turma ${idTurma}...`);
                selectAlunoNota.innerHTML = '<option value="" selected disabled>Carregando alunos...</option>';
                selectAlunoNota.disabled = true;
                
                fetch(`http://localhost:4000/api/turmas/${idTurma}/alunos`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao carregar alunos: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(alunos => {
                        console.log(`Alunos da turma ${idTurma}:`, alunos);
                        selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione um aluno</option>';
                        
                        if (alunos.length === 0) {
                            console.warn(`Nenhum aluno cadastrado na turma ${idTurma}`);
                            selectAlunoNota.innerHTML = '<option value="" disabled>Nenhum aluno cadastrado nesta turma</option>';
                        } else {
                            alunos.forEach(aluno => {
                                const option = document.createElement('option');
                                option.value = aluno.id_aluno;
                                option.textContent = aluno.nome_aluno;
                                selectAlunoNota.appendChild(option);
                            });
                        }
                        
                        // Habilitar o select de alunos
                        selectAlunoNota.disabled = false;
                        console.log("Select de alunos preenchido:", selectAlunoNota.innerHTML);
                        
                        // Também carregar alunos para o filtro
                        if (filtroAluno) {
                            console.log("Carregando filtro de alunos");
                            filtroAluno.innerHTML = '<option value="">Todos</option>';
                            alunos.forEach(aluno => {
                                const option = document.createElement('option');
                                option.value = aluno.id_aluno;
                                option.textContent = aluno.nome_aluno;
                                filtroAluno.appendChild(option);
                            });
                        }
                    })
                    .catch(error => {
                        console.error(`Erro ao carregar alunos da turma ${idTurma}:`, error);
                        selectAlunoNota.innerHTML = '<option value="" disabled>Erro ao carregar alunos</option>';
                        selectAlunoNota.disabled = true;
                    });
            }
        });
    }
    
    // Função para calcular a média automaticamente - ATUALIZADA
    function calcularMedia() {
        const notaMensal = parseFloat(inputNotaMensal.value) || 0;
        const notaBimestral = parseFloat(inputNotaBimestral.value) || 0;
        const recuperacao = parseFloat(inputRecuperacao.value) || 0;
        
        // Limpar o campo de média se ambas as notas não estiverem preenchidas
        if (!inputNotaMensal.value || !inputNotaBimestral.value) {
            inputMedia.value = '';
            return;
        }
        
        let media = 0;
        
        // Calcular média normal entre mensal e bimestral
        media = (notaMensal + notaBimestral) / 2;
        
        // Se tem recuperação, a média final é a média entre a média anterior e a recuperação
        if (recuperacao > 0) {
            media = (media + recuperacao) / 2;
        }
        
        // Arredondar para uma casa decimal (sempre para cima)
        media = Math.ceil(media * 10) / 10;
        
        // Atualizar campo de média
        inputMedia.value = media;
    }
    
    // Adicionar evento para atualizar a média quando as notas forem alteradas
    if (inputNotaMensal && inputNotaBimestral && inputRecuperacao) {
        [inputNotaMensal, inputNotaBimestral, inputRecuperacao].forEach(input => {
            input.addEventListener('input', calcularMedia);
        });
    }
    
    // Adicionar evento de cancelamento
    if (btnCancelarNota) {
        btnCancelarNota.addEventListener('click', function() {
            // Resetar formulário e voltar para o modo "novo"
            formNota.reset();
            formModoNota.value = 'novo';
            formNota.removeAttribute('data-nota-id');
            btnCancelarNota.style.display = 'none';
            formNotaTitulo.textContent = 'Novo Lançamento de Notas';
            
            // Recarregar os selects com valores padrão
            if (selectTurmaNota) {
                selectTurmaNota.selectedIndex = 0;
                
                // Limpar e desabilitar os selects dependentes
                if (selectDisciplinaNota) {
                    selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma primeiro</option>';
                    selectDisciplinaNota.disabled = true;
                }
                
                if (selectAlunoNota) {
                    selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione uma turma primeiro</option>';
                    selectAlunoNota.disabled = true;
                }
            }
            
            // Limpar os campos de notas
            if (inputNotaMensal) inputNotaMensal.value = '';
            if (inputNotaBimestral) inputNotaBimestral.value = '';
            if (inputRecuperacao) inputRecuperacao.value = '';
            if (inputMedia) inputMedia.value = '';
        });
    }
    
    // Função para carregar as notas do backend e exibir na tabela
    function carregarNotas(params = {}) {
        if (!notasLista) {
            console.error("Elemento 'notas-lista' não encontrado!");
            return;
        }
        
        console.log("Carregando notas...");
        notasLista.innerHTML = '<tr><td colspan="10" class="text-center">Carregando notas...</td></tr>';
        
        // Construir a URL com os parâmetros de filtro
        let url = 'http://localhost:4000/api/notas/';
        
        // Se houver algum filtro, usar o endpoint de filtro
        if (params.ano || params.bimestre || params.id_turma || params.id_disciplina || params.id_aluno) {
            url = 'http://localhost:4000/api/notas/filtro/';
            const queryParams = [];
            
            if (params.ano) queryParams.push(`ano=${params.ano}`);
            if (params.bimestre) queryParams.push(`bimestre=${params.bimestre}`);
            if (params.id_turma) queryParams.push(`id_turma=${params.id_turma}`);
            if (params.id_disciplina) queryParams.push(`id_disciplina=${params.id_disciplina}`);
            if (params.id_aluno) queryParams.push(`id_aluno=${params.id_aluno}`);
            
            if (queryParams.length > 0) {
                url += '?' + queryParams.join('&');
            }
        } else {
            // Se não tiver filtros, usar o endpoint completo que retorna dados mais formatados
            url = 'http://localhost:4000/api/notas/completo/';
        }
        
        console.log("URL para buscar notas:", url);
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar notas: ${response.status}`);
                }
                return response.json();
            })
            .then(notas => {
                console.log("Notas carregadas:", notas);
                
                if (notas.length === 0) {
                    notasLista.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma nota cadastrada</td></tr>';
                    return;
                }
                
                // Ordenar as notas por aluno e bimestre
                notas.sort((a, b) => {
                    // Primeiro ordenar por nome do aluno
                    const nomeA = a.nome_aluno || a.id_aluno;
                    const nomeB = b.nome_aluno || b.id_aluno;
                    
                    const comparaNome = nomeA.localeCompare(nomeB);
                    
                    // Se os nomes forem iguais, ordenar por bimestre
                    if (comparaNome === 0) {
                        return a.bimestre - b.bimestre;
                    }
                    
                    return comparaNome;
                });
                
                // Limpar a tabela e adicionar as notas
                notasLista.innerHTML = '';
                
                notas.forEach(nota => {
                    const tr = document.createElement('tr');
                    
                    // Adicionar classes de cor com base na média
                    if (nota.media !== null) {
                        if (nota.media >= 6.0) {
                            tr.classList.add('table-success');
                        } else if (nota.media >= 4.0) {
                            tr.classList.add('table-warning');
                        } else {
                            tr.classList.add('table-danger');
                        }
                    }
                    
                    // Certificar-se de que todos os campos existem, caso contrário usar valores alternativos
                    const turma = nota.id_turma || '';
                    const turmaSerie = nota.serie || '';  // Usar o campo serie
                    const nomeDisciplina = nota.nome_disciplina || nota.id_disciplina || '';
                    const nomeAluno = nota.nome_aluno || nota.id_aluno || '';
                    
                    // Exibir a turma com série (se disponível)
                    const turmaDisplay = turmaSerie ? `${turma} - ${turmaSerie}` : turma;
                    
                    tr.innerHTML = `
                        <td>${nota.ano}</td>
                        <td>${nota.bimestre}º Bimestre</td>
                        <td>${turmaDisplay}</td>
                        <td>${nomeDisciplina}</td>
                        <td>${nomeAluno}</td>
                        <td>${nota.nota_mensal !== null ? nota.nota_mensal.toFixed(1) : '-'}</td>
                        <td>${nota.nota_bimestral !== null ? nota.nota_bimestral.toFixed(1) : '-'}</td>
                        <td>${nota.recuperacao !== null ? nota.recuperacao.toFixed(1) : '-'}</td>
                        <td>${nota.media !== null ? (Math.ceil(nota.media * 10) / 10).toFixed(1) : '-'}</td>
                        <td>
                            <button class="btn btn-sm btn-primary btn-editar-nota" data-id="${nota.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-excluir-nota" data-id="${nota.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    notasLista.appendChild(tr);
                });
                
                // Configurar botões de edição e exclusão
                configurarBotoesNotas();
            })
            .catch(error => {
                console.error("Erro ao carregar notas:", error);
                notasLista.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Erro ao carregar notas: ${error.message}</td></tr>`;
            });
    }
    
    // Configurar botões de edição e exclusão
    function configurarBotoesNotas() {
        const botoesEditar = document.querySelectorAll('.btn-editar-nota');
        const botoesExcluir = document.querySelectorAll('.btn-excluir-nota');
        
        botoesEditar.forEach(botao => {
            botao.addEventListener('click', function() {
                const notaId = this.getAttribute('data-id');
                console.log(`Editando nota ${notaId}...`);
                
                // Buscar os dados da nota no servidor
                fetch(`http://localhost:4000/api/notas/${notaId}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao buscar nota: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(nota => {
                        console.log("Nota a ser editada:", nota);
                        
                        // Preencher o formulário com os dados da nota
                        formModoNota.value = 'editar'; // Mudar modo para edição
                        
                        // Preencher campos do formulário
                        inputAnoNota.value = nota.ano;
                        inputBimestre.value = nota.bimestre;
                        
                        // Selecionar a turma e esperar que isso carregue as disciplinas e alunos
                        selectTurmaNota.value = nota.id_turma;
                        
                        // Disparar o evento change para carregar disciplinas e alunos
                        const changeEvent = new Event('change');
                        selectTurmaNota.dispatchEvent(changeEvent);
                        
                        // Função para preencher os campos restantes após carregar disciplinas e alunos
                        const preencherCamposRestantes = () => {
                            if (selectDisciplinaNota.disabled || selectAlunoNota.disabled) {
                                // Ainda está carregando, esperar mais um pouco
                                setTimeout(preencherCamposRestantes, 100);
                                return;
                            }
                            
                            // Agora que disciplinas e alunos foram carregados, selecionar os valores
                            selectDisciplinaNota.value = nota.id_disciplina;
                            selectAlunoNota.value = nota.id_aluno;
                            
                            // Preencher notas
                            inputNotaMensal.value = nota.nota_mensal !== null ? nota.nota_mensal : '';
                            inputNotaBimestral.value = nota.nota_bimestral !== null ? nota.nota_bimestral : '';
                            inputRecuperacao.value = nota.recuperacao !== null ? nota.recuperacao : '';
                            inputMedia.value = nota.media !== null ? nota.media : '';
                            
                            // Mostrar botão de cancelar
                            btnCancelarNota.style.display = 'block';
                            
                            // Atualizar título do formulário
                            formNotaTitulo.textContent = 'Editar Lançamento de Notas';
                            
                            // Guardar o ID da nota para uso no submit
                            formNota.setAttribute('data-nota-id', notaId);
                            
                            // Rolar até o formulário
                            formNota.scrollIntoView({ behavior: 'smooth' });
                        };
                        
                        // Iniciar o processo de preenchimento dos campos restantes
                        setTimeout(preencherCamposRestantes, 100);
                    })
                    .catch(error => {
                        console.error("Erro ao carregar nota para edição:", error);
                        alert(`Erro ao carregar nota para edição: ${error.message}`);
                    });
            });
        });
        
        botoesExcluir.forEach(botao => {
            botao.addEventListener('click', function() {
                const notaId = this.getAttribute('data-id');
                console.log(`Excluir nota ${notaId}`);
                
                if (confirm('Tem certeza que deseja excluir esta nota?')) {
                    fetch(`http://localhost:4000/api/notas/${notaId}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao excluir nota: ${response.status}`);
                        }
                        alert('Nota excluída com sucesso!');
                        carregarNotas(); // Recarregar a lista de notas
                    })
                    .catch(error => {
                        console.error("Erro ao excluir nota:", error);
                        alert(`Erro ao excluir nota: ${error.message}`);
                    });
                }
            });
        });
    }
    
    // Configurar o botão de filtro
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function() {
            const params = {
                ano: filtroAno.value,
                bimestre: filtroBimestre.value,
                id_turma: filtroTurma.value,
                id_disciplina: filtroDisciplina.value,
                id_aluno: filtroAluno.value
            };
            
            console.log("Aplicando filtros:", params);
            carregarNotas(params);
        });
    }
    
    // Configurar o botão de novo lançamento
    if (btnNovoLancamento) {
        btnNovoLancamento.addEventListener('click', function() {
            formNota.reset();
            formModoNota.value = 'novo';
            btnCancelarNota.style.display = 'none';
            formNotaTitulo.textContent = 'Novo Lançamento de Notas';
            
            // Recarregar as opções dos selects
            initNotas();
            
            // Rolar até o formulário
            formNota.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Adicionar event listener para o submit do formulário
    if (formNota) {
        formNota.addEventListener('submit', function(e) {
            e.preventDefault(); // Impedir o comportamento padrão de submit do formulário
            
            console.log("Formulário de notas submetido!");
            
            // Validar campos obrigatórios
            if (!inputAnoNota.value || !inputBimestre.value || !selectTurmaNota.value || 
                !selectDisciplinaNota.value || !selectAlunoNota.value) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Validar que pelo menos uma nota foi preenchida
            if (!inputNotaMensal.value && !inputNotaBimestral.value) {
                alert('Por favor, informe pelo menos a nota mensal ou a nota bimestral.');
                return;
            }
            
            // Calcular a média final para garantir
            calcularMedia();
            
            // Criar objeto com os dados da nota
            const notaData = {
                id_aluno: selectAlunoNota.value,
                id_disciplina: selectDisciplinaNota.value,
                id_turma: selectTurmaNota.value,
                ano: parseInt(inputAnoNota.value),
                bimestre: parseInt(inputBimestre.value),
                nota_mensal: inputNotaMensal.value ? parseFloat(inputNotaMensal.value) : null,
                nota_bimestral: inputNotaBimestral.value ? parseFloat(inputNotaBimestral.value) : null,
                recuperacao: inputRecuperacao.value ? parseFloat(inputRecuperacao.value) : null,
                media: inputMedia.value ? parseFloat(inputMedia.value) : null
            };
            
            // Verificar se é modo de edição ou novo registro
            const isEditMode = formModoNota.value === 'editar';
            const notaId = formNota.getAttribute('data-nota-id');
            
            console.log(`Modo: ${isEditMode ? 'Edição' : 'Novo'}, Nota ID: ${notaId}`);
            console.log("Dados da nota a serem enviados:", notaData);
            
            // Configurar a requisição com base no modo
            let url = 'http://localhost:4000/api/notas/';
            let method = 'POST';
            
            if (isEditMode && notaId) {
                url = `http://localhost:4000/api/notas/${notaId}?override_media=true`;
                method = 'PUT';
            }
            
            // Enviar dados para a API
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(notaData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(error => {
                        throw new Error(`Erro ${response.status}: ${error.detail || 'Falha ao processar nota'}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log(`Nota ${isEditMode ? 'atualizada' : 'salva'} com sucesso:`, data);
                alert(`Nota ${isEditMode ? 'atualizada' : 'registrada'} com sucesso!`);
                
                // Resetar formulário e voltar para o modo "novo"
                formNota.reset();
                formModoNota.value = 'novo';
                formNota.removeAttribute('data-nota-id');
                btnCancelarNota.style.display = 'none';
                formNotaTitulo.textContent = 'Novo Lançamento de Notas';
                
                // Recarregar as notas para atualizar a tabela
                carregarNotas();
            })
            .catch(error => {
                console.error(`Erro ao ${isEditMode ? 'atualizar' : 'salvar'} nota:`, error);
                alert(`Erro ao ${isEditMode ? 'atualizar' : 'salvar'} nota: ${error.message}`);
            });
        });
    }
    
    // Configurar o botão de calcular médias finais
    if (btnCalcularMedias) {
        btnCalcularMedias.addEventListener('click', function() {
            console.log("Calculando médias finais...");
            
            // Coletar parâmetros dos filtros para limitar o cálculo (se necessário)
            const params = {
                ano: filtroAno.value,
                id_turma: filtroTurma.value,
                id_disciplina: filtroDisciplina.value,
                id_aluno: filtroAluno.value
            };
            
            // Remover parâmetros vazios
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });
            
            // Construir a URL com os parâmetros de filtro
            let url = 'http://localhost:4000/api/notas/completo/';
            if (Object.keys(params).length > 0) {
                const queryParams = [];
                Object.keys(params).forEach(key => {
                    queryParams.push(`${key}=${params[key]}`);
                });
                url += '?' + queryParams.join('&');
            }
            
            // Mostrar mensagem de carregamento
            notasLista.innerHTML = '<tr><td colspan="10" class="text-center">Calculando médias finais, aguarde...</td></tr>';
            
            // Buscar todas as notas necessárias
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar notas: ${response.status}`);
                    }
                    return response.json();
                })
                .then(notas => {
                    console.log("Notas carregadas para cálculo:", notas);
                    
                    if (notas.length === 0) {
                        notasLista.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma nota encontrada para calcular médias</td></tr>';
                        return;
                    }
                    
                    // Agrupar notas por aluno, disciplina e turma
                    const notasAgrupadas = {};
                    notas.forEach(nota => {
                        // Criar chave única: id_aluno-id_disciplina-id_turma
                        const chave = `${nota.id_aluno}-${nota.id_disciplina}-${nota.id_turma}`;
                        
                        if (!notasAgrupadas[chave]) {
                            notasAgrupadas[chave] = {
                                id_aluno: nota.id_aluno,
                                nome_aluno: nota.nome_aluno,
                                id_disciplina: nota.id_disciplina,
                                nome_disciplina: nota.nome_disciplina,
                                id_turma: nota.id_turma,
                                serie: nota.serie,
                                ano: nota.ano,
                                notas: {},
                                total_bimestres: 0,
                                soma_medias: 0,
                                media_final: 0
                            };
                        }
                        
                        // Adicionar a nota do bimestre ao grupo
                        notasAgrupadas[chave].notas[nota.bimestre] = {
                            nota_mensal: nota.nota_mensal,
                            nota_bimestral: nota.nota_bimestral,
                            recuperacao: nota.recuperacao,
                            media: nota.media
                        };
                        
                        // Se tiver média válida, adicionar ao cálculo
                        if (nota.media !== null) {
                            notasAgrupadas[chave].total_bimestres++;
                            notasAgrupadas[chave].soma_medias += nota.media;
                        }
                    });
                    
                    // Calcular a média final para cada grupo
                    Object.values(notasAgrupadas).forEach(grupo => {
                        if (grupo.total_bimestres > 0) {
                            grupo.media_final = grupo.soma_medias / grupo.total_bimestres;
                            // Arredondar para uma casa decimal
                            grupo.media_final = Math.round(grupo.media_final * 10) / 10;
                        }
                    });
                    
                    // Ordenar os resultados por turma, disciplina e aluno
                    const resultadosOrdenados = Object.values(notasAgrupadas).sort((a, b) => {
                        if (a.id_turma !== b.id_turma) return a.id_turma.localeCompare(b.id_turma);
                        if (a.nome_disciplina !== b.nome_disciplina) return a.nome_disciplina.localeCompare(b.nome_disciplina);
                        return a.nome_aluno.localeCompare(b.nome_aluno);
                    });
                    
                    // Criar relatório em uma nova janela
                    const janelaRelatorio = window.open('', '_blank', 'width=1000,height=700');
                    
                    let tabelaConteudo = '';
                    if (resultadosOrdenados.length === 0) {
                        tabelaConteudo = `
                            <tr>
                                <td colspan="10" class="text-center">Nenhum registro encontrado com os filtros aplicados</td>
                            </tr>
                        `;
                    } else {
                        resultadosOrdenados.forEach(resultado => {
                            // Determinar a classe de estilo com base na média final
                            let rowClass = '';
                            if (resultado.media_final >= 6.0) {
                                rowClass = 'table-success';
                            } else if (resultado.media_final >= 4.0) {
                                rowClass = 'table-warning';
                            } else {
                                rowClass = 'table-danger';
                            }
                            
                            // Garantir valores para exibição
                            const turma = resultado.id_turma || '';
                            const turmaSerie = resultado.serie || '';
                            const turmaDisplay = turmaSerie ? `${turma} - ${turmaSerie}` : turma;
                            
                            // Preparar o resumo de notas dos bimestres
                            let notasBimestres = '';
                            for (let bim = 1; bim <= 4; bim++) {
                                const notaBim = resultado.notas[bim]?.media || '-';
                                notasBimestres += `${bim}º: ${notaBim !== '-' ? notaBim.toFixed(1) : '-'}, `;
                            }
                            notasBimestres = notasBimestres.slice(0, -2); // Remover a última ", "
                            
                            tabelaConteudo += `
                                <tr class="${rowClass}">
                                    <td>${resultado.nome_aluno}</td>
                                    <td>${turmaDisplay}</td>
                                    <td>${resultado.nome_disciplina}</td>
                                    <td>${resultado.ano}</td>
                                    <td>${resultado.notas[1]?.media?.toFixed(1) || '-'}</td>
                                    <td>${resultado.notas[2]?.media?.toFixed(1) || '-'}</td>
                                    <td>${resultado.notas[3]?.media?.toFixed(1) || '-'}</td>
                                    <td>${resultado.notas[4]?.media?.toFixed(1) || '-'}</td>
                                    <td><strong>${resultado.media_final.toFixed(1)}</strong></td>
                                    <td>
                                        <span class="badge ${resultado.media_final >= 6.0 ? 'bg-success' : resultado.media_final >= 4.0 ? 'bg-warning text-dark' : 'bg-danger'}">
                                            ${resultado.media_final >= 6.0 ? 'Aprovado' : resultado.media_final >= 4.0 ? 'Recuperação' : 'Reprovado'}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        });
                    }
                    
                    // Gerar o conteúdo HTML da janela de relatório
                    janelaRelatorio.document.write(`
                        <!DOCTYPE html>
                        <html lang="pt-BR">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Relatório de Médias Finais</title>
                            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
                            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                            <style>
                                body {
                                    padding: 20px;
                                    font-family: Arial, sans-serif;
                                }
                                .container {
                                    max-width: 1200px;
                                    margin: 0 auto;
                                }
                                .header {
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    margin-bottom: 20px;
                                    padding-bottom: 10px;
                                    border-bottom: 1px solid #dee2e6;
                                }
                                .title {
                                    margin: 0;
                                    color: #0d6efd;
                                }
                                .btn-action {
                                    margin-left: 10px;
                                }
                                .info-box {
                                    background-color: #e7f5ff;
                                    border-left: 4px solid #0d6efd;
                                    padding: 15px;
                                    border-radius: 4px;
                                    margin-bottom: 20px;
                                }
                                .table-container {
                                    overflow-x: auto;
                                    margin-bottom: 20px;
                                }
                                .footer {
                                    margin-top: 20px;
                                    text-align: right;
                                }
                                @media print {
                                    @page {
                                        size: landscape;
                                        margin: 1cm;
                                    }
                                    body {
                                        padding: 0;
                                        margin: 0;
                                    }
                                    .container {
                                        max-width: 100%;
                                        width: 100%;
                                        padding: 0;
                                        margin: 0;
                                    }
                                    .table {
                                        width: 100%;
                                        font-size: 11pt;
                                    }
                                    th, td {
                                        padding: 4px 8px;
                                    }
                                    .no-print {
                                        display: none !important;
                                    }
                                    .header {
                                        border-bottom: 2px solid #000;
                                    }
                                    .table th {
                                        background-color: #f2f2f2 !important;
                                        color: #000 !important;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                    }
                                    .table-success {
                                        background-color: #d4edda !important;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                    }
                                    .table-warning {
                                        background-color: #fff3cd !important;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                    }
                                    .table-danger {
                                        background-color: #f8d7da !important;
                                        -webkit-print-color-adjust: exact;
                                        print-color-adjust: exact;
                                    }
                                    .info-box {
                                        border: 1px solid #dee2e6;
                                        border-left: 4px solid #0d6efd;
                                    }
                                }
                                /* Ajuste de largura das colunas para melhor distribuição */
                                .table th, .table td {
                                    word-break: break-word;
                                }
                                .table th:nth-child(1), .table td:nth-child(1) { width: 15%; } /* Aluno */
                                .table th:nth-child(2), .table td:nth-child(2) { width: 10%; } /* Turma */
                                .table th:nth-child(3), .table td:nth-child(3) { width: 15%; } /* Disciplina */
                                .table th:nth-child(4), .table td:nth-child(4) { width: 6%; } /* Ano */
                                .table th:nth-child(5), .table td:nth-child(5), 
                                .table th:nth-child(6), .table td:nth-child(6),
                                .table th:nth-child(7), .table td:nth-child(7), 
                                .table th:nth-child(8), .table td:nth-child(8) { width: 8%; } /* Bimestres */
                                .table th:nth-child(9), .table td:nth-child(9) { width: 8%; } /* Média Final */
                                .table th:nth-child(10), .table td:nth-child(10) { width: 10%; } /* Situação */
                            </style>
                            <script>
                                // Definir a orientação da página para paisagem
                                window.onload = function() {
                                    // Adicionar um pequeno atraso para garantir que tudo esteja carregado
                                    setTimeout(function() {
                                        // Adicionar evento para configurar a impressão
                                        document.querySelector('.btn-print').addEventListener('click', function() {
                                            window.print();
                                        });
                                    }, 500);
                                }
                            </script>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h2 class="title"><i class="fas fa-chart-line me-2"></i>Relatório de Médias Finais</h2>
                                    <div class="no-print">
                                        <button class="btn btn-primary btn-action btn-print">
                                            <i class="fas fa-print me-1"></i> Imprimir / PDF
                                        </button>
                                        <button class="btn btn-secondary btn-action" onclick="window.close()">
                                            <i class="fas fa-times me-1"></i> Fechar
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="info-box">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Relatório de Médias Finais Anuais</strong><br>
                                    ${Object.keys(params).length > 0 ? 'Filtros aplicados: ' + Object.keys(params).map(k => `${k}=${params[k]}`).join(', ') : 'Todos os registros'}
                                    (${resultadosOrdenados.length} registros)
                                </div>
                                
                                <div class="table-container">
                                    <table class="table table-bordered table-striped">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>Aluno</th>
                                                <th>Turma</th>
                                                <th>Disciplina</th>
                                                <th>Ano</th>
                                                <th>1º Bimestre</th>
                                                <th>2º Bimestre</th>
                                                <th>3º Bimestre</th>
                                                <th>4º Bimestre</th>
                                                <th>Média Final</th>
                                                <th>Situação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${tabelaConteudo}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="footer no-print">
                                    <div class="alert alert-info">
                                        <small><i class="fas fa-lightbulb me-1"></i> Dica: Use o botão "Imprimir / PDF" para salvar como PDF ou imprimir o relatório.</small>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `);
                    
                    janelaRelatorio.document.close();
                    
                    // Restaurar a lista de notas
                    carregarNotas(params);
                })
                .catch(error => {
                    console.error("Erro ao calcular médias finais:", error);
                    notasLista.innerHTML = `<tr><td colspan="10" class="text-center text-danger">Erro ao calcular médias finais: ${error.message}</td></tr>`;
                });
        });
    }
}