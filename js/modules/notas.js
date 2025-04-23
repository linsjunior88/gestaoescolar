/**
 * notas.js
 * Módulo para gerenciamento de notas no sistema escolar
 */

// Função para inicializar o módulo de notas
function initNotas() {
    console.log("Inicializando módulo de notas");
    
    // Elementos DOM para o gerenciamento de notas
    const tabelaNotas = document.getElementById('tabelaNotas');
    const formNota = document.getElementById('formNota');
    const selectTurmaNota = document.getElementById('turma_nota');
    const selectDisciplinaNota = document.getElementById('disciplina_nota');
    const selectAlunoNota = document.getElementById('aluno_nota');
    const inputValorNota = document.getElementById('valor_nota');
    const inputDescricaoNota = document.getElementById('descricao_nota');
    const formModoNota = document.getElementById('form_modo_nota');
    const formNotaTitulo = document.getElementById('formNotaTitulo');
    const btnCancelarNota = document.getElementById('btn_cancelar_nota');
    const notasTableBody = document.getElementById('notas-lista');
    
    // Verificação menos restritiva - permite inicialização parcial
    const isFormDisponivel = formNota && selectTurmaNota && selectDisciplinaNota && selectAlunoNota;
    const isListaDisponivel = notasTableBody || tabelaNotas;
    
    if (!isListaDisponivel && !isFormDisponivel) {
        console.log("Módulo de notas não inicializado completamente (alguns elementos não encontrados)");
        // Continuamos a inicialização mesmo com elementos faltando
    } else {
        console.log("Módulo de notas inicializado com sucesso");
    }
    
    // Se o formulário estiver disponível, inicializar componentes relacionados
    if (isFormDisponivel) {
        // Carregar turmas no select
        carregarTurmasNotas();
        
        // Adicionar eventos para formulários e botões
        formNota.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarNota();
        });
    }
    
    // Se a tabela estiver disponível (seja na visualização completa ou na seção dinâmica)
    if (isListaDisponivel) {
        // Carregar notas na tabela
        carregarNotas();
    }
    
    // Eventos para os selects de turma e disciplina
    if (selectTurmaNota && selectDisciplinaNota) {
        selectTurmaNota.addEventListener('change', function() {
            const idTurma = this.value;
            if (!idTurma) return;
            
            // Buscar disciplinas da turma
            fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/disciplinas`))
                .then(response => response.ok ? response.json() : [])
                .then(disciplinas => {
                    selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina</option>';
                    disciplinas.forEach(disciplina => {
                        const option = document.createElement('option');
                        option.value = disciplina.id_disciplina;
                        option.textContent = disciplina.nome_disciplina;
                        selectDisciplinaNota.appendChild(option);
                    });
                    
                    // Habilitar o select de disciplinas
                    selectDisciplinaNota.disabled = false;
                })
                .catch(error => {
                    console.error(`Erro ao carregar disciplinas da turma ${idTurma}:`, error);
                    selectDisciplinaNota.innerHTML = '<option value="" disabled>Erro ao carregar disciplinas</option>';
                });
                
            // Resetar o select de alunos
            if (selectAlunoNota) {
                selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina primeiro</option>';
                selectAlunoNota.disabled = true;
            }
        });
    }
    
    // Carregar alunos quando uma disciplina for selecionada
    if (selectDisciplinaNota && selectAlunoNota) {
        selectDisciplinaNota.addEventListener('change', function() {
            const idDisciplina = this.value;
            const idTurma = selectTurmaNota.value;
            if (!idDisciplina || !idTurma) return;
            
            // Buscar alunos da turma
            fetch(CONFIG.getApiUrl(`/turmas/${idTurma}/alunos`))
                .then(response => response.ok ? response.json() : [])
                .then(alunos => {
                    selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione um aluno</option>';
                    
                    // Ordenar alunos por nome
                    alunos.sort((a, b) => a.nome_aluno.localeCompare(b.nome_aluno));
                    
                    alunos.forEach(aluno => {
                        const option = document.createElement('option');
                        option.value = aluno.id_aluno;
                        option.textContent = aluno.nome_aluno;
                        selectAlunoNota.appendChild(option);
                    });
                    
                    // Habilitar o select de alunos
                    selectAlunoNota.disabled = false;
                })
                .catch(error => {
                    console.error(`Erro ao carregar alunos da turma ${idTurma}:`, error);
                    selectAlunoNota.innerHTML = '<option value="" disabled>Erro ao carregar alunos</option>';
                });
        });
    }
    
    // Botão para cancelar edição
    if (btnCancelarNota) {
        btnCancelarNota.addEventListener('click', function(e) {
            e.preventDefault();
            resetarFormularioNota();
        });
    }

    // Exportar funções para o escopo global
    window.carregarNotas = carregarNotas;
}

/**
 * Carrega as turmas disponíveis para o select de notas
 */
function carregarTurmasNotas() {
    if (selectTurmaNota) {
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => response.ok ? response.json() : [])
            .then(turmas => {
                selectTurmaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma</option>';
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id_turma;
                    option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem nome'}`;
                    selectTurmaNota.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas para notas:", error);
                selectTurmaNota.innerHTML = '<option value="" disabled>Erro ao carregar turmas</option>';
            });
    }
}

/**
 * Carrega todas as notas e exibe na tabela
 */
function carregarNotas() {
    // Verificar novamente qual tabela está disponível (pode ter mudado se o usuário navegou)
    const tabelaAtual = document.getElementById('notas-lista') || document.querySelector('.notas-table tbody');
    
    if (!tabelaAtual) {
        console.error("Tabela de notas não encontrada!");
        return;
    }
    
    // Mostrar indicador de carregamento
    tabelaAtual.innerHTML = `
        <tr>
            <td colspan="10" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </td>
        </tr>
    `;
    
    // Buscar notas da API
    fetch(CONFIG.getApiUrl('/notas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar notas: ${response.status}`);
            }
            return response.json();
        })
        .then(notas => {
            console.log("Notas recuperadas da API:", notas ? (Array.isArray(notas) ? notas.length : "objeto") : "nenhuma");
            
            // Normalizar notas para garantir que seja um array
            let notasArray = [];
            if (Array.isArray(notas)) {
                notasArray = notas;
            } else if (notas && typeof notas === 'object') {
                // Tentar extrair notas de diferentes estruturas possíveis
                if (notas.notas && Array.isArray(notas.notas)) {
                    notasArray = notas.notas;
                } else {
                    notasArray = Object.values(notas).filter(item => item && typeof item === 'object');
                }
            }
            
            if (notasArray.length === 0) {
                tabelaAtual.innerHTML = `
                    <tr class="text-center">
                        <td colspan="10">Nenhuma nota cadastrada</td>
                    </tr>
                `;
                return;
            }
            
            // Obter informações adicionais necessárias (alunos, disciplinas, turmas)
            Promise.all([
                fetch(CONFIG.getApiUrl('/alunos')).then(r => r.ok ? r.json() : []),
                fetch(CONFIG.getApiUrl('/disciplinas')).then(r => r.ok ? r.json() : []),
                fetch(CONFIG.getApiUrl('/turmas')).then(r => r.ok ? r.json() : [])
            ])
            .then(([alunos, disciplinas, turmas]) => {
                // Limpar a tabela
                tabelaAtual.innerHTML = '';
                
                // Ordenar notas por ID do aluno e bimestre
                notasArray.sort((a, b) => {
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
                
                // Adicionar cada nota à tabela
                notasArray.forEach(nota => {
                    // Normalizar IDs para lidar com diferentes estruturas possíveis
                    const alunoId = nota.id_aluno || nota.aluno_id;
                    const disciplinaId = nota.id_disciplina || nota.disciplina_id;
                    const turmaId = nota.id_turma || nota.turma_id;
                    const notaId = nota.id_nota || nota.id || `${alunoId}-${disciplinaId}-${nota.bimestre}`;
                    
                    const aluno = alunos.find(a => a.id_aluno === alunoId) || { nome_aluno: `Aluno ${alunoId}` };
                    const disciplina = disciplinas.find(d => d.id_disciplina === disciplinaId) || { nome_disciplina: `Disciplina ${disciplinaId}` };
                    const turma = turmas.find(t => t.id_turma === turmaId) || { id_turma: turmaId || '-', serie: 'Desconhecida' };
                    
                    // Usar o campo ano diretamente da nota, se disponível
                    const ano = nota.ano || (turma.serie ? turma.serie.split('º')[0] : '-');
                    
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
                        <td>${turma.id_turma} - ${turma.serie || 'Série não informada'}</td>
                        <td>${disciplina.nome_disciplina}</td>
                        <td>${aluno.nome_aluno}</td>
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
                    
                    tabelaAtual.appendChild(tr);
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
                console.error("Erro ao processar dados para a tabela de notas:", error);
                tabelaAtual.innerHTML = `
                    <tr class="text-center">
                        <td colspan="10">Erro ao processar dados: ${error.message}</td>
                    </tr>
                `;
            });
        })
        .catch(error => {
            console.error("Erro ao carregar notas:", error);
            tabelaAtual.innerHTML = `
                <tr class="text-center">
                    <td colspan="10">Erro ao carregar notas: ${error.message}</td>
                </tr>
            `;
        });
}

/**
 * Salva uma nova nota ou atualiza uma existente
 */
function salvarNota() {
    const idTurma = selectTurmaNota.value;
    const idDisciplina = selectDisciplinaNota.value;
    const idAluno = selectAlunoNota.value;
    const valor = inputValorNota.value;
    const descricao = inputDescricaoNota.value;
    
    // Validar campos
    if (!idTurma || !idDisciplina || !idAluno || !valor) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const nota = {
        id_turma: idTurma,
        id_disciplina: idDisciplina,
        id_aluno: idAluno,
        valor: parseFloat(valor),
        descricao: descricao
    };
    
    // Modo novo ou edição
    const modo = formModoNota.value;
    const url = modo === 'novo' 
        ? CONFIG.getApiUrl('/notas') 
        : CONFIG.getApiUrl(`/notas/${formModoNota.getAttribute('data-id')}`);
    
    const method = modo === 'novo' ? 'POST' : 'PUT';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(nota)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao ${modo === 'novo' ? 'criar' : 'atualizar'} nota: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert(`Nota ${modo === 'novo' ? 'criada' : 'atualizada'} com sucesso!`);
        resetarFormularioNota();
        carregarNotas();
    })
    .catch(error => {
        console.error(`Erro ao ${modo === 'novo' ? 'salvar' : 'atualizar'} nota:`, error);
        alert(`Erro ao ${modo === 'novo' ? 'salvar' : 'atualizar'} nota: ${error.message}`);
    });
}

/**
 * Edita uma nota existente
 * @param {string} idNota ID da nota a ser editada
 */
function editarNota(idNota) {
    fetch(CONFIG.getApiUrl(`/notas/${idNota}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar nota: ${response.status}`);
            }
            return response.json();
        })
        .then(nota => {
            // Definir o modo do formulário
            formModoNota.value = 'editar';
            formModoNota.setAttribute('data-id', idNota);
            
            // Atualizar título do formulário
            formNotaTitulo.textContent = 'Editar Nota';
            
            // Preencher valores no formulário
            selectTurmaNota.value = nota.id_turma;
            
            // Disparar eventos de change manualmente para carregar os selects dependentes
            const eventTurma = new Event('change');
            selectTurmaNota.dispatchEvent(eventTurma);
            
            // Aguardar um pouco para o select de disciplinas ser preenchido
            setTimeout(() => {
                selectDisciplinaNota.value = nota.id_disciplina;
                
                const eventDisciplina = new Event('change');
                selectDisciplinaNota.dispatchEvent(eventDisciplina);
                
                // Aguardar para o select de alunos ser preenchido
                setTimeout(() => {
                    selectAlunoNota.value = nota.id_aluno;
                    inputValorNota.value = nota.valor;
                    inputDescricaoNota.value = nota.descricao || '';
                    
                    // Mostrar botão cancelar
                    btnCancelarNota.style.display = 'inline-block';
                    
                    // Rolar até o formulário
                    formNota.scrollIntoView({behavior: 'smooth'});
                }, 300);
            }, 300);
        })
        .catch(error => {
            console.error("Erro ao editar nota:", error);
            alert(`Erro ao carregar dados da nota: ${error.message}`);
        });
}

/**
 * Exclui uma nota
 * @param {string} idNota ID da nota a ser excluída
 */
function excluirNota(idNota) {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
        fetch(CONFIG.getApiUrl(`/notas/${idNota}`), {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao excluir nota: ${response.status}`);
            }
            return response.json();
        })
        .then(() => {
            alert('Nota excluída com sucesso!');
            carregarNotas();
        })
        .catch(error => {
            console.error("Erro ao excluir nota:", error);
            alert(`Erro ao excluir nota: ${error.message}`);
        });
    }
}

/**
 * Reseta o formulário de notas para o estado inicial
 */
function resetarFormularioNota() {
    formNota.reset();
    formModoNota.value = 'novo';
    formModoNota.removeAttribute('data-id');
    formNotaTitulo.textContent = 'Nova Nota';
    btnCancelarNota.style.display = 'none';
    
    // Desabilitar selects dependentes
    selectDisciplinaNota.disabled = true;
    selectDisciplinaNota.innerHTML = '<option value="" selected disabled>Selecione uma turma primeiro</option>';
    
    selectAlunoNota.disabled = true;
    selectAlunoNota.innerHTML = '<option value="" selected disabled>Selecione uma disciplina primeiro</option>';
}

// Exportar para o escopo global
window.initNotas = initNotas; 