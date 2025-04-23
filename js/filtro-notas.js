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
                
                console.log(`Disciplinas filtradas para turma ${idTurma}:`, disciplinasFiltradas.length);
                
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
        });
    }
    
    if (filtroDisciplina) {
        filtroDisciplina.addEventListener('change', function() {
            if (filtroTurma && filtroTurma.value) {
                carregarFiltroAlunos(filtroTurma.value, this.value);
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

// Função para aplicar filtros e buscar notas
function aplicarFiltros() {
    console.log("Aplicando filtros de notas");
    
    // Obter valores dos filtros
    const filtroAno = document.getElementById('filtro-ano');
    const filtroBimestre = document.getElementById('filtro-bimestre');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroAluno = document.getElementById('filtro-aluno');
    
    const ano = filtroAno ? filtroAno.value : '';
    const bimestre = filtroBimestre ? filtroBimestre.value : '';
    const turma = filtroTurma ? filtroTurma.value : '';
    const disciplina = filtroDisciplina ? filtroDisciplina.value : '';
    const aluno = filtroAluno ? filtroAluno.value : '';
    
    console.log("Filtros aplicados:", { ano, bimestre, turma, disciplina, aluno });
    
    // Buscar notas com os filtros (precisa implementar busca no dashboard.js)
    if (typeof carregarNotas === 'function') {
        carregarNotas(ano, bimestre, turma, disciplina, aluno);
    } else {
        console.error("Função carregarNotas não encontrada no dashboard.js");
        alert("Erro ao aplicar filtros: função de carregamento não encontrada");
    }
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
    
    // Verificar combobox de turma e recarregar se necessário
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

// Adicionar inicialização imediata ao carregar o script
console.log("Script filtro-notas.js carregado");
inicializarFiltrosNotas();

// Adicionar verificação periódica em intervalos regulares
setInterval(function() {
    const conteudoNotas = document.querySelector('#conteudo-notas');
    if (conteudoNotas && (conteudoNotas.classList.contains('active') || getComputedStyle(conteudoNotas).display !== 'none')) {
        console.log("Verificação periódica: seção de notas ativa");
        verificarCarregamentoFiltros();
    }
}, 5000); // Verificar a cada 5 segundos 