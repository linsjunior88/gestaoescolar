// Função para salvar o lançamento em massa
function salvarLancamentoEmMassa() {
    console.log('Iniciando processo de salvamento em massa de notas');
    
    // Obter valores dos filtros
    const turmaId = filtroTurma ? filtroTurma.value : '';
    const disciplinaId = filtroDisciplina ? filtroDisciplina.value : '';
    const ano = filtroAno ? filtroAno.value : '';
    const bimestre = filtroBimestre ? filtroBimestre.value : '';
    
    // Verificar se os campos obrigatórios estão preenchidos
    if (!turmaId || !disciplinaId || !ano || !bimestre) {
        alert('Por favor, recarregue a página. Os filtros não foram encontrados corretamente.');
        return;
    }
    
    console.log(`Filtros para salvamento: Turma=${turmaId}, Disciplina=${disciplinaId}, Ano=${ano}, Bimestre=${bimestre}`);
    
    // Buscar o formulário de lançamento em massa
    const form = document.getElementById('form-lancamento-massa');
    if (!form) {
        console.error('Formulário de lançamento em massa não encontrado');
        alert('Erro: Formulário não encontrado.');
        return;
    }
    
    // Buscar a tabela com os dados
    const tabela = document.getElementById('tabela-lancamento-massa');
    if (!tabela) {
        console.error('Tabela de lançamento em massa não encontrada');
        alert('Erro: Tabela de notas não encontrada.');
        return;
    }
    
    // Salvar o HTML original para restaurar em caso de erro
    const formOriginal = form.innerHTML;
    
    // Mostrar indicador de carregamento
    const btnSalvar = document.getElementById('btn-salvar-lancamento-massa');
    const btnCancelar = document.getElementById('btn-cancelar-lancamento-massa');
    
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    }
    
    if (btnCancelar) {
        btnCancelar.disabled = true;
    }
    
    // Array para armazenar todas as promessas de salvamento
    const promessasSalvamento = [];
    
    // Para cada linha da tabela (cada aluno)
    const linhasAlunos = tabela.querySelectorAll('tbody tr');
    console.log(`Processando ${linhasAlunos.length} alunos para salvamento`);
    
    linhasAlunos.forEach(linha => {
        // Obter o ID do aluno do atributo data-aluno-id da linha
        const alunoId = linha.dataset.alunoId;
        if (!alunoId) {
            console.error('Linha sem ID de aluno definido:', linha);
            return; // Pular esta linha
        }
        
        // Buscar os inputs de notas para este aluno
        const notaMensalInput = linha.querySelector('.nota-mensal');
        const notaBimestralInput = linha.querySelector('.nota-bimestral');
        const notaRecuperacaoInput = linha.querySelector('.nota-recuperacao');
        const notaIdInput = linha.querySelector('.nota-id');
        
        // Se não encontrou os inputs necessários, pular
        if (!notaMensalInput || !notaBimestralInput) {
            console.error(`Inputs incompletos para o aluno ${alunoId}`);
            return;
        }
        
        // Obter valores dos inputs
        const notaMensal = notaMensalInput.value.trim();
        const notaBimestral = notaBimestralInput.value.trim();
        const notaRecuperacao = notaRecuperacaoInput ? notaRecuperacaoInput.value.trim() : '';
        const notaId = notaIdInput ? notaIdInput.value.trim() : '';
        
        // Se não tem nenhuma nota preenchida, pular
        if (!notaMensal && !notaBimestral && !notaRecuperacao) {
            console.log(`Aluno ${alunoId} sem notas preenchidas, pulando`);
            return;
        }
        
        // Calcular média
        let media = null;
        const nm = notaMensal ? parseFloat(notaMensal) : null;
        const nb = notaBimestral ? parseFloat(notaBimestral) : null;
        const rec = notaRecuperacao ? parseFloat(notaRecuperacao) : null;
        
        // Calcular média apenas se ambas as notas estiverem preenchidas
        if (nm !== null && nb !== null) {
            // Calcular média sem recuperação
            media = (nm + nb) / 2;
            console.log(`Aluno ${alunoId}: Média inicial (${nm} + ${nb})/2 = ${media}`);
            
            // Se tem recuperação e é maior que a média, usar a recuperação
            if (rec !== null && rec > media) {
                console.log(`Aluno ${alunoId}: Recuperação ${rec} > média ${media}, usando recuperação como média final`);
                media = rec;
            }
            
            // Limitar a 1 casa decimal
            media = Math.round(media * 10) / 10;
            console.log(`Aluno ${alunoId}: Média final = ${media}`);
        }
        
        // Definir status baseado na média (apenas se média foi calculada)
        const status = media !== null ? (media >= 6 ? 'Aprovado' : 'Reprovado') : null;
        
        // Criar objeto de nota
        const notaObj = {
            id_aluno: alunoId,
            id_turma: turmaId,
            id_disciplina: disciplinaId,
            ano: parseInt(ano),
            bimestre: parseInt(bimestre),
            nota_mensal: notaMensal ? parseFloat(notaMensal) : null,
            nota_bimestral: notaBimestral ? parseFloat(notaBimestral) : null,
            recuperacao: notaRecuperacao ? parseFloat(notaRecuperacao) : null
            // Não enviar média ou status - serão calculados pelo backend
        };
        
        console.log(`Preparando nota para aluno ${alunoId}:`, notaObj);
        
        // Se tem ID de nota, atualizar, caso contrário criar nova
        const url = notaId 
            ? CONFIG.getApiUrl(`/notas/${notaId}`) 
            : CONFIG.getApiUrl('/notas');
        
        const method = notaId ? 'PUT' : 'POST';
        
        // Criar promessa para este salvamento
        const promessa = fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notaObj)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao salvar nota para aluno ${alunoId}: ${response.status}`);
            }
            return response.json();
        })
        .then(resultado => {
            console.log(`Nota ${method === 'POST' ? 'criada' : 'atualizada'} com sucesso para aluno ${alunoId}:`, resultado);
            return resultado;
        })
        .catch(error => {
            console.error(`Erro ao salvar nota para aluno ${alunoId}:`, error);
            throw error;
        });
        
        promessasSalvamento.push(promessa);
    });
    
    // Se não há notas para salvar
    if (promessasSalvamento.length === 0) {
        console.log('Nenhuma nota para salvar');
        
        // Resetar os botões
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar';
        }
        
        if (btnCancelar) {
            btnCancelar.disabled = false;
        }
        
        alert('Nenhuma nota foi lançada. Por favor, preencha pelo menos uma nota antes de salvar.');
        return;
    }
    
    // Processar todas as promessas
    Promise.all(promessasSalvamento)
        .then(resultados => {
            console.log(`Salvas ${resultados.length} notas com sucesso!`);
            
            // Registrar atividade
            if (typeof registrarAtividade === 'function') {
                registrarAtividade(
                    'atualização',
                    'notas',
                    `${resultados.length} notas`,
                    `Turma: ${turmaId}, Disciplina: ${disciplinaId}, Ano: ${ano}, Bimestre: ${bimestre}`,
                    'concluído'
                );
            }
            
            // Mostrar mensagem flutuante de sucesso
            if (typeof mostrarMensagemFlutuante === 'function') {
                mostrarMensagemFlutuante(`Notas salvas com sucesso! (${resultados.length} registros)`, 'success');
            } else {
                alert(`Notas salvas com sucesso! (${resultados.length} registros)`);
            }
            
            // Remover o formulário de lançamento em massa
            const formLancamento = document.getElementById('form-lancamento-massa');
            if (formLancamento) {
                formLancamento.remove();
            }
            
            // Mostrar tabela de notas novamente
            const tabelaNotas = document.getElementById('tabela-notas');
            if (tabelaNotas) {
                tabelaNotas.style.display = '';
            }
            
            // Recarregar a tabela de notas
            if (typeof carregarNotas === 'function') {
                carregarNotas();
            } else {
                console.warn('Função carregarNotas não encontrada. A tabela não será atualizada automaticamente.');
            }
        })
        .catch(error => {
            console.error('Erro ao salvar notas:', error);
            
            // Resetar os botões
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar';
            }
            
            if (btnCancelar) {
                btnCancelar.disabled = false;
            }
            
            // Mostrar mensagem de erro
            if (typeof mostrarMensagemFlutuante === 'function') {
                mostrarMensagemFlutuante('Erro ao salvar notas. Consulte o console para detalhes.', 'error');
            } else {
                alert('Erro ao salvar notas. Por favor, verifique o console para mais detalhes e tente novamente.');
            }
        });
}

// Registrar função globalmente
window.salvarLancamentoEmMassa = salvarLancamentoEmMassa; 