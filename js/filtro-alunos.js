// Funções para filtro de alunos
// Este arquivo deve ser incluído após dashboard.js

function adicionarFiltroAlunos() {
    console.log("Adicionando filtros ao módulo de alunos");
    
    // Localizar o contêiner do módulo de alunos
    const alunosContainer = document.querySelector('.module-container[data-module="alunos"]');
    if (!alunosContainer) {
        console.error("Contêiner do módulo de alunos não encontrado");
        return;
    }
    
    // Criar HTML da seção de filtros
    const filtrosHTML = `
        <div class="card mb-4" id="card-filtro-alunos">
            <div class="card-header">
                <h5 class="mb-0">Filtros de Alunos</h5>
            </div>
            <div class="card-body">
                <form id="form-filtro-alunos" class="row g-3">
                    <div class="col-md-3">
                        <label for="filtro-id-aluno" class="form-label">ID Aluno</label>
                        <input type="text" class="form-control" id="filtro-id-aluno" placeholder="Digite o ID do aluno">
                    </div>
                    <div class="col-md-3">
                        <label for="filtro-nome-aluno" class="form-label">Nome do Aluno</label>
                        <input type="text" class="form-control" id="filtro-nome-aluno" placeholder="Digite o nome do aluno">
                    </div>
                    <div class="col-md-3">
                        <label for="filtro-turma" class="form-label">Turma</label>
                        <select class="form-select" id="filtro-turma">
                            <option value="">Todas as turmas</option>
                            <!-- Opções serão carregadas dinamicamente -->
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="filtro-data-nasc" class="form-label">Data de Nascimento</label>
                        <input type="date" class="form-control" id="filtro-data-nasc">
                    </div>
                    <div class="col-12 text-end">
                        <button type="button" class="btn btn-secondary me-2" id="btn-limpar-filtros">Limpar Filtros</button>
                        <button type="button" class="btn btn-primary" id="btn-aplicar-filtros">Aplicar Filtros</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Inserir seção de filtros antes da tabela de alunos
    const tabelaAlunos = alunosContainer.querySelector('.card-lista-alunos') || 
                          alunosContainer.querySelector('.table-responsive').closest('.card');
    
    if (tabelaAlunos) {
        // Verificar se o filtro já existe
        if (!document.getElementById('card-filtro-alunos')) {
            tabelaAlunos.insertAdjacentHTML('beforebegin', filtrosHTML);
            
            // Inicializar os filtros
            inicializarFiltrosAlunos();
        }
    } else {
        console.error("Tabela de alunos não encontrada");
    }
}

function inicializarFiltrosAlunos() {
    console.log("Inicializando funcionalidades dos filtros de alunos");
    
    // Elementos de filtro
    const filtroIdAluno = document.getElementById('filtro-id-aluno');
    const filtroNomeAluno = document.getElementById('filtro-nome-aluno');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDataNasc = document.getElementById('filtro-data-nasc');
    const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
    const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
    const alunosLista = document.getElementById('alunos-lista');
    
    // Limpar tabela inicialmente
    if (alunosLista) {
        alunosLista.innerHTML = `
            <tr class="text-center">
                <td colspan="7">Use os filtros acima para buscar alunos</td>
            </tr>
        `;
    }
    
    // Carregar turmas para o filtro
    carregarTurmasParaFiltro();
    
    // Adicionar eventos aos botões
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', filtrarAlunos);
    }
    
    if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', function() {
            if (filtroIdAluno) filtroIdAluno.value = '';
            if (filtroNomeAluno) filtroNomeAluno.value = '';
            if (filtroTurma) filtroTurma.value = '';
            if (filtroDataNasc) filtroDataNasc.value = '';
            
            // Limpar a tabela
            if (alunosLista) {
                alunosLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="7">Use os filtros acima para buscar alunos</td>
                    </tr>
                `;
            }
        });
    }
}

function carregarTurmasParaFiltro() {
    console.log("Carregando turmas para o filtro de alunos");
    
    const filtroTurma = document.getElementById('filtro-turma');
    if (!filtroTurma) {
        console.error("Select de turmas para filtro não encontrado!");
        return;
    }
    
    // Mostrar indicador de carregamento
    filtroTurma.innerHTML = '<option value="">Carregando turmas...</option>';
    
    // Buscar turmas da API
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar turmas: ' + response.statusText);
            }
            return response.json();
        })
        .then(turmas => {
            console.log("Turmas recuperadas para filtro:", turmas.length);
            
            filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
            
            // Adicionar cada turma ao select
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id_turma;
                option.textContent = `${turma.id_turma} - ${turma.serie}`;
                filtroTurma.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar turmas para filtro:", error);
            filtroTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        });
}

function filtrarAlunos() {
    console.log("Filtrando alunos...");
    
    const alunosLista = document.getElementById('alunos-lista');
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
    
    // Obter valores dos filtros
    const filtroIdAluno = document.getElementById('filtro-id-aluno');
    const filtroNomeAluno = document.getElementById('filtro-nome-aluno');
    const filtroTurma = document.getElementById('filtro-turma');
    const filtroDataNasc = document.getElementById('filtro-data-nasc');
    
    const filtroId = filtroIdAluno ? filtroIdAluno.value.trim() : '';
    const filtroNome = filtroNomeAluno ? filtroNomeAluno.value.trim() : '';
    const filtroTurmaVal = filtroTurma ? filtroTurma.value : '';
    const filtroDataVal = filtroDataNasc ? filtroDataNasc.value : '';
    
    // Construir query string para filtros
    let queryParams = [];
    if (filtroId) queryParams.push(`id_aluno=${encodeURIComponent(filtroId)}`);
    if (filtroNome) queryParams.push(`nome_aluno=${encodeURIComponent(filtroNome)}`);
    if (filtroTurmaVal) queryParams.push(`id_turma=${encodeURIComponent(filtroTurmaVal)}`);
    if (filtroDataVal) queryParams.push(`data_nasc=${encodeURIComponent(filtroDataVal)}`);
    
    // Verificar se pelo menos um filtro foi aplicado
    if (queryParams.length === 0) {
        alunosLista.innerHTML = `
            <tr class="text-center">
                <td colspan="7">Aplique pelo menos um filtro para buscar alunos</td>
            </tr>
        `;
        return;
    }
    
    // Endpoint para buscar alunos com filtro
    let url = CONFIG.getApiUrl('/alunos');
    if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
    }
    
    // Buscar alunos da API
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar alunos: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(alunos => {
            console.log("Alunos filtrados da API:", alunos.length);
            
            if (!Array.isArray(alunos) || alunos.length === 0) {
                alunosLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="7">Nenhum aluno encontrado com os filtros aplicados</td>
                    </tr>
                `;
                return;
            }
            
            // Ordenar alunos por ID ou nome
            alunos.sort((a, b) => {
                return a.nome_aluno.localeCompare(b.nome_aluno);
            });
            
            // Limpar lista e preenchê-la com os alunos
            alunosLista.innerHTML = '';
            
            // Adicionar cada aluno à lista
            alunos.forEach(aluno => {
                // Formatar data de nascimento
                let dataNascFormatada = '-';
                if (aluno.data_nasc) {
                    // Garantir que a data seja interpretada no timezone local
                    const [ano, mes, dia] = aluno.data_nasc.split('-');
                    if (ano && mes && dia) {
                        const dataCorrigida = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                        dataNascFormatada = dataCorrigida.toLocaleDateString('pt-BR');
                    }
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${aluno.id_aluno}</td>
                    <td>${aluno.nome_aluno}</td>
                    <td>${aluno.id_turma}</td>
                    <td>${aluno.sexo === 'M' ? 'Masculino' : 'Feminino'}</td>
                    <td>${dataNascFormatada}</td>
                    <td>${aluno.mae || '-'}</td>
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
            console.error("Erro ao filtrar alunos:", error);
            
            alunosLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="7">Erro ao buscar alunos: ${error.message}</td>
                </tr>
            `;
        });
}

// Modificar a função carregarAlunos original para não carregar todos os alunos
function substituirCarregarAlunos() {
    // Se a função original existe no objeto window, podemos substituí-la
    if (typeof window.carregarAlunos === 'function') {
        // Guardar referência à função original caso seja necessário
        const carregarAlunosOriginal = window.carregarAlunos;
        
        // Substituir pela nova implementação
        window.carregarAlunos = function() {
            console.log("Função carregarAlunos substituída. Utilize os filtros para carregar alunos.");
            
            const alunosLista = document.getElementById('alunos-lista');
            if (!alunosLista) {
                console.error("Lista de alunos não encontrada!");
                return;
            }
            
            // Mostrar mensagem para utilizar filtros
            alunosLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="7">Use os filtros acima para buscar alunos</td>
                </tr>
            `;
        };
    }
}

// Executar após o carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página de alunos
    if (document.querySelector('.module-container[data-module="alunos"]')) {
        // Adicionar filtros e substituir a função original
        adicionarFiltroAlunos();
        substituirCarregarAlunos();
    }
});

// Se a página já estiver carregada, executar imediatamente
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        // Verificar se estamos na página de alunos
        if (document.querySelector('.module-container[data-module="alunos"]')) {
            // Adicionar filtros e substituir a função original
            adicionarFiltroAlunos();
            substituirCarregarAlunos();
        }
    }, 500);
} 