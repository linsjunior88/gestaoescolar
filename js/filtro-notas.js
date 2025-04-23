// Funções para gerenciamento de filtros no módulo de notas
// Este arquivo deve ser incluído após dashboard.js

// URL base da API
const BASE_API_URL = 'http://localhost:3000';

// Detectar quando a seção de notas está ativa e inicializar os filtros
document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de filtro-notas.js carregado");
    
    // Verificar se estamos na página do dashboard
    if (!document.querySelector('.main-content')) {
        console.log("Não estamos na página do dashboard, script de filtros de notas não será inicializado");
        return;
    }
    
    // Função para verificar se a seção de notas está ativa
    function verificarSecaoNotasAtiva() {
        // Verificar se a seção de notas está ativa pelo link do menu
        const linkNotas = document.querySelector('a[href="#notas"]');
        const secaoNotasAtiva = linkNotas && linkNotas.classList.contains('active');
        
        // Verificar também pelo conteúdo visível
        const secaoNotas = document.getElementById('notas');
        const secaoNotasVisivel = secaoNotas && (window.getComputedStyle(secaoNotas).display !== 'none');
        
        return secaoNotasAtiva || secaoNotasVisivel;
    }
    
    // Inicializar filtros se a seção de notas estiver ativa ao carregar a página
    if (verificarSecaoNotasAtiva()) {
        console.log("Seção de notas ativa no carregamento da página");
        inicializarFiltrosNotas();
    }
    
    // Adicionar ouvinte para os links da navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            // Verificar após um pequeno atraso para garantir que as classes foram atualizadas
            setTimeout(() => {
                if (this.getAttribute('href') === '#notas' || verificarSecaoNotasAtiva()) {
                    console.log("Navegado para a seção de notas");
                    inicializarFiltrosNotas();
                }
            }, 100);
        });
    });
    
    // Verificação periódica (a cada 3 segundos) para garantir que os filtros sejam inicializados
    setInterval(() => {
        if (verificarSecaoNotasAtiva()) {
            const filtroTurma = document.getElementById('filtro-turma');
            // Se o filtro de turmas estiver vazio, reinicializar
            if (filtroTurma && (!filtroTurma.options || filtroTurma.options.length <= 1)) {
                console.log("Detectada seção de notas ativa com filtros não inicializados");
                inicializarFiltrosNotas();
            }
        }
    }, 3000);
});

// Função para inicializar os filtros na seção de notas
function inicializarFiltrosNotas() {
    console.log("Inicializando filtros de notas");
    
    // Inicializar os selectboxes com indicadores de carregamento
    const filtroAno = document.getElementById('filtro-ano');
    const filtroBimestre = document.getElementById('filtro-bimestre');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDisciplina = document.getElementById('filtro-disciplina');
    const filtroAluno = document.getElementById('filtro-aluno');
    
    // Verificar se todos os elementos existem
    if (!filtroAno || !filtroBimestre || !filtroTurma || !filtroDisciplina || !filtroAluno) {
        console.error("Alguns elementos de filtro não foram encontrados");
        return;
    }
    
    // Carregar indicadores iniciais
    filtroAno.innerHTML = '<option value="">Carregando anos...</option>';
    filtroBimestre.innerHTML = '<option value="">Carregando bimestres...</option>';
    filtroTurma.innerHTML = '<option value="">Carregando turmas...</option>';
    
    // Desabilitar apenas disciplinas e alunos até que uma turma seja selecionada
    filtroDisciplina.disabled = true;
    filtroDisciplina.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
    
    filtroAluno.disabled = true;
    filtroAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
    
    // Carregar anos letivos
    carregarAnosLetivos();
    
    // Carregar bimestres
    carregarBimestres();
    
    // Carregar turmas
    carregarTurmas();
    
    // Adicionar evento de change para a seleção de turma
    filtroTurma.addEventListener('change', function() {
        // Quando a turma mudar, carregar disciplinas e alunos associados
        const turmaId = this.value;
        carregarDisciplinas(turmaId);
        carregarAlunos(turmaId);
    });
    
    // Corrigir o comportamento do formulário de notas
    corrigirFormularioNotas();
    
    // Configurar o botão de aplicar filtros
    const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
        console.log("Evento adicionado ao botão de aplicar filtros");
    } else {
        console.warn("Botão de aplicar filtros não encontrado");
    }
    
    console.log("Filtros de notas inicializados - aguardando usuário aplicar filtros");
    
    // Exibir mensagem inicial no local das notas
    const notasContainer = document.querySelector('.notas-container');
    if (notasContainer) {
        notasContainer.innerHTML = '<div class="alert alert-info mt-3">Selecione pelo menos um filtro e clique em "Aplicar Filtros" para visualizar as notas.</div>';
    }
    
    // Restaurar filtros salvos, se existirem
    setTimeout(restaurarFiltrosSalvos, 1000);
}

// Função para carregar anos letivos
function carregarAnosLetivos() {
    const anoSelect = document.getElementById('filtro-ano');
    if (!anoSelect) {
        console.error("Elemento de filtro de ano não encontrado");
        return;
    }

    console.log("Carregando anos letivos");
    
    // Gerar anos de 2020 até o ano atual + 2
    const anoAtual = new Date().getFullYear();
    const anos = [];
    
    for (let ano = 2020; ano <= anoAtual + 2; ano++) {
        anos.push(ano);
    }
    
    // Limpar e adicionar opção padrão
    anoSelect.innerHTML = '<option value="">Todos os Anos</option>';
    
    // Adicionar os anos ao select
    anos.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        anoSelect.appendChild(option);
    });
    
    console.log(`${anos.length} anos letivos carregados`);
}

// Função para carregar bimestres
function carregarBimestres() {
    const bimestreSelect = document.getElementById('filtro-bimestre');
    if (!bimestreSelect) {
        console.error("Elemento de filtro de bimestre não encontrado");
        return;
    }
    
    console.log("Carregando bimestres");
    
    // Definir os bimestres
    const bimestres = [
        { id: "1", nome: "1º Bimestre" },
        { id: "2", nome: "2º Bimestre" },
        { id: "3", nome: "3º Bimestre" },
        { id: "4", nome: "4º Bimestre" }
    ];
    
    // Limpar e adicionar opção padrão
    bimestreSelect.innerHTML = '<option value="">Todos os Bimestres</option>';
    
    // Adicionar os bimestres ao select
    bimestres.forEach(bimestre => {
        const option = document.createElement('option');
        option.value = bimestre.id;
        option.textContent = bimestre.nome;
        bimestreSelect.appendChild(option);
    });
    
    console.log(`${bimestres.length} bimestres carregados`);
}

// Função para carregar turmas
function carregarTurmas() {
    const turmaSelect = document.getElementById('filtro-turma');
    if (!turmaSelect) {
        console.error("Elemento de filtro de turma não encontrado");
        return;
    }
    
    turmaSelect.innerHTML = '<option value="">Carregando turmas...</option>';
    
    console.log("Carregando turmas");
    
    // Primeiro, tentar buscar do endpoint padrão
    fetch(`${BASE_API_URL}/turmas`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar turmas do endpoint padrão');
            }
            return response.json();
        })
        .then(turmas => {
            console.log(`${turmas.length} turmas carregadas`);
            
            // Limpar e adicionar opção padrão
            turmaSelect.innerHTML = '<option value="">Todas as Turmas</option>';
            
            // Adicionar as turmas ao select
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id;
                option.textContent = turma.nome;
                turmaSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas do endpoint padrão:", error);
            
            // Se falhar, tentar através do CONFIG.getApiUrl()
            try {
                if (typeof CONFIG !== 'undefined' && typeof CONFIG.getApiUrl === 'function') {
                    console.log("Tentando carregar turmas através do CONFIG.getApiUrl");
                    
                    fetch(CONFIG.getApiUrl('/turmas'))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar turmas: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(turmas => {
                            console.log(`${turmas.length} turmas carregadas via CONFIG`);
                            
                            // Limpar e adicionar opção padrão
                            turmaSelect.innerHTML = '<option value="">Todas as Turmas</option>';
                            
                            // Adicionar as turmas ao select
                            turmas.forEach(turma => {
                                const option = document.createElement('option');
                                option.value = turma.id_turma || turma.id;
                                option.textContent = turma.id_turma ? `${turma.id_turma} - ${turma.serie || 'Sem nome'}` : turma.nome;
                                turmaSelect.appendChild(option);
                            });
                        })
                        .catch(configError => {
                            console.error("Erro ao carregar turmas via CONFIG:", configError);
                            turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                        });
                } else {
                    turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
                }
            } catch (configErr) {
                console.error("Erro ao tentar carregar via CONFIG:", configErr);
                turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            }
        });
}

// Função para aplicar filtros e buscar notas
function aplicarFiltros() {
    console.log("Aplicando filtros");
    
    // Obter valores dos filtros
    const anoLetivo = document.getElementById('filtro-ano').value;
    const bimestre = document.getElementById('filtro-bimestre').value;
    const turmaId = document.getElementById('filtro-turma').value;
    const disciplinaId = document.getElementById('filtro-disciplina').value;
    const alunoId = document.getElementById('filtro-aluno').value;
    
    console.log("Filtros selecionados:", {
        anoLetivo,
        bimestre,
        turmaId,
        disciplinaId,
        alunoId
    });
    
    // Verificar se pelo menos um filtro foi preenchido
    if (!anoLetivo && !bimestre && !turmaId && !disciplinaId && !alunoId) {
        // Exibir mensagem de alerta
        Swal.fire({
            title: 'Atenção!',
            text: 'Selecione pelo menos um filtro para buscar notas.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        
        // Mostrar mensagem na área de notas
        const notasContainer = document.querySelector('.notas-container');
        if (notasContainer) {
            notasContainer.innerHTML = `
                <div class="alert alert-warning mt-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Por favor, selecione pelo menos um filtro para buscar notas.
                </div>
            `;
        }
        
        return;
    }
    
    // Mostrar indicador de carregamento
    const notasContainer = document.querySelector('.notas-container');
    if (notasContainer) {
        notasContainer.innerHTML = `
            <div class="text-center mt-4 mb-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2">Buscando notas...</p>
            </div>
        `;
    }
    
    // Construir a URL com os parâmetros de filtro
    let url = `${BASE_API_URL}/notas?`;
    const params = [];
    
    if (anoLetivo) params.push(`anoLetivo=${anoLetivo}`);
    if (bimestre) params.push(`bimestre=${bimestre}`);
    if (turmaId) params.push(`turmaId=${turmaId}`);
    if (disciplinaId) params.push(`disciplinaId=${disciplinaId}`);
    if (alunoId) params.push(`alunoId=${alunoId}`);
    
    url += params.join('&');
    
    console.log("URL da busca:", url);
    
    // Buscar notas com os filtros aplicados
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar notas');
            }
            return response.json();
        })
        .then(notas => {
            console.log(`${notas.length} notas encontradas`);
            
            // Exibir as notas na tabela
            exibirNotas(notas);
        })
        .catch(error => {
            console.error("Erro ao buscar notas:", error);
            
            if (notasContainer) {
                notasContainer.innerHTML = `
                    <div class="alert alert-danger mt-3">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Ocorreu um erro ao buscar notas: ${error.message}
                    </div>
                `;
            }
        });
}

// Função para exibir as notas na tabela
function exibirNotas(notas) {
    const notasContainer = document.querySelector('.notas-container');
    
    if (!notasContainer) {
        console.error("Container de notas não encontrado");
        return;
    }
    
    if (notas.length === 0) {
        notasContainer.innerHTML = `
            <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle me-2"></i>
                Nenhuma nota encontrada com os filtros selecionados.
            </div>
        `;
        return;
    }
    
    // Criar tabela para exibir as notas
    let html = `
        <div class="table-responsive mt-3">
            <table class="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Aluno</th>
                        <th>Turma</th>
                        <th>Disciplina</th>
                        <th>Ano</th>
                        <th>Bimestre</th>
                        <th>Nota</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Adicionar linhas para cada nota
    notas.forEach(nota => {
        html += `
            <tr>
                <td>${nota.id}</td>
                <td>${nota.aluno?.nome || 'N/A'}</td>
                <td>${nota.turma?.nome || 'N/A'}</td>
                <td>${nota.disciplina?.nome || 'N/A'}</td>
                <td>${nota.anoLetivo || 'N/A'}</td>
                <td>${nota.bimestre}º Bimestre</td>
                <td>${nota.valor}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-editar-nota" data-id="${nota.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-excluir-nota" data-id="${nota.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    notasContainer.innerHTML = html;
    
    // Adicionar event listeners para os botões de editar e excluir
    document.querySelectorAll('.btn-editar-nota').forEach(btn => {
        btn.addEventListener('click', function() {
            const notaId = this.getAttribute('data-id');
            editarNota(notaId);
        });
    });
    
    document.querySelectorAll('.btn-excluir-nota').forEach(btn => {
        btn.addEventListener('click', function() {
            const notaId = this.getAttribute('data-id');
            excluirNota(notaId);
        });
    });
    
    console.log("Tabela de notas atualizada com sucesso");
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
        carregarTurmas();
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
        carregarDisciplinas(turma);
        // Carregar alunos para a turma selecionada
        carregarAlunos(turma);
        
        // Depois de um tempo para carregar as opções, aplicar os filtros salvos
        setTimeout(() => {
            if (filtroDisciplina && disciplina) filtroDisciplina.value = disciplina;
            if (filtroAluno && aluno) filtroAluno.value = aluno;
        }, 1000);
    }
}

// Função para corrigir o comportamento do formulário de notas
function corrigirFormularioNotas() {
    // Encontrar o formulário de notas
    const formNotas = document.querySelector('form#form-nota');
    
    if (!formNotas) {
        console.log("Formulário de notas não encontrado");
        
        // Tentar encontrar novamente após um pequeno atraso
        setTimeout(() => {
            const formRetry = document.querySelector('form#form-nota');
            if (formRetry) {
                console.log("Formulário de notas encontrado após atraso");
                aplicarCorrecaoFormulario(formRetry);
            }
        }, 1000);
        
        return;
    }
    
    aplicarCorrecaoFormulario(formNotas);
}

// Função auxiliar para aplicar a correção no formulário
function aplicarCorrecaoFormulario(form) {
    console.log("Aplicando correção ao formulário de notas");
    
    // Remover qualquer event listener anterior para evitar duplicação
    const novoForm = form.cloneNode(true);
    form.parentNode.replaceChild(novoForm, form);
    
    // Adicionar novo event listener para prevenir o comportamento padrão
    novoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log("Formulário de notas submetido - prevenindo redirecionamento");
        
        // Pegar todos os dados do formulário
        const formData = new FormData(this);
        const notaData = {};
        
        // Converter FormData para objeto
        for (const [key, value] of formData.entries()) {
            notaData[key] = value;
        }
        
        console.log("Dados do formulário:", notaData);
        
        // Verificar se temos um ID (caso seja edição)
        const notaId = notaData.id || '';
        
        // Definir URL e método baseado em se é uma nova nota ou edição
        const url = notaId 
            ? `${BASE_API_URL}/notas/${notaId}` 
            : `${BASE_API_URL}/notas`;
        
        const method = notaId ? 'PUT' : 'POST';
        
        // Enviar os dados para o servidor
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notaData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao ${notaId ? 'atualizar' : 'salvar'} nota: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Nota ${notaId ? 'atualizada' : 'salva'} com sucesso:`, data);
            
            // Mostrar mensagem de sucesso
            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: `Nota ${notaId ? 'atualizada' : 'salva'} com sucesso.`,
                confirmButtonText: 'OK'
            }).then(() => {
                // Fechar o modal se estiver aberto
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalNota'));
                if (modal) {
                    modal.hide();
                }
                
                // Recarregar as notas se os filtros estiverem aplicados
                const anoLetivo = document.getElementById('filtro-ano').value;
                const bimestre = document.getElementById('filtro-bimestre').value;
                const turmaId = document.getElementById('filtro-turma').value;
                const disciplinaId = document.getElementById('filtro-disciplina').value;
                const alunoId = document.getElementById('filtro-aluno').value;
                
                if (anoLetivo || bimestre || turmaId || disciplinaId || alunoId) {
                    aplicarFiltros();
                }
            });
        })
        .catch(error => {
            console.error("Erro ao salvar nota:", error);
            
            // Mostrar mensagem de erro
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Falha ao ${notaId ? 'atualizar' : 'salvar'} nota: ${error.message}`,
                confirmButtonText: 'OK'
            });
        });
    });
    
    console.log("Correção aplicada ao formulário de notas");
}

// Função para carregar opções de disciplinas com base na turma selecionada
function carregarDisciplinas(turmaId) {
    const disciplinaSelect = document.getElementById('filtro-disciplina');
    if (!disciplinaSelect) {
        console.error("Elemento de filtro de disciplina não encontrado");
        return;
    }
    
    // Desabilitar o select de disciplina se nenhuma turma for selecionada
    if (!turmaId) {
        disciplinaSelect.disabled = true;
        disciplinaSelect.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        return;
    }
    
    // Habilitar o select e mostrar opção de carregamento
    disciplinaSelect.disabled = false;
    disciplinaSelect.innerHTML = '<option value="">Carregando disciplinas...</option>';
    
    console.log(`Carregando disciplinas para a turma ${turmaId}`);
    
    // Primeiro, tentar buscar do endpoint padrão
    fetch(`${BASE_API_URL}/disciplinas?turmaId=${turmaId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar disciplinas do endpoint padrão');
            }
            return response.json();
        })
        .then(disciplinas => {
            console.log(`${disciplinas.length} disciplinas carregadas`);
            
            // Adicionar opção padrão
            disciplinaSelect.innerHTML = '<option value="">Todas as Disciplinas</option>';
            
            // Adicionar as disciplinas ao select
            disciplinas.forEach(disciplina => {
                const option = document.createElement('option');
                option.value = disciplina.id;
                option.textContent = disciplina.nome;
                disciplinaSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar disciplinas do endpoint padrão:", error);
            
            // Se falhar, tentar através do CONFIG.getApiUrl()
            try {
                if (typeof CONFIG !== 'undefined' && typeof CONFIG.getApiUrl === 'function') {
                    console.log("Tentando carregar disciplinas através do CONFIG.getApiUrl");
                    
                    // Carregar todas as disciplinas e filtrar no cliente
                    fetch(CONFIG.getApiUrl('/disciplinas'))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar disciplinas: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(todasDisciplinas => {
                            console.log(`Total de disciplinas carregadas: ${todasDisciplinas.length}`);
                            
                            // Filtrar disciplinas vinculadas à turma
                            const disciplinasFiltradas = todasDisciplinas.filter(disciplina => {
                                if (!disciplina) return false;
                                
                                // Verificar se a disciplina tem turmas
                                if (disciplina.turmas) {
                                    if (Array.isArray(disciplina.turmas)) {
                                        for (const turma of disciplina.turmas) {
                                            if (turma === turmaId || (turma && turma.id_turma === turmaId)) {
                                                return true;
                                            }
                                        }
                                    } else if (typeof disciplina.turmas === 'object') {
                                        for (const key in disciplina.turmas) {
                                            const turma = disciplina.turmas[key];
                                            if (turma === turmaId || (turma && turma.id_turma === turmaId)) {
                                                return true;
                                            }
                                        }
                                    }
                                }
                                
                                // Verificar outro formato possível
                                if (disciplina.id_turma && disciplina.id_turma === turmaId) {
                                    return true;
                                }
                                
                                return false;
                            });
                            
                            console.log(`${disciplinasFiltradas.length} disciplinas filtradas para turma ${turmaId}`);
                            
                            // Limpar e adicionar opção padrão
                            disciplinaSelect.innerHTML = '<option value="">Todas as Disciplinas</option>';
                            
                            if (disciplinasFiltradas.length === 0) {
                                // Se não encontrou disciplinas, adicionar mensagem
                                const option = document.createElement('option');
                                option.disabled = true;
                                option.textContent = 'Nenhuma disciplina encontrada para esta turma';
                                disciplinaSelect.appendChild(option);
                            } else {
                                // Adicionar as disciplinas ao select
                                disciplinasFiltradas.forEach(disciplina => {
                                    const option = document.createElement('option');
                                    option.value = disciplina.id_disciplina || disciplina.id;
                                    option.textContent = disciplina.nome_disciplina || disciplina.nome;
                                    disciplinaSelect.appendChild(option);
                                });
                            }
                        })
                        .catch(configError => {
                            console.error("Erro ao carregar disciplinas via CONFIG:", configError);
                            disciplinaSelect.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
                        });
                } else {
                    disciplinaSelect.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
                }
            } catch (configErr) {
                console.error("Erro ao tentar carregar disciplinas via CONFIG:", configErr);
                disciplinaSelect.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            }
        });
}

// Função para carregar opções de alunos com base na turma selecionada
function carregarAlunos(turmaId) {
    const alunoSelect = document.getElementById('filtro-aluno');
    if (!alunoSelect) {
        console.error("Elemento de filtro de aluno não encontrado");
        return;
    }
    
    // Desabilitar o select de aluno se nenhuma turma for selecionada
    if (!turmaId) {
        alunoSelect.disabled = true;
        alunoSelect.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        return;
    }
    
    // Habilitar o select e mostrar opção de carregamento
    alunoSelect.disabled = false;
    alunoSelect.innerHTML = '<option value="">Carregando alunos...</option>';
    
    console.log(`Carregando alunos para a turma ${turmaId}`);
    
    // Primeiro, tentar buscar do endpoint padrão
    fetch(`${BASE_API_URL}/alunos?turmaId=${turmaId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar alunos do endpoint padrão');
            }
            return response.json();
        })
        .then(alunos => {
            console.log(`${alunos.length} alunos carregados`);
            
            // Usar Set para evitar duplicatas
            const alunosUnicos = new Set();
            
            // Adicionar opção padrão
            alunoSelect.innerHTML = '<option value="">Todos os Alunos</option>';
            
            // Adicionar os alunos ao select, evitando duplicatas
            alunos.forEach(aluno => {
                // Verificar se o aluno já foi adicionado pelo ID
                if (!alunosUnicos.has(aluno.id)) {
                    alunosUnicos.add(aluno.id);
                    
                    const option = document.createElement('option');
                    option.value = aluno.id;
                    option.textContent = aluno.nome;
                    alunoSelect.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error("Erro ao carregar alunos do endpoint padrão:", error);
            
            // Se falhar, tentar através do CONFIG.getApiUrl()
            try {
                if (typeof CONFIG !== 'undefined' && typeof CONFIG.getApiUrl === 'function') {
                    console.log("Tentando carregar alunos através do CONFIG.getApiUrl");
                    
                    fetch(CONFIG.getApiUrl('/alunos'))
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Erro ao carregar alunos: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(todosAlunos => {
                            console.log(`Total de alunos carregados: ${todosAlunos.length}`);
                            
                            // Filtrar alunos da turma específica
                            const alunosFiltrados = todosAlunos.filter(aluno => aluno.id_turma === turmaId);
                            
                            console.log(`${alunosFiltrados.length} alunos filtrados para turma ${turmaId}`);
                            
                            // Usar Set para evitar duplicatas
                            const idsAlunos = new Set();
                            const alunosSemDuplicatas = alunosFiltrados.filter(aluno => {
                                if (idsAlunos.has(aluno.id_aluno)) {
                                    return false;
                                }
                                idsAlunos.add(aluno.id_aluno);
                                return true;
                            });
                            
                            // Limpar e adicionar opção padrão
                            alunoSelect.innerHTML = '<option value="">Todos os Alunos</option>';
                            
                            if (alunosSemDuplicatas.length === 0) {
                                // Se não encontrou alunos, adicionar mensagem
                                const option = document.createElement('option');
                                option.disabled = true;
                                option.textContent = 'Nenhum aluno encontrado para esta turma';
                                alunoSelect.appendChild(option);
                            } else {
                                // Ordenar alunos por nome
                                alunosSemDuplicatas.sort((a, b) => (a.nome_aluno || "").localeCompare(b.nome_aluno || ""));
                                
                                // Adicionar os alunos ao select
                                alunosSemDuplicatas.forEach(aluno => {
                                    const option = document.createElement('option');
                                    option.value = aluno.id_aluno || aluno.id;
                                    option.textContent = aluno.nome_aluno || aluno.nome;
                                    alunoSelect.appendChild(option);
                                });
                            }
                        })
                        .catch(configError => {
                            console.error("Erro ao carregar alunos via CONFIG:", configError);
                            alunoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
                        });
                } else {
                    alunoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
                }
            } catch (configErr) {
                console.error("Erro ao tentar carregar alunos via CONFIG:", configErr);
                alunoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            }
        });
}

// Função para editar uma nota
function editarNota(notaId) {
    console.log(`Editando nota com ID: ${notaId}`);
    
    // Mostrar indicador de carregamento
    Swal.fire({
        title: 'Carregando...',
        text: 'Buscando detalhes da nota',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    // Buscar detalhes da nota pelo ID
    fetch(`${BASE_API_URL}/notas/${notaId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar detalhes da nota');
            }
            return response.json();
        })
        .then(nota => {
            console.log("Detalhes da nota carregados:", nota);
            Swal.close();
            
            // Abrir o modal de edição
            const modal = new bootstrap.Modal(document.getElementById('modalNota'));
            modal.show();
            
            // Preencher o formulário com os dados da nota
            const form = document.getElementById('form-nota');
            if (form) {
                form.reset();
                
                // Preencher campos do formulário
                form.id.value = nota.id;
                
                // Preencher campos de seleção
                setTimeout(() => {
                    if (form.anoLetivo) form.anoLetivo.value = nota.anoLetivo;
                    if (form.bimestre) form.bimestre.value = nota.bimestre;
                    if (form.turmaId) {
                        form.turmaId.value = nota.turmaId;
                        
                        // Disparar evento de change para carregar disciplinas e alunos
                        const event = new Event('change');
                        form.turmaId.dispatchEvent(event);
                        
                        // Depois de um tempo para carregar disciplinas e alunos, selecionar os valores corretos
                        setTimeout(() => {
                            if (form.disciplinaId) form.disciplinaId.value = nota.disciplinaId;
                            if (form.alunoId) form.alunoId.value = nota.alunoId;
                        }, 500);
                    }
                }, 100);
                
                // Preencher o valor da nota
                if (form.valor) form.valor.value = nota.valor;
                
                // Atualizar título do modal
                const modalTitle = document.querySelector('#modalNota .modal-title');
                if (modalTitle) {
                    modalTitle.textContent = 'Editar Nota';
                }
            } else {
                console.error("Formulário de nota não encontrado");
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Formulário de nota não encontrado'
                });
            }
        })
        .catch(error => {
            console.error("Erro ao carregar detalhes da nota:", error);
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: `Falha ao carregar detalhes da nota: ${error.message}`
            });
        });
}

// Função para excluir uma nota
function excluirNota(notaId) {
    console.log(`Solicitação para excluir nota com ID: ${notaId}`);
    
    // Confirmar exclusão
    Swal.fire({
        title: 'Confirmação',
        text: 'Tem certeza que deseja excluir esta nota?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar indicador de carregamento
            Swal.fire({
                title: 'Excluindo...',
                text: 'Excluindo a nota',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Excluir a nota
            fetch(`${BASE_API_URL}/notas/${notaId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Falha ao excluir nota');
                }
                return response.json();
            })
            .then(data => {
                console.log("Nota excluída com sucesso:", data);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: 'Nota excluída com sucesso'
                }).then(() => {
                    // Recarregar as notas
                    aplicarFiltros();
                });
            })
            .catch(error => {
                console.error("Erro ao excluir nota:", error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: `Falha ao excluir nota: ${error.message}`
                });
            });
        }
    });
} 