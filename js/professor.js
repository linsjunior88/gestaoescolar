document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando dashboard do professor - Versão atualizada com endpoint de vínculos");
    
    // Verificar se o usuário está autenticado como professor
    const userProfile = sessionStorage.getItem('userProfile');
    if (userProfile !== 'professor') {
        // Redirecionar para a página de login se não estiver autenticado como professor
        alert('Você precisa fazer login como professor para acessar esta página.');
        window.location.href = 'index.html';
        return;
    }
    
    // Obter dados do professor da sessão
    const professorId = sessionStorage.getItem('professorId');
    const professorNome = sessionStorage.getItem('professorNome');
    const professorEmail = sessionStorage.getItem('professorEmail');
    const professorDisciplinas = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
    
    console.log("Dados do professor:", professorId, professorNome, professorEmail);
    console.log("Disciplinas:", professorDisciplinas);
    
    // Exibir nome do professor na navbar
    document.getElementById('professor-nome').textContent = professorNome || 'Professor';
    
    // Exibir dados do professor no perfil
    document.getElementById('perfil-id').textContent = professorId || '-';
    document.getElementById('perfil-nome').textContent = professorNome || '-';
    document.getElementById('perfil-email').textContent = professorEmail || '-';
    
    // Inicializar componentes
    initSidebar();
    initLinks();
    loadProfessorDisciplinas();
    
    // Carregar informações para os filtros
    carregarTurmasFiltro();
    carregarDisciplinasFiltro();
    carregarAnosFiltro();
    carregarBimestresFiltro();
    
    // Botão filtrar alunos
    const btnFiltrarAlunosProfessor = document.getElementById('btn-filtrar-alunos-professor');
    if (btnFiltrarAlunosProfessor) {
        btnFiltrarAlunosProfessor.addEventListener('click', carregarAlunosProfessor);
    }
    
    // Botão filtrar notas
    const btnFiltrarNotas = document.getElementById('btn-filtrar-notas');
    if (btnFiltrarNotas) {
        btnFiltrarNotas.addEventListener('click', carregarNotasProfessor);
    }
    
    // Botão de novo lançamento
    const btnNovoLancamento = document.getElementById('btn-novo-lancamento');
    if (btnNovoLancamento) {
        btnNovoLancamento.addEventListener('click', function() {
            resetarFormularioNota();
            const formNota = document.getElementById('form-nota');
            if (formNota) formNota.scrollIntoView({behavior: 'smooth'});
        });
    }
    
    // Botão de cancelar nota
    const btnCancelarNota = document.getElementById('btn-cancelar-nota');
    if (btnCancelarNota) {
        btnCancelarNota.addEventListener('click', resetarFormularioNota);
    }
    
    // Configurar formulário de notas
    const formNota = document.getElementById('form-nota');
    if (formNota) {
        formNota.addEventListener('submit', salvarNota);
        
        // Event listeners para cálculo automático de médias
        const notaMensal = document.getElementById('nota_mensal');
        const notaBimestral = document.getElementById('nota_bimestral');
        const notaRecuperacao = document.getElementById('recuperacao');
        
        if (notaMensal && notaBimestral && notaRecuperacao) {
            [notaMensal, notaBimestral, notaRecuperacao].forEach(input => {
                input.addEventListener('input', calcularMediaAutomatica);
            });
        }
        
        // Event listeners para mudança de turma e disciplina
        const turmaNota = document.getElementById('turma_nota');
        const disciplinaNota = document.getElementById('disciplina_nota');
        
        if (turmaNota) {
            turmaNota.addEventListener('change', function() {
                carregarAlunosSelect();
            });
        }
        
        if (disciplinaNota) {
            disciplinaNota.addEventListener('change', function() {
                // Verificar se a disciplina selecionada é do professor
                const disciplinaId = disciplinaNota.value;
                const professorDisciplinasIds = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
                
                if (disciplinaId && !professorDisciplinasIds.includes(disciplinaId)) {
                    alert('Você só pode lançar notas para as suas disciplinas!');
                    disciplinaNota.value = '';
                }
            });
        }
    }
    
    // Atualizar alunos quando a turma for alterada no filtro de notas
    const filtroTurmaNotas = document.getElementById('filtro-turma-notas');
    if (filtroTurmaNotas) {
        filtroTurmaNotas.addEventListener('change', carregarAlunosFiltroNotas);
    }

    // Configurar botões de logout
    setupLogout();
    
    // Mostrar seção inicial
    mostrarSecao('dashboard');
});

// Função para inicializar a barra lateral
function initSidebar() {
    console.log("Inicializando sidebar");
    const sidebarMenu = document.getElementById('sidebarMenu');
    const mainContent = document.getElementById('mainContent');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const toggleSidebarDesktop = document.getElementById('toggleSidebarDesktop');
    const sidebarIcon = document.getElementById('sidebarIcon');
    
    // Recuperar estado da sidebar do localStorage
    const isSidebarCollapsed = localStorage.getItem('professorSidebarCollapsed') === 'true';
    
    // Aplicar estado inicial
    if (isSidebarCollapsed) {
        sidebarMenu.classList.add('collapsed');
        mainContent.classList.add('expanded');
        if (sidebarIcon) {
            sidebarIcon.classList.remove('fa-angle-left');
            sidebarIcon.classList.add('fa-angle-right');
        }
    }
    
    // Toggle no mobile
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', function() {
            sidebarMenu.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            // Salvar estado no localStorage
            localStorage.setItem('professorSidebarCollapsed', sidebarMenu.classList.contains('collapsed'));
        });
    }
    
    // Toggle no desktop
    if (toggleSidebarDesktop) {
        toggleSidebarDesktop.addEventListener('click', function() {
            sidebarMenu.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            
            // Alternar ícone
            if (sidebarIcon) {
                if (sidebarMenu.classList.contains('collapsed')) {
                    sidebarIcon.classList.remove('fa-angle-left');
                    sidebarIcon.classList.add('fa-angle-right');
                } else {
                    sidebarIcon.classList.remove('fa-angle-right');
                    sidebarIcon.classList.add('fa-angle-left');
                }
            }
            
            // Salvar estado no localStorage
            localStorage.setItem('professorSidebarCollapsed', sidebarMenu.classList.contains('collapsed'));
        });
    }
    
    // Ocultar sidebar quando clicar fora dela em mobile
    document.addEventListener('click', function(event) {
        const windowWidth = window.innerWidth;
        if (windowWidth < 768 && !sidebarMenu.contains(event.target) && !toggleSidebar.contains(event.target)) {
            if (!sidebarMenu.classList.contains('collapsed')) {
                sidebarMenu.classList.add('collapsed');
                mainContent.classList.add('expanded');
                localStorage.setItem('professorSidebarCollapsed', 'true');
            }
        }
    });
}

// Função para inicializar links do menu
function initLinks() {
    const links = {
        'dashboard-link': 'conteudo-dashboard',
        'alunos-link': 'conteudo-alunos',
        'notas-link': 'conteudo-notas'
    };
    
    const titulos = {
        'dashboard-link': 'Dashboard do Professor',
        'alunos-link': 'Meus Alunos',
        'notas-link': 'Gestão de Notas'
    };
    
    const subtitulos = {
        'dashboard-link': 'Área restrita do professor',
        'alunos-link': 'Visualize os alunos nas suas turmas e disciplinas',
        'notas-link': 'Gerencie as notas dos seus alunos'
    };
    
    // Função para ativar seção
    function ativarSecao(linkId) {
        // Desativar todas as seções e links
        document.querySelectorAll('.conteudo-secao').forEach(secao => {
            secao.classList.remove('active');
        });
        
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Ativar a seção correspondente e o link
        const secaoId = links[linkId];
        const secao = document.getElementById(secaoId);
        const link = document.getElementById(linkId);
        
        if (secao && link) {
            secao.classList.add('active');
            link.classList.add('active');
            
            // Atualizar título e subtítulo
            document.getElementById('page-title').textContent = titulos[linkId] || 'Dashboard';
            document.getElementById('page-subtitle').textContent = subtitulos[linkId] || '';
        }
    }
    
    // Adicionar event listeners para os links
    Object.keys(links).forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                ativarSecao(linkId);
            });
        }
    });
    
    // Setar a seção inicial
    ativarSecao('dashboard-link');
}

// Função para carregar as disciplinas e turmas do professor
function loadProfessorDisciplinas() {
    const professorId = sessionStorage.getItem('professorId');
    const disciplinasLista = document.getElementById('professor-disciplinas-lista');
    const perfilDisciplinas = document.getElementById('perfil-disciplinas');
    
    if (!disciplinasLista || !perfilDisciplinas) return;
    
    // Exibir mensagem de carregamento
    disciplinasLista.innerHTML = `
        <tr class="text-center">
            <td colspan="3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p>Carregando disciplinas...</p>
            </td>
        </tr>
    `;
    
    console.log(`Iniciando carregamento das disciplinas do professor ${professorId}`);
    
    // Primeiro tentamos obter o professor
    fetch(`http://localhost:4000/api/professores/${professorId}`)
        .then(response => {
            console.log('Status da resposta (dados professor):', response.status);
            if (!response.ok) {
                throw new Error('Erro ao buscar professor: ' + response.statusText);
            }
            return response.json();
        })
        .then(professor => {
            console.log('Professor encontrado:', professor);
            
            // Em seguida, buscamos as disciplinas
            return fetch('http://localhost:4000/api/disciplinas/')
                .then(response => {
                    console.log('Status da resposta (disciplinas):', response.status);
                    if (!response.ok) {
                        throw new Error('Erro ao buscar disciplinas: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(disciplinas => {
                    console.log(`Disciplinas encontradas: ${disciplinas.length}`);
                    
                    // Tentar obter disciplinas associadas do professor
                    const professorDisciplinasIds = professor.disciplinas || [];
                    console.log('Disciplinas do professor:', professorDisciplinasIds);
                    
                    // Filtrar disciplinas do professor
                    const disciplinasProfessor = professorDisciplinasIds.length > 0 
                        ? disciplinas.filter(d => professorDisciplinasIds.includes(d.id_disciplina))
                        : disciplinas;
                    
                    console.log(`Disciplinas filtradas: ${disciplinasProfessor.length}`);
                    
                    // Buscar turmas
                    return fetch('http://localhost:4000/api/turmas/')
                        .then(response => {
                            console.log('Status da resposta (turmas):', response.status);
                            if (!response.ok) {
                                throw new Error('Erro ao buscar turmas: ' + response.statusText);
                            }
                            return response.json();
                        })
                        .then(turmas => {
                            console.log(`Turmas encontradas: ${turmas.length}`);
                            return { professor, disciplinasProfessor, turmas };
                        });
                });
        })
        .then(({ professor, disciplinasProfessor, turmas }) => {
            if (disciplinasProfessor.length === 0) {
                disciplinasLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="3">
                            Você não possui disciplinas atribuídas
                        </td>
                    </tr>
                `;
                perfilDisciplinas.textContent = 'Nenhuma disciplina atribuída';
                return;
            }
            
            // Mostrar disciplinas no perfil
            const nomesDisciplinas = disciplinasProfessor.map(d => d.nome_disciplina).join(', ');
            perfilDisciplinas.textContent = nomesDisciplinas;
            
            // Limpar lista
            disciplinasLista.innerHTML = '';
            
            // Criar mock de vínculos entre professores e turmas
            // Isso será substituído quando o backend estiver funcionando corretamente
            const mockVinculos = [];
            
            // Para cada disciplina, associar algumas turmas aleatórias
            disciplinasProfessor.forEach(disciplina => {
                // Selecionar 2 turmas aleatórias para cada disciplina
                const turmasAleatorias = turmas.sort(() => 0.5 - Math.random()).slice(0, 2);
                
                turmasAleatorias.forEach(turma => {
                    mockVinculos.push({
                        id_professor: professor.id_professor,
                        nome_professor: professor.nome_professor,
                        id_disciplina: disciplina.id_disciplina,
                        nome_disciplina: disciplina.nome_disciplina,
                        id_turma: turma.id_turma,
                        serie: turma.serie, 
                        turno: turma.turno || 'Manhã'
                    });
                });
            });
            
            console.log('Vínculos simulados:', mockVinculos);
            
            // Agrupar vínculos por disciplina
            const disciplinasMap = new Map();
            
            mockVinculos.forEach(vinculo => {
                if (!disciplinasMap.has(vinculo.id_disciplina)) {
                    disciplinasMap.set(vinculo.id_disciplina, {
                        nome_disciplina: vinculo.nome_disciplina,
                        turmas: [],
                        alunosCount: 0
                    });
                }
                
                // Adicionar turma se ainda não estiver na lista
                const turmaInfo = {
                    id_turma: vinculo.id_turma,
                    serie: vinculo.serie,
                    turno: vinculo.turno
                };
                
                const disciplina = disciplinasMap.get(vinculo.id_disciplina);
                if (!disciplina.turmas.some(t => t.id_turma === turmaInfo.id_turma)) {
                    disciplina.turmas.push(turmaInfo);
                }
            });
            
            // Converter o Map para array e ordenar por nome da disciplina
            Array.from(disciplinasMap.entries())
                .sort((a, b) => a[1].nome_disciplina.localeCompare(b[1].nome_disciplina))
                .forEach(([idDisciplina, disciplina]) => {
                    // Verificar se há turmas vinculadas
                    let turmasTexto = 'Nenhuma turma vinculada';
                    
                    if (disciplina.turmas.length > 0) {
                        // Ordenar turmas por série e ID
                        disciplina.turmas.sort((a, b) => 
                            a.serie.localeCompare(b.serie) || 
                            a.id_turma.localeCompare(b.id_turma)
                        );
                        
                        // Formatar texto das turmas
                        turmasTexto = disciplina.turmas.map(t => 
                            `<a href="#" class="text-decoration-none" onclick="mostrarDetalhesAlunos('${idDisciplina}', '${t.id_turma}')">
                                ${t.id_turma} (${t.serie})
                            </a>`
                        ).join(', ');
                    }
                    
                    // Contar alunos (provisório)
                    const alunosCount = disciplina.turmas.length * 25; // Valor estimado provisório
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${disciplina.nome_disciplina}</td>
                        <td>${turmasTexto}</td>
                        <td>${alunosCount}</td>
                    `;
                    
                    disciplinasLista.appendChild(tr);
                });
                
            // Salvar as disciplinas na sessão para uso em outros componentes
            const professorDisciplinasIds = Array.from(disciplinasMap.keys());
            sessionStorage.setItem('professorDisciplinas', JSON.stringify(professorDisciplinasIds));
                
            // Atualizar os filtros de turmas e disciplinas
            carregarTurmasFiltro();
            carregarDisciplinasFiltro();
        })
        .catch(error => {
            console.error('Erro ao carregar disciplinas do professor:', error);
            disciplinasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="3" class="text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erro ao carregar disciplinas: ${error.message}
                    </td>
                </tr>
            `;
            perfilDisciplinas.textContent = 'Erro ao carregar disciplinas';
        });
}

// Função para carregar turmas nos filtros
function carregarTurmasFiltro() {
    const professorId = sessionStorage.getItem('professorId');
    const filtroTurmaProfessor = document.getElementById('filtro-turma-professor');
    const filtroTurmaNotas = document.getElementById('filtro-turma-notas');
    const turmaNota = document.getElementById('turma_nota');
    
    if (!filtroTurmaProfessor && !filtroTurmaNotas && !turmaNota) return;
    
    console.log("Carregando turmas para filtros");
    
    // Usamos as disciplinas do professor do sessionStorage
    const professorDisciplinasIds = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
    
    // Buscar turmas
    fetch('http://localhost:4000/api/turmas/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao buscar turmas: ' + response.statusText);
            }
            return response.json();
        })
        .then(turmas => {
            console.log(`Turmas carregadas: ${turmas.length}`);
            
            // Selecionar aleatoriamente algumas turmas (simulação)
            // Em uma implementação real, buscaríamos os vínculos reais
            const turmasProfessor = turmas.sort(() => 0.5 - Math.random()).slice(0, 5);
            
            // Ordenar turmas
            turmasProfessor.sort((a, b) => a.serie.localeCompare(b.serie) || a.id_turma.localeCompare(b.id_turma));
            
            console.log(`Turmas selecionadas para filtros: ${turmasProfessor.length}`);
            
            // Preencher os selects com as turmas
            [filtroTurmaProfessor, filtroTurmaNotas, turmaNota].forEach(select => {
                if (select) {
                    // Manter a primeira opção
                    const firstOption = select.options[0];
                    select.innerHTML = '';
                    select.appendChild(firstOption);
                    
                    // Adicionar as turmas
                    turmasProfessor.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma.id_turma;
                        option.textContent = `${turma.id_turma} (${turma.serie})`;
                        select.appendChild(option);
                    });
                }
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas para filtros:", error);
        });
}

// Função para carregar disciplinas nos filtros
function carregarDisciplinasFiltro() {
    const professorId = sessionStorage.getItem('professorId');
    const filtroDisciplinaProfessor = document.getElementById('filtro-disciplina-professor');
    const filtroDisciplinaNotas = document.getElementById('filtro-disciplina-notas');
    const disciplinaNota = document.getElementById('disciplina_nota');
    
    if (!filtroDisciplinaProfessor && !filtroDisciplinaNotas && !disciplinaNota) return;
    
    console.log("Carregando disciplinas para filtros");
    
    // Usamos as disciplinas do professor do sessionStorage
    const professorDisciplinasIds = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
    
    // Se temos IDs de disciplinas, vamos buscar suas informações
    if (professorDisciplinasIds.length > 0) {
        fetch('http://localhost:4000/api/disciplinas/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar disciplinas: ' + response.statusText);
                }
                return response.json();
            })
            .then(disciplinas => {
                console.log(`Disciplinas carregadas: ${disciplinas.length}`);
                
                // Filtrar disciplinas do professor
                const disciplinasProfessor = disciplinas.filter(d => 
                    professorDisciplinasIds.includes(d.id_disciplina)
                );
                
                if (disciplinasProfessor.length === 0) {
                    // Se não encontramos as disciplinas específicas, usamos todas
                    console.log("Nenhuma disciplina específica encontrada, usando todas");
                    disciplinasProfessor.push(...disciplinas);
                }
                
                // Ordenar por nome
                disciplinasProfessor.sort((a, b) => a.nome_disciplina.localeCompare(b.nome_disciplina));
                
                console.log(`Disciplinas selecionadas para filtros: ${disciplinasProfessor.length}`);
                
                // Preencher os selects com as disciplinas
                [filtroDisciplinaProfessor, filtroDisciplinaNotas, disciplinaNota].forEach(select => {
                    if (select) {
                        // Manter a primeira opção
                        const firstOption = select.options[0];
                        select.innerHTML = '';
                        select.appendChild(firstOption);
                        
                        // Adicionar as disciplinas
                        disciplinasProfessor.forEach(disciplina => {
                            const option = document.createElement('option');
                            option.value = disciplina.id_disciplina;
                            option.textContent = disciplina.nome_disciplina;
                            select.appendChild(option);
                        });
                    }
                });
            })
            .catch(error => {
                console.error("Erro ao carregar disciplinas para filtros:", error);
            });
    } else {
        // Se não temos IDs específicos, buscamos todas as disciplinas
        fetch('http://localhost:4000/api/disciplinas/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar disciplinas: ' + response.statusText);
                }
                return response.json();
            })
            .then(disciplinas => {
                console.log(`Todas as disciplinas carregadas: ${disciplinas.length}`);
                
                // Ordenar por nome
                disciplinas.sort((a, b) => a.nome_disciplina.localeCompare(b.nome_disciplina));
                
                // Preencher os selects com as disciplinas
                [filtroDisciplinaProfessor, filtroDisciplinaNotas, disciplinaNota].forEach(select => {
                    if (select) {
                        // Manter a primeira opção
                        const firstOption = select.options[0];
                        select.innerHTML = '';
                        select.appendChild(firstOption);
                        
                        // Adicionar as disciplinas
                        disciplinas.forEach(disciplina => {
                            const option = document.createElement('option');
                            option.value = disciplina.id_disciplina;
                            option.textContent = disciplina.nome_disciplina;
                            select.appendChild(option);
                        });
                    }
                });
            })
            .catch(error => {
                console.error("Erro ao carregar todas as disciplinas para filtros:", error);
            });
    }
}

// Função para carregar anos nos filtros
function carregarAnosFiltro() {
    const filtroAnoNotas = document.getElementById('filtro-ano-notas');
    const anoNota = document.getElementById('ano_nota');
    
    if (!filtroAnoNotas && !anoNota) return;
    
    const anoAtual = new Date().getFullYear();
    
    [filtroAnoNotas, anoNota].forEach(select => {
        if (select) {
            // Manter a primeira opção
            const firstOption = select.options[0];
            select.innerHTML = '';
            select.appendChild(firstOption);
            
            // Adicionar os anos
            for (let ano = 2022; ano <= 2030; ano++) {
                const option = document.createElement('option');
                option.value = ano;
                option.textContent = ano;
                if (ano === anoAtual) option.selected = true;
                select.appendChild(option);
            }
        }
    });
}

// Função para carregar bimestres no select do formulário de notas
function carregarBimestresFiltro() {
    const bimestreSelect = document.getElementById('bimestre');
    const filtroBimestreNotas = document.getElementById('filtro-bimestre-notas');
    
    // Array de elementos a verificar
    const elements = [bimestreSelect, filtroBimestreNotas];
    
    elements.forEach(select => {
        if (!select) return;
        
        // Verificar se já tem opções além da primeira
        if (select.options.length > 1) return;
        
        // Manter a primeira opção
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Adicionar os bimestres
        for (let bim = 1; bim <= 4; bim++) {
            const option = document.createElement('option');
            option.value = bim;
            option.textContent = `${bim}º Bimestre`;
            select.appendChild(option);
        }
    });
    
    console.log("Bimestres carregados no select:", bimestreSelect ? bimestreSelect.options.length : 0);
}

// Função para carregar alunos do professor
function carregarAlunosProfessor() {
    const filtroTurma = document.getElementById('filtro-turma-professor');
    const filtroDisciplina = document.getElementById('filtro-disciplina-professor');
    const alunosLista = document.getElementById('alunos-professor-lista');
    
    if (!alunosLista) return;
    
    const turmaId = filtroTurma ? filtroTurma.value : '';
    const disciplinaId = filtroDisciplina ? filtroDisciplina.value : '';
    
    // Verificar acesso do professor
    const professorDisciplinasIds = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
    
    if (disciplinaId && !professorDisciplinasIds.includes(disciplinaId)) {
        alert('Você só tem acesso às suas disciplinas!');
        return;
    }
    
    // Obter dados do localStorage
    const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
    const turmas = JSON.parse(localStorage.getItem('turmas') || '[]');
    const disciplinas = JSON.parse(localStorage.getItem('disciplinas') || '[]');
    
    // Encontrar turmas vinculadas às disciplinas do professor
    let turmasPermitidas = new Set();
    
    if (disciplinaId) {
        // Se uma disciplina foi selecionada, usar apenas as turmas dessa disciplina
        const disciplina = disciplinas.find(d => d.id_disciplina === disciplinaId);
        if (disciplina && disciplina.turmas_vinculadas) {
            disciplina.turmas_vinculadas.forEach(id => turmasPermitidas.add(id));
        }
    } else {
        // Se nenhuma disciplina foi selecionada, usar todas as turmas das disciplinas do professor
        disciplinas.forEach(disciplina => {
            if (professorDisciplinasIds.includes(disciplina.id_disciplina) && disciplina.turmas_vinculadas) {
                disciplina.turmas_vinculadas.forEach(id => turmasPermitidas.add(id));
            }
        });
    }
    
    // Filtrar alunos
    let alunosFiltrados = alunos;
    
    // Filtrar por turma
    if (turmaId) {
        // Verificar se o professor tem acesso a esta turma
        if (!turmasPermitidas.has(turmaId)) {
            alert('Você não tem acesso a esta turma!');
            return;
        }
        
        alunosFiltrados = alunosFiltrados.filter(a => a.id_turma === turmaId);
    } else {
        // Se nenhuma turma específica foi selecionada, filtrar pelos IDs permitidos
        alunosFiltrados = alunosFiltrados.filter(a => turmasPermitidas.has(a.id_turma));
    }
    
    // Ordenar alunos por nome
    alunosFiltrados.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
    
    // Atualizar a lista
    alunosLista.innerHTML = '';
    
    if (alunosFiltrados.length === 0) {
        alunosLista.innerHTML = `
            <tr class="text-center">
                <td colspan="6">Nenhum aluno encontrado</td>
            </tr>
        `;
        return;
    }
    
    // Adicionar cada aluno à lista
    alunosFiltrados.forEach(aluno => {
        const turma = turmas.find(t => t.id_turma === aluno.id_turma);
        const turmaTexto = turma ? `${turma.id_turma} (${turma.serie})` : aluno.id_turma;
        
        // Formatar data de nascimento
        let dataNascFormatada = aluno.data_nasc || '-';
        if (dataNascFormatada !== '-') {
            const partes = dataNascFormatada.split('-');
            if (partes.length === 3) {
                dataNascFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${aluno.id_aluno}</td>
            <td>${aluno.nome_aluno}</td>
            <td>${turmaTexto}</td>
            <td>${aluno.sexo || '-'}</td>
            <td>${dataNascFormatada}</td>
            <td>${aluno.mae || '-'}</td>
        `;
        
        alunosLista.appendChild(tr);
    });
}

// Função para carregar alunos no select do formulário de notas
function carregarAlunosSelect() {
    const turmaNota = document.getElementById('turma_nota');
    const alunoNota = document.getElementById('aluno_nota');
    
    if (!turmaNota || !alunoNota) return;
    
    const turmaId = turmaNota.value;
    
    // Limpar o select de alunos
    const firstOption = alunoNota.options[0];
    alunoNota.innerHTML = '';
    alunoNota.appendChild(firstOption);
    
    if (!turmaId) return;
    
    // Obter alunos da turma selecionada
    const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
    const alunosTurma = alunos.filter(a => a.id_turma === turmaId);
    
    // Ordenar alunos por nome
    alunosTurma.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
    
    // Adicionar alunos ao select
    alunosTurma.forEach(aluno => {
        const option = document.createElement('option');
        option.value = aluno.id_aluno;
        option.textContent = aluno.nome_aluno;
        alunoNota.appendChild(option);
    });
}

// Função para carregar notas do professor
function carregarNotasProfessor() {
    const filtroTurma = document.getElementById('filtro-turma-notas');
    const filtroDisciplina = document.getElementById('filtro-disciplina-notas');
    const filtroBimestre = document.getElementById('filtro-bimestre-notas');
    const filtroAluno = document.getElementById('filtro-aluno-notas');
    const filtroAno = document.getElementById('filtro-ano-notas');
    const notasLista = document.getElementById('notas-lista');
    
    if (!notasLista) return;
    
    const turmaId = filtroTurma ? filtroTurma.value : '';
    const disciplinaId = filtroDisciplina ? filtroDisciplina.value : '';
    const bimestre = filtroBimestre ? filtroBimestre.value : '';
    const alunoId = filtroAluno ? filtroAluno.value : '';
    const ano = filtroAno ? filtroAno.value : '';
    
    // Verificar acesso do professor
    const professorDisciplinasIds = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
    
    if (disciplinaId && !professorDisciplinasIds.includes(disciplinaId)) {
        alert('Você só tem acesso às suas disciplinas!');
        return;
    }
    
    // Obter dados do localStorage
    const notas = JSON.parse(localStorage.getItem('notas') || '[]');
    const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
    const turmas = JSON.parse(localStorage.getItem('turmas') || '[]');
    const disciplinas = JSON.parse(localStorage.getItem('disciplinas') || '[]');
    
    // Filtrar notas por disciplinas do professor
    let notasFiltradas = notas.filter(nota => professorDisciplinasIds.includes(nota.id_disciplina));
    
    // Aplicar filtros adicionais
    if (turmaId) {
        notasFiltradas = notasFiltradas.filter(nota => nota.id_turma === turmaId);
    }
    
    if (disciplinaId) {
        notasFiltradas = notasFiltradas.filter(nota => nota.id_disciplina === disciplinaId);
    }
    
    if (bimestre) {
        notasFiltradas = notasFiltradas.filter(nota => nota.bimestre.toString() === bimestre);
    }
    
    if (alunoId) {
        notasFiltradas = notasFiltradas.filter(nota => nota.id_aluno === alunoId);
    }
    
    if (ano) {
        notasFiltradas = notasFiltradas.filter(nota => nota.ano.toString() === ano);
    }
    
    // Ordenar notas
    notasFiltradas.sort((a, b) => {
        // Primeiro por aluno
        const alunoA = alunos.find(al => al.id_aluno === a.id_aluno);
        const alunoB = alunos.find(al => al.id_aluno === b.id_aluno);
        const nomeA = alunoA ? alunoA.nome_aluno : '';
        const nomeB = alunoB ? alunoB.nome_aluno : '';
        
        const comparaNomes = nomeA.localeCompare(nomeB);
        if (comparaNomes !== 0) return comparaNomes;
        
        // Depois por disciplina
        const discA = disciplinas.find(d => d.id_disciplina === a.id_disciplina);
        const discB = disciplinas.find(d => d.id_disciplina === b.id_disciplina);
        const discNomeA = discA ? discA.nome_disciplina : '';
        const discNomeB = discB ? discB.nome_disciplina : '';
        
        const comparaDisc = discNomeA.localeCompare(discNomeB);
        if (comparaDisc !== 0) return comparaDisc;
        
        // Por último, por bimestre
        return a.bimestre - b.bimestre;
    });
    
    // Atualizar a lista
    notasLista.innerHTML = '';
    
    if (notasFiltradas.length === 0) {
        notasLista.innerHTML = `
            <tr class="text-center">
                <td colspan="9">Nenhuma nota encontrada</td>
            </tr>
        `;
        return;
    }
    
    // Adicionar cada nota à lista
    notasFiltradas.forEach((nota, index) => {
        const aluno = alunos.find(a => a.id_aluno === nota.id_aluno);
        const turma = turmas.find(t => t.id_turma === nota.id_turma);
        const disciplina = disciplinas.find(d => d.id_disciplina === nota.id_disciplina);
        
        // Obter informações para exibição
        const nomeAluno = aluno ? aluno.nome_aluno : nota.id_aluno;
        const nomeTurma = turma ? `${turma.id_turma} (${turma.serie})` : nota.id_turma;
        const nomeDisciplina = disciplina ? disciplina.nome_disciplina : nota.id_disciplina;
        
        // Determinar classe de fundo com base no status das notas
        let bgClass = '';
        
        // Se estiver faltando alguma nota, usar cor clara
        if (nota.nota_mensal === null || nota.nota_bimestral === null) {
            bgClass = 'table-light';
        } 
        // Se média for menor que 6, usar vermelho claro
        else if (parseFloat(nota.media) < 6.0) {
            bgClass = 'table-danger';
        }
        
        const tr = document.createElement('tr');
        tr.className = bgClass;
        
        tr.innerHTML = `
            <td>${nomeAluno}</td>
            <td>${nomeTurma}</td>
            <td>${nomeDisciplina}</td>
            <td>${nota.bimestre}º Bimestre</td>
            <td>${nota.nota_mensal !== null ? nota.nota_mensal.toFixed(1) : '-'}</td>
            <td>${nota.nota_bimestral !== null ? nota.nota_bimestral.toFixed(1) : '-'}</td>
            <td>${nota.recuperacao !== null ? nota.recuperacao.toFixed(1) : '-'}</td>
            <td><strong>${nota.media !== null ? nota.media.toFixed(1) : '-'}</strong></td>
            <td class="text-center">
                <button class="btn btn-sm btn-primary editar-nota me-1" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        notasLista.appendChild(tr);
    });
    
    // Adicionar event listeners para botões de editar
    document.querySelectorAll('.editar-nota').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            editarNota(notasFiltradas[index]);
        });
    });
}

// Função para calcular média automaticamente
function calcularMediaAutomatica() {
    const notaMensal = document.getElementById('nota_mensal');
    const notaBimestral = document.getElementById('nota_bimestral');
    const notaRecuperacao = document.getElementById('recuperacao');
    const mediaInput = document.getElementById('media');
    
    if (!notaMensal || !notaBimestral || !notaRecuperacao || !mediaInput) return;
    
    let nota1 = parseFloat(notaMensal.value) || 0;
    let nota2 = parseFloat(notaBimestral.value) || 0;
    let rec = parseFloat(notaRecuperacao.value) || 0;
    
    // Validar limites
    nota1 = Math.min(Math.max(nota1, 0), 10);
    nota2 = Math.min(Math.max(nota2, 0), 10);
    rec = Math.min(Math.max(rec, 0), 10);
    
    // Calcular média com base nas notas disponíveis
    let media = 0;
    
    if (notaMensal.value && !notaBimestral.value) {
        // Se só tiver nota mensal, a média é apenas essa nota
        media = nota1;
    } else if (!notaMensal.value && notaBimestral.value) {
        // Se só tiver nota bimestral, a média é apenas essa nota
        media = nota2;
    } else if (notaMensal.value && notaBimestral.value) {
        // Se tiver ambas as notas, calcular a média normal
        media = (nota1 + nota2) / 2;
        
        // Se média < 6.0, considerar recuperação
        if (media < 6.0 && rec > 0) {
            let mediaComRec = (media + rec) / 2;
            media = mediaComRec;
        }
    }
    
    // Atualizar campo de média
    mediaInput.value = media.toFixed(1);
}

// Função para editar uma nota
function editarNota(nota) {
    const formModoNota = document.getElementById('form-modo-nota');
    const notaIndex = document.getElementById('nota-index');
    const anoNota = document.getElementById('ano_nota');
    const bimestreSelect = document.getElementById('bimestre');
    const turmaNota = document.getElementById('turma_nota');
    const disciplinaNota = document.getElementById('disciplina_nota');
    const alunoNota = document.getElementById('aluno_nota');
    const notaMensal = document.getElementById('nota_mensal');
    const notaBimestral = document.getElementById('nota_bimestral');
    const notaRecuperacao = document.getElementById('recuperacao');
    const mediaFinal = document.getElementById('media');
    const btnCancelarNota = document.getElementById('btn-cancelar-nota');
    const formNotaTitulo = document.getElementById('form-nota-titulo');
    
    // Setar modo e índice
    formModoNota.value = 'editar';
    
    // Buscar o índice da nota no localStorage
    const notas = JSON.parse(localStorage.getItem('notas') || '[]');
    const index = notas.findIndex(n => 
        n.id_aluno === nota.id_aluno && 
        n.id_disciplina === nota.id_disciplina && 
        n.id_turma === nota.id_turma && 
        n.bimestre === nota.bimestre &&
        n.ano === nota.ano
    );
    
    if (index === -1) {
        alert('Erro ao editar: nota não encontrada!');
        return;
    }
    
    notaIndex.value = index;
    
    // Preencher formulário com dados da nota
    anoNota.value = nota.ano;
    bimestreSelect.value = nota.bimestre;
    turmaNota.value = nota.id_turma;
    disciplinaNota.value = nota.id_disciplina;
    
    // Carregar alunos da turma e então selecionar o aluno correto
    carregarAlunosSelect();
    setTimeout(() => {
        alunoNota.value = nota.id_aluno;
    }, 100);
    
    // Preencher notas
    notaMensal.value = nota.nota_mensal !== null ? nota.nota_mensal : '';
    notaBimestral.value = nota.nota_bimestral !== null ? nota.nota_bimestral : '';
    notaRecuperacao.value = nota.recuperacao !== null ? nota.recuperacao : '';
    mediaFinal.value = nota.media !== null ? nota.media : '';
    
    // Mostrar botão de cancelar
    btnCancelarNota.style.display = 'block';
    
    // Atualizar título do formulário
    let statusNotas = '';
    if (nota.nota_mensal !== null && nota.nota_bimestral !== null) {
        statusNotas = ' - Notas Completas';
    } else if (nota.nota_mensal !== null || nota.nota_bimestral !== null) {
        statusNotas = ' - Notas Parciais';
    }
    
    formNotaTitulo.textContent = `Editar Lançamento${statusNotas}`;
    
    // Scrollar até o formulário
    const formNota = document.getElementById('form-nota');
    if (formNota) formNota.scrollIntoView({behavior: 'smooth'});
}

// Função para resetar o formulário de nota
function resetarFormularioNota() {
    const formNota = document.getElementById('form-nota');
    const formModoNota = document.getElementById('form-modo-nota');
    const notaIndex = document.getElementById('nota-index');
    const btnCancelarNota = document.getElementById('btn-cancelar-nota');
    const formNotaTitulo = document.getElementById('form-nota-titulo');
    
    if (!formNota) return;
    
    // Guardar as opções atuais
    const anoNota = document.getElementById('ano_nota');
    const bimestreSelect = document.getElementById('bimestre');
    const turmaNota = document.getElementById('turma_nota');
    const disciplinaNota = document.getElementById('disciplina_nota');
    
    const anoOpcoes = anoNota ? Array.from(anoNota.options) : [];
    const bimestreOpcoes = bimestreSelect ? Array.from(bimestreSelect.options) : [];
    const turmaOpcoes = turmaNota ? Array.from(turmaNota.options) : [];
    const disciplinaOpcoes = disciplinaNota ? Array.from(disciplinaNota.options) : [];
    
    // Resetar o formulário
    formNota.reset();
    formModoNota.value = 'novo';
    notaIndex.value = '';
    
    // Restaurar as opções que foram apagadas pelo reset
    if (anoNota && anoOpcoes.length > 0) {
        anoNota.innerHTML = '';
        anoOpcoes.forEach(option => anoNota.appendChild(option.cloneNode(true)));
    }
    
    if (bimestreSelect && bimestreOpcoes.length > 0) {
        bimestreSelect.innerHTML = '';
        bimestreOpcoes.forEach(option => bimestreSelect.appendChild(option.cloneNode(true)));
    }
    
    if (turmaNota && turmaOpcoes.length > 0) {
        turmaNota.innerHTML = '';
        turmaOpcoes.forEach(option => turmaNota.appendChild(option.cloneNode(true)));
    }
    
    if (disciplinaNota && disciplinaOpcoes.length > 0) {
        disciplinaNota.innerHTML = '';
        disciplinaOpcoes.forEach(option => disciplinaNota.appendChild(option.cloneNode(true)));
    }
    
    // Ocultar botão de cancelar
    if (btnCancelarNota) btnCancelarNota.style.display = 'none';
    
    // Atualizar título
    if (formNotaTitulo) formNotaTitulo.textContent = 'Lançamento de Notas';
}

// Função para salvar uma nota
function salvarNota(e) {
    e.preventDefault();
    
    const formModoNota = document.getElementById('form-modo-nota');
    const notaIndex = document.getElementById('nota-index');
    const anoNota = document.getElementById('ano_nota');
    const bimestreSelect = document.getElementById('bimestre');
    const turmaNota = document.getElementById('turma_nota');
    const disciplinaNota = document.getElementById('disciplina_nota');
    const alunoNota = document.getElementById('aluno_nota');
    const notaMensal = document.getElementById('nota_mensal');
    const notaBimestral = document.getElementById('nota_bimestral');
    const notaRecuperacao = document.getElementById('recuperacao');
    const mediaFinal = document.getElementById('media');
    
    // Validar campos obrigatórios
    if (!anoNota.value || !bimestreSelect.value || !turmaNota.value || !disciplinaNota.value || !alunoNota.value) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Validar que pelo menos uma nota foi preenchida
    if (!notaMensal.value && !notaBimestral.value) {
        alert('Por favor, informe pelo menos a nota mensal ou a nota bimestral.');
        return;
    }
    
    // Verificar acesso do professor à disciplina
    const professorDisciplinasIds = JSON.parse(sessionStorage.getItem('professorDisciplinas') || '[]');
    if (!professorDisciplinasIds.includes(disciplinaNota.value)) {
        alert('Você só pode lançar notas para as suas disciplinas!');
        return;
    }
    
    // Transformar valores vazios em null
    const nota_mensal = notaMensal.value ? parseFloat(notaMensal.value) : null;
    const nota_bimestral = notaBimestral.value ? parseFloat(notaBimestral.value) : null;
    const recuperacao = notaRecuperacao.value ? parseFloat(notaRecuperacao.value) : null;
    const media = mediaFinal.value ? parseFloat(mediaFinal.value) : null;
    
    // Criar objeto com os dados da nota
    const notaData = {
        ano: parseInt(anoNota.value),
        bimestre: parseInt(bimestreSelect.value),
        id_turma: turmaNota.value,
        id_disciplina: disciplinaNota.value,
        id_aluno: alunoNota.value,
        nota_mensal: nota_mensal,
        nota_bimestral: nota_bimestral,
        recuperacao: recuperacao,
        media: media,
        data_atualizacao: new Date().toISOString()
    };
    
    // Obter lista atual de notas
    let notas = JSON.parse(localStorage.getItem('notas') || '[]');
    
    // Verificar o modo (novo ou edição)
    if (formModoNota.value === 'novo') {
        // Verificar se já existe uma nota com esta combinação
        const existente = notas.findIndex(n => 
            n.id_aluno === notaData.id_aluno && 
            n.id_disciplina === notaData.id_disciplina && 
            n.id_turma === notaData.id_turma && 
            n.bimestre === notaData.bimestre &&
            n.ano === notaData.ano
        );
        
        if (existente !== -1) {
            alert('Já existe um lançamento de notas para este aluno, disciplina, turma, bimestre e ano. Por favor, edite o lançamento existente.');
            return;
        }
        
        // Adicionar nova nota
        notas.push(notaData);
        alert('Notas salvas com sucesso!');
    } else {
        // Editar nota existente
        const index = parseInt(notaIndex.value);
        
        if (isNaN(index) || index < 0 || index >= notas.length) {
            alert('Erro ao editar: índice inválido!');
            return;
        }
        
        notas[index] = notaData;
        alert('Notas atualizadas com sucesso!');
    }
    
    // Salvar no localStorage
    localStorage.setItem('notas', JSON.stringify(notas));
    
    // Resetar formulário e recarregar listagem
    resetarFormularioNota();
    carregarNotasProfessor();
}

// Função para carregar alunos no filtro de notas
function carregarAlunosFiltroNotas() {
    const filtroTurmaNotas = document.getElementById('filtro-turma-notas');
    const filtroAlunoNotas = document.getElementById('filtro-aluno-notas');
    
    if (!filtroTurmaNotas || !filtroAlunoNotas) return;
    
    const turmaId = filtroTurmaNotas.value;
    
    // Manter a primeira opção
    const firstOption = filtroAlunoNotas.options[0];
    filtroAlunoNotas.innerHTML = '';
    filtroAlunoNotas.appendChild(firstOption);
    
    if (!turmaId) return;
    
    // Obter alunos da turma selecionada
    const alunos = JSON.parse(localStorage.getItem('alunos') || '[]');
    const alunosTurma = alunos.filter(a => a.id_turma === turmaId);
    
    // Ordenar alunos por nome
    alunosTurma.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
    
    // Adicionar alunos ao select
    alunosTurma.forEach(aluno => {
        const option = document.createElement('option');
        option.value = aluno.id_aluno;
        option.textContent = aluno.nome_aluno;
        filtroAlunoNotas.appendChild(option);
    });
}

// Função para configurar os botões de logout
function setupLogout() {
    const btnLogout = document.getElementById('btn-logout');
    const sidebarLogout = document.getElementById('sidebar-logout');
    
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    if (sidebarLogout) {
        sidebarLogout.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Função para realizar o logout
function logout() {
    console.log("Realizando logout do professor...");
    
    // Limpar todas as informações de sessão
    sessionStorage.clear();
    
    // Redirecionar para a página de login
    window.location.href = 'index.html';
}

// Função para mostrar seção inicial
function mostrarSecao(secaoId) {
    // Desativar todas as seções e links
    document.querySelectorAll('.conteudo-secao').forEach(secao => {
        secao.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Ativar a seção correspondente e o link
    const secao = document.getElementById(secaoId);
    const link = document.getElementById(secaoId + '-link');
    
    if (secao && link) {
        secao.classList.add('active');
        link.classList.add('active');
        
        // Atualizar título e subtítulo
        document.getElementById('page-title').textContent = secao.getAttribute('data-title') || 'Dashboard';
        document.getElementById('page-subtitle').textContent = secao.getAttribute('data-subtitle') || '';
    }
}

// Função para mostrar detalhes dos alunos de uma turma específica
function mostrarDetalhesAlunos(idDisciplina, idTurma) {
    console.log(`Mostrando detalhes dos alunos da turma ${idTurma} na disciplina ${idDisciplina}`);
    
    // Ativar a seção de alunos
    document.querySelectorAll('.conteudo-secao').forEach(secao => {
        secao.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const secaoAlunos = document.getElementById('conteudo-alunos');
    const linkAlunos = document.getElementById('alunos-link');
    
    if (secaoAlunos && linkAlunos) {
        secaoAlunos.classList.add('active');
        linkAlunos.classList.add('active');
        
        // Atualizar título e subtítulo
        document.getElementById('page-title').textContent = "Meus Alunos";
        document.getElementById('page-subtitle').textContent = "Visualize os alunos nas suas turmas e disciplinas";
    }
    
    // Preencher os filtros com os valores correspondentes
    const filtroTurma = document.getElementById('filtro-turma-professor');
    const filtroDisciplina = document.getElementById('filtro-disciplina-professor');
    
    if (filtroTurma) {
        filtroTurma.value = idTurma;
    }
    
    if (filtroDisciplina) {
        filtroDisciplina.value = idDisciplina;
    }
    
    // Acionar o botão de filtrar automaticamente
    const btnFiltrar = document.getElementById('btn-filtrar-alunos-professor');
    if (btnFiltrar) {
        btnFiltrar.click();
    }
} 