// Variáveis globais
const links = {};
const conteudos = {};
let professorId = null;
let professorNome = null;
let professorDisciplinas = [];

// Variáveis para o módulo de notas
let turmasFiltro, disciplinasFiltro, alunosFiltro;
let notasTabela, filtroAno, filtroBimestre, filtroTurma, filtroDisciplina, filtroAluno, btnFiltrar;

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
            
            // Resetar o formulário
            const form = document.getElementById('form-nota');
            if (form) {
                form.reset();
                form.removeAttribute('data-mode');
                form.removeAttribute('data-nota-id');
            }
            
            // Atualizar o título do formulário
            const formTitulo = document.getElementById('form-nota-titulo');
            if (formTitulo) {
                formTitulo.textContent = 'Lançamento de Notas';
            }
            
            // Ocultar o botão de cancelar
            this.style.display = 'none';
        });
    }
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
    console.log("Inicializando módulo de notas");
    
    // Obter elementos com os IDs corretos
    notasTabela = document.getElementById('notas-lista');
    filtroTurma = document.getElementById('filtro--turma-notas');
    filtroDisciplina = document.getElementById('filtro--disciplina-notas');
    filtroAluno = document.getElementById('filtro--aluno-notas');
    filtroAno = document.getElementById('filtro--ano-notas');
    filtroBimestre = document.getElementById('filtro--bimestre-notas');
    
    // Log para debug - verificar se encontrou os elementos
    console.log('Elementos de filtro encontrados:', {
        notasTabela,
        filtroTurma,
        filtroDisciplina,
        filtroAluno,
        filtroAno,
        filtroBimestre
    });
    
    // Verificar se os elementos essenciais existem
    if (!notasTabela) {
        console.error('Elemento tabela de notas não encontrado!');
        return;
    }
    
    if (!filtroTurma) {
        console.error('Elemento filtro de turma não encontrado! ID esperado: filtro--turma-notas');
    }
    
    // Exibir mensagem inicial informativa
    notasTabela.innerHTML = `
        <tr class="text-center">
            <td colspan="9">
                <div class="alert alert-info" role="alert">
                    <h4 class="alert-heading">Bem-vindo ao Módulo de Notas</h4>
                    <p>Selecione os filtros acima e clique em "Filtrar" para visualizar as notas.</p>
                    <hr>
                    <p class="mb-0">
                        <i class="fas fa-info-circle me-1"></i> Você também pode usar o botão "Lançamento em Massa" para registrar notas de vários alunos simultaneamente.
                    </p>
                </div>
            </td>
        </tr>
    `;
    
    // Adicionar botão de lançamento em massa
    const cardHeader = document.querySelector('.card:has(#tabela-notas) .card-header');
    if (cardHeader) {
        const btnNovaNota = cardHeader.querySelector('button');
        if (btnNovaNota) {
            const btnLancamentoMassa = document.createElement('button');
            btnLancamentoMassa.className = 'btn btn-primary ms-2';
            btnLancamentoMassa.innerHTML = '<i class="fas fa-table-list me-1"></i> Lançamento em Massa';
            btnLancamentoMassa.addEventListener('click', function() {
                abrirModoLancamentoEmMassa();
            });
            
            btnNovaNota.parentNode.insertBefore(btnLancamentoMassa, btnNovaNota.nextSibling);
        }
    }
    
    // Inicializar preencher anos
    if (filtroAno) {
        filtroAno.innerHTML = '<option value="">Todos</option>';
        
        // Adicionar anos de 2025 a 2030
        for (let ano = 2025; ano <= 2030; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filtroAno.appendChild(option);
        }
        
        // Selecionar 2025 por padrão
        filtroAno.value = "2025";
    }
    
    // Inicializar filtros de dados
    carregarTurmasParaFiltro();
    
    // Adicionar event listeners para os filtros
    if (filtroTurma) {
        filtroTurma.addEventListener('change', function() {
            const idTurma = this.value;
            console.log("Turma selecionada:", idTurma);
            
            // Resetar e carregar disciplinas quando a turma mudar
            if (filtroDisciplina) {
                filtroDisciplina.innerHTML = '<option value="">Todas</option>';
                filtroDisciplina.disabled = true;
            }
            
            if (filtroAluno) {
                filtroAluno.innerHTML = '<option value="">Todos</option>';
                filtroAluno.disabled = true;
            }
            
            if (idTurma) {
                carregarDisciplinasParaFiltro(idTurma);
                carregarAlunosParaFiltro(idTurma);
            }
        });
    }
    
    // Event listener para o botão de filtro
    const btnFiltrar = document.getElementById('btn-filtrar-notas');
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function() {
            carregarNotas();
        });
    }
    
    // Event listener para a nova nota
    const btnNovaNota = document.getElementById('btn-nova-nota');
    if (btnNovaNota) {
        btnNovaNota.addEventListener('click', novaNota);
    }
    
    // Event listener para cancelar edição de nota
    const btnCancelarNota = document.getElementById('btn-cancelar-nota');
    if (btnCancelarNota) {
        btnCancelarNota.addEventListener('click', cancelarEdicao);
    }
    
    // Event listener para salvar nota
    const formNota = document.getElementById('form-nota');
    if (formNota) {
        formNota.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarNota();
        });
    }
    
    // Event listeners para calcular média automaticamente
    const notaMensal = document.getElementById('nota-mensal');
    const notaBimestral = document.getElementById('nota-bimestral');
    const notaRecuperacao = document.getElementById('nota-recuperacao');
    
    [notaMensal, notaBimestral, notaRecuperacao].forEach(input => {
        if (input) {
            input.addEventListener('input', calcularMedia);
        }
    });
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
        console.error('Elemento de filtro de disciplina não encontrado!');
        return;
    }
    
    // Desabilitar o select enquanto carrega
    filtroDisciplina.disabled = true;
    filtroDisciplina.innerHTML = '<option value="">Carregando disciplinas...</option>';
    
    let url;
    if (!idTurma) {
        url = CONFIG.getApiUrl(`/professores/${professorId}/disciplinas`);
    } else {
        url = CONFIG.getApiUrl(`/professores/${professorId}/turmas/${idTurma}/disciplinas`);
    }
    
    // Buscar disciplinas
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            console.log('Disciplinas para filtro:', disciplinas);
            
            filtroDisciplina.innerHTML = '<option value="">Todas as disciplinas</option>';
            
            if (disciplinas.length > 0) {
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina;
                    option.textContent = disciplina.nome_disciplina;
                    filtroDisciplina.appendChild(option);
                });
            }
            
            // Reativar o select
            filtroDisciplina.disabled = false;
        })
        .catch(error => {
            console.error('Erro ao carregar disciplinas para filtro:', error);
            filtroDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            filtroDisciplina.disabled = false;
        });
}

// Função para carregar alunos para o filtro
function carregarAlunosParaFiltro(idTurma = null, idDisciplina = null) {
    console.log('Carregando alunos para filtro. Turma:', idTurma, 'Disciplina:', idDisciplina);
    
    // Verificar se o elemento existe
    if (!filtroAluno) {
        console.error('Elemento de filtro de aluno não encontrado!');
        return;
    }
    
    // Desabilitar o select enquanto carrega
    filtroAluno.disabled = true;
    filtroAluno.innerHTML = '<option value="">Carregando alunos...</option>';
    
    let url;
    if (!idTurma) {
        url = CONFIG.getApiUrl(`/professores/${professorId}/alunos`);
    } else {
        url = CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`);
    }
    
    // Buscar alunos
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(alunos => {
            console.log('Alunos para filtro:', alunos);
            
            filtroAluno.innerHTML = '<option value="">Todos os alunos</option>';
            
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
                    filtroAluno.appendChild(option);
                });
            }
            
            // Reativar o select
            filtroAluno.disabled = false;
        })
        .catch(error => {
            console.error('Erro ao carregar alunos para filtro:', error);
            filtroAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            filtroAluno.disabled = false;
        });
}

// Função para carregar notas com base nos filtros selecionados
function carregarNotas() {
    console.log("Carregando notas com filtros");
    
    // Obter valores dos filtros
    const idTurma = document.getElementById('filtro--turma-notas')?.value;
    const idDisciplina = document.getElementById('filtro--disciplina-notas')?.value;
    const idAluno = document.getElementById('filtro--aluno-notas')?.value;
    const ano = document.getElementById('filtro--ano-notas')?.value;
    const bimestre = document.getElementById('filtro--bimestre-notas')?.value;
    
    console.log('Filtros aplicados:', {
        turma: idTurma,
        disciplina: idDisciplina,
        aluno: idAluno,
        ano: ano,
        bimestre: bimestre
    });
    
    // Verificar se o elemento da tabela existe
    const notasTabela = document.getElementById('notas-lista');
    if (!notasTabela) {
        console.error('Elemento da tabela de notas não encontrado!');
        return;
    }
    
    // Mostrar indicador de carregamento
    notasTabela.innerHTML = `
        <tr class="text-center">
            <td colspan="9">
                <div class="d-flex justify-content-center align-items-center" style="height: 100px;">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando notas...</span>
                    </div>
                    <span class="ms-2">Carregando notas...</span>
                </div>
            </td>
        </tr>
    `;
    
    // Construir URL com parâmetros de consulta
    const params = new URLSearchParams();
    if (idTurma) params.append('turma_id', idTurma);
    if (idDisciplina) params.append('disciplina_id', idDisciplina);
    if (idAluno) params.append('aluno_id', idAluno);
    if (ano) params.append('ano', ano);
    if (bimestre) params.append('bimestre', bimestre);
    
    // Adicionar parâmetro do professor
    params.append('professor_id', professorId);
    
    const url = CONFIG.getApiUrl(`/notas?${params.toString()}`);
    console.log('URL de consulta:', url);
    
    // Buscar notas
    fetch(url)
        .then(response => {
            if (!response.ok) {
                // Se o endpoint específico retornar erro, tentar endpoint genérico
                if (response.status === 404) {
                    console.log('Endpoint específico não encontrado, tentando endpoint genérico...');
                    return fetch(CONFIG.getApiUrl(`/notas`))
                        .then(genericResponse => {
                            if (!genericResponse.ok) {
                                throw new Error(`Erro na requisição: ${genericResponse.status}`);
                            }
                            return genericResponse.json();
                        })
                        .then(todasNotas => {
                            // Filtrar notas manualmente
                            return filtrarNotasManualmente(todasNotas, {
                                professorId,
                                idTurma,
                                idDisciplina,
                                idAluno,
                                ano,
                                bimestre
                            });
                        });
                }
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(notas => {
            console.log('Notas carregadas:', notas);
            
            if (!notas || notas.length === 0) {
                notasTabela.innerHTML = `
                    <tr class="text-center">
                        <td colspan="9">
                            <div class="alert alert-warning" role="alert">
                                <h4 class="alert-heading">Nenhuma nota encontrada</h4>
                                <p>Não foram encontradas notas com os filtros selecionados.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Ordenar notas por nome do aluno e bimestre
            notas.sort((a, b) => {
                // Primeiro por nome do aluno
                const nomeA = a.nome_aluno || '';
                const nomeB = b.nome_aluno || '';
                const compareNome = nomeA.localeCompare(nomeB);
                
                // Se nomes iguais, ordenar por bimestre
                if (compareNome === 0) {
                    return (a.bimestre || 0) - (b.bimestre || 0);
                }
                
                return compareNome;
            });
            
            // Gerar HTML para a tabela
            let html = '';
            
            notas.forEach(nota => {
                // Calcular média corretamente
                let media = nota.media;
                if (media === null || media === undefined) {
                    if (nota.nota_mensal !== null && nota.nota_bimestral !== null) {
                        // Média simples: (mensal + bimestral) / 2
                        media = (nota.nota_mensal + nota.nota_bimestral) / 2;
                        
                        // Se há recuperação, ajustar a média
                        if (nota.recuperacao !== null) {
                            media = (media + nota.recuperacao) / 2;
                        }
                    } else if (nota.nota_mensal !== null) {
                        media = nota.nota_mensal;
                    } else if (nota.nota_bimestral !== null) {
                        media = nota.nota_bimestral;
                    }
                }
                
                // Arredondar para uma casa decimal
                media = media !== null ? Math.ceil(media * 10) / 10 : null;
                
                // Determinar status com base na média
                let statusClass = '';
                let statusText = '';
                
                if (media !== null) {
                    if (media >= 7) {
                        statusClass = 'bg-success-subtle text-success';
                        statusText = 'Aprovado';
                    } else if (media >= 5) {
                        statusClass = 'bg-warning-subtle text-warning';
                        statusText = 'Recuperação';
                    } else {
                        statusClass = 'bg-danger-subtle text-danger';
                        statusText = 'Reprovado';
                    }
                } else {
                    statusClass = 'bg-light text-muted';
                    statusText = 'Não avaliado';
                }
                
                html += `
                    <tr>
                        <td>${nota.nome_aluno || 'N/A'}</td>
                        <td>${nota.nome_disciplina || 'N/A'}</td>
                        <td>${nota.id_turma || 'N/A'}</td>
                        <td>${nota.bimestre || 'N/A'}</td>
                        <td>${nota.nota_mensal !== null ? nota.nota_mensal.toFixed(1) : '-'}</td>
                        <td>${nota.nota_bimestral !== null ? nota.nota_bimestral.toFixed(1) : '-'}</td>
                        <td>${nota.recuperacao !== null ? nota.recuperacao.toFixed(1) : '-'}</td>
                        <td>${media !== null ? media.toFixed(1) : '-'}</td>
                        <td class="${statusClass} text-center">${statusText}</td>
                        <td>
                            <button type="button" class="btn btn-sm btn-primary" onclick="editarNota(${nota.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            notasTabela.innerHTML = html;
        })
        .catch(error => {
            console.error('Erro ao carregar notas:', error);
            
            notasTabela.innerHTML = `
                <tr class="text-center">
                    <td colspan="9">
                        <div class="alert alert-danger" role="alert">
                            <h4 class="alert-heading">Erro ao carregar notas</h4>
                            <p>${error.message}</p>
                        </div>
                    </td>
                </tr>
            `;
        });
}

// Função auxiliar para filtrar notas manualmente no cliente
function filtrarNotasManualmente(todasNotas, filtros) {
    console.log("Filtrando notas manualmente com filtros:", filtros);
    
    if (!Array.isArray(todasNotas)) {
        console.error("Dados inválidos para filtro manual:", todasNotas);
        return [];
    }
    
    // Extrair filtros
    const { professorId, idTurma, idDisciplina, bimestre, ano } = filtros;
    
    // Filtrar notas com base nos filtros fornecidos
    return todasNotas.filter(nota => {
        // Filtrar por professor
        if (professorId && nota.id_professor && nota.id_professor.toString() !== professorId.toString()) {
            return false;
        }
        
        // Filtrar por turma
        if (idTurma && nota.id_turma && nota.id_turma.toString() !== idTurma.toString()) {
            return false;
        }
        
        // Filtrar por disciplina
        if (idDisciplina && nota.id_disciplina && nota.id_disciplina.toString() !== idDisciplina.toString()) {
            return false;
        }
        
        // Filtrar por bimestre
        if (bimestre && nota.bimestre && nota.bimestre.toString() !== bimestre.toString()) {
            return false;
        }
        
        // Filtrar por ano
        if (ano && nota.ano && nota.ano.toString() !== ano.toString()) {
            return false;
        }
        
        // A nota passou por todos os filtros
        return true;
    });
}

// Função para recalcular a média das notas
function recalcularMedia() {
    console.log('Recalculando média...');
    
    const notaMensal = document.getElementById('nota_mensal');
    const notaBimestral = document.getElementById('nota_bimestral');
    const recuperacao = document.getElementById('recuperacao');
    const mediaInput = document.getElementById('media');
    
    if (!notaMensal || !notaBimestral || !recuperacao || !mediaInput) {
        console.error('Elementos de nota não encontrados');
        return;
    }
    
    // Obter valores das notas
    const mensal = notaMensal.value ? parseFloat(notaMensal.value) : null;
    const bimestral = notaBimestral.value ? parseFloat(notaBimestral.value) : null;
    const rec = recuperacao.value ? parseFloat(recuperacao.value) : null;
    
    // Calcular média
    let media = 0;
    
    if (mensal !== null && bimestral !== null) {
        // Média normal
        media = (mensal + bimestral) / 2;
        
        // Se há recuperação, calcular média final
        if (rec !== null) {
            media = (media + rec) / 2;
        }
        
        // Arredondar para cima com uma casa decimal
        media = Math.ceil(media * 10) / 10;
    } else if (mensal !== null) {
        media = mensal;
    } else if (bimestral !== null) {
        media = bimestral;
    }
    
    // Atualizar campo de média
    mediaInput.value = media > 0 ? media.toFixed(1) : '';
    
    console.log('Média calculada:', media);
}

// Função para editar uma nota existente
function editarNota(notaId) {
    console.log('Iniciando edição da nota ID:', notaId);
    
    // Verificar se o formulário existe
    const form = document.getElementById('form-nota');
    if (!form) {
        console.error('Formulário de notas não encontrado!');
        return;
    }
    
    // Atualizar o título do formulário
    document.getElementById('form-nota-titulo').textContent = 'Editar Nota';
    
    // Mostrar o botão de cancelar, se existir
    const btnCancelar = document.getElementById('btn-cancelar-nota');
    if (btnCancelar) {
        btnCancelar.style.display = 'inline-block';
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
    const saveButton = document.querySelector('#form-nota button[type="submit"]');
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
                    
                    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas/${nota.id_turma}/alunos`))
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
    
    // Calcular média final
    let mediaFinal = 0;
    if (notaMensalNum !== null && notaBimestralNum !== null) {
        mediaFinal = (notaMensalNum + notaBimestralNum) / 2;
        if (recuperacaoNum !== null) {
            mediaFinal = (mediaFinal + recuperacaoNum) / 2;
        }
        // Arredondar para cima com uma casa decimal
        mediaFinal = Math.ceil(mediaFinal * 10) / 10;
    } else if (notaMensalNum !== null) {
        mediaFinal = notaMensalNum;
    } else if (notaBimestralNum !== null) {
        mediaFinal = notaBimestralNum;
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
        if (result.media !== undefined && Math.abs(mediaFinal - result.media) > 0.05) {
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
            
            // Limpar o formulário após 2 segundos
            setTimeout(() => {
                form.reset();
                form.removeAttribute('data-mode');
                form.removeAttribute('data-nota-id');
                document.getElementById('form-nota-titulo').textContent = 'Lançamento de Notas';
                
                // Esconder o botão de cancelar
                const btnCancelar = document.getElementById('btn-cancelar-nota');
                if (btnCancelar) {
                    btnCancelar.style.display = 'none';
                }
                
                statusMsg.remove();
                
                // Recarregar a lista de notas
                carregarNotas();
            }, 2000);
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
    
    // Como o endpoint /alunos/{id}/notas não está funcionando (erro 404),
    // vamos buscar todas as notas do professor e filtrar pelo ID do aluno
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/notas`))
        .then(response => {
            if (!response.ok) {
                // Se receber um 404 aqui também, vamos tentar outra abordagem
                if (response.status === 404) {
                    // Tenta buscar todas as notas e filtrar no cliente
                    return fetch(CONFIG.getApiUrl(`/notas`))
                        .then(innerResponse => {
                            if (!innerResponse.ok) {
                                throw new Error(`Erro na requisição: ${innerResponse.status}`);
                            }
                            return innerResponse.json();
                        });
                }
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(todasNotas => {
            console.log("Todas as notas carregadas, filtrando para o aluno:", idAluno);
            
            // Filtrar apenas as notas do aluno específico
            const notasDoAluno = Array.isArray(todasNotas) 
                ? todasNotas.filter(nota => nota.id_aluno === idAluno)
                : [];
            
            console.log("Notas filtradas do aluno:", notasDoAluno);
            
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

// Função para abrir o modo de lançamento em massa de notas
function abrirModoLancamentoEmMassa() {
    console.log("Iniciando modo de lançamento em massa de notas");
    
    // Obter o container para a tabela de notas
    const cardBody = document.querySelector('.card:has(#tabela-notas) .card-body');
    if (!cardBody) {
        console.error("Não foi possível encontrar o container da tabela de notas");
        alert("Erro ao iniciar modo de edição em massa. Tente novamente.");
        return;
    }
    
    // Esconder o formulário individual de notas se estiver visível
    const formCard = document.querySelector('.card:has(#form-nota)');
    if (formCard && !formCard.classList.contains('d-none')) {
        formCard.classList.add('d-none');
    }
    
    // Criar e exibir o form de configuração para edição em massa
    const formHTML = `
        <div id="configuracao-massa" class="mb-4 animate__animated animate__fadeIn">
            <div class="card">
                <div class="card-header py-3 d-flex justify-content-between align-items-center bg-light">
                    <h6 class="m-0 font-weight-bold text-primary">
                        <i class="fas fa-table me-2"></i> Lançamento em Massa
                    </h6>
                    <button type="button" class="btn-close" id="fechar-modo-massa" aria-label="Fechar"></button>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-3">
                        Selecione a turma, disciplina e bimestre para editar as notas de todos os alunos de uma vez.
                    </p>
                    <form id="form-configuracao-massa" class="row g-3">
                        <div class="col-md-4">
                            <label for="turma-massa" class="form-label">Turma</label>
                            <select class="form-select" id="turma-massa" required>
                                <option value="">Selecione a Turma</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="disciplina-massa" class="form-label">Disciplina</label>
                            <select class="form-select" id="disciplina-massa" required disabled>
                                <option value="">Selecione a Disciplina</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="bimestre-massa" class="form-label">Bimestre</label>
                            <select class="form-select" id="bimestre-massa" required>
                                <option value="">Selecione o Bimestre</option>
                                <option value="1">1º Bimestre</option>
                                <option value="2">2º Bimestre</option>
                                <option value="3">3º Bimestre</option>
                                <option value="4">4º Bimestre</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="ano-massa" class="form-label">Ano</label>
                            <select class="form-select" id="ano-massa" required>
                                <option value="">Selecione o Ano</option>
                            </select>
                        </div>
                        <div class="col-12 d-grid gap-2 d-md-flex justify-content-md-end">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-table-list me-1"></i> Carregar Alunos
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Inserir o formulário no início da área de conteúdo
    cardBody.insertAdjacentHTML('beforebegin', formHTML);
    
    // Obter referências para os elementos do formulário
    const formConfiguracaoMassa = document.getElementById('form-configuracao-massa');
    const selectTurma = document.getElementById('turma-massa');
    const selectDisciplina = document.getElementById('disciplina-massa');
    const selectBimestre = document.getElementById('bimestre-massa');
    const selectAno = document.getElementById('ano-massa');
    const btnFechar = document.getElementById('fechar-modo-massa');
    
    // Preencher o dropdown de anos
    if (selectAno) {
        const anoAtual = new Date().getFullYear();
        for (let i = 0; i < 3; i++) {
            const ano = anoAtual - i;
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            if (i === 0) option.selected = true;
            selectAno.appendChild(option);
        }
    }
    
    // Carregar turmas do professor
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(turmas => {
            console.log("Turmas do professor carregadas para lançamento em massa:", turmas);
            
            if (turmas.length === 0) {
                selectTurma.innerHTML = '<option value="">Nenhuma turma encontrada</option>';
                return;
            }
            
            // Preencher o dropdown de turmas
            selectTurma.innerHTML = '<option value="">Selecione a Turma</option>';
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id_turma;
                option.textContent = `${turma.id_turma} - ${turma.serie || ''}`;
                selectTurma.appendChild(option);
            });
            
            // Adicionar evento de mudança para o dropdown de turmas
            selectTurma.addEventListener('change', function() {
                const idTurma = this.value;
                console.log("Turma selecionada para lançamento em massa:", idTurma);
                
                if (idTurma) {
                    // Carregar disciplinas para esta turma
                    carregarDisciplinasParaMassa(idTurma);
                } else {
                    // Resetar disciplinas se nenhuma turma for selecionada
                    selectDisciplina.innerHTML = '<option value="">Selecione a Disciplina</option>';
                    selectDisciplina.disabled = true;
                }
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas:", error);
            selectTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        });
    
    // Adicionar evento para o botão de fechar
    if (btnFechar) {
        btnFechar.addEventListener('click', function() {
            fecharModoLancamentoEmMassa();
        });
    }
    
    // Adicionar evento para o formulário de configuração
    if (formConfiguracaoMassa) {
        formConfiguracaoMassa.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const idTurma = selectTurma.value;
            const idDisciplina = selectDisciplina.value;
            const bimestre = selectBimestre.value;
            const ano = selectAno.value;
            
            if (!idTurma || !idDisciplina || !bimestre || !ano) {
                alert("Por favor, preencha todos os campos.");
                return;
            }
            
            carregarAlunosParaEdicaoEmMassa(idTurma, idDisciplina, bimestre, ano);
        });
    }
}

// Função para fechar o modo de lançamento em massa
function fecharModoLancamentoEmMassa() {
    console.log("Fechando modo de lançamento em massa");
    
    // Remover o formulário de configuração
    const configuracaoMassa = document.getElementById('configuracao-massa');
    if (configuracaoMassa) {
        configuracaoMassa.remove();
    }
    
    // Remover a tabela de edição em massa se existir
    const tabelaMassa = document.getElementById('tabela-massa-container');
    if (tabelaMassa) {
        tabelaMassa.remove();
    }
    
    // Mostrar novamente a tabela de notas regular
    mostrarTabelaNotasRegular();
    
    // Restaurar mensagem inicial se nenhuma nota foi carregada anteriormente
    if (notasTabela && notasTabela.children.length === 0) {
        notasTabela.innerHTML = `
            <tr class="text-center">
                <td colspan="9">
                    <div class="alert alert-info" role="alert">
                        <h4 class="alert-heading">Bem-vindo ao Módulo de Notas</h4>
                        <p>Selecione os filtros acima e clique em "Filtrar" para visualizar as notas.</p>
                        <hr>
                        <p class="mb-0">
                            <i class="fas fa-info-circle me-1"></i> Você também pode usar o botão "Lançamento em Massa" para registrar notas de vários alunos simultaneamente.
                        </p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Função para carregar disciplinas para o formulário de edição em massa
function carregarDisciplinasParaMassa(idTurma) {
    const selectDisciplina = document.getElementById('disciplina-massa');
    if (!selectDisciplina) return;
    
    // Mostrar indicador de carregamento
    selectDisciplina.innerHTML = '<option value="">Carregando disciplinas...</option>';
    selectDisciplina.disabled = true;
    
    // Carregar disciplinas do professor para esta turma
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas/${idTurma}/disciplinas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            console.log("Disciplinas carregadas para lançamento em massa:", disciplinas);
            
            selectDisciplina.innerHTML = '<option value="">Selecione a Disciplina</option>';
            
            if (disciplinas.length === 0) {
                selectDisciplina.innerHTML = '<option value="">Nenhuma disciplina encontrada</option>';
                selectDisciplina.disabled = true;
                return;
            }
            
            // Preencher o dropdown de disciplinas
            disciplinas.forEach(disciplina => {
                const option = document.createElement('option');
                option.value = disciplina.id_disciplina;
                option.textContent = disciplina.nome_disciplina;
                selectDisciplina.appendChild(option);
            });
            
            // Habilitar o dropdown
            selectDisciplina.disabled = false;
        })
        .catch(error => {
            console.error("Erro ao carregar disciplinas:", error);
            selectDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            selectDisciplina.disabled = true;
        });
}

// Função para carregar alunos para edição em massa
function carregarAlunosParaEdicaoEmMassa(idTurma, idDisciplina, bimestre, ano) {
    console.log("Carregando alunos para edição em massa:", {
        turma: idTurma,
        disciplina: idDisciplina,
        bimestre: bimestre,
        ano: ano
    });
    
    // Esconder a tabela regular de notas
    const tabelaRegular = document.querySelector('.table-responsive');
    if (tabelaRegular) {
        tabelaRegular.style.display = 'none';
    }
    
    // Criar container para a tabela de edição em massa
    const cardBody = document.querySelector('.card:has(#tabela-notas) .card-body');
    if (!cardBody) return;
    
    // Remover tabela anterior se existir
    const tabelaMassaExistente = document.getElementById('tabela-massa-container');
    if (tabelaMassaExistente) {
        tabelaMassaExistente.remove();
    }
    
    // Criar e inserir container para a tabela de edição em massa
    const tabelaMassaHTML = `
        <div id="tabela-massa-container" class="animate__animated animate__fadeIn">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0">
                    <i class="fas fa-edit me-2"></i> Edição em Massa - ${idTurma} (${bimestre}º Bimestre)
                </h5>
                <div>
                    <button type="button" class="btn btn-success btn-sm" id="btn-salvar-massa">
                        <i class="fas fa-save me-1"></i> Salvar Todas as Notas
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm ms-2" id="btn-cancelar-massa">
                        <i class="fas fa-times me-1"></i> Cancelar
                    </button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-bordered table-hover" id="tabela-notas-massa">
                    <thead class="table-light">
                        <tr>
                            <th>Aluno</th>
                            <th>Nota Mensal</th>
                            <th>Nota Bimestral</th>
                            <th>Recuperação</th>
                            <th>Média</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="notas-massa-lista">
                        <tr class="text-center">
                            <td colspan="6">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Carregando alunos...</span>
                                </div>
                                <span class="ms-2">Carregando alunos...</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    cardBody.insertAdjacentHTML('beforeend', tabelaMassaHTML);
    
    // Referências aos elementos da tabela
    const tabelaNotas = document.getElementById('notas-massa-lista');
    const btnSalvar = document.getElementById('btn-salvar-massa');
    const btnCancelar = document.getElementById('btn-cancelar-massa');
    
    // Evento para o botão cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            fecharModoLancamentoEmMassa();
        });
    }
    
    // Carregar alunos da turma
    fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(alunos => {
            console.log("Alunos carregados para edição em massa:", alunos);
            
            if (alunos.length === 0) {
                tabelaNotas.innerHTML = `
                    <tr class="text-center">
                        <td colspan="6">
                            <div class="alert alert-warning" role="alert">
                                <h4 class="alert-heading">Nenhum aluno encontrado!</h4>
                                <p>Não foram encontrados alunos na turma selecionada.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Ordenar alunos por nome
            alunos.sort((a, b) => {
                const nomeA = a.nome_aluno || '';
                const nomeB = b.nome_aluno || '';
                return nomeA.localeCompare(nomeB);
            });
            
            // Buscar notas existentes para esses alunos
            buscarNotasExistentes(idTurma, idDisciplina, bimestre, ano)
                .then(notasExistentes => {
                    // Criar mapa de notas por ID do aluno para acesso rápido
                    const notasPorAluno = {};
                    notasExistentes.forEach(nota => {
                        notasPorAluno[nota.id_aluno] = nota;
                    });
                    
                    // Gerar linhas da tabela
                    let html = '';
                    
                    alunos.forEach((aluno, index) => {
                        const idAluno = aluno.id_aluno;
                        const notaExistente = notasPorAluno[idAluno] || {};
                        
                        const notaMensal = notaExistente.nota_mensal !== undefined ? notaExistente.nota_mensal : '';
                        const notaBimestral = notaExistente.nota_bimestral !== undefined ? notaExistente.nota_bimestral : '';
                        const recuperacao = notaExistente.recuperacao !== undefined ? notaExistente.recuperacao : '';
                        const media = notaExistente.media !== undefined ? notaExistente.media : '';
                        const idNota = notaExistente.id || '';
                        
                        let statusClass = '';
                        let statusText = '';
                        
                        if (media !== '') {
                            const mediaNum = parseFloat(media);
                            if (mediaNum >= 7) {
                                statusClass = 'bg-success-subtle text-success';
                                statusText = 'Aprovado';
                            } else if (mediaNum >= 5) {
                                statusClass = 'bg-warning-subtle text-warning';
                                statusText = 'Recuperação';
                            } else {
                                statusClass = 'bg-danger-subtle text-danger';
                                statusText = 'Reprovado';
                            }
                        } else {
                            statusText = 'Não lançado';
                        }
                        
                        html += `
                            <tr data-aluno-id="${idAluno}" data-nota-id="${idNota}">
                                <td>
                                    <strong>${aluno.nome_aluno || 'N/A'}</strong>
                                    <input type="hidden" name="aluno_id" value="${idAluno}">
                                </td>
                                <td>
                                    <input type="number" class="form-control form-control-sm nota-input" 
                                           name="nota_mensal" min="0" max="10" step="0.1" 
                                           value="${notaMensal}" data-original="${notaMensal}"
                                           placeholder="0.0 a 10.0">
                                </td>
                                <td>
                                    <input type="number" class="form-control form-control-sm nota-input" 
                                           name="nota_bimestral" min="0" max="10" step="0.1" 
                                           value="${notaBimestral}" data-original="${notaBimestral}"
                                           placeholder="0.0 a 10.0">
                                </td>
                                <td>
                                    <input type="number" class="form-control form-control-sm nota-input" 
                                           name="recuperacao" min="0" max="10" step="0.1" 
                                           value="${recuperacao}" data-original="${recuperacao}"
                                           placeholder="0.0 a 10.0">
                                </td>
                                <td>
                                    <input type="number" class="form-control form-control-sm" 
                                           name="media" readonly 
                                           value="${media}" data-original="${media}">
                                </td>
                                <td class="${statusClass}">
                                    <span class="status-text">${statusText}</span>
                                </td>
                            </tr>
                        `;
                    });
                    
                    tabelaNotas.innerHTML = html;
                    
                    // Adicionar eventos para cálculo automático de média
                    document.querySelectorAll('#notas-massa-lista tr').forEach(row => {
                        const inputs = row.querySelectorAll('input.nota-input');
                        const mediaInput = row.querySelector('input[name="media"]');
                        const statusText = row.querySelector('.status-text');
                        const statusCell = row.querySelector('td:last-child');
                        
                        inputs.forEach(input => {
                            input.addEventListener('input', function() {
                                // Extrair valores das notas
                                const notaMensal = parseFloat(row.querySelector('input[name="nota_mensal"]').value) || null;
                                const notaBimestral = parseFloat(row.querySelector('input[name="nota_bimestral"]').value) || null;
                                const recuperacao = parseFloat(row.querySelector('input[name="recuperacao"]').value) || null;
                                
                                // Calcular média
                                let media = 0;
                                
                                if (notaMensal !== null && notaBimestral !== null) {
                                    // Média normal (mensal + bimestral) / 2
                                    media = (notaMensal + notaBimestral) / 2;
                                    
                                    // Se há recuperação, calcular média final
                                    if (recuperacao !== null) {
                                        media = (media + recuperacao) / 2;
                                    }
                                    
                                    // Arredondar para cima com uma casa decimal
                                    media = Math.ceil(media * 10) / 10;
                                } else if (notaMensal !== null) {
                                    media = notaMensal;
                                } else if (notaBimestral !== null) {
                                    media = notaBimestral;
                                }
                                
                                // Atualizar campo de média
                                mediaInput.value = media > 0 ? media.toFixed(1) : '';
                                
                                // Atualizar status
                                let statusClass = '';
                                let statusText = '';
                                
                                if (media > 0) {
                                    if (media >= 7) {
                                        statusClass = 'bg-success-subtle text-success';
                                        statusText = 'Aprovado';
                                    } else if (media >= 5) {
                                        statusClass = 'bg-warning-subtle text-warning';
                                        statusText = 'Recuperação';
                                    } else {
                                        statusClass = 'bg-danger-subtle text-danger';
                                        statusText = 'Reprovado';
                                    }
                                } else {
                                    statusClass = '';
                                    statusText = 'Não lançado';
                                }
                                
                                // Atualizar classe e texto do status
                                statusCell.className = statusClass;
                                statusText.textContent = statusText;
                                
                                // Destacar campos que foram modificados
                                this.classList.toggle('bg-light', this.value !== this.dataset.original);
                            });
                        });
                    });
                    
                    // Evento para o botão salvar
                    if (btnSalvar) {
                        btnSalvar.addEventListener('click', function() {
                            salvarNotasEmMassa(idTurma, idDisciplina, bimestre, ano);
                        });
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar notas existentes:", error);
                    
                    // Mostrar mensagem de erro
                    tabelaNotas.innerHTML = `
                        <tr class="text-center">
                            <td colspan="6">
                                <div class="alert alert-danger" role="alert">
                                    <h4 class="alert-heading">Erro ao carregar notas!</h4>
                                    <p>Não foi possível carregar as notas existentes.</p>
                                    <hr>
                                    <p class="mb-0">Detalhes: ${error.message}</p>
                                </div>
                            </td>
                        </tr>
                    `;
                });
        })
        .catch(error => {
            console.error("Erro ao carregar alunos:", error);
            
            if (tabelaNotas) {
                tabelaNotas.innerHTML = `
                    <tr class="text-center">
                        <td colspan="6">
                            <div class="alert alert-danger" role="alert">
                                <h4 class="alert-heading">Erro ao carregar alunos!</h4>
                                <p>Não foi possível carregar os alunos da turma.</p>
                                <hr>
                                <p class="mb-0">Detalhes: ${error.message}</p>
                            </div>
                        </td>
                    </tr>
                `;
            }
        });
}

// Função para buscar notas existentes
function buscarNotasExistentes(idTurma, idDisciplina, bimestre, ano) {
    // Construir URL com filtros
    const params = new URLSearchParams({
        turma_id: idTurma,
        disciplina_id: idDisciplina,
        bimestre: bimestre,
        ano: ano
    });
    
    const url = CONFIG.getApiUrl(`/notas/por_professor/${professorId}?${params.toString()}`);
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                // Se o endpoint específico retornar erro, tentar endpoint genérico
                if (response.status === 404) {
                    console.log('Endpoint específico não encontrado, tentando endpoint genérico...');
                    return fetch(CONFIG.getApiUrl(`/notas`))
                        .then(genericResponse => {
                            if (!genericResponse.ok) {
                                throw new Error(`Erro na requisição: ${genericResponse.status}`);
                            }
                            return genericResponse.json();
                        })
                        .then(todasNotas => {
                            // Filtrar notas manualmente
                            return filtrarNotasManualmente(todasNotas, {
                                professorId,
                                idTurma,
                                idDisciplina,
                                bimestre,
                                ano
                            });
                        });
                }
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        });
}

// Função para salvar todas as notas em massa
function salvarNotasEmMassa(idTurma, idDisciplina, bimestre, ano) {
    console.log("Salvando notas em massa");
    
    // Obter todas as linhas da tabela
    const rows = document.querySelectorAll('#notas-massa-lista tr');
    if (rows.length === 0) {
        alert("Nenhum aluno encontrado para salvar notas.");
        return;
    }
    
    // Array para armazenar todas as promessas de salvamento
    const savePromises = [];
    
    // Criar um indicador de progresso
    const progressHTML = `
        <div id="progress-container" class="position-fixed top-0 start-0 end-0 p-3 bg-light border-bottom" style="z-index: 1050;">
            <div class="container">
                <div class="progress" style="height: 20px;">
                    <div id="progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" style="width: 0%;" 
                         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                </div>
                <p id="progress-text" class="text-center mt-2 mb-0">Salvando notas...</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', progressHTML);
    
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Iterar sobre cada linha da tabela
    rows.forEach((row, index) => {
        const idAluno = row.dataset.alunoId;
        const idNota = row.dataset.notaId;
        
        // Obter valores dos campos de notas
        const notaMensal = row.querySelector('input[name="nota_mensal"]').value;
        const notaBimestral = row.querySelector('input[name="nota_bimestral"]').value;
        const recuperacao = row.querySelector('input[name="recuperacao"]').value;
        const media = row.querySelector('input[name="media"]').value;
        
        // Verificar se pelo menos um campo foi preenchido
        if (!notaMensal && !notaBimestral && !recuperacao) {
            // Se não há notas e não existe ID de nota (nota nova), pular
            if (!idNota) {
                return;
            }
        }
        
        // Preparar dados da nota
        const notaData = {
            id_professor: professorId,
            id_turma: idTurma,
            id_disciplina: idDisciplina,
            id_aluno: idAluno,
            bimestre: parseInt(bimestre),
            ano: parseInt(ano),
            nota_mensal: notaMensal ? parseFloat(notaMensal) : null,
            nota_bimestral: notaBimestral ? parseFloat(notaBimestral) : null,
            recuperacao: recuperacao ? parseFloat(recuperacao) : null,
            media: media ? parseFloat(media) : null
        };
        
        // Determinar se é uma atualização ou uma nova inserção
        let savePromise;
        if (idNota) {
            // Atualizar nota existente
            notaData.id = idNota;
            savePromise = fetch(CONFIG.getApiUrl(`/notas/${idNota}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notaData)
            });
        } else {
            // Criar nova nota
            savePromise = fetch(CONFIG.getApiUrl('/notas'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notaData)
            });
        }
        
        // Adicionar promessa ao array
        savePromises.push(savePromise);
    });
    
    // Executar todas as promessas e atualizar o progresso
    let completedSaves = 0;
    const totalSaves = savePromises.length;
    
    if (totalSaves === 0) {
        // Remover indicador de progresso
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) progressContainer.remove();
        
        alert("Nenhuma nota para salvar.");
        return;
    }
    
    // Função para atualizar o progresso
    const updateProgress = () => {
        completedSaves++;
        const percentage = Math.round((completedSaves / totalSaves) * 100);
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
            progressBar.textContent = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Salvando notas... ${completedSaves} de ${totalSaves}`;
        }
    };
    
    // Processar cada promessa sequencialmente para não sobrecarregar a API
    let sequence = Promise.resolve();
    savePromises.forEach(promise => {
        sequence = sequence
            .then(() => promise)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao salvar nota: ${response.status}`);
                }
                updateProgress();
                return new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay entre requisições
            })
            .catch(error => {
                console.error("Erro ao salvar nota:", error);
                updateProgress();
            });
    });
    
    // Após todas as promessas serem concluídas
    sequence.then(() => {
        // Remover indicador de progresso
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            // Transformar em mensagem de sucesso
            progressText.textContent = 'Notas salvas com sucesso!';
            progressBar.classList.remove('progress-bar-animated');
            progressBar.classList.add('bg-success');
            
            // Remover após alguns segundos
            setTimeout(() => {
                progressContainer.remove();
            }, 3000);
        }
        
        // Registrar atividade
        registrarAtividade(
            'registro',
            'notas',
            `${totalSaves} registros em massa`,
            `Turma: ${idTurma}, Disciplina: ${idDisciplina}, Bimestre: ${bimestre}, Ano: ${ano}`,
            'concluído'
        );
        
        // Recarregar a visualização de notas para mostrar as alterações
        fecharModoLancamentoEmMassa();
        carregarNotas();
    });
}

// Função para mostrar novamente a tabela regular de notas
function mostrarTabelaNotasRegular() {
    const tabelaRegular = document.querySelector('.table-responsive');
    if (tabelaRegular) {
        tabelaRegular.style.display = '';
    }
}

// Função para calcular a média automaticamente no formulário
function calcularMedia() {
    console.log("Calculando média...");
    
    const notaMensal = parseFloat(document.getElementById('nota_mensal')?.value) || null;
    const notaBimestral = parseFloat(document.getElementById('nota_bimestral')?.value) || null;
    const notaRecuperacao = parseFloat(document.getElementById('recuperacao')?.value) || null;
    const mediaField = document.getElementById('media');
    
    if (!mediaField) {
        console.error('Campo de média não encontrado! ID esperado: media');
        return;
    }
    
    // Exibir valores para debug
    console.log('Valores para cálculo da média:', {
        notaMensal,
        notaBimestral,
        notaRecuperacao
    });
    
    let media = 0;
    
    if (notaMensal !== null && notaBimestral !== null) {
        // Média normal: (mensal + bimestral) / 2
        media = (notaMensal + notaBimestral) / 2;
        
        // Se houver recuperação, calcular a média final
        if (notaRecuperacao !== null) {
            media = (media + notaRecuperacao) / 2;
        }
        
        // Arredondar para uma casa decimal
        media = Math.ceil(media * 10) / 10;
    } else if (notaMensal !== null) {
        media = notaMensal;
    } else if (notaBimestral !== null) {
        media = notaBimestral;
    }
    
    // Preencher o campo de média
    mediaField.value = media > 0 ? media.toFixed(1) : '';
    
    // Atualizar o status visual
    atualizarStatusNota(media);
}

// Função para atualizar o status visual da nota
function atualizarStatusNota(media) {
    const statusContainer = document.getElementById('status-container');
    if (!statusContainer) {
        console.error('Container de status da nota não encontrado! ID esperado: status-container');
        return;
    }
    
    let statusHTML = '';
    let statusClass = '';
    
    if (media >= 7) {
        statusClass = 'bg-success-subtle text-success';
        statusHTML = '<i class="fas fa-check-circle me-1"></i> Aprovado';
    } else if (media >= 5) {
        statusClass = 'bg-warning-subtle text-warning';
        statusHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Recuperação';
    } else if (media > 0) {
        statusClass = 'bg-danger-subtle text-danger';
        statusHTML = '<i class="fas fa-times-circle me-1"></i> Reprovado';
    } else {
        statusClass = 'bg-light text-muted';
        statusHTML = '<i class="fas fa-question-circle me-1"></i> Não avaliado';
    }
    
    statusContainer.className = `p-2 rounded ${statusClass}`;
    statusContainer.innerHTML = statusHTML;
}

// Função para novo lançamento de nota
function novaNota() {
    console.log("Iniciando novo lançamento de nota");
    
    // Obter referências aos elementos do formulário
    const formCard = document.querySelector('.card:has(#form-nota)');
    const formTitulo = document.querySelector('#form-nota-titulo');
    const formNota = document.getElementById('form-nota');
    const idNotaInput = document.getElementById('id-nota');
    
    // Campos do formulário com IDs corretos
    const turmaNota = document.getElementById('turma_nota');
    const disciplinaNota = document.getElementById('disciplina_nota');
    const alunoNota = document.getElementById('aluno_nota');
    const bimestreNota = document.getElementById('bimestre');
    const anoNota = document.getElementById('ano_nota');
    
    // Log para debug - verificar se encontrou os elementos
    console.log('Elementos do formulário encontrados:', {
        formCard,
        formTitulo,
        formNota,
        idNotaInput,
        turmaNota,
        disciplinaNota,
        alunoNota,
        bimestreNota,
        anoNota
    });
    
    // Esconder o formulário de edição em massa se estiver visível
    const configuracaoMassa = document.getElementById('configuracao-massa');
    if (configuracaoMassa) {
        configuracaoMassa.remove();
    }
    
    const tabelaMassa = document.getElementById('tabela-massa-container');
    if (tabelaMassa) {
        tabelaMassa.remove();
    }
    
    // Mostrar a tabela regular
    mostrarTabelaNotasRegular();
    
    // Verificar se os elementos existem
    if (!formCard || !formNota) {
        console.error("Elementos essenciais do formulário não encontrados");
        return;
    }
    
    // Mostrar o formulário se estiver oculto
    if (formCard.classList.contains('d-none')) {
        formCard.classList.remove('d-none');
    }
    
    // Atualizar o título
    if (formTitulo) {
        formTitulo.textContent = 'Novo Lançamento de Nota';
    }
    
    // Resetar o formulário e campos
    formNota.reset();
    
    // Limpar o ID da nota
    if (idNotaInput) {
        idNotaInput.value = '';
    }
    
    // Inicializar anos (2025 a 2030)
    if (anoNota) {
        anoNota.innerHTML = '<option value="">Selecione o Ano</option>';
        for (let ano = 2025; ano <= 2030; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            anoNota.appendChild(option);
        }
    }
    
    // Inicializar bimestres
    if (bimestreNota) {
        bimestreNota.innerHTML = '<option value="">Selecione o Bimestre</option>';
        for (let i = 1; i <= 4; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}º Bimestre`;
            bimestreNota.appendChild(option);
        }
    }
    
    // Carregar turmas
    if (turmaNota) {
        turmaNota.innerHTML = '<option value="">Carregando turmas...</option>';
        turmaNota.disabled = true;
        
        fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro na requisição: ${response.status}`);
                }
                return response.json();
            })
            .then(turmas => {
                console.log('Turmas carregadas para o formulário:', turmas);
                turmaNota.innerHTML = '<option value="">Selecione a Turma</option>';
                
                if (turmas.length > 0) {
                    turmas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma.id_turma;
                        option.textContent = `${turma.serie || ''} ${turma.turno || ''} (${turma.id_turma})`;
                        turmaNota.appendChild(option);
                    });
                }
                
                turmaNota.disabled = false;
                
                // Adicionar evento para carregar disciplinas quando a turma for selecionada
                turmaNota.addEventListener('change', function() {
                    const idTurma = this.value;
                    
                    // Limpar e desabilitar os selects dependentes
                    if (disciplinaNota) {
                        disciplinaNota.innerHTML = '<option value="">Selecione a Disciplina</option>';
                        disciplinaNota.disabled = !idTurma;
                    }
                    
                    if (alunoNota) {
                        alunoNota.innerHTML = '<option value="">Selecione o Aluno</option>';
                        alunoNota.disabled = true;
                    }
                    
                    if (idTurma) {
                        // Carregar disciplinas para esta turma
                        carregarDisciplinasFormulario(idTurma);
                    }
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas:", error);
                turmaNota.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                turmaNota.disabled = false;
            });
    } else {
        console.error('Elemento de seleção de turma não encontrado! ID esperado: turma_nota');
    }
    
    // Atualizar o status para não avaliado
    atualizarStatusNota(0);
}

// Função para carregar disciplinas no formulário
function carregarDisciplinasFormulario(idTurma) {
    console.log('Carregando disciplinas para o formulário. Turma:', idTurma);
    
    const disciplinaNota = document.getElementById('disciplina_nota');
    if (!disciplinaNota) {
        console.error('Elemento de seleção de disciplina não encontrado! ID esperado: disciplina_nota');
        return;
    }
    
    disciplinaNota.innerHTML = '<option value="">Carregando disciplinas...</option>';
    disciplinaNota.disabled = true;
    
    fetch(CONFIG.getApiUrl(`/professores/${professorId}/turmas/${idTurma}/disciplinas`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            console.log('Disciplinas carregadas para o formulário:', disciplinas);
            
            disciplinaNota.innerHTML = '<option value="">Selecione a Disciplina</option>';
            
            if (disciplinas.length > 0) {
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina;
                    option.textContent = disciplina.nome_disciplina;
                    disciplinaNota.appendChild(option);
                });
            } else {
                disciplinaNota.innerHTML = '<option value="">Nenhuma disciplina encontrada</option>';
            }
            
            disciplinaNota.disabled = false;
            
            // Adicionar evento para carregar alunos quando a disciplina for selecionada
            disciplinaNota.addEventListener('change', function() {
                const idDisciplina = this.value;
                const idTurma = document.getElementById('turma_nota').value;
                
                if (idTurma && idDisciplina) {
                    carregarAlunosFormulario(idTurma);
                }
            });
        })
        .catch(error => {
            console.error("Erro ao carregar disciplinas:", error);
            disciplinaNota.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            disciplinaNota.disabled = false;
        });
}

// Função para carregar alunos no formulário
function carregarAlunosFormulario(idTurma) {
    console.log('Carregando alunos para o formulário. Turma:', idTurma);
    
    const alunoNota = document.getElementById('aluno_nota');
    if (!alunoNota) {
        console.error('Elemento de seleção de aluno não encontrado! ID esperado: aluno_nota');
        return;
    }
    
    alunoNota.innerHTML = '<option value="">Carregando alunos...</option>';
    alunoNota.disabled = true;
    
    fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(alunos => {
            console.log('Alunos carregados para o formulário:', alunos);
            
            alunoNota.innerHTML = '<option value="">Selecione o Aluno</option>';
            
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
                    alunoNota.appendChild(option);
                });
            } else {
                alunoNota.innerHTML = '<option value="">Nenhum aluno encontrado</option>';
            }
            
            alunoNota.disabled = false;
        })
        .catch(error => {
            console.error("Erro ao carregar alunos:", error);
            alunoNota.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            alunoNota.disabled = false;
        });
}

// Função para salvar nota
function salvarNota() {
    console.log("Salvando nota...");
    
    // Obter dados do formulário
    const formNota = document.getElementById('form-nota');
    if (!formNota) return;
    
    const idNota = document.getElementById('id-nota')?.value || '';
    const idTurma = document.getElementById('turma_nota')?.value;
    const idDisciplina = document.getElementById('disciplina_nota')?.value;
    const idAluno = document.getElementById('aluno_nota')?.value;
    const bimestre = document.getElementById('bimestre')?.value;
    const ano = document.getElementById('ano_nota')?.value;
    const notaMensal = document.getElementById('nota_mensal')?.value;
    const notaBimestral = document.getElementById('nota_bimestral')?.value;
    const recuperacao = document.getElementById('recuperacao')?.value;
    const media = document.getElementById('media')?.value;
    
    // Log para debug - valores obtidos do formulário
    console.log('Valores do formulário:', {
        idNota,
        idTurma,
        idDisciplina,
        idAluno,
        bimestre,
        ano,
        notaMensal,
        notaBimestral,
        recuperacao,
        media
    });
    
    // Validar dados obrigatórios
    if (!idTurma || !idDisciplina || !idAluno || !bimestre || !ano) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }
    
    // Verificar se pelo menos uma nota foi preenchida
    if (!notaMensal && !notaBimestral && !recuperacao) {
        alert("Por favor, preencha pelo menos uma nota.");
        return;
    }
    
    // Preparar dados para envio
    const notaData = {
        id_professor: professorId,
        id_turma: idTurma,
        id_disciplina: idDisciplina,
        id_aluno: idAluno,
        bimestre: parseInt(bimestre),
        ano: parseInt(ano),
        nota_mensal: notaMensal ? parseFloat(notaMensal) : null,
        nota_bimestral: notaBimestral ? parseFloat(notaBimestral) : null,
        recuperacao: recuperacao ? parseFloat(recuperacao) : null,
        media: media ? parseFloat(media) : null
    };
    
    // Mostrar indicador de carregamento
    const btnSalvar = document.getElementById('btn-salvar-nota');
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Salvando...';
    }
    
    // Determinar se é uma criação ou atualização
    let url = CONFIG.getApiUrl('/notas');
    let method = 'POST';
    
    if (idNota) {
        url = CONFIG.getApiUrl(`/notas/${idNota}`);
        method = 'PUT';
        notaData.id = idNota;
    }
    
    // Enviar dados para a API
    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notaData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Nota salva com sucesso:", data);
        
        // Registrar atividade
        const alunoNome = document.getElementById('aluno_nota').options[document.getElementById('aluno_nota').selectedIndex]?.text || 'Desconhecido';
        const disciplinaNome = document.getElementById('disciplina_nota').options[document.getElementById('disciplina_nota').selectedIndex]?.text || 'Desconhecida';
        
        registrarAtividade(
            idNota ? 'atualização' : 'criação',
            'nota',
            `Nota ${idNota ? 'atualizada' : 'criada'} com sucesso`,
            `Aluno: ${alunoNome}, Disciplina: ${disciplinaNome}`,
            'concluído'
        );
        
        // Exibir mensagem de sucesso
        exibirMensagem('success', `Nota ${idNota ? 'atualizada' : 'registrada'} com sucesso!`);
        
        // Limpar o formulário e ocultá-lo
        limparFormularioNota();
        
        // Esconder o card do formulário
        const formCard = document.querySelector('.card:has(#form-nota)');
        if (formCard) {
            formCard.classList.add('d-none');
        }
        
        // Recarregar a tabela de notas
        carregarNotas();
    })
    .catch(error => {
        console.error("Erro ao salvar nota:", error);
        
        // Exibir mensagem de erro
        exibirMensagem('danger', `Erro ao salvar a nota: ${error.message}`);
        
        // Registrar erro
        registrarAtividade(
            idNota ? 'atualização' : 'criação',
            'nota',
            `Erro ao ${idNota ? 'atualizar' : 'criar'} nota`,
            error.message,
            'erro'
        );
    })
    .finally(() => {
        // Restaurar botão de salvar
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i class="fas fa-save me-1"></i> Salvar';
        }
    });
}

// Função para limpar o formulário de notas
function limparFormularioNota() {
    console.log("Limpando formulário de notas");
    
    const formNota = document.getElementById('form-nota');
    if (!formNota) {
        console.error('Formulário de notas não encontrado! ID esperado: form-nota');
        return;
    }
    
    // Resetar todos os campos do formulário
    formNota.reset();
    
    // Limpar o ID da nota
    const idNotaInput = document.getElementById('id-nota');
    if (idNotaInput) {
        idNotaInput.value = '';
    }
    
    // Limpar selects que podem ter sido populados
    const selects = ['turma_nota', 'disciplina_nota', 'aluno_nota'];
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">Selecione...</option>';
        }
    });
    
    // Resetar o status visual
    atualizarStatusNota(0);
    
    // Esconder o formulário
    const formCard = document.querySelector('.card:has(#form-nota)');
    if (formCard) {
        formCard.classList.add('d-none');
    }
}

// Função para cancelar a edição de uma nota
function cancelarEdicao() {
    console.log("Cancelando edição de nota");
    
    // Limpar o formulário
    limparFormularioNota();
}

// Função para exibir mensagens toast
function exibirMensagem(tipo, mensagem) {
    // Criar container para as mensagens se não existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Gerar ID único para o toast
    const toastId = 'toast-' + Date.now();
    
    // Definir classe de cor com base no tipo
    let bgClass = 'bg-primary text-white';
    let iconClass = 'fas fa-info-circle';
    
    switch (tipo) {
        case 'success':
            bgClass = 'bg-success text-white';
            iconClass = 'fas fa-check-circle';
            break;
        case 'danger':
        case 'error':
            bgClass = 'bg-danger text-white';
            iconClass = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            bgClass = 'bg-warning text-dark';
            iconClass = 'fas fa-exclamation-triangle';
            break;
    }
    
    // Criar o HTML do toast
    const toastHTML = `
        <div id="${toastId}" class="toast ${bgClass}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass}">
                <i class="${iconClass} me-2"></i>
                <strong class="me-auto">Notificação</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body">
                ${mensagem}
            </div>
        </div>
    `;
    
    // Adicionar o toast ao container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Inicializar e mostrar o toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    
    toast.show();
    
    // Remover o toast do DOM após ser escondido
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}
