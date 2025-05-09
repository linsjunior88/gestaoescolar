// Variáveis globais
const links = {};
const conteudos = {};
let professorId = null;
let professorNome = null;
let professorDisciplinas = [];

// Variáveis para o módulo de notas
let turmasFiltro, disciplinasFiltro, alunosFiltro;
let notasTabela, filtroAno, filtroBimestre, filtroTurma, filtroDisciplina, filtroAluno, btnFiltrar;

// Função para carregar turmas do professor - Precisa estar definida antes de ser usada
function carregarTurmasDoProfessor(idProfessor) {
    console.log('Função carregarTurmasDoProfessor chamada para professor:', idProfessor);
    
    // Se não foi fornecido, tentar obter do sessionStorage
    if (!idProfessor) {
        idProfessor = sessionStorage.getItem('professorId');
        console.log('Tentando recuperar professorId do sessionStorage:', idProfessor);
    }
    
    if (!idProfessor) {
        console.error('ID do professor não fornecido para carregarTurmasDoProfessor');
        return Promise.reject(new Error('ID do professor é obrigatório'));
    }
    
    // Retornar uma promessa para permitir encadeamento
    return fetch(CONFIG.getApiUrl(`/professores/${idProfessor}/turmas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            return response.json();
        })
        .then(turmas => {
            console.log(`Carregadas ${turmas.length} turmas para o professor ${idProfessor}:`, turmas);
            
            // Processar as turmas para garantir formato consistente
            return turmas.map(turma => {
                const id = turma.id_turma || turma.id;
                let nome = turma.nome_turma || turma.nome;
                
                // Se não tiver nome definido, construir um a partir de outras propriedades
                if (!nome) {
                    const serie = turma.serie_turma || '';
                    const turno = turma.turno_turma || '';
                    nome = `${id} - ${serie} ${turno}`.trim();
                    
                    // Se ainda estiver vazio, usar só o ID
                    if (nome === '' || nome === `${id} - `) {
                        nome = id;
                    }
                }
                
                console.log(`Turma processada: id=${id}, nome=${nome}`);
                
                return {
                    id: id,
                    nome: nome,
                    qtdAlunos: turma.qtd_alunos || 0,
                    serie: turma.serie_turma || '',
                    turno: turma.turno_turma || ''
                };
            });
        })
        .catch(error => {
            console.error('Erro em carregarTurmasDoProfessor:', error);
            throw error;
        });
}

// Função para carregar disciplinas do professor - Precisa estar definida antes de ser usada
function carregarDisciplinasDoProfessor(idProfessor) {
    console.log('Função carregarDisciplinasDoProfessor chamada para professor:', idProfessor);
    
    // Se não foi fornecido, tentar obter do sessionStorage
    if (!idProfessor) {
        idProfessor = sessionStorage.getItem('professorId');
        console.log('Tentando recuperar professorId do sessionStorage:', idProfessor);
    }
    
    if (!idProfessor) {
        console.error('ID do professor não fornecido para carregarDisciplinasDoProfessor');
        return Promise.reject(new Error('ID do professor é obrigatório'));
    }
    
    // Retornar uma promessa para permitir encadeamento
    return fetch(CONFIG.getApiUrl(`/professores/${idProfessor}/disciplinas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            console.log(`Carregadas ${disciplinas.length} disciplinas para o professor ${idProfessor}:`, disciplinas);
            
            // Processar as disciplinas para garantir formato consistente
            return disciplinas.map(disciplina => {
                const id = disciplina.id_disciplina || disciplina.id;
                let nome = disciplina.nome_disciplina || disciplina.nome;
                
                // Se não tiver nome definido, usar o ID
                if (!nome) {
                    nome = id;
                }
                
                console.log(`Disciplina processada: id=${id}, nome=${nome}`);
                
                return {
                    id: id,
                    nome: nome
                };
            });
        })
        .catch(error => {
            console.error('Erro em carregarDisciplinasDoProfessor:', error);
            throw error;
        });
}

// Função para carregar alunos de uma turma - Precisa estar definida antes de ser usada
function carregarAlunosDaTurma(idTurma) {
    console.log('Função carregarAlunosDaTurma chamada para turma:', idTurma);
    
    if (!idTurma) {
        console.error('ID da turma não fornecido para carregarAlunosDaTurma');
        return Promise.reject(new Error('ID da turma é obrigatório'));
    }
    
    // Retornar uma promessa para permitir encadeamento
    return fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar alunos: ${response.status}`);
            }
            return response.json();
        })
        .then(alunos => {
            console.log(`Carregados ${alunos.length} alunos para a turma ${idTurma}:`, alunos);
            
            // Processar os alunos para garantir formato consistente
            return alunos.map(aluno => {
                const id = aluno.id_aluno || aluno.id;
                let nome = aluno.nome_aluno || aluno.nome;
                
                // Se não tiver nome definido, usar o ID
                if (!nome) {
                    nome = id;
                }
                
                return {
                    id: id,
                    nome: nome,
                    turma: aluno.id_turma || idTurma
                };
            });
        })
        .catch(error => {
            console.error('Erro em carregarAlunosDaTurma:', error);
            throw error;
        });
}

// Registrar funções globalmente logo no início
window.carregarTurmasDoProfessor = carregarTurmasDoProfessor;
window.carregarDisciplinasDoProfessor = carregarDisciplinasDoProfessor;
window.carregarAlunosDaTurma = carregarAlunosDaTurma;

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log("#### PROFESSOR DASHBOARD MOBILE FIRST v1 ####");
    
    // Verificar se o usuário está autenticado como professor
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile !== 'professor') {
        // Redirecionar para a página de login se não estiver autenticado como professor
        alert('Você precisa fazer login como professor para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }
    
    // Buscar dados do professor da sessão
    professorId = sessionStorage.getItem('professorId');
    professorNome = sessionStorage.getItem('professorNome');
    
    try {
        const disciplinasJson = sessionStorage.getItem('professorDisciplinas');
        professorDisciplinas = disciplinasJson ? JSON.parse(disciplinasJson) : [];
    } catch (e) {
        console.error('Erro ao carregar disciplinas do professor da sessão:', e);
        professorDisciplinas = [];
    }
    
    // Verificar se temos o ID do professor
    if (!professorId) {
        alert('Erro ao carregar dados do professor. Por favor, faça login novamente.');
        window.location.href = 'index.html';
        return;
    }
    
    // Exibir nome do professor no cabeçalho
    document.getElementById('professor-nome').textContent = professorNome || 'Professor';
    
    // Inicializar componentes do dashboard
    initLinks();
    
    // Inicializar o dashboard automaticamente na carga da página
    initDashboard();
    
    // Configurar logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
        if (confirm('Tem certeza que deseja sair?')) {
            // Limpar sessão
            sessionStorage.clear();
            // Redirecionar para a página de login
            window.location.href = 'index.html';
        }
    });
    }
    
    // Adicionar evento ao botão de cancelar nota
    const btnCancelarNota = document.getElementById('btn-cancelar-nota');
    if (btnCancelarNota) {
        btnCancelarNota.addEventListener('click', function(e) {
            e.preventDefault();
            resetarFormularioNota();
        });
    }
    
    // Configurar botão para gerar PDF
    const btnGerarPDF = document.getElementById('btn-gerar-pdf-notas');
    if (btnGerarPDF) {
        btnGerarPDF.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Verificar se há notas carregadas
            const notasLista = document.getElementById('notas-lista');
            if (!notasLista || notasLista.querySelectorAll('tr').length === 0) {
                alert("Não há notas para gerar o relatório. Por favor, filtre alguma turma primeiro.");
                return;
            }
            
            // Chamar a função de geração de PDF
            if (typeof window.gerarPDFNotas === 'function') {
                window.gerarPDFNotas();
            } else {
                console.error("Função gerarPDFNotas não está disponível");
                alert("Função de geração de PDF não está disponível. Recarregue a página e tente novamente.");
            }
        });
    }
    
    // Exportar funções para o escopo global
    window.carregarTurmasDoProfessor = carregarTurmasDoProfessor;
    window.carregarDisciplinasDoProfessor = carregarDisciplinasDoProfessor;
    window.carregarAlunosDaTurma = carregarAlunosDaTurma;
    window.inicializarTabelaNotas = inicializarTabelaNotas;
    window.carregarNotas = carregarNotas;
    window.editarNota = editarNota;
    window.carregarDisciplinasParaFiltro = carregarDisciplinasParaFiltro;
    window.carregarAlunosParaFiltro = carregarAlunosParaFiltro;
    window.handleFormSubmit = handleFormSubmit;
    window.abrirModoLancamentoEmMassa = abrirModoLancamentoEmMassa;
    window.novaNota = novaNota;
});

// Função para inicializar os links do menu
function initLinks() {
    // Mapear os links do menu para seus respectivos conteúdos
    links['dashboard-link'] = document.getElementById('dashboard-link');
    links['alunos-link'] = document.getElementById('alunos-link');
    links['notas-link'] = document.getElementById('notas-link');
    
    conteudos['dashboard-link'] = document.getElementById('conteudo-dashboard');
    conteudos['alunos-link'] = document.getElementById('conteudo-alunos');
    conteudos['notas-link'] = document.getElementById('conteudo-notas');
    
    // Adicionar eventos de clique para alternar entre as seções
    for (const key in links) {
        if (links[key]) {
            links[key].addEventListener('click', function(e) {
                e.preventDefault();
                ativarSecao(key);
                
                // Fechar o menu de navegação mobile se estiver aberto
                const navbarCollapse = document.getElementById('navbarNav');
                if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                    document.querySelector('.navbar-toggler').click();
                }
            });
        }
    }
    
    // Mapear links da navegação inferior mobile
    const bottomNavLinks = {
        'bottom-dashboard-link': 'dashboard-link',
        'bottom-alunos-link': 'alunos-link',
        'bottom-notas-link': 'notas-link'
    };
    
    // Adicionar eventos para a navegação inferior
    for (const bottomId in bottomNavLinks) {
        const bottomLink = document.getElementById(bottomId);
        if (bottomLink) {
            bottomLink.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Ativar a seção correspondente
                const mainLinkId = bottomNavLinks[bottomId];
                ativarSecao(mainLinkId);
                
                // Atualizar estado ativo na navegação inferior
                document.querySelectorAll('.bottom-nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');
            });
        }
    }
    
    // Configurar link de perfil mobile
    const perfilMobileLink = document.getElementById('bottom-perfil-link');
    if (perfilMobileLink) {
        perfilMobileLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Rolar até a seção de perfil no dashboard
            document.getElementById('dashboard-link').click();
            const perfilCard = document.querySelector('.card:has(#perfil-id)');
            if (perfilCard) {
                setTimeout(() => {
                    perfilCard.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        });
    }
}

// Função para ativar a seção selecionada
function ativarSecao(linkId) {
    console.log("Ativando seção para o link:", linkId);
    
    // Atualizar título da página
    const pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) {
        switch (linkId) {
            case 'dashboard-link':
                pageTitleEl.textContent = 'Dashboard';
                break;
            case 'alunos-link':
                pageTitleEl.textContent = 'Meus Alunos';
                break;
            case 'notas-link':
                pageTitleEl.textContent = 'Gestão de Notas';
                break;
            default:
                pageTitleEl.textContent = 'Dashboard';
        }
    }
    
    // Remover classe ativa de todos os links no navbar
    for (const key in links) {
        if (links[key]) {
            links[key].classList.remove('active');
        }
    }
    
    // Adicionar classe ativa ao link clicado no navbar
    if (links[linkId]) {
        links[linkId].classList.add('active');
    }
    
    // Atualizar navegação mobile
    const bottomNavMap = {
        'dashboard-link': 'bottom-dashboard-link',
        'alunos-link': 'bottom-alunos-link',
        'notas-link': 'bottom-notas-link'
    };
    
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const bottomLinkId = bottomNavMap[linkId];
    if (bottomLinkId) {
        const bottomLink = document.getElementById(bottomLinkId);
        if (bottomLink) {
            bottomLink.classList.add('active');
        }
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
        
        // Voltar ao topo para melhor experiência em mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Ações específicas por seção
        if (linkId === 'dashboard-link') {
            initDashboard();
        } else if (linkId === 'alunos-link') {
            initAlunos();
        } else if (linkId === 'notas-link') {
            initNotas();
        }
    }
}

// Função para inicializar o Dashboard
function initDashboard() {
    console.log('Inicializando dashboard do professor...');
    
    // Elementos DOM das estatísticas
    const totalTurmasEl = document.getElementById('total-turmas');
    const totalDisciplinasEl = document.getElementById('total-disciplinas');
    const totalAlunosEl = document.getElementById('total-alunos');
    const totalNotasEl = document.getElementById('total-notas');
    
    // Inicializar contadores com zero
    if (totalTurmasEl) totalTurmasEl.textContent = '0';
    if (totalDisciplinasEl) totalDisciplinasEl.textContent = '0';
    if (totalAlunosEl) totalAlunosEl.textContent = '0';
    if (totalNotasEl) totalNotasEl.textContent = '0';
    
    // Elemento da lista de turmas e disciplinas
    const turmasDisciplinasEl = document.getElementById('lista-turmas-disciplinas');
    
    // Função para decodificar caracteres especiais
    function decodificarTexto(texto) {
        if (!texto) return '';
        // Substituir sequências específicas de caracteres problemáticos
        return texto
            .replace(/Âº/g, 'º') // Correção para caractere "º"
            .replace(/Ã£/g, 'ã')
            .replace(/Ã©/g, 'é')
            .replace(/Ã¡/g, 'á')
            .replace(/Ãª/g, 'ê')
            .replace(/Ã£/g, 'ã')
            .replace(/Ã§/g, 'ç');
    }
    
    // Mostrar indicador de carregamento para estatísticas
    const estatisticasLoadingEl = document.getElementById('estatisticas-loading');
    if (estatisticasLoadingEl) {
        estatisticasLoadingEl.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 100px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando estatísticas...</span>
                </div>
                <span class="ms-2">Carregando estatísticas...</span>
            </div>
        `;
    }
    
    // Buscar estatísticas do professor
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/estatisticas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(estatisticas => {
            console.log('Estatísticas do professor:', estatisticas);
            
            // Atualizar estatísticas no DOM
            if (totalTurmasEl) totalTurmasEl.textContent = estatisticas.total_turmas || '0';
            if (totalDisciplinasEl) totalDisciplinasEl.textContent = estatisticas.total_disciplinas || '0';
            if (totalAlunosEl) totalAlunosEl.textContent = estatisticas.total_alunos || '0';
            if (totalNotasEl) totalNotasEl.textContent = estatisticas.total_notas || '0';
            
            // Remover indicador de carregamento
            if (estatisticasLoadingEl) {
                estatisticasLoadingEl.innerHTML = '';
            }
            
            // Carregar turmas e disciplinas
            carregarTurmasDisciplinas();
            
            // Carregar logs de atividades
            carregarLogsAtividades();
        })
        .catch(error => {
            console.error('Erro ao carregar estatísticas:', error);
            
            // Mostrar mensagem de erro
            if (estatisticasLoadingEl) {
                estatisticasLoadingEl.innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Não foi possível carregar as estatísticas. 
                        <button class="btn btn-sm btn-outline-secondary ms-2" onclick="initDashboard()">
                            <i class="fas fa-sync-alt"></i> Tentar novamente
                        </button>
                    </div>
                `;
            }
            
            // Mesmo com erro nas estatísticas, tentar carregar a lista de turmas e disciplinas
            carregarTurmasDisciplinas();
            
            // E também carregar logs de atividades
            carregarLogsAtividades();
        });
    
    // Função para carregar a lista de turmas e disciplinas
    function carregarTurmasDisciplinas() {
        // Mostrar indicador de carregamento na lista de turmas e disciplinas
        if (turmasDisciplinasEl) {
            turmasDisciplinasEl.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 100px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando turmas e disciplinas...</span>
                    </div>
                    <span class="ms-2">Carregando turmas e disciplinas...</span>
                </div>
            `;
        }
        
        // Buscar turmas do professor
        fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(turmas => {
                console.log('Turmas do professor:', turmas);
                
                if (turmasDisciplinasEl) {
                    if (turmas.length > 0) {
                        // Criar lista de turmas e disciplinas
                        let html = '<div class="list-group">';
                        
                        // Processar cada turma
                        const promessas = turmas.map(turma => {
                            return fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas/${turma.id_turma}/disciplinas`))
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error(`Erro ao carregar disciplinas da turma ${turma.id_turma}`);
                                    }
                                    return response.json();
                                })
                                .then(disciplinas => {
                                    // Retornar objeto com turma e suas disciplinas
                                    return {
                                        turma,
                                        disciplinas
                                    };
                                })
                                .catch(error => {
                                    console.error(`Erro ao carregar disciplinas da turma ${turma.id_turma}:`, error);
                                    // Em caso de erro, retornar a turma com lista vazia de disciplinas
                                    return {
                                        turma,
                                        disciplinas: []
                                    };
                                });
                        });
                        
                        // Após todas as promessas serem resolvidas
                        Promise.all(promessas)
                            .then(resultados => {
                                // Para cada turma e suas disciplinas
                                resultados.forEach(({ turma, disciplinas }) => {
                                    // Adicionar cabeçalho da turma
                                    html += `
                                        <div class="list-group-item list-group-item-action flex-column align-items-start">
                                            <div class="d-flex w-100 justify-content-between mb-2">
                                                <h5 class="mb-1">${turma.id_turma}</h5>
                                                <small>${decodificarTexto(turma.serie_turma) || ''} ${decodificarTexto(turma.turno_turma) || ''} 
                                                <span class="badge bg-secondary ms-1">${turma.qtd_alunos || 0} alunos</span></small>
                                            </div>
                                    `;
                                    
                                    // Se houver disciplinas, listar
                                    if (disciplinas.length > 0) {
                                        html += '<div class="d-flex flex-wrap gap-1 mb-1">';
                                        disciplinas.forEach(disciplina => {
                                            html += `
                                                <span class="badge bg-primary">
                                                    ${disciplina.nome_disciplina || disciplina.id_disciplina}
                                                </span>
                                            `;
                                        });
                                        html += '</div>';
                                    } else {
                                        // Mensagem caso não haja disciplinas
                                        html += `
                                            <p class="mb-1 text-muted">
                                                <small>Nenhuma disciplina encontrada para esta turma</small>
                                            </p>
                                        `;
                                    }
                                    
                                    // Botões de ação
                                    html += `
                                            <div class="mt-2">
                                                <button class="btn btn-sm btn-outline-primary" 
                                                   onclick="verAlunosTurma('${turma.id_turma}')">
                                                    <i class="fas fa-users"></i> Ver Alunos
                                                </button>
                                                <button class="btn btn-sm btn-outline-secondary" 
                                                   onclick="lancarNotasTurma('${turma.id_turma}')">
                                                    <i class="fas fa-edit"></i> Lançar Notas
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                });
                                
                                html += '</div>';
                                turmasDisciplinasEl.innerHTML = html;
                            })
                            .catch(error => {
                                console.error('Erro ao processar lista de turmas e disciplinas:', error);
                                turmasDisciplinasEl.innerHTML = `
                                    <div class="alert alert-danger" role="alert">
                                        <i class="fas fa-exclamation-circle"></i> 
                                        Erro ao processar turmas e disciplinas: ${error.message}
                                    </div>
                                `;
                            });
                    } else {
                        // Caso não haja turmas
                        turmasDisciplinasEl.innerHTML = `
                            <div class="alert alert-info" role="alert">
                                <i class="fas fa-info-circle"></i> 
                                Você não possui turmas atribuídas. Entre em contato com a coordenação.
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao carregar turmas para o dashboard:', error);
                
                // Mostrar mensagem de erro
                if (turmasDisciplinasEl) {
                    turmasDisciplinasEl.innerHTML = `
                        <div class="alert alert-danger" role="alert">
                            <i class="fas fa-exclamation-circle"></i> 
                            Não foi possível carregar suas turmas. 
                            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="carregarTurmasDisciplinas()">
                                <i class="fas fa-sync-alt"></i> Tentar novamente
                            </button>
                        </div>
                    `;
                }
            });
    }
    
    // Carregar últimas notas lançadas
    carregarUltimasNotas();
    
    // Carregar disciplinas do professor para a tabela
    carregarDisciplinasProfessor();
    
    // Carregar dados do perfil do professor
    carregarPerfilProfessor();
    
    // Função para carregar o perfil do professor
    function carregarPerfilProfessor() {
        const perfilIdEl = document.getElementById('perfil-id');
        const perfilNomeEl = document.getElementById('perfil-nome');
        const perfilEmailEl = document.getElementById('perfil-email');
        const perfilDisciplinasEl = document.getElementById('perfil-disciplinas');
        
        // Preencher os dados que já temos da sessão
        if (perfilIdEl) perfilIdEl.textContent = professorId || '-';
        if (perfilNomeEl) perfilNomeEl.textContent = professorNome || '-';
        
        // Buscar detalhes do professor
        fetch(CONFIG.getApiUrl(`/professores/${professorId}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(professor => {
                console.log('Dados do professor para perfil:', professor);
                
                // Preencher os dados do professor
                if (perfilIdEl) perfilIdEl.textContent = professor.id_professor || professorId || '-';
                if (perfilNomeEl) perfilNomeEl.textContent = professor.nome_professor || professorNome || '-';
                if (perfilEmailEl) perfilEmailEl.textContent = professor.email_professor || '-';
                
                // Buscar disciplinas para exibir no perfil
                fetch(CONFIG.getApiUrl(`/professores/${professorId}/disciplinas`))
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro na requisição: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(disciplinas => {
                        // Preencher as disciplinas
                        if (perfilDisciplinasEl) {
                            if (disciplinas.length > 0) {
                                const disciplinasStr = disciplinas.map(d => 
                                    decodificarTexto(d.nome_disciplina) || d.id_disciplina
                                ).join(', ');
                                perfilDisciplinasEl.textContent = disciplinasStr;
                            } else {
                                perfilDisciplinasEl.textContent = 'Nenhuma disciplina atribuída';
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Erro ao carregar disciplinas para o perfil:', error);
                        if (perfilDisciplinasEl) {
                            perfilDisciplinasEl.textContent = 'Erro ao carregar disciplinas';
                        }
                    });
            })
            .catch(error => {
                console.error('Erro ao carregar dados do professor para o perfil:', error);
                // Manter os dados da sessão já preenchidos
            });
    }
    
    // Função para carregar as disciplinas do professor para a tabela
    function carregarDisciplinasProfessor() {
        const disciplinasListaEl = document.getElementById('professor-disciplinas-lista');
        
        if (!disciplinasListaEl) return;
        
        // Mostrar indicador de carregamento
        disciplinasListaEl.innerHTML = `
            <tr class="text-center">
                <td colspan="3">Carregando...</td>
            </tr>
        `;
        
        // Buscar disciplinas do professor
        fetch(CONFIG.getApiUrl(`/professores/${professorId}/disciplinas`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(disciplinas => {
                console.log('Disciplinas do professor para tabela:', disciplinas);
                
                if (disciplinas.length === 0) {
                    disciplinasListaEl.innerHTML = `
                        <tr class="text-center">
                            <td colspan="3">
                                <div class="alert alert-info mb-0">
                                    <i class="fas fa-info-circle"></i> Nenhuma disciplina encontrada
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Para cada disciplina, buscar as turmas e alunos
                let html = '';
                const promessas = disciplinas.map(disciplina => {
                    return fetch(CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}/turmas`))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar turmas da disciplina ${disciplina.id_disciplina}`);
                            }
                            return response.json();
                        })
                        .then(turmas => {
                            // Filtrar apenas as turmas do professor
                            return Promise.all(turmas.map(turma => {
                                return fetch(CONFIG.getApiUrl(`/turmas/${turma.id_turma}/alunos`))
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error(`Erro ao carregar alunos da turma ${turma.id_turma}`);
                                        }
                                        return response.json();
                                    })
                                    .then(alunos => {
                                        return {
                                            ...turma,
                                            alunos: alunos.length
                                        };
                                    })
                                    .catch(error => {
                                        console.error(`Erro ao carregar alunos da turma ${turma.id_turma}:`, error);
                                        return {
                                            ...turma,
                                            alunos: 0
                                        };
                                    });
                            }));
                        })
                        .then(turmasComAlunos => {
                            return {
                                disciplina,
                                turmas: turmasComAlunos
                            };
                        })
                        .catch(error => {
                            console.error(`Erro ao carregar turmas da disciplina ${disciplina.id_disciplina}:`, error);
                            return {
                                disciplina,
                                turmas: []
                            };
                        });
                });
                
                Promise.all(promessas)
                    .then(resultados => {
                        resultados.forEach(({ disciplina, turmas }) => {
                            const totalAlunos = turmas.reduce((total, turma) => total + turma.alunos, 0);
                            const turmasStr = turmas.map(t => t.id_turma).join(', ') || '-';
                            
                            html += `
                                <tr>
                                    <td>${decodificarTexto(disciplina.nome_disciplina) || disciplina.id_disciplina}</td>
                                    <td>${turmasStr}</td>
                                    <td>${totalAlunos}</td>
                                </tr>
                            `;
                        });
                        
                        disciplinasListaEl.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Erro ao processar disciplinas do professor:', error);
                        disciplinasListaEl.innerHTML = `
                            <tr class="text-center">
                                <td colspan="3">
                                    <div class="alert alert-danger mb-0">
                                        <i class="fas fa-exclamation-circle"></i> 
                                        Erro ao processar disciplinas: ${error.message}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
            })
            .catch(error => {
                console.error('Erro ao carregar disciplinas do professor:', error);
                disciplinasListaEl.innerHTML = `
                    <tr class="text-center">
                        <td colspan="3">
                            <div class="alert alert-danger mb-0">
                                <i class="fas fa-exclamation-circle"></i> 
                                Erro ao carregar disciplinas: ${error.message}
                            </div>
                        </td>
                    </tr>
                `;
            });
    }
    
    // Função para carregar as últimas notas lançadas pelo professor
    function carregarUltimasNotas() {
        const ultimasNotasEl = document.getElementById('ultimas-notas');
        
        if (ultimasNotasEl) {
            // Mostrar indicador de carregamento
            ultimasNotasEl.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="height: 100px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando últimas notas...</span>
                    </div>
                    <span class="ms-2">Carregando últimas notas...</span>
                </div>
            `;
            
            // Buscar as últimas notas do professor (limitando a 5)
            fetch(CONFIG.getApiUrl(`/notas/por_professor/${professorId}?limit=5`))
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro na requisição: ${response.status}`);
                    }
                    return response.json();
                })
                .then(notas => {
                    console.log('Últimas notas do professor:', notas);
                    
                    if (notas.length > 0) {
                        // Criar lista de últimas notas
                        let html = '<div class="list-group">';
                        
                        notas.forEach(nota => {
                            // Calcular a média final para cada nota
                            let media = 0;
                            let mediaClasse = '';
                            
                            if (nota.nota_mensal !== null && nota.nota_bimestral !== null) {
                                media = (parseFloat(nota.nota_mensal) + parseFloat(nota.nota_bimestral)) / 2;
                                
                                if (nota.recuperacao !== null) {
                                    media = (media + parseFloat(nota.recuperacao)) / 2;
                                }
                                
                                // Arredondar para uma casa decimal (arredondando para cima)
                                media = Math.ceil(media * 10) / 10;
                                
                                // Definir classe CSS com base na média
                                if (media >= 7) {
                                    mediaClasse = 'text-success';
                                } else if (media >= 5) {
                                    mediaClasse = 'text-warning';
                                } else {
                                    mediaClasse = 'text-danger';
                                }
                            }
                            
                            // Formatar data de criação/atualização
                            const data = new Date(nota.updatedAt || nota.createdAt);
                            const dataFormatada = data.toLocaleDateString('pt-BR');
                            
                            html += `
                                <div class="list-group-item list-group-item-action">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">${nota.nome_aluno || 'Aluno ID: ' + nota.id_aluno}</h6>
                                        <small>${dataFormatada}</small>
                                    </div>
                                    <p class="mb-1">
                                        Disciplina: ${nota.nome_disciplina || nota.id_disciplina} | 
                                        Turma: ${nota.id_turma} | 
                                        Bim: ${nota.bimestre}
                                    </p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small>
                                            M: ${nota.nota_mensal !== null ? nota.nota_mensal : '-'} | 
                                            B: ${nota.nota_bimestral !== null ? nota.nota_bimestral : '-'} | 
                                            R: ${nota.recuperacao !== null ? nota.recuperacao : '-'}
                                        </small>
                                        <span class="badge ${mediaClasse}">
                                            Média: ${media ? media.toFixed(1) : '-'}
                                        </span>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += '</div>';
                        ultimasNotasEl.innerHTML = html;
                    } else {
                        // Caso não haja notas
                        ultimasNotasEl.innerHTML = `
                            <div class="alert alert-info" role="alert">
                                <i class="fas fa-info-circle"></i> Você ainda não lançou nenhuma nota.
                            </div>
                        `;
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar últimas notas:', error);
                    
                    // Mostrar mensagem de erro
                    ultimasNotasEl.innerHTML = `
                        <div class="alert alert-warning" role="alert">
                            <i class="fas fa-exclamation-triangle"></i> 
                            Não foi possível carregar as últimas notas. 
                            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="carregarUltimasNotas()">
                                <i class="fas fa-sync-alt"></i> Tentar novamente
                            </button>
                        </div>
                    `;
                });
        }
    }
}

// Função para carregar logs de atividades recentes do professor
function carregarLogsAtividades() {
    console.log("Carregando logs de atividades do professor");
    
    // Elemento que contém as atividades recentes
    const logsAtividadesEl = document.getElementById('logs-atividades');
    
    if (!logsAtividadesEl) {
        console.error("Elemento de logs de atividades não encontrado");
        return;
    }
    
    // Exibir mensagem de carregamento
    logsAtividadesEl.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 100px;">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <span class="ms-2">Carregando atividades recentes...</span>
        </div>
    `;
    
    // Buscar logs de atividades via API (últimos 10 registros do professor)
    fetch(CONFIG.getApiUrl('/logs?limit=10&usuario=' + encodeURIComponent(professorNome)))
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    // A tabela de logs ainda não existe, vamos criar
                    return fetch(CONFIG.getApiUrl('/logs/criar-tabela'), {
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
            console.log("Logs de atividades do professor:", logs);
            
            // Verificar se temos logs para exibir
            if (!logs || logs.length === 0) {
                logsAtividadesEl.innerHTML = `
                    <div class="alert alert-info" role="alert">
                        <i class="fas fa-info-circle"></i> 
                        Nenhum registro de atividade encontrado.
                        As atividades serão registradas conforme você utilizar o sistema.
                    </div>
                `;
                return;
            }
            
            // Criar uma timeline com os logs
            let html = `<div class="timeline-container">`;
            
            logs.forEach((log, index) => {
                // Formatar a data
                const dataHora = new Date(log.data_hora);
                const dataFormatada = dataHora.toLocaleDateString('pt-BR');
                const horaFormatada = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                // Determinar o ícone com base na ação
                let icone = 'fa-info-circle';
                let corIcone = 'text-primary';
                
                if (log.acao === 'criação') {
                    icone = 'fa-plus-circle';
                    corIcone = 'text-success';
                } else if (log.acao === 'atualização') {
                    icone = 'fa-edit';
                    corIcone = 'text-warning';
                } else if (log.acao === 'exclusão') {
                    icone = 'fa-trash';
                    corIcone = 'text-danger';
                } else if (log.acao === 'consulta') {
                    icone = 'fa-search';
                    corIcone = 'text-info';
                }
                
                // Formatar a descrição da atividade
                let descricao = `${log.acao.charAt(0).toUpperCase() + log.acao.slice(1)} de ${log.entidade}`;
                
                // Incluir detalhes se disponíveis
                if (log.detalhe) {
                    descricao += `: ${log.detalhe}`;
                }
                
                // Adicionar item à timeline
                html += `
                    <div class="timeline-item">
                        <div class="timeline-icon ${corIcone}">
                            <i class="fas ${icone}"></i>
                        </div>
                        <div class="timeline-content">
                            <h6 class="mb-1">${descricao}</h6>
                            <p class="mb-0 small text-muted">
                                <i class="far fa-clock me-1"></i> ${dataFormatada} às ${horaFormatada}
                                <span class="badge ${log.status === 'concluído' ? 'bg-success' : 'bg-secondary'} ms-2">
                                    ${log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                </span>
                            </p>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            
            // Adicionar CSS para a timeline
            html += `
                <style>
                    .timeline-container {
                        position: relative;
                        padding: 1rem;
                    }
                    
                    .timeline-item {
                        padding-left: 2.5rem;
                        position: relative;
                        margin-bottom: 1.5rem;
                    }
                    
                    .timeline-icon {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 2rem;
                        height: 2rem;
                        background: #f8f9fa;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 2px solid #dee2e6;
                    }
                    
                    .timeline-content {
                        background: #f8f9fa;
                        border-radius: 0.25rem;
                        padding: 1rem;
                        position: relative;
                    }
                    
                    .timeline-content:before {
                        content: '';
                        position: absolute;
                        left: -8px;
                        top: 10px;
                        width: 0;
                        height: 0;
                        border-top: 8px solid transparent;
                        border-bottom: 8px solid transparent;
                        border-right: 8px solid #f8f9fa;
                    }
                </style>
            `;
            
            logsAtividadesEl.innerHTML = html;
        })
        .catch(error => {
            console.error("Erro ao carregar logs de atividades:", error);
            
            // Exibir mensagem de erro
            logsAtividadesEl.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-circle"></i> 
                    Erro ao carregar atividades recentes: ${error.message}
                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="carregarLogsAtividades()">
                        <i class="fas fa-sync-alt"></i> Tentar novamente
                    </button>
                </div>
            `;
        });
}

// Função auxiliar para registrar atividades no log
function registrarAtividade(acao, entidade, entidadeId, detalhe = null, status = "concluído") {
    console.log(`Registrando atividade: ${acao} de ${entidade} - ${entidadeId}`);
    
    // Obter o usuário logado (nome do professor)
    const usuarioLogado = professorNome || "Professor";
    
    // Converter entidadeId para string se não for null
    const entidadeIdStr = entidadeId !== null ? String(entidadeId) : "";
    
    // Verificar os valores para debug
    console.log("Valores enviados para registro:", {
        usuario: usuarioLogado,
        acao,
        entidade,
        entidade_id: entidadeIdStr,
        detalhe,
        status
    });
    
    // Garantir que detalhe seja uma string
    const detalheStr = detalhe !== null ? String(detalhe) : "";
    
    // Dados do log
    const logData = {
        usuario: usuarioLogado,
        acao: acao,
        entidade: entidade,
        entidade_id: entidadeIdStr,
        detalhe: detalheStr,
        status: status,
        data: new Date().toISOString() // Adicionar data atual
    };
    
    // Enviar para a API
    fetch(CONFIG.getApiUrl('/logs'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                console.error("Resposta da API de logs:", text);
                throw new Error('Erro ao registrar atividade: ' + response.statusText);
            });
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

// Inicializar o módulo de Alunos
function initAlunos() {
    console.log("Inicializando módulo de alunos do professor");
    
    // Elementos DOM
    const filtroTurma = document.getElementById('filtro-turma-professor');
    const filtroDisciplina = document.getElementById('filtro-disciplina-professor');
    const btnFiltrar = document.getElementById('btn-filtrar-alunos-professor');
    const tabelaAlunos = document.getElementById('tabela-alunos-professor');
    
    // Definir as variáveis que estavam faltando
    const turmaSelect = filtroTurma; // Corrigindo a variável não definida
    const disciplinaSelect = filtroDisciplina; // Corrigindo a variável não definida
    const alunoSelect = document.getElementById('filtro-aluno-professor'); // Novo elemento
    const resultadosContainer = tabelaAlunos; // Usando o elemento da tabela como container de resultados
    const limparBtn = document.getElementById('btn-limpar-filtros-professor'); // Novo elemento
    
    // Inicializar tabela
    if (tabelaAlunos) {
        tabelaAlunos.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    Por favor, selecione os filtros e clique em "Filtrar"
                </td>
            </tr>
        `;
    }
    
    // Carregar turmas do professor (para o filtro)
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(turmas => {
            console.log("Turmas do professor carregadas:", turmas);
            
            if (filtroTurma) {
                filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
                
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id_turma;
                    option.textContent = `${turma.serie || ''} ${turma.turno || ''} (${turma.id_turma})`;
                    filtroTurma.appendChild(option);
                });
                
                // Adicionar event listener para quando o usuário selecionar uma turma
                filtroTurma.addEventListener('change', function() {
                    const idTurma = this.value;
                    console.log("Turma selecionada:", idTurma);
                    
                    // Chamar a função para carregar disciplinas da turma selecionada
                    if (idTurma) {
                        carregarDisciplinas(idTurma);
                    } else {
                        carregarDisciplinas(); // Carrega todas as disciplinas
                    }
                });
            }
            
            // Carregar todas as disciplinas inicialmente
            carregarDisciplinas();
        })
        .catch(error => {
            console.error("Erro ao carregar turmas:", error);
            if (filtroTurma) {
                filtroTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            }
        });
    
    // Função para carregar disciplinas
    function carregarDisciplinas(idTurma = null) {
        console.log('Carregando disciplinas para o professor... Turma:', idTurma);
        
        // Limpar e desabilitar temporariamente o select de disciplinas
        if (disciplinaSelect) {
            disciplinaSelect.innerHTML = '<option value="">Carregando disciplinas...</option>';
            disciplinaSelect.disabled = true;
        }
        
        let url;
        if (!idTurma) {
            url = CONFIG.getApiUrl(`/professores/${professorId}/disciplinas`);
        } else {
            url = CONFIG.getApiUrl(`/professores/${professorId}/turmas/${idTurma}/disciplinas`);
        }
        
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(disciplinas => {
                console.log('Disciplinas carregadas:', disciplinas);
                
                // Atualizar o select de disciplinas com os resultados
                if (disciplinaSelect) {
                    disciplinaSelect.innerHTML = '<option value="">Todas as disciplinas</option>';
                    
                    if (disciplinas && disciplinas.length > 0) {
                        disciplinas.forEach(disciplina => {
                            const option = document.createElement('option');
                            option.value = disciplina.id_disciplina;
                            option.textContent = disciplina.nome_disciplina || `Disciplina ID: ${disciplina.id_disciplina}`;
                            disciplinaSelect.appendChild(option);
                        });
                    }
                    
                    // Habilitar o select
                    disciplinaSelect.disabled = false;
                }
                
                return disciplinas;
            })
            .catch(error => {
                console.error('Erro ao carregar disciplinas:', error);
                
                // Resetar o select com mensagem de erro
                if (disciplinaSelect) {
                    disciplinaSelect.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
                    disciplinaSelect.disabled = false;
                }
                
                return [];
            });
    }
    
    // Função para carregar todos os alunos
    function carregarTodosAlunos() {
        // Mostrar indicador de carregamento no select de alunos
        if (alunoSelect) {
            alunoSelect.innerHTML = '<option value="">Carregando alunos...</option>';
            alunoSelect.disabled = true;
        }
        
        // Verificar o container de resultados
        if (!resultadosContainer) {
            console.error("Container de resultados não encontrado!");
            return;
        }
        
        // Encontrar o corpo da tabela (tbody) ou usar o próprio container
        let tableBody = resultadosContainer.tagName === 'TABLE' 
            ? resultadosContainer.querySelector('tbody') || resultadosContainer 
            : resultadosContainer;
        
        // Mostrar indicador de carregamento no container de resultados
        tableBody.innerHTML = `
            <tr class="text-center">
                <td colspan="4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando alunos...</span>
                    </div>
                    <p class="mt-2">Carregando alunos...</p>
                </td>
            </tr>
        `;
        
        // Buscar todos os alunos do professor
        fetch(CONFIG.getApiUrl(`/professores/${professorId}/alunos`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(alunos => {
                console.log('Todos os alunos do professor:', alunos);
                
                // Preencher o select de alunos
                if (alunoSelect) {
                    // Resetar o select com a opção "Todos os alunos"
                    alunoSelect.innerHTML = '<option value="">Todos os alunos</option>';
                    
                    // Adicionar os alunos
                    if (alunos.length > 0) {
                        // Ordenar alunos por nome
                        alunos.sort((a, b) => {
                            const nomeA = a.nome_aluno || '';
                            const nomeB = b.nome_aluno || '';
                            return nomeA.localeCompare(nomeB);
                        });
                        
                        alunos.forEach(aluno => {
                            const option = document.createElement('option');
                            option.value = aluno.id_aluno;
                            option.textContent = aluno.nome_aluno || `Aluno ID: ${aluno.id_aluno}`;
                            alunoSelect.appendChild(option);
                        });
                    }
                    
                    // Habilitar o select
                    alunoSelect.disabled = false;
                }
                
                // Exibir resultados na tabela
                exibirResultados(alunos);
            })
            .catch(error => {
                console.error('Erro ao carregar alunos:', error);
                
                // Resetar o select com mensagem de erro
                if (alunoSelect) {
                    alunoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
                    alunoSelect.disabled = true;
                }
                
                // Encontrar o corpo da tabela (tbody) ou usar o próprio container
                let tableBody = resultadosContainer.tagName === 'TABLE' 
                    ? resultadosContainer.querySelector('tbody') || resultadosContainer 
                    : resultadosContainer;
                
                // Mostrar mensagem de erro no container de resultados
                tableBody.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4">
                            <div class="alert alert-danger" role="alert">
                                <h4 class="alert-heading">Erro ao carregar alunos!</h4>
                                <p>Não foi possível carregar os alunos.</p>
                                <hr>
                                <p class="mb-0">Detalhes: ${error.message}</p>
                            </div>
                        </td>
                    </tr>
                `;
            });
    }
    
    // Função para carregar alunos filtrados
    function carregarAlunosFiltrados(idTurma, idDisciplina) {
        console.log(`Carregando alunos filtrados. Turma: ${idTurma}, Disciplina: ${idDisciplina}`);
        
        // Verificar o container de resultados
        if (!resultadosContainer) {
            console.error("Container de resultados não encontrado!");
            return Promise.reject(new Error("Container de resultados não encontrado"));
        }
        
        // Mostrar indicador de carregamento
        let tableBody = resultadosContainer.tagName === 'TABLE' 
            ? resultadosContainer.querySelector('tbody') || resultadosContainer 
            : resultadosContainer;
        
        tableBody.innerHTML = `
            <tr class="text-center">
                <td colspan="4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando alunos...</span>
                    </div>
                    <p class="mt-2">Carregando alunos...</p>
                </td>
            </tr>
        `;
        
        // Construir a URL com os parâmetros de filtro
        let url = CONFIG.getApiUrl(`/professores/${professorId}/alunos`);
        const params = new URLSearchParams();
        
        if (idTurma) {
            params.append('turma_id', idTurma);
        }
        
        if (idDisciplina) {
            params.append('disciplina_id', idDisciplina);
        }
        
        // Adicionar parâmetros à URL se houver algum
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        // Realizar a requisição
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(alunos => {
                console.log('Alunos filtrados carregados:', alunos);
                
                // Exibir os resultados
                exibirResultados(alunos);
                
                return alunos;
            })
            .catch(error => {
                console.error('Erro ao carregar alunos filtrados:', error);
                
                // Mostrar mensagem de erro
                tableBody.innerHTML = `
                    <tr class="text-center">
                        <td colspan="4">
                            <div class="alert alert-danger" role="alert">
                                <h4 class="alert-heading">Erro ao carregar alunos!</h4>
                                <p>Não foi possível carregar os alunos com os filtros selecionados.</p>
                                <hr>
                                <p class="mb-0">Detalhes: ${error.message}</p>
                            </div>
                        </td>
                    </tr>
                `;
                
                return [];
            });
    }
    
    // Função para exibir os resultados da busca na tabela
    function exibirResultados(alunos) {
        console.log('Exibindo resultados da busca de alunos:', alunos);
        
        // Verificar se o container de resultados existe
        if (!resultadosContainer) {
            console.error("Container de resultados não encontrado!");
            return;
        }
        
        // Obter os valores atuais dos filtros
        const turmaFiltro = turmaSelect ? turmaSelect.value : '';
        const disciplinaFiltro = disciplinaSelect ? disciplinaSelect.value : '';
        
        // Encontrar o corpo da tabela (tbody) ou usar o próprio container
        let tableBody = resultadosContainer.tagName === 'TABLE' 
            ? resultadosContainer.querySelector('tbody') || resultadosContainer 
            : resultadosContainer;
        
        // Limpar os resultados anteriores
        tableBody.innerHTML = '';
        
        // Se não houver resultados, mostrar mensagem
        if (!alunos || alunos.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">Nenhum aluno encontrado com os filtros selecionados.</td>
                </tr>
            `;
            
            // Registrar atividade - nenhum resultado encontrado
            registrarAtividade(
                'consulta',
                'alunos',
                '0 registros',
                `Filtros: ${turmaFiltro ? 'Turma: '+turmaFiltro+', ' : ''}${disciplinaFiltro ? 'Disciplina: '+disciplinaFiltro : ''}`,
                'concluído'
            );
            
            return;
        }
        
        // Preencher a tabela com os resultados
        alunos.forEach(aluno => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${aluno.id_aluno || 'N/A'}</td>
                <td>${aluno.nome_aluno || 'N/A'}</td>
                <td>${aluno.nome_turma || aluno.id_turma || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="exibirFichaAluno('${aluno.id_aluno}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Registrar atividade - consulta bem-sucedida
        registrarAtividade(
            'consulta',
            'alunos',
            `${alunos.length} registros`,
            `Filtros: ${turmaFiltro ? 'Turma: '+turmaFiltro+', ' : ''}${disciplinaFiltro ? 'Disciplina: '+disciplinaFiltro : ''}`,
            'concluído'
        );
    }
    
    // Event listener para quando a turma for alterada
    if (turmaSelect) {
        turmaSelect.addEventListener('change', function() {
            const idTurma = this.value;
            
            if (idTurma) {
                // Se uma turma específica for selecionada, carregar suas disciplinas
                carregarDisciplinas(idTurma); // Usando a função carregarDisciplinas que já existe
            } else {
                // Se "Todas as turmas" for selecionado, carregar todas as disciplinas
                carregarDisciplinas(); // Usando a função carregarDisciplinas sem parâmetro
            }
            
            // Sempre que a turma mudar, resetar o select de alunos
            if (alunoSelect) {
                alunoSelect.innerHTML = '<option value="">Todos os alunos</option>';
            }
        });
    }
    
    // Adicionando funções específicas para evitar erros
    function carregarDisciplinasPorTurma(idTurma) {
        console.log("Carregando disciplinas para a turma:", idTurma);
        carregarDisciplinas(idTurma); // Redireciona para a função já existente
    }
    
    function carregarTodasDisciplinas() {
        console.log("Carregando todas as disciplinas");
        carregarDisciplinas(); // Redireciona para a função já existente sem parâmetros
    }
    
    // Event listener para o botão de filtrar
    if (btnFiltrar) {
        console.log("Adicionando event listener para o botão de filtrar alunos:", btnFiltrar);
        
        btnFiltrar.addEventListener('click', function() {
            console.log("Botão filtrar clicado!");
            const idTurma = turmaSelect ? turmaSelect.value : '';
            const idDisciplina = disciplinaSelect ? disciplinaSelect.value : '';
            const idAluno = alunoSelect ? alunoSelect.value : '';
            
            console.log('Filtros aplicados:', { idTurma, idDisciplina, idAluno });
            
            if (idAluno) {
                // Se um aluno específico for selecionado, buscar apenas este aluno
                fetch(CONFIG.getApiUrl(`/alunos/${idAluno}`))
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro na requisição: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(aluno => {
                        console.log('Aluno específico:', aluno);
                        exibirResultados([aluno]);
                    })
                    .catch(error => {
                        console.error('Erro ao carregar aluno específico:', error);
                        // Mostrar mensagem de erro no container de resultados
                        if (resultadosContainer) {
                            let tableBody = resultadosContainer.tagName === 'TABLE' 
                                ? resultadosContainer.querySelector('tbody') || resultadosContainer 
                                : resultadosContainer;
                                
                            tableBody.innerHTML = `
                                <tr class="text-center">
                                    <td colspan="4">
                                        <div class="alert alert-danger" role="alert">
                                            <h4 class="alert-heading">Erro ao carregar aluno!</h4>
                                            <p>Não foi possível carregar o aluno selecionado.</p>
                                            <hr>
                                            <p class="mb-0">Detalhes: ${error.message}</p>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }
                    });
            } else {
                // Carregar alunos com base nos filtros de turma e disciplina
                carregarAlunosFiltrados(idTurma, idDisciplina);
            }
        });
    } else {
        console.error("Botão de filtrar não encontrado!");
    }
    
    // Event listener para o botão de limpar filtros
    if (limparBtn) {
        limparBtn.addEventListener('click', function() {
            // Resetar todos os selects
            if (turmaSelect) turmaSelect.value = '';
            if (disciplinaSelect) {
                // Carregar todas as disciplinas ao limpar filtros
                carregarTodasDisciplinas();
            }
            if (alunoSelect) alunoSelect.value = '';
            
            // Carregar todos os alunos
            carregarTodosAlunos();
        });
    }
}

// Inicialização do módulo de notas
function initNotas() {
    console.log('=== INICIALIZANDO MÓDULO DE NOTAS ===');
    console.log('Valor atual de professorId:', professorId);
    console.log('Valor em sessionStorage:', sessionStorage.getItem('professorId'));
    
    // Tentar obter novamente se não estiver definido
    if (!professorId) {
        professorId = sessionStorage.getItem('professorId');
        console.log('Recuperado professorId do sessionStorage:', professorId);
    }
    
    // Verificar se as funções necessárias estão disponíveis
    const requisitosFaltantes = [];
    
    if (typeof window.carregarTurmasDoProfessor !== 'function') requisitosFaltantes.push('carregarTurmasDoProfessor');
    if (typeof window.carregarDisciplinasParaFiltro !== 'function') requisitosFaltantes.push('carregarDisciplinasParaFiltro');
    if (typeof window.carregarAlunosParaFiltro !== 'function') requisitosFaltantes.push('carregarAlunosParaFiltro');
    if (typeof window.inicializarTabelaNotas !== 'function') requisitosFaltantes.push('inicializarTabelaNotas');
    if (typeof window.carregarNotas !== 'function') requisitosFaltantes.push('carregarNotas');
    
    if (requisitosFaltantes.length > 0) {
        console.error('Funções necessárias não estão disponíveis:', requisitosFaltantes.join(', '));
        
        // Tentar novamente após um pequeno atraso (para dar tempo de carregar)
        if (!window.tentativasInitNotas) window.tentativasInitNotas = 0;
        window.tentativasInitNotas++;
        
        if (window.tentativasInitNotas < 3) {
            console.log(`Tentando inicializar notas novamente em 500ms (tentativa ${window.tentativasInitNotas}/3)`);
            setTimeout(initNotas, 500);
            return;
        } else {
            console.error('Falha na inicialização após 3 tentativas');
            alert('Erro ao inicializar filtros de notas. Por favor, recarregue a página.');
            return;
        }
    }
    
    try {
        // Inicializar a tabela de notas primeiro (importante para estrutura da página)
        if (typeof window.inicializarTabelaNotas === 'function') {
            window.inicializarTabelaNotas();
        } else {
            console.error('Função inicializarTabelaNotas não encontrada');
            inicializarTabelaNotas(); // Tentar chamada direta como fallback
        }
        
        // Corrigir o header da card depois que a tabela foi inicializada
    corrigirHeaderNotas();
    
        // Encontrar o container de notas
        const notas_container = document.querySelector('#conteudo-notas');
        if (!notas_container) {
            console.error('Container de notas não encontrado!');
            return;
        }
        
        // Verificar se o formulário de filtros existe
        let filtrosForm = document.querySelector('#form-filtro-notas-professor');
        if (!filtrosForm) {
            console.log('Formulário de filtros não encontrado, criando-o dinamicamente');
            
            // Encontrar o primeiro card para inserir os filtros
            const primeiroCard = notas_container.querySelector('.card');
            if (!primeiroCard) {
                // Se não existir card, criar um
                const novoCard = document.createElement('div');
                novoCard.className = 'card shadow mb-4';
                novoCard.innerHTML = `
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Filtros</h6>
                        <button class="btn btn-sm btn-outline-secondary d-md-none" type="button" data-bs-toggle="collapse" data-bs-target="#filtrosNotas">
                            <i class="fas fa-filter"></i>
                        </button>
                    </div>
                    <div class="card-body collapse show" id="filtrosNotas">
                        <form id="form-filtro-notas-professor">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="filtro-turma-notas" class="form-label">Turma</label>
                                    <select class="form-select" id="filtro-turma-notas">
                                        <option value="">Todas as turmas</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="filtro-disciplina-notas" class="form-label">Disciplina</label>
                                    <select class="form-select" id="filtro-disciplina-notas">
                                        <option value="">Todas as disciplinas</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="filtro-bimestre-notas" class="form-label">Bimestre</label>
                                    <select class="form-select" id="filtro-bimestre-notas">
                                        <option value="">Todos os bimestres</option>
                                        <option value="1">1º Bimestre</option>
                                        <option value="2">2º Bimestre</option>
                                        <option value="3">3º Bimestre</option>
                                        <option value="4">4º Bimestre</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="filtro-aluno-notas" class="form-label">Aluno</label>
                                    <select class="form-select" id="filtro-aluno-notas">
                                        <option value="">Todos os alunos</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="filtro-ano-notas" class="form-label">Ano</label>
                                    <select class="form-select" id="filtro-ano-notas">
                                        <option value="">Todos os anos</option>
                                    </select>
                                </div>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="button" class="btn btn-primary" id="btn-filtrar-notas">
                                    <i class="fas fa-filter"></i> Filtrar
                                </button>
                            </div>
                        </form>
                    </div>
                `;
                
                // Adicionar o card ao container
                notas_container.insertBefore(novoCard, notas_container.firstChild);
            } else {
                // Se existir, verificar se tem o header correto
                let cardHeader = primeiroCard.querySelector('.card-header');
                let cardBody = primeiroCard.querySelector('.card-body');
                
                if (!cardHeader) {
                    const novoHeader = document.createElement('div');
                    novoHeader.className = 'card-header py-3 d-flex justify-content-between align-items-center';
                    novoHeader.innerHTML = `
                        <h6 class="m-0 font-weight-bold text-primary">Filtros</h6>
                        <button class="btn btn-sm btn-outline-secondary d-md-none" type="button" data-bs-toggle="collapse" data-bs-target="#filtrosNotas">
                            <i class="fas fa-filter"></i>
                        </button>
                    `;
                    primeiroCard.insertBefore(novoHeader, primeiroCard.firstChild);
                }
                
                if (!cardBody) {
                    cardBody = document.createElement('div');
                    cardBody.className = 'card-body collapse show';
                    cardBody.id = 'filtrosNotas';
                    cardBody.innerHTML = `
                        <form id="form-filtro-notas-professor">
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="filtro-turma-notas" class="form-label">Turma</label>
                                    <select class="form-select" id="filtro-turma-notas">
                                        <option value="">Todas as turmas</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="filtro-disciplina-notas" class="form-label">Disciplina</label>
                                    <select class="form-select" id="filtro-disciplina-notas">
                                        <option value="">Todas as disciplinas</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="filtro-bimestre-notas" class="form-label">Bimestre</label>
                                    <select class="form-select" id="filtro-bimestre-notas">
                                        <option value="">Todos os bimestres</option>
                                        <option value="1">1º Bimestre</option>
                                        <option value="2">2º Bimestre</option>
                                        <option value="3">3º Bimestre</option>
                                        <option value="4">4º Bimestre</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label for="filtro-aluno-notas" class="form-label">Aluno</label>
                                    <select class="form-select" id="filtro-aluno-notas">
                                        <option value="">Todos os alunos</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label for="filtro-ano-notas" class="form-label">Ano</label>
                                    <select class="form-select" id="filtro-ano-notas">
                                        <option value="">Todos os anos</option>
                                    </select>
                                </div>
                            </div>
                            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button type="button" class="btn btn-primary" id="btn-filtrar-notas">
                                    <i class="fas fa-filter"></i> Filtrar
                                </button>
                            </div>
                        </form>
                    `;
                    
                    primeiroCard.appendChild(cardBody);
                }
            }
            
            // Buscar novamente após criar
            filtrosForm = document.querySelector('#form-filtro-notas-professor');
        }
        
        // Definir variáveis globais para os filtros para uso em outras funções
        // PROBLEMA: Estava usando window.filtroTurma, mas o código lê da variável global filtroTurma sem window
        // Corrigir atribuindo às variáveis globais diretamente
        filtroTurma = document.getElementById('filtro-turma-notas');
        filtroDisciplina = document.getElementById('filtro-disciplina-notas');
        filtroAluno = document.getElementById('filtro-aluno-notas');
        filtroAno = document.getElementById('filtro-ano-notas');
        filtroBimestre = document.getElementById('filtro-bimestre-notas');
        
        // Também atribuir às variáveis window para compatibilidade
        window.filtroTurma = filtroTurma;
        window.filtroDisciplina = filtroDisciplina;
        window.filtroAluno = filtroAluno;
        window.filtroAno = filtroAno;
        window.filtroBimestre = filtroBimestre;
        
        // Verificar os elementos encontrados
        console.log('Elementos de filtro encontrados:', {
            filtroTurma: filtroTurma ? '#' + filtroTurma.id : null,
            filtroDisciplina: filtroDisciplina ? '#' + filtroDisciplina.id : null,
            filtroAluno: filtroAluno ? '#' + filtroAluno.id : null,
            filtroAno: filtroAno ? '#' + filtroAno.id : null,
            filtroBimestre: filtroBimestre ? '#' + filtroBimestre.id : null
        });
        
        // Se ainda faltam filtros, exibir alerta
        const filtrosFaltando = [];
        if (!filtroTurma) filtrosFaltando.push('Turma');
        if (!filtroDisciplina) filtrosFaltando.push('Disciplina');
        if (!filtroAluno) filtrosFaltando.push('Aluno');
        if (!filtroAno) filtrosFaltando.push('Ano');
        if (!filtroBimestre) filtrosFaltando.push('Bimestre');
        
        if (filtrosFaltando.length > 0) {
            console.error('Filtros não encontrados mesmo após tentativa de criação:', filtrosFaltando.join(', '));
            
            const notasContainer = document.querySelector('#conteudo-notas .card-body:not(#filtrosNotas)');
            if (notasContainer) {
                notasContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h4 class="alert-heading">Erro ao inicializar módulo de notas</h4>
                        <p>Não foi possível criar os seguintes filtros: ${filtrosFaltando.join(', ')}</p>
                        <hr>
                        <p class="mb-0">Recarregue a página ou tente novamente mais tarde.</p>
                    </div>
                `;
            }
            return;
    }
    
    // Inicializar valores padrão para o ano
    if (filtroAno) {
        const anoAtual = new Date().getFullYear();
        let opcoesAnos = '';
        
            for (let ano = anoAtual - 1; ano <= anoAtual + 2; ano++) {
            opcoesAnos += `<option value="${ano}" ${ano === anoAtual ? 'selected' : ''}>${ano}</option>`;
        }
        
        filtroAno.innerHTML = `<option value="">Selecione o ano</option>${opcoesAnos}`;
    }
    
        // Inicializar valores padrão para bimestre (garantir que seja apenas uma vez)
        if (filtroBimestre && filtroBimestre.options.length <= 1) {
        filtroBimestre.innerHTML = `
            <option value="">Selecione o bimestre</option>
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
        `;
    }
    
        // Carregar dados para os filtros
    if (filtroTurma) {
            // Evitar chamadas repetidas verificando se já tem opções
            if (filtroTurma.options.length <= 1) {
                console.log('Carregando turmas para o filtro...');
                if (typeof window.carregarTurmasDoProfessor === 'function') {
                    // Verificar se professorId existe e está definido
                    if (!professorId) {
                        console.error('professorId não está definido para carregarTurmasDoProfessor');
                        filtroTurma.innerHTML = '<option value="">Erro: ID do professor não disponível</option>';
                    } else {
                        console.log('Chamando carregarTurmasDoProfessor com professorId:', professorId);
                        window.carregarTurmasDoProfessor(professorId)
            .then(turmas => {
                                console.log('Turmas carregadas com sucesso para filtro:', turmas);
                                let options = '<option value="">Todas as turmas</option>';
                turmas.forEach(turma => {
                                    options += `<option value="${turma.id}">${turma.nome}</option>`;
                });
                                filtroTurma.innerHTML = options;
            })
            .catch(error => {
                                console.error('Erro ao carregar turmas para filtro:', error);
                filtroTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            });
    }
                } else {
                    console.error('Função carregarTurmasDoProfessor não está disponível globalmente');
                    filtroTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                }
            }
            
            // Adicionar evento para carregar disciplinas ao mudar a turma
            filtroTurma.addEventListener('change', function() {
                const idTurma = this.value;
            console.log('Turma selecionada:', idTurma);
            
                // Atualizar select de disciplinas
                if (typeof window.carregarDisciplinasParaFiltro === 'function') {
                    window.carregarDisciplinasParaFiltro(idTurma);
                } else {
                    console.error('Função carregarDisciplinasParaFiltro não está disponível globalmente');
                }
                
                // Atualizar select de alunos
                if (typeof window.carregarAlunosParaFiltro === 'function') {
                    window.carregarAlunosParaFiltro(idTurma);
                } else {
                    console.error('Função carregarAlunosParaFiltro não está disponível globalmente');
                }
            });
        }
        
        // Adicionar evento para o botão de filtrar
        const btnFiltrar = document.getElementById('btn-filtrar-notas');
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', function() {
                console.log('Botão de filtrar notas clicado');
                if (typeof window.carregarNotas === 'function') {
                    window.carregarNotas();
            } else {
                    console.error('Função carregarNotas não está disponível globalmente');
                    alert('Erro ao filtrar notas. Por favor, recarregue a página.');
            }
        });
    }
    
        // Se o filtro de disciplina existe, adicionar evento para atualizar alunos
        if (filtroDisciplina) {
            filtroDisciplina.addEventListener('change', function() {
                const idTurma = filtroTurma ? filtroTurma.value : '';
                const idDisciplina = this.value;
                console.log('Disciplina selecionada:', idDisciplina);
                
                // Atualizar select de alunos
                if (typeof window.carregarAlunosParaFiltro === 'function') {
                    window.carregarAlunosParaFiltro(idTurma, idDisciplina);
        } else {
                    console.error('Função carregarAlunosParaFiltro não está disponível globalmente');
                }
            });
        }
        
        // Configurar botão para gerar PDF
        const btnGerarPDF = document.getElementById('btn-gerar-pdf-notas');
        if (btnGerarPDF) {
            btnGerarPDF.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Verificar se há notas carregadas
                const notasLista = document.getElementById('notas-lista');
                if (!notasLista || notasLista.querySelectorAll('tr').length === 0) {
                    alert("Não há notas para gerar o relatório. Por favor, filtre alguma turma primeiro.");
                    return;
                }
                
                // Chamar a função de geração de PDF
                if (typeof window.gerarPDFNotas === 'function') {
                    window.gerarPDFNotas();
                } else {
                    console.error("Função gerarPDFNotas não está disponível");
                    alert("Função de geração de PDF não está disponível. Recarregue a página e tente novamente.");
                }
            });
        }
        
        console.log('Módulo de notas inicializado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao inicializar módulo de notas:', error);
        alert('Erro ao inicializar módulo de notas. Por favor, recarregue a página.');
    }
}

// Função para carregar turmas para o filtro
function carregarTurmasParaFiltro() {
    if (!filtroTurma) return;
    
    filtroTurma.innerHTML = '<option value="">Carregando turmas...</option>';
    
    // Buscar turmas do professor
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(turmas => {
            console.log('Turmas para filtro:', turmas);
            
            filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
            
            if (turmas.length > 0) {
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id_turma;
                    option.textContent = `${turma.serie || ''} ${turma.turno || ''} (${turma.id_turma})`;
                    filtroTurma.appendChild(option);
                });
            }
            
            // Adicionar evento de mudança para carregar disciplinas quando a turma mudar
            filtroTurma.addEventListener('change', function() {
                carregarDisciplinasParaFiltro(this.value);
            });
            
            // Carregar disciplinas iniciais
            carregarDisciplinasParaFiltro();
        })
        .catch(error => {
            console.error('Erro ao carregar turmas para filtro:', error);
            filtroTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        });
}

// Função para carregar disciplinas para o filtro
function carregarDisciplinasParaFiltro(idTurma = null) {
    console.log('Carregando disciplinas para filtro. Turma:', idTurma);
    
    // Verificar se o elemento existe
    if (!filtroDisciplina) {
        console.error('Elemento de filtro de disciplina não encontrado! Tentando buscar novamente...');
        filtroDisciplina = document.getElementById('filtro-disciplina-notas');
        window.filtroDisciplina = filtroDisciplina;
        
        if (!filtroDisciplina) {
            console.error('Elemento de filtro de disciplina ainda não encontrado após nova tentativa!');
        return;
        }
    }
    
    // Desabilitar o select enquanto carrega
    filtroDisciplina.disabled = true;
    filtroDisciplina.innerHTML = '<option value="">Carregando disciplinas...</option>';
    
    // Definir URLs principal e alternativa
    let url;
    let urlAlternativa;
    
    if (!idTurma) {
        // URL principal: todas as disciplinas do professor
        url = CONFIG.getApiUrl(`/professores/${professorId}/disciplinas`);
        // URL alternativa: nenhuma (já estamos buscando todas)
    } else {
        // URL principal: disciplinas do professor para a turma específica
        url = CONFIG.getApiUrl(`/professores/${professorId}/turmas/${idTurma}/disciplinas`);
        // URL alternativa: todas as disciplinas da turma
        urlAlternativa = CONFIG.getApiUrl(`/turmas/${idTurma}/disciplinas`);
    }
    
    console.log('URL para carregar disciplinas:', url);
    
    // Função para processar os resultados das disciplinas
    const processarDisciplinas = (disciplinas) => {
        console.log('Disciplinas carregadas com sucesso:', disciplinas);
            
            filtroDisciplina.innerHTML = '<option value="">Todas as disciplinas</option>';
            
        if (disciplinas && disciplinas.length > 0) {
                disciplinas.forEach(disciplina => {
                const disciplinaId = disciplina.id_disciplina || disciplina.id || '';
                const disciplinaNome = disciplina.nome_disciplina || disciplina.nome || disciplinaId;
                
                    const option = document.createElement('option');
                option.value = disciplinaId;
                option.textContent = disciplinaNome;
                    filtroDisciplina.appendChild(option);
                });
            }
            
            // Reativar o select
            filtroDisciplina.disabled = false;
    };
    
    // Função para tentar a URL alternativa em caso de falha
    const tentarUrlAlternativa = (error) => {
        console.warn(`Erro na primeira tentativa (${error.message}). Tentando URL alternativa para disciplinas:`, urlAlternativa);
        
        if (!urlAlternativa) {
            throw error; // Se não há URL alternativa, propagar o erro
        }
        
        return fetch(urlAlternativa)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição alternativa: ${response.status}`);
                }
                return response.json();
            });
    };
    
    // Buscar disciplinas com tratamento de erro e URL alternativa
    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404 && urlAlternativa) {
                    // Se for 404 e temos URL alternativa, tentar a alternativa
                    return tentarUrlAlternativa(new Error(`Erro 404 na requisição: ${response.status}`))
                        .then(disciplinas => disciplinas);
                }
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(processarDisciplinas)
        .catch(error => {
            if (urlAlternativa && !error.message.includes('alternativa')) {
                // Se temos URL alternativa e ainda não tentamos, tentar
                return tentarUrlAlternativa(error)
                    .then(processarDisciplinas)
                    .catch(alternativeError => {
                        throw alternativeError;
                    });
            } else {
                // Se não temos URL alternativa ou já tentamos, propagar o erro
                throw error;
            }
        })
        .catch(finalError => {
            console.error('Erro ao carregar disciplinas para filtro:', finalError);
            
            // Tentar carregar todas as disciplinas do professor como última alternativa
            if (idTurma && url !== CONFIG.getApiUrl(`/professores/${professorId}/disciplinas`)) {
                console.log('Tentando carregar todas as disciplinas do professor como última alternativa');
                carregarDisciplinasParaFiltro(); // Chamar sem parâmetro para buscar todas
            } else {
                // Se já estamos tentando todas as disciplinas ou não temos ID de turma, mostrar erro
            filtroDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            }
            
            // Reativar o select mesmo em caso de erro
            filtroDisciplina.disabled = false;
        });
}

// Função para carregar alunos para o filtro
function carregarAlunosParaFiltro(idTurma = null, idDisciplina = null) {
    console.log('Carregando alunos para filtro. Turma:', idTurma, 'Disciplina:', idDisciplina);
    
    // Verificar se o elemento existe
    if (!filtroAluno) {
        console.error('Elemento de filtro de aluno não encontrado! Tentando buscar novamente...');
        filtroAluno = document.getElementById('filtro-aluno-notas');
        window.filtroAluno = filtroAluno;
        
        if (!filtroAluno) {
            console.error('Elemento de filtro de aluno ainda não encontrado após nova tentativa!');
        return;
        }
    }
    
    // Desabilitar o select enquanto carrega
    filtroAluno.disabled = true;
    filtroAluno.innerHTML = '<option value="">Carregando alunos...</option>';
    
    // Se não temos uma turma selecionada, mostrar opção padrão e retornar
    if (!idTurma) {
        console.log('Nenhuma turma selecionada, mostrando apenas opção padrão');
        filtroAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        filtroAluno.disabled = false;
        return Promise.resolve([]);
    }
    
    // Definir URLs principal e alternativa
    let url = CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`);
    let urlAlternativa;
    
    // Se temos disciplina, tentar endpoint mais específico
    if (idDisciplina) {
        urlAlternativa = CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas/${idTurma}/alunos`);
    } else {
        // URL alternativa para caso o primeiro endpoint falhe
        urlAlternativa = CONFIG.getApiUrl(`/alunos?turma_id=${idTurma}`);
    }
    
    console.log('URL para carregar alunos:', url);
    if (urlAlternativa) console.log('URL alternativa:', urlAlternativa);
    
    // Função para processar os resultados dos alunos
    const processarAlunos = (alunos) => {
        console.log('Alunos carregados com sucesso:', alunos);
        
        filtroAluno.innerHTML = '<option value="">Todos os alunos da turma</option>';
        
        if (alunos && alunos.length > 0) {
            // Garantir que só mostra alunos da turma selecionada
            let alunosFiltrados = alunos;
            if (idTurma) {
                alunosFiltrados = alunos.filter(aluno => {
                    const turmaDoAluno = aluno.id_turma || aluno.turma_id || '';
                    return turmaDoAluno === idTurma || turmaDoAluno === parseInt(idTurma);
                });
                console.log(`Filtrando ${alunos.length} alunos para apenas ${alunosFiltrados.length} da turma ${idTurma}`);
            }
            
                // Ordenar alunos por nome
            alunosFiltrados.sort((a, b) => {
                const nomeA = a.nome_aluno || a.nome || '';
                const nomeB = b.nome_aluno || b.nome || '';
                    return nomeA.localeCompare(nomeB);
                });
                
            alunosFiltrados.forEach(aluno => {
                const alunoId = aluno.id_aluno || aluno.id || '';
                const alunoNome = aluno.nome_aluno || aluno.nome || `Aluno ID: ${alunoId}`;
                
                    const option = document.createElement('option');
                option.value = alunoId;
                option.textContent = alunoNome;
                    filtroAluno.appendChild(option);
                });
            }
            
            // Reativar o select
            filtroAluno.disabled = false;
    };
    
    // Função para tentar a URL alternativa em caso de falha
    const tentarUrlAlternativa = (error) => {
        console.warn(`Erro na primeira tentativa (${error.message}). Tentando URL alternativa para alunos:`, urlAlternativa);
        
        if (!urlAlternativa) {
            throw error; // Se não há URL alternativa, propagar o erro
        }
        
        return fetch(urlAlternativa)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição alternativa: ${response.status}`);
                }
                return response.json();
            })
            .then(alunos => {
                // Se estamos buscando com filtro de turma e disciplina, filtrar os resultados
                if (idTurma) {
                    return alunos.filter(aluno => {
                        const turmaDoAluno = aluno.id_turma || aluno.turma_id || '';
                        return turmaDoAluno === idTurma;
                    });
                }
                return alunos;
            });
    };
    
    // Buscar alunos com tratamento de erro
    fetch(url)
        .then(response => {
            if (!response.ok) {
                if (response.status === 404 && urlAlternativa) {
                    // Se for 404 e temos URL alternativa, tentar a alternativa
                    return tentarUrlAlternativa(new Error(`Erro 404 na requisição: ${response.status}`));
                }
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(processarAlunos)
        .catch(error => {
            if (urlAlternativa && !error.message.includes('alternativa')) {
                // Se temos URL alternativa e ainda não tentamos, tentar
                return tentarUrlAlternativa(error)
                    .then(processarAlunos)
                    .catch(alternativeError => {
                        throw alternativeError;
                    });
            } else {
                // Se não temos URL alternativa ou já tentamos, propagar o erro
                throw error;
            }
        })
        .catch(finalError => {
            console.error('Erro ao carregar alunos para filtro:', finalError);
            
            // Tentar carregar todos os alunos do professor como última alternativa
            if (idTurma && url !== CONFIG.getApiUrl(`/professores/${professorId}/alunos`)) {
                console.log('Tentando carregar todos os alunos do professor como última alternativa');
                carregarAlunosParaFiltro(); // Chamar sem parâmetro para buscar todos
            } else {
                // Se já estamos tentando todos os alunos, mostrar erro
            filtroAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            }
            
            // Reativar o select mesmo em caso de erro
            filtroAluno.disabled = false;
        });
}

// Função para carregar notas com base nos filtros selecionados
function carregarNotas() {
    console.log("=== INICIANDO CARREGAMENTO DE NOTAS ===");
    
    try {
        // Garantir que temos acesso às variáveis de filtro - buscar novamente se necessário
        if (!filtroTurma) filtroTurma = document.getElementById('filtro-turma-notas');
        if (!filtroDisciplina) filtroDisciplina = document.getElementById('filtro-disciplina-notas');
        if (!filtroAluno) filtroAluno = document.getElementById('filtro-aluno-notas');
        if (!filtroAno) filtroAno = document.getElementById('filtro-ano-notas');
        if (!filtroBimestre) filtroBimestre = document.getElementById('filtro-bimestre-notas');
        
        // Obter valores dos filtros
        const idTurma = filtroTurma && filtroTurma.value ? filtroTurma.value : '';
        const idDisciplina = filtroDisciplina && filtroDisciplina.value ? filtroDisciplina.value : '';
        const idAluno = filtroAluno && filtroAluno.value ? filtroAluno.value : '';
        const ano = filtroAno && filtroAno.value ? filtroAno.value : '';
        const bimestre = filtroBimestre && filtroBimestre.value ? filtroBimestre.value : '';
        
        // Verificar se temos o ID do professor
        if (!professorId) {
            console.error('ID do professor não definido!');
            alert('Erro: Não foi possível identificar o professor. Recarregue a página.');
            return;
        }
    
    console.log('Valores dos filtros:', {
        idTurma,
        idDisciplina,
        idAluno,
        ano,
        bimestre,
        professorId
    });
    
    // Verificar se o elemento da tabela existe
    const notasTabela = document.getElementById('notas-lista');
    if (!notasTabela) {
            console.error('Elemento da tabela de notas (#notas-lista) não encontrado!');
            
            // Tentar inicializar a tabela novamente
            inicializarTabelaNotas();
            
            // Tentar novamente
            const notasTabela = document.getElementById('notas-lista');
            if (!notasTabela) {
                alert('Erro: Tabela de notas não encontrada. Recarregue a página.');
        return;
            }
    }
    
    // Mostrar indicador de carregamento
    notasTabela.innerHTML = `
        <tr class="text-center">
            <td colspan="10">
                <div class="d-flex justify-content-center align-items-center" style="height: 100px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando notas...</span>
                    </div>
                    <span class="ms-2">Carregando notas...</span>
                </div>
            </td>
        </tr>
    `;
        
        // Armazenar informações de alunos, turmas e disciplinas
        const dadosAlunos = {};
        const dadosTurmas = {};
        const dadosDisciplinas = {};
    
    // Construir URL com parâmetros de consulta
    const params = new URLSearchParams();
    if (idTurma) params.append('turma_id', idTurma);
    if (idDisciplina) params.append('disciplina_id', idDisciplina);
    if (idAluno) params.append('aluno_id', idAluno);
    if (ano) params.append('ano', ano);
    if (bimestre) params.append('bimestre', bimestre);
    
    // Adicionar parâmetro do professor - fundamental para filtrar as notas
    params.append('professor_id', professorId);
    
    // Construir a URL base para notas
    let baseUrl = CONFIG.getApiUrl('/notas');
    let url = `${baseUrl}?${params.toString()}`;
    console.log('URL de consulta para notas:', url);
    
        // Configurar timeout para evitar espera infinita
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        // Buscar notas com tratamento de erros aprimorado
        fetch(url, { signal: controller.signal })
        .then(response => {
            console.log("Resposta da API:", response.status, response.statusText);
                clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos:', data);
            
            // Garantir que temos um array para trabalhar
            let notas = Array.isArray(data) ? data : (data.notas || []);
            
            console.log('Array de notas processado:', notas);
            
            // Filtrar as notas para garantir que são apenas do professor atual
                // E aplicar os filtros selecionados
                notas = notas.filter(nota => {
                    // Primeiro filtrar por professor
                    const professorMatch = !nota.professor_id || 
                                         nota.professor_id == professorId || 
                                         nota.id_professor == professorId;
                    
                    if (!professorMatch) return false;
                    
                    // Aplicar filtro de turma se selecionado
                    if (idTurma && nota.id_turma != idTurma) {
                        return false;
                    }
                    
                    // Aplicar filtro de disciplina se selecionado
                    if (idDisciplina && nota.id_disciplina != idDisciplina) {
                        return false;
                    }
                    
                    // Aplicar filtro de aluno se selecionado
                    if (idAluno && nota.id_aluno != idAluno) {
                        return false;
                    }
                    
                    // Aplicar filtro de ano se selecionado
                    if (ano && nota.ano != ano) {
                        return false;
                    }
                    
                    // Aplicar filtro de bimestre se selecionado
                    if (bimestre && nota.bimestre != bimestre) {
                        return false;
                    }
                    
                    return true;
                });
                
                console.log('Notas após aplicação dos filtros:', notas.length);
                
                // Buscar novamente a referência à tabela (pode ter mudado)
                const notasTabela = document.getElementById('notas-lista');
                if (!notasTabela) {
                    console.error('Tabela de notas desapareceu durante o carregamento!');
                    return;
                }
                
                // Se não temos notas, exibir mensagem
            if (!notas || notas.length === 0) {
                notasTabela.innerHTML = `
                    <tr class="text-center">
                        <td colspan="10">
                            <div class="alert alert-warning" role="alert">
                                <h4 class="alert-heading">Nenhuma nota encontrada</h4>
                                <p>Não foram encontradas notas com os filtros selecionados.</p>
                                <hr>
                                <p class="mb-0">Verifique se os filtros estão corretos e tente novamente.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
                // Ordenar notas por aluno, disciplina, turma e bimestre
            notas.sort((a, b) => {
                // Primeiro por nome do aluno
                const nomeA = a.nome_aluno || '';
                const nomeB = b.nome_aluno || '';
                const compareNome = nomeA.localeCompare(nomeB);
                    if (compareNome !== 0) return compareNome;
                    
                    // Se nomes iguais, ordenar por disciplina
                    const discA = a.nome_disciplina || a.id_disciplina || '';
                    const discB = b.nome_disciplina || b.id_disciplina || '';
                    const compareDisc = discA.localeCompare(discB);
                    if (compareDisc !== 0) return compareDisc;
                    
                    // Se disciplinas iguais, ordenar por turma
                    const turmaA = a.id_turma || '';
                    const turmaB = b.id_turma || '';
                    const compareTurma = turmaA.localeCompare(turmaB);
                    if (compareTurma !== 0) return compareTurma;
                    
                    // Por fim, ordenar por bimestre
                    return (a.bimestre || 0) - (b.bimestre || 0);
            });
            
            // Gerar HTML para a tabela
            let html = '';
                
                // Coletar IDs dos alunos, turmas e disciplinas que precisamos buscar
                const alunosIDs = new Set();
                const turmasIDs = new Set();
                const disciplinasIDs = new Set();
            
            notas.forEach(nota => {
                    const alunoId = nota.id_aluno || nota.aluno_id;
                    const turmaId = nota.id_turma || nota.turma_id;
                    const disciplinaId = nota.id_disciplina || nota.disciplina_id;
                    
                    if (alunoId && !dadosAlunos[alunoId]) alunosIDs.add(alunoId);
                    if (turmaId && !dadosTurmas[turmaId]) turmasIDs.add(turmaId);
                    if (disciplinaId && !dadosDisciplinas[disciplinaId]) disciplinasIDs.add(disciplinaId);
                });
                
                console.log("Dados complementares a buscar:", { 
                    alunos: Array.from(alunosIDs), 
                    turmas: Array.from(turmasIDs), 
                    disciplinas: Array.from(disciplinasIDs) 
                });
                
                // Carregar os dados dos alunos faltantes
                const promessasAlunos = Array.from(alunosIDs).map(alunoId => {
                    return fetch(CONFIG.getApiUrl(`/alunos/${alunoId}`))
                        .then(response => response.ok ? response.json() : null)
                        .then(aluno => {
                            if (aluno) {
                                dadosAlunos[alunoId] = aluno;
                                console.log(`Aluno ${alunoId} carregado:`, aluno);
                            }
                        })
                        .catch(error => {
                            console.error(`Erro ao carregar aluno ${alunoId}:`, error);
                        });
                });
                
                // Aguardar carregamento de dados complementares
                Promise.all(promessasAlunos)
                    .then(() => {
                        // Iterar sobre as notas com os dados complementares
                        notas.forEach(nota => {
                            // Obter ID do aluno (que pode estar em campos diferentes)
                            const alunoId = nota.id_aluno || nota.aluno_id;
                            // Obter dados completos do aluno
                            const aluno = dadosAlunos[alunoId] || {};
                            
                // Garantir que todos os campos necessários existam
                const notaMensal = nota.nota_mensal !== undefined ? nota.nota_mensal : null;
                const notaBimestral = nota.nota_bimestral !== undefined ? nota.nota_bimestral : null;
                const recuperacao = nota.recuperacao !== undefined ? nota.recuperacao : null;
                
                            // Calcular média corretamente ou usar a que veio da API
                let media = nota.media !== undefined ? nota.media : null;
                
                if (media === null) {
                    if (notaMensal !== null && notaBimestral !== null) {
                        // Calcular média inicial: (mensal + bimestral) / 2
                        const notaMensalNum = parseFloat(notaMensal);
                        const notaBimestralNum = parseFloat(notaBimestral);
                        
                        if (!isNaN(notaMensalNum) && !isNaN(notaBimestralNum)) {
                            // Média inicial
                            const mediaInicial = (notaMensalNum + notaBimestralNum) / 2;
                            console.log(`Nota ${nota.id}: Média inicial (${notaMensalNum} + ${notaBimestralNum})/2 = ${mediaInicial.toFixed(1)}`);
                            
                            // Inicialmente, usar a média inicial
                            media = mediaInicial;
                            
                            // Se há recuperação, calcular (média inicial + recuperação) / 2
                            if (recuperacao !== null) {
                                const recNum = parseFloat(recuperacao);
                                if (!isNaN(recNum)) {
                                    media = (mediaInicial + recNum) / 2;
                                    console.log(`Nota ${nota.id}: Média com recuperação (${mediaInicial.toFixed(1)} + ${recNum}) / 2 = ${media.toFixed(1)}`);
                                }
                            }
                        }
                    } else if (notaMensal !== null) {
                        media = parseFloat(notaMensal);
                    } else if (notaBimestral !== null) {
                        media = parseFloat(notaBimestral);
                    }
                }
                
                // Determinar status com base na média
                            let status = '';
                let statusClass = '';
                
                if (media !== null) {
                    const mediaNum = parseFloat(media);
                    if (!isNaN(mediaNum)) {
                        if (mediaNum >= 6) {
                            // Se a média é 6 ou maior, o aluno está aprovado, independentemente de ter recuperação
                            status = 'Aprovado';
                            statusClass = 'bg-success text-white';
                        } else if (recuperacao !== null) {
                            // Se tem recuperação mas média < 6, está em recuperação
                            status = 'Recuperação';
                            statusClass = 'bg-warning';
                        } else {
                            // Se não tem recuperação e média < 6, está reprovado
                            status = 'Reprovado';
                            statusClass = 'bg-danger text-white';
                        }
                    }
                }
                
                            // Formatação para exibição
                const formatarNota = (valor) => {
                                if (valor === null || valor === undefined) return '-';
                                const num = parseFloat(valor);
                                return isNaN(num) ? '-' : num.toFixed(1);
                };
                
                            // Obter o nome do aluno de onde estiver disponível
                            const nomeAluno = aluno.nome_aluno || aluno.nome || nota.nome_aluno || 'N/A';
                            
                            // Criar a linha da tabela
                html += `
                    <tr>
                                    <td>${nomeAluno}</td>
                                    <td>${nota.nome_disciplina || nota.id_disciplina || 'N/A'}</td>
                                    <td>${nota.nome_turma || nota.id_turma || 'N/A'}</td>
                                    <td>${nota.bimestre ? nota.bimestre + 'º' : 'N/A'}</td>
                        <td>${formatarNota(notaMensal)}</td>
                        <td>${formatarNota(notaBimestral)}</td>
                        <td>${formatarNota(recuperacao)}</td>
                                    <td><strong>${formatarNota(media)}</strong></td>
                                    <td><span class="badge ${statusClass}">${status || 'N/A'}</span></td>
                        <td>
                                        <div class="btn-group" role="group">
                                            <button type="button" class="btn btn-sm btn-outline-primary" 
                                                    onclick="editarNota('${nota.id || nota.id_nota}')">
                                <i class="fas fa-edit"></i>
                            </button>
                                        </div>
                        </td>
                    </tr>
                `;
            });
            
                        // Atualizar a tabela
            notasTabela.innerHTML = html;
                        
                        // Registrar atividade
                        const turmaTexto = idTurma ? (filtroTurma.options[filtroTurma.selectedIndex]?.text || idTurma) : 'Todas';
                        const disciplinaTexto = idDisciplina ? (filtroDisciplina.options[filtroDisciplina.selectedIndex]?.text || idDisciplina) : 'Todas';
                        
                        registrarAtividade('consulta', 'notas', professorId, 
                            `Consulta de notas com filtros - Turma: ${turmaTexto}, Disciplina: ${disciplinaTexto}`);
                        
                        console.log('Notas carregadas com sucesso:', notas.length);
        })
        .catch(error => {
                        console.error("Erro ao carregar dados complementares:", error);
                        
                        // Mesmo com erro, exibir os dados que temos
                        notasTabela.innerHTML = html;
                    });
            })
            .catch(error => {
                clearTimeout(timeoutId);
                console.error("Erro ao carregar notas:", error);
                
                // Exibir mensagem de erro na tabela
                const notasTabela = document.getElementById('notas-lista');
                if (notasTabela) {
            notasTabela.innerHTML = `
                <tr class="text-center">
                    <td colspan="10">
                        <div class="alert alert-danger" role="alert">
                            <h4 class="alert-heading">Erro ao carregar notas</h4>
                                    <p>${error.message || 'Ocorreu um erro ao tentar carregar as notas.'}</p>
                                    <hr>
                                    <p class="mb-0">Verifique sua conexão e tente novamente mais tarde.</p>
                        </div>
                    </td>
                </tr>
            `;
                }
                
                // Se foi erro de timeout, alertar o usuário
                if (error.name === 'AbortError') {
                    alert('A requisição demorou muito tempo. Verifique sua conexão e tente novamente.');
                }
            });
    } catch (error) {
        console.error('Erro ao preparar requisição de notas:', error);
        alert('Ocorreu um erro ao preparar a requisição. Consulte o console para mais detalhes.');
    }
}

// Função para editar uma nota existente
function editarNota(notaId) {
    console.log('Iniciando edição da nota ID:', notaId);
    
    // Verificar se o formulário existe
    let form = document.getElementById('form-nota');
    if (!form) {
        console.error('Formulário de notas não encontrado!');
        
        // Tentar encontrar o container e criar o formulário
        const notasContainer = document.querySelector('#conteudo-notas');
        if (notasContainer) {
            console.log('Tentando criar o formulário de edição de notas...');
            
            // Criar o card para o formulário
            const formCard = document.createElement('div');
            formCard.className = 'card shadow mb-4';
            formCard.innerHTML = `
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 class="m-0 font-weight-bold text-primary" id="form-nota-titulo">Editar Nota</h6>
                    <button class="btn btn-outline-secondary btn-sm" id="btn-cancelar-nota">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
                <div class="card-body">
                    <form id="form-nota">
                        <input type="hidden" id="form-modo-nota" value="editar">
                        <input type="hidden" id="nota-index" value="${notaId}">
                        
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="ano_nota" class="form-label">Ano</label>
                                <select class="form-select" id="ano_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="bimestre" class="form-label">Bimestre</label>
                                <select class="form-select" id="bimestre" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="turma_nota" class="form-label">Turma</label>
                                <select class="form-select" id="turma_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="disciplina_nota" class="form-label">Disciplina</label>
                                <select class="form-select" id="disciplina_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="aluno_nota" class="form-label">Aluno</label>
                                <select class="form-select" id="aluno_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="nota_mensal" class="form-label">Nota Mensal</label>
                                <input type="number" class="form-control" id="nota_mensal" min="0" max="10" step="0.1" placeholder="0.0 a 10.0">
                            </div>
                            <div class="col-md-4">
                                <label for="nota_bimestral" class="form-label">Nota Bimestral</label>
                                <input type="number" class="form-control" id="nota_bimestral" min="0" max="10" step="0.1" placeholder="0.0 a 10.0">
                            </div>
                            <div class="col-md-4">
                                <label for="recuperacao" class="form-label">Recuperação</label>
                                <input type="number" class="form-control" id="recuperacao" min="0" max="10" step="0.1" placeholder="0.0 a 10.0">
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="media" class="form-label">Média Final</label>
                                <input type="number" class="form-control" id="media" min="0" max="10" step="0.1" readonly placeholder="Calculada automaticamente">
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                            <button type="submit" class="btn btn-primary" id="btn-salvar-nota">
                                <i class="fas fa-save"></i> Salvar Notas
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            // Inserir antes da tabela de notas
            const tabelaCard = notasContainer.querySelector('.card:last-child');
            if (tabelaCard) {
                notasContainer.insertBefore(formCard, tabelaCard);
            } else {
                notasContainer.appendChild(formCard);
            }
            
            // Configurar o cancelamento
            const btnCancelar = document.getElementById('btn-cancelar-nota');
            if (btnCancelar) {
                btnCancelar.addEventListener('click', function(e) {
                    e.preventDefault();
                    formCard.remove();
                });
            }
            
            // Adicionar listener ao formulário
            const novoForm = document.getElementById('form-nota');
            if (novoForm) {
                novoForm.addEventListener('submit', handleFormSubmit);
                form = novoForm; // Atualizar a referência para continuar com a função
            } else {
                console.error('Falha ao criar o formulário de notas');
        return;
            }
        } else {
            console.error('Container de notas não encontrado, impossível criar formulário');
            alert('Erro: Formulário de notas não encontrado.');
            return;
        }
    }
    
    // Atualizar o título do formulário
    const formTitulo = document.getElementById('form-nota-titulo');
    if (formTitulo) {
        formTitulo.textContent = 'Editar Nota';
    }
    
    // Mostrar o botão de cancelar, se existir
    const btnCancelar = document.getElementById('btn-cancelar-nota');
    if (btnCancelar) {
        btnCancelar.style.display = 'inline-block';
        
        // Verificar se já tem o event listener para cancelar
        const hasListener = btnCancelar.getAttribute('data-has-listener') === 'true';
        if (!hasListener) {
            btnCancelar.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Resetar o formulário
                form.reset();
                form.removeAttribute('data-mode');
                form.removeAttribute('data-nota-id');
                
                // Atualizar o título do formulário
                if (formTitulo) {
                    formTitulo.textContent = 'Lançamento de Notas';
                }
                
                // Ocultar o botão de cancelar
                this.style.display = 'none';
                
                // Rolar para o topo do formulário
                form.scrollIntoView({ behavior: 'smooth' });
            });
            
            // Marcar que o listener foi adicionado
            btnCancelar.setAttribute('data-has-listener', 'true');
        }
    }
    
    // Definir o modo de edição e o ID da nota
    form.setAttribute('data-mode', 'edit');
    form.setAttribute('data-nota-id', notaId);
    
    // Criar e adicionar o spinner para indicar o carregamento
    const loadingSpinner = document.createElement('div');
    loadingSpinner.id = 'edit-loading-spinner';
    loadingSpinner.className = 'text-center mt-3';
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i><p>Carregando dados da nota...</p>';
    form.appendChild(loadingSpinner);
    
    // Desabilitar o botão salvar durante o carregamento
    const saveButton = form.querySelector('button[type="submit"]');
    if (saveButton) {
        saveButton.disabled = true;
    }
    
    // Rolagem para o formulário
    form.scrollIntoView({ behavior: 'smooth' });
    
    // Registrar a atividade de visualização
    registrarAtividade(
        'visualização',
        'notas',
        notaId,
        'Iniciou edição de nota',
        'em andamento'
    );
    
    // Preencher o campo de ano com opções padrão
    const anoSelect = document.getElementById('ano_nota');
    if (anoSelect) {
        anoSelect.innerHTML = '<option value="">Selecione...</option>';
        
        // Adicionar últimos 3 anos e próximos 3 anos
        const anoAtual = new Date().getFullYear();
        for (let ano = anoAtual - 3; ano <= anoAtual + 3; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            anoSelect.appendChild(option);
        }
    }
    
    // Preencher o campo de bimestre com opções padrão
    const bimestreSelect = document.getElementById('bimestre');
    if (bimestreSelect) {
        bimestreSelect.innerHTML = '<option value="">Selecione...</option>';
        
        // Adicionar os 4 bimestres
        for (let i = 1; i <= 4; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}º Bimestre`;
            bimestreSelect.appendChild(option);
        }
    }
    
    // Carregar todas as turmas
    const turmaSelect = document.getElementById('turma_nota');
    if (turmaSelect) {
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar turmas: ${response.status}`);
                }
                return response.json();
            })
            .then(turmas => {
                turmaSelect.innerHTML = '<option value="">Selecione...</option>';
                
                if (turmas && turmas.length > 0) {
                    turmas.forEach(turma => {
                        const id = turma.id_turma || turma.id;
                        const nome = turma.nome_turma || turma.nome || id;
                        
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = nome;
                        turmaSelect.appendChild(option);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar turmas:', error);
                turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            });
    }
    
    // Carregar os dados da nota
    fetch(CONFIG.getApiUrl(`/notas/${notaId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar dados da nota: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados da nota carregados:', data);
            
            // Verificar se os dados estão corretos
            const nota = data.nota || data;
            
            if (!nota || !nota.id_turma || !nota.id_disciplina || !nota.id_aluno) {
                console.error('Dados incompletos ou em formato incorreto:', nota);
                throw new Error('Dados incompletos ou em formato incorreto');
            }
            
            // Preencher campos do formulário
            document.getElementById('ano_nota').value = nota.ano || '';
            document.getElementById('bimestre').value = nota.bimestre || '';
            
            // Preencher o campo de turma e disparar o evento change
            const turmaSelect = document.getElementById('turma_nota');
            turmaSelect.value = nota.id_turma;
            
            // Armazenar referências para uso posterior
            const disciplinaSelect = document.getElementById('disciplina_nota');
            const alunoSelect = document.getElementById('aluno_nota');
            
            // Garantir que os selects estejam habilitados
            if (disciplinaSelect) disciplinaSelect.disabled = false;
            if (alunoSelect) alunoSelect.disabled = false;
            
            // Função para carregar disciplinas
            const carregarDisciplinas = () => {
                return new Promise((resolve, reject) => {
                    console.log('Carregando disciplinas para a turma:', nota.id_turma);
                    
                    // Limpar e desabilitar temporariamente
                    disciplinaSelect.innerHTML = '<option value="">Carregando disciplinas...</option>';
                    disciplinaSelect.disabled = true;
                    
                    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas/${nota.id_turma}/disciplinas`))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(disciplinas => {
                            console.log('Disciplinas carregadas:', disciplinas);
                            
                            // Preencher o select de disciplinas
                            disciplinaSelect.innerHTML = '<option value="">Selecione a Disciplina</option>';
                            disciplinas.forEach(disciplina => {
                                const option = document.createElement('option');
                                option.value = disciplina.id_disciplina;
                                option.textContent = disciplina.nome || disciplina.nome_disciplina;
                                disciplinaSelect.appendChild(option);
                            });
                            
                            // Reativar o select
                            disciplinaSelect.disabled = false;
                            
                            // Selecionar a disciplina da nota
                            disciplinaSelect.value = nota.id_disciplina;
                            console.log(`Disciplina selecionada: ${nota.id_disciplina}`);
                            
                            resolve();
                        })
                        .catch(error => {
                            console.error('Erro ao carregar disciplinas:', error);
                            disciplinaSelect.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
                            disciplinaSelect.disabled = false;
                            reject(error);
                        });
                });
            };
            
            // Função para carregar alunos
            const carregarAlunos = () => {
                return new Promise((resolve, reject) => {
                    console.log('Carregando alunos para a turma:', nota.id_turma);
                    
                    // Limpar e desabilitar temporariamente
                    alunoSelect.innerHTML = '<option value="">Carregando alunos...</option>';
                    alunoSelect.disabled = true;
                    
                    fetch(CONFIG.getApiUrl(`/turmas/${nota.id_turma}/alunos`))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar alunos: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(alunos => {
                            console.log('Alunos carregados:', alunos);
                            
                            // Preencher o select de alunos
                            alunoSelect.innerHTML = '<option value="">Selecione o Aluno</option>';
                            alunos.forEach(aluno => {
                                const option = document.createElement('option');
                                option.value = aluno.id_aluno;
                                option.textContent = aluno.nome_aluno || aluno.nome;
                                alunoSelect.appendChild(option);
                            });
                            
                            // Reativar o select
                            alunoSelect.disabled = false;
                            
                            // Selecionar o aluno da nota
                            alunoSelect.value = nota.id_aluno;
                            console.log(`Aluno selecionado: ${nota.id_aluno}`);
                            
                            resolve();
                        })
                        .catch(error => {
                            console.error('Erro ao carregar alunos:', error);
                            alunoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
                            alunoSelect.disabled = false;
                            reject(error);
                        });
                });
            };
            
            // Executar o carregamento em sequência
            return carregarDisciplinas()
                .then(() => carregarAlunos())
                .then(() => {
                    // Preencher os valores das notas
                    document.getElementById('nota_mensal').value = nota.nota_mensal !== null ? nota.nota_mensal : '';
                    document.getElementById('nota_bimestral').value = nota.nota_bimestral !== null ? nota.nota_bimestral : '';
                    document.getElementById('recuperacao').value = nota.recuperacao !== null ? nota.recuperacao : '';
                    
                    // Calcular e exibir a média arredondada para cima
                    const media = nota.media !== null ? Math.ceil(nota.media * 10) / 10 : null;
                    document.getElementById('media').value = media !== null ? media.toFixed(1) : '';
                    
                    // Garantir que todos os selects estejam visíveis e habilitados
                    if (turmaSelect) {
                        turmaSelect.style.display = 'block';
                        turmaSelect.disabled = false;
                    }
                    if (disciplinaSelect) {
                        disciplinaSelect.style.display = 'block';
                        disciplinaSelect.disabled = false;
                    }
                    if (alunoSelect) {
                        alunoSelect.style.display = 'block';
                        alunoSelect.disabled = false;
                    }
                    
                    // Registrar a atividade de visualização completada
                    registrarAtividade(
                        'visualização',
                        'notas',
                        notaId,
                        `Visualizou nota - Aluno: ${nota.id_aluno}, Turma: ${nota.id_turma}, Disciplina: ${nota.id_disciplina}, Bimestre: ${nota.bimestre}`,
                        'concluído'
                    );
                    
                    return nota;
                });
        })
        .catch(error => {
            console.error('Erro ao carregar dados da nota:', error);
            
            // Adicionar mensagem de erro
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger mt-3';
            errorMsg.innerHTML = `<i class="fas fa-times-circle"></i> Erro ao carregar dados da nota: ${error.message}`;
            form.appendChild(errorMsg);
            
            // Remover a mensagem após 3 segundos
            setTimeout(() => {
                errorMsg.remove();
            }, 3000);
            
            // Registrar a atividade de erro
            registrarAtividade(
                'visualização',
                'notas',
                notaId,
                `Erro ao carregar dados da nota: ${error.message}`,
                'erro'
            );
        })
        .finally(() => {
            // Remover o spinner
            const spinner = document.getElementById('edit-loading-spinner');
            if (spinner) {
                spinner.remove();
            }
            
            // Reativar o botão salvar
            if (saveButton) {
                saveButton.disabled = false;
            }
        });
}

// Função para lidar com o envio do formulário de notas
function handleFormSubmit(event) {
    // Impedir o comportamento padrão do formulário
    event.preventDefault();
    
    console.log('Formulário de notas submetido');
    
    // Obter referência ao formulário
    const form = event.target;
    
    // Verificar se é uma edição ou criação
    const isEditMode = form.getAttribute('data-mode') === 'edit';
    const notaId = isEditMode ? form.getAttribute('data-nota-id') : null;
    
    // Obter valores do formulário
    const ano = document.getElementById('ano_nota').value;
    const bimestre = document.getElementById('bimestre').value;
    const turma = document.getElementById('turma_nota').value;
    const disciplina = document.getElementById('disciplina_nota').value;
    const aluno = document.getElementById('aluno_nota').value;
    const notaMensal = document.getElementById('nota_mensal').value;
    const notaBimestral = document.getElementById('nota_bimestral').value;
    const recuperacao = document.getElementById('recuperacao').value;
    const media = document.getElementById('media').value;
    
    // Log dos valores obtidos
    console.log('Valores do formulário:', {
        ano, bimestre, turma, disciplina, aluno,
        notaMensal, notaBimestral, recuperacao, media
    });
    
    // Validar dados obrigatórios
    if (!ano || !bimestre || !turma || !disciplina || !aluno) {
        console.error('Campos obrigatórios não preenchidos');
        
        // Criar uma mensagem de status
        const statusMsg = document.createElement('div');
        statusMsg.className = 'alert alert-warning mt-3';
        statusMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Preencha todos os campos obrigatórios!';
        form.appendChild(statusMsg);
        
        // Remover a mensagem após 3 segundos
        setTimeout(() => {
            statusMsg.remove();
        }, 3000);
        
        return;
    }
    
    // Converter valores numéricos
    const notaMensalNum = notaMensal ? parseFloat(notaMensal) : null;
    const notaBimestralNum = notaBimestral ? parseFloat(notaBimestral) : null;
    const recuperacaoNum = recuperacao ? parseFloat(recuperacao) : null;
    
    // Calcular média final apenas se tiver ambas as notas (mensal e bimestral)
    let mediaFinal = null;
    if (notaMensalNum !== null && notaBimestralNum !== null) {
        mediaFinal = (notaMensalNum + notaBimestralNum) / 2;
        
        // Se tem recuperação e é maior que a média, usar a recuperação
        if (recuperacaoNum !== null && recuperacaoNum > mediaFinal) {
            mediaFinal = recuperacaoNum;
        }
        
        // Arredondar para uma casa decimal
        mediaFinal = Math.round(mediaFinal * 10) / 10;
    }
    
    // Preparar dados para envio
    const notaData = {
        id_aluno: aluno,
        id_turma: turma,
        id_disciplina: disciplina,
        ano: parseInt(ano),
        bimestre: parseInt(bimestre),
        nota_mensal: notaMensalNum,
        nota_bimestral: notaBimestralNum,
        recuperacao: recuperacaoNum,
        media: mediaFinal
    };
    
    console.log('Dados para envio:', notaData);
    
    // Criar elemento para mensagens de status
    const statusMsg = document.createElement('div');
    statusMsg.className = 'alert mt-3';
    form.appendChild(statusMsg);
    
    // Desabilitar o botão salvar para evitar cliques múltiplos
    const saveButton = form.querySelector('button[type="submit"]');
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    }
    
    // Construir URL adequada
    let url = CONFIG.getApiUrl('/notas');
    let method = 'POST';
    
    if (isEditMode && notaId) {
        url = CONFIG.getApiUrl(`/notas/${notaId}`);
        method = 'PUT';
        console.log(`Editando nota ID: ${notaId}`);
        
        // Obter textos dos selects para o log
        const alunoNome = document.getElementById('aluno_nota').options[document.getElementById('aluno_nota').selectedIndex].text;
        const turmaNome = document.getElementById('turma_nota').options[document.getElementById('turma_nota').selectedIndex].text;
        const disciplinaNome = document.getElementById('disciplina_nota').options[document.getElementById('disciplina_nota').selectedIndex].text;
        
        // Registrar tentativa de atualização no log
        registrarAtividade(
            'atualização',
            'notas',
            notaId,
            `Iniciou atualização - Aluno: ${alunoNome}, Turma: ${turmaNome}, Disciplina: ${disciplinaNome}, Bimestre: ${bimestre}`,
            'em andamento'
        );
    } else {
        console.log('Criando nova nota');
        
        // Obter textos dos selects para o log
        const alunoNome = document.getElementById('aluno_nota').options[document.getElementById('aluno_nota').selectedIndex].text;
        const turmaNome = document.getElementById('turma_nota').options[document.getElementById('turma_nota').selectedIndex].text;
        const disciplinaNome = document.getElementById('disciplina_nota').options[document.getElementById('disciplina_nota').selectedIndex].text;
        
        // Registrar tentativa de criação no log
        registrarAtividade(
            'criação',
            'notas',
            'nova',
            `Iniciou criação - Aluno: ${alunoNome}, Turma: ${turmaNome}, Disciplina: ${disciplinaNome}, Bimestre: ${bimestre}`,
            'em andamento'
        );
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
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('Nota salva com sucesso:', result);
        
        // ID da nota (resultado da criação ou ID existente na edição)
        const notaResultId = result.id || notaId || 'nova';
        
        // Obter textos dos selects para o log
        const alunoNome = document.getElementById('aluno_nota').options[document.getElementById('aluno_nota').selectedIndex].text;
        const turmaNome = document.getElementById('turma_nota').options[document.getElementById('turma_nota').selectedIndex].text;
        const disciplinaNome = document.getElementById('disciplina_nota').options[document.getElementById('disciplina_nota').selectedIndex].text;
        
        // Verificar se há discrepância na média
        if (result.media !== null && mediaFinal !== null && Math.abs(mediaFinal - result.media) > 0.05) {
            console.warn('Discrepância na média calculada:', {
                'calculada_no_cliente': mediaFinal,
                'calculada_no_servidor': result.media
            });
            statusMsg.className = 'alert alert-warning mt-3';
            statusMsg.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                Nota salva, mas há discrepância na média calculada! 
                <br>Local: ${mediaFinal.toFixed(1)}, Servidor: ${result.media.toFixed(1)}
            `;
            
            // Registrar atividade com aviso
            registrarAtividade(
                isEditMode ? 'atualização' : 'criação',
                'notas',
                notaResultId,
                `${isEditMode ? 'Atualização' : 'Criação'} com discrepância de média - Aluno: ${alunoNome}, Turma: ${turmaNome}, Disciplina: ${disciplinaNome}, Bimestre: ${bimestre}`,
                'concluído com aviso'
            );
            
            // Fechar o formulário após um breve atraso, mesmo com discrepância
            setTimeout(() => {
                // Procurar o card do formulário
                const formCard = form.closest('.card');
                if (formCard) {
                    formCard.remove();
                }
                
                // Recarregar a lista de notas
                carregarNotas();
                
                // Mostrar mensagem flutuante de sucesso
                mostrarMensagemFlutuante('Nota salva com sucesso!', 'success');
            }, 2000);
        } else {
            // Mensagem de sucesso
            statusMsg.className = 'alert alert-success mt-3';
            statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> Nota salva com sucesso!';
            
            // Registrar a atividade de sucesso
            registrarAtividade(
                isEditMode ? 'atualização' : 'criação',
                'notas',
                notaResultId,
                `${isEditMode ? 'Atualizou' : 'Criou'} nota - Aluno: ${alunoNome}, Turma: ${turmaNome}, Disciplina: ${disciplinaNome}, Bimestre: ${bimestre}`,
                'concluído'
            );
            
            // Fechar o formulário após um breve atraso
            setTimeout(() => {
                // Procurar o card do formulário
                const formCard = form.closest('.card');
                if (formCard) {
                    formCard.remove();
                }
                
                // Recarregar a lista de notas
                carregarNotas();
                
                // Mostrar mensagem flutuante de sucesso
                mostrarMensagemFlutuante('Nota salva com sucesso!', 'success');
            }, 1500);
        }
    })
    .catch(error => {
        console.error('Erro ao salvar nota:', error);
        
        // Mensagem de erro
        statusMsg.className = 'alert alert-danger mt-3';
        statusMsg.innerHTML = `<i class="fas fa-times-circle"></i> Erro ao salvar nota: ${error.message}`;
        
        // Registrar a atividade de erro
        registrarAtividade(
            isEditMode ? 'atualização' : 'criação',
            'notas',
            isEditMode ? notaId : 'nova',
            `Erro ao ${isEditMode ? 'atualizar' : 'criar'} nota - ${error.message}`,
            'erro'
        );
    })
    .finally(() => {
        // Reativar o botão de salvar
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar Notas';
        }
    });
}

// Função para mostrar mensagem flutuante temporária
function mostrarMensagemFlutuante(mensagem, tipo = 'success') {
    // Remover mensagem anterior se existir
    const msgAnterior = document.getElementById('mensagem-flutuante');
    if (msgAnterior) {
        msgAnterior.remove();
    }
    
    // Criar elemento de mensagem
    const msg = document.createElement('div');
    msg.id = 'mensagem-flutuante';
    msg.className = `mensagem-flutuante mensagem-${tipo}`;
    msg.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${mensagem}`;
    
    // Adicionar estilo ao elemento
    msg.style.position = 'fixed';
    msg.style.top = '20px';
    msg.style.right = '20px';
    msg.style.padding = '10px 20px';
    msg.style.borderRadius = '5px';
    msg.style.backgroundColor = tipo === 'success' ? '#d4edda' : '#f8d7da';
    msg.style.color = tipo === 'success' ? '#155724' : '#721c24';
    msg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    msg.style.zIndex = '9999';
    msg.style.transition = 'all 0.3s ease-in-out';
    msg.style.opacity = '0';
    
    // Adicionar ao corpo do documento
    document.body.appendChild(msg);
    
    // Tornar visível com animação
    setTimeout(() => {
        msg.style.opacity = '1';
    }, 10);
    
    // Remover após alguns segundos
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => {
            msg.remove();
        }, 300);
    }, 3000);
}

// Função para exibir a ficha detalhada do aluno
function exibirFichaAluno(idAluno) {
    console.log("Exibindo ficha do aluno:", idAluno);
    
    // Verificar se o ID do aluno é válido
    if (!idAluno) {
        alert('ID do aluno não fornecido.');
        return;
    }
    
    // Exibir um indicador de carregamento enquanto buscamos os dados
    const loadingModal = `
        <div class="modal fade" id="loadingModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-5">
            <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
            </div>
                        <p class="mt-3 mb-0">Carregando informações do aluno...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior se existir
    const existingModal = document.getElementById('alunoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const existingLoadingModal = document.getElementById('loadingModal');
    if (existingLoadingModal) {
        existingLoadingModal.remove();
    }
    
    // Adicionar o modal de carregamento
    document.body.insertAdjacentHTML('beforeend', loadingModal);
    const loading = new bootstrap.Modal(document.getElementById('loadingModal'));
    loading.show();
    
    // Buscar dados do aluno
    fetch(CONFIG.getApiUrl(`/alunos/${idAluno}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(aluno => {
            console.log("Dados do aluno:", aluno);
            
            // Fechar o modal de carregamento
            loading.hide();
            
            // Formatação de campos específicos
            const dataNascimento = aluno.data_nascimento || aluno.data_nasc;
            const dataNascFormatada = dataNascimento ? 
                new Date(dataNascimento).toLocaleDateString('pt-BR') : 'N/A';
                
            // Nome da mãe (pode estar em diferentes campos)
            const nomeMae = aluno.nome_mae || aluno.mae || aluno.responsavel || 'N/A';
            
            // Criar conteúdo do modal
            const modalContent = `
                <div class="modal fade" id="alunoModal" tabindex="-1" aria-labelledby="alunoModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header bg-light">
                                <h5 class="modal-title" id="alunoModalLabel">
                                    <i class="fas fa-user-graduate me-2"></i>Ficha do Aluno
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-4 text-center mb-3">
                                        <div class="border rounded-circle mx-auto d-flex align-items-center justify-content-center" style="width: 100px; height: 100px; background-color: #f8f9fa;">
                                            <i class="fas fa-user-graduate fa-3x text-primary"></i>
                                        </div>
                                        <h4 class="mt-3">${aluno.nome_aluno || 'Nome não disponível'}</h4>
                                        <p class="badge bg-info">${aluno.id_turma || 'Turma não informada'}</p>
                                    </div>
                                    <div class="col-md-8">
                                        <h5 class="border-bottom pb-2 mb-3">Informações do Aluno</h5>
                                        <div class="table-responsive">
                                            <table class="table table-bordered">
                                                <tbody>
                                                    <tr>
                                                        <th style="width: 40%">ID</th>
                                                        <td>${aluno.id_aluno || 'N/A'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Nome</th>
                                                        <td>${aluno.nome_aluno || 'N/A'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Turma</th>
                                                        <td>${aluno.nome_turma || aluno.id_turma || 'N/A'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Data de Nascimento</th>
                                                        <td>${dataNascFormatada}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Mãe/Responsável</th>
                                                        <td>${nomeMae}</td>
                                                    </tr>
                                                    <tr>
                                                        <th>Telefone</th>
                                                        <td>${aluno.telefone_responsavel || aluno.telefone || 'N/A'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mt-4">
                                    <div class="col-12">
                                        <h5 class="border-bottom pb-2 mb-3">Notas do Aluno</h5>
                                        <div class="table-responsive">
                                            <table class="table table-bordered table-sm">
                                                <thead class="table-light">
                                                    <tr>
                                                        <th>Disciplina</th>
                                                        <th>Bimestre</th>
                                                        <th>Nota Mensal</th>
                                                        <th>Nota Bimestral</th>
                                                        <th>Recuperação</th>
                                                        <th>Média</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="notas-aluno-tbody">
                                                    <tr>
                                                        <td colspan="6" class="text-center">
                                                            <div class="spinner-border spinner-border-sm text-primary" role="status">
                                                                <span class="visually-hidden">Carregando notas...</span>
                                                            </div>
                                                            <span class="ms-2">Carregando notas...</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                    <i class="fas fa-times me-1"></i>Fechar
                                </button>
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick="document.getElementById('notas-link').click()">
                                    <i class="fas fa-graduation-cap me-1"></i>Ir para Gestão de Notas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar o modal ao DOM
            document.body.insertAdjacentHTML('beforeend', modalContent);
            
            // Exibir o modal
            const modal = new bootstrap.Modal(document.getElementById('alunoModal'));
            modal.show();
            
            // Carregar as notas do aluno de forma independente 
            // (não bloqueamos a exibição do modal se as notas falharem)
            setTimeout(() => carregarNotasAluno(idAluno), 500);
            
            // Registrar atividade
            registrarAtividade('visualização', 'aluno', idAluno, `Aluno: ${aluno.nome_aluno || idAluno}`, 'concluído');
        })
        .catch(error => {
            console.error("Erro ao carregar dados do aluno:", error);
            
            // Fechar o modal de carregamento
            loading.hide();
            
            // Exibir um alerta mais amigável
            alert(`Não foi possível carregar os dados do aluno no momento. Por favor, tente novamente mais tarde.`);
        });
}

// Função para carregar as notas de um aluno específico
function carregarNotasAluno(idAluno) {
    console.log("Carregando notas do aluno:", idAluno);
    
    const tbody = document.getElementById('notas-aluno-tbody');
    if (!tbody) {
        console.error("Elemento notas-aluno-tbody não encontrado!");
        return;
    }
    
    // Exibir indicador de carregamento
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="spinner-border text-primary spinner-border-sm" role="status">
                    <span class="visually-hidden">Carregando notas...</span>
                </div>
                <span class="ms-2">Carregando notas...</span>
            </td>
        </tr>
    `;
    
    fetch(CONFIG.getApiUrl(`/alunos/${idAluno}/notas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(notasDoAluno => {
            console.log("Notas do aluno:", notasDoAluno);
            
            if (!notasDoAluno || notasDoAluno.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">Nenhuma nota registrada para este aluno.</td>
                    </tr>
                `;
                return;
            }
            
            // Limpar conteúdo atual
            tbody.innerHTML = '';
            
            // Exibir as notas
            notasDoAluno.forEach(nota => {
                const row = document.createElement('tr');
                
                // Determinar o status baseado na média
                let statusClass = '';
                const media = parseFloat(nota.media);
                
                if (!isNaN(media)) {
                    if (media >= 7) {
                        statusClass = 'status-aprovado';
                    } else if (media >= 5) {
                        statusClass = 'status-recuperacao';
                    } else {
                        statusClass = 'status-reprovado';
                    }
                }
                
                row.className = statusClass;
                row.innerHTML = `
                    <td>${nota.nome_disciplina || nota.id_disciplina || 'N/A'}</td>
                    <td>${nota.bimestre ? nota.bimestre + 'º Bimestre' : 'N/A'}</td>
                    <td>${nota.nota_mensal !== null && nota.nota_mensal !== undefined ? parseFloat(nota.nota_mensal).toFixed(1) : 'N/A'}</td>
                    <td>${nota.nota_bimestral !== null && nota.nota_bimestral !== undefined ? parseFloat(nota.nota_bimestral).toFixed(1) : 'N/A'}</td>
                    <td>${nota.recuperacao !== null && nota.recuperacao !== undefined ? parseFloat(nota.recuperacao).toFixed(1) : 'N/A'}</td>
                    <td><strong>${nota.media !== null && nota.media !== undefined ? parseFloat(nota.media).toFixed(1) : 'N/A'}</strong></td>
                `;
                
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar notas do aluno:", error);
            
            // Tratar o erro exibindo uma mensagem amigável
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <div class="alert alert-warning" role="alert">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Não foi possível carregar as notas deste aluno no momento.
                            <br>
                            <small class="text-muted">Tente novamente mais tarde ou acesse a seção de Gestão de Notas.</small>
                        </div>
                    </td>
                </tr>
            `;
        });
}

// Função para abrir o modo de lançamento em massa
function abrirModoLancamentoEmMassa() {
    console.log('Abrindo modo de lançamento em massa');
    
    // Obter os valores dos filtros necessários das variáveis globais
    const turmaId = window.filtroTurma ? window.filtroTurma.value : '';
    const disciplinaId = window.filtroDisciplina ? window.filtroDisciplina.value : '';
    const ano = window.filtroAno ? window.filtroAno.value : '';
    const bimestre = window.filtroBimestre ? window.filtroBimestre.value : '';
    
    console.log('Valores dos filtros para lançamento em massa:', {
        turmaId,
        disciplinaId, 
        ano, 
        bimestre,
        filtroTurma: window.filtroTurma,
        filtroDisciplina: window.filtroDisciplina
    });
    
    // Validar campos obrigatórios
    if (!turmaId || !disciplinaId || !ano || !bimestre) {
        const camposFaltantes = [];
        if (!turmaId) camposFaltantes.push('turma');
        if (!disciplinaId) camposFaltantes.push('disciplina');
        if (!ano) camposFaltantes.push('ano');
        if (!bimestre) camposFaltantes.push('bimestre');
        
        console.error('Campos obrigatórios não preenchidos:', camposFaltantes);
        alert(`Selecione ${camposFaltantes.join(', ')} antes de usar o lançamento em massa!`);
        return;
    }
    
    // Define a classe de status (correção da variável não definida)
    const statusClass = {
        'Aprovado': 'text-success',
        'Reprovado': 'text-danger',
        'Em Recuperação': 'text-warning'
    };
    
    // Tentar encontrar o container para a tabela de notas usando vários métodos
    let cardBody = null;
    
    // Primeiro, buscar pelo container de notas principal
    const notasContainer = document.querySelector('#conteudo-notas');
    if (!notasContainer) {
        console.error('Container principal de notas (#conteudo-notas) não encontrado!');
        alert('Erro: Container principal de notas não encontrado. Recarregue a página e tente novamente.');
        return;
    }
    
    // Método 1: Procurar pelo container específico
    cardBody = document.querySelector('.card-body.notas-container');
    
    // Método 2: Procurar pelo container com ID específico
    if (!cardBody) {
        cardBody = document.getElementById('notas-container');
    }
    
    // Método 3: Procurar pela tabela de notas e pegar seu parent
    if (!cardBody) {
        const tabelaNotas = document.getElementById('tabela-notas');
        if (tabelaNotas) {
            cardBody = tabelaNotas.closest('.card-body');
        }
    }
    
    // Método 4: Último caso, usar qualquer card-body dentro de conteudo-notas
    if (!cardBody) {
        cardBody = notasContainer.querySelector('.card-body');
    }
    
    // Se ainda não encontramos um cardBody válido, criar um
    if (!cardBody) {
        console.warn('Nenhum container de notas encontrado, criando um novo');
        
        // Criar novo card e adicionar ao container
        const novoCard = document.createElement('div');
        novoCard.className = 'card shadow mb-4';
        novoCard.innerHTML = `
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Lançamento de Notas em Massa</h6>
            </div>
            <div class="card-body notas-container" id="notas-container">
                <!-- Aqui será inserido o formulário de lançamento em massa -->
        </div>
    `;
    
        notasContainer.appendChild(novoCard);
        cardBody = novoCard.querySelector('.card-body');
    }
    
    // Ocultar a tabela de notas se existir
    const tabelaNotas = document.getElementById('tabela-notas');
    if (tabelaNotas) {
        console.log('Ocultando tabela de notas para mostrar formulário de lançamento em massa');
        tabelaNotas.style.display = 'none';
    }
    
    // Remover o formulário atual se já existir
    const formExistente = document.getElementById('form-lancamento-massa');
    if (formExistente) {
        formExistente.remove();
    }
    
    // Criar o formulário de lançamento em massa
    const form = document.createElement('div');
    form.id = 'form-lancamento-massa';
    form.className = 'table-responsive mt-3';
    
    form.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="font-weight-bold text-primary">Lançamento em Massa - ${turmaId} / ${disciplinaId} - ${bimestre}º Bimestre ${ano}</h6>
            <div>
                <button type="button" class="btn btn-success" id="btn-salvar-lancamento-massa">
                    <i class="fas fa-save"></i> Salvar
                </button>
                <button type="button" class="btn btn-secondary ms-2" id="btn-cancelar-lancamento-massa">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                    </div>
        </div>
        <table class="table table-bordered" id="tabela-lancamento-massa">
            <thead>
                <tr>
                    <th>Aluno</th>
                    <th style="width: 100px">Mensal</th>
                    <th style="width: 100px">Bimestral</th>
                    <th style="width: 100px">Recuperação</th>
                    <th style="width: 80px">Média</th>
                    <th style="width: 120px">Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando alunos...</span>
                        </div>
                        <p class="mt-2">Carregando alunos da turma...</p>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
    
    // Adicionar ao container
    cardBody.appendChild(form);
    
    // Primeiro, carregar todas as notas para a turma, disciplina, ano e bimestre
    console.log(`Buscando notas existentes - Turma: ${turmaId}, Disciplina: ${disciplinaId}, Ano: ${ano}, Bimestre: ${bimestre}`);
    
    // Buscar todas as notas para a turma/disciplina/ano/bimestre selecionados
    fetch(CONFIG.getApiUrl(`/notas?turma=${turmaId}&disciplina=${disciplinaId}&ano=${ano}&bimestre=${bimestre}`))
                .then(response => {
            if (response.status === 404) {
                console.log('Nenhuma nota encontrada para os filtros selecionados.');
                return [];
            }
            
                    if (!response.ok) {
                console.warn(`Erro ao buscar notas existentes: ${response.status}`);
                return [];
                    }
            
                    return response.json();
                })
                .then(notasExistentes => {
            console.log(`Encontradas ${notasExistentes.length} notas existentes para os filtros selecionados:`, notasExistentes);
            
            // Filtrar para garantir que apenas notas do bimestre, ano, turma e disciplina selecionados sejam incluídas
            const notasFiltradas = notasExistentes.filter(nota => {
                // Converter valores para facilitar comparação
                const notaBimestre = parseInt(nota.bimestre);
                const bimestreAlvo = parseInt(bimestre);
                const notaAno = parseInt(nota.ano);
                const anoAlvo = parseInt(ano);
                const notaTurma = nota.id_turma || '';
                const notaDisciplina = nota.id_disciplina || '';
                
                // Verificar correspondência de cada filtro
                const bimestreCorreto = notaBimestre === bimestreAlvo;
                const anoCorreto = notaAno === anoAlvo;
                const turmaCorreta = notaTurma === turmaId;
                const disciplinaCorreta = notaDisciplina === disciplinaId;
                
                // Realizar verificação completa
                const correspondenciaCorreta = bimestreCorreto && anoCorreto && turmaCorreta && disciplinaCorreta;
                
                // Logar para depuração se não corresponder
                if (!correspondenciaCorreta) {
                    console.warn(`Nota ID ${nota.id} ignorada: não corresponde aos filtros`, {
                        aluno: nota.id_aluno,
                        bimestre: `${nota.bimestre}/${bimestre} - ${bimestreCorreto ? 'OK' : 'INCORRETO'}`,
                        ano: `${nota.ano}/${ano} - ${anoCorreto ? 'OK' : 'INCORRETO'}`,
                        turma: `${nota.id_turma}/${turmaId} - ${turmaCorreta ? 'OK' : 'INCORRETO'}`,
                        disciplina: `${nota.id_disciplina}/${disciplinaId} - ${disciplinaCorreta ? 'OK' : 'INCORRETO'}`
                    });
                }
                
                return correspondenciaCorreta;
            });
            
            console.log(`Após filtragem completa, restaram ${notasFiltradas.length} notas válidas para exibição.`);
            
            // Criar mapa para acesso rápido às notas por ID do aluno
            const notasPorAluno = new Map();
            notasFiltradas.forEach(nota => {
                notasPorAluno.set(nota.id_aluno, nota);
            });
            
            // Carregar os alunos da turma
            return fetch(CONFIG.getApiUrl(`/turmas/${turmaId}/alunos`))
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar alunos: ${response.status}`);
                    }
                    return response.json();
                })
                .then(alunos => {
                    // Ordenar alunos por nome
                    alunos.sort((a, b) => {
                        const nomeA = (a.nome_aluno || a.nome || a.id_aluno || '').toString();
                        const nomeB = (b.nome_aluno || b.nome || b.id_aluno || '').toString();
                        return nomeA.localeCompare(nomeB);
                    });
                    
                    console.log(`Carregados ${alunos.length} alunos para lançamento em massa`);
                    
                    // Preencher a tabela com os alunos e suas notas (se existirem)
                    const tbody = document.querySelector('#tabela-lancamento-massa tbody');
                    if (!tbody) {
                        throw new Error('Tabela de lançamento em massa não encontrada!');
                    }
                    
                    tbody.innerHTML = '';
                    
                    alunos.forEach(aluno => {
                        const tr = document.createElement('tr');
                        tr.dataset.alunoId = aluno.id_aluno;
                        
                        // Buscar a nota existente para este aluno (se houver)
                        const nota = notasPorAluno.get(aluno.id_aluno);
                        
                        // Valores iniciais da nota (ou vazio se não existir)
                        const notaMensal = nota ? (nota.nota_mensal !== null ? nota.nota_mensal : '') : '';
                        const notaBimestral = nota ? (nota.nota_bimestral !== null ? nota.nota_bimestral : '') : '';
                        const notaRecuperacao = nota ? (nota.recuperacao !== null ? nota.recuperacao : '') : '';
                        
                        // Calcular média e status
                        let media = '';
                        let status = '';
                        
                        if (notaMensal !== '' && notaBimestral !== '') {
                            const mensal = parseFloat(notaMensal) || 0;
                            const bimestral = parseFloat(notaBimestral) || 0;
                            
                            // Calcular média básica (média inicial)
                            let mediaInicial = (mensal + bimestral) / 2;
                            console.log(`Aluno ${aluno.id_aluno}: Média inicial (${mensal} + ${bimestral})/2 = ${mediaInicial.toFixed(1)}`);
                            
                            // Inicialmente, usamos a média inicial
                            let mediaCalculada = mediaInicial;
                            
                            // Considerar recuperação se existir
                            if (notaRecuperacao !== '') {
                                const recuperacao = parseFloat(notaRecuperacao) || 0;
                                // Nova fórmula: (média inicial + recuperação) / 2
                                mediaCalculada = (mediaInicial + recuperacao) / 2;
                                console.log(`Aluno ${aluno.id_aluno}: Média com recuperação (${mediaInicial.toFixed(1)} + ${recuperacao}) / 2 = ${mediaCalculada.toFixed(1)}`);
                            }
                            
                            // Arredondar para uma casa decimal
                            media = mediaCalculada.toFixed(1);
                            console.log(`Aluno ${aluno.id_aluno}: Média final = ${media}`);
                            
                            // Definir status
                            if (parseFloat(media) >= 6) {
                                status = 'Aprovado';
                            } else {
                                // Se tem nota de recuperação, o status é "Em Recuperação"
                                // Se não tem e média < 6, é "Reprovado"
                                status = notaRecuperacao !== '' ? 'Em Recuperação' : 'Reprovado';
                                
                                // Se já está em recuperação e ainda está abaixo de 6, então é "Reprovado"
                                if (notaRecuperacao !== '' && parseFloat(media) < 6) {
                                    status = 'Reprovado';
                                }
                            }
                        }
                        
                        // Determinar a classe CSS para o status
                        const statusClasse = statusClass[status] || '';
                        
                        // Se temos nota existente, adicionar uma indicação visual
                        const temNotaExistente = nota ? true : false;
                        const rowClass = temNotaExistente ? 'has-existing-data' : '';
                        const notaIndicator = temNotaExistente ? 
                            '<span class="badge bg-info text-white ms-2" title="Nota existente">Existente</span>' : '';
                        
                        tr.className = rowClass;
                        tr.innerHTML = `
                            <td>${aluno.nome_aluno || aluno.nome || aluno.id_aluno}${notaIndicator}</td>
                            <td>
                                <input type="number" class="form-control nota-mensal" min="0" max="10" step="0.1" value="${notaMensal}" 
                                       onchange="atualizarMediaEStatus('${aluno.id_aluno}')">
                                </td>
                                <td>
                                <input type="number" class="form-control nota-bimestral" min="0" max="10" step="0.1" value="${notaBimestral}"
                                       onchange="atualizarMediaEStatus('${aluno.id_aluno}')">
                                </td>
                                <td>
                                <input type="number" class="form-control nota-recuperacao" min="0" max="10" step="0.1" value="${notaRecuperacao}"
                                       onchange="atualizarMediaEStatus('${aluno.id_aluno}')">
                                </td>
                                <td>
                                <span class="media">${media}</span>
                                </td>
                            <td>
                                <span class="status ${statusClasse}">${status}</span>
                                ${nota ? `<input type="hidden" class="nota-id" value="${nota.id}">` : ''}
                                </td>
                        `;
                        
                        tbody.appendChild(tr);
                    });
                    
                    // Adicionar estilo para linhas com dados existentes
                    const style = document.createElement('style');
                    style.textContent = `
                        .has-existing-data {
                            background-color: rgba(232, 244, 248, 0.5);
                        }
                        .has-existing-data td {
                            border-left: 3px solid #17a2b8;
                        }
                        
                        .linha-modificada td {
                            background-color: rgba(255, 251, 235, 0.5);
                            border-left: 3px solid #ffc107;
                        }
                        
                        .linha-modificada:not(.has-existing-data) td {
                            background-color: rgba(255, 251, 235, 0.5);
                            border-left: 3px solid #ffc107;
                        }
                        
                        .has-existing-data.linha-modificada td {
                            background-color: rgba(232, 244, 248, 0.3);
                            border-left: 3px solid #28a745;
                        }
                        
                        .icone-edicao i {
                            font-size: 0.85em;
                            color: #007bff;
                        }
                    `;
                    document.head.appendChild(style);
                    
                    // Adicionar eventos para os botões
                    const btnSalvar = document.getElementById('btn-salvar-lancamento-massa');
                    if (btnSalvar) {
                        btnSalvar.addEventListener('click', function() {
                            // Chamar a função para salvar o lançamento em massa
                        salvarLancamentoEmMassa();
                    });
                    }
                    
                    const btnCancelar = document.getElementById('btn-cancelar-lancamento-massa');
                    if (btnCancelar) {
                        btnCancelar.addEventListener('click', function() {
                            // Remover o formulário e mostrar a tabela de notas novamente
                            const formLancamento = document.getElementById('form-lancamento-massa');
                            if (formLancamento) {
                                formLancamento.remove();
                            }
                            
                            // Mostrar tabela de notas novamente
                            const tabelaNotas = document.getElementById('tabela-notas');
                            if (tabelaNotas) {
                                tabelaNotas.style.display = '';
                            }
                        });
                    }
                    
                    // Mensagem quando notas existentes são encontradas
                    if (notasExistentes.length > 0) {
                        mostrarMensagemFlutuante(`${notasExistentes.length} notas existentes foram carregadas.`, 'info');
                    }
                });
        })
        .catch(error => {
            console.error('Erro ao carregar alunos para lançamento em massa:', error);
            
            const tbody = document.querySelector('#tabela-lancamento-massa tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="alert alert-danger m-0">
                                <i class="fas fa-exclamation-circle"></i> 
                                Erro ao carregar dados: ${error.message}
                </div>
                        </td>
                    </tr>
            `;
            }
        });
}

// Função para atualizar média e status de um aluno no formulário de lançamento em massa
function atualizarMediaEStatus(alunoId) {
    console.log('Atualizando média e status para aluno:', alunoId);
    
    try {
        // Obter a linha do aluno na tabela
        const linha = document.querySelector(`tr[data-aluno-id="${alunoId}"]`);
        if (!linha) {
            console.error('Linha do aluno não encontrada:', alunoId);
            return;
        }
        
        // Obter campos de notas
        const notaMensalInput = linha.querySelector('.nota-mensal') || 
                                linha.querySelector('input[name^="nota_mensal_"]');
        const notaBimestralInput = linha.querySelector('.nota-bimestral') || 
                                   linha.querySelector('input[name^="nota_bimestral_"]');
        const notaRecuperacaoInput = linha.querySelector('.nota-recuperacao') || 
                                     linha.querySelector('input[name^="recuperacao_"]');
        const mediaCelula = linha.querySelector('.media') || 
                            linha.querySelector(`[class^="media-container-"]`);
        const statusCelula = linha.querySelector('.status') || 
                             linha.querySelector(`[class^="status-container-"]`);
        
        if (!notaMensalInput || !notaBimestralInput) {
            console.error('Campos de notas não encontrados para o aluno:', alunoId);
            return;
        }
        
        if (!mediaCelula || !statusCelula) {
            console.error('Campos de média ou status não encontrados para o aluno:', alunoId);
            return;
        }
        
        // Obter valores das notas
        const notaMensalValor = notaMensalInput.value.trim();
        const notaBimestralValor = notaBimestralInput.value.trim();
        const notaRecuperacaoValor = notaRecuperacaoInput ? notaRecuperacaoInput.value.trim() : '';
        
        // Converter para números (apenas se os valores estiverem preenchidos)
        const notaMensal = notaMensalValor !== '' ? parseFloat(notaMensalValor) : null;
        const notaBimestral = notaBimestralValor !== '' ? parseFloat(notaBimestralValor) : null;
        const notaRecuperacao = notaRecuperacaoValor !== '' ? parseFloat(notaRecuperacaoValor) : null;
        
        console.log('Valores de notas obtidos:', {
            aluno: alunoId,
            mensal: notaMensal,
            bimestral: notaBimestral,
            recuperacao: notaRecuperacao,
            mensalValor: notaMensalValor,
            bimestralValor: notaBimestralValor,
            recuperacaoValor: notaRecuperacaoValor
        });
        
        // Calcular média apenas se ambas as notas (mensal e bimestral) estiverem preenchidas
        let media = '';
        let status = '';
        
        if (notaMensal !== null && notaBimestral !== null) {
            // Calcular média inicial com notas mensal e bimestral
            let mediaInicial = (notaMensal + notaBimestral) / 2;
            console.log(`Média inicial (mensal + bimestral)/2: ${mediaInicial.toFixed(1)}`);
            
            // Calcular média final considerando recuperação, se existir
            let mediaCalculada = mediaInicial;
            
            if (notaRecuperacao !== null) {
                // Nova fórmula: (média inicial + recuperação) / 2
                mediaCalculada = (mediaInicial + notaRecuperacao) / 2;
                console.log(`Média com recuperação (${mediaInicial.toFixed(1)} + ${notaRecuperacao}) / 2 = ${mediaCalculada.toFixed(1)}`);
            }
            
            // Formatar média com uma casa decimal
            media = mediaCalculada.toFixed(1);
            console.log(`Média final calculada: ${media}`);
            
            // Definir status baseado na média
            if (parseFloat(media) >= 6) {
                status = 'Aprovado';
            } else {
                // Se tem nota de recuperação, o status é "Em Recuperação"
                // Se não tem e média < 6, é "Reprovado"
                status = notaRecuperacao !== null ? 'Em Recuperação' : 'Reprovado';
                
                // Se já está em recuperação e ainda está abaixo de 6, então é "Reprovado"
                if (notaRecuperacao !== null && parseFloat(media) < 6) {
                    status = 'Reprovado';
                }
            }
        }
        
        // Atualizar os campos de média e status
        mediaCelula.textContent = media;
        
        // Atualizar o texto e a classe do status
        statusCelula.textContent = status;
        
        // Definir classes de CSS baseado no status
        statusCelula.classList.remove('text-success', 'text-danger', 'text-warning');
        
        if (status === 'Aprovado') {
            statusCelula.classList.add('text-success');
        } else if (status === 'Reprovado') {
            statusCelula.classList.add('text-danger');
        } else if (status === 'Em Recuperação') {
            statusCelula.classList.add('text-warning');
        }
        
        // Marcar a linha como modificada para destacar visualmente
        linha.classList.add('linha-modificada');
        
        // Se a linha também tem dados existentes, mostrar um ícone de edição
        if (linha.classList.contains('has-existing-data')) {
            // Adicionar ícone apenas se ainda não existe
            if (!linha.querySelector('.icone-edicao')) {
                const iconeEdicao = document.createElement('span');
                iconeEdicao.className = 'icone-edicao ms-2';
                iconeEdicao.innerHTML = '<i class="fas fa-pencil-alt text-primary" title="Nota modificada"></i>';
                
                // Adicionar ao primeiro td (célula do nome)
                const primeiraCelula = linha.querySelector('td:first-child');
                if (primeiraCelula) {
                    primeiraCelula.appendChild(iconeEdicao);
                }
            }
        }
        
        // Habilitar o botão de salvar
        const btnSalvar = document.getElementById('btn-salvar-lancamento-massa');
        if (btnSalvar) {
            btnSalvar.disabled = false;
        }
        
        console.log('Média e status atualizados:', { 
            aluno: alunoId, 
            media: media, 
            status: status 
        });
    } catch (error) {
        console.error('Erro ao atualizar média e status:', error);
    }
}

// Definir funções globalmente para evitar erros de referência
window.novaNota = novaNota;
window.abrirModoLancamentoEmMassa = abrirModoLancamentoEmMassa;
window.carregarTurmasDoProfessor = carregarTurmasDoProfessor;
window.carregarDisciplinasDoProfessor = carregarDisciplinasDoProfessor;
window.carregarAlunosDaTurma = carregarAlunosDaTurma;
window.inicializarTabelaNotas = inicializarTabelaNotas;
window.carregarNotas = carregarNotas;
window.editarNota = editarNota;
window.carregarDisciplinasParaFiltro = carregarDisciplinasParaFiltro;
window.carregarAlunosParaFiltro = carregarAlunosParaFiltro;
window.handleFormSubmit = handleFormSubmit;

// Função para corrigir o header da card de notas
function corrigirHeaderNotas() {
    console.log('Verificando e corrigindo o header da card de notas');
    
    try {
        // Primeiro, encontrar o container de notas principal
        const notasContainer = document.querySelector('#conteudo-notas');
        if (!notasContainer) {
            console.error('Container de notas (#conteudo-notas) não encontrado');
            return;
        }
        
        // Procurar por cards existentes no container
        const cards = notasContainer.querySelectorAll('.card');
        console.log(`Encontradas ${cards.length} cards no container de notas`);
        
        // Verificar se temos pelo menos 2 cards (filtros + conteúdo)
        // Se não, a estrutura ainda não está completa
        if (cards.length < 2) {
            console.warn('Estrutura de cards incompleta, é necessário ter pelo menos 2 cards');
            // Não retornaremos aqui, tentaremos corrigir
        }
        
        // A segunda card geralmente contém a tabela de notas
        let cardNotas = cards.length >= 2 ? cards[1] : null;
        
        // Se não encontramos a card ou ela não tem o header certo, buscamos manualmente
        if (!cardNotas || !cardNotas.querySelector('.card-header')) {
            console.log('Buscando card de notas alternativa');
            
            // Verificar todas as cards
            for (const card of cards) {
                // Verificar se há header com texto de notas
                const header = card.querySelector('.card-header');
                if (header && (
                    header.textContent.includes('Notas') ||
                    header.textContent.includes('notas') ||
                    header.textContent.includes('Lançamento') ||
                    header.textContent.includes('Gestão')
                )) {
                    cardNotas = card;
                    console.log('Card de notas encontrada por texto no header');
                    break;
                }
                
                // Verificar se a card tem tabela com colunas típicas de notas
                const tabela = card.querySelector('table');
                if (tabela) {
                    const cabecalhos = tabela.querySelectorAll('th');
                    let ehTabelaNotas = false;
                    
                    cabecalhos.forEach(th => {
                        if (
                            th.textContent.includes('Nota') ||
                            th.textContent.includes('Bimestre') ||
                            th.textContent.includes('Média') ||
                            th.textContent.includes('Aluno')
                        ) {
                            ehTabelaNotas = true;
                        }
                    });
                    
                    if (ehTabelaNotas) {
                        cardNotas = card;
                        console.log('Card de notas encontrada pela tabela');
                        break;
                    }
                }
            }
        }
        
        // Se ainda não encontramos, criamos uma nova card
        if (!cardNotas) {
            console.log('Criando nova card para notas');
            cardNotas = document.createElement('div');
            cardNotas.className = 'card shadow mb-4';
            
            // Colocar a card no final do container
            notasContainer.appendChild(cardNotas);
        }
        
        // Verificar se a card tem um header
        let cardHeader = cardNotas.querySelector('.card-header');
        
        // Se não tiver, criamos um novo
        if (!cardHeader) {
            console.log('Criando novo header para card de notas');
            cardHeader = document.createElement('div');
            cardHeader.className = 'card-header py-3 lancamento-notas';
            
            // Verificar se a card tem algum elemento antes do corpo
            const primeiroElemento = cardNotas.firstChild;
            
            // Inserir o header no início da card
            if (primeiroElemento) {
                cardNotas.insertBefore(cardHeader, primeiroElemento);
            } else {
                cardNotas.appendChild(cardHeader);
            }
        }
        
        // Garantir que o header tenha a classe correta
        if (!cardHeader.classList.contains('lancamento-notas')) {
            cardHeader.classList.add('lancamento-notas');
        }
        
        // Verificar se já existe um container flex para os elementos
        let headerContainer = cardHeader.querySelector('.d-flex');
        
        // Se não existir, criar um novo
        if (!headerContainer) {
            console.log('Criando container flex para header de notas');
            
            // Salvar o conteúdo atual para recolocá-lo depois
            const conteudoAtual = cardHeader.innerHTML;
            
            // Criar estrutura base do header
            headerContainer = document.createElement('div');
            headerContainer.className = 'd-flex justify-content-between align-items-center w-100';
            
            // Título
            const titulo = document.createElement('h5');
            titulo.className = 'card-title mb-0';
            titulo.textContent = 'Gestão de Notas';
            
            // Container de botões
            const botoesContainer = document.createElement('div');
            botoesContainer.className = 'd-flex';
            
            // Adicionar título e botões ao container principal
            headerContainer.appendChild(titulo);
            headerContainer.appendChild(botoesContainer);
            
            // Limpar o header e adicionar a nova estrutura
            cardHeader.innerHTML = '';
            cardHeader.appendChild(headerContainer);
        }
        
        // Garantir que temos o container de botões
        let botoesContainer = headerContainer.querySelector('div.d-flex');
        if (!botoesContainer) {
            botoesContainer = document.createElement('div');
            botoesContainer.className = 'd-flex';
            headerContainer.appendChild(botoesContainer);
        }
        
        // Verificar se existe o título e criá-lo se necessário
        let titulo = headerContainer.querySelector('h5.card-title');
        if (!titulo) {
            titulo = document.createElement('h5');
            titulo.className = 'card-title mb-0';
            titulo.textContent = 'Gestão de Notas';
            headerContainer.insertBefore(titulo, botoesContainer);
        }
        
        // Verificar se temos o botão de nova nota
        let btnNovaNota = botoesContainer.querySelector('#btn-nova-nota');
        if (!btnNovaNota) {
            console.log('Criando botão de nova nota');
            btnNovaNota = document.createElement('button');
            btnNovaNota.id = 'btn-nova-nota';
            btnNovaNota.className = 'btn btn-primary';
            btnNovaNota.innerHTML = '<i class="fas fa-plus-circle me-1"></i> Novo Lançamento';
            botoesContainer.appendChild(btnNovaNota);
            
            // Adicionar evento usando window.novaNota para referência global
            btnNovaNota.addEventListener('click', function() {
                console.log('Botão de nova nota clicado');
                if (typeof window.novaNota === 'function') {
                    window.novaNota();
                } else {
                    console.error('Função novaNota não encontrada ou não está definida');
                    alert('Erro: Função para novo lançamento não está disponível');
                }
            });
        } else if (!btnNovaNota.onclick) {
            // Se o botão já existe mas não tem evento
            btnNovaNota.addEventListener('click', function() {
                console.log('Botão de nova nota clicado');
                if (typeof window.novaNota === 'function') {
                    window.novaNota();
                } else {
                    console.error('Função novaNota não encontrada ou não está definida');
                    alert('Erro: Função para novo lançamento não está disponível');
                }
            });
        }
        
        // Verificar se temos o botão de lançamento em massa
        let btnLancamentoMassa = botoesContainer.querySelector('#btn-lancamento-massa');
        if (!btnLancamentoMassa) {
            console.log('Criando botão de lançamento em massa');
            btnLancamentoMassa = document.createElement('button');
            btnLancamentoMassa.id = 'btn-lancamento-massa';
            btnLancamentoMassa.className = 'btn btn-success ms-2';
            btnLancamentoMassa.innerHTML = '<i class="fas fa-list-ol me-1"></i> Lançamento em Massa';
            botoesContainer.appendChild(btnLancamentoMassa);
            
            // Adicionar evento usando window.abrirModoLancamentoEmMassa para referência global
            btnLancamentoMassa.addEventListener('click', function() {
                console.log('Botão de lançamento em massa clicado');
                if (typeof window.abrirModoLancamentoEmMassa === 'function') {
                    window.abrirModoLancamentoEmMassa();
                } else {
                    console.error('Função abrirModoLancamentoEmMassa não encontrada ou não está definida');
                    alert('Erro: Função para lançamento em massa não está disponível');
                }
            });
        } else if (!btnLancamentoMassa.onclick) {
            // Se o botão já existe mas não tem evento
            btnLancamentoMassa.addEventListener('click', function() {
                console.log('Botão de lançamento em massa clicado');
                if (typeof window.abrirModoLancamentoEmMassa === 'function') {
                    window.abrirModoLancamentoEmMassa();
                } else {
                    console.error('Função abrirModoLancamentoEmMassa não encontrada ou não está definida');
                    alert('Erro: Função para lançamento em massa não está disponível');
                }
            });
        }
        
        console.log('Header da card de notas corrigido com sucesso');
    } catch (error) {
        console.error('Erro ao corrigir header da card de notas:', error);
    }
}

// Função para criar um novo lançamento de nota
function novaNota() {
    console.log('Iniciando função de nova nota');
    
    try {
        // Verificar se o container de notas existe
        const notasContainer = document.querySelector('#conteudo-notas');
        if (!notasContainer) {
            console.error('Container de notas não encontrado!');
            alert('Erro: Container de notas não encontrado.');
        return;
    }
    
        // Verificar se já existe o formulário
        let form = document.getElementById('form-nota');
        let formCard = document.querySelector('.card-nota-form');
        
        if (!form || !formCard) {
            console.log('Formulário não encontrado, criando novo');
            
            // Criar card para o formulário
            formCard = document.createElement('div');
            formCard.className = 'card shadow mb-4 card-nota-form';
            formCard.innerHTML = `
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 class="m-0 font-weight-bold text-primary" id="form-nota-titulo">Novo Lançamento de Notas</h6>
                    <button class="btn btn-sm btn-outline-secondary" id="btn-cancelar-nota">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                            </div>
                <div class="card-body">
                    <form id="form-nota">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="ano_nota" class="form-label">Ano</label>
                                <select class="form-select" id="ano_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="bimestre" class="form-label">Bimestre</label>
                                <select class="form-select" id="bimestre" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="turma_nota" class="form-label">Turma</label>
                                <select class="form-select" id="turma_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="disciplina_nota" class="form-label">Disciplina</label>
                                <select class="form-select" id="disciplina_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="aluno_nota" class="form-label">Aluno</label>
                                <select class="form-select" id="aluno_nota" required>
                                    <option value="">Selecione...</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="nota_mensal" class="form-label">Nota Mensal</label>
                                <input type="number" class="form-control" id="nota_mensal" min="0" max="10" step="0.1" placeholder="0.0 a 10.0">
                            </div>
                            <div class="col-md-4">
                                <label for="nota_bimestral" class="form-label">Nota Bimestral</label>
                                <input type="number" class="form-control" id="nota_bimestral" min="0" max="10" step="0.1" placeholder="0.0 a 10.0">
                            </div>
                            <div class="col-md-4">
                                <label for="recuperacao" class="form-label">Recuperação</label>
                                <input type="number" class="form-control" id="recuperacao" min="0" max="10" step="0.1" placeholder="0.0 a 10.0">
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label for="media" class="form-label">Média Final</label>
                                <input type="number" class="form-control" id="media" min="0" max="10" step="0.1" readonly placeholder="Calculada automaticamente">
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                            <button type="submit" class="btn btn-primary" id="btn-salvar-nota">
                                <i class="fas fa-save"></i> Salvar Notas
                            </button>
                        </div>
                    </form>
        </div>
    `;
            
            // Inserir antes da tabela de notas
            const tabelaCard = notasContainer.querySelector('.card:last-child');
            if (tabelaCard) {
                notasContainer.insertBefore(formCard, tabelaCard);
            } else {
                notasContainer.appendChild(formCard);
            }
            
            // Configurar o cancelamento
            const btnCancelar = document.getElementById('btn-cancelar-nota');
            if (btnCancelar) {
                btnCancelar.addEventListener('click', function(e) {
                    e.preventDefault();
                    formCard.remove();
                });
            } else {
                console.error('Botão de cancelar não encontrado após criação');
            }
            
            // Adicionar listener ao formulário
            const novoForm = document.getElementById('form-nota');
            if (novoForm) {
                novoForm.addEventListener('submit', window.handleFormSubmit || handleFormSubmit);
                form = novoForm; // Atualizar a referência para continuar com a função
            } else {
                console.error('Falha ao criar o formulário de notas');
                return;
            }
        } else {
            // Se o formulário já existe, mostrar o botão de cancelar
            const btnCancelar = document.getElementById('btn-cancelar-nota');
            if (btnCancelar) {
                btnCancelar.style.display = 'inline-block';
            }
        }
        
        // Atualizar o título do formulário
        const formTitulo = document.getElementById('form-nota-titulo');
        if (formTitulo) {
            formTitulo.textContent = 'Novo Lançamento de Notas';
        }
        
        // Limpar o formulário e definir para modo de criação
        if (form) {
            form.reset();
            form.setAttribute('data-mode', 'new');
            form.removeAttribute('data-nota-id');
        }
        
        // Preencher campos com valores do filtro
        const anoSelect = document.getElementById('ano_nota');
        const bimestreSelect = document.getElementById('bimestre');
        const turmaSelect = document.getElementById('turma_nota');
        const disciplinaSelect = document.getElementById('disciplina_nota');
        const alunoSelect = document.getElementById('aluno_nota');
        
        // Inicializar o campo de ano
        if (anoSelect) {
            const anoAtual = new Date().getFullYear();
            let opcoesAnos = '';
            
            for (let ano = anoAtual - 1; ano <= anoAtual + 2; ano++) {
                opcoesAnos += `<option value="${ano}" ${ano === anoAtual ? 'selected' : ''}>${ano}</option>`;
            }
            
            anoSelect.innerHTML = `<option value="">Selecione o ano</option>${opcoesAnos}`;
            
            // Preencher com o valor do filtro, se existir
            if (filtroAno && filtroAno.value) {
                anoSelect.value = filtroAno.value;
            }
        }
        
        // Inicializar o campo de bimestre
        if (bimestreSelect) {
            bimestreSelect.innerHTML = `
                <option value="">Selecione o bimestre</option>
                <option value="1">1º Bimestre</option>
                <option value="2">2º Bimestre</option>
                <option value="3">3º Bimestre</option>
                <option value="4">4º Bimestre</option>
            `;
            
            // Preencher com o valor do filtro, se existir
            if (filtroBimestre && filtroBimestre.value) {
                bimestreSelect.value = filtroBimestre.value;
            }
        }
        
        // Carregar turmas para o select
        if (turmaSelect) {
            // Desabilitar enquanto carrega
            turmaSelect.disabled = true;
            turmaSelect.innerHTML = '<option value="">Carregando turmas...</option>';
            
            // Obter ID do professor
            let idProfessor = professorId;
            if (!idProfessor) {
                idProfessor = sessionStorage.getItem('professorId');
            }
            
            if (!idProfessor) {
                console.error('ID do professor não disponível para carregar turmas no formulário');
                turmaSelect.innerHTML = '<option value="">Erro: ID do professor não disponível</option>';
                turmaSelect.disabled = false;
                return;
            }
            
            // Carregar turmas do professor
            fetch(CONFIG.getApiUrl(`/professores/${idProfessor}/turmas`))
                .then(response => {
            if (!response.ok) {
                        throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            return response.json();
        })
                .then(turmas => {
                    // Popular o select de turmas
                    turmaSelect.innerHTML = '<option value="">Selecione a turma</option>';
                    
                    if (turmas && turmas.length > 0) {
                        turmas.forEach(turma => {
                            const id = turma.id_turma || turma.id;
                            const nome = turma.nome_turma || turma.nome || id;
                            
                            const option = document.createElement('option');
                            option.value = id;
                            option.textContent = nome;
                            turmaSelect.appendChild(option);
                        });
                    }
                    
                    // Preencher com o valor do filtro, se existir
                    if (filtroTurma && filtroTurma.value) {
                        turmaSelect.value = filtroTurma.value;
                        
                        // Disparar o evento change para carregar disciplinas
                        const event = new Event('change');
                        turmaSelect.dispatchEvent(event);
                    }
                    
                    turmaSelect.disabled = false;
                })
                .catch(error => {
                    console.error('Erro ao carregar turmas para o formulário:', error);
                    turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                    turmaSelect.disabled = false;
                });
            
            // Adicionar evento para carregar disciplinas ao mudar a turma
            if (!turmaSelect.hasEventListener) {
                turmaSelect.addEventListener('change', function() {
                    const idTurma = this.value;
                    
                    // Carregar disciplinas para esta turma
                    if (disciplinaSelect) {
                        carregarDisciplinasParaFormulario(idTurma, disciplinaSelect);
                    }
                    
                    // Carregar alunos para esta turma
                    if (alunoSelect) {
                        carregarAlunosParaFormulario(idTurma, null, alunoSelect);
                    }
                });
                turmaSelect.hasEventListener = true;
            }
        }
        
        // Adicionar evento para o disciplinaSelect, se ainda não tiver
        if (disciplinaSelect && !disciplinaSelect.hasEventListener) {
            disciplinaSelect.addEventListener('change', function() {
                const idTurma = turmaSelect ? turmaSelect.value : '';
                const idDisciplina = this.value;
                
                // Carregar alunos para esta turma e disciplina
                if (alunoSelect && idTurma) {
                    carregarAlunosParaFormulario(idTurma, idDisciplina, alunoSelect);
                }
            });
            disciplinaSelect.hasEventListener = true;
        }
        
        // Configurar evento para calcular a média automaticamente
        const notaMensal = document.getElementById('nota_mensal');
        const notaBimestral = document.getElementById('nota_bimestral');
        const recuperacao = document.getElementById('recuperacao');
        const media = document.getElementById('media');
        
        const calcularMedia = function() {
            if (notaMensal && notaBimestral && media) {
                const nm = parseFloat(notaMensal.value) || 0;
                const nb = parseFloat(notaBimestral.value) || 0;
                const rec = parseFloat(recuperacao.value) || 0;
                
                // Só calcular a média quando ambos estiverem preenchidos
                if (notaMensal.value && notaBimestral.value) {
                    let mediaFinal = (nm + nb) / 2;
                    
                    // Se tem recuperação e é maior que a média, usar a recuperação
                    if (rec > 0 && rec > mediaFinal) {
                        mediaFinal = rec;
                    }
                    
                    // Limitar a 1 casa decimal
                    mediaFinal = Math.round(mediaFinal * 10) / 10;
                    
                    media.value = mediaFinal;
                } else {
                    // Limpar o campo de média se não tem ambas as notas
                    media.value = '';
                }
            }
        };
        
        // Adicionar eventos para calcular a média
        if (notaMensal && !notaMensal.hasEventListener) {
            notaMensal.addEventListener('input', calcularMedia);
            notaMensal.hasEventListener = true;
        }
        
        if (notaBimestral && !notaBimestral.hasEventListener) {
            notaBimestral.addEventListener('input', calcularMedia);
            notaBimestral.hasEventListener = true;
        }
        
        if (recuperacao && !recuperacao.hasEventListener) {
            recuperacao.addEventListener('input', calcularMedia);
            recuperacao.hasEventListener = true;
        }
        
        // Rolar para o formulário
        formCard.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Formulário de nova nota inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao criar formulário de nova nota:', error);
        alert('Erro ao criar formulário de lançamento. Por favor, tente novamente.');
    }
}

// Função auxiliar para carregar disciplinas no formulário
function carregarDisciplinasParaFormulario(idTurma, selectElement) {
    if (!selectElement) return;
    
    // Desabilitar o select enquanto carrega
    selectElement.disabled = true;
    selectElement.innerHTML = '<option value="">Carregando disciplinas...</option>';
    
    // Obter ID do professor
    let idProfessor = professorId;
    if (!idProfessor) {
        idProfessor = sessionStorage.getItem('professorId');
    }
    
    if (!idProfessor) {
        console.error('ID do professor não disponível para carregar disciplinas no formulário');
        selectElement.innerHTML = '<option value="">Erro: ID do professor não disponível</option>';
        selectElement.disabled = false;
        return;
    }
    
    // Construir URL com base na turma fornecida
    let url = idTurma 
        ? CONFIG.getApiUrl(`/professores/${idProfessor}/turmas/${idTurma}/disciplinas`)
        : CONFIG.getApiUrl(`/professores/${idProfessor}/disciplinas`);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            // Popular o select de disciplinas
            selectElement.innerHTML = '<option value="">Selecione a disciplina</option>';
            
            if (disciplinas && disciplinas.length > 0) {
                disciplinas.forEach(disciplina => {
                    const id = disciplina.id_disciplina || disciplina.id;
                    const nome = disciplina.nome_disciplina || disciplina.nome || id;
                    
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = nome;
                    selectElement.appendChild(option);
                });
                
                // Preencher com o valor do filtro global, se existir
                if (filtroDisciplina && filtroDisciplina.value) {
                    selectElement.value = filtroDisciplina.value;
                    
                    // Disparar o evento change
                    const event = new Event('change');
                    selectElement.dispatchEvent(event);
                }
            }
            
            selectElement.disabled = false;
        })
        .catch(error => {
            console.error('Erro ao carregar disciplinas para o formulário:', error);
            selectElement.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            selectElement.disabled = false;
        });
}

// Função auxiliar para carregar alunos no formulário
function carregarAlunosParaFormulario(idTurma, idDisciplina, selectElement) {
    if (!selectElement) return;
    
    // Desabilitar o select enquanto carrega
    selectElement.disabled = true;
    selectElement.innerHTML = '<option value="">Carregando alunos...</option>';
    
    // Verificar se temos uma turma
    if (!idTurma) {
        selectElement.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        selectElement.disabled = false;
        return;
    }
    
    console.log(`Carregando alunos para o formulário. Turma: ${idTurma}, Disciplina: ${idDisciplina || 'não especificada'}`);
    
    // Lista de URLs a tentar, em ordem de prioridade
    const urls = [
        // Primeiro tenta o endpoint específico por disciplina
        idDisciplina 
            ? CONFIG.getApiUrl(`/turmas/${idTurma}/disciplinas/${idDisciplina}/alunos`) 
            : null,
        // Depois tenta apenas pela turma
        CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`),
        // Finalmente tenta com parâmetros de consulta
        CONFIG.getApiUrl(`/alunos?turma_id=${idTurma}${idDisciplina ? `&disciplina_id=${idDisciplina}` : ''}`)
    ].filter(Boolean); // Remove URLs null da lista
    
    // Função para tentar a próxima URL na lista
    function tentarProximaUrl(index = 0) {
        if (index >= urls.length) {
            // Se nenhuma URL funcionou, tentar buscar todos os alunos e filtrar manualmente
            console.log('Tentando obter todos os alunos como último recurso');
            return fetch(CONFIG.getApiUrl('/alunos'))
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao carregar todos os alunos: ${response.status}`);
                    }
                    return response.json();
                })
                .then(alunos => {
                    // Filtrar manualmente para a turma especificada
                    return alunos.filter(aluno => {
                        const turmaDoAluno = aluno.id_turma || aluno.turma_id || '';
                        return turmaDoAluno === idTurma || turmaDoAluno === parseInt(idTurma);
                    });
                });
        }
        
        console.log(`Tentativa ${index + 1}/${urls.length}: ${urls[index]}`);
        
        return fetch(urls[index])
            .then(response => {
                if (!response.ok) {
                    console.log(`URL ${urls[index]} falhou com status ${response.status}. Tentando próxima URL...`);
                    return tentarProximaUrl(index + 1);
                }
                return response.json();
            });
    }
    
    // Iniciar tentativas de requisição
    tentarProximaUrl()
        .then(alunos => {
            // Popular o select de alunos
            selectElement.innerHTML = '<option value="">Selecione o aluno</option>';
            
            if (alunos && alunos.length > 0) {
                console.log(`Encontrados ${alunos.length} alunos para a turma ${idTurma}`);
                
                // Garantir que só mostra alunos da turma especificada
                const alunosFiltrados = alunos.filter(aluno => {
                    const turmaDoAluno = aluno.id_turma || aluno.turma_id || '';
                    return turmaDoAluno === idTurma || turmaDoAluno === parseInt(idTurma) || !turmaDoAluno;
                });
                
                if (alunosFiltrados.length < alunos.length) {
                    console.log(`Filtrados ${alunosFiltrados.length} alunos de ${alunos.length} para a turma ${idTurma}`);
                }
                
                // Ordenar alunos por nome
                alunosFiltrados.sort((a, b) => {
                    const nomeA = a.nome_aluno || a.nome || '';
                    const nomeB = b.nome_aluno || b.nome || '';
                    return nomeA.localeCompare(nomeB);
                });
                
                alunosFiltrados.forEach(aluno => {
                    const id = aluno.id_aluno || aluno.id;
                    const nome = aluno.nome_aluno || aluno.nome || `Aluno ID: ${id}`;
                    
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = nome;
                    selectElement.appendChild(option);
                });
                
                // Preencher com o valor do filtro global, se existir
                if (filtroAluno && filtroAluno.value) {
                    selectElement.value = filtroAluno.value;
                }
            } else {
                console.warn(`Nenhum aluno encontrado para a turma ${idTurma}`);
                selectElement.innerHTML = '<option value="">Nenhum aluno encontrado para esta turma</option>';
            }
            
            selectElement.disabled = false;
        })
        .catch(error => {
            console.error('Erro ao carregar alunos para o formulário:', error);
            selectElement.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            selectElement.disabled = false;
        });
}

// Adicionar estas funções à lista de funções globais
window.carregarDisciplinasParaFiltro = carregarDisciplinasParaFiltro;
window.carregarAlunosParaFiltro = carregarAlunosParaFiltro;
window.initNotas = initNotas;
window.inicializarTabelaNotas = inicializarTabelaNotas;
window.carregarNotas = carregarNotas;
window.handleFormSubmit = handleFormSubmit;
window.abrirModoLancamentoEmMassa = abrirModoLancamentoEmMassa;
window.editarNota = editarNota;
window.novaNota = novaNota;

// Inicialização quando o DOM estiver pronto