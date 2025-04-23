/**
 * turmas.js
 * Módulo para gerenciamento de turmas no sistema escolar
 */

// Inicialização do módulo de turmas
function initTurmas() {
    console.log("Inicializando módulo de turmas");
    
    // Elementos do formulário
    const formTurma = document.getElementById('form-turma');
    const formModo = document.getElementById('form-modo');
    const turmaIndex = document.getElementById('turma-index');
    const idTurmaInput = document.getElementById('id_turma_input');
    const serie = document.getElementById('serie');
    const turno = document.getElementById('turno');
    const tipoTurma = document.getElementById('tipo_turma');
    const coordenador = document.getElementById('coordenador');
    const btnCancelarTurma = document.getElementById('btn-cancelar-turma');
    const btnNovaTurma = document.getElementById('btn-nova-turma');
    const turmasLista = document.getElementById('turmas-lista');
    
    // Carregar turmas do backend
    carregarTurmas();
    
    // Mostrar o botão de cancelar sempre
    if (btnCancelarTurma) {
        btnCancelarTurma.style.display = 'inline-block';
    }
    
    // Configurar botões do formulário
    if (btnNovaTurma) {
        btnNovaTurma.onclick = function() {
            resetarFormularioTurma();
            if (formTurma) formTurma.scrollIntoView({behavior: 'smooth'});
        };
    }
    
    if (btnCancelarTurma) {
        btnCancelarTurma.onclick = function() {
            resetarFormularioTurma();
        };
    }
    
    // Configurar formulário
    if (formTurma) {
        formTurma.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulário de turma submetido");
            
            // Validar campos obrigatórios
            if (!idTurmaInput.value || !serie.value || !turno.value) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Coletar dados do formulário
            const turma = {
                id_turma: idTurmaInput.value.trim(),
                serie: serie.value.trim(),
                turno: turno.value,
                tipo_turma: tipoTurma.value.trim(),
                coordenador: coordenador.value.trim()
            };
            
            console.log("Dados da turma:", turma);
            
            // Verificar o modo (novo ou edição)
            if (formModo.value === 'novo') {
                // Criar nova turma via API
                criarTurma(turma);
            } else {
                // Editar turma existente via API
                editarTurma(turma.id_turma, turma);
            }
        });
    }
}

/**
 * Carrega a lista de turmas da API e atualiza a interface
 */
function carregarTurmas() {
    console.log("Carregando turmas...");
    
    // Obter o elemento da tabela de turmas
    const turmasTableBody = document.getElementById('turmas-lista');
    
    if (!turmasTableBody) {
        console.error("Elemento turmas-lista não encontrado!");
        return;
    }
    
    // Mostrar indicador de carregamento
    turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    
    // Fazer requisição à API
    fetch(CONFIG.getApiUrl('/turmas/'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || data.length === 0) {
                turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma turma encontrada.</td></tr>';
                return;
            }
            
            // Limpar a tabela
            turmasTableBody.innerHTML = '';
            
            // Adicionar cada turma à tabela
            data.forEach(turma => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${turma.id_turma}</td>
                    <td>${turma.serie || '-'}</td>
                    <td>${turma.turno ? turno2texto(turma.turno) : '-'}</td>
                    <td>${turma.tipo_turma || 'Regular'}</td>
                    <td>${turma.coordenador || '-'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary edit-turma" data-id="${turma.id_turma}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-turma" data-id="${turma.id_turma}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                turmasTableBody.appendChild(row);
            });
            
            // Adicionar event listeners para os botões de editar
            document.querySelectorAll('.edit-turma').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    buscarTurmaParaEditar(id);
                });
            });
            
            // Adicionar event listeners para os botões de deletar
            document.querySelectorAll('.delete-turma').forEach(button => {
                button.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    excluirTurma(id);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar turmas:', error);
            turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar turmas. Por favor, tente novamente.</td></tr>';
        });
}

/**
 * Cria uma nova turma através da API
 * @param {Object} turma Dados da turma a ser criada
 */
function criarTurma(turma) {
    console.log("Criando nova turma:", turma);
    
    // Fazer requisição à API
    fetch(CONFIG.getApiUrl('/turmas/'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(turma)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao criar turma: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Turma criada com sucesso:', data);
        alert('Turma criada com sucesso!');
        
        // Limpar formulário e recarregar lista
        resetarFormularioTurma();
        carregarTurmas();
    })
    .catch(error => {
        console.error('Erro ao criar turma:', error);
        alert('Erro ao criar turma: ' + error.message);
    });
}

/**
 * Edita uma turma existente através da API
 * @param {string} turmaId ID da turma a ser editada
 * @param {Object} dadosTurma Novos dados da turma
 */
function editarTurma(turmaId, dadosTurma) {
    console.log("Editando turma ID:", turmaId);
    
    // Buscar os dados da turma
    fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`), {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosTurma)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar turma: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Turma atualizada com sucesso:', data);
        
        // Atualizar referências se o ID da turma mudou
        const turmaIndex = document.getElementById('turma-index');
        if (turmaIndex) {
            const antigoId = turmaIndex.value;
            if (antigoId !== dadosTurma.id_turma) {
                atualizarReferenciasAposMudancaIdTurma(antigoId, dadosTurma.id_turma);
            }
        }
        
        alert('Turma atualizada com sucesso!');
        
        // Limpar formulário e recarregar lista
        resetarFormularioTurma();
        carregarTurmas();
    })
    .catch(error => {
        console.error('Erro ao atualizar turma:', error);
        alert('Erro ao atualizar turma: ' + error.message);
    });
}

/**
 * Exclui uma turma através da API
 * @param {string} turmaId ID da turma a ser excluída
 */
function excluirTurma(turmaId) {
    console.log("Excluindo turma ID:", turmaId);
    
    if (confirm(`Tem certeza que deseja excluir a turma com ID ${turmaId}?`)) {
        // Buscar informações da turma para verificar se tem alunos
        fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar turma: ${response.status}`);
                }
                return response.json();
            })
            .then(turma => {
                // Verificar se a turma tem alunos antes de excluir (só um exemplo)
                if (turma.alunos && turma.alunos.length > 0) {
                    // Se tiver alunos, confirmar novamente
                    if (!confirm(`Atenção: Esta turma possui ${turma.alunos.length} alunos. A exclusão irá remover todos os vínculos. Deseja continuar?`)) {
                        return Promise.reject(new Error('Operação cancelada pelo usuário'));
                    }
                }
                
                // Prosseguir com a exclusão
                return fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`), {
                    method: 'DELETE'
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao excluir turma: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                console.log('Turma excluída com sucesso');
                alert('Turma excluída com sucesso!');
                carregarTurmas();
            })
            .catch(error => {
                if (error.message !== 'Operação cancelada pelo usuário') {
                    console.error('Erro ao excluir turma:', error);
                    alert('Erro ao excluir turma: ' + error.message);
                }
            });
    }
}

/**
 * Reseta o formulário de turma para o estado inicial
 */
function resetarFormularioTurma() {
    const formTurma = document.getElementById('form-turma');
    const formModo = document.getElementById('form-modo');
    const turmaIndex = document.getElementById('turma-index');
    const formTurmaTitulo = document.getElementById('form-turma-titulo');
    const idTurmaInput = document.getElementById('id_turma_input');
    
    if (!formTurma) return;
    
    formTurma.reset();
    if (formModo) formModo.value = 'novo';
    if (turmaIndex) turmaIndex.value = '';
    if (formTurmaTitulo) formTurmaTitulo.textContent = 'Nova Turma';
    
    // Não escondemos mais o botão de cancelar para que ele esteja sempre disponível
    // const btnCancelarTurma = document.getElementById('btn-cancelar-turma');
    // if (btnCancelarTurma) btnCancelarTurma.style.display = 'none';
    
    // Remover readonly do ID
    if (idTurmaInput) idTurmaInput.readOnly = false;
}

/**
 * Atualiza referências após mudança de ID da turma
 * @param {string} antigoId ID antigo da turma 
 * @param {string} novoId Novo ID da turma
 */
function atualizarReferenciasAposMudancaIdTurma(antigoId, novoId) {
    if (antigoId === novoId) return;
    
    console.log(`Atualizando referências de turma: ${antigoId} -> ${novoId}`);
    
    // Atualizar disciplinas vinculadas
    fetch(CONFIG.getApiUrl(`/disciplinas?turma=${antigoId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar disciplinas: ${response.status}`);
            }
            return response.json();
        })
        .then(disciplinas => {
            if (disciplinas && disciplinas.length > 0) {
                // Para cada disciplina, atualizar o vínculo com a turma
                const atualizacoes = disciplinas.map(disciplina => {
                    // Substituir o ID antigo pelo novo nos vínculos
                    if (disciplina.turmas_vinculadas) {
                        const index = disciplina.turmas_vinculadas.indexOf(antigoId);
                        if (index >= 0) {
                            const novosTurmasVinculadas = [...disciplina.turmas_vinculadas];
                            novosTurmasVinculadas[index] = novoId;
                            
                            // Atualizar a disciplina via API
                            return fetch(CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}`), {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    ...disciplina,
                                    turmas_vinculadas: novosTurmasVinculadas
                                })
                            });
                        }
                    }
                    return Promise.resolve();
                });
                
                return Promise.all(atualizacoes);
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar referências de disciplinas:", error);
        });
    
    // Atualizar alunos vinculados
    fetch(CONFIG.getApiUrl(`/alunos?turma=${antigoId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar alunos: ${response.status}`);
            }
            return response.json();
        })
        .then(alunos => {
            if (alunos && alunos.length > 0) {
                // Para cada aluno, atualizar o vínculo com a turma
                const atualizacoes = alunos.map(aluno => {
                    return fetch(CONFIG.getApiUrl(`/alunos/${aluno.id_aluno}`), {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...aluno,
                            id_turma: novoId
                        })
                    });
                });
                
                return Promise.all(atualizacoes);
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar referências de alunos:", error);
        });
    
    // Atualizar notas vinculadas
    fetch(CONFIG.getApiUrl(`/notas?turma=${antigoId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar notas: ${response.status}`);
            }
            return response.json();
        })
        .then(notas => {
            if (notas && notas.length > 0) {
                // Para cada nota, atualizar o vínculo com a turma
                const atualizacoes = notas.map(nota => {
                    return fetch(CONFIG.getApiUrl(`/notas/${nota.id}`), {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...nota,
                            id_turma: novoId
                        })
                    });
                });
                
                return Promise.all(atualizacoes);
            }
        })
        .catch(error => {
            console.error("Erro ao atualizar referências de notas:", error);
        });
}

/**
 * Busca uma turma para edição
 * @param {string} turmaId ID da turma a ser editada
 */
function buscarTurmaParaEditar(turmaId) {
    console.log("Buscando turma ID:", turmaId);
    
    // Buscar os dados da turma
    fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar turma: ${response.status}`);
            }
            return response.json();
        })
        .then(turma => {
            // Verificar se temos formulário para edição
            const formTurma = document.getElementById('form-turma');
            if (!formTurma) {
                console.error("Formulário de turma não encontrado!");
                return;
            }
            
            // Preencher campos do formulário
            if (document.getElementById('id_turma_input')) {
                document.getElementById('id_turma_input').value = turma.id_turma || '';
                document.getElementById('id_turma_input').readOnly = true; // Não permitir alterar ID
            }
            if (document.getElementById('serie')) {
                document.getElementById('serie').value = turma.serie || '';
            }
            if (document.getElementById('turno')) {
                document.getElementById('turno').value = turma.turno || '';
            }
            if (document.getElementById('tipo_turma')) {
                document.getElementById('tipo_turma').value = turma.tipo_turma || 'Regular';
            }
            if (document.getElementById('coordenador')) {
                document.getElementById('coordenador').value = turma.coordenador || '';
            }
            
            // Setar o modo do formulário para edição
            if (document.getElementById('form-modo')) {
                document.getElementById('form-modo').value = 'editar';
            }
            if (document.getElementById('turma-index')) {
                document.getElementById('turma-index').value = turma.id_turma;
            }
            
            // Atualizar título do formulário
            const formTitulo = document.getElementById('form-turma-titulo');
            if (formTitulo) {
                formTitulo.textContent = 'Editar Turma';
            }
            
            // Mostrar botão de cancelar
            const btnCancelar = document.getElementById('btn-cancelar-turma');
            if (btnCancelar) {
                btnCancelar.style.display = 'inline-block';
            }
            
            // Rolar até o formulário
            formTurma.scrollIntoView({behavior: 'smooth'});
        })
        .catch(error => {
            console.error("Erro ao buscar turma:", error);
            alert(`Erro ao buscar dados da turma: ${error.message}`);
        });
}

/**
 * Carrega turmas para uso em selects
 * @param {Array} turmasVinculadas Array com IDs de turmas já vinculadas (opcional)
 */
function carregarTurmasSelect(turmasVinculadas = []) {
    console.log("Carregando turmas para select");
    
    // Buscar os elementos select que precisam ser preenchidos
    const selects = document.querySelectorAll('select[data-turmas]');
    
    if (selects.length === 0) {
        // Tenta buscar pelo ID padrão
        const vinculoTurmas = document.getElementById('vinculo_turmas');
        if (vinculoTurmas) {
            selects.push(vinculoTurmas);
        }
    }
    
    if (selects.length === 0) {
        console.log("Nenhum select de turmas encontrado para preencher");
        return;
    }
    
    // Fazer requisição à API
    fetch(CONFIG.getApiUrl('/turmas/'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Para cada select encontrado, preencher com as turmas
            selects.forEach(select => {
                // Limpar opções existentes
                select.innerHTML = '';
                
                if (!data || data.length === 0) {
                    select.innerHTML = '<option value="">Nenhuma turma disponível</option>';
                    return;
                }
                
                // Adicionar opção em branco se não for múltiplo
                if (!select.multiple) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'Selecione uma turma';
                    select.appendChild(option);
                }
                
                // Adicionar cada turma como opção
                data.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id_turma;
                    option.textContent = `${turma.id_turma} - ${turma.serie || 'Sem série'}`;
                    
                    // Marcar como selecionado se estiver na lista de turmas vinculadas
                    if (turmasVinculadas && turmasVinculadas.includes(turma.id_turma)) {
                        option.selected = true;
                    }
                    
                    select.appendChild(option);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar turmas para select:', error);
            selects.forEach(select => {
                select.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            });
        });
}

/**
 * Função de diagnóstico para testar a API de turmas
 */
function diagnosticarApiTurmas() {
    console.log("Iniciando diagnóstico de API de turmas");
    
    // Criar container de diagnóstico
    const diagContainer = document.createElement('div');
    diagContainer.className = 'alert alert-info';
    diagContainer.innerHTML = '<p><strong>Diagnóstico da API de Turmas</strong></p><div id="diag-result">Testando conexão...</div>';
    
    // Adicionar ao formulário
    const formBody = document.querySelector('#form-disciplina .card-body') || 
                     document.querySelector('#form-turma .card-body');
    
    if (formBody) {
        // Remover diagnóstico anterior se existir
        const oldDiag = formBody.querySelector('#api-diag-container');
        if (oldDiag) oldDiag.remove();
        
        // Adicionar novo container de diagnóstico
        diagContainer.id = 'api-diag-container';
        formBody.insertBefore(diagContainer, formBody.firstChild.nextSibling);
    } else {
        alert("Diagnóstico da API de turmas: não foi possível encontrar um local para exibir os resultados");
        console.log("Não foi possível encontrar um local para exibir os resultados do diagnóstico");
        return;
    }
    
    const resultDiv = diagContainer.querySelector('#diag-result');
    
    // Testar conexão com várias URLs da API
    const urls = [
        { url: CONFIG.getApiUrl('/turmas'), name: 'API configurada' },
        { url: 'http://localhost:4000/api/turmas', name: 'API local' },
        { url: '/api/turmas', name: 'API relativa' }
    ];
    
    // Adicionar loading para cada url
    urls.forEach(endpoint => {
        resultDiv.innerHTML += `<p data-url="${endpoint.url}"><strong>${endpoint.name}:</strong> <span class="loading">Testando...</span></p>`;
    });
    
    // Testar cada URL
    urls.forEach(endpoint => {
        const statusSpan = resultDiv.querySelector(`p[data-url="${endpoint.url}"] span`);
        
        fetch(endpoint.url)
            .then(response => {
                statusSpan.className = response.ok ? 'text-success' : 'text-warning';
                statusSpan.textContent = `Status: ${response.status} ${response.statusText}`;
                
                if (response.ok) {
                    return response.json().then(data => {
                        if (data && Array.isArray(data)) {
                            statusSpan.textContent += ` (${data.length} turmas encontradas)`;
                            
                            // Se for a primeira URL bem-sucedida, recarregar o select
                            const select = document.getElementById('vinculo_turmas');
                            if (select) {
                                select.innerHTML = '<option value="">Carregando turmas...</option>';
                                
                                // Recarregar turmas usando esta URL
                                fetch(endpoint.url)
                                    .then(r => r.json())
                                    .then(turmas => {
                                        // Processar turmas e preencher o select
                                        select.innerHTML = '';
                                        
                                        if (turmas && turmas.length > 0) {
                                            turmas.forEach(turma => {
                                                const option = document.createElement('option');
                                                option.value = turma.id_turma;
                                                option.textContent = `${turma.id_turma} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                                                select.appendChild(option);
                                            });
                                            
                                            statusSpan.textContent += ' ✓ Turmas carregadas!';
                                        } else {
                                            select.innerHTML = '<option value="">Nenhuma turma disponível</option>';
                                        }
                                    });
                            }
                        } else {
                            statusSpan.textContent += ' (resposta válida, mas formato inesperado)';
                        }
                    });
                }
            })
            .catch(error => {
                statusSpan.className = 'text-danger';
                statusSpan.textContent = `Erro: ${error.message}`;
            });
    });
    
    // Adicionar botão para forçar tentativa de carregamento
    const reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.className = 'btn btn-sm btn-warning mt-2';
    reloadBtn.textContent = 'Forçar carregamento de turmas';
    reloadBtn.onclick = () => {
        const vinculoTurmas = document.getElementById('vinculo_turmas');
        if (vinculoTurmas) {
            vinculoTurmas.innerHTML = '<option value="">Carregando turmas...</option>';
            carregarTurmasSelect([]);
        } else {
            alert("Não foi possível encontrar o elemento select de turmas");
        }
    };
    
    resultDiv.appendChild(document.createElement('hr'));
    resultDiv.appendChild(reloadBtn);
}

// Exportar funções para o escopo global
window.initTurmas = initTurmas;
window.carregarTurmas = carregarTurmas;
window.criarTurma = criarTurma;
window.editarTurma = editarTurma;
window.excluirTurma = excluirTurma;
window.resetarFormularioTurma = resetarFormularioTurma;
window.atualizarReferenciasAposMudancaIdTurma = atualizarReferenciasAposMudancaIdTurma;
window.buscarTurmaParaEditar = buscarTurmaParaEditar;
window.carregarTurmasSelect = carregarTurmasSelect;
window.diagnosticarApiTurmas = diagnosticarApiTurmas; 