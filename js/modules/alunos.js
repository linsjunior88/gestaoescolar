/**
 * alunos.js
 * Módulo para gerenciamento de alunos no sistema escolar
 */

// Inicialização do módulo de alunos
function initAlunos() {
    console.log("Inicializando módulo de alunos");
    
    // Elementos do formulário
    const formAluno = document.getElementById('form-aluno');
    const formModoAluno = document.getElementById('form-modo-aluno');
    const alunoIndex = document.getElementById('aluno-index');
    const idAluno = document.getElementById('id_aluno');
    const nomeAluno = document.getElementById('nome_aluno');
    const idTurma = document.getElementById('id_turma');
    const sexo = document.getElementById('sexo');
    const dataNasc = document.getElementById('data_nasc');
    const mae = document.getElementById('mae');
    const btnCancelarAluno = document.getElementById('btn-cancelar-aluno');
    const btnNovoAluno = document.getElementById('btn-novo-aluno');
    const alunosLista = document.getElementById('alunos-lista');
    
    // Verificar se os elementos existem
    if (!formAluno || !alunosLista) {
        console.error("Elementos do módulo de alunos não encontrados.");
        return;
    }
    
    // Carregar alunos e turmas para o select
    carregarAlunos();
    carregarTurmasParaAlunos();
    
    // Configurar botões do formulário
    if (btnNovoAluno) {
        btnNovoAluno.addEventListener('click', function() {
            resetarFormularioAluno();
            if (formAluno) formAluno.scrollIntoView({behavior: 'smooth'});
        });
    }
    
    if (btnCancelarAluno) {
        btnCancelarAluno.addEventListener('click', function() {
            resetarFormularioAluno();
        });
    }
    
    // Configurar formulário
    if (formAluno) {
        formAluno.addEventListener('submit', function(e) {
            e.preventDefault(); // Impedir o envio padrão do formulário
            console.log("Formulário de aluno submetido");
            
            // Validar campos obrigatórios
            if (!idAluno.value || !nomeAluno.value || !idTurma.value || !sexo.value || !dataNasc.value || !mae.value) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Coletar dados do formulário
            const aluno = {
                id_aluno: idAluno.value.trim(),
                nome_aluno: nomeAluno.value.trim(),
                id_turma: idTurma.value,
                sexo: sexo.value,
                data_nasc: dataNasc.value,
                mae: mae.value.trim()
            };
            
            console.log("Dados do aluno:", aluno);
            
            // Verificar modo de operação (novo ou edição)
            if (formModoAluno.value === 'novo') {
                // Adicionar novo aluno via API
                fetch(CONFIG.getApiUrl('/alunos'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(aluno)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao adicionar aluno: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Aluno adicionado com sucesso:', data);
                    alert('Aluno cadastrado com sucesso!');
                    resetarFormularioAluno();
                    carregarAlunos();
                })
                .catch(error => {
                    console.error('Erro ao adicionar aluno:', error);
                    alert('Erro ao adicionar aluno: ' + error.message);
                });
            } else {
                // Editar aluno existente via API
                fetch(CONFIG.getApiUrl(`/alunos/${aluno.id_aluno}`), {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(aluno)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao atualizar aluno: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Aluno atualizado com sucesso:', data);
                    alert('Aluno atualizado com sucesso!');
                    resetarFormularioAluno();
                    carregarAlunos();
                })
                .catch(error => {
                    console.error('Erro ao atualizar aluno:', error);
                    alert('Erro ao atualizar aluno: ' + error.message);
                    
                    // Verificar se precisa atualizar referências (legado para compatibilidade)
                    const antigoId = alunosLista.getAttribute('data-aluno-editando');
                    if (antigoId && antigoId !== aluno.id_aluno) {
                        atualizarReferenciasAposMudancaIdAluno(antigoId, aluno.id_aluno);
                    }
                });
            }
        });
    }
    
    /**
     * Carrega as turmas disponíveis para o formulário de alunos
     */
    function carregarTurmasParaAlunos() {
        console.log("Carregando turmas para o select de alunos");
        
        if (!idTurma) {
            console.error("Select de turmas para alunos não encontrado!");
            return;
        }
        
        // Mostrar indicador de carregamento
        idTurma.innerHTML = '<option value="">Carregando turmas...</option>';
        
        // Buscar turmas da API
        fetch(CONFIG.getApiUrl('/turmas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar turmas: ' + response.statusText);
                }
                return response.json();
            })
            .then(turmas => {
                console.log("Turmas recuperadas da API:", turmas.length);
                
                idTurma.innerHTML = '<option value="">Selecione uma turma</option>';
                
                if (turmas.length === 0) {
                    const option = document.createElement('option');
                    option.value = "";
                    option.textContent = "Nenhuma turma cadastrada";
                    option.disabled = true;
                    idTurma.appendChild(option);
                    return;
                }
                
                // Adicionar cada turma ao select
                turmas.forEach(turma => {
                    const option = document.createElement('option');
                    option.value = turma.id_turma;
                    option.textContent = `${turma.id_turma} - ${turma.serie}`;
                    idTurma.appendChild(option);
                });
            })
            .catch(error => {
                console.error("Erro ao carregar turmas para alunos:", error);
                idTurma.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            });
    }
    
    /**
     * Carrega a lista de alunos da API
     */
    function carregarAlunos() {
        console.log("Carregando alunos");
        
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
        
        // Buscar alunos da API
        fetch(CONFIG.getApiUrl('/alunos'))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao carregar alunos: ' + response.statusText);
                }
                return response.json();
            })
            .then(alunos => {
                console.log("Alunos recuperados da API:", alunos.length);
                
                if (alunos.length === 0) {
                    alunosLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="7">Nenhum aluno cadastrado</td>
                        </tr>
                    `;
                    return;
                }
                
                // Ordenar alunos pelo nome para melhor visualização
                alunos.sort((a, b) => {
                    const nomeA = a.nome_aluno || '';
                    const nomeB = b.nome_aluno || '';
                    return nomeA.localeCompare(nomeB);
                });
                
                // Limpar lista e preenchê-la com os alunos
                alunosLista.innerHTML = '';
                
                // Adicionar cada aluno à lista
                alunos.forEach(aluno => {
                    // Formatar data de nascimento
                    let dataNascFormatada = '-';
                    if (aluno.data_nasc) {
                        try {
                            // Garantir que a data seja interpretada no timezone local
                            const [ano, mes, dia] = aluno.data_nasc.split('-');
                            if (ano && mes && dia) {
                                const dataCorrigida = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                                dataNascFormatada = dataCorrigida.toLocaleDateString('pt-BR');
                            }
                        } catch (e) {
                            console.warn("Erro ao formatar data de nascimento:", e);
                        }
                    }
                    
                    // Verificar se todos os campos existem
                    const id = aluno.id_aluno || '-';
                    const nome = aluno.nome_aluno || '-';
                    const turma = aluno.id_turma || '-';
                    const sexoTexto = aluno.sexo === 'M' ? 'Masculino' : (aluno.sexo === 'F' ? 'Feminino' : '-');
                    const mae = aluno.mae || '-';
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${id}</td>
                        <td>${nome}</td>
                        <td>${turma}</td>
                        <td>${sexoTexto}</td>
                        <td>${dataNascFormatada}</td>
                        <td>${mae}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary editar-aluno me-1" data-id="${id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger excluir-aluno" data-id="${id}">
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
                console.error("Erro ao carregar alunos:", error);
                
                alunosLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="7">
                            Erro ao carregar alunos: ${error.message}
                        </td>
                    </tr>
                `;
            });
    }
    
    /**
     * Busca um aluno para edição
     * @param {string} alunoId ID do aluno a ser editado
     */
    function editarAluno(alunoId) {
        console.log(`Editando aluno com ID: ${alunoId}`);
        
        // Buscar dados do aluno na API
        fetch(CONFIG.getApiUrl(`/alunos/${alunoId}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar aluno: ' + response.statusText);
                }
                return response.json();
            })
            .then(aluno => {
                // Preencher formulário com dados do aluno
                formModoAluno.value = 'editar';
                idAluno.value = aluno.id_aluno;
                idAluno.readOnly = true; // Tornar ID somente leitura na edição
                nomeAluno.value = aluno.nome_aluno;
                idTurma.value = aluno.id_turma;
                sexo.value = aluno.sexo;
                
                // Formatar a data corretamente para o campo de data HTML
                if (aluno.data_nasc) {
                    // A data já vem no formato ISO (YYYY-MM-DD) do backend, que é o formato esperado
                    // pelo input type="date", então podemos usá-la diretamente
                    dataNasc.value = aluno.data_nasc;
                } else {
                    dataNasc.value = '';
                }
                
                mae.value = aluno.mae;
                
                // Guardar o ID original para verificar mudanças
                alunosLista.setAttribute('data-aluno-editando', aluno.id_aluno);
                
                // Atualizar título e mostrar botão cancelar
                document.getElementById('form-aluno-titulo').textContent = 'Editar Aluno';
                btnCancelarAluno.style.display = 'block';
                
                // Rolar para o formulário
                formAluno.scrollIntoView({behavior: 'smooth'});
            })
            .catch(error => {
                console.error("Erro ao buscar dados do aluno:", error);
                alert(`Erro ao buscar dados do aluno: ${error.message}`);
            });
    }
    
    /**
     * Exclui um aluno
     * @param {string} alunoId ID do aluno a ser excluído
     */
    function excluirAluno(alunoId) {
        console.log(`Excluindo aluno com ID: ${alunoId}`);
        
        // Confirmar exclusão
        if (confirm(`Tem certeza que deseja excluir o aluno ${alunoId}?`)) {
            // Excluir aluno na API
            fetch(CONFIG.getApiUrl(`/alunos/${alunoId}`), {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao excluir aluno: ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                alert('Aluno excluído com sucesso!');
                carregarAlunos();
            })
            .catch(error => {
                console.error("Erro ao excluir aluno:", error);
                alert(`Erro ao excluir aluno: ${error.message}`);
            });
        }
    }
    
    /**
     * Reseta o formulário de alunos
     */
    function resetarFormularioAluno() {
        console.log("Resetando formulário de aluno");
        
        // Resetar formulário
        formAluno.reset();
        formModoAluno.value = 'novo';
        alunoIndex.value = '';
        
        // Remover readonly do ID
        idAluno.readOnly = false;
        
        // Remover ID do aluno em edição
        alunosLista.removeAttribute('data-aluno-editando');
        
        // Atualizar título e esconder botão cancelar
        document.getElementById('form-aluno-titulo').textContent = 'Novo Aluno';
        btnCancelarAluno.style.display = 'none';
    }
    
    /**
     * Atualiza referências após mudança de ID de um aluno
     * @param {string} antigoId ID antigo do aluno
     * @param {string} novoId Novo ID do aluno
     */
    function atualizarReferenciasAposMudancaIdAluno(antigoId, novoId) {
        if (antigoId === novoId) return;
        
        console.log(`Atualizando referências: ID de aluno alterado de ${antigoId} para ${novoId}`);
        
        // Atualizar referências nas notas
        fetch(CONFIG.getApiUrl(`/notas?aluno=${antigoId}`))
            .then(response => response.ok ? response.json() : [])
            .then(notas => {
                if (notas.length === 0) return;
                
                console.log(`Encontradas ${notas.length} notas para atualizar referência do aluno`);
                
                // Criar promessas para atualizar cada nota
                const atualizacoes = notas.map(nota => {
                    const notaAtualizada = { ...nota, id_aluno: novoId };
                    return fetch(CONFIG.getApiUrl(`/notas/${nota.id_nota}`), {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(notaAtualizada)
                    });
                });
                
                // Executar todas as atualizações
                return Promise.all(atualizacoes);
            })
            .then(() => {
                console.log("Referências atualizadas com sucesso");
            })
            .catch(error => {
                console.error("Erro ao atualizar referências após mudança de ID:", error);
            });
    }
}

// Exportar função para o escopo global
window.initAlunos = initAlunos; 