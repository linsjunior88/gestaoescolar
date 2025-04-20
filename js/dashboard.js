// Versão simplificada do dashboard.js com funcionalidade essencial
// Esta correção remove a redeclaração de CONFIG que estava causando o erro

// Funções para inicialização das seções
function initTurmas() {
    console.log("Inicializando módulo de turmas");
    
    // Obter referências aos elementos da UI
    const turmasTableBody = document.getElementById('turmas-lista');
    const formTurma = document.getElementById('form-turma');
    const btnNovoTurma = document.getElementById('btn-nova-turma');
    
    // Adicionar evento de clique ao botão de nova turma
    if (btnNovoTurma) {
        btnNovoTurma.addEventListener('click', function() {
            resetarFormularioTurma();
            // Mostrar modal (se estiver usando Bootstrap)
            const modal = document.getElementById('modalTurma');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        });
    }
    
    // Configurar formulário de turmas
    if (formTurma) {
        formTurma.addEventListener('submit', function(e) {
            e.preventDefault();
            const idTurma = document.getElementById('id_turma').value.trim();
            const serieTurma = document.getElementById('serie_turma').value.trim();
            const turnoTurma = document.getElementById('turno_turma').value;
            
            // Validações básicas
            if (!idTurma || !serieTurma) {
                alert('Por favor, preencha todos os campos obrigatórios');
                return;
            }
            
            // Criar objeto turma
            const turma = {
                id_turma: idTurma,
                serie: serieTurma,
                turno: turnoTurma
            };
            
            // Verificar se é edição ou criação
            const isEditMode = formTurma.getAttribute('data-mode') === 'editar';
            const method = isEditMode ? 'PUT' : 'POST';
            const endpoint = isEditMode ? 
                CONFIG.getApiUrl(`/turmas/${turma.id_turma}`) : 
                CONFIG.getApiUrl('/turmas');
            
            // Enviar para a API
            fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(turma)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Turma salva com sucesso:", data);
                
                // Fechar modal
                const modal = document.getElementById('modalTurma');
                if (modal && typeof bootstrap !== 'undefined') {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) bsModal.hide();
                }
                
                // Recarregar lista de turmas
                carregarTurmas();
                
                // Mostrar mensagem de sucesso
                alert(`Turma ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
            })
            .catch(error => {
                console.error("Erro ao salvar turma:", error);
                alert(`Erro ao salvar turma: ${error.message}`);
            });
        });
    }
    
    // Adicionar eventos para botões de editar e excluir (delegação de eventos)
    if (turmasTableBody) {
        turmasTableBody.addEventListener('click', function(e) {
            const target = e.target.closest('.edit-turma, .delete-turma');
            if (!target) return;
            
            const turmaId = target.getAttribute('data-id');
            if (!turmaId) {
                console.error("ID da turma não encontrado no botão");
                return;
            }
            
            if (target.classList.contains('edit-turma')) {
                editarTurma(turmaId);
            } else if (target.classList.contains('delete-turma')) {
                if (confirm(`Tem certeza que deseja excluir a turma ${turmaId}?`)) {
                    excluirTurma(turmaId);
                }
            }
        });
    }
    
    // Carregar turmas inicialmente
    carregarTurmas();
}

// Função para inicializar as disciplinas
function initDisciplinas() {
    console.log("Inicializando módulo de disciplinas");
    
    // Obter referências aos elementos da UI
    const disciplinasTableBody = document.getElementById('disciplinas-lista');
    const formDisciplina = document.getElementById('form-disciplina');
    const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    
    // Adicionar evento de clique ao botão de nova disciplina
    if (btnNovaDisciplina) {
        btnNovaDisciplina.addEventListener('click', function() {
            resetarFormularioDisciplina();
            // Mostrar modal (se estiver usando Bootstrap)
            const modal = document.getElementById('modalDisciplina');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        });
    }
    
    // Configurar formulário
    if (formDisciplina) {
        formDisciplina.addEventListener('submit', salvarDisciplina);
    }
    
    // Adicionar eventos para botões de editar e excluir (delegação de eventos)
    if (disciplinasTableBody) {
        disciplinasTableBody.addEventListener('click', function(e) {
            const target = e.target.closest('.edit-disciplina, .delete-disciplina');
            if (!target) return;
            
            const disciplinaId = target.getAttribute('data-id');
            if (!disciplinaId) {
                console.error("ID da disciplina não encontrado no botão");
                return;
            }
            
            if (target.classList.contains('edit-disciplina')) {
                editarDisciplina(disciplinaId);
            } else if (target.classList.contains('delete-disciplina')) {
                if (confirm(`Tem certeza que deseja excluir a disciplina ${disciplinaId}?`)) {
                    excluirDisciplina(disciplinaId);
                }
            }
        });
    }
    
    // Carregar disciplinas inicialmente
    carregarDisciplinas();
}

// Função para carregar turmas da API
function carregarTurmas() {
    console.log("Carregando turmas da API...");
    const turmasTableBody = document.getElementById('turmas-lista');
    
    if (!turmasTableBody) {
        console.error("Elemento da tabela de turmas não encontrado");
        return;
    }
    
    // Mostrar indicador de carregamento
    turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    
    // Fazer requisição à API
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Turmas carregadas:", data);
            
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
        })
        .catch(error => {
            console.error("Erro ao carregar turmas:", error);
            turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar turmas. Tente novamente mais tarde.</td></tr>';
            
            // Tentar buscar do cache local
            const turmasLocal = JSON.parse(localStorage.getItem('turmas') || '[]');
            if (turmasLocal.length > 0) {
                console.log("Usando dados do cache local para turmas");
                turmasTableBody.innerHTML += '<tr><td colspan="6" class="text-center text-warning">Exibindo dados do cache local.</td></tr>';
                
                // Adicionar turmas do cache
                turmasLocal.forEach(turma => {
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
            }
        });
}

// Função para carregar disciplinas
function carregarDisciplinas() {
    console.log("Carregando disciplinas da API...");
    const disciplinasTableBody = document.getElementById('disciplinas-lista');
    
    if (!disciplinasTableBody) {
        console.error("Elemento da tabela de disciplinas não encontrado");
        return;
    }
    
    // Mostrar indicador de carregamento
    disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
    
    // Fazer requisição à API
    fetch(CONFIG.getApiUrl('/disciplinas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Disciplinas carregadas:", data);
            
            if (!data || data.length === 0) {
                disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma disciplina encontrada.</td></tr>';
                return;
            }
            
            // Limpar a tabela
            disciplinasTableBody.innerHTML = '';
            
            // Adicionar cada disciplina à tabela
            data.forEach(disciplina => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${disciplina.id_disciplina}</td>
                    <td>${disciplina.nome_disciplina}</td>
                    <td>${disciplina.carga_horaria || '-'}</td>
                    <td>${disciplina.descricao || '-'}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary edit-disciplina" data-id="${disciplina.id_disciplina}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-disciplina" data-id="${disciplina.id_disciplina}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                disciplinasTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Erro ao carregar disciplinas:", error);
            disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar disciplinas. Tente novamente mais tarde.</td></tr>';
            
            // Tentar buscar do cache local
            const disciplinasLocal = JSON.parse(localStorage.getItem('disciplinas') || '[]');
            if (disciplinasLocal.length > 0) {
                console.log("Usando dados do cache local para disciplinas");
                disciplinasTableBody.innerHTML += '<tr><td colspan="5" class="text-center text-warning">Exibindo dados do cache local.</td></tr>';
                
                // Adicionar disciplinas do cache
                disciplinasLocal.forEach(disciplina => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${disciplina.id_disciplina}</td>
                        <td>${disciplina.nome_disciplina}</td>
                        <td>${disciplina.carga_horaria || '-'}</td>
                        <td>${disciplina.descricao || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary edit-disciplina" data-id="${disciplina.id_disciplina}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-disciplina" data-id="${disciplina.id_disciplina}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    disciplinasTableBody.appendChild(row);
                });
            }
        });
}

// Função para converter código de turno em texto legível
function turno2texto(turno) {
    switch(turno) {
        case 'M': return 'Manhã';
        case 'T': return 'Tarde';
        case 'N': return 'Noite';
        case 'I': return 'Integral';
        default: return turno;
    }
}

// Função para editar uma turma
function editarTurma(turmaId) {
    console.log("Editando turma:", turmaId);
    
    // Buscar dados da turma na API
    fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(turma => {
            // Preencher o formulário com os dados da turma
            const formTurma = document.getElementById('form-turma');
            const idTurmaField = document.getElementById('id_turma');
            const serieTurmaField = document.getElementById('serie_turma');
            const turnoTurmaField = document.getElementById('turno_turma');
            
            if (idTurmaField) idTurmaField.value = turma.id_turma;
            if (serieTurmaField) serieTurmaField.value = turma.serie || '';
            if (turnoTurmaField) turnoTurmaField.value = turma.turno || '';
            
            // Marcar o formulário como modo edição
            if (formTurma) {
                formTurma.setAttribute('data-mode', 'editar');
                // Guardar o ID original para caso seja alterado
                formTurma.setAttribute('data-original-id', turma.id_turma);
            }
            
            // Abrir o modal
            const modal = document.getElementById('modalTurma');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        })
        .catch(error => {
            console.error("Erro ao buscar dados da turma:", error);
            alert(`Erro ao carregar dados da turma: ${error.message}`);
        });
}

// Função para excluir uma turma
function excluirTurma(turmaId) {
    console.log("Excluindo turma:", turmaId);
    
    fetch(CONFIG.getApiUrl(`/turmas/${turmaId}`), {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        // Recarregar a lista de turmas
        carregarTurmas();
        alert(`Turma ${turmaId} excluída com sucesso!`);
    })
    .catch(error => {
        console.error("Erro ao excluir turma:", error);
        alert(`Erro ao excluir turma: ${error.message}`);
    });
}

// Função para excluir uma disciplina
function excluirDisciplina(disciplinaId) {
    console.log("Excluindo disciplina:", disciplinaId);
    
    fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}`), {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        // Recarregar a lista de disciplinas
        carregarDisciplinas();
        alert(`Disciplina ${disciplinaId} excluída com sucesso!`);
    })
    .catch(error => {
        console.error("Erro ao excluir disciplina:", error);
        alert(`Erro ao excluir disciplina: ${error.message}`);
    });
}

// Função para resetar o formulário de turma
function resetarFormularioTurma() {
    console.log("Resetando formulário da turma");
    const form = document.getElementById('form-turma');
    if (form) {
        form.reset();
        form.setAttribute('data-mode', 'criar');
        form.removeAttribute('data-original-id');
    }
}

// Function to update preview of linked classes
function atualizarPreviewTurmasVinculadas() {
    console.log("Atualizando preview de turmas vinculadas");
    const vinculo_turmas = document.getElementById('vinculo_turmas');
    const previewArea = document.getElementById('turmas-vinculadas-preview');
    
    if (!vinculo_turmas || !previewArea) return;
    
    try {
        // Get selected options
        const selectedOptions = Array.from(vinculo_turmas.selectedOptions || []);
        if (selectedOptions.length === 0) {
            previewArea.innerHTML = '<div class="alert alert-info">Nenhuma turma selecionada</div>';
        } else {
            const badgesHtml = selectedOptions
                .map(option => `<span class="badge bg-primary me-1">${option.textContent}</span>`)
                .join('');
            
            previewArea.innerHTML = `<div class="mt-2"><div class="fw-bold mb-2">Turmas selecionadas:</div>${badgesHtml}</div>`;
        }
    } catch (error) {
        console.error("Erro ao atualizar preview de turmas:", error);
    }
}

// Function to edit a discipline
function editarDisciplina(disciplinaId) {
    console.log("Editando disciplina:", disciplinaId);
    // Find the discipline in the database
    fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}`))
        .then(response => response.ok ? response.json() : Promise.reject("Falha ao buscar disciplina"))
        .then(disciplina => {
            // Fill form with discipline data
            const idField = document.getElementById('id_disciplina');
            const nameField = document.getElementById('nome_disciplina');
            const hoursField = document.getElementById('carga_horaria');
            
            if (idField) idField.value = disciplina.id_disciplina;
            if (nameField) nameField.value = disciplina.nome_disciplina;
            if (hoursField) hoursField.value = disciplina.carga_horaria || 0;
            
            // Mark form as in edit mode
            const form = document.getElementById('form-disciplina');
            if (form) form.setAttribute('data-mode', 'editar');
            
            // Load associated classes
            carregarTurmasSelect(disciplina.turmas || []);
            
            // Abrir o modal
            const modal = document.getElementById('modalDisciplina');
            if (modal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            }
        })
        .catch(error => {
            console.error("Erro ao editar disciplina:", error);
            alert("Erro ao carregar a disciplina para edição.");
        });
}

// Function to load classes into a select element
function carregarTurmasSelect(turmasVinculadas = []) {
    console.log("Carregando turmas para o select, turmas vinculadas:", turmasVinculadas);
    
    const turmasSelect = document.getElementById('vinculo_turmas');
    if (!turmasSelect) return;
    
    // Clear current options
    turmasSelect.innerHTML = '';
    
    // Fetch all classes from API
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => response.ok ? response.json() : [])
        .then(turmas => {
            if (turmas.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'Nenhuma turma disponível';
                option.disabled = true;
                turmasSelect.appendChild(option);
                return;
            }
            
            // Add classes to select
            turmas.forEach(turma => {
                const option = document.createElement('option');
                option.value = turma.id_turma;
                option.textContent = `${turma.id_turma} - ${turma.serie || 'Série não informada'}`;
                
                // Check if this class is linked
                if (turmasVinculadas.includes(turma.id_turma)) {
                    option.selected = true;
                }
                
                turmasSelect.appendChild(option);
            });
            
            // Update preview
            atualizarPreviewTurmasVinculadas();
        })
        .catch(error => {
            console.error("Erro ao carregar turmas:", error);
            const option = document.createElement('option');
            option.textContent = 'Erro ao carregar turmas';
            option.disabled = true;
            turmasSelect.appendChild(option);
        });
}

// Function to process links between discipline and classes
function processarVinculosTurmas(idDisciplina, turmasSelecionadas, turmasOriginais) {
    console.log(`Processando vínculos para disciplina ${idDisciplina}`);
    console.log("Turmas selecionadas:", turmasSelecionadas);
    console.log("Turmas originais:", turmasOriginais);
    
    // Get authentication token if available
    const token = localStorage.getItem('token');
    const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    // If no classes selected, remove all existing links
    if (!turmasSelecionadas || turmasSelecionadas.length === 0) {
        return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas`), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            }
        })
        .then(response => {
            if (!response.ok && response.status !== 204) {
                throw new Error(`Erro ao remover vínculos: ${response.status}`);
            }
            return { message: "Todos os vínculos foram removidos" };
        });
    }
    
    // First, get currently linked classes
    return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas`), {
        headers: authHeader
    })
    .then(response => {
        if (!response.ok) {
            console.warn("Erro ao buscar turmas vinculadas da API, usando turmas originais");
            return turmasOriginais;
        }
        return response.json();
    })
    .then(turmasVinculadas => {
        // Normalize class IDs
        const turmasVinculadasIds = turmasVinculadas.map(turma => 
            typeof turma === 'object' ? turma.id_turma : turma
        );
        
        console.log("Turmas atualmente vinculadas:", turmasVinculadasIds);
        
        // First remove all links
        return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas`), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader
            }
        })
        .then(response => {
            if (!response.ok && response.status !== 204) {
                throw new Error(`Erro ao remover vínculos existentes: ${response.status}`);
            }
            
            // Send list of classes at once
            return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ turmas_ids: turmasSelecionadas })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao vincular turmas: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Vínculos criados com sucesso:`, result);
                return {
                    message: `${result.length} vínculos criados com sucesso`
                };
            })
            .catch(error => {
                console.error("Erro ao criar vínculos de turmas:", error);
                return { message: "Erro ao criar vínculos: " + error.message };
            });
        });
    })
    .catch(error => {
        console.error("Erro ao processar vínculos de turmas:", error);
        throw error;
    });
}

// Adicionar as funções que faltam para manter compatibilidade
function resetarFormularioDisciplina() {
    console.log("Resetando formulário da disciplina");
    const form = document.getElementById('form-disciplina');
    if (form) {
        form.reset();
        form.setAttribute('data-mode', 'criar');
    }
    
    // Limpar select de turmas
    const turmasSelect = document.getElementById('vinculo_turmas');
    if (turmasSelect) {
        turmasSelect.innerHTML = '';
        // Carregar turmas vazias para o select
        carregarTurmasSelect([]);
    }
}

// Função para atualizar o preview de turmas vinculadas usando checkboxes
function atualizarPreviewTurmasVinculadasCheckbox() {
    console.log("Atualizando preview de turmas vinculadas (checkboxes)");
    const previewArea = document.getElementById('turmas-vinculadas-preview');
    
    if (!previewArea) {
        console.error("Área de preview não encontrada");
        return;
    }
    
    // Obter todas as checkboxes marcadas
    const turmasSelecionadas = Array.from(document.querySelectorAll('.turma-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    console.log("Turmas selecionadas para preview (checkboxes):", turmasSelecionadas);
    
    // Atualizar a área de preview
    if (turmasSelecionadas.length === 0) {
        previewArea.innerHTML = '<div class="alert alert-info">Nenhuma turma selecionada</div>';
    } else {
        previewArea.innerHTML = '<strong>Turmas selecionadas:</strong> ';
        
        // Buscar detalhes das turmas selecionadas
        const turmaBadges = Array.from(document.querySelectorAll('.turma-checkbox:checked')).map(checkbox => {
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            const turmaTexto = label ? label.textContent : checkbox.value;
            
            return `<span class="badge bg-primary me-1">${turmaTexto}</span>`;
        });
        
        previewArea.innerHTML += turmaBadges.join('');
    }
}

// Função para salvar disciplina
function salvarDisciplina(event) {
    event.preventDefault();
    console.log("Iniciando salvarDisciplina()");
    
    const formDisciplina = document.getElementById('form-disciplina');
    const idDisciplinaField = document.getElementById('id_disciplina');
    const nomeDisciplinaField = document.getElementById('nome_disciplina');
    const cargaHorariaField = document.getElementById('carga_horaria');
    const turmasSelect = document.getElementById('vinculo_turmas');
    
    if (!formDisciplina || !idDisciplinaField || !nomeDisciplinaField) {
        console.error("Campos do formulário não encontrados");
        alert("Erro ao processar formulário: campos não encontrados");
        return;
    }
    
    // Validar campos obrigatórios
    if (!idDisciplinaField.value.trim() || !nomeDisciplinaField.value.trim()) {
        alert("Por favor, preencha todos os campos obrigatórios");
        return;
    }
    
    // Criar objeto disciplina
    const disciplina = {
        id_disciplina: idDisciplinaField.value.trim(),
        nome_disciplina: nomeDisciplinaField.value.trim(),
        carga_horaria: parseInt(cargaHorariaField ? cargaHorariaField.value.trim() : 0) || 0
    };
    
    // Obter turmas selecionadas
    let turmasSelecionadas = [];
    if (turmasSelect) {
        turmasSelecionadas = Array.from(turmasSelect.selectedOptions || [])
            .map(option => option.value);
    }
    
    // Determinar o método baseado no modo
    const isEditMode = formDisciplina.getAttribute('data-mode') === 'editar';
    const method = isEditMode ? 'PUT' : 'POST';
    const endpoint = isEditMode 
        ? CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}`) 
        : CONFIG.getApiUrl('/disciplinas');
    
    console.log(`Enviando dados via ${method} para ${endpoint}:`, disciplina);
    
    // Exibir mensagem de loading
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'alert alert-info mt-2';
    loadingMsg.textContent = 'Salvando disciplina...';
    formDisciplina.appendChild(loadingMsg);
    
    // Desabilitar o botão de submit durante o processamento
    const submitBtn = formDisciplina.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    }
    
    // Enviar os dados para a API
    fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(disciplina)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Disciplina salva com sucesso:", data);
        
        // Processar os vínculos com as turmas após salvar a disciplina
        return processarVinculosTurmas(disciplina.id_disciplina, turmasSelecionadas, [])
            .then(resultadoVinculos => {
                console.log("Resultado do processamento de vínculos:", resultadoVinculos);
                return data;
            })
            .catch(erroVinculos => {
                console.error("Erro ao processar vínculos com turmas:", erroVinculos);
                return data;
            });
    })
    .then(data => {
        // Atualizar a lista de disciplinas
        if (typeof carregarDisciplinas === 'function') {
            carregarDisciplinas();
        }
        
        // Fechar o modal se estiver usando Bootstrap
        const modal = document.getElementById('modalDisciplina');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }
        
        // Resetar o formulário
        resetarFormularioDisciplina();
        
        // Mostrar mensagem de sucesso
        alert(`Disciplina ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
    })
    .catch(error => {
        console.error(`Erro ao salvar disciplina: ${error}`);
        alert(`Erro ao salvar disciplina: ${error.message}`);
    })
    .finally(() => {
        // Remover mensagem de loading
        if (loadingMsg.parentNode) {
            loadingMsg.parentNode.removeChild(loadingMsg);
        }
        
        // Reativar o botão de submit
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? 'Atualizar' : 'Salvar';
        }
    });
}
