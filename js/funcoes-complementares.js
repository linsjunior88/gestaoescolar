/**
 * Funções complementares para o sistema de gestão escolar
 * Este arquivo contém funções que complementam a funcionalidade do sistema
 */

// Função para lidar com o envio do formulário de notas
function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Formulário de notas enviado');
    
    // Obter valores do formulário
    const form = e.target;
    const modo = form.getAttribute('data-mode') || 'novo';
    const notaId = form.getAttribute('data-nota-id') || null;
    
    // Obter outros valores do formulário
    const anoValue = document.getElementById('ano_nota').value;
    const bimestreValue = document.getElementById('bimestre').value;
    const turmaValue = document.getElementById('turma_nota').value;
    const disciplinaValue = document.getElementById('disciplina_nota').value;
    const alunoValue = document.getElementById('aluno_nota').value;
    const notaMensalValue = document.getElementById('nota_mensal').value;
    const notaBimestralValue = document.getElementById('nota_bimestral').value;
    const recuperacaoValue = document.getElementById('recuperacao').value;
    const mediaValue = document.getElementById('media').value;
    
    // Validar campos obrigatórios
    if (!anoValue || !bimestreValue || !turmaValue || !disciplinaValue || !alunoValue) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Preparar dados para envio
    const notaData = {
        id_professor: professorId,
        ano: anoValue,
        bimestre: bimestreValue,
        id_turma: turmaValue,
        id_disciplina: disciplinaValue,
        id_aluno: alunoValue,
        nota_mensal: notaMensalValue || null,
        nota_bimestral: notaBimestralValue || null,
        recuperacao: recuperacaoValue || null,
        media: mediaValue || null
    };
    
    // Mostrar indicador de carregamento
    const btnSalvar = form.querySelector('button[type="submit"]');
    const btnTextoOriginal = btnSalvar.innerHTML;
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    
    // Definir URL e método com base no modo (edição ou nova nota)
    let url = CONFIG.getApiUrl('/notas');
    let method = 'POST';
    
    if (modo === 'edit' && notaId) {
        url = CONFIG.getApiUrl(`/notas/${notaId}`);
        method = 'PUT';
    }
    
    // Enviar requisição
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
    .then(data => {
        console.log('Nota salva com sucesso:', data);
        
        // Registrar atividade
        registrarAtividade(
            modo === 'edit' ? 'atualização' : 'criação',
            'notas',
            data.id || notaId,
            `${modo === 'edit' ? 'Atualização' : 'Criação'} de nota para aluno ID: ${alunoValue}`,
            'concluído'
        );
        
        // Exibir mensagem de sucesso
        alert(`Nota ${modo === 'edit' ? 'atualizada' : 'criada'} com sucesso!`);
        
        // Recarregar a tabela de notas
        if (typeof carregarNotas === 'function') {
            carregarNotas();
        }
        
        // Resetar o formulário e voltar ao modo de nova nota
        form.reset();
        form.removeAttribute('data-mode');
        form.removeAttribute('data-nota-id');
        
        // Se houver botão de cancelar, ocultá-lo
        const btnCancelar = document.getElementById('btn-cancelar-nota');
        if (btnCancelar) {
            btnCancelar.style.display = 'none';
        }
        
        // Atualizar o título do formulário
        const formTitulo = document.getElementById('form-nota-titulo');
        if (formTitulo) {
            formTitulo.textContent = 'Lançamento de Notas';
        }
    })
    .catch(error => {
        console.error('Erro ao salvar nota:', error);
        alert(`Erro ao salvar nota: ${error.message}`);
        
        // Registrar atividade com erro
        registrarAtividade(
            modo === 'edit' ? 'atualização' : 'criação',
            'notas',
            notaId || '0',
            `Erro ao ${modo === 'edit' ? 'atualizar' : 'criar'} nota: ${error.message}`,
            'erro'
        );
    })
    .finally(() => {
        // Restaurar botão
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = btnTextoOriginal;
    });
}

// Função para criar nova nota
function novaNota() {
    console.log('Iniciando criação de nova nota');
    
    // Verificar se o formulário existe
    let form = document.getElementById('form-nota');
    if (!form) {
        console.error('Formulário de notas não encontrado!');
        alert('Erro: Formulário de notas não encontrado.');
        return;
    }
    
    // Resetar o formulário
    form.reset();
    form.removeAttribute('data-mode');
    form.removeAttribute('data-nota-id');
    
    // Atualizar o título do formulário
    const formTitulo = document.getElementById('form-nota-titulo');
    if (formTitulo) {
        formTitulo.textContent = 'Nova Nota';
    }
    
    // Ocultar o botão de cancelar
    const btnCancelar = document.getElementById('btn-cancelar-nota');
    if (btnCancelar) {
        btnCancelar.style.display = 'none';
    }
    
    // Carregar opções nos selects
    const anoSelect = document.getElementById('ano_nota');
    if (anoSelect) {
        anoSelect.innerHTML = '<option value="">Selecione...</option>';
        
        // Adicionar últimos 3 anos e próximos 3 anos
        const anoAtual = new Date().getFullYear();
        for (let ano = anoAtual - 3; ano <= anoAtual + 3; ano++) {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            anoSelect.appendChild(option);
        }
        
        // Selecionar o ano atual como padrão
        anoSelect.value = anoAtual;
    }
    
    // Preencher o bimestre
    const bimestreSelect = document.getElementById('bimestre');
    if (bimestreSelect) {
        bimestreSelect.innerHTML = '<option value="">Selecione...</option>';
        
        // Adicionar os 4 bimestres
        for (let i = 1; i <= 4; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}º Bimestre`;
            bimestreSelect.appendChild(option);
        }
    }
    
    // Rolar para o formulário
    form.scrollIntoView({ behavior: 'smooth' });
}

// Função para abrir modo de lançamento de notas em massa
function abrirModoLancamentoEmMassa() {
    console.log('Abrindo modo de lançamento de notas em massa');
    // Verificar se já estamos em modo de lançamento em massa
    const tabelaNotas = document.querySelector('.tabela-notas');
    if (tabelaNotas && tabelaNotas.classList.contains('modo-massa')) {
        console.log('Já estamos em modo de lançamento em massa');
        return;
    }
    
    // Obter valores dos filtros
    const turmaValue = document.getElementById('filtro-turma-notas')?.value;
    const disciplinaValue = document.getElementById('filtro-disciplina-notas')?.value;
    const bimestreValue = document.getElementById('filtro-bimestre-notas')?.value;
    const anoValue = document.getElementById('filtro-ano-notas')?.value;
    
    // Validar campos obrigatórios
    if (!turmaValue || !disciplinaValue || !bimestreValue || !anoValue) {
        alert('Selecione turma, disciplina, bimestre e ano para lançamento em massa.');
        return;
    }
    
    // Iniciar o processo de lançamento em massa
    console.log(`Iniciando lançamento em massa: Turma=${turmaValue}, Disciplina=${disciplinaValue}, Bimestre=${bimestreValue}, Ano=${anoValue}`);
    
    // Todo: Implementar o carregamento dos alunos da turma e criar a interface de lançamento em massa
}

// Função para corrigir o cabeçalho da tabela de notas
function corrigirHeaderNotas() {
    console.log('Corrigindo header de notas');
    
    // Verificar se existem cards de notas
    const notasContainer = document.querySelector('#conteudo-notas');
    if (!notasContainer) {
        console.error('Container de notas não encontrado');
        return;
    }
    
    // Verificar se existe o card de tabela
    const tabelaCard = notasContainer.querySelector('.card:last-child');
    if (!tabelaCard) {
        console.log('Card de tabela não encontrado');
        return;
    }
    
    // Verificar se o header da tabela está correto
    let cardHeader = tabelaCard.querySelector('.card-header');
    if (!cardHeader) {
        console.log('Criando header para o card da tabela de notas');
        cardHeader = document.createElement('div');
        cardHeader.className = 'card-header py-3 d-flex justify-content-between align-items-center';
        cardHeader.innerHTML = `
            <h6 class="m-0 font-weight-bold text-primary">Lista de Notas</h6>
            <div>
                <button class="btn btn-sm btn-success" onclick="novaNota()">
                    <i class="fas fa-plus"></i> Nova Nota
                </button>
                <button class="btn btn-sm btn-primary" onclick="abrirModoLancamentoEmMassa()">
                    <i class="fas fa-table"></i> Lançamento em Massa
                </button>
            </div>
        `;
        tabelaCard.insertBefore(cardHeader, tabelaCard.firstChild);
    } else {
        // Verificar se tem os botões necessários
        if (!cardHeader.querySelector('button[onclick="novaNota()"]') || 
            !cardHeader.querySelector('button[onclick="abrirModoLancamentoEmMassa()"]')) {
            console.log('Atualizando botões do header da tabela de notas');
            cardHeader.innerHTML = `
                <h6 class="m-0 font-weight-bold text-primary">Lista de Notas</h6>
                <div>
                    <button class="btn btn-sm btn-success" onclick="novaNota()">
                        <i class="fas fa-plus"></i> Nova Nota
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="abrirModoLancamentoEmMassa()">
                        <i class="fas fa-table"></i> Lançamento em Massa
                    </button>
                </div>
            `;
        }
    }
}

// Inicialização da tabela de notas
function inicializarTabelaNotas() {
    console.log('Inicializando tabela de notas...');
    
    // Encontrar o container de notas
    const notasContainer = document.querySelector('#conteudo-notas');
    if (!notasContainer) {
        console.error('Container de notas não encontrado!');
        return;
    }
    
    // Contar quantos cards já existem
    const cards = notasContainer.querySelectorAll('.card');
    console.log(`Encontradas ${cards.length} cards no container de notas`);
    
    // Verificar se a tabela já existe
    let tabelaCard = notasContainer.querySelector('.card:has(table.tabela-notas)');
    if (!tabelaCard) {
        // Criar card da tabela
        tabelaCard = document.createElement('div');
        tabelaCard.className = 'card shadow mb-4';
        tabelaCard.innerHTML = `
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">Lista de Notas</h6>
                <div>
                    <button class="btn btn-sm btn-success" onclick="novaNota()">
                        <i class="fas fa-plus"></i> Nova Nota
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="abrirModoLancamentoEmMassa()">
                        <i class="fas fa-table"></i> Lançamento em Massa
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered tabela-notas" width="100%" cellspacing="0">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Disciplina</th>
                                <th>Turma</th>
                                <th>Bimestre</th>
                                <th>N. Mensal</th>
                                <th>N. Bimestral</th>
                                <th>Recuperação</th>
                                <th>Média</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="notas-lista">
                            <tr>
                                <td colspan="10" class="text-center">
                                    Filtre as notas para visualizá-las
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Adicionar a tabela ao container
        notasContainer.appendChild(tabelaCard);
    }
    
    console.log('Tabela de notas inicializada');
}

// Registrar funções globalmente
window.handleFormSubmit = handleFormSubmit;
window.novaNota = novaNota;
window.abrirModoLancamentoEmMassa = abrirModoLancamentoEmMassa;
window.corrigirHeaderNotas = corrigirHeaderNotas;
window.inicializarTabelaNotas = inicializarTabelaNotas;

console.log('Funções complementares carregadas com sucesso'); 