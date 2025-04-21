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
                    fetch(CONFIG.getApiUrl('disciplinas'))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar disciplinas: ${response.statusText}`);
                            }
                            return response.json();
                        })
                        .then(disciplinasData => {
                            // Agora buscar professores
                            return fetch(CONFIG.getApiUrl('professores'))
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error(`Erro ao carregar professores: ${response.statusText}`);
                                    }
                                    return response.json();
                                })
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
    
    // Verificar se a função processarVinculosTurmas está definida
    if (typeof processarVinculosTurmas !== 'function') {
        console.error("A função processarVinculosTurmas não está definida. O módulo de disciplinas pode não funcionar corretamente.");
    } else {
        console.log("Função processarVinculosTurmas disponível para gerenciar vínculos com turmas");
    }
    
    // Obter elementos do DOM com os IDs corretos
    const formDisciplina = document.getElementById('form-disciplina');
    const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    const disciplinasLista = document.getElementById('disciplinas-lista');
    const vinculoTurmasSelect = document.getElementById('vinculo_turmas');
    const turmasVinculadasArea = document.getElementById('turmas-vinculadas-preview');
    
    console.log("Elementos do módulo de disciplinas:", {
        formDisciplina,
        btnNovaDisciplina,
        disciplinasLista,
        vinculoTurmasSelect,
        turmasVinculadasArea
    });
    
    if (!formDisciplina || !btnNovaDisciplina || !disciplinasLista) {
        console.warn("Elementos essenciais do módulo de disciplinas não encontrados");
        return;
    }
    
    // Adicionar botão de diagnóstico de API na parte superior do formulário
    const diagBtn = document.createElement('button');
    diagBtn.type = 'button';
    diagBtn.className = 'btn btn-sm btn-info mb-3';
    diagBtn.innerHTML = '<i class="fas fa-sync"></i> Testar API de Turmas';
    diagBtn.onclick = diagnosticarApiTurmas;
    
    if (formDisciplina.querySelector('.card-body')) {
        formDisciplina.querySelector('.card-body').prepend(diagBtn);
    }
    
    // Adicionar event listener ao botão para nova disciplina
    btnNovaDisciplina.addEventListener('click', function() {
        // Chamar a função para preparar o formulário para nova disciplina
        // Esta função já reseta o formulário, carrega as turmas e cuida do botão cancelar
        prepararFormularioDisciplina();
        
        // Rolar até o formulário
        formDisciplina.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Adicionar event listener ao formulário
    formDisciplina.addEventListener('submit', salvarDisciplina);
    
    // Adicionar event listener ao select de turmas para atualizar o preview
    if (vinculoTurmasSelect) {
        vinculoTurmasSelect.addEventListener('change', function() {
            console.log("Seleção de turmas alterada, atualizando preview");
            try {
                if (typeof atualizarPreviewTurmasVinculadas === 'function') {
                    atualizarPreviewTurmasVinculadas();
                }
            } catch (error) {
                console.error("Erro ao atualizar preview:", error);
            }
        });
    }
    
    // Inicializar o formulário logo no início
    prepararFormularioDisciplina();
    
    // Carregar lista de disciplinas
    carregarDisciplinas();
}

// Função para diagnosticar problemas com a API de turmas
function diagnosticarApiTurmas() {
    console.log("Iniciando diagnóstico de API de turmas");
    
    // Criar container de diagnóstico
    const diagContainer = document.createElement('div');
    diagContainer.className = 'alert alert-info';
    diagContainer.innerHTML = '<p><strong>Diagnóstico da API de Turmas</strong></p><div id="diag-result">Testando conexão...</div>';
    
    // Adicionar ao formulário
    const formBody = document.querySelector('#form-disciplina .card-body');
    if (formBody) {
        // Remover diagnóstico anterior se existir
        const oldDiag = formBody.querySelector('#api-diag-container');
        if (oldDiag) oldDiag.remove();
        
        // Adicionar novo container de diagnóstico
        diagContainer.id = 'api-diag-container';
        formBody.insertBefore(diagContainer, formBody.firstChild.nextSibling);
    }
    
    const resultDiv = diagContainer.querySelector('#diag-result');
    
    // Testar conexão com várias URLs da API
    const urls = [
        { url: CONFIG.getApiUrl('/turmas'), name: 'API configurada' },
        { url: 'http://localhost:4000/api/turmas', name: 'API local' },
        { url: '/api/turmas', name: 'API relativa' }
    ];
    
    // Adicionar loading para cada url
    urls.forEach(endpoint => {
        resultDiv.innerHTML += `<p data-url="${endpoint.url}"><strong>${endpoint.name}:</strong> <span class="loading">Testando...</span></p>`;
    });
    
    // Testar cada URL
    urls.forEach(endpoint => {
        const statusSpan = resultDiv.querySelector(`p[data-url="${endpoint.url}"] span`);
        
        fetch(endpoint.url)
            .then(response => {
                statusSpan.className = response.ok ? 'text-success' : 'text-warning';
                statusSpan.textContent = `Status: ${response.status} ${response.statusText}`;
                
                if (response.ok) {
                    return response.json().then(data => {
                        if (data && Array.isArray(data)) {
                            statusSpan.textContent += ` (${data.length} turmas encontradas)`;
                            
                            // Se for a primeira URL bem-sucedida, recarregar o select
                            const select = document.getElementById('vinculo_turmas');
                            if (select) {
                                select.innerHTML = '<option value="">Carregando turmas...</option>';
                                
                                // Recarregar turmas usando esta URL
                                fetch(endpoint.url)
                                    .then(r => r.json())
                                    .then(turmas => {
                                        // Processar turmas e preencher o select
                                        select.innerHTML = '';
                                        
                                        if (turmas && turmas.length > 0) {
                                            turmas.forEach(turma => {
                                                const option = document.createElement('option');
                                                option.value = turma.id_turma;
                                                option.textContent = `${turma.id_turma} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                                                select.appendChild(option);
                                            });
                                            
                                            statusSpan.textContent += ' ✓ Turmas carregadas!';
                                        } else {
                                            select.innerHTML = '<option value="">Nenhuma turma disponível</option>';
                                        }
                                    });
                            }
                        } else {
                            statusSpan.textContent += ' (resposta válida, mas formato inesperado)';
                        }
                    });
                }
            })
            .catch(error => {
                statusSpan.className = 'text-danger';
                statusSpan.textContent = `Erro: ${error.message}`;
            });
    });
    
    // Adicionar botão para forçar tentativa de carregamento
    const reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.className = 'btn btn-sm btn-warning mt-2';
    reloadBtn.textContent = 'Forçar carregamento de turmas';
    reloadBtn.onclick = () => {
        document.getElementById('vinculo_turmas').innerHTML = '<option value="">Carregando turmas...</option>';
        carregarTurmasSelect([]);
    };
    
    resultDiv.appendChild(document.createElement('hr'));
    resultDiv.appendChild(reloadBtn);
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
            
            // Função para verificar disciplinas e criar vínculos
            function verificarDisciplinasECriarVinculos(idProf, disciplinas) {
                if (disciplinas.length === 0) {
                    console.log("Nenhuma disciplina selecionada, não há vínculos para criar.");
                    return Promise.resolve();
                }
                
                // Primeiro verificar quais disciplinas têm turmas vinculadas
                const promessasVerificacao = disciplinas.map(idDisciplina => {
                    return fetch(CONFIG.getApiUrl(`disciplinas/${idDisciplina}/turmas`)) // Removida a barra no início
                        .then(response => response.ok ? response.json() : [])
                        .then(turmas => {
                            return {
                                idDisciplina,
                                temTurmas: turmas && turmas.length > 0,
                                turmas: turmas || []
                            };
                        })
                        .catch(error => {
                            console.error(`Erro ao verificar turmas da disciplina ${idDisciplina}:`, error);
                            return {
                                idDisciplina,
                                temTurmas: false,
                                turmas: [],
                                erro: true
                            };
                        });
                });
                
                return Promise.all(promessasVerificacao)
                    .then(resultados => {
                        console.log("Resultado da verificação de disciplinas:", resultados);
                        
                        // Verificar disciplinas sem turmas
                        const disciplinasSemTurmas = resultados.filter(r => !r.temTurmas).map(r => r.idDisciplina);
                        
                        if (disciplinasSemTurmas.length > 0) {
                            // Mostrar mensagem sobre disciplinas sem turmas
                            const mensagem = `ATENÇÃO: As disciplinas ${disciplinasSemTurmas.join(', ')} não possuem turmas vinculadas. É necessário vincular turmas a essas disciplinas no módulo de Disciplinas primeiro. Apenas as disciplinas com turmas serão vinculadas.`;
                            console.warn(mensagem);
                            alert(mensagem);
                        }
                        
                        // Filtrar apenas disciplinas com turmas para vincular
                        const disciplinasComTurmas = resultados.filter(r => r.temTurmas).map(r => r.idDisciplina);
                        
                        if (disciplinasComTurmas.length === 0) {
                            console.log("Nenhuma disciplina selecionada tem turmas. Não serão criados vínculos.");
                            return Promise.resolve();
                        }
                        
                        // Função para criar vínculos para cada disciplina
                        function criarVinculos(disciplinasParaVincular) {
                            const promessasVinculos = disciplinasParaVincular.map(idDisciplina => {
                                // Implementação do vínculo para cada disciplina
                                return Promise.resolve(idDisciplina);
                            });
                            return Promise.all(promessasVinculos);
                        }
                        
                        return criarVinculos(disciplinasComTurmas);
                    });
            }
        });
    }
}


