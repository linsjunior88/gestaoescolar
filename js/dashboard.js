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

// Variáveis globais para armazenar as instâncias de gráficos
let chartDesempenho = null;
let chartPizza = null;

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
    }
    
    // Atualizar dados específicos com base na seção ativa
    switch(linkId) {
        case 'dashboard-link':
            console.log("Atualizando dashboard");
            initGeral();
            break;
        case 'turmas-link':
            console.log("Atualizando turmas");
            // Verificar se a função está definida no escopo
            if (typeof carregarTurmas === 'function') {
                carregarTurmas();
            } else {
                // Função provavelmente está dentro de initTurmas, então precisamos verificar
                const turmasTableBody = document.getElementById('turmas-lista');
                if (turmasTableBody) {
                    // Neste caso, executamos uma nova consulta
                    console.log("Recarregando turmas...");
                    fetch(CONFIG.getApiUrl('/turmas'))
                        .then(response => response.ok ? response.json() : [])
                        .then(data => {
                            if (!data || data.length === 0) {
                                turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma turma encontrada.</td></tr>';
                                return;
                            }
                            
                            // Atualizar a tabela...
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
            break;
        case 'disciplinas-link':
            console.log("Atualizando disciplinas");
            try {
                // Verificar se o elemento existe
                const disciplinasLista = document.getElementById('disciplinas-lista');
                if (disciplinasLista) {
                    // Mostrar indicador de carregamento
                    disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
                    
                    // Fazer requisição à API
                    fetch(CONFIG.getApiUrl('/disciplinas'))
                        .then(response => response.ok ? response.json() : [])
                        .then(data => {
                            if (!data || data.length === 0) {
                                disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma disciplina encontrada.</td></tr>';
                                return;
                            }
                            
                            // Limpar e preencher a tabela
                            disciplinasLista.innerHTML = '';
                            data.forEach(disciplina => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${disciplina.id_disciplina}</td>
                                    <td>${disciplina.nome_disciplina}</td>
                                    <td>${disciplina.carga_horaria || '-'}</td>
                                    <td>${disciplina.descricao || '-'}</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary edit-disciplina" data-id="${disciplina.id_disciplina}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-disciplina" data-id="${disciplina.id_disciplina}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                disciplinasLista.appendChild(row);
                            });
                        })
                        .catch(error => {
                            console.error("Erro ao carregar disciplinas:", error);
                            disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar disciplinas.</td></tr>';
                        });
                }
            } catch (e) {
                console.error("Erro ao atualizar disciplinas:", e);
            }
            break;
        case 'professores-link':
            console.log("Atualizando professores");
            try {
                // Verificar se o elemento existe
                const professoresLista = document.getElementById('professores-lista');
                if (professoresLista) {
                    // Mostrar indicador de carregamento
                    professoresLista.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
                    
                    // Primeiro, buscar disciplinas para ter informações corretas
                    fetch(CONFIG.getApiUrl('/disciplinas'))
                        .then(response => response.ok ? response.json() : [])
                        .then(disciplinasData => {
                            // Agora buscar professores
                            return fetch(CONFIG.getApiUrl('/professores'))
                                .then(response => response.ok ? response.json() : [])
                                .then(data => {
                                    if (!data || data.length === 0) {
                                        professoresLista.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum professor encontrado.</td></tr>';
                                        return;
                                    }
                                    
                                    // Limpar e preencher a tabela
                                    professoresLista.innerHTML = '';
                                    
                                    // Processar cada professor e suas disciplinas/turmas
                                    const processarProfessores = async () => {
                                        for (const professor of data) {
                                            // Encontrar nomes das disciplinas
                                            let disciplinasNomes = '-';
                                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                                const nomesDisciplinas = professor.disciplinas.map(idDisc => {
                                                    const disc = disciplinasData.find(d => d.id_disciplina === idDisc);
                                                    return disc ? `${disc.id_disciplina} - ${disc.nome_disciplina}` : idDisc;
                                                });
                                                disciplinasNomes = nomesDisciplinas.join('<br>');
                                            }
                                            
                                            // Buscar turmas para cada disciplina
                                            let turmasHTML = '-';
                                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                                const turmasPromises = professor.disciplinas.map(disciplinaId => 
                                                    fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}/turmas`))
                                                        .then(response => response.ok ? response.json() : [])
                                                );
                                                
                                                const turmasResults = await Promise.all(turmasPromises);
                                                
                                                const turmasPorDisciplina = [];
                                                for (let i = 0; i < professor.disciplinas.length; i++) {
                                                    const disciplinaId = professor.disciplinas[i];
                                                    const turmas = turmasResults[i];
                                                    const disciplina = disciplinasData.find(d => d.id_disciplina === disciplinaId);
                                                    const nomeDisciplina = disciplina ? disciplina.id_disciplina : disciplinaId;
                                                    
                                                    if (turmas.length > 0) {
                                                        const turmasTexto = turmas.map(t => 
                                                            `${t.id_turma} (${t.serie || 'Série não informada'})`
                                                        ).join(', ');
                                                        turmasPorDisciplina.push(`<strong>${nomeDisciplina}</strong>: ${turmasTexto}`);
                                                    } else {
                                                        turmasPorDisciplina.push(`<strong>${nomeDisciplina}</strong>: <span class="text-warning">Nenhuma turma</span>`);
                                                    }
                                                }
                                                
                                                if (turmasPorDisciplina.length > 0) {
                                                    turmasHTML = turmasPorDisciplina.join('<br>');
                                                }
                                            }
                                            
                                            // Criar a linha da tabela
                                            const row = document.createElement('tr');
                                            row.innerHTML = `
                                                <td>${professor.id_professor}</td>
                                                <td>${professor.nome_professor}</td>
                                                <td>${professor.email_professor || '-'}</td>
                                                <td>${disciplinasNomes}</td>
                                                <td>${turmasHTML}</td>
                                                <td class="text-center">
                                                    <button class="btn btn-sm btn-outline-primary edit-professor" data-id="${professor.id_professor}">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger delete-professor" data-id="${professor.id_professor}">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            `;
                                            professoresLista.appendChild(row);
                                        }
                                        
                                        // Adicionar eventos aos botões
                                        document.querySelectorAll('.edit-professor').forEach(btn => {
                                            btn.addEventListener('click', function() {
                                                const idProfessor = this.getAttribute('data-id');
                                                if (typeof editarProfessor === 'function') {
                                                    editarProfessor(idProfessor);
                                                } else {
                                                    console.warn("Função editarProfessor não encontrada");
                                                }
                                            });
                                        });
                                        
                                        document.querySelectorAll('.delete-professor').forEach(btn => {
                                            btn.addEventListener('click', function() {
                                                const idProfessor = this.getAttribute('data-id');
                                                if (typeof excluirProfessor === 'function') {
                                                    excluirProfessor(idProfessor);
                                                } else {
                                                    console.warn("Função excluirProfessor não encontrada");
                                                }
                                            });
                                        });
                                    };
                                    
                                    processarProfessores().catch(error => {
                                        console.error("Erro ao processar professores:", error);
                                        professoresLista.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao processar dados dos professores.</td></tr>';
                                    });
                                });
                        })
                        .catch(error => {
                            console.error("Erro ao carregar professores:", error);
                            professoresLista.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar professores.</td></tr>';
                        });
                }
            } catch (e) {
                console.error("Erro ao atualizar professores:", e);
            }
            break;
        case 'alunos-link':
            console.log("Atualizando alunos");
            try {
                // Verificar se o elemento existe
                const alunosLista = document.getElementById('alunos-lista');
                if (alunosLista) {
                    // Mostrar indicador de carregamento
                    alunosLista.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
                    
                    // Fazer requisição à API
                    fetch(CONFIG.getApiUrl('/alunos'))
                        .then(response => response.ok ? response.json() : [])
                        .then(data => {
                            if (!data || data.length === 0) {
                                alunosLista.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum aluno encontrado.</td></tr>';
                                return;
                            }
                            
                            // Limpar e preencher a tabela
                            alunosLista.innerHTML = '';
                            data.forEach(aluno => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${aluno.id_aluno}</td>
                                    <td>${aluno.nome_aluno}</td>
                                    <td>${aluno.turma_id || '-'}</td>
                                    <td>${aluno.data_nascimento || '-'}</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary edit-aluno" data-id="${aluno.id_aluno}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-aluno" data-id="${aluno.id_aluno}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                alunosLista.appendChild(row);
                            });
                        })
                        .catch(error => {
                            console.error("Erro ao carregar alunos:", error);
                            alunosLista.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar alunos.</td></tr>';
                        });
                }
            } catch (e) {
                console.error("Erro ao atualizar alunos:", e);
            }
            break;
        case 'notas-link':
            console.log("Atualizando notas");
            try {
                // Verificar se o elemento existe
                const notasLista = document.getElementById('notas-lista');
                if (notasLista) {
                    // Mostrar indicador de carregamento
                    notasLista.innerHTML = '<tr><td colspan="10" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
                    
                    // Tentar usar a função de carregamento do módulo de notas se disponível
                    // Isso permitirá reutilizar toda a lógica de normalização e exibição
                    if (typeof carregarNotas === 'function') {
                        console.log("Usando função carregarNotas() do módulo");
                        carregarNotas();
                        return;
                    }
                    
                    // Se a função não estiver disponível, continuar com a implementação atual
                    // Precisamos de alunos e disciplinas para mostrar os nomes em vez de apenas IDs
                    Promise.all([
                        fetch(CONFIG.getApiUrl('/alunos')).then(r => r.ok ? r.json() : []),
                        fetch(CONFIG.getApiUrl('/disciplinas')).then(r => r.ok ? r.json() : []),
                        fetch(CONFIG.getApiUrl('/turmas')).then(r => r.ok ? r.json() : []),
                        fetch(CONFIG.getApiUrl('/notas')).then(r => r.ok ? r.json() : [])
                    ])
                    .then(([alunos, disciplinas, turmas, notas]) => {
                        console.log("Dados carregados para notas:", {
                            alunos: alunos.length,
                            disciplinas: disciplinas.length,
                            turmas: turmas.length,
                            notas: notas ? notas.length || "objeto não iterável" : "sem dados"
                        });
                        
                        // Verificar estrutura dos dados de notas
                        if (!notas || notas.length === 0) {
                            notasLista.innerHTML = '<tr><td colspan="10" class="text-center">Nenhuma nota encontrada.</td></tr>';
                            return;
                        }

                        // Tentar obter dados de notas de diferentes formatos possíveis
                        let notasData = notas;
                        if (typeof notas === 'object' && !Array.isArray(notas)) {
                            // Se for um objeto, pode ser que as notas estejam em uma propriedade
                            if (notas.notas && Array.isArray(notas.notas)) {
                                notasData = notas.notas;
                            } else {
                                // Tenta converter o objeto em array
                                const possibleArray = Object.values(notas);
                                if (possibleArray.length > 0 && typeof possibleArray[0] === 'object') {
                                    notasData = possibleArray;
                                }
                            }
                        }
                        
                        // Verificar se conseguimos obter um array de notas
                        if (!Array.isArray(notasData) || notasData.length === 0) {
                            console.warn("Formato de dados de notas não reconhecido:", notas);
                            notasLista.innerHTML = '<tr><td colspan="10" class="text-center">Formato de dados de notas não reconhecido.</td></tr>';
                            return;
                        }
                        
                        // Limpar e preencher a tabela
                        notasLista.innerHTML = '';
                        
                        // Função para encontrar nome do aluno pelo ID
                        const getNomeAluno = (id) => {
                            const aluno = alunos.find(a => a.id_aluno === id);
                            return aluno ? aluno.nome_aluno : `Aluno ${id}`;
                        };
                        
                        // Função para encontrar nome da disciplina pelo ID
                        const getNomeDisciplina = (id) => {
                            const disciplina = disciplinas.find(d => d.id_disciplina === id);
                            return disciplina ? disciplina.nome_disciplina : `Disciplina ${id}`;
                        };
                        
                        // Função para encontrar turma pelo ID
                        const getTurma = (id) => {
                            const turma = turmas.find(t => t.id_turma === id);
                            return turma ? `${turma.id_turma} - ${turma.serie || 'Série não informada'}` : `Turma ${id}`;
                        };
                        
                        // Função para extrair o ano da série
                        const getAno = (turmaId, notaObj) => {
                            // Priorizar o campo ano diretamente da nota, se disponível
                            if (notaObj && notaObj.ano) {
                                return notaObj.ano;
                            }
                            
                            const turma = turmas.find(t => t.id_turma === turmaId);
                            if (turma && turma.serie) {
                                const match = turma.serie.match(/^(\d+)º/);
                                return match ? match[1] : '-';
                            }
                            return '-';
                        };
                        
                        // Ordenar notas por aluno e bimestre
                        notasData.sort((a, b) => {
                            const alunoA = alunos.find(al => al.id_aluno === (a.id_aluno || a.aluno_id));
                            const alunoB = alunos.find(al => al.id_aluno === (b.id_aluno || b.aluno_id));
                            
                            if (alunoA && alunoB) {
                                if (alunoA.nome_aluno !== alunoB.nome_aluno) {
                                    return alunoA.nome_aluno.localeCompare(alunoB.nome_aluno);
                                }
                                // Se for o mesmo aluno, ordenar por bimestre
                                const bimestreA = parseInt(a.bimestre || 0);
                                const bimestreB = parseInt(b.bimestre || 0);
                                return bimestreA - bimestreB;
                            }
                            return 0;
                        });
                        
                        notasData.forEach(nota => {
                            // Verificar se é um objeto válido
                            if (!nota || typeof nota !== 'object') {
                                console.warn("Nota inválida:", nota);
                                return;
                            }
                            
                            const alunoId = nota.id_aluno || nota.aluno_id;
                            const disciplinaId = nota.id_disciplina || nota.disciplina_id;
                            const turmaId = nota.id_turma || nota.turma_id;
                            const notaId = nota.id || nota.nota_id || `${alunoId}-${disciplinaId}-${nota.bimestre}`;
                            
                            const nomeAluno = getNomeAluno(alunoId);
                            const nomeDisciplina = getNomeDisciplina(disciplinaId);
                            const turmaInfo = getTurma(turmaId);
                            const ano = getAno(turmaId, nota);
                            
                            // Extrair valores específicos ou usar valores padrão
                            const bimestre = nota.bimestre || '-';
                            const notaMensal = nota.nota_mensal || nota.mensal || '-';
                            const notaBimestral = nota.nota_bimestral || nota.bimestral || '-';
                            const recuperacao = nota.recuperacao || '-';
                            
                            // Calcular média ou usar a média já fornecida
                            let media;
                            if (nota.media) {
                                media = nota.media;
                            } else if (notaMensal !== '-' && notaBimestral !== '-') {
                                // Calcular média ponderada (40% mensal + 60% bimestral)
                                const nMensal = parseFloat(notaMensal);
                                const nBimestral = parseFloat(notaBimestral);
                                if (!isNaN(nMensal) && !isNaN(nBimestral)) {
                                    media = ((nMensal * 0.4) + (nBimestral * 0.6)).toFixed(1);
                                } else {
                                    media = '-';
                                }
                            } else {
                                media = nota.valor || '-';
                            }
                            
                            const tr = document.createElement('tr');
                            
                            // Adicionar classes para colorir baseado na média
                            if (media !== '-') {
                                const mediaNum = parseFloat(media);
                                if (!isNaN(mediaNum)) {
                                    if (mediaNum >= 6.0) {
                                        tr.classList.add('table-success');
                                    } else if (mediaNum >= 4.0) {
                                        tr.classList.add('table-warning');
                                    } else {
                                        tr.classList.add('table-danger');
                                    }
                                }
                            }
                            
                            tr.innerHTML = `
                                <td>${ano}</td>
                                <td>${bimestre}</td>
                                <td>${turmaInfo}</td>
                                <td>${nomeDisciplina}</td>
                                <td>${nomeAluno}</td>
                                <td>${notaMensal}</td>
                                <td>${notaBimestral}</td>
                                <td>${recuperacao}</td>
                                <td>${media}</td>
                                <td class="text-center">
                                    <button class="btn btn-sm btn-outline-primary edit-nota" data-id="${notaId}" 
                                        data-aluno="${alunoId}" data-disciplina="${disciplinaId}" data-bimestre="${bimestre}" data-turma="${turmaId}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger delete-nota" data-id="${notaId}"
                                        data-aluno="${alunoId}" data-disciplina="${disciplinaId}" data-bimestre="${bimestre}" data-turma="${turmaId}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            `;
                            
                            notasLista.appendChild(tr);
                        });
                        
                        // Adicionar eventos para botões
                        document.querySelectorAll('.edit-nota').forEach(btn => {
                            btn.addEventListener('click', function() {
                                const idNota = this.getAttribute('data-id');
                                const idAluno = this.getAttribute('data-aluno');
                                const idDisciplina = this.getAttribute('data-disciplina');
                                const bimestre = this.getAttribute('data-bimestre');
                                const idTurma = this.getAttribute('data-turma');
                                
                                if (typeof editarNota === 'function') {
                                    editarNota(idNota, idAluno, idDisciplina, bimestre, idTurma);
                                } else {
                                    console.warn("Função editarNota não encontrada");
                                }
                            });
                        });
                        
                        document.querySelectorAll('.delete-nota').forEach(btn => {
                            btn.addEventListener('click', function() {
                                const idNota = this.getAttribute('data-id');
                                const idAluno = this.getAttribute('data-aluno');
                                const idDisciplina = this.getAttribute('data-disciplina');
                                const bimestre = this.getAttribute('data-bimestre');
                                const idTurma = this.getAttribute('data-turma');
                                
                                if (typeof excluirNota === 'function') {
                                    excluirNota(idNota, idAluno, idDisciplina, bimestre, idTurma);
                                } else {
                                    console.warn("Função excluirNota não encontrada");
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error("Erro ao carregar notas:", error);
                        notasLista.innerHTML = '<tr><td colspan="10" class="text-center text-danger">Erro ao carregar notas: ' + error.message + '</td></tr>';
                    });
                }
            } catch (e) {
                console.error("Erro ao atualizar notas:", e);
            }
            break;
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
    initGeral(); // Inicializar o dashboard geral com os cards dinâmicos
    
    // Inicializar módulos de gestão
    initTurmas();
    initDisciplinas();
    initProfessores();
    initAlunos();
    initNotas();
    
    // Ativar a seção do dashboard por padrão
    if (links && links['dashboard-link']) {
        ativarSecao('dashboard-link');
    }
    
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
    
    // Exportar funções para o escopo global somente depois de estarem todas carregadas
    document.addEventListener('DOMContentLoaded', function() {
        // Verificar se todas as funções necessárias existem antes de exportá-las
        setTimeout(function() {
            console.log("Exportando funções para o escopo global");
            
            // Funções de edição
            if (typeof editarTurma === 'function') window.editarTurma = editarTurma;
            if (typeof excluirTurma === 'function') window.excluirTurma = excluirTurma;
            if (typeof editarDisciplina === 'function') window.editarDisciplina = editarDisciplina;
            if (typeof excluirDisciplina === 'function') window.excluirDisciplina = excluirDisciplina;
            if (typeof editarProfessor === 'function') window.editarProfessor = editarProfessor;
            if (typeof excluirProfessor === 'function') window.excluirProfessor = excluirProfessor;
            if (typeof editarAluno === 'function') window.editarAluno = editarAluno;
            if (typeof excluirAluno === 'function') window.excluirAluno = excluirAluno;
            if (typeof editarNota === 'function') window.editarNota = editarNota;
            if (typeof excluirNota === 'function') window.excluirNota = excluirNota;
            
            // Funções auxiliares
            if (typeof carregarTurmas === 'function') window.carregarTurmas = carregarTurmas;
            if (typeof carregarDisciplinas === 'function') window.carregarDisciplinas = carregarDisciplinas;
            if (typeof carregarProfessores === 'function') window.carregarProfessores = carregarProfessores;
            if (typeof carregarAlunos === 'function') window.carregarAlunos = carregarAlunos;
            if (typeof carregarNotas === 'function') window.carregarNotas = carregarNotas;
        }, 1000); // Aguardar 1 segundo para garantir que todas as funções já foram definidas
    });
});

// Função para inicializar os gráficos
function initCharts() {
    console.log("Inicializando gráficos do dashboard");
    
    // Destruir gráficos existentes para evitar erro de "Canvas is already in use"
    if (chartDesempenho) {
        chartDesempenho.destroy();
        chartDesempenho = null;
    }
    
    if (chartPizza) {
        chartPizza.destroy();
        chartPizza = null;
    }
    
    // Gráfico de barras - Desempenho por Turma
    const ctxBar = document.getElementById('graficoDesempenho');
    if (ctxBar) {
        chartDesempenho = new Chart(ctxBar, {
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
        chartPizza = new Chart(ctxPie, {
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

// Inicialização geral do dashboard
function initGeral() {
    console.log("Inicializando dashboard geral");
    
    // Atualizar os cards do dashboard
    atualizarCardsDashboard();
    
    // Inicializar ou atualizar os gráficos
    initCharts();
}

// Função para atualizar os cards do dashboard com dados reais
function atualizarCardsDashboard() {
    console.log("Atualizando cards do dashboard");
    
    // Elementos dos cards
    const cardAlunos = document.querySelector('.col-xl-3:nth-child(1) .h5');
    const cardProfessores = document.querySelector('.col-xl-3:nth-child(2) .h5');
    const cardTurmas = document.querySelector('.col-xl-3:nth-child(3) .h5');
    const cardDisciplinas = document.querySelector('.col-xl-3:nth-child(4) .h5');
    
    if (!cardAlunos || !cardProfessores || !cardTurmas || !cardDisciplinas) {
        console.warn("Elementos dos cards não encontrados");
        return;
    }
    
    // Mostrar indicadores de carregamento
    cardAlunos.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Carregando...</span></div>';
    cardProfessores.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Carregando...</span></div>';
    cardTurmas.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Carregando...</span></div>';
    cardDisciplinas.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Carregando...</span></div>';
    
    // Função para obter dados do localStorage caso a API falhe
    const getLocalData = (key) => {
        try {
            return JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            console.error(`Erro ao ler ${key} do localStorage:`, e);
            return [];
        }
    };
    
    // Buscar dados da API com fallback para localStorage
    Promise.all([
        fetch(CONFIG.getApiUrl('/alunos'))
            .then(r => r.ok ? r.json() : Promise.reject('Falha na requisição de alunos'))
            .catch(err => {
                console.warn('Usando localStorage para alunos:', err);
                return getLocalData('alunos');
            }),
        fetch(CONFIG.getApiUrl('/professores'))
            .then(r => r.ok ? r.json() : Promise.reject('Falha na requisição de professores'))
            .catch(err => {
                console.warn('Usando localStorage para professores:', err);
                return getLocalData('professores');
            }),
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(r => r.ok ? r.json() : Promise.reject('Falha na requisição de turmas'))
            .catch(err => {
                console.warn('Usando localStorage para turmas:', err);
                return getLocalData('turmas');
            }),
        fetch(CONFIG.getApiUrl('/disciplinas'))
            .then(r => r.ok ? r.json() : Promise.reject('Falha na requisição de disciplinas'))
            .catch(err => {
                console.warn('Usando localStorage para disciplinas:', err);
                return getLocalData('disciplinas');
            })
    ])
    .then(([alunos, professores, turmas, disciplinas]) => {
        console.log("Dados carregados para dashboard:", {
            alunos: alunos.length,
            professores: professores.length,
            turmas: turmas.length,
            disciplinas: disciplinas.length
        });
        
        // Atualizar os cards com os valores reais
        cardAlunos.textContent = alunos.length || '0';
        cardProfessores.textContent = professores.length || '0';
        cardTurmas.textContent = turmas.length || '0';
        cardDisciplinas.textContent = disciplinas.length || '0';
    })
    .catch(error => {
        console.error("Erro ao carregar dados para dashboard:", error);
        
        // Em caso de erro, tentar mostrar dados do localStorage
        try {
            const localAlunos = getLocalData('alunos');
            const localProfessores = getLocalData('professores');
            const localTurmas = getLocalData('turmas');
            const localDisciplinas = getLocalData('disciplinas');
            
            cardAlunos.textContent = localAlunos.length || '0';
            cardProfessores.textContent = localProfessores.length || '0';
            cardTurmas.textContent = localTurmas.length || '0';
            cardDisciplinas.textContent = localDisciplinas.length || '0';
        } catch (e) {
            // Se tudo falhar, mostrar traços
            cardAlunos.textContent = '-';
            cardProfessores.textContent = '-';
            cardTurmas.textContent = '-';
            cardDisciplinas.textContent = '-';
        }
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
    
    // Mostrar o botão de cancelar sempre
    if (btnCancelarTurma) {
        btnCancelarTurma.style.display = 'inline-block';
    }
    
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
                editarTurma(turma.id_turma, turma);
            }
        });
    }
    
    // Função para carregar turmas
    function carregarTurmas() {
        console.log("Carregando turmas...");
        
        // Obter o elemento da tabela de turmas
        const turmasTableBody = document.getElementById('turmas-lista');
        
        if (!turmasTableBody) {
            console.error("Elemento turmas-lista não encontrado!");
            return;
        }
        
        // Mostrar indicador de carregamento
        turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
        
        // Fazer requisição à API
        fetch(CONFIG.getApiUrl('/turmas/'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar turmas: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!data || data.length === 0) {
                    turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma turma encontrada.</td></tr>';
                    return;
                }
                
                // Limpar a tabela
                turmasTableBody.innerHTML = '';
                
                // Adicionar cada turma à tabela
                data.forEach(turma => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${turma.id_turma}</td>
                        <td>${turma.serie || '-'}</td>
                        <td>${turma.turno ? turno2texto(turma.turno) : '-'}</td>
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
                
                // Adicionar event listeners para os botões de editar
                document.querySelectorAll('.edit-turma').forEach(button => {
                    button.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        buscarTurmaParaEditar(id);
                    });
                });
                
                // Adicionar event listeners para os botões de deletar
                document.querySelectorAll('.delete-turma').forEach(button => {
                    button.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        excluirTurma(id);
                    });
                });
            })
            .catch(error => {
                console.error('Erro ao carregar turmas:', error);
                turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar turmas. Por favor, tente novamente.</td></tr>';
            });
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
    
    // Função para criar uma nova turma
    function criarTurma(turma) {
        console.log("Criando nova turma:", turma);
        
        // Fazer requisição à API
        fetch(CONFIG.getApiUrl('/turmas/'), {
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
            console.log('Turma criada com sucesso:', data);
            alert('Turma criada com sucesso!');
            
            // Limpar formulário e recarregar lista
            resetarFormularioTurma();
            carregarTurmas();
        })
        .catch(error => {
            console.error('Erro ao criar turma:', error);
            alert('Erro ao criar turma: ' + error.message);
        });
    }
    
    // Função para editar uma turma
    function editarTurma(turmaId, dadosTurma) {
        console.log("Editando turma ID:", turmaId);
        
        // Buscar os dados da turma
        fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosTurma)
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
            if (antigoId !== dadosTurma.id_turma) {
                atualizarReferenciasAposMudancaIdTurma(antigoId, dadosTurma.id_turma);
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
    
    // Função para excluir uma turma
    function excluirTurma(turmaId) {
        console.log("Excluindo turma ID:", turmaId);
        
        if (confirm(`Tem certeza que deseja excluir a turma com ID ${turmaId}?`)) {
            // Buscar informações da turma para verificar se tem alunos
            fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`))
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao buscar turma: ${response.status}`);
                    }
                    return response.json();
                })
                .then(turma => {
                    // Verificar se a turma tem alunos antes de excluir (só um exemplo)
                    if (turma.alunos && turma.alunos.length > 0) {
                        // Se tiver alunos, confirmar novamente
                        if (!confirm(`Atenção: Esta turma possui ${turma.alunos.length} alunos. A exclusão irá remover todos os vínculos. Deseja continuar?`)) {
                            return Promise.reject(new Error('Operação cancelada pelo usuário'));
                        }
                    }
                    
                    // Prosseguir com a exclusão
                    return fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`), {
                        method: 'DELETE'
                    });
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao excluir turma: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    alert('Turma excluída com sucesso!');
                    // Recarregar a lista após exclusão bem-sucedida
                    carregarTurmas();
                })
                .catch(error => {
                    // Não exibir erro se foi o usuário que cancelou
                    if (error.message !== 'Operação cancelada pelo usuário') {
                        console.error("Erro ao excluir turma:", error);
                        alert(`Erro ao excluir turma: ${error.message}`);
                    }
                });
        }
    }
    
    // Função para resetar o formulário
    function resetarFormularioTurma() {
        if (!formTurma) return;
        
        formTurma.reset();
        formModo.value = 'novo';
        turmaIndex.value = '';
        document.getElementById('form-turma-titulo').textContent = 'Nova Turma';
        
        // Não escondemos mais o botão de cancelar para que ele esteja sempre disponível
        // btnCancelarTurma.style.display = 'none';
        
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
    
    // Função para buscar turma para edição
    function buscarTurmaParaEditar(turmaId) {
        console.log("Buscando turma ID:", turmaId);
        
        // Buscar os dados da turma
        fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar turma: ${response.status}`);
                }
                return response.json();
            })
            .then(turma => {
                // Verificar se temos formulário para edição
                const formTurma = document.getElementById('form-turma');
                if (!formTurma) {
                    console.error("Formulário de turma não encontrado!");
                    return;
                }
                
                // Preencher campos do formulário
                if (document.getElementById('id_turma_input')) {
                    document.getElementById('id_turma_input').value = turma.id_turma || '';
                    document.getElementById('id_turma_input').readOnly = true; // Não permitir alterar ID
                }
                if (document.getElementById('serie')) {
                    document.getElementById('serie').value = turma.serie || '';
                }
                if (document.getElementById('turno')) {
                    document.getElementById('turno').value = turma.turno || '';
                }
                if (document.getElementById('tipo_turma')) {
                    document.getElementById('tipo_turma').value = turma.tipo_turma || 'Regular';
                }
                if (document.getElementById('coordenador')) {
                    document.getElementById('coordenador').value = turma.coordenador || '';
                }
                
                // Setar o modo do formulário para edição
                if (document.getElementById('form-modo')) {
                    document.getElementById('form-modo').value = 'editar';
                }
                if (document.getElementById('turma-index')) {
                    document.getElementById('turma-index').value = turma.id_turma;
                }
                
                // Atualizar título do formulário
                const formTitulo = document.getElementById('form-turma-titulo');
                if (formTitulo) {
                    formTitulo.textContent = 'Editar Turma';
                }
                
                // Mostrar botão de cancelar
                const btnCancelar = document.getElementById('btn-cancelar-turma');
                if (btnCancelar) {
                    btnCancelar.style.display = 'inline-block';
                }
                
                // Rolar até o formulário
                formTurma.scrollIntoView({behavior: 'smooth'});
            })
            .catch(error => {
                console.error("Erro ao buscar turma:", error);
                alert(`Erro ao buscar dados da turma: ${error.message}`);
            });
    }
}

// Inicialização do módulo de disciplinas
function initDisciplinas() {
    console.log("Inicializando módulo de disciplinas");
    
    // Obter elementos do DOM
    const formDisciplina = document.getElementById('formDisciplina');
    const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    const disciplinasLista = document.getElementById('disciplinas-lista');
    const turmasDisciplinaSelect = document.getElementById('turmasDisciplina');
    const turmasVinculadasArea = document.getElementById('turmas-vinculadas-preview');
    
    console.log("Elementos do módulo de disciplinas:", {
        formDisciplina,
        btnNovaDisciplina,
        disciplinasLista,
        turmasDisciplinaSelect,
        turmasVinculadasArea
    });
    
    if (!formDisciplina || !btnNovaDisciplina || !disciplinasLista) {
        console.warn("Elementos essenciais do módulo de disciplinas não encontrados");
        return;
    }
    
    // Adicionar event listener ao botão para nova disciplina
    btnNovaDisciplina.addEventListener('click', function() {
        // Limpar e redefinir o formulário para nova entrada
        resetarFormularioDisciplina();
        
        // Chamar a função para configurar o formulário para nova disciplina
        abrirModalEditarDisciplina(); // Sem ID = nova disciplina
        
        // Rolar até o formulário
        formDisciplina.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Adicionar event listener ao formulário
    formDisciplina.addEventListener('submit', salvarDisciplina);
    
    // Adicionar event listener ao select de turmas para atualizar o preview
    if (turmasDisciplinaSelect) {
        turmasDisciplinaSelect.addEventListener('change', function() {
            console.log("Seleção de turmas alterada, atualizando preview");
            if (typeof atualizarPreviewTurmasVinculadas === 'function') {
                atualizarPreviewTurmasVinculadas();
            }
        });
    }
    
    // Carregar turmas disponíveis no select ao inicializar
    if (turmasDisciplinaSelect) {
        console.log("Carregando turmas para o select no carregamento inicial");
        carregarTurmasSelect([]);
    }
    
    // Carregar lista de disciplinas
    carregarDisciplinas();
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
                fetch(CONFIG.getApiUrl(`/professores/${idProfessor}`), {
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
                    return fetch(CONFIG.getApiUrl(`/professores/${idProfessor}/disciplinas`), {
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
                            return fetch(CONFIG.getApiUrl('/professores/vinculos'), {
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
                fetch(CONFIG.getApiUrl('/professores'), {
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
                        return fetch(CONFIG.getApiUrl('/professores/vinculos'), {
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
        console.log("Carregando professores");
        
        if (!professoresLista) {
            console.error("Lista de professores não encontrada!");
            return;
        }
        
        // Mostrar indicador de carregamento
        professoresLista.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Primeiro, buscar disciplinas para ter informações corretas
        fetch(CONFIG.getApiUrl('/disciplinas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar disciplinas: ${response.statusText}`);
                }
                return response.json();
            })
            .then(disciplinasData => {
                // Agora buscar professores
                return fetch(CONFIG.getApiUrl('/professores'))
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao carregar professores: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(professores => {
                        console.log("Professores carregados da API:", professores.length);
                        
                        if (professores.length === 0) {
                            professoresLista.innerHTML = `
                                <tr class="text-center">
                                    <td colspan="5">Nenhum professor cadastrado</td>
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
                                    const disc = disciplinasData.find(d => d.id_disciplina === idDisc);
                                    return disc ? `${disc.id_disciplina} - ${disc.nome_disciplina}` : idDisc;
                                });
                                disciplinasNomes = nomesDisciplinas.join('<br>');
                            }
                            
                            // Para cada professor com disciplinas, buscar as turmas associadas
                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                // Criar um array de promessas para buscar as turmas de cada disciplina
                                const turmasPromessas = professor.disciplinas.map(disciplinaId => {
                                    return fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}/turmas`))
                                        .then(response => response.ok ? response.json() : [])
                                        .then(turmas => {
                                            // Retornar a lista de turmas para esta disciplina
                                            return {
                                                disciplinaId: disciplinaId,
                                                turmas: turmas
                                            };
                                        });
                                });
                                
                                // Awaitar todas as promessas de turmas
                                return Promise.all(turmasPromessas)
                                    .then(resultadosTurmas => {
                                        // Construir a coluna de turmas
                                        let turmasHTML = '-';
                                        if (resultadosTurmas.length > 0) {
                                            const turmasPorDisciplina = resultadosTurmas.map(resultado => {
                                                const disciplina = disciplinasData.find(d => d.id_disciplina === resultado.disciplinaId);
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
                                                <button class="btn btn-sm btn-outline-primary edit-professor" data-id="${professor.id_professor}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger delete-professor" data-id="${professor.id_professor}">
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
                                // Criar linha para professor sem disciplinas
                                const tr = document.createElement('tr');
                                tr.dataset.professor = professor.id_professor;
                                tr.classList.add('professor-row');
                                tr.style.cursor = 'pointer';
                                
                                tr.innerHTML = `
                                    <td>${professor.id_professor}</td>
                                    <td>${professor.nome_professor}</td>
                                    <td>${professor.email_professor || '-'}</td>
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
                                
                                tr.addEventListener('click', function(e) {
                                    if (e.target.closest('button')) return;
                                    document.querySelectorAll('.professor-row').forEach(row => {
                                        row.classList.remove('table-primary');
                                    });
                                    this.classList.add('table-primary');
                                    const professorId = this.dataset.professor;
                                    mostrarVinculosProfessor(professorId);
                                });
                                
                                return Promise.resolve(tr);
                            }
                        });
                        
                        // Quando todas as linhas forem processadas, adicionar à tabela
                        Promise.all(linhasPromessas)
                            .then(linhas => {
                                // Adicionar cada linha à tabela
                                linhas.forEach(linha => {
                                    professoresLista.appendChild(linha);
                                });
                                
                                // Adicionar eventos para os botões
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
                
                // Tentar carregar do localStorage como fallback
                const professores = JSON.parse(localStorage.getItem('professores') || '[]');
                
                if (professores.length === 0) {
                    professoresLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="5">Nenhum professor cadastrado (usando cache local)</td>
                        </tr>
                    `;
                    return;
                }
                
                professoresLista.innerHTML = '';
                
                // Adicionar cada professor do localStorage à lista
                professores.forEach(professor => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${professor.id_professor}</td>
                        <td>${professor.nome_professor}</td>
                        <td>${professor.email_professor || '-'}</td>
                        <td>${professor.disciplinas ? professor.disciplinas.join(', ') : '-'}</td>
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
                
                // Adicionar eventos para os botões
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
        const apiUrl = CONFIG.getApiUrl(`/buscar_vinculos_professor_completo/${professorId}`);
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
        
        // Carregamento paralelo de professores e disciplinas
        Promise.all([
            fetch(CONFIG.getApiUrl('/professores')).then(response => response.ok ? response.json() : []),
            fetch(CONFIG.getApiUrl('/disciplinas')).then(response => response.ok ? response.json() : [])
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
                            const promessaTurmas = fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}/turmas`))
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
        
        // Buscar disciplinas da API
        fetch(CONFIG.getApiUrl('/disciplinas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar disciplinas: ${response.statusText}`);
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
        fetch(CONFIG.getApiUrl('/disciplinas'))
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
                    return fetch(CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}/turmas`))
                        .then(response => response.ok ? response.json() : [])
                        .then(turmas => {
                            console.log(`Turmas vinculadas à disciplina ${disciplina.id_disciplina}:`, turmas);
                            
                            // Se temos turmas, buscar detalhes completos de cada uma
                            if (turmas.length > 0) {
                                // Para cada turma, buscar seus detalhes completos
                                const turmasPromises = turmas.map(turma => {
                                    return fetch(CONFIG.getApiUrl(`/turmas/${turma.id_turma}`))
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
        console.log("Editando professor ID:", idProfessor);
        
        // Buscar os dados do professor
        fetch(CONFIG.getApiUrl(`/professores/${idProfessor}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar professor: ' + response.statusText);
                }
                return response.json();
            })
            .then(professor => {
                // Preencher o formulário com os dados do professor
                const formProfessor = document.getElementById('form-professor');
                const formModoProfessor = document.getElementById('form-modo-professor');
                
                if (formProfessor) {
                    // Preencher campos do formulário
                    if (document.getElementById('id_professor')) {
                        document.getElementById('id_professor').value = professor.id_professor || '';
                        document.getElementById('id_professor').disabled = true; // Não permitir alterar ID
                    }
                    if (document.getElementById('nome_professor')) {
                        document.getElementById('nome_professor').value = professor.nome_professor || '';
                    }
                    if (document.getElementById('email_professor')) {
                        document.getElementById('email_professor').value = professor.email_professor || '';
                    }
                    
                    // Limpar senha - não carregamos a senha por segurança
                    if (document.getElementById('senha_professor')) {
                        document.getElementById('senha_professor').value = '';
                    }
                    
                    // Setar o modo do formulário para edição
                    if (formModoProfessor) {
                        formModoProfessor.value = 'editar';
                    }
                    
                    // Atualizar título do formulário se existir
                    const formTitulo = document.getElementById('form-professor-titulo');
                    if (formTitulo) {
                        formTitulo.textContent = 'Editar Professor';
                    }
                    
                    // Selecionar disciplinas do professor no select
                    const vinculoDisciplinas = document.getElementById('vinculo_disciplinas');
                    if (vinculoDisciplinas && professor.disciplinas) {
                        // Limpar seleções anteriores
                        Array.from(vinculoDisciplinas.options).forEach(option => {
                            option.selected = false;
                        });
                        
                        // Selecionar disciplinas do professor
                        professor.disciplinas.forEach(idDisciplina => {
                            Array.from(vinculoDisciplinas.options).forEach(option => {
                                if (option.value === idDisciplina) {
                                    option.selected = true;
                                }
                            });
                        });
                        
                        // Disparar evento de change para atualizar qualquer UI dependente
                        const event = new Event('change');
                        vinculoDisciplinas.dispatchEvent(event);
                    }
                    
                    // Rolar até o formulário
                    formProfessor.scrollIntoView({behavior: 'smooth'});
                    
                    // Mostrar botão de cancelar caso exista
                    const btnCancelar = document.getElementById('btn-cancelar-professor');
                    if (btnCancelar) {
                        btnCancelar.style.display = 'inline-block';
                    }
                }
            })
            .catch(error => {
                console.error("Erro ao buscar dados do professor:", error);
                alert(`Erro ao buscar dados do professor: ${error.message}`);
            });
    }
    
    // Função para excluir um professor
    function excluirProfessor(idProfessor) {
        console.log("Excluindo professor ID:", idProfessor);
        
        if (confirm(`Tem certeza que deseja excluir o professor com ID ${idProfessor}?`)) {
            // Excluir o professor via API
            fetch(CONFIG.getApiUrl(`/professores/${idProfessor}`), {
                method: 'DELETE',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao excluir professor: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                // Recarregar a lista após exclusão bem-sucedida
                carregarProfessores();
            })
            .catch(error => {
                console.error('Erro ao excluir professor:', error);
                alert('Ocorreu um erro ao excluir o professor. Por favor, tente novamente.');
            });
        }
    }
    
    // Função para remover vínculo entre professor e disciplina
    function removerVinculoProfessorDisciplina(professorId, disciplinaId) {
        console.log(`Removendo vínculo: Professor ${professorId} - Disciplina ${disciplinaId}`);
        
        if (confirm(`Deseja remover o vínculo entre o professor e a disciplina ${disciplinaId}?`)) {
            // Remover vínculo via API
            fetch(CONFIG.getApiUrl(`/professores/${professorId}/disciplinas/${disciplinaId}`), {
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
                fetch(CONFIG.getApiUrl('/alunos'), {
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
                fetch(CONFIG.getApiUrl(`/alunos/${aluno.id_aluno}`), {
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
        fetch(CONFIG.getApiUrl('/turmas'))
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
        fetch(CONFIG.getApiUrl('/alunos'))
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
                
                // Ordenar alunos por ID
                alunos.sort((a, b) => {
                    // Converte para número se for string numérica
                    const idA = typeof a.id_aluno === 'string' ? parseInt(a.id_aluno) : a.id_aluno;
                    const idB = typeof b.id_aluno === 'string' ? parseInt(b.id_aluno) : b.id_aluno;
                    return idA - idB;
                });
                
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
        fetch(CONFIG.getApiUrl(`/alunos/${alunoId}`))
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
        
        // Confirmar exclusão
        Swal.fire({
            title: 'Confirmar exclusão',
            text: "Esta ação não pode ser desfeita.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Excluir aluno na API
                fetch(CONFIG.getApiUrl(`/alunos/${alunoId}`), {
                    method: 'DELETE'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ao excluir aluno: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    alert('Aluno excluído com sucesso!');
                    carregarAlunos();
                })
                .catch(error => {
                    console.error("Erro ao excluir aluno:", error);
                    alert(`Erro ao excluir aluno: ${error.message}`);
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
    const tabelaNotas = document.getElementById('tabelaNotas');
    const formNota = document.getElementById('formNota');
    const selectTurmaNota = document.getElementById('turma_nota');
    const selectDisciplinaNota = document.getElementById('disciplina_nota');
    const selectAlunoNota = document.getElementById('aluno_nota');
    const inputValorNota = document.getElementById('valor_nota');
    const inputDescricaoNota = document.getElementById('descricao_nota');
    const formModoNota = document.getElementById('form_modo_nota');
    const formNotaTitulo = document.getElementById('formNotaTitulo');
    const btnCancelarNota = document.getElementById('btn_cancelar_nota');
    const notasTableBody = document.getElementById('notas-lista');
    
    // Verificação menos restritiva - permite inicialização parcial
    const isFormDisponivel = formNota && selectTurmaNota && selectDisciplinaNota && selectAlunoNota;
    const isListaDisponivel = notasTableBody || tabelaNotas;
    
    if (!isListaDisponivel && !isFormDisponivel) {
        console.log("Módulo de notas não inicializado completamente (alguns elementos não encontrados)");
        // Continuamos a inicialização mesmo com elementos faltando
    } else {
        console.log("Módulo de notas inicializado com sucesso");
    }
    
    // Se o formulário estiver disponível, inicializar componentes relacionados
    if (isFormDisponivel) {
        // Carregar turmas no select
        carregarTurmasNotas();
        
        // Adicionar eventos para formulários e botões
        formNota.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarNota();
        });
    }
    
    // Se a tabela estiver disponível (seja na visualização completa ou na seção dinâmica)
    if (isListaDisponivel) {
        // Carregar notas na tabela
        carregarNotas();
    }
    
    // Carregar turmas no select
    function carregarTurmasNotas() {
        if (selectTurmaNota) {
            fetch(CONFIG.getApiUrl('/turmas'))
                .then(response => response.ok ? response.json() : [])
                .then(turmas => {
                    selectTurmaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma</option>';
                    turmas.forEach(turma => {
                        const option = document.createElement('option');
                        option.value = turma.id_turma;
                        option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem nome'}`;
                        selectTurmaNota.appendChild(option);
                    });
                })
                .catch(error => {
                    console.error("Erro ao carregar turmas para notas:", error);
                    selectTurmaNota.innerHTML = '<option value="" disabled>Erro ao carregar turmas</option>';
                });
        }
    }
    
    // Carregar todas as notas
    function carregarNotas() {
        // Verificar novamente qual tabela está disponível (pode ter mudado se o usuário navegou)
        const tabelaAtual = document.getElementById('notas-lista') || document.querySelector('.notas-table tbody');
        
        if (!tabelaAtual) {
            console.error("Tabela de notas não encontrada!");
            return;
        }
        
        // Mostrar indicador de carregamento
        tabelaAtual.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Buscar notas da API
        fetch(CONFIG.getApiUrl('/notas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar notas: ${response.status}`);
                }
                return response.json();
            })
            .then(notas => {
                console.log("Notas recuperadas da API:", notas ? (Array.isArray(notas) ? notas.length : "objeto") : "nenhuma");
                
                // Normalizar notas para garantir que seja um array
                let notasArray = [];
                if (Array.isArray(notas)) {
                    notasArray = notas;
                } else if (notas && typeof notas === 'object') {
                    // Tentar extrair notas de diferentes estruturas possíveis
                    if (notas.notas && Array.isArray(notas.notas)) {
                        notasArray = notas.notas;
                    } else {
                        notasArray = Object.values(notas).filter(item => item && typeof item === 'object');
                    }
                }
                
                if (notasArray.length === 0) {
                    tabelaAtual.innerHTML = `
                        <tr class="text-center">
                            <td colspan="10">Nenhuma nota cadastrada</td>
                        </tr>
                    `;
                    return;
                }
                
                // Obter informações adicionais necessárias (alunos, disciplinas, turmas)
                Promise.all([
                    fetch(CONFIG.getApiUrl('/alunos')).then(r => r.ok ? r.json() : []),
                    fetch(CONFIG.getApiUrl('/disciplinas')).then(r => r.ok ? r.json() : []),
                    fetch(CONFIG.getApiUrl('/turmas')).then(r => r.ok ? r.json() : [])
                ])
                .then(([alunos, disciplinas, turmas]) => {
                    // Limpar a tabela
                    tabelaAtual.innerHTML = '';
                    
                    // Ordenar notas por ID do aluno e bimestre
                    notasArray.sort((a, b) => {
                        const alunoA = alunos.find(al => al.id_aluno === (a.id_aluno || a.aluno_id));
                        const alunoB = alunos.find(al => al.id_aluno === (b.id_aluno || b.aluno_id));
                        
                        if (alunoA && alunoB) {
                            if (alunoA.nome_aluno !== alunoB.nome_aluno) {
                                return alunoA.nome_aluno.localeCompare(alunoB.nome_aluno);
                            }
                            // Se for o mesmo aluno, ordenar por bimestre
                            const bimestreA = parseInt(a.bimestre || 0);
                            const bimestreB = parseInt(b.bimestre || 0);
                            return bimestreA - bimestreB;
                        }
                        return 0;
                    });
                    
                    // Adicionar cada nota à tabela
                    notasArray.forEach(nota => {
                        // Normalizar IDs para lidar com diferentes estruturas possíveis
                        const alunoId = nota.id_aluno || nota.aluno_id;
                        const disciplinaId = nota.id_disciplina || nota.disciplina_id;
                        const turmaId = nota.id_turma || nota.turma_id;
                        const notaId = nota.id_nota || nota.id || `${alunoId}-${disciplinaId}-${nota.bimestre}`;
                        
                        const aluno = alunos.find(a => a.id_aluno === alunoId) || { nome_aluno: `Aluno ${alunoId}` };
                        const disciplina = disciplinas.find(d => d.id_disciplina === disciplinaId) || { nome_disciplina: `Disciplina ${disciplinaId}` };
                        const turma = turmas.find(t => t.id_turma === turmaId) || { id_turma: turmaId || '-', serie: 'Desconhecida' };
                        
                        // Usar o campo ano diretamente da nota, se disponível
                        const ano = nota.ano || (turma.serie ? turma.serie.split('º')[0] : '-');
                        
                        // Extrair valores específicos ou usar valores padrão
                        const bimestre = nota.bimestre || '-';
                        const notaMensal = nota.nota_mensal || nota.mensal || '-';
                        const notaBimestral = nota.nota_bimestral || nota.bimestral || '-';
                        const recuperacao = nota.recuperacao || '-';
                        
                        // Calcular média ou usar a média já fornecida
                        let media;
                        if (nota.media) {
                            media = nota.media;
                        } else if (notaMensal !== '-' && notaBimestral !== '-') {
                            // Calcular média ponderada (40% mensal + 60% bimestral)
                            const nMensal = parseFloat(notaMensal);
                            const nBimestral = parseFloat(notaBimestral);
                            if (!isNaN(nMensal) && !isNaN(nBimestral)) {
                                media = ((nMensal * 0.4) + (nBimestral * 0.6)).toFixed(1);
                            } else {
                                media = '-';
                            }
                        } else {
                            media = nota.valor || '-';
                        }
                        
                        const tr = document.createElement('tr');
                        
                        // Adicionar classes para colorir baseado na média
                        if (media !== '-') {
                            const mediaNum = parseFloat(media);
                            if (!isNaN(mediaNum)) {
                                if (mediaNum >= 6.0) {
                                    tr.classList.add('table-success');
                                } else if (mediaNum >= 4.0) {
                                    tr.classList.add('table-warning');
                                } else {
                                    tr.classList.add('table-danger');
                                }
                            }
                        }
                        
                        tr.innerHTML = `
                            <td>${ano}</td>
                            <td>${bimestre}</td>
                            <td>${turma.id_turma} - ${turma.serie || 'Série não informada'}</td>
                            <td>${disciplina.nome_disciplina}</td>
                            <td>${aluno.nome_aluno}</td>
                            <td>${notaMensal}</td>
                            <td>${notaBimestral}</td>
                            <td>${recuperacao}</td>
                            <td>${media}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-primary edit-nota" data-id="${notaId}" 
                                    data-aluno="${alunoId}" data-disciplina="${disciplinaId}" data-bimestre="${bimestre}" data-turma="${turmaId}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-nota" data-id="${notaId}"
                                    data-aluno="${alunoId}" data-disciplina="${disciplinaId}" data-bimestre="${bimestre}" data-turma="${turmaId}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                        
                        tabelaAtual.appendChild(tr);
                    });
                    
                    // Adicionar eventos para botões
                    document.querySelectorAll('.edit-nota').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const idNota = this.getAttribute('data-id');
                            const idAluno = this.getAttribute('data-aluno');
                            const idDisciplina = this.getAttribute('data-disciplina');
                            const bimestre = this.getAttribute('data-bimestre');
                            const idTurma = this.getAttribute('data-turma');
                            
                            if (typeof editarNota === 'function') {
                                editarNota(idNota, idAluno, idDisciplina, bimestre, idTurma);
                            } else {
                                console.warn("Função editarNota não encontrada");
                            }
                        });
                    });
                    
                    document.querySelectorAll('.delete-nota').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const idNota = this.getAttribute('data-id');
                            const idAluno = this.getAttribute('data-aluno');
                            const idDisciplina = this.getAttribute('data-disciplina');
                            const bimestre = this.getAttribute('data-bimestre');
                            const idTurma = this.getAttribute('data-turma');
                            
                            if (typeof excluirNota === 'function') {
                                excluirNota(idNota, idAluno, idDisciplina, bimestre, idTurma);
                            } else {
                                console.warn("Função excluirNota não encontrada");
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error("Erro ao processar dados para a tabela de notas:", error);
                    tabelaAtual.innerHTML = `
                        <tr class="text-center">
                            <td colspan="10">Erro ao processar dados: ${error.message}</td>
                        </tr>
                    `;
                });
            })
            .catch(error => {
                console.error("Erro ao carregar notas:", error);
                tabelaAtual.innerHTML = `
                    <tr class="text-center">
                        <td colspan="10">Erro ao carregar notas: ${error.message}</td>
                    </tr>
                `;
            });
    }
    
    // Salvar nota (nova ou edição)
    function salvarNota() {
        const idTurma = selectTurmaNota.value;
        const idDisciplina = selectDisciplinaNota.value;
        const idAluno = selectAlunoNota.value;
        const valor = inputValorNota.value;
        const descricao = inputDescricaoNota.value;
        
        // Validar campos
        if (!idTurma || !idDisciplina || !idAluno || !valor) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }
        
        const nota = {
            id_turma: idTurma,
            id_disciplina: idDisciplina,
            id_aluno: idAluno,
            valor: parseFloat(valor),
            descricao: descricao
        };
        
        // Modo novo ou edição
        const modo = formModoNota.value;
        const url = modo === 'novo' 
            ? CONFIG.getApiUrl('/notas') 
            : CONFIG.getApiUrl(`/notas/${formModoNota.getAttribute('data-id')}`);
        
        const method = modo === 'novo' ? 'POST' : 'PUT';
        
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nota)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao ${modo === 'novo' ? 'criar' : 'atualizar'} nota: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            alert(`Nota ${modo === 'novo' ? 'criada' : 'atualizada'} com sucesso!`);
            
            // Resetar formulário e recarregar dados
            resetarFormularioNota();
            carregarNotas();
        })
        .catch(error => {
            console.error(`Erro ao ${modo === 'novo' ? 'criar' : 'atualizar'} nota:`, error);
            alert(`Erro ao salvar nota: ${error.message}`);
        });
    }
    
    // Função para editar uma nota existente
    function editarNota(idNota) {
        fetch(CONFIG.getApiUrl(`/notas/${idNota}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar nota: ${response.status}`);
                }
                return response.json();
            })
            .then(nota => {
                // Definir o modo do formulário
                formModoNota.value = 'editar';
                formModoNota.setAttribute('data-id', idNota);
                
                // Atualizar título do formulário
                formNotaTitulo.textContent = 'Editar Nota';
                
                // Preencher valores no formulário
                selectTurmaNota.value = nota.id_turma;
                
                // Disparar eventos de change manualmente para carregar os selects dependentes
                const eventTurma = new Event('change');
                selectTurmaNota.dispatchEvent(eventTurma);
                
                // Aguardar um pouco para o select de disciplinas ser preenchido
                setTimeout(() => {
                    selectDisciplinaNota.value = nota.id_disciplina;
                    
                    const eventDisciplina = new Event('change');
                    selectDisciplinaNota.dispatchEvent(eventDisciplina);
                    
                    // Aguardar para o select de alunos ser preenchido
                    setTimeout(() => {
                        selectAlunoNota.value = nota.id_aluno;
                        inputValorNota.value = nota.valor;
                        inputDescricaoNota.value = nota.descricao || '';
                        
                        // Mostrar botão cancelar
                        btnCancelarNota.style.display = 'inline-block';
                        
                        // Rolar até o formulário
                        formNota.scrollIntoView({behavior: 'smooth'});
                    }, 300);
                }, 300);
            })
            .catch(error => {
                console.error("Erro ao editar nota:", error);
                alert(`Erro ao carregar dados da nota: ${error.message}`);
            });
    }
    
    // Função para excluir uma nota
    function excluirNota(idNota) {
        if (confirm('Tem certeza que deseja excluir esta nota?')) {
            fetch(CONFIG.getApiUrl(`/notas/${idNota}`), {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao excluir nota: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                alert('Nota excluída com sucesso!');
                carregarNotas();
            })
            .catch(error => {
                console.error("Erro ao excluir nota:", error);
                alert(`Erro ao excluir nota: ${error.message}`);
            });
        }
    }
    
    // Função para resetar o formulário de notas
    function resetarFormularioNota() {
        formNota.reset();
        formModoNota.value = 'novo';
        formModoNota.removeAttribute('data-id');
        formNotaTitulo.textContent = 'Nova Nota';
        btnCancelarNota.style.display = 'none';
        
        // Desabilitar selects dependentes
        selectDisciplinaNota.disabled = true;
        selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma primeiro</option>';
        
        selectAlunoNota.disabled = true;
        selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina primeiro</option>';
    }
    
    // Eventos para os selects de turma e disciplina
    if (selectTurmaNota && selectDisciplinaNota) {
        selectTurmaNota.addEventListener('change', function() {
            const idTurma = this.value;
            if (!idTurma) return;
            
            // Buscar disciplinas da turma
            fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/disciplinas`))
                .then(response => response.ok ? response.json() : [])
                .then(disciplinas => {
                    selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina</option>';
                    disciplinas.forEach(disciplina => {
                        const option = document.createElement('option');
                        option.value = disciplina.id_disciplina;
                        option.textContent = disciplina.nome_disciplina;
                        selectDisciplinaNota.appendChild(option);
                    });
                    
                    // Habilitar o select de disciplinas
                    selectDisciplinaNota.disabled = false;
                })
                .catch(error => {
                    console.error(`Erro ao carregar disciplinas da turma ${idTurma}:`, error);
                    selectDisciplinaNota.innerHTML = '<option value="" disabled>Erro ao carregar disciplinas</option>';
                });
                
            // Resetar o select de alunos
            if (selectAlunoNota) {
                selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina primeiro</option>';
                selectAlunoNota.disabled = true;
            }
        });
    }
    
    // Carregar alunos quando uma disciplina for selecionada
    if (selectDisciplinaNota && selectAlunoNota) {
        selectDisciplinaNota.addEventListener('change', function() {
            const idDisciplina = this.value;
            const idTurma = selectTurmaNota.value;
            if (!idDisciplina || !idTurma) return;
            
            // Buscar alunos da turma
            fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`))
                .then(response => response.ok ? response.json() : [])
                .then(alunos => {
                    selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione um aluno</option>';
                    
                    // Ordenar alunos por nome
                    alunos.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
                    
                    alunos.forEach(aluno => {
                        const option = document.createElement('option');
                        option.value = aluno.id_aluno;
                        option.textContent = aluno.nome_aluno;
                        selectAlunoNota.appendChild(option);
                    });
                    
                    // Habilitar o select de alunos
                    selectAlunoNota.disabled = false;
                })
                .catch(error => {
                    console.error(`Erro ao carregar alunos da turma ${idTurma}:`, error);
                    selectAlunoNota.innerHTML = '<option value="" disabled>Erro ao carregar alunos</option>';
                });
        });
    }
    
    // Botão para cancelar edição
    if (btnCancelarNota) {
        btnCancelarNota.addEventListener('click', function(e) {
            e.preventDefault();
            resetarFormularioNota();
        });
    }
    
    // Exportar funções para o escopo global
    window.carregarNotas = carregarNotas;
}

// Função para criar disciplina
function criarDisciplina(disciplina) {
    return fetch(CONFIG.getApiUrl('/disciplinas/'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(disciplina)
    });
}

// Carregar informações da disciplina para edição
function buscarDisciplina(idDisciplinaValue) {
    // Buscar informações da disciplina para edição
    return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplinaValue}`))
        .then(response => {
            if (!response.ok) {
                throw new Error('Disciplina não encontrada');
            }
            return response.json();
        })
        .then(disciplina => {
            // Se não tiver turmas_vinculadas, buscar da API especificamente
            if (!disciplina.turmas_vinculadas || !Array.isArray(disciplina.turmas_vinculadas) || disciplina.turmas_vinculadas.length === 0) {
                console.log("Buscando turmas vinculadas via endpoint específico");
                return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplinaValue}/turmas`))
                    .then(response => {
                        if (!response.ok) {
                            console.warn("Não foi possível buscar as turmas vinculadas, usando array vazio");
                            return { ...disciplina, turmas_vinculadas: [] };
                        }
                        return response.json()
                            .then(turmasVinculadas => {
                                console.log("Turmas vinculadas encontradas:", turmasVinculadas);
                                return { 
                                    ...disciplina, 
                                    turmas_vinculadas: turmasVinculadas 
                                };
                            });
                    })
                    .catch(error => {
                        console.error("Erro ao buscar turmas vinculadas:", error);
                        return { ...disciplina, turmas_vinculadas: [] };
                    });
            }
            
            // Já tem turmas_vinculadas no objeto
            return disciplina;
        });
}

function salvarDisciplina(event) {
  event.preventDefault();
  
  // Obter dados do formulário
  const idDisciplina = document.getElementById('idDisciplina').value.trim().toUpperCase();
  const nomeDisciplina = document.getElementById('nomeDisciplina').value.trim();
  const cargaHoraria = document.getElementById('descricaoDisciplina').value.trim();
  
  // Validar campos
  if (!idDisciplina || !nomeDisciplina) {
    alert('Por favor, preencha todos os campos obrigatórios!');
    return;
  }
  
  // Obter turmas selecionadas - método robusto que tenta várias abordagens
  let turmasSelecionadas = [];
  const turmasDisciplinaSelect = document.getElementById('turmasDisciplina');
  
  if (turmasDisciplinaSelect) {
    // Tentar obter via selectedOptions (forma padrão)
    try {
      turmasSelecionadas = Array.from(turmasDisciplinaSelect.selectedOptions || []).map(option => option.value);
    } catch (e) {
      console.warn("Erro ao obter selectedOptions:", e);
    }
    
    // Se não funcionou, tentar verificar manualmente quais opções estão selecionadas
    if (turmasSelecionadas.length === 0) {
      turmasSelecionadas = Array.from(turmasDisciplinaSelect.options || [])
        .filter(option => option.selected)
        .map(option => option.value);
    }
    
    // Se ainda não funcionou, tentar via jQuery
    if (turmasSelecionadas.length === 0 && typeof $ === 'function') {
      try {
        const jqSelected = $(turmasDisciplinaSelect).val();
        if (Array.isArray(jqSelected)) {
          turmasSelecionadas = jqSelected;
        }
      } catch (e) {
        console.warn("Erro ao obter seleção via jQuery:", e);
      }
    }
  }
  
  console.log("Turmas selecionadas para salvar:", turmasSelecionadas);
  
  // Criar objeto disciplina
  const disciplina = {
    id_disciplina: idDisciplina,
    nome_disciplina: nomeDisciplina,
    carga_horaria: cargaHoraria,
    turmas_vinculadas: turmasSelecionadas,
    turmas: turmasSelecionadas // incluindo em ambos formatos para compatibilidade
  };
  
  // Definir método HTTP
  const metodo = document.getElementById('formDisciplina').dataset.mode === 'editar' ? 'PUT' : 'POST';
  const idOriginal = document.getElementById('formDisciplina').dataset.id || idDisciplina;
  const urlEndpoint = metodo === 'PUT' 
    ? CONFIG.getApiUrl(`/disciplinas/${idOriginal}`) 
    : CONFIG.getApiUrl('/disciplinas');
  
  // Exibir mensagem de carregamento
  const disciplinasLista = document.getElementById('disciplinas-lista');
  if (disciplinasLista) {
    disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Salvando disciplina...</td></tr>';
  }
  
  console.log('Enviando disciplina para API:', disciplina, 'Método:', metodo, 'URL:', urlEndpoint);
  
  // Enviar requisição para a API
  fetch(urlEndpoint, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(disciplina)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erro ao salvar disciplina: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Resposta da API após salvar disciplina:", data);
    
    // Armazenar também no localStorage para fallback
    try {
      const disciplinasLocal = JSON.parse(localStorage.getItem('disciplinas') || '[]');
      const index = disciplinasLocal.findIndex(d => d.id_disciplina === idDisciplina);
      
      if (index >= 0) {
        // Atualizar existente
        disciplinasLocal[index] = disciplina;
      } else {
        // Adicionar nova
        disciplinasLocal.push(disciplina);
      }
      
      localStorage.setItem('disciplinas', JSON.stringify(disciplinasLocal));
      console.log("Disciplina também salva no localStorage");
    } catch (e) {
      console.error("Erro ao salvar disciplina no localStorage:", e);
    }
    
    // Mostrar alerta de sucesso
    alert(`Disciplina ${metodo === 'PUT' ? 'atualizada' : 'adicionada'} com sucesso!`);
    
    // Fechar modal
    const modalDisciplina = bootstrap.Modal.getInstance(document.getElementById('modalDisciplina'));
    modalDisciplina.hide();
    
    // Limpar formulário
    document.getElementById('formDisciplina').reset();
    
    // Recarregar lista de disciplinas
    carregarDisciplinas();
  })
  .catch(error => {
    console.error('Erro ao salvar disciplina:', error);
    alert(`Erro ao salvar disciplina: ${error.message}`);
    
    // Recarregar lista de disciplinas
    carregarDisciplinas();
  });
}

function abrirModalEditarDisciplina(disciplinaId) {
    console.log(`Abrindo modal para editar disciplina: ${disciplinaId}`);
    
    const modalDisciplina = document.getElementById('modalDisciplina');
    const formDisciplina = document.getElementById('formDisciplina');
    const tituloForm = document.getElementById('modalDisciplinaLabel');
    const submitBtn = document.getElementById('submitFormDisciplina');
    
    if (!modalDisciplina || !formDisciplina) {
        console.error("Modal ou formulário de disciplina não encontrado");
        return;
    }
    
    // Resetar o formulário antes de preencher com novos dados
    resetarFormularioDisciplina();
    
    if (disciplinaId) {
        // Modo Editar
        if (tituloForm) tituloForm.textContent = 'Editar Disciplina';
        if (submitBtn) submitBtn.textContent = 'Atualizar';
        
        // Desativar campo ID para edição
        const idDisciplinaField = document.getElementById('idDisciplina');
        if (idDisciplinaField) idDisciplinaField.readOnly = true;
        
        // Buscar a disciplina e todas as turmas em paralelo
        Promise.all([
            buscarDisciplina(disciplinaId),
            fetch(CONFIG.getApiUrl('/turmas')).then(res => res.ok ? res.json() : [])
        ])
        .then(([disciplina, turmas]) => {
            console.log("Dados para edição:", { disciplina, turmas });
            
            // Preencher o formulário com os dados da disciplina
            if (idDisciplinaField) idDisciplinaField.value = disciplina.id_disciplina || '';
            
            const nomeDisciplinaField = document.getElementById('nomeDisciplina');
            const cargaHorariaField = document.getElementById('descricaoDisciplina');
            
            if (nomeDisciplinaField) nomeDisciplinaField.value = disciplina.nome_disciplina || '';
            if (cargaHorariaField) cargaHorariaField.value = disciplina.carga_horaria || '';
            
            // Definir o modo do formulário
            formDisciplina.setAttribute('data-mode', 'editar');
            formDisciplina.setAttribute('data-id', disciplinaId);
            
            // Extrair IDs das turmas vinculadas
            const turmasVinculadas = disciplina.turmas_vinculadas || [];
            
            // Normalizar para obter apenas os IDs
            const turmasIds = turmasVinculadas.map(turma => {
                if (typeof turma === 'object' && turma !== null) {
                    return String(turma.id_turma || turma.id || '');
                } else {
                    return String(turma);
                }
            });
            
            console.log("Turmas vinculadas à disciplina:", turmasIds);
            
            // NOVA ABORDAGEM: Substituir o select por checkboxes
            const selectContainer = document.querySelector('#turmasDisciplina').parentElement;
            if (!selectContainer) {
                console.error("Container do select não encontrado");
                return;
            }
            
            // Guardar o rótulo e outros elementos antes de manipular o DOM
            const selectLabel = selectContainer.querySelector('label');
            const labelText = selectLabel ? selectLabel.textContent : 'Vincular Turmas';
            
            // Remover o select original
            selectContainer.innerHTML = '';
            
            // Recriar o rótulo
            const newLabel = document.createElement('label');
            newLabel.setAttribute('for', 'turmas-checkboxes');
            newLabel.textContent = labelText;
            selectContainer.appendChild(newLabel);
            
            // Criar container para os checkboxes
            const checkboxContainer = document.createElement('div');
            checkboxContainer.id = 'turmas-checkboxes';
            checkboxContainer.className = 'checkbox-group border rounded p-2';
            checkboxContainer.style.maxHeight = '200px';
            checkboxContainer.style.overflowY = 'auto';
            selectContainer.appendChild(checkboxContainer);
            
            // Adicionar checkboxes para cada turma
            if (turmas.length === 0) {
                checkboxContainer.innerHTML = '<p class="text-muted">Nenhuma turma disponível</p>';
            } else {
                turmas.forEach(turma => {
                    const turmaId = String(turma.id_turma || turma.id || '');
                    const isChecked = turmasIds.includes(turmaId);
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'form-check';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'form-check-input turma-checkbox';
                    checkbox.id = `turma-${turmaId}`;
                    checkbox.value = turmaId;
                    checkbox.checked = isChecked;
                    
                    if (isChecked) {
                        console.log(`Marcando turma ${turmaId} como selecionada`);
                        wrapper.style.backgroundColor = "#e6f7ff";
                        wrapper.style.fontWeight = "bold";
                    }
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.htmlFor = `turma-${turmaId}`;
                    label.textContent = `${turmaId} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                    
                    wrapper.appendChild(checkbox);
                    wrapper.appendChild(label);
                    checkboxContainer.appendChild(wrapper);
                });
            }
            
            // Adicionar área de preview
            const previewArea = document.createElement('div');
            previewArea.id = 'turmas-vinculadas-preview';
            previewArea.className = 'mt-2 small';
            selectContainer.appendChild(previewArea);
            
            // Adicionar event listener para atualizar o preview
            document.querySelectorAll('.turma-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', atualizarPreviewTurmasVinculadasCheckbox);
            });
            
            // Atualizar o preview inicialmente
            setTimeout(() => {
                atualizarPreviewTurmasVinculadasCheckbox();
            }, 100);
        })
        .catch(error => {
            console.error(`Erro ao buscar dados para edição: ${error}`);
            alert(`Erro ao buscar dados da disciplina: ${error.message}`);
            resetarFormularioDisciplina();
        });
    } else {
        // Modo Novo
        if (tituloForm) tituloForm.textContent = 'Nova Disciplina';
        if (submitBtn) submitBtn.textContent = 'Salvar';
        
        const idDisciplinaField = document.getElementById('idDisciplina');
        if (idDisciplinaField) idDisciplinaField.readOnly = false;
        
        formDisciplina.setAttribute('data-mode', 'novo');
        formDisciplina.removeAttribute('data-id');
        
        // Carregar turmas para o modo novo
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(res => res.ok ? res.json() : [])
            .then(turmas => {
                console.log("Turmas carregadas para nova disciplina:", turmas);
                
                // NOVA ABORDAGEM: Usar checkboxes
                const selectContainer = document.querySelector('#turmasDisciplina').parentElement;
                if (!selectContainer) {
                    console.error("Container do select não encontrado");
                    return;
                }
                
                // Guardar o rótulo antes de manipular o DOM
                const selectLabel = selectContainer.querySelector('label');
                const labelText = selectLabel ? selectLabel.textContent : 'Vincular Turmas';
                
                // Remover o select original
                selectContainer.innerHTML = '';
                
                // Recriar o rótulo
                const newLabel = document.createElement('label');
                newLabel.setAttribute('for', 'turmas-checkboxes');
                newLabel.textContent = labelText;
                selectContainer.appendChild(newLabel);
                
                // Criar container para os checkboxes
                const checkboxContainer = document.createElement('div');
                checkboxContainer.id = 'turmas-checkboxes';
                checkboxContainer.className = 'checkbox-group border rounded p-2';
                checkboxContainer.style.maxHeight = '200px';
                checkboxContainer.style.overflowY = 'auto';
                selectContainer.appendChild(checkboxContainer);
                
                // Adicionar checkboxes para cada turma
                if (turmas.length === 0) {
                    checkboxContainer.innerHTML = '<p class="text-muted">Nenhuma turma disponível</p>';
                } else {
                    turmas.forEach(turma => {
                        const turmaId = String(turma.id_turma || turma.id || '');
                        
                        const wrapper = document.createElement('div');
                        wrapper.className = 'form-check';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.className = 'form-check-input turma-checkbox';
                        checkbox.id = `turma-${turmaId}`;
                        checkbox.value = turmaId;
                        
                        const label = document.createElement('label');
                        label.className = 'form-check-label';
                        label.htmlFor = `turma-${turmaId}`;
                        label.textContent = `${turmaId} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                        
                        wrapper.appendChild(checkbox);
                        wrapper.appendChild(label);
                        checkboxContainer.appendChild(wrapper);
                    });
                }
                
                // Adicionar área de preview
                const previewArea = document.createElement('div');
                previewArea.id = 'turmas-vinculadas-preview';
                previewArea.className = 'mt-2 small';
                selectContainer.appendChild(previewArea);
                
                // Adicionar event listener para atualizar o preview
                document.querySelectorAll('.turma-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', atualizarPreviewTurmasVinculadasCheckbox);
                });
                
                // Atualizar o preview inicialmente
                setTimeout(() => {
                    atualizarPreviewTurmasVinculadasCheckbox();
                }, 100);
            })
            .catch(error => {
                console.error(`Erro ao carregar turmas: ${error}`);
                alert(`Erro ao carregar turmas: ${error.message}`);
            });
    }
    
    // Mostrar o modal
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const bsModal = new bootstrap.Modal(modalDisciplina);
        bsModal.show();
    } else {
        // Fallback para jQuery ou método manual
        try {
            if (typeof $ === 'function') {
                $(modalDisciplina).modal('show');
            } else {
                modalDisciplina.style.display = 'block';
                modalDisciplina.classList.add('show');
            }
        } catch (e) {
            console.warn("Erro ao tentar mostrar modal:", e);
            modalDisciplina.style.display = 'block';
        }
    }
}

// Nova função para atualizar o preview com checkboxes
function atualizarPreviewTurmasVinculadasCheckbox() {
    console.log("Atualizando preview de turmas vinculadas (checkboxes)");
    const previewArea = document.getElementById('turmas-vinculadas-preview');
    
    if (!previewArea) {
        console.error("Área de preview não encontrada");
        return;
    }
    
    // Obter todas as checkboxes marcadas
    const turmasSelecionadas = Array.from(document.querySelectorAll('.turma-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    console.log("Turmas selecionadas para preview:", turmasSelecionadas);
    
    // Atualizar a área de preview
    if (turmasSelecionadas.length === 0) {
        previewArea.innerHTML = '<span class="text-muted">Nenhuma turma selecionada</span>';
    } else {
        previewArea.innerHTML = '<strong>Turmas selecionadas:</strong> ';
        
        // Buscar detalhes das turmas selecionadas
        const turmaBadges = Array.from(document.querySelectorAll('.turma-checkbox:checked')).map(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            const turmaTexto = label ? label.textContent : checkbox.value;
            
            return `<span class="badge bg-primary me-1">${turmaTexto}</span>`;
        });
        
        previewArea.innerHTML += turmaBadges.join('');
    }
}

// Modificar a função salvarDisciplina para usar checkboxes
function salvarDisciplina(event) {
    event.preventDefault();
    console.log("Iniciando salvarDisciplina()");
    
    const formDisciplina = document.getElementById('formDisciplina');
    const idDisciplinaField = document.getElementById('idDisciplina');
    const nomeDisciplinaField = document.getElementById('nomeDisciplina');
    const cargaHorariaField = document.getElementById('descricaoDisciplina');
    
    if (!formDisciplina || !idDisciplinaField || !nomeDisciplinaField || !cargaHorariaField) {
        console.error("Campos do formulário não encontrados");
        alert("Erro ao processar formulário: campos não encontrados");
        return;
    }
    
    // Validar campos obrigatórios
    if (!idDisciplinaField.value.trim() || !nomeDisciplinaField.value.trim() || !cargaHorariaField.value.trim()) {
        alert("Por favor, preencha todos os campos obrigatórios");
        return;
    }
    
    // Criar objeto disciplina
    const disciplina = {
        id_disciplina: idDisciplinaField.value.trim(),
        nome_disciplina: nomeDisciplinaField.value.trim(),
        carga_horaria: parseInt(cargaHorariaField.value.trim()) || 0
    };
    
    // NOVA ABORDAGEM: Obter turmas selecionadas via checkboxes
    const turmasSelecionadas = Array.from(document.querySelectorAll('.turma-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    console.log("Turmas selecionadas para salvar:", turmasSelecionadas);
    
    // Adicionar turmas ao objeto disciplina
    disciplina.turmas_vinculadas = turmasSelecionadas;
    disciplina.turmas = turmasSelecionadas; // Para compatibilidade
    
    // Determinar se é uma nova disciplina ou uma edição
    const isEditMode = formDisciplina.getAttribute('data-mode') === 'editar';
    const method = isEditMode ? 'PUT' : 'POST';
    const endpoint = isEditMode 
        ? CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}`) 
        : CONFIG.getApiUrl('/disciplinas/');
    
    console.log(`Enviando dados via ${method} para ${endpoint}:`, disciplina);
    
    // Exibir mensagem de loading
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'alert alert-info mt-2';
    loadingMsg.textContent = 'Salvando disciplina...';
    formDisciplina.appendChild(loadingMsg);
    
    // Enviar os dados para a API
    fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(disciplina)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Disciplina salva com sucesso:", data);
        
        // Atualizar a lista de disciplinas
        carregarDisciplinas();
        
        // Fechar o modal
        const modalDisciplina = document.getElementById('modalDisciplina');
        if (modalDisciplina) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const bsModal = bootstrap.Modal.getInstance(modalDisciplina);
                if (bsModal) bsModal.hide();
            } else {
                // Fallback para jQuery ou método manual
                try {
                    if (typeof $ === 'function') {
                        $(modalDisciplina).modal('hide');
                    } else {
                        modalDisciplina.style.display = 'none';
                        modalDisciplina.classList.remove('show');
                    }
                } catch (e) {
                    console.warn("Erro ao tentar fechar modal:", e);
                    modalDisciplina.style.display = 'none';
                }
            }
        }
        
        // Mostrar mensagem de sucesso
        alert(`Disciplina ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
    })
    .catch(error => {
        console.error(`Erro ao salvar disciplina: ${error}`);
        
        // Tentar salvar localmente se API falhar
        try {
            const disciplinasLocal = JSON.parse(localStorage.getItem('disciplinas') || '[]');
            
            // Se for modo edição, atualizar disciplina existente
            if (isEditMode) {
                const index = disciplinasLocal.findIndex(d => d.id_disciplina === disciplina.id_disciplina);
                if (index !== -1) {
                    disciplinasLocal[index] = disciplina;
                } else {
                    disciplinasLocal.push(disciplina);
                }
            } else {
                // Adicionar uma nova disciplina
                disciplina.id = disciplinasLocal.length + 1;
                disciplinasLocal.push(disciplina);
            }
            
            localStorage.setItem('disciplinas', JSON.stringify(disciplinasLocal));
            console.log("Disciplina salva localmente:", disciplina);
            
            // Atualizar a lista de disciplinas
            carregarDisciplinas();
            
            // Fechar o modal
            const modalDisciplina = document.getElementById('modalDisciplina');
            if (modalDisciplina) {
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const bsModal = bootstrap.Modal.getInstance(modalDisciplina);
                    if (bsModal) bsModal.hide();
                } else {
                    try {
                        if (typeof $ === 'function') {
                            $(modalDisciplina).modal('hide');
                        } else {
                            modalDisciplina.style.display = 'none';
                            modalDisciplina.classList.remove('show');
                        }
                    } catch (e) {
                        modalDisciplina.style.display = 'none';
                    }
                }
            }
            
            // Mostrar mensagem de sucesso com aviso sobre armazenamento local
            alert(`Disciplina ${isEditMode ? 'atualizada' : 'criada'} com sucesso no armazenamento local (modo offline)!`);
        } catch (localError) {
            console.error(`Erro ao salvar localmente: ${localError}`);
            alert(`Erro ao salvar disciplina: ${error.message}. Não foi possível salvar no modo offline.`);
        }
    })
    .finally(() => {
        // Remover mensagem de loading
        if (loadingMsg.parentNode) {
            loadingMsg.parentNode.removeChild(loadingMsg);
        }
    });
}

function carregarDisciplinas() {
  const disciplinasLista = document.getElementById('disciplinas-lista');
  if (!disciplinasLista) return;

  console.log("Iniciando carregamento de disciplinas");
  
  // Exibir mensagem de carregamento
  disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Carregando disciplinas...</td></tr>';

  // Primeiro carregar as turmas para referência
  fetch(CONFIG.getApiUrl('/turmas'))
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar turmas: ${response.statusText}`);
      }
      return response.json();
    })
    .then(turmas => {
      console.log("Turmas carregadas:", turmas);
      
      // Criar mapa de turmas
      const turmasMap = {};
      turmas.forEach(turma => {
        turmasMap[turma.id_turma || turma.id] = turma;
      });
      
      // Atualizar localStorage
      localStorage.setItem('turmas', JSON.stringify(turmas));
      
      // Agora carregar disciplinas
      return fetch(CONFIG.getApiUrl('/disciplinas'))
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erro ao carregar disciplinas: ${response.statusText}`);
          }
          return response.json().then(disciplinas => ({ disciplinas, turmasMap }));
        });
    })
    .then(({ disciplinas, turmasMap }) => {
      console.log("Disciplinas carregadas:", disciplinas);
      
      // Atualizar localStorage
      localStorage.setItem('disciplinas', JSON.stringify(disciplinas));
      
      if (disciplinas.length === 0) {
        disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma disciplina encontrada</td></tr>';
        return;
      }
      
      // Limpar a tabela
      disciplinasLista.innerHTML = '';
      
      // Array para armazenar promessas de busca de turmas
      const disciplinasPromessas = disciplinas.map(disciplina => {
        return fetch(CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}/turmas`))
          .then(response => {
            // Se a resposta não for OK, considerar que não há turmas vinculadas
            if (!response.ok) {
              console.warn(`Erro ao buscar turmas para disciplina ${disciplina.id_disciplina}: ${response.statusText}`);
              return { disciplina, turmasVinculadas: [] };
            }
            return response.json().then(turmasVinculadas => {
              console.log(`Turmas vinculadas à disciplina ${disciplina.id_disciplina}:`, turmasVinculadas);
              return { disciplina, turmasVinculadas };
            });
          })
          .catch(error => {
            console.error(`Erro ao buscar turmas para disciplina ${disciplina.id_disciplina}:`, error);
            return { disciplina, turmasVinculadas: [] };
          });
      });
      
      // Aguardar todas as buscas de turmas
      Promise.all(disciplinasPromessas)
        .then(resultados => {
          // Para cada disciplina, criar uma linha na tabela
          resultados.forEach(({ disciplina, turmasVinculadas }) => {
            console.log(`Processando disciplina ${disciplina.id_disciplina} com ${turmasVinculadas.length} turmas vinculadas:`, disciplina);
            
            const row = document.createElement('tr');
            
            // Formatar texto de turmas vinculadas
            let turmasTexto = '-';
            if (turmasVinculadas && turmasVinculadas.length > 0) {
              const turmasFormatadas = turmasVinculadas.map(turma => {
                const idTurma = turma.id_turma || turma.id;
                const turmaDados = turmasMap[idTurma];
                if (turmaDados) {
                  return `${idTurma} - ${turmaDados.serie || turmaDados.nome || 'Sem nome'}`;
                }
                return idTurma;
              });
              turmasTexto = turmasFormatadas.join(', ');
            }
            
            console.log(`Disciplina ${disciplina.id_disciplina} - turmasTexto final:`, turmasTexto);
            
            // Criar as células da tabela
            row.innerHTML = `
              <td>${disciplina.id_disciplina}</td>
              <td>${disciplina.nome_disciplina}</td>
              <td>${disciplina.carga_horaria || '-'}</td>
              <td>${turmasTexto}</td>
              <td>
                <button class="btn btn-sm btn-primary btn-editar-disciplina" data-id="${disciplina.id_disciplina}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-excluir-disciplina" data-id="${disciplina.id_disciplina}" data-nome="${disciplina.nome_disciplina}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            
            disciplinasLista.appendChild(row);
          });
          
          // Adicionar event listeners aos botões
          const botoesEditar = document.querySelectorAll('.btn-editar-disciplina');
          const botoesExcluir = document.querySelectorAll('.btn-excluir-disciplina');
          
          botoesEditar.forEach(botao => {
            botao.addEventListener('click', function() {
              const idDisciplina = this.getAttribute('data-id');
              console.log("Botão editar clicado para disciplina ID:", idDisciplina);
              
              // Rolar para o formulário
              const formDisciplina = document.getElementById('formDisciplina');
              if (formDisciplina) {
                formDisciplina.scrollIntoView({ behavior: 'smooth' });
              }
              
              // Chamar a função de edição
              editarDisciplina(idDisciplina);
            });
          });
          
          botoesExcluir.forEach(botao => {
            botao.addEventListener('click', function() {
              const idDisciplina = this.getAttribute('data-id');
              const nomeDisciplina = this.getAttribute('data-nome');
              excluirDisciplina(idDisciplina, nomeDisciplina);
            });
          });
        });
    })
    .catch(error => {
      console.error('Erro ao carregar dados:', error);
      disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar disciplinas</td></tr>';
      
      // Tentar carregar do localStorage como fallback
      try {
        const disciplinasLocal = JSON.parse(localStorage.getItem('disciplinas') || '[]');
        const turmasLocal = JSON.parse(localStorage.getItem('turmas') || '[]');
        
        if (disciplinasLocal.length > 0) {
          disciplinasLista.innerHTML = '';
          
          // Processar disciplinas do localStorage
          disciplinasLocal.forEach(disciplina => {
            const row = document.createElement('tr');
            
            // Determinar as turmas vinculadas a esta disciplina do localStorage
            let turmasVinculadas = [];
            
            if (disciplina.turmas_vinculadas && Array.isArray(disciplina.turmas_vinculadas)) {
              turmasVinculadas = disciplina.turmas_vinculadas;
            } else if (disciplina.turmas && Array.isArray(disciplina.turmas)) {
              turmasVinculadas = disciplina.turmas;
            }
            
            // Formatar turmas para exibição
            let turmasTexto = '-';
            if (turmasVinculadas.length > 0) {
              const turmasFormatadas = turmasVinculadas.map(idTurma => {
                const turmaObj = typeof idTurma === 'object' ? idTurma : null;
                const idTurmaStr = turmaObj ? (turmaObj.id_turma || turmaObj.id) : idTurma;
                
                const turma = turmasLocal.find(t => 
                  (t.id_turma === idTurmaStr || t.id === idTurmaStr)
                );
                
                if (turma) {
                  return `${idTurmaStr} - ${turma.serie || turma.nome || 'Sem nome'}`;
                }
                return idTurmaStr;
              });
              turmasTexto = turmasFormatadas.join(', ');
            }
            
            row.innerHTML = `
              <td>${disciplina.id_disciplina}</td>
              <td>${disciplina.nome_disciplina}</td>
              <td>${disciplina.carga_horaria || '-'}</td>
              <td>${turmasTexto}</td>
              <td>
                <button class="btn btn-sm btn-primary btn-editar-disciplina" data-id="${disciplina.id_disciplina}">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-excluir-disciplina" data-id="${disciplina.id_disciplina}" data-nome="${disciplina.nome_disciplina}">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            
            disciplinasLista.appendChild(row);
          });
          
          // Adicionar event listeners aos botões
          document.querySelectorAll('.btn-editar-disciplina').forEach(botao => {
            botao.addEventListener('click', function() {
              const idDisciplina = this.getAttribute('data-id');
              abrirModalEditarDisciplina(idDisciplina);
            });
          });
          
          document.querySelectorAll('.btn-excluir-disciplina').forEach(botao => {
            botao.addEventListener('click', function() {
              const idDisciplina = this.getAttribute('data-id');
              const nomeDisciplina = this.getAttribute('data-nome');
              excluirDisciplina(idDisciplina, nomeDisciplina);
            });
          });
        }
      } catch (e) {
        console.error('Erro ao carregar disciplinas do localStorage:', e);
        disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Erro ao carregar disciplinas</td></tr>';
      }
    });
}

function excluirDisciplina(idDisciplina, nomeDisciplina) {
  // Confirmar exclusão
  if (!confirm(`Tem certeza que deseja excluir a disciplina ${nomeDisciplina || idDisciplina}?`)) {
    return;
  }

  // Exibir mensagem de carregamento
  const disciplinasTableBody = document.getElementById('disciplinas-lista');
  if (disciplinasTableBody) {
    disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Excluindo disciplina...</td></tr>';
  }

  // Excluir disciplina na API
  fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erro ao excluir disciplina: ${response.statusText}`);
    }
    return response.json();
  })
  .then(() => {
    // Mostrar alerta de sucesso
    alert('Disciplina excluída com sucesso!');
    
    // Recarregar lista de disciplinas
    carregarDisciplinas();
  })
  .catch(error => {
    console.error("Erro ao excluir disciplina:", error);
    alert(`Erro ao excluir disciplina: ${error.message}`);
    
    // Recarregar lista de disciplinas
    carregarDisciplinas();
  });
}

// Função para carregar as turmas no select do modal
function carregarTurmasSelect(turmasVinculadas = []) {
    console.log('Carregando turmas para o select com turmas vinculadas:', turmasVinculadas);
    
    // Garantir que turmasVinculadas seja um array
    if (!Array.isArray(turmasVinculadas)) {
        console.warn('turmasVinculadas não é um array:', turmasVinculadas);
        turmasVinculadas = [];
    }
    
    // Extrair os IDs das turmas vinculadas, suportando diferentes formatos
    const turmasIds = [];
    
    turmasVinculadas.forEach(turma => {
        let id = null;
        
        if (typeof turma === 'object' && turma !== null) {
            // Tentar obter id_turma, id ou outras variações possíveis
            id = turma.id_turma || turma.id || turma.turma_id;
        } else if (typeof turma === 'string' || typeof turma === 'number') {
            // Se for string ou número, usar diretamente
            id = turma;
        }
        
        if (id !== null) {
            turmasIds.push(String(id)); // Normalizar para string
        }
    });
    
    console.log('IDs das turmas vinculadas normalizados:', turmasIds);
    
    // Função para encontrar e verificar se o elemento select existe
    const encontrarSelect = () => {
        // Tentar diferentes seletores para maior robustez
        let select = document.querySelector('#modalDisciplina #turmasDisciplina');
        if (!select) select = document.getElementById('turmasDisciplina');
        
        console.log('Select encontrado:', !!select, select);
        return select;
    };
    
    // Função para carregar as turmas quando o select estiver disponível
    const carregarTurmas = (select) => {
        // Verificar novamente se o select ainda é válido
        if (!select || !document.body.contains(select)) {
            console.error("Select inválido ou não está mais no DOM");
            return;
        }
        
        // Mostrar mensagem de carregamento
        select.innerHTML = '<option value="">Carregando turmas...</option>';
        select.disabled = true;
        
        // Buscar turmas da API
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar turmas: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(turmas => {
                console.log('Turmas recebidas da API:', turmas);
                
                // Verificar se o elemento ainda existe (pode ter sido removido se o modal foi fechado)
                if (!select || !document.body.contains(select)) {
                    console.warn('Elemento select não está mais no DOM ou foi removido');
                    return;
                }
                
                try {
                    // Armazenar no localStorage para fallback
                    localStorage.setItem('turmas', JSON.stringify(turmas));
                    
                    // Limpar o select
                    select.innerHTML = '';
                    select.disabled = false;
                    
                    // Adicionar as opções
                    if (!turmas || turmas.length === 0) {
                        select.innerHTML = '<option value="">Nenhuma turma disponível</option>';
                    } else {
                        // Adicionar opção padrão
                        const defaultOption = document.createElement('option');
                        defaultOption.value = "";
                        defaultOption.textContent = "Selecione as turmas";
                        select.appendChild(defaultOption);
                        
                        // Adicionar cada turma como opção
                        turmas.forEach(turma => {
                            if (!turma) return; // Pular se a turma for inválida
                            
                            const turmaId = String(turma.id_turma || turma.id || '');
                            if (!turmaId) {
                                console.warn("Turma sem ID válido:", turma);
                                return; // Pular se não tiver ID
                            }
                            
                            const option = document.createElement('option');
                            option.value = turmaId;
                            option.textContent = `${turmaId} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                            
                            // Verificar se a turma está vinculada (comparando como strings para evitar problemas com tipos)
                            if (turmasIds.includes(turmaId)) {
                                option.selected = true;
                                console.log(`Turma ${turmaId} selecionada`);
                            }
                            
                            select.appendChild(option);
                        });
                    }
                    
                    console.log(`Select de turmas populado com ${turmas.length} turmas`);
                    
                    // Forçar atualização visual do select
                    setTimeout(() => {
                        if (select && document.body.contains(select)) {
                            console.log("Forçando atualização visual do select de turmas");
                            
                            // Método 1: Manipulação direta do DOM
                            try {
                                // Forçar uma re-renderização mantendo as seleções
                                const selectedValues = Array.from(select.options)
                                    .filter(opt => opt.selected)
                                    .map(opt => opt.value);
                                
                                console.log("Valores selecionados antes da atualização:", selectedValues);
                                
                                // Guardar o HTML atual e reinseri-lo
                                const currentHTML = select.innerHTML;
                                select.innerHTML = currentHTML;
                                
                                // Restaurar as seleções
                                Array.from(select.options).forEach(option => {
                                    if (selectedValues.includes(option.value)) {
                                        option.selected = true;
                                    }
                                });
                            } catch (e) {
                                console.warn("Erro ao forçar atualização DOM:", e);
                            }
                            
                            // Método 2: jQuery normal
                            if (typeof $ === 'function') {
                                try {
                                    console.log("Tentando atualizar via jQuery padrão");
                                    $(select).val(turmasIds);
                                } catch (e) {
                                    console.warn("Erro ao atualizar via jQuery:", e);
                                }
                            }
                            
                            // Método 3: jQuery Select2
                            if (typeof $ === 'function' && typeof $(select).select2 === 'function') {
                                try {
                                    console.log("Detectado Select2, atualizando...");
                                    $(select).val(turmasIds).trigger('change');
                                    $(select).select2('destroy');
                                    $(select).select2();
                                } catch (e) {
                                    console.warn("Erro ao atualizar Select2:", e);
                                }
                            }
                            
                            // Método 4: Bootstrap-Select
                            if (typeof $ === 'function' && typeof $(select).selectpicker === 'function') {
                                try {
                                    console.log("Detectado Bootstrap-Select, atualizando...");
                                    $(select).val(turmasIds);
                                    $(select).selectpicker('refresh');
                                } catch (e) {
                                    console.warn("Erro ao atualizar Bootstrap-Select:", e);
                                }
                            }
                            
                            // Método 5: Chosen
                            if (typeof $ === 'function' && typeof $(select).chosen === 'function') {
                                try {
                                    console.log("Detectado Chosen, atualizando...");
                                    $(select).val(turmasIds).trigger("chosen:updated");
                                } catch (e) {
                                    console.warn("Erro ao atualizar Chosen:", e);
                                }
                            }
                            
                            // Garantir que o evento change seja disparado para atualizar dependências
                            try {
                                const changeEvent = new Event('change');
                                select.dispatchEvent(changeEvent);
                                
                                if (typeof $ === 'function') {
                                    $(select).trigger('change');
                                }
                            } catch (e) {
                                console.warn("Erro ao disparar evento change:", e);
                            }
                            
                            // Atualizar o preview de turmas vinculadas
                            if (typeof atualizarPreviewTurmasVinculadas === 'function') {
                                setTimeout(atualizarPreviewTurmasVinculadas, 50);
                            } else {
                                console.error("Função atualizarPreviewTurmasVinculadas não encontrada");
                            }
                            
                            // Verificar após a atualização
                            setTimeout(() => {
                                const selectedAfter = Array.from(select.options)
                                    .filter(opt => opt.selected)
                                    .map(opt => opt.value);
                                console.log("Valores selecionados após atualização:", selectedAfter);
                                
                                // Se ainda não conseguimos selecionar, tentar uma última vez
                                if (selectedAfter.length === 0 && turmasIds.length > 0) {
                                    console.warn("Seleção não aplicada, fazendo última tentativa");
                                    
                                    // Último recurso: Adicionar marcador visual
                                    Array.from(select.options).forEach(option => {
                                        if (turmasIds.includes(option.value)) {
                                            option.selected = true;
                                            option.style.backgroundColor = "#e6f7ff";
                                            option.style.fontWeight = "bold";
                                        }
                                    });
                                }
                            }, 100);
                        }
                    }, 200);
                } catch (error) {
                    console.error("Erro ao processar turmas:", error);
                    if (select && document.body.contains(select)) {
                        select.innerHTML = '<option value="">Erro ao processar turmas</option>';
                        select.disabled = true;
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao carregar turmas da API:', error);
                
                // Tentar carregar do localStorage como fallback
                try {
                    const turmasLocal = JSON.parse(localStorage.getItem('turmas') || '[]');
                    console.log('Carregando turmas do localStorage como fallback:', turmasLocal);
                    
                    // Verificar se o elemento ainda existe
                    if (!select || !document.body.contains(select)) {
                        console.warn('Elemento select não está mais no DOM. Modal pode ter sido fechado.');
                        return;
                    }
                    
                    // Limpar o select
                    select.innerHTML = '';
                    select.disabled = false;
                    
                    // Adicionar as opções
                    if (turmasLocal.length === 0) {
                        select.innerHTML = '<option value="">Nenhuma turma disponível</option>';
                    } else {
                        // Adicionar opção padrão
                        const defaultOption = document.createElement('option');
                        defaultOption.value = "";
                        defaultOption.textContent = "Selecione as turmas";
                        select.appendChild(defaultOption);
                        
                        // Adicionar cada turma como opção
                        turmasLocal.forEach(turma => {
                            if (!turma) return;
                            
                            const turmaId = String(turma.id_turma || turma.id || '');
                            if (!turmaId) return;
                            
                            const option = document.createElement('option');
                            option.value = turmaId;
                            option.textContent = `${turmaId} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                            
                            // Verificar se a turma está vinculada
                            if (turmasIds.includes(turmaId)) {
                                option.selected = true;
                                console.log(`Turma ${turmaId} selecionada do localStorage`);
                            }
                            
                            select.appendChild(option);
                        });
                    }
                    
                    console.log(`Select de turmas populado com ${turmasLocal.length} turmas do localStorage`);
                    
                    // Forçar atualização visual do select
                    select.style.display = 'none';
                    setTimeout(() => {
                        if (select && document.body.contains(select)) {
                            select.style.display = '';
                            
                            // Disparar evento change para atualizar quaisquer handlers dependentes
                            const changeEvent = new Event('change');
                            select.dispatchEvent(changeEvent);
                            
                            // Atualizar o preview de turmas vinculadas, se existir
                            if (typeof atualizarPreviewTurmasVinculadas === 'function') {
                                atualizarPreviewTurmasVinculadas();
                            } else {
                                console.error("Função atualizarPreviewTurmasVinculadas não encontrada");
                            }
                        }
                    }, 50);
                } catch (e) {
                    console.error('Erro ao carregar turmas do localStorage:', e);
                    if (select && document.body.contains(select)) {
                        select.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                        select.disabled = true;
                    }
                }
            });
    };
    
    // Verificar se o select existe
    const select = encontrarSelect();
    
    if (select) {
        console.log('Elemento select encontrado, carregando turmas...');
        carregarTurmas(select);
    } else {
        console.warn('Elemento select não encontrado, tentando novamente em 100ms...');
        
        // Tentar novamente após um pequeno delay (o modal pode não estar totalmente renderizado)
        let tentativas = 0;
        const maxTentativas = 10;
        
        const tentarNovamente = () => {
            const selectRetry = encontrarSelect();
            if (selectRetry) {
                console.log('Elemento select encontrado após retry');
                carregarTurmas(selectRetry);
            } else {
                tentativas++;
                if (tentativas < maxTentativas) {
                    console.warn(`Tentativa ${tentativas}/${maxTentativas}: Elemento select não encontrado, tentando novamente em 100ms...`);
                    setTimeout(tentarNovamente, 100);
                } else {
                    console.error(`Desistindo após ${maxTentativas} tentativas. Select não encontrado.`);
                    alert('Erro ao carregar turmas: elemento select não encontrado.');
                }
            }
        };
        
        setTimeout(tentarNovamente, 100);
    }
}

// Função de alias para manter compatibilidade
function editarDisciplina(disciplinaId) {
    console.log("Redirecionando para abrirModalEditarDisciplina", disciplinaId);
    abrirModalEditarDisciplina(disciplinaId);
}

// Implementar a função atualizarPreviewTurmasVinculadas que estava faltando
function atualizarPreviewTurmasVinculadas() {
    console.log("Atualizando preview de turmas vinculadas");
    
    // Obter o select de turmas
    const turmasSelect = document.getElementById('turmasDisciplina');
    if (!turmasSelect) {
        console.error("Select de turmas não encontrado");
        return;
    }
    
    // Obter turmas selecionadas - primeiro vamos tentar via selectedOptions
    let turmasSelecionadas = [];
    
    try {
        // Método 1: Usando selectedOptions
        turmasSelecionadas = Array.from(turmasSelect.selectedOptions || []).map(option => ({
            id: option.value,
            nome: option.textContent
        }));
    } catch (e) {
        console.warn("Erro ao usar selectedOptions, tentando alternativa:", e);
        
        // Método 2: Verificando cada opção manualmente
        turmasSelecionadas = Array.from(turmasSelect.options || [])
            .filter(option => option.selected)
            .map(option => ({
                id: option.value,
                nome: option.textContent
            }));
    }
    
    // Método 3: Se ainda não tiver nada, tentar obter via jQuery
    if (turmasSelecionadas.length === 0 && typeof $ === 'function') {
        try {
            const selectedValues = $(turmasSelect).val();
            if (Array.isArray(selectedValues) && selectedValues.length > 0) {
                console.log("Obtendo seleção via jQuery:", selectedValues);
                
                turmasSelecionadas = selectedValues.map(value => {
                    const option = Array.from(turmasSelect.options).find(opt => opt.value === value);
                    return {
                        id: value,
                        nome: option ? option.textContent : value
                    };
                });
            }
        } catch (e) {
            console.warn("Erro ao tentar obter seleção via jQuery:", e);
        }
    }
    
    console.log("Turmas selecionadas para preview:", turmasSelecionadas);
    
    // Obter a área de preview
    const previewArea = document.getElementById('turmas-vinculadas-preview');
    if (!previewArea) {
        console.error("Área de preview não encontrada");
        return;
    }
    
    // Limpar a área de preview
    previewArea.innerHTML = '';
    
    // Se não há turmas selecionadas, mostrar mensagem
    if (turmasSelecionadas.length === 0) {
        previewArea.innerHTML = '<div class="alert alert-info">Nenhuma turma selecionada</div>';
        return;
    }
    
    // Criar badges para cada turma selecionada
    const badgesHtml = turmasSelecionadas
        .filter(turma => turma && turma.nome) // Garantir que só turmas válidas sejam incluídas
        .map(turma => 
            `<span class="badge bg-primary me-1 mb-1">${turma.nome}</span>`
        ).join('');
    
    // Adicionar título e badges à área de preview
    previewArea.innerHTML = `
        <div class="mt-3">
            <h6>Turmas Vinculadas:</h6>
            <div class="turmas-badges">
                ${badgesHtml}
            </div>
        </div>
    `;
    
    console.log("Preview de turmas atualizado com sucesso");
}

// Função para resetar o formulário de disciplina
function resetarFormularioDisciplina() {
    console.log("Resetando formulário de disciplina");
    const formDisciplina = document.getElementById('formDisciplina');
    
    if (!formDisciplina) {
        console.error("Formulário de disciplina não encontrado para reset");
        return;
    }
    
    // Limpar campos
    formDisciplina.reset();
    
    // Resetar atributos data
    formDisciplina.removeAttribute('data-id');
    formDisciplina.setAttribute('data-mode', 'novo');
    
    // Limpar container de checkboxes se existir
    const checkboxContainer = document.getElementById('turmas-checkboxes');
    if (checkboxContainer) {
        checkboxContainer.innerHTML = '';
    }
    
    // Limpar select de turmas se existir
    const turmasSelect = document.getElementById('turmasDisciplina');
    if (turmasSelect) {
        // Verificar se é um select (elemento original) ou foi substituído
        if (turmasSelect.tagName === 'SELECT') {
            // Desmarcar todas as opções
            Array.from(turmasSelect.options).forEach(option => {
                option.selected = false;
            });
            
            // Disparar evento change
            const changeEvent = new Event('change');
            turmasSelect.dispatchEvent(changeEvent);
        }
    }
    
    // Limpar preview de turmas vinculadas
    const previewArea = document.getElementById('turmas-vinculadas-preview');
    if (previewArea) {
        previewArea.innerHTML = '';
    }
    
    console.log("Formulário de disciplina resetado com sucesso");
}
