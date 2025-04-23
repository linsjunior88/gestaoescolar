// Funções para gerenciamento de filtros no módulo de notas
// Este arquivo deve ser incluído após dashboard.js

// Inicializar filtros assim que o documento for carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Verificando presença da seção de notas");
    
    // Verificar se estamos na página de notas
    if (document.querySelector('#conteudo-notas')) {
        console.log("Seção de notas encontrada, inicializando filtros");
        inicializarFiltrosNotas();
    }
});

// Se a página já estiver carregada, executar imediatamente
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        console.log("Verificando presença da seção de notas (documento já carregado)");
        
        // Verificar se estamos na página de notas
        if (document.querySelector('#conteudo-notas')) {
            console.log("Seção de notas encontrada, inicializando filtros");
            inicializarFiltrosNotas();
        }
    }, 500);
}

// Adicionar event listener para capturar quando a seção de notas é ativada
document.addEventListener('click', function(e) {
    if (e.target.matches('#notas-link') || e.target.closest('#notas-link')) {
        console.log("Clique no link de notas detectado");
        
        // Usar um temporizador maior para garantir que os elementos estejam disponíveis
        setTimeout(function() {
            const conteudoNotas = document.querySelector('#conteudo-notas');
            console.log("Verificando se a seção de notas está ativa:", !!conteudoNotas, conteudoNotas ? conteudoNotas.classList.contains('active') : false);
            
            if (conteudoNotas && (conteudoNotas.classList.contains('active') || getComputedStyle(conteudoNotas).display !== 'none')) {
                console.log("Seção de notas ativada, inicializando filtros");
                inicializarFiltrosNotas();
                
                // Verificar novamente após intervalos maiores para garantir o carregamento
                setTimeout(verificarCarregamentoFiltros, 500);
                setTimeout(verificarCarregamentoFiltros, 1000);
                setTimeout(verificarCarregamentoFiltros, 2000);
            }
        }, 200);
    }
});

// Função principal para inicializar todos os filtros
function inicializarFiltrosNotas() {
    console.log("Inicializando filtros do módulo de notas", new Date().toISOString());
    
    // Corrigir o formulário para evitar submit padrão
    corrigirFormularioNotas();
    
    // Carregar os filtros
    carregarFiltroAnos();
    carregarFiltroBimestres();
    carregarFiltroTurmas();
    
    // Inicializar selects de formulário
    carregarFormularioAnos();
    carregarFormularioBimestres();
    carregarFormularioTurmas();
    
    // Adicionar eventos para os filtros e botões
    adicionarEventosFiltros();
    adicionarEventosFormulario();
    
    // Verificar carregamento após um tempo
    setTimeout(verificarCarregamentoFiltros, 1000);
    
    // CORREÇÃO: Aplicar filtros após a inicialização completa
    setTimeout(function() {
        // Verificar se há filtros salvos na sessão e aplicá-los
        const turma = sessionStorage.getItem('filtroNotas_turma');
        const disciplina = sessionStorage.getItem('filtroNotas_disciplina');
        
        if (turma || disciplina) {
            console.log("Aplicando filtros salvos na sessão");
            aplicarFiltros();
        }
    }, 2000);
}

// Carregar anos nos filtros (2025 a 2030)
function carregarFiltroAnos() {
    const filtroAno = document.getElementById('filtro-ano');
    if (!filtroAno) {
        console.error("Elemento filtro-ano não encontrado");
        return;
    }
    
    console.log("Carregando anos para filtro");
    filtroAno.innerHTML = '<option value="">Todos os anos</option>';
    
    // Adicionar anos de 2025 a 2030
    for (let ano = 2025; ano <= 2030; ano++) {
        const option = document.createElement('option');
        option.value = ano.toString();
        option.textContent = ano.toString();
        filtroAno.appendChild(option);
    }
}

// Carregar bimestres nos filtros (1 a 4)
function carregarFiltroBimestres() {
    const filtroBimestre = document.getElementById('filtro-bimestre');
    if (!filtroBimestre) {
        console.error("Elemento filtro-bimestre não encontrado");
        return;
    }
    
    console.log("Carregando bimestres para filtro");
    filtroBimestre.innerHTML = '<option value="">Todos os bimestres</option>';
    
    // Adicionar bimestres de 1 a 4
    for (let bimestre = 1; bimestre <= 4; bimestre++) {
        const option = document.createElement('option');
        option.value = bimestre.toString();
        option.textContent = `${bimestre}º Bimestre`;
        filtroBimestre.appendChild(option);
    }
}

// Carregar turmas nos filtros
function carregarFiltroTurmas() {
    const filtroTurma = document.getElementById('filtro-turma');
    if (!filtroTurma) {
        console.error("Elemento filtro-turma não encontrado");
        return;
    }
    
    console.log("Carregando turmas para filtro");
    filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
    
    // Adicionar indicador de carregamento
    const optionCarregando = document.createElement('option');
    optionCarregando.disabled = true;
    optionCarregando.textContent = "Carregando...";
    filtroTurma.appendChild(optionCarregando);
    
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            return response.json();
        })
        .then(turmas => {
            // Remover opção "Carregando..."
            filtroTurma.removeChild(optionCarregando);
            
            console.log("Turmas carregadas para filtro:", turmas.length);
            
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id_turma;
                option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem nome'}`;
                filtroTurma.appendChild(option);
            });
            
            // Forçar carregamento de disciplinas e alunos também
            if (turmas.length > 0) {
                const primeiraTurma = turmas[0].id_turma;
                carregarFiltroDisciplinas(primeiraTurma);
                carregarFiltroAlunos(primeiraTurma, null);
            }
        })
        .catch(error => {
            console.error("Erro ao carregar turmas para filtro:", error);
            filtroTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        });
}

// Carregar disciplinas nos filtros com base na turma selecionada
function carregarFiltroDisciplinas(idTurma) {
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    if (!filtroDisciplina) {
        console.error("Elemento filtro-disciplina não encontrado");
        return;
    }
    
    console.log("Carregando disciplinas para filtro", idTurma ? `da turma ${idTurma}` : "");
    filtroDisciplina.innerHTML = '<option value="">Todas as disciplinas</option>';
    
    if (!idTurma) {
        // Se não há turma selecionada, carrega todas as disciplinas
        fetch(CONFIG.getApiUrl('/disciplinas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
                }
                return response.json();
            })
            .then(disciplinas => {
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina;
                    option.textContent = disciplina.nome_disciplina;
                    filtroDisciplina.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar disciplinas para filtro:", error);
                filtroDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            });
    } else {
        // Método mais direto para buscar disciplinas por turma
        console.log(`Buscando disciplinas vinculadas à turma ${idTurma}`);
        
        // Primeiro tentar buscar disciplinas-turmas diretamente
        fetch(CONFIG.getApiUrl('/disciplinas-turmas'))
            .then(response => {
                // Se esse endpoint não existir, vamos tentar outra abordagem
                if (!response.ok && response.status === 404) {
                    console.log("Endpoint /disciplinas-turmas não encontrado, tentando método alternativo");
                    return Promise.reject("endpoint_not_found");
                }
                return response.json();
            })
            .then(vinculos => {
                console.log("Vínculos disciplinas-turmas encontrados:", vinculos.length);
                
                // Filtrar vínculos pela turma selecionada
                const vinculosDaTurma = vinculos.filter(v => 
                    v.id_turma === idTurma || 
                    (v.turma && v.turma.id_turma === idTurma)
                );
                
                console.log(`Vínculos para a turma ${idTurma}:`, vinculosDaTurma.length);
                
                // Se encontrou vínculos, buscar detalhes das disciplinas
                if (vinculosDaTurma.length > 0) {
                    // Extrair IDs das disciplinas
                    const idsDisciplinas = vinculosDaTurma.map(v => 
                        v.id_disciplina || (v.disciplina && v.disciplina.id_disciplina)
                    ).filter(id => id); // Remover valores undefined/null
                    
                    // Buscar detalhes de todas as disciplinas e filtrar
                    return fetch(CONFIG.getApiUrl('/disciplinas'))
                        .then(response => response.json())
                        .then(disciplinas => {
                            return disciplinas.filter(d => idsDisciplinas.includes(d.id_disciplina));
                        });
                }
                return [];
            })
            .catch(error => {
                // Se o primeiro método falhou, tentar o método alternativo
                if (error === "endpoint_not_found") {
                    console.log("Tentando buscar todas as disciplinas e filtrar");
                    
                    return fetch(CONFIG.getApiUrl('/disciplinas'))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(disciplinas => {
                            console.log(`Total de disciplinas encontradas: ${disciplinas.length}`);
                            
                            // Método detalhado para verificar turmas vinculadas
                            const disciplinasFiltradas = disciplinas.filter(disciplina => {
                                if (!disciplina) return false;
                                
                                // Verificar se a disciplina tem turmas
                                if (disciplina.turmas) {
                                    // Verificar formato array
                                    if (Array.isArray(disciplina.turmas)) {
                                        for (const turma of disciplina.turmas) {
                                            if (turma === idTurma || (turma && turma.id_turma === idTurma)) {
                                                return true;
                                            }
                                        }
                                    } 
                                    // Verificar formato objeto
                                    else if (typeof disciplina.turmas === 'object') {
                                        for (const key in disciplina.turmas) {
                                            const turma = disciplina.turmas[key];
                                            if (turma === idTurma || (turma && turma.id_turma === idTurma)) {
                                                return true;
                                            }
                                        }
                                    }
                                }
                                
                                // Verificar outro formato possível
                                if (disciplina.id_turma && disciplina.id_turma === idTurma) {
                                    return true;
                                }
                                
                                return false;
                            });
                            
                            return disciplinasFiltradas;
                        });
                } else {
                    throw error;
                }
            })
            .then(disciplinasFiltradas => {
                console.log(`Disciplinas filtradas para turma ${idTurma}:`, disciplinasFiltradas ? disciplinasFiltradas.length : 0);
                
                // Se não encontrou disciplinas pelo método automático, tentar associação manual
                if (!disciplinasFiltradas || disciplinasFiltradas.length === 0) {
                    console.log("Nenhuma disciplina encontrada para esta turma via API, tentando mapeamento manual");
                    
                    // CORREÇÃO: Mapeamento manual corrigido - removido CIE da turma 3A conforme relatado
                    const mapeamentoTurmaDisciplina = {
                        '1A': ['PORT', 'MAT', 'CIE', 'HIST', 'GEO'],
                        '2A': ['PORT', 'MAT', 'CIE', 'HIST', 'GEO'],
                        '3A': ['PORT', 'MAT', 'HIST', 'GEO', 'ING'], // Removido 'CIE' conforme relatado
                        '1B': ['PORT', 'MAT', 'CIE', 'HIST'],
                        '2B': ['PORT', 'MAT', 'CIE', 'HIST'],
                        '13CM': ['PORT', 'MAT', 'ING', 'ART', 'REL']
                    };
                    
                    // Se a turma estiver no mapeamento, usar estas disciplinas
                    if (mapeamentoTurmaDisciplina[idTurma]) {
                        const idsDisciplinas = mapeamentoTurmaDisciplina[idTurma];
                        console.log(`Usando mapeamento manual para turma ${idTurma}:`, idsDisciplinas);
                        
                        return fetch(CONFIG.getApiUrl('/disciplinas'))
                            .then(response => response.json())
                            .then(disciplinas => {
                                return disciplinas.filter(d => 
                                    idsDisciplinas.includes(d.id_disciplina)
                                );
                            });
                    }
                    
                    return disciplinasFiltradas || [];
                }
                
                return disciplinasFiltradas;
            })
            .then(disciplinasFiltradas => {
                if (!disciplinasFiltradas || disciplinasFiltradas.length === 0) {
                    console.log(`Nenhuma disciplina encontrada para turma ${idTurma}`);
                    return;
                }
                
                // Ordenar disciplinas por nome
                disciplinasFiltradas.sort((a, b) => {
                    return (a.nome_disciplina || "").localeCompare(b.nome_disciplina || "");
                });
                
                disciplinasFiltradas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina;
                    option.textContent = disciplina.nome_disciplina;
                    filtroDisciplina.appendChild(option);
                });
            })
            .catch(error => {
                console.error(`Erro ao carregar disciplinas para turma ${idTurma}:`, error);
                filtroDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            });
    }
}

// Carregar alunos nos filtros com base na turma e/ou disciplina selecionada
function carregarFiltroAlunos(idTurma, idDisciplina) {
    const filtroAluno = document.getElementById('filtro-aluno');
    if (!filtroAluno) {
        console.error("Elemento filtro-aluno não encontrado");
        return;
    }
    
    console.log("Carregando alunos para filtro", 
               idTurma ? `da turma ${idTurma}` : "", 
               idDisciplina ? `e disciplina ${idDisciplina}` : "");
    
    filtroAluno.innerHTML = '<option value="">Todos os alunos</option>';
    
    if (!idTurma) {
        // Se não há turma selecionada, carrega todos os alunos
        fetch(CONFIG.getApiUrl('/alunos'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar alunos: ${response.status}`);
                }
                return response.json();
            })
            .then(alunos => {
                // Remover duplicados pelo ID
                const idsAlunos = new Set();
                const alunosSemDuplicatas = alunos.filter(aluno => {
                    if (idsAlunos.has(aluno.id_aluno)) {
                        return false;
                    }
                    idsAlunos.add(aluno.id_aluno);
                    return true;
                });
                
                // Ordenar alunos por nome
                alunosSemDuplicatas.sort((a, b) => (a.nome_aluno || "").localeCompare(b.nome_aluno || ""));
                
                alunosSemDuplicatas.forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.id_aluno;
                    option.textContent = `${aluno.nome_aluno} (${aluno.id_turma})`;
                    filtroAluno.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar alunos para filtro:", error);
                filtroAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            });
    } else {
        // Buscar alunos da turma específica
        fetch(CONFIG.getApiUrl('/alunos'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar alunos: ${response.status}`);
                }
                return response.json();
            })
            .then(alunos => {
                // Filtrar alunos pela turma e remover duplicados
                const alunosFiltrados = alunos.filter(aluno => aluno.id_turma === idTurma);
                
                // Criar um conjunto de IDs para identificar duplicatas
                const idsAlunos = new Set();
                const alunosSemDuplicatas = alunosFiltrados.filter(aluno => {
                    if (idsAlunos.has(aluno.id_aluno)) {
                        return false; // Aluno já encontrado, não adicionar novamente
                    }
                    idsAlunos.add(aluno.id_aluno);
                    return true;
                });
                
                console.log(`Alunos filtrados para turma ${idTurma}:`, alunosSemDuplicatas.length);
                
                // Ordenar alunos por nome
                alunosSemDuplicatas.sort((a, b) => (a.nome_aluno || "").localeCompare(b.nome_aluno || ""));
                
                alunosSemDuplicatas.forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.id_aluno;
                    option.textContent = aluno.nome_aluno;
                    filtroAluno.appendChild(option);
                });
            })
            .catch(error => {
                console.error(`Erro ao carregar alunos da turma ${idTurma} para filtro:`, error);
                filtroAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            });
    }
}

// Adicionar eventos para os filtros
function adicionarEventosFiltros() {
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const btnFiltrar = document.getElementById('btn-filtrar');
    const btnCalcularMedias = document.getElementById('btn-calcular-medias');
    
    // Eventos para os filtros relacionados
    if (filtroTurma) {
        filtroTurma.addEventListener('change', function() {
            carregarFiltroDisciplinas(this.value);
            carregarFiltroAlunos(this.value, null);
            
            // CORREÇÃO: Aplica o filtro automaticamente quando a turma é alterada
            // Isso garante que o valor da turma seja sempre respeitado
            setTimeout(() => aplicarFiltros(), 500);
        });
    }
    
    if (filtroDisciplina) {
        filtroDisciplina.addEventListener('change', function() {
            if (filtroTurma && filtroTurma.value) {
                carregarFiltroAlunos(filtroTurma.value, this.value);
                
                // CORREÇÃO: Aplica o filtro automaticamente quando a disciplina é alterada
                setTimeout(() => aplicarFiltros(), 500);
            }
        });
    }
    
    // Evento para o botão de filtrar
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function() {
            aplicarFiltros();
        });
    }
    
    // Evento para o botão de calcular médias
    if (btnCalcularMedias) {
        btnCalcularMedias.addEventListener('click', function() {
            calcularMediasFinais();
        });
    }
}

// Função para aplicar filtros e buscar notas - versão aprimorada
function aplicarFiltros() {
    console.log("Aplicando filtros de notas");
    
    // Obter valores dos filtros
    const filtroAno = document.getElementById('filtro-ano');
    const filtroBimestre = document.getElementById('filtro-bimestre');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroAluno = document.getElementById('filtro-aluno');
    
    // CORREÇÃO: Armazenar valores de filtro selecionados em variáveis de sessão
    // para preservar o estado entre interações
    const ano = filtroAno ? filtroAno.value : '';
    const bimestre = filtroBimestre ? filtroBimestre.value : '';
    const turma = filtroTurma ? filtroTurma.value : '';
    const disciplina = filtroDisciplina ? filtroDisciplina.value : '';
    const aluno = filtroAluno ? filtroAluno.value : '';
    
    // Armazenar filtros aplicados na sessão
    sessionStorage.setItem('filtroNotas_ano', ano);
    sessionStorage.setItem('filtroNotas_bimestre', bimestre);
    sessionStorage.setItem('filtroNotas_turma', turma);
    sessionStorage.setItem('filtroNotas_disciplina', disciplina);
    sessionStorage.setItem('filtroNotas_aluno', aluno);
    
    console.log("Filtros aplicados:", { ano, bimestre, turma, disciplina, aluno });
    
    // Primeiro buscar todas as notas e filtrar manualmente
    fetch(CONFIG.getApiUrl('/notas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar notas: ${response.status}`);
            }
            return response.json();
        })
        .then(notas => {
            console.log("Total de notas recebidas:", notas.length);
            
            // Garantir que todos os valores de comparação sejam strings
            const anoStr = String(ano);
            const bimestreStr = String(bimestre);
            const turmaStr = String(turma);
            const disciplinaStr = String(disciplina);
            const alunoStr = String(aluno);
            
            // CORREÇÃO: Log detalhado para ajudar no debug
            console.log("Valores de filtro em formato string:", {
                anoStr, bimestreStr, turmaStr, disciplinaStr, alunoStr
            });
            
            // Filtrar notas manualmente baseado nos critérios selecionados
            const notasFiltradas = notas.filter(nota => {
                // Converter valores da nota para string para garantir comparação consistente
                const notaAnoStr = String(nota.ano || '');
                const notaBimestreStr = String(nota.bimestre || '');
                const notaTurmaStr = String(nota.id_turma || '');
                const notaDisciplinaStr = String(nota.id_disciplina || '');
                const notaAlunoStr = String(nota.id_aluno || '');
                
                // CORREÇÃO: Log para debug quando a turma não corresponde
                if (turmaStr && notaTurmaStr !== turmaStr) {
                    console.log(`Nota removida do filtro - turma esperada: ${turmaStr}, turma da nota: ${notaTurmaStr}`, nota);
                    return false;
                }
                
                // Verificar cada critério
                if (anoStr && notaAnoStr !== anoStr) {
                    return false;
                }
                
                if (bimestreStr && notaBimestreStr !== bimestreStr) {
                    return false;
                }
                
                // CORREÇÃO: A verificação de turma agora está no início, mais importante
                
                if (disciplinaStr && notaDisciplinaStr !== disciplinaStr) {
                    return false;
                }
                
                if (alunoStr && notaAlunoStr !== alunoStr) {
                    return false;
                }
                
                return true;
            });
            
            console.log("Notas após filtragem:", notasFiltradas.length);
            
            // Exibir as notas filtradas
            mostrarNotasFiltradas(notasFiltradas);
        })
        .catch(error => {
            console.error("Erro ao aplicar filtros:", error);
            alert(`Erro ao aplicar filtros: ${error.message}`);
        });
}

// Função para mostrar as notas filtradas
function mostrarNotasFiltradas(notas) {
    const tabelaNotas = document.getElementById('notas-lista') || document.querySelector('.notas-table tbody');
    if (!tabelaNotas) {
        console.error("Tabela de notas não encontrada!");
        return;
    }
    
    // Limpar tabela
    tabelaNotas.innerHTML = '';
    
    if (notas.length === 0) {
        tabelaNotas.innerHTML = `
            <tr class="text-center">
                <td colspan="10">Nenhuma nota encontrada com os filtros aplicados</td>
            </tr>
        `;
        return;
    }
    
    // Precisamos buscar informações adicionais
    Promise.all([
        fetch(CONFIG.getApiUrl('/alunos')).then(r => r.ok ? r.json() : []),
        fetch(CONFIG.getApiUrl('/disciplinas')).then(r => r.ok ? r.json() : []),
        fetch(CONFIG.getApiUrl('/turmas')).then(r => r.ok ? r.json() : [])
    ])
    .then(([alunos, disciplinas, turmas]) => {
        console.log("Dados auxiliares carregados:", {
            alunos: alunos.length,
            disciplinas: disciplinas.length,
            turmas: turmas.length
        });
        
        // Funções auxiliares para obter nomes e verificar dados
        const getNomeAluno = (id) => {
            const idStr = String(id || '');
            const aluno = alunos.find(a => String(a.id_aluno) === idStr);
            return aluno ? aluno.nome_aluno : `Aluno ${id}`;
        };
        
        const getNomeDisciplina = (id) => {
            const idStr = String(id || '');
            const disciplina = disciplinas.find(d => String(d.id_disciplina) === idStr);
            return disciplina ? disciplina.nome_disciplina : `Disciplina ${id}`;
        };
        
        const getNomeTurma = (id) => {
            const idStr = String(id || '');
            const turma = turmas.find(t => String(t.id_turma) === idStr);
            return turma ? `${turma.id_turma} - ${turma.serie || ''}` : id;
        };
        
        const getTurmaPorAluno = (idAluno) => {
            const idStr = String(idAluno || '');
            const aluno = alunos.find(a => String(a.id_aluno) === idStr);
            return aluno ? aluno.id_turma : null;
        };
        
        // CORREÇÃO: Sistema melhorado de detecção de duplicatas
        // Eliminar duplicatas baseadas na combinação de aluno, disciplina, bimestre e ano
        const notasUnicas = [];
        const jaAdicionadas = new Set();
        
        console.log("Processando notas para remover duplicatas:", notas.length);
        
        // Primeiro passo: corrigir as turmas das notas
        const notasCorrigidas = notas.map(nota => {
            // Criar uma cópia para não modificar o objeto original
            const notaCorrigida = { ...nota };
            
            // Verificar se a nota está consistente com a turma do aluno
            const turmaAluno = getTurmaPorAluno(notaCorrigida.id_aluno);
            
            // Se temos a turma do aluno e ela não bate com a turma da nota, corrigir
            if (turmaAluno && (!notaCorrigida.id_turma || notaCorrigida.id_turma !== turmaAluno)) {
                console.log(`Corrigindo turma da nota: aluno ${notaCorrigida.id_aluno} (${getNomeAluno(notaCorrigida.id_aluno)}) está na turma ${turmaAluno}, mas a nota indica turma ${notaCorrigida.id_turma}`);
                notaCorrigida.id_turma = turmaAluno;
            }
            
            return notaCorrigida;
        });
        
        // Segundo passo: remover duplicatas com chave única mais específica
        notasCorrigidas.forEach(nota => {
            // CORREÇÃO: Criar uma chave única mais específica para cada nota
            const chaveUnica = `${nota.id_aluno}-${nota.id_disciplina}-${nota.bimestre}-${nota.ano}-${nota.id_turma}`;
            
            if (!jaAdicionadas.has(chaveUnica)) {
                notasUnicas.push(nota);
                jaAdicionadas.add(chaveUnica);
            } else {
                console.log(`Nota duplicada removida: ${chaveUnica}`);
            }
        });
        
        console.log(`Removidas ${notas.length - notasUnicas.length} notas duplicadas`);
        
        // Obter os filtros aplicados
        const filtroTurma = document.getElementById('filtro-turma');
        const filtroDisciplina = document.getElementById('filtro-disciplina');
        const turmaFiltrada = filtroTurma && filtroTurma.value ? String(filtroTurma.value) : '';
        const disciplinaFiltrada = filtroDisciplina && filtroDisciplina.value ? String(filtroDisciplina.value) : '';
        
        // CORREÇÃO: Verificação de consistência dos filtros
        console.log(`Verificando consistência com filtros - Turma: ${turmaFiltrada}, Disciplina: ${disciplinaFiltrada}`);
        
        // Aplicar filtro adicional para garantir que estamos exibindo apenas notas da turma selecionada
        const notasFiltradas = notasUnicas.filter(nota => {
            if (turmaFiltrada && String(nota.id_turma) !== turmaFiltrada) {
                console.log(`Nota excluída por filtro adicional - turma esperada: ${turmaFiltrada}, turma da nota: ${nota.id_turma}`);
                return false;
            }
            
            if (disciplinaFiltrada && String(nota.id_disciplina) !== disciplinaFiltrada) {
                console.log(`Nota excluída por filtro adicional - disciplina esperada: ${disciplinaFiltrada}, disciplina da nota: ${nota.id_disciplina}`);
                return false;
            }
            
            return true;
        });
        
        if (turmaFiltrada || disciplinaFiltrada) {
            console.log(`Filtro adicional aplicado - turma: ${turmaFiltrada}, disciplina: ${disciplinaFiltrada}`);
            console.log(`Notas após filtro adicional: ${notasFiltradas.length} (de ${notasUnicas.length})`);
        }
        
        // Ordenar notas
        notasFiltradas.sort((a, b) => {
            const nomeAlunoA = getNomeAluno(a.id_aluno);
            const nomeAlunoB = getNomeAluno(b.id_aluno);
            
            if (nomeAlunoA !== nomeAlunoB) {
                return nomeAlunoA.localeCompare(nomeAlunoB);
            }
            
            if (a.id_disciplina !== b.id_disciplina) {
                return getNomeDisciplina(a.id_disciplina).localeCompare(getNomeDisciplina(b.id_disciplina));
            }
            
            if (a.bimestre !== b.bimestre) {
                return parseInt(a.bimestre) - parseInt(b.bimestre);
            }
            
            return 0;
        });
        
        // CORREÇÃO: Log de sanidade para garantir que as notas estão corretas
        console.log("Notas após processamento completo:", notasFiltradas.length);
        
        // Adicionar cada nota à tabela
        notasFiltradas.forEach(nota => {
            const tr = document.createElement('tr');
            
            // Determinar classe CSS para colorir a linha baseado na nota
            const valor = parseFloat(nota.valor || nota.media || 0);
            if (valor >= 6.0) {
                tr.classList.add('table-success');
            } else if (valor >= 4.0) {
                tr.classList.add('table-warning');
            } else {
                tr.classList.add('table-danger');
            }
            
            // CORREÇÃO: Garantir que os dados estejam nas colunas corretas
            tr.innerHTML = `
                <td>${nota.ano || '-'}</td>
                <td>${nota.bimestre}º Bimestre</td>
                <td>${getNomeTurma(nota.id_turma)}</td>
                <td>${getNomeDisciplina(nota.id_disciplina)}</td>
                <td>${getNomeAluno(nota.id_aluno)}</td>
                <td>${nota.nota_mensal || '-'}</td>
                <td>${nota.nota_bimestral || '-'}</td>
                <td>${nota.recuperacao || '-'}</td>
                <td>${nota.valor || nota.media || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-nota me-1" data-id="${nota.id_nota || `${nota.id_aluno}-${nota.id_disciplina}-${nota.bimestre}-${nota.ano}`}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-nota" data-id="${nota.id_nota || `${nota.id_aluno}-${nota.id_disciplina}-${nota.bimestre}-${nota.ano}`}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tabelaNotas.appendChild(tr);
        });
        
        // Adicionar eventos aos botões
        document.querySelectorAll('.editar-nota').forEach(btn => {
            btn.addEventListener('click', function() {
                const idNota = this.getAttribute('data-id');
                if (typeof editarNota === 'function') {
                    editarNota(idNota);
                } else {
                    console.error("Função editarNota não encontrada");
                    alert("Edição de notas não implementada");
                }
            });
        });
        
        document.querySelectorAll('.excluir-nota').forEach(btn => {
            btn.addEventListener('click', function() {
                const idNota = this.getAttribute('data-id');
                if (typeof excluirNota === 'function') {
                    excluirNota(idNota);
                } else {
                    console.error("Função excluirNota não encontrada");
                    alert("Exclusão de notas não implementada");
                }
            });
        });
    })
    .catch(error => {
        console.error("Erro ao mostrar notas filtradas:", error);
        tabelaNotas.innerHTML = `
            <tr class="text-center">
                <td colspan="10">Erro ao mostrar notas: ${error.message}</td>
            </tr>
        `;
    });
}

// Função para calcular médias finais
function calcularMediasFinais() {
    console.log("Calculando médias finais");
    alert("Cálculo de médias finais em desenvolvimento");
}

// Funções para carregar os selects do formulário de notas

// Carregar anos no formulário (2025 a 2030)
function carregarFormularioAnos() {
    const selectAnoNota = document.getElementById('ano_nota');
    if (!selectAnoNota) {
        console.error("Elemento ano_nota não encontrado");
        return;
    }
    
    console.log("Carregando anos para formulário");
    selectAnoNota.innerHTML = '<option value="" selected disabled>Selecione o ano</option>';
    
    // Adicionar anos de 2025 a 2030
    for (let ano = 2025; ano <= 2030; ano++) {
        const option = document.createElement('option');
        option.value = ano.toString();
        option.textContent = ano.toString();
        selectAnoNota.appendChild(option);
    }
}

// Carregar bimestres no formulário (1 a 4)
function carregarFormularioBimestres() {
    const selectBimestreNota = document.getElementById('bimestre');
    if (!selectBimestreNota) {
        console.error("Elemento bimestre não encontrado");
        return;
    }
    
    console.log("Carregando bimestres para formulário");
    selectBimestreNota.innerHTML = '<option value="" selected disabled>Selecione o bimestre</option>';
    
    // Adicionar bimestres de 1 a 4
    for (let bimestre = 1; bimestre <= 4; bimestre++) {
        const option = document.createElement('option');
        option.value = bimestre.toString();
        option.textContent = `${bimestre}º Bimestre`;
        selectBimestreNota.appendChild(option);
    }
}

// Carregar turmas no formulário
function carregarFormularioTurmas() {
    const selectTurmaNota = document.getElementById('turma_nota');
    if (!selectTurmaNota) {
        console.error("Elemento turma_nota não encontrado");
        return;
    }
    
    console.log("Carregando turmas para formulário");
    selectTurmaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma</option>';
    
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            return response.json();
        })
        .then(turmas => {
            console.log("Turmas carregadas para formulário:", turmas.length);
            
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id_turma;
                option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem nome'}`;
                selectTurmaNota.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas para formulário:", error);
            selectTurmaNota.innerHTML = '<option value="" disabled>Erro ao carregar turmas</option>';
        });
}

// Carregar disciplinas no formulário com base na turma selecionada
function carregarFormularioDisciplinas(idTurma) {
    const selectDisciplinaNota = document.getElementById('disciplina_nota');
    if (!selectDisciplinaNota) {
        console.error("Elemento disciplina_nota não encontrado");
        return;
    }
    
    console.log("Carregando disciplinas para formulário", idTurma ? `da turma ${idTurma}` : "");
    selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina</option>';
    
    if (!idTurma) {
        selectDisciplinaNota.disabled = true;
        return;
    }
    
    selectDisciplinaNota.disabled = false;
    
    // Carregar disciplinas vinculadas à turma selecionada
    fetch(CONFIG.getApiUrl('/disciplinas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            // Filtrar as disciplinas que estão vinculadas à turma
            const disciplinasFiltradas = disciplinas.filter(disciplina => {
                if (disciplina.turmas) {
                    if (Array.isArray(disciplina.turmas)) {
                        return disciplina.turmas.some(turma => 
                            turma === idTurma || 
                            (turma && turma.id_turma === idTurma)
                        );
                    } else if (typeof disciplina.turmas === 'object') {
                        return Object.values(disciplina.turmas).some(turma => 
                            turma === idTurma || 
                            (turma && turma.id_turma === idTurma)
                        );
                    }
                }
                return false;
            });
            
            console.log(`Disciplinas filtradas para turma ${idTurma} (formulário):`, disciplinasFiltradas.length);
            
            // Ordenar disciplinas por nome
            disciplinasFiltradas.sort((a, b) => {
                return (a.nome_disciplina || "").localeCompare(b.nome_disciplina || "");
            });
            
            disciplinasFiltradas.forEach(disciplina => {
                const option = document.createElement('option');
                option.value = disciplina.id_disciplina;
                option.textContent = disciplina.nome_disciplina;
                selectDisciplinaNota.appendChild(option);
            });
        })
        .catch(error => {
            console.error(`Erro ao carregar disciplinas para turma ${idTurma} (formulário):`, error);
            selectDisciplinaNota.innerHTML = '<option value="" disabled>Erro ao carregar disciplinas</option>';
        });
}

// Carregar alunos no formulário com base na turma selecionada
function carregarFormularioAlunos(idTurma) {
    const selectAlunoNota = document.getElementById('aluno_nota');
    if (!selectAlunoNota) {
        console.error("Elemento aluno_nota não encontrado");
        return;
    }
    
    console.log("Carregando alunos para formulário", idTurma ? `da turma ${idTurma}` : "");
    selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione um aluno</option>';
    
    if (!idTurma) {
        selectAlunoNota.disabled = true;
        return;
    }
    
    selectAlunoNota.disabled = false;
    
    // Buscar alunos da turma específica
    fetch(CONFIG.getApiUrl('/alunos'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar alunos: ${response.status}`);
            }
            return response.json();
        })
        .then(alunos => {
            // Filtrar alunos pela turma e remover duplicados
            const alunosFiltrados = alunos.filter(aluno => aluno.id_turma === idTurma);
            
            // Criar um conjunto de IDs para identificar duplicatas
            const idsAlunos = new Set();
            const alunosSemDuplicatas = alunosFiltrados.filter(aluno => {
                if (idsAlunos.has(aluno.id_aluno)) {
                    return false; // Aluno já encontrado, não adicionar novamente
                }
                idsAlunos.add(aluno.id_aluno);
                return true;
            });
            
            console.log(`Alunos filtrados para turma ${idTurma} (formulário):`, alunosSemDuplicatas.length);
            
            // Ordenar alunos por nome
            alunosSemDuplicatas.sort((a, b) => (a.nome_aluno || "").localeCompare(b.nome_aluno || ""));
            
            alunosSemDuplicatas.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id_aluno;
                option.textContent = aluno.nome_aluno;
                selectAlunoNota.appendChild(option);
            });
        })
        .catch(error => {
            console.error(`Erro ao carregar alunos da turma ${idTurma} para formulário:`, error);
            selectAlunoNota.innerHTML = '<option value="" disabled>Erro ao carregar alunos</option>';
        });
}

// Adicionar eventos para o formulário
function adicionarEventosFormulario() {
    const selectTurmaNota = document.getElementById('turma_nota');
    const selectDisciplinaNota = document.getElementById('disciplina_nota');
    
    // Eventos para os selects relacionados
    if (selectTurmaNota) {
        selectTurmaNota.addEventListener('change', function() {
            carregarFormularioDisciplinas(this.value);
            carregarFormularioAlunos(this.value);
        });
    }
}

// Função para verificar o carregamento dos filtros e forçar a inicialização se necessário
function verificarCarregamentoFiltros() {
    console.log("Verificando se os filtros de notas foram carregados corretamente", new Date().toISOString());
    
    // Obter referências atualizadas aos elementos
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroAluno = document.getElementById('filtro-aluno');
    
    console.log("Estado atual dos comboboxes de filtro:", {
        filtroTurma: filtroTurma ? `encontrado, ${filtroTurma.options ? filtroTurma.options.length : 0} opções` : "não encontrado",
        filtroDisciplina: filtroDisciplina ? `encontrado, ${filtroDisciplina.options ? filtroDisciplina.options.length : 0} opções` : "não encontrado",
        filtroAluno: filtroAluno ? `encontrado, ${filtroAluno.options ? filtroAluno.options.length : 0} opções` : "não encontrado"
    });
    
    // CORREÇÃO: Verificar se os selects já têm opções válidas antes de recarregar
    // Isso evita resets desnecessários
    if (filtroTurma && (!filtroTurma.options || filtroTurma.options.length <= 1)) {
        console.log("Combobox de turma vazio, carregando");
        carregarFiltroTurmas();
    }
    
    // Verificar formulários também
    const selectTurmaNota = document.getElementById('turma_nota');
    const selectAnoNota = document.getElementById('ano_nota');
    const selectBimestreNota = document.getElementById('bimestre');
    
    console.log("Estado atual dos comboboxes do formulário:", {
        selectAnoNota: selectAnoNota ? `encontrado, ${selectAnoNota.options ? selectAnoNota.options.length : 0} opções` : "não encontrado",
        selectBimestreNota: selectBimestreNota ? `encontrado, ${selectBimestreNota.options ? selectBimestreNota.options.length : 0} opções` : "não encontrado",
        selectTurmaNota: selectTurmaNota ? `encontrado, ${selectTurmaNota.options ? selectTurmaNota.options.length : 0} opções` : "não encontrado"
    });
    
    // CORREÇÃO: Verificar se os selects já têm opções válidas antes de recarregar
    if (selectAnoNota && (!selectAnoNota.options || selectAnoNota.options.length <= 1)) {
        console.log("Combobox de ano no formulário vazio, carregando");
        carregarFormularioAnos();
    }
    
    if (selectBimestreNota && (!selectBimestreNota.options || selectBimestreNota.options.length <= 1)) {
        console.log("Combobox de bimestre no formulário vazio, carregando");
        carregarFormularioBimestres();
    }
    
    if (selectTurmaNota && (!selectTurmaNota.options || selectTurmaNota.options.length <= 1)) {
        console.log("Combobox de turma no formulário vazio, carregando");
        carregarFormularioTurmas();
    }
    
    // CORREÇÃO: Restaurar os filtros salvos na sessão
    setTimeout(restaurarFiltrosSalvos, 1000);
}

// Função de backup para salvar notas caso a original não seja encontrada
function salvarNotaManualmente() {
    console.log("Tentando salvar nota manualmente");
    
    // Obter os valores do formulário
    const anoNota = document.getElementById('ano_nota').value;
    const bimestre = document.getElementById('bimestre').value;
    const turmaNota = document.getElementById('turma_nota').value;
    const disciplinaNota = document.getElementById('disciplina_nota').value;
    const alunoNota = document.getElementById('aluno_nota').value;
    const valorNota = document.getElementById('valor_nota').value;
    const descricaoNota = document.getElementById('descricao_nota') ? document.getElementById('descricao_nota').value : '';
    
    if (!anoNota || !bimestre || !turmaNota || !disciplinaNota || !alunoNota || !valorNota) {
        alert("Por favor, preencha todos os campos obrigatórios");
        return;
    }
    
    // Criar objeto da nota
    const nota = {
        ano: anoNota,
        bimestre: bimestre,
        id_turma: turmaNota,
        id_disciplina: disciplinaNota,
        id_aluno: alunoNota,
        valor: valorNota,
        descricao: descricaoNota,
        id_nota: `${alunoNota}-${disciplinaNota}-${bimestre}-${anoNota}`
    };
    
    console.log("Dados da nota a serem salvos:", nota);
    
    // Enviar para a API
    fetch(CONFIG.getApiUrl('/notas'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nota)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao salvar nota: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Nota salva com sucesso:", data);
        alert("Nota salva com sucesso!");
        
        // Limpar formulário
        document.getElementById('form-nota').reset();
        
        // Recarregar lista de notas
        if (typeof carregarNotas === 'function') {
            carregarNotas();
        }
    })
    .catch(error => {
        console.error("Erro ao salvar nota:", error);
        alert(`Erro ao salvar nota: ${error.message}`);
    });
}

// Restaurar filtros da sessão, se existirem
function restaurarFiltrosSalvos() {
    // CORREÇÃO: Função para restaurar os filtros salvos na sessão
    const filtroAno = document.getElementById('filtro-ano');
    const filtroBimestre = document.getElementById('filtro-bimestre');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroAluno = document.getElementById('filtro-aluno');
    
    const ano = sessionStorage.getItem('filtroNotas_ano');
    const bimestre = sessionStorage.getItem('filtroNotas_bimestre');
    const turma = sessionStorage.getItem('filtroNotas_turma');
    const disciplina = sessionStorage.getItem('filtroNotas_disciplina');
    const aluno = sessionStorage.getItem('filtroNotas_aluno');
    
    // Aplicar valores salvos aos filtros, se existirem
    if (filtroAno && ano) filtroAno.value = ano;
    if (filtroBimestre && bimestre) filtroBimestre.value = bimestre;
    
    // Para turma, disciplina e aluno, precisamos carregar em sequência
    if (filtroTurma && turma) {
        filtroTurma.value = turma;
        // Carregar disciplinas para a turma selecionada
        carregarFiltroDisciplinas(turma);
        // Carregar alunos para a turma selecionada
        carregarFiltroAlunos(turma);
        
        // Depois de um tempo para carregar as opções, aplicar os filtros salvos
        setTimeout(() => {
            if (filtroDisciplina && disciplina) filtroDisciplina.value = disciplina;
            if (filtroAluno && aluno) filtroAluno.value = aluno;
        }, 1000);
    }
}

// Nova função para corrigir o comportamento do formulário de notas
function corrigirFormularioNotas() {
    const formNota = document.getElementById('form-nota');
    if (!formNota) {
        console.error("Formulário de notas não encontrado");
        return;
    }
    
    console.log("Corrigindo comportamento do formulário de notas");
    
    // Remover event listeners existentes
    const novoForm = formNota.cloneNode(true);
    formNota.parentNode.replaceChild(novoForm, formNota);
    
    // Adicionar novo event listener para prevenir o comportamento padrão
    novoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Submit do formulário de notas interceptado");
        
        // Buscar a função salvarNota no escopo global
        if (typeof window.salvarNota === 'function') {
            console.log("Chamando função salvarNota");
            window.salvarNota();
        } else if (typeof salvarNota === 'function') {
            console.log("Chamando função salvarNota local");
            salvarNota();
        } else {
            console.error("Função salvarNota não encontrada");
            alert("Erro: Função de salvamento não encontrada");
            
            // Criar nossa própria função básica de salvamento
            salvarNotaManualmente();
        }
        
        return false;
    });
}

// Modifica a verificação periódica para rodar apenas uma vez
// Remover todo o código de verificação periódica excessiva
let verificacaoInterval = null;

// Adicionar inicialização imediata ao carregar o script
console.log("Script filtro-notas.js carregado");
inicializarFiltrosNotas();

// Substituir a verificação periódica por uma única verificação adicional após o carregamento
setTimeout(function() {
    const conteudoNotas = document.querySelector('#conteudo-notas');
    if (conteudoNotas && (conteudoNotas.classList.contains('active') || getComputedStyle(conteudoNotas).display !== 'none')) {
        console.log("Verificação final dos filtros");
        verificarCarregamentoFiltros();
    }
}, 3000); // Verificação única após 3 segundos 