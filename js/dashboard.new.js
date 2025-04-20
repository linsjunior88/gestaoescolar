// Simplified version of dashboard.js with core functionality
// This file fixes syntax errors in the original file while maintaining essential features

// Global variables for configuration
const CONFIG = window.CONFIG || {
    getApiUrl: function(endpoint) {
        return `/api${endpoint}`;
    }
};

// Function to update preview of linked classes
function atualizarPreviewTurmasVinculadas() {
    console.log("Updating preview of linked classes");
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
        console.error("Error updating class preview:", error);
    }
}

// Function to edit a discipline
function editarDisciplina(disciplinaId) {
    console.log("Editing discipline:", disciplinaId);
    // Find the discipline in the database
    fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}`))
        .then(response => response.ok ? response.json() : Promise.reject("Failed to fetch discipline"))
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
            console.error("Error editing discipline:", error);
            alert("Erro ao carregar a disciplina para edição.");
        });
}

// Function to load classes into a select element
function carregarTurmasSelect(turmasVinculadas = []) {
    console.log("Loading classes for select element, linked classes:", turmasVinculadas);
    
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
            console.error("Error loading classes:", error);
            const option = document.createElement('option');
            option.textContent = 'Erro ao carregar turmas';
            option.disabled = true;
            turmasSelect.appendChild(option);
        });
}

// Function to process links between discipline and classes
function processarVinculosTurmas(idDisciplina, turmasSelecionadas, turmasOriginais) {
    console.log(`Processing links for discipline ${idDisciplina}`);
    console.log("Selected classes:", turmasSelecionadas);
    console.log("Original classes:", turmasOriginais);
    
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
                throw new Error(`Error removing links: ${response.status}`);
            }
            return { message: "All links have been removed" };
        });
    }
    
    // First, get currently linked classes
    return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas`), {
        headers: authHeader
    })
    .then(response => {
        if (!response.ok) {
            console.warn("Error fetching linked classes from API, using original classes");
            return turmasOriginais;
        }
        return response.json();
    })
    .then(turmasVinculadas => {
        // Normalize class IDs
        const turmasVinculadasIds = turmasVinculadas.map(turma => 
            typeof turma === 'object' ? turma.id_turma : turma
        );
        
        console.log("Currently linked classes:", turmasVinculadasIds);
        
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
                throw new Error(`Error removing existing links: ${response.status}`);
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
                    throw new Error(`Error linking classes: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                console.log(`Links created successfully:`, result);
                return {
                    message: `${result.length} links created successfully`
                };
            })
            .catch(error => {
                console.error("Error creating class links:", error);
                return { message: "Error creating links: " + error.message };
            });
        });
    })
    .catch(error => {
        console.error("Error processing class links:", error);
        throw error;
    });
}
