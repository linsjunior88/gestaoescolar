/**
 * disciplinas.js
 * Módulo para gerenciamento de disciplinas no sistema escolar
 */

// Inicialização do módulo de disciplinas
function initDisciplinas() {
    console.log("Inicializando módulo de disciplinas");
    
    // Obter elementos do DOM com os IDs corretos
    const formDisciplina = document.getElementById('form-disciplina');
    const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
    const disciplinasLista = document.getElementById('disciplinas-lista');
    const vinculoTurmasSelect = document.getElementById('vinculo_turmas');
    const turmasVinculadasArea = document.getElementById('turmas-vinculadas-preview');
    
    console.log("Elementos do módulo de disciplinas:", {
        formDisciplina,
        btnNovaDisciplina,
        disciplinasLista,
        vinculoTurmasSelect,
        turmasVinculadasArea
    });
    
    if (!formDisciplina || !btnNovaDisciplina || !disciplinasLista) {
        console.warn("Elementos essenciais do módulo de disciplinas não encontrados");
        return;
    }
    
    // Adicionar botão de diagnóstico de API na parte superior do formulário
    const diagBtn = document.createElement('button');
    diagBtn.type = 'button';
    diagBtn.className = 'btn btn-sm btn-info mb-3';
    diagBtn.innerHTML = '<i class="fas fa-sync"></i> Testar API de Turmas';
    diagBtn.onclick = diagnosticarApiTurmas;
    
    if (formDisciplina.querySelector('.card-body')) {
        formDisciplina.querySelector('.card-body').prepend(diagBtn);
    }
    
    // Adicionar event listener ao botão para nova disciplina
    btnNovaDisciplina.addEventListener('click', function() {
        // Chamar a função para preparar o formulário para nova disciplina
        prepararFormularioDisciplina();
        
        // Rolar até o formulário
        formDisciplina.scrollIntoView({ behavior: 'smooth' });
    });
    
    // Adicionar event listener ao formulário
    formDisciplina.addEventListener('submit', salvarDisciplina);
    
    // Adicionar event listener ao select de turmas para atualizar o preview
    if (vinculoTurmasSelect) {
        vinculoTurmasSelect.addEventListener('change', function() {
            console.log("Seleção de turmas alterada, atualizando preview");
            atualizarPreviewTurmasVinculadas();
        });
    }
    
    // Inicializar o formulário logo no início
    prepararFormularioDisciplina();
    
    // Carregar lista de disciplinas
    carregarDisciplinas();
}

/**
 * Cria uma nova disciplina através da API
 * @param {Object} disciplina Dados da disciplina a ser criada
 * @returns {Promise} Promise com o resultado da operação
 */
function criarDisciplina(disciplina) {
    return fetch(CONFIG.getApiUrl('/disciplinas/'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(disciplina)
    });
}

/**
 * Busca as informações de uma disciplina para edição
 * @param {string} idDisciplinaValue ID da disciplina a ser editada
 * @returns {Promise} Promise com os dados da disciplina
 */
function buscarDisciplina(idDisciplinaValue) {
    // Buscar informações da disciplina para edição
    return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplinaValue}`))
        .then(response => {
            if (!response.ok) {
                throw new Error('Disciplina não encontrada');
            }
            return response.json();
        })
        .then(disciplina => {
            // Se não tiver turmas_vinculadas, buscar da API especificamente
            if (!disciplina.turmas_vinculadas || !Array.isArray(disciplina.turmas_vinculadas) || disciplina.turmas_vinculadas.length === 0) {
                console.log("Buscando turmas vinculadas via endpoint específico");
                return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplinaValue}/turmas`))
                    .then(response => {
                        if (!response.ok) {
                            console.warn("Não foi possível buscar as turmas vinculadas, usando array vazio");
                            return { ...disciplina, turmas_vinculadas: [] };
                        }
                        return response.json()
                            .then(turmasVinculadas => {
                                console.log("Turmas vinculadas encontradas:", turmasVinculadas);
                                return { 
                                    ...disciplina, 
                                    turmas_vinculadas: turmasVinculadas 
                                };
                            });
                    })
                    .catch(error => {
                        console.error("Erro ao buscar turmas vinculadas:", error);
                        return { ...disciplina, turmas_vinculadas: [] };
                    });
            }
            
            // Já tem turmas_vinculadas no objeto
            return disciplina;
        });
}

/**
 * Salva uma disciplina (nova ou edição)
 * @param {Event} event Evento de submit do formulário
 */
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
    
    // Obter turmas selecionadas usando métodos múltiplos e robustos
    let turmasSelecionadas = [];
    
    // Se estamos no modo editar, primeiro obtém as turmas vinculadas originais como garantia
    const isEditMode = formDisciplina.getAttribute('data-mode') === 'editar';
    let turmasOriginais = [];
    
    if (isEditMode) {
        try {
            // Tentar recuperar os dados originais da disciplina (apenas em modo de edição)
            const disciplinaId = disciplina.id_disciplina;
            
            // Verificar se temos os dados da disciplina em um atributo de dados
            const turmasAttr = formDisciplina.getAttribute('data-turmas-vinculadas');
            if (turmasAttr) {
                turmasOriginais = JSON.parse(turmasAttr);
                console.log("Turmas originais recuperadas do atributo data:", turmasOriginais);
            } 
        } catch (e) {
            console.warn("Erro ao recuperar turmas originais:", e);
        }
    }
    
    // Obter turmas selecionadas
    if (turmasSelect) {
        try {
            console.log("Tentando obter turmas selecionadas via selectedOptions");
            const selectedOptions = turmasSelect.selectedOptions;
            if (selectedOptions && selectedOptions.length > 0) {
                turmasSelecionadas = Array.from(selectedOptions).map(option => option.value);
                console.log("Turmas obtidas via selectedOptions:", turmasSelecionadas);
            }
        } catch (e) {
            console.warn("Erro ao obter turmas via selectedOptions:", e);
            
            // Método alternativo: verificar options.selected manualmente
            try {
                turmasSelecionadas = Array.from(turmasSelect.options || [])
                    .filter(option => option.selected)
                    .map(option => option.value);
            } catch (e2) {
                console.warn("Erro ao verificar opções manualmente:", e2);
            }
        }
    }
    
    // Verificar se temos turmas selecionadas; se não, usar as originais em modo de edição
    if (turmasSelecionadas.length === 0 && isEditMode && turmasOriginais.length > 0) {
        console.warn("Nenhuma turma selecionada encontrada, usando turmas originais:", turmasOriginais);
        turmasSelecionadas = turmasOriginais;
    }
    
    console.log("Turmas finais selecionadas para salvar:", turmasSelecionadas);
    
    // Adicionar turmas ao objeto disciplina
    disciplina.turmas_vinculadas = turmasSelecionadas;
    
    // Determinar o método e endpoint baseado no modo
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
        return processarVinculosTurmas(disciplina.id_disciplina, turmasSelecionadas, turmasOriginais)
            .then(() => {
                // Mostrar mensagem de sucesso
                alert(isEditMode ? 'Disciplina atualizada com sucesso!' : 'Disciplina criada com sucesso!');
                
                // Resetar formulário
                resetarFormularioDisciplina();
                
                // Recarregar lista de disciplinas
                carregarDisciplinas();
            });
    })
    .catch(error => {
        console.error("Erro ao salvar disciplina:", error);
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
            submitBtn.innerHTML = 'Salvar';
        }
    });
}

/**
 * Carrega a lista de disciplinas do backend e atualiza a interface
 */
function carregarDisciplinas() {
    console.log("Iniciando carregamento de disciplinas");
    
    const disciplinasLista = document.getElementById('disciplinas-lista');
    if (!disciplinasLista) {
      console.error("Lista de disciplinas não encontrada");
      return;
    }
    
    // Verificar se já está carregando
    if (disciplinasLista.dataset.carregando === "true") {
      console.log("Carregamento de disciplinas já em andamento, ignorando chamada duplicada");
      return;
    }
    
    // Marcar como carregando
    disciplinasLista.dataset.carregando = "true";
    
    // Limpar completamente a lista antes de iniciar
    disciplinasLista.innerHTML = '';
    
    // Conjunto para controlar disciplinas já adicionadas
    const disciplinasProcessadas = new Set();
    
    // Exibir carregando
    disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Carregando disciplinas...</td></tr>';
    
    // Buscar disciplinas da API
    fetch(CONFIG.getApiUrl('/disciplinas/'))
      .then(response => {
        if (!response.ok) {
          throw new Error("Erro ao carregar disciplinas: " + response.statusText);
        }
        return response.json();
      })
      .then(disciplinas => {
        // Filtrar disciplinas duplicadas pelo ID
        const disciplinasUnicas = [];
        disciplinas.forEach(d => {
          if (!disciplinasProcessadas.has(d.id_disciplina)) {
            disciplinasProcessadas.add(d.id_disciplina);
            disciplinasUnicas.push(d);
          } else {
            console.log(`Disciplina duplicada ignorada: ${d.id_disciplina}`);
          }
        });
        
        // Ordenar as disciplinas por nome
        disciplinasUnicas.sort((a, b) => {
          const nomeA = (a.nome_disciplina || '').toLowerCase();
          const nomeB = (b.nome_disciplina || '').toLowerCase();
          return nomeA.localeCompare(nomeB);
        });
        
        // Verificar se a lista está vazia
        if (!disciplinasUnicas || disciplinasUnicas.length === 0) {
          disciplinasLista.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma disciplina cadastrada</td></tr>';
          disciplinasLista.dataset.carregando = "false";
          return;
        }
        
        // Limpar a lista antes de adicionar as linhas
        disciplinasLista.innerHTML = '';
        
        // Buscar todas as turmas para exibição nas linhas de disciplinas
        fetch(CONFIG.getApiUrl('/turmas'))
          .then(response => {
            if (!response.ok) {
              throw new Error("Erro ao carregar turmas: " + response.statusText);
            }
            return response.json();
          })
          .then(turmas => {
            console.log("Turmas carregadas:", turmas);
            
            // Para cada disciplina, obter as turmas vinculadas e criar a linha
            disciplinasUnicas.forEach(disciplina => {
              // Verificar se já temos as turmas vinculadas
              if (!disciplina.turmas_vinculadas || !Array.isArray(disciplina.turmas_vinculadas)) {
                // Buscar as turmas vinculadas da API
                console.log(`Buscando turmas vinculadas para disciplina ${disciplina.id_disciplina}`);
                
                // Usar o endpoint específico para buscar turmas vinculadas
                fetch(CONFIG.getApiUrl(`/disciplinas/${disciplina.id_disciplina}/turmas`))
                  .then(response => {
                    if (!response.ok) {
                      throw new Error(`Erro ${response.status} ao buscar turmas vinculadas`);
                    }
                    return response.json();
                  })
                  .then(turmasVinculadas => {
                    console.log(`Turmas vinculadas carregadas para ${disciplina.id_disciplina}:`, turmasVinculadas);
                    
                    // Adicionar as turmas vinculadas à disciplina
                    disciplina.turmas_vinculadas = turmasVinculadas;
                    
                    // Agora que temos as turmas, criar a linha
                    criarLinhaDisciplina(disciplina, turmas);
                  })
                  .catch(error => {
                    console.error(`Erro ao buscar turmas para disciplina ${disciplina.id_disciplina}:`, error);
                    disciplina.turmas_vinculadas = [];
                    criarLinhaDisciplina(disciplina, turmas);
                  });
              } else {
                // Já temos as turmas vinculadas, criar a linha diretamente
                criarLinhaDisciplina(disciplina, turmas);
              }
            });
            
            // Marcar como não mais carregando
            disciplinasLista.dataset.carregando = "false";
          })
          .catch(error => {
            console.error("Erro ao carregar turmas:", error);
            
            // Mesmo sem as turmas, tentar mostrar as disciplinas
            disciplinasUnicas.forEach(disciplina => {
              criarLinhaDisciplina(disciplina, []);
            });
            
            disciplinasLista.dataset.carregando = "false";
          });
      })
      .catch(error => {
        console.error("Erro ao carregar disciplinas:", error);
        disciplinasLista.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar disciplinas: ${error.message}</td></tr>`;
        disciplinasLista.dataset.carregando = "false";
      });
}

/**
 * Cria uma linha na tabela de disciplinas
 * @param {Object} disciplina Objeto com os dados da disciplina
 * @param {Array} turmas Lista de todas as turmas para referência
 */
function criarLinhaDisciplina(disciplina, turmas) {
    const disciplinasLista = document.getElementById('disciplinas-lista');
    if (!disciplinasLista) return;
    
    const idDisciplina = disciplina.id_disciplina;
    
    // Verificar se esta disciplina já foi adicionada à tabela
    if (disciplinasLista.querySelector(`tr[data-id="${idDisciplina}"]`)) {
        console.log(`Disciplina ${idDisciplina} já existe na tabela, ignorando`);
        return;
    }
    
    const row = document.createElement('tr');
    row.setAttribute('data-id', idDisciplina); // Adicionar atributo data-id
    
    let turmasTexto = '-';
    
    if (disciplina.turmas_vinculadas && disciplina.turmas_vinculadas.length > 0) {
        console.log(`Processando turmas vinculadas à disciplina ${disciplina.id_disciplina}:`, disciplina.turmas_vinculadas);
        
        const turmasFormatadas = disciplina.turmas_vinculadas.map(t => {
            // Normalizar o ID da turma, considerando diferentes formatos possíveis
            let idTurmaStr;
            if (typeof t === 'object' && t !== null) {
                idTurmaStr = String(t.id_turma || t.id || '');
            } else {
                idTurmaStr = String(t || '');
            }
            
            // Verificar se é um valor válido
            if (!idTurmaStr) {
                console.warn("Valor de turma inválido:", t);
                return '';
            }
            
            // Encontrar a turma completa pelo ID
            const turma = turmas.find(turma => 
                String(turma.id_turma) === idTurmaStr || String(turma.id) === idTurmaStr
            );
            
            if (turma) {
                return `${idTurmaStr} - ${turma.serie || turma.nome || 'Sem nome'}`;
            }
            return idTurmaStr;
        }).filter(t => t); // Remover itens vazios
        
        if (turmasFormatadas.length > 0) {
            turmasTexto = turmasFormatadas.join(', ');
        }
    }
    
    // Criar células da linha
    row.innerHTML = `
        <td>${disciplina.id_disciplina || '-'}</td>
        <td>${disciplina.nome_disciplina || '-'}</td>
        <td>${disciplina.carga_horaria || '-'}</td>
        <td>${turmasTexto}</td>
        <td class="text-center">
            <button class="btn btn-sm btn-outline-primary btn-editar-disciplina" data-id="${disciplina.id_disciplina}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-excluir-disciplina" data-id="${disciplina.id_disciplina}" data-nome="${disciplina.nome_disciplina}">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    // Adicionar evento de edição
    const btnEditar = row.querySelector('.btn-editar-disciplina');
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            const id = btnEditar.getAttribute('data-id');
            console.log(`Botão editar clicado para disciplina ${id}`);
            
            // Preparar o formulário para edição
            prepararFormularioDisciplina(id);
        });
    }
    
    // Adicionar evento de exclusão
    const btnExcluir = row.querySelector('.btn-excluir-disciplina');
    if (btnExcluir) {
        btnExcluir.addEventListener('click', () => {
            const id = btnExcluir.getAttribute('data-id');
            const nome = btnExcluir.getAttribute('data-nome');
            console.log(`Botão excluir clicado para disciplina ${id}`);
            
            // Chamar função de exclusão
            excluirDisciplina(id, nome);
        });
    }
    
    // Adicionar a linha à tabela
    disciplinasLista.appendChild(row);
}

/**
 * Exclui uma disciplina
 * @param {string} idDisciplina ID da disciplina a excluir
 * @param {string} nomeDisciplina Nome da disciplina (para exibição na confirmação)
 */
function excluirDisciplina(idDisciplina, nomeDisciplina) {
    // Confirmar exclusão
    if (!confirm(`Tem certeza que deseja excluir a disciplina ${nomeDisciplina || idDisciplina}?`)) {
        return;
    }

    // Exibir mensagem de carregamento
    const disciplinasTableBody = document.getElementById('disciplinas-lista');
    if (disciplinasTableBody) {
        disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Excluindo disciplina...</td></tr>';
    }

    // Primeiro remover todos os vínculos com turmas
    console.log(`Removendo vínculos de turmas para a disciplina ${idDisciplina} antes de excluí-la`);
    
    fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}/turmas`), {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok && response.status !== 204) {
            console.warn(`Aviso: Não foi possível remover os vínculos de turmas: ${response.status} ${response.statusText}`);
            // Continuar mesmo com erro, pois o backend pode tratar isso automaticamente
        }
        
        // Após remover os vínculos (ou tentar), excluir a disciplina
        return fetch(CONFIG.getApiUrl(`/disciplinas/${idDisciplina}`), {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erro ao excluir disciplina: ${response.statusText}`);
        }
        return response.json();
    })
    .then(() => {
        // Mostrar alerta de sucesso
        alert('Disciplina excluída com sucesso!');
        
        // Recarregar lista de disciplinas
        carregarDisciplinas();
    })
    .catch(error => {
        console.error("Erro ao excluir disciplina:", error);
        alert(`Erro ao excluir disciplina: ${error.message}`);
        
        // Recarregar lista de disciplinas
        carregarDisciplinas();
    });
}

/**
 * Carrega as turmas para o select do formulário
 * @param {Array} turmasVinculadas Lista de IDs de turmas já vinculadas
 */
function carregarTurmasSelect(turmasVinculadas = []) {
    console.log('Carregando turmas para o select com turmas vinculadas:', turmasVinculadas);
    
    // Garantir que turmasVinculadas seja um array
    if (!Array.isArray(turmasVinculadas)) {
        console.warn('turmasVinculadas não é um array:', turmasVinculadas);
        turmasVinculadas = [];
    }
    
    // Extrair os IDs das turmas vinculadas, convertendo para string para comparação segura
    const turmasIds = turmasVinculadas.map(id => String(typeof id === 'object' ? (id.id_turma || id.id) : id));
    console.log('IDs das turmas vinculadas normalizados:', turmasIds);
    
    // Obter o elemento select
    const select = document.getElementById('vinculo_turmas');
    if (!select) {
        console.error('Select de turmas não encontrado (vinculo_turmas)');
        return;
    }
    
    console.log('Select encontrado:', select);
    
    // Mostrar mensagem de carregamento
    select.innerHTML = '<option value="">Carregando turmas...</option>';
    select.disabled = true;
    
    // Buscar turmas da API
    fetch(CONFIG.getApiUrl('/turmas'))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao buscar turmas: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(turmas => {
            console.log('Turmas recebidas da API:', turmas);
            
            // Limpar o select
            select.innerHTML = '';
            select.disabled = false;
            
            // Adicionar as opções
            if (!turmas || turmas.length === 0) {
                select.innerHTML = '<option value="">Nenhuma turma disponível</option>';
            } else {
                // Adicionar cada turma como opção
                turmas.forEach(turma => {
                    if (!turma) return; // Pular se a turma for inválida
                    
                    const turmaId = String(turma.id_turma || turma.id || '');
                    if (!turmaId) {
                        console.warn("Turma sem ID válido:", turma);
                        return; // Pular se não tiver ID
                    }
                    
                    const option = document.createElement('option');
                    option.value = turmaId;
                    option.textContent = `${turmaId} - ${turma.serie || turma.nome_turma || 'Sem nome'}`;
                    
                    // Verificar se a turma está vinculada
                    if (turmasIds.includes(turmaId)) {
                        option.selected = true;
                        console.log(`Turma ${turmaId} selecionada`);
                    }
                    
                    select.appendChild(option);
                });
                
                // Disparar evento change para atualizar o preview
                try {
                    const changeEvent = new Event('change');
                    select.dispatchEvent(changeEvent);
                } catch (e) {
                    console.warn("Erro ao disparar evento change:", e);
                }
            }
        })
        .catch(error => {
            console.error("Erro ao carregar turmas:", error);
            select.innerHTML = '<option value="">Erro ao carregar turmas</option>';
            select.disabled = false;
        });
} 