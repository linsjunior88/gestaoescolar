// Versão simplificada do dashboard.js com funcionalidade essencial
// Esta correção remove a redeclaração de CONFIG que estava causando o erro

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
