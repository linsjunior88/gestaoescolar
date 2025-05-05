/**
 * Correções específicas para o módulo de notas
 * Este arquivo contém correções para problemas identificados no módulo de notas
 */

console.log("Carregando correções para o módulo de notas");

// Verificar se corrigirHeaderNotas existe e implementá-la se não existir
if (typeof window.corrigirHeaderNotas !== 'function') {
    console.log("Implementando função corrigirHeaderNotas");
    
    window.corrigirHeaderNotas = function() {
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
    };
}

// Verificar se handleFormSubmit existe e implementá-la se não existir
if (typeof window.handleFormSubmit !== 'function') {
    console.log("Implementando função handleFormSubmit");
    
    window.handleFormSubmit = function(e) {
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
        
        // Obter ID do professor (global)
        const idProfessor = window.professorId || sessionStorage.getItem('professorId');
        if (!idProfessor) {
            alert('Erro: ID do professor não encontrado. Por favor, faça login novamente.');
            return;
        }
        
        // Preparar dados para envio
        const notaData = {
            id_professor: idProfessor,
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
        const baseUrl = window.CONFIG && typeof window.CONFIG.getApiUrl === 'function' 
            ? window.CONFIG.getApiUrl('/notas') 
            : 'https://gestao-escolar-api.onrender.com/api/notas';
            
        let url = baseUrl;
        let method = 'POST';
        
        if (modo === 'edit' && notaId) {
            url = baseUrl + '/' + notaId;
            method = 'PUT';
        }
        
        // Função para registrar atividade
        const registrarAtiv = typeof window.registrarAtividade === 'function' 
            ? window.registrarAtividade 
            : function(acao, entidade, entidadeId, detalhe, status) {
                console.log(`Atividade: ${acao} de ${entidade} - ${entidadeId}, ${detalhe}, status: ${status}`);
            };
        
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
            registrarAtiv(
                modo === 'edit' ? 'atualização' : 'criação',
                'notas',
                data.id || notaId,
                `${modo === 'edit' ? 'Atualização' : 'Criação'} de nota para aluno ID: ${alunoValue}`,
                'concluído'
            );
            
            // Exibir mensagem de sucesso
            alert(`Nota ${modo === 'edit' ? 'atualizada' : 'criada'} com sucesso!`);
            
            // Recarregar a tabela de notas
            if (typeof window.carregarNotas === 'function') {
                window.carregarNotas();
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
            registrarAtiv(
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
    };
}

// Verificar e implementar função novaNota se necessário
if (typeof window.novaNota !== 'function') {
    console.log("Implementando função novaNota");
    
    window.novaNota = function() {
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
    };
}

// Verificar e implementar função abrirModoLancamentoEmMassa se necessário
if (typeof window.abrirModoLancamentoEmMassa !== 'function') {
    console.log("Implementando função abrirModoLancamentoEmMassa");
    
    window.abrirModoLancamentoEmMassa = function() {
        console.log('Função abrirModoLancamentoEmMassa é um stub/placeholder');
        alert("Funcionalidade de lançamento em massa em desenvolvimento!");
    };
}

console.log("Correções para o módulo de notas carregadas com sucesso"); 