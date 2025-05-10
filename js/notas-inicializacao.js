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
        
        // Vamos verificar se já existe alguma tabela no container
        const tabelaExistente = notasContainer.querySelector('#tabela-notas');
        if (tabelaExistente) {
            console.log('Tabela de notas já existe, não é necessário criar novamente');
            return;
        }
        
        // Criar um novo card para tabela, adicionando-o após o último card existente
        console.log('Criando nova tabela de notas...');
        
        // Criar um novo card para tabela
        const novoCard = document.createElement('div');
        novoCard.className = 'card shadow mb-4';
        novoCard.innerHTML = `
            <div class="card-body">
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
        
        // Adicionar ao container principal após o último card
        if (cardsExistentes.length > 0) {
            notasContainer.insertBefore(novoCard, cardsExistentes[cardsExistentes.length - 1].nextSibling);
        } else {
            notasContainer.appendChild(novoCard);
        }
        
        console.log('Nova tabela de notas criada');
        
        // Configurar o botão de lançamento em massa
        setTimeout(() => {
            // Configurar o botão de novo lançamento
            const btnNovoLancamento = document.getElementById('btn-novo-lancamento');
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
            
            // Configurar o botão de gerar PDF
            const btnGerarPDF = document.getElementById('btn-gerar-pdf-notas');
            if (btnGerarPDF && !btnGerarPDF.hasEventListener) {
                // Usar a função centralizada se estiver disponível
                if (typeof window.configurarBotaoGerarPDF === 'function') {
                    window.configurarBotaoGerarPDF(btnGerarPDF);
                } else {
                    console.log('Função centralizada configurarBotaoGerarPDF não disponível, configurando localmente');
                    btnGerarPDF.addEventListener('click', function() {
                        console.log('Botão gerar PDF clicado');
                        if (typeof window.gerarPDFNotas === 'function') {
                            window.gerarPDFNotas();
                        } else if (typeof gerarPDFNotas === 'function') {
                            gerarPDFNotas();
                        } else {
                            console.error('Função gerarPDFNotas não encontrada');
                            alert('Erro: Função de geração de PDF não encontrada');
                        }
                    });
                }
                btnGerarPDF.hasEventListener = true;
            }
        }, 100);
        
        // Carregar notas iniciais se houver filtros selecionados
        setTimeout(() => {
            const filtroTurma = document.getElementById('filtro-turma-notas');
            const filtroDisciplina = document.getElementById('filtro-disciplina-notas');
            const filtroAluno = document.getElementById('filtro-aluno-notas');
            
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