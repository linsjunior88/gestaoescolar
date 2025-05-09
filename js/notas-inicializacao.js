// Arquivo de inicialização e suporte para o módulo de notas

// Função para inicializar a tabela de notas
function inicializarTabelaNotas() {
    console.log('Inicializando tabela de notas...');
    
    try {
        // Buscar o container principal primeiro
        const notasContainer = document.querySelector('#conteudo-notas');
        if (!notasContainer) {
            console.error('Container de notas (#conteudo-notas) não encontrado!');
            return;
        }
        
        // Verificar se já existe card para filtros (primeiro card)
        const cardsExistentes = notasContainer.querySelectorAll('.card');
        console.log(`Encontradas ${cardsExistentes.length} cards no container de notas`);
        
        // Procurar o card que deve conter a tabela (geralmente é o segundo card)
        // Tentamos várias abordagens para encontrar o container da tabela
        const cardTabela = cardsExistentes.length >= 2 ? cardsExistentes[1] : null;
        let cardBody = null;
        
        if (cardTabela) {
            cardBody = cardTabela.querySelector('.card-body');
        }
        
        // Se não encontramos o card ou o body, procurar por seletores alternativos
        if (!cardBody) {
            cardBody = notasContainer.querySelector('.card-body.notas-container') || 
                      notasContainer.querySelector('.card:last-child .card-body') ||
                      notasContainer.querySelector('.card:nth-child(2) .card-body');
        }
        
        // Se ainda não encontramos, tentar buscar qualquer card que tenha uma tabela
        if (!cardBody) {
            const todasCardBodies = notasContainer.querySelectorAll('.card-body');
            for (const body of todasCardBodies) {
                if (body.querySelector('table')) {
                    cardBody = body;
                    console.log('Encontrado card body com tabela');
                    break;
                }
            }
        }
        
        // Se não encontramos nenhum card adequado, criar um novo
        if (!cardBody) {
            console.log('Container para tabela de notas não encontrado, criando novo card...');
            
            // Criar um novo card para tabela
            const novoCard = document.createElement('div');
            novoCard.className = 'card shadow mb-4';
            novoCard.innerHTML = `
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                    <div></div>
                    <div class="d-flex">
                        <button class="btn btn-primary btn-sm me-2" id="btn-nova-nota">
                            <i class="fas fa-plus"></i> Novo Lançamento
                        </button>
                        <button class="btn btn-success btn-sm me-2" id="btn-lancamento-massa">
                            <i class="fas fa-list-ol"></i> Lançamento em Massa
                        </button>
                        <button class="btn btn-outline-success btn-sm" id="btn-gerar-pdf-notas">
                            <i class="fas fa-file-pdf"></i> Gerar PDF
                        </button>
                    </div>
                </div>
                <div class="card-body notas-container">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="tabela-notas">
                            <thead class="table-secondary">
                                <tr>
                                    <th>Aluno</th>
                                    <th>Disciplina</th>
                                    <th>Turma</th>
                                    <th>Bimestre</th>
                                    <th>Nota Mensal</th>
                                    <th>Nota Bimestral</th>
                                    <th>Recuperação</th>
                                    <th>Média</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="notas-lista">
                                <!-- As notas serão carregadas aqui -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            // Adicionar ao container principal após o card de filtros
            if (cardsExistentes.length > 0) {
                notasContainer.insertBefore(novoCard, cardsExistentes[0].nextSibling);
            } else {
                notasContainer.appendChild(novoCard);
            }
            
            // Configurar eventos para os botões
            setTimeout(() => {
                const btnNovoLancamento = document.getElementById('btn-nova-nota');
                if (btnNovoLancamento && !btnNovoLancamento.hasEventListener) {
                    btnNovoLancamento.addEventListener('click', function() {
                        console.log('Botão novo lançamento clicado');
                        if (typeof window.novaNota === 'function') {
                            window.novaNota();
                        } else if (typeof novaNota === 'function') {
                            novaNota();
                        } else {
                            console.error('Função novaNota não encontrada');
                            alert('Erro: Função de novo lançamento não encontrada');
                        }
                    });
                    btnNovoLancamento.hasEventListener = true;
                }
                
                const btnLancamentoMassa = document.getElementById('btn-lancamento-massa');
                if (btnLancamentoMassa && !btnLancamentoMassa.hasEventListener) {
                    btnLancamentoMassa.addEventListener('click', function() {
                        console.log('Botão lançamento em massa clicado');
                        if (typeof window.abrirModoLancamentoEmMassa === 'function') {
                            window.abrirModoLancamentoEmMassa();
                        } else if (typeof abrirModoLancamentoEmMassa === 'function') {
                            abrirModoLancamentoEmMassa();
                        } else {
                            console.error('Função abrirModoLancamentoEmMassa não encontrada');
                            alert('Erro: Função de lançamento em massa não encontrada');
                        }
                    });
                    btnLancamentoMassa.hasEventListener = true;
                }
            }, 100);
            
            console.log('Nova card de tabela de notas criada');
            
            // Carregar notas iniciais se houver filtros selecionados
            setTimeout(() => {
                if (
                    (filtroTurma && filtroTurma.value) || 
                    (filtroDisciplina && filtroDisciplina.value) || 
                    (filtroAluno && filtroAluno.value)
                ) {
                    console.log('Carregando notas iniciais com base nos filtros existentes');
                    if (typeof window.carregarNotas === 'function') {
                        window.carregarNotas();
                    } else if (typeof carregarNotas === 'function') {
                        carregarNotas();
                    }
                }
            }, 300);
            
            return;
        }
        
        // Se chegamos aqui, temos um card body existente
        // Verificar se já tem uma tabela
        const tabelaExistente = cardBody.querySelector('#tabela-notas') || cardBody.querySelector('table');
        
        if (tabelaExistente) {
            // Se já tem tabela, apenas garantir que tem o ID e tbody corretos
            if (!tabelaExistente.id) {
                tabelaExistente.id = 'tabela-notas';
            }
            
            let tbodyExistente = tabelaExistente.querySelector('#notas-lista') || tabelaExistente.querySelector('tbody');
            
            if (!tbodyExistente) {
                tbodyExistente = document.createElement('tbody');
                tbodyExistente.id = 'notas-lista';
                tbodyExistente.innerHTML = '<!-- As notas serão carregadas aqui -->';
                tabelaExistente.appendChild(tbodyExistente);
            } else if (!tbodyExistente.id) {
                tbodyExistente.id = 'notas-lista';
            }
            
            console.log('Tabela de notas existente atualizada');
            
            // Carregar notas iniciais se houver filtros selecionados
            setTimeout(() => {
                if (
                    (filtroTurma && filtroTurma.value) || 
                    (filtroDisciplina && filtroDisciplina.value) || 
                    (filtroAluno && filtroAluno.value)
                ) {
                    console.log('Carregando notas iniciais com base nos filtros existentes');
                    if (typeof window.carregarNotas === 'function') {
                        window.carregarNotas();
                    } else if (typeof carregarNotas === 'function') {
                        carregarNotas();
                    }
                }
            }, 300);
            
            return;
        }
        
        // Se não tem tabela, criar uma nova
        cardBody.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover" id="tabela-notas">
                    <thead class="table-secondary">
                        <tr>
                            <th>Aluno</th>
                            <th>Disciplina</th>
                            <th>Turma</th>
                            <th>Bimestre</th>
                            <th>Nota Mensal</th>
                            <th>Nota Bimestral</th>
                            <th>Recuperação</th>
                            <th>Média</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="notas-lista">
                        <!-- As notas serão carregadas aqui -->
                    </tbody>
                </table>
            </div>
        `;
        
        console.log('Tabela de notas inicializada');
        
        // Carregar notas iniciais se houver filtros selecionados
        setTimeout(() => {
            if (
                (filtroTurma && filtroTurma.value) || 
                (filtroDisciplina && filtroDisciplina.value) || 
                (filtroAluno && filtroAluno.value)
            ) {
                console.log('Carregando notas iniciais com base nos filtros existentes');
                if (typeof window.carregarNotas === 'function') {
                    window.carregarNotas();
                } else if (typeof carregarNotas === 'function') {
                    carregarNotas();
                }
            }
        }, 300);
    } catch (error) {
        console.error('Erro ao inicializar tabela de notas:', error);
    }
}

// Registrar a função globalmente
window.inicializarTabelaNotas = inicializarTabelaNotas;

// Avisar que o script foi carregado
console.log('Módulo de inicialização de notas carregado com sucesso'); 