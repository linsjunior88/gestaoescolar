/**
 * professores.js
 * Módulo para gerenciamento de professores no sistema escolar
 */

// Função de inicialização do módulo de professores
function initProfessores() {
    console.log("Inicializando módulo de professores");
    
    // Elementos do formulário
    const formProfessor = document.getElementById('form-professor');
    const formModoProfessor = document.getElementById('form-modo-professor');
    const idProfessor = document.getElementById('id_professor');
    const nomeProfessor = document.getElementById('nome_professor');
    const emailProfessor = document.getElementById('email_professor');
    const senhaProfessor = document.getElementById('senha_professor');
    const professoresLista = document.getElementById('professores-lista');
    const vinculoDisciplinas = document.getElementById('vinculo_disciplinas');
    const disciplinasTurmasLista = document.getElementById('disciplinas-turmas-lista');
    const formProfessorTitulo = document.getElementById('form-professor-titulo');
    const btnCancelarProfessor = document.getElementById('btn-cancelar-professor');
    
    // Verificar se os elementos existem
    if (!formProfessor || !professoresLista) {
        console.error("Elementos principais do módulo de professores não encontrados.");
        return;
    }
    
    // Carregar dados iniciais
    carregarProfessores();
    carregarDisciplinasSelect();
    carregarTabelaProfessoresDisciplinasTurmas();
    
    // Configurar eventos de formulário e botões
    if (formProfessor) {
        formProfessor.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulário de professor submetido");
            
            // Validar campos obrigatórios
            if (!idProfessor.value || !nomeProfessor.value) {
                alert('Por favor, preencha os campos obrigatórios.');
                return;
            }
            
            // Coletar dados do formulário
            const professor = {
                id_professor: idProfessor.value.trim(),
                nome_professor: nomeProfessor.value.trim(),
                email_professor: emailProfessor.value.trim(),
                senha_professor: senhaProfessor.value || undefined
            };
            
            // Verificar disciplinas selecionadas
            const disciplinasSelecionadas = [];
            if (vinculoDisciplinas) {
                Array.from(vinculoDisciplinas.selectedOptions).forEach(option => {
                    disciplinasSelecionadas.push(option.value);
                });
            }
            
            // Modo edição ou novo cadastro
            const modo = formModoProfessor.value;
            
            // Lógica de salvar
            salvarProfessor(professor, disciplinasSelecionadas, modo);
        });
    }
    
    // Configurar event listeners para botões
    if (btnCancelarProfessor) {
        btnCancelarProfessor.addEventListener('click', function() {
            resetFormProfessor();
        });
    }
    
    const btnNovoProfessor = document.getElementById('btn-novo-professor');
    if (btnNovoProfessor) {
        btnNovoProfessor.addEventListener('click', function() {
            resetFormProfessor();
            if (formProfessor) formProfessor.scrollIntoView({behavior: 'smooth'});
        });
    }
    
    // Configurar mudanças no select de disciplinas
    if (vinculoDisciplinas) {
        vinculoDisciplinas.addEventListener('change', function() {
            atualizarTabelaDisciplinasTurmas();
        });
    }
    
    /**
     * Salva um professor (novo ou edição)
     * @param {Object} professor - Dados do professor
     * @param {Array} disciplinasSelecionadas - IDs das disciplinas selecionadas
     * @param {string} modo - Modo de operação ('novo' ou 'editar')
     */
    function salvarProfessor(professor, disciplinasSelecionadas, modo) {
        console.log("Salvando professor:", professor, "Disciplinas:", disciplinasSelecionadas, "Modo:", modo);
        
        function verificarDisciplinasECriarVinculos(idProf, disciplinas) {
            if (disciplinas.length === 0) {
                console.log("Nenhuma disciplina selecionada, não há vínculos para criar.");
                return Promise.resolve();
            }
            
            // Primeiro verificar quais disciplinas têm turmas vinculadas
            const promessasVerificacao = disciplinas.map(idDisciplina => {
                return fetch(CONFIG.getApiUrl(`disciplinas/${idDisciplina}/turmas`))
                    .then(response => response.ok ? response.json() : [])
                    .then(turmas => {
                        return {
                            idDisciplina,
                            temTurmas: turmas && turmas.length > 0,
                            turmas: turmas || []
                        };
                    })
                    .catch(error => {
                        console.error(`Erro ao verificar turmas da disciplina ${idDisciplina}:`, error);
                        return {
                            idDisciplina,
                            temTurmas: false,
                            turmas: [],
                            erro: true
                        };
                    });
            });
            
            return Promise.all(promessasVerificacao)
                .then(resultados => {
                    console.log("Resultado da verificação de disciplinas:", resultados);
                    
                    // Verificar disciplinas sem turmas
                    const disciplinasSemTurmas = resultados.filter(r => !r.temTurmas).map(r => r.idDisciplina);
                    
                    if (disciplinasSemTurmas.length > 0) {
                        // Mostrar mensagem sobre disciplinas sem turmas
                        const mensagem = `ATENÇÃO: As disciplinas ${disciplinasSemTurmas.join(', ')} não possuem turmas vinculadas. É necessário vincular turmas a essas disciplinas no módulo de Disciplinas primeiro. Apenas as disciplinas com turmas serão vinculadas.`;
                        console.warn(mensagem);
                        alert(mensagem);
                    }
                    
                    // Filtrar apenas disciplinas com turmas para vincular
                    const disciplinasComTurmas = resultados.filter(r => r.temTurmas).map(r => r.idDisciplina);
                    
                    if (disciplinasComTurmas.length === 0) {
                        console.log("Nenhuma disciplina selecionada tem turmas. Não serão criados vínculos.");
                        return Promise.resolve();
                    }
                    
                    // Função para criar vínculos para cada disciplina
                    function criarVinculos(disciplinasParaVincular) {
                        const promessasVinculos = disciplinasParaVincular.map(idDisciplina => {
                            return fetch(CONFIG.getApiUrl('professores/vinculos'), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    id_professor: idProf,
                                    id_disciplina: idDisciplina
                                })
                            })
                            .then(response => {
                                if (!response.ok) {
                                    console.warn(`Aviso ao vincular disciplina ${idDisciplina}: ${response.statusText}`);
                                }
                                return response.json();
                            })
                            .catch(err => {
                                console.error(`Erro ao vincular disciplina ${idDisciplina}:`, err);
                                return null;
                            });
                        });
                        
                        return Promise.all(promessasVinculos);
                    }
                    
                    return criarVinculos(disciplinasComTurmas);
                });
        }
        
        if (modo === 'editar') {
            // Atualizar via API
            fetch(CONFIG.getApiUrl(`professores/${professor.id_professor}`), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(professor)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar professor: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log("Professor atualizado com sucesso:", data);
                
                // Verificar disciplinas e criar vínculos
                return verificarDisciplinasECriarVinculos(professor.id_professor, disciplinasSelecionadas)
                    .then(() => {
                        alert('Professor atualizado com sucesso!');
                        resetFormProfessor();
                        carregarProfessores();
                        carregarTabelaProfessoresDisciplinasTurmas();
                    });
            })
            .catch(error => {
                console.error("Erro ao atualizar professor:", error);
                alert("Erro ao atualizar professor: " + error.message);
            });
        } else {
            // Adicionar novo professor via API
            fetch(CONFIG.getApiUrl('professores'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(professor)
            })
            .then(response => {
                if (!response.ok) {
                    // Verificar se há mensagem de erro específica da API
                    return response.json()
                        .then(errorData => {
                            throw new Error(errorData.detail || errorData.message || `Erro ao adicionar professor: ${response.status} - ${response.statusText}`);
                        })
                        .catch(jsonError => {
                            // Se não conseguir ler o JSON, usar mensagem padrão
                            throw new Error(`Erro ao adicionar professor: ${response.status} - ${response.statusText}`);
                        });
                }
                return response.json();
            })
            .then(data => {
                console.log("Professor adicionado com sucesso:", data);
                
                // Verificar se há mensagens retornadas pelo servidor
                if (data.mensagens && data.mensagens.length > 0) {
                    // Mensagens de aviso sobre disciplinas sem turmas
                    const temAvisosTurmas = data.mensagens.some(msg => 
                        msg.includes("não tem turmas vinculadas"));
                    
                    if (temAvisosTurmas) {
                        alert("Professor adicionado com sucesso, mas algumas disciplinas não têm turmas vinculadas. Verifique as mensagens no console.");
                        console.log("Mensagens do servidor:", data.mensagens);
                        
                        // Mostrar avisos para cada disciplina sem turmas
                        const avisosTurmas = data.mensagens.filter(msg => 
                            msg.includes("não tem turmas vinculadas"));
                        
                        if (avisosTurmas.length > 0) {
                            const msg = "ATENÇÃO: " + avisosTurmas.join("\n");
                            console.warn(msg);
                        }
                    } else {
                        alert('Professor adicionado com sucesso!');
                    }
                } else {
                    alert('Professor adicionado com sucesso!');
                }
                
                // Verificar disciplinas e criar vínculos
                return verificarDisciplinasECriarVinculos(professor.id_professor, disciplinasSelecionadas)
                    .then(() => {
                        resetFormProfessor();
                        carregarProfessores();
                        carregarTabelaProfessoresDisciplinasTurmas();
                    });
            })
            .catch(error => {
                console.error("Erro ao adicionar professor:", error);
                alert(error.message);
            });
        }
    }
    
    /**
     * Carrega a lista de professores da API
     */
    function carregarProfessores() {
        console.log("Carregando professores");
        
        if (!professoresLista) {
            console.error("Lista de professores não encontrada!");
            return;
        }
        
        // Mostrar indicador de carregamento
        professoresLista.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Primeiro, buscar disciplinas para ter informações corretas
        fetch(CONFIG.getApiUrl('disciplinas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar disciplinas: ${response.statusText}`);
                }
                return response.json();
            })
            .then(disciplinasData => {
                // Agora buscar professores
                return fetch(CONFIG.getApiUrl('/professores'))
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Erro ao carregar professores: ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(professores => {
                        console.log("Professores carregados da API:", professores.length);
                        
                        // Deduplicate professores usando Map com ID como chave
                        const professoresMap = new Map();
                        professores.forEach(professor => {
                            professoresMap.set(professor.id_professor, professor);
                        });
                        
                        // Converter de volta para array
                        const professoresUnicos = Array.from(professoresMap.values());
                        console.log("Professores após remoção de duplicatas:", professoresUnicos.length);
                        
                        // Armazenar no localStorage
                        localStorage.setItem('professores', JSON.stringify(professoresUnicos));
                        
                        if (professoresUnicos.length === 0) {
                            professoresLista.innerHTML = `
                                <tr class="text-center">
                                    <td colspan="6">Nenhum professor cadastrado</td>
                                </tr>
                            `;
                            return;
                        }
                        
                        // Limpar a lista existente
                        professoresLista.innerHTML = '';
                        
                        // Criar uma linha na tabela para cada professor
                        const linhasPromessas = professoresUnicos.map(professor => {
                            // Encontrar nomes das disciplinas
                            let disciplinasNomes = '-';
                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                const nomesDisciplinas = professor.disciplinas.map(idDisc => {
                                    const disc = disciplinasData.find(d => d.id_disciplina === idDisc);
                                    return disc ? `${disc.id_disciplina} - ${disc.nome_disciplina}` : idDisc;
                                });
                                disciplinasNomes = nomesDisciplinas.join('<br>');
                            }
                            
                            // Para cada professor com disciplinas, buscar as turmas associadas
                            if (professor.disciplinas && professor.disciplinas.length > 0) {
                                // Criar um array de promessas para buscar as turmas de cada disciplina
                                const turmasPromessas = professor.disciplinas.map(disciplinaId => {
                                    return fetch(CONFIG.getApiUrl(`/disciplinas/${disciplinaId}/turmas`))
                                        .then(response => response.ok ? response.json() : [])
                                        .then(turmas => {
                                            // Retornar a lista de turmas para esta disciplina
                                            return {
                                                disciplinaId: disciplinaId,
                                                turmas: turmas
                                            };
                                        });
                                });
                                
                                // Awaitar todas as promessas de turmas
                                return Promise.all(turmasPromessas)
                                    .then(resultadosTurmas => {
                                        // Construir a coluna de turmas
                                        let turmasHTML = '-';
                                        if (resultadosTurmas.length > 0) {
                                            const turmasPorDisciplina = resultadosTurmas.map(resultado => {
                                                const disciplina = disciplinasData.find(d => d.id_disciplina === resultado.disciplinaId);
                                                const nomeDisciplina = disciplina ? disciplina.id_disciplina : resultado.disciplinaId;
                                                
                                                if (resultado.turmas.length > 0) {
                                                    const turmasTexto = resultado.turmas.map(t => 
                                                        `${t.id_turma} (${t.serie || 'Série não informada'})`
                                                    ).join(', ');
                                                    return `<strong>${nomeDisciplina}</strong>: ${turmasTexto}`;
                                                } else {
                                                    return `<strong>${nomeDisciplina}</strong>: <span class="text-warning">Nenhuma turma</span>`;
                                                }
                                            });
                                            turmasHTML = turmasPorDisciplina.join('<br>');
                                        }
                                        
                                        // Criar a linha da tabela
                                        const tr = document.createElement('tr');
                                        tr.dataset.professor = professor.id_professor;
                                        tr.classList.add('professor-row');
                                        tr.style.cursor = 'pointer';
                                        
                                        tr.innerHTML = `
                                            <td>${professor.id_professor}</td>
                                            <td>${professor.nome_professor}</td>
                                            <td>${professor.email_professor || '-'}</td>
                                            <td>${disciplinasNomes}</td>
                                            <td>${turmasHTML}</td>
                                            <td class="text-center">
                                                <button class="btn btn-sm btn-outline-primary edit-professor" data-id="${professor.id_professor}">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-danger delete-professor" data-id="${professor.id_professor}">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        `;
                                        
                                        // Adicionar evento de clique para detalhar
                                        tr.addEventListener('click', function(e) {
                                            // Não executar se o clique foi em um botão
                                            if (e.target.closest('button')) return;
                                            
                                            // Remover seleção anterior
                                            document.querySelectorAll('.professor-row').forEach(row => {
                                                row.classList.remove('table-primary');
                                            });
                                            
                                            // Adicionar seleção a esta linha
                                            this.classList.add('table-primary');
                                            
                                            // Filtrar a tabela de vínculos para mostrar apenas este professor
                                            const professorId = this.dataset.professor;
                                            mostrarVinculosProfessor(professorId);
                                        });
                                        
                                        return tr;
                                    });
                            } else {
                                // Criar linha para professor sem disciplinas
                                const tr = document.createElement('tr');
                                tr.dataset.professor = professor.id_professor;
                                tr.classList.add('professor-row');
                                tr.style.cursor = 'pointer';
                                
                                tr.innerHTML = `
                                    <td>${professor.id_professor}</td>
                                    <td>${professor.nome_professor}</td>
                                    <td>${professor.email_professor || '-'}</td>
                                    <td>-</td>
                                    <td>-</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary edit-professor" data-id="${professor.id_professor}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-professor" data-id="${professor.id_professor}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                
                                tr.addEventListener('click', function(e) {
                                    if (e.target.closest('button')) return;
                                    document.querySelectorAll('.professor-row').forEach(row => {
                                        row.classList.remove('table-primary');
                                    });
                                    this.classList.add('table-primary');
                                    const professorId = this.dataset.professor;
                                    mostrarVinculosProfessor(professorId);
                                });
                                
                                return Promise.resolve(tr);
                            }
                        });
                        
                        // Quando todas as linhas forem processadas, adicionar à tabela
                        Promise.all(linhasPromessas)
                            .then(linhasHTML => {
                                // Filtrar nulls
                                const linhasValidas = linhasHTML.filter(linha => linha);
                                
                                // Se não tiver linhas válidas
                                if (linhasValidas.length === 0) {
                                    professoresLista.innerHTML = `
                                        <tr class="text-center">
                                            <td colspan="6">Nenhum professor com dados válidos encontrado</td>
                                        </tr>
                                    `;
                                    return;
                                }
                                
                                // Adicionar linhas à tabela
                                linhasValidas.forEach(linha => {
                                    professoresLista.appendChild(linha);
                                });
                                
                                // Adicionar event listeners para os botões de editar e excluir
                                document.querySelectorAll('.edit-professor').forEach(btn => {
                                    btn.addEventListener('click', function() {
                                        const id = this.getAttribute('data-id');
                                        editarProfessor(id);
                                    });
                                });
                                
                                document.querySelectorAll('.delete-professor').forEach(btn => {
                                    btn.addEventListener('click', function() {
                                        const id = this.getAttribute('data-id');
                                        excluirProfessor(id);
                                    });
                                });
                            });
                    });
            })
            .catch(error => {
                console.error("Erro ao carregar professores:", error);
                professoresLista.innerHTML = `
                    <tr class="text-center">
                        <td colspan="6" class="text-danger">
                            Erro ao carregar professores: ${error.message}
                        </td>
                    </tr>
                `;
            });
    }
    
    /**
     * Reseta o formulário de professor
     */
    function resetFormProfessor() {
        if (!formProfessor) return;
        
        formProfessor.reset();
        if (formModoProfessor) formModoProfessor.value = 'novo';
        
        // Atualizar título e esconder botão cancelar
        if (formProfessorTitulo) formProfessorTitulo.textContent = 'Novo Professor';
        if (btnCancelarProfessor) btnCancelarProfessor.style.display = 'none';
        
        // Remover readonly do ID
        if (idProfessor) idProfessor.readOnly = false;
        
        // Desmarcar todas as disciplinas
        if (vinculoDisciplinas) {
            Array.from(vinculoDisciplinas.options).forEach(option => {
                option.selected = false;
            });
        }
        
        // Limpar tabela de disciplinas e turmas
        if (disciplinasTurmasLista) {
            disciplinasTurmasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="2">Selecione disciplinas para ver as turmas vinculadas</td>
                </tr>
            `;
        }
    }
    
    /**
     * Filtra a tabela de vínculos para mostrar apenas os vínculos de um professor específico
     * @param {string} professorId - ID do professor para filtrar
     */
    function mostrarVinculosProfessor(professorId) {
        console.log("Mostrando vínculos do professor:", professorId);
        
        // Verificar se o elemento da tabela existe
        const tabelaVinculos = document.getElementById('vinculos-professores-table');
        if (!tabelaVinculos) {
            console.error("Tabela de vínculos não encontrada");
            return;
        }
        
        // Buscar professor selecionado
        const professor = buscarProfessorPorId(professorId);
        if (!professor) {
            console.error("Professor não encontrado:", professorId);
            return;
        }
        
        // Buscar disciplinas e turmas
        fetch(CONFIG.getApiUrl('disciplinas'))
            .then(response => response.ok ? response.json() : [])
            .then(disciplinas => {
                // Atualizar título da tabela
                const tituloVinculos = document.getElementById('vinculos-professor-titulo');
                if (tituloVinculos) {
                    tituloVinculos.textContent = `Vínculos do Professor: ${professor.nome_professor}`;
                }
                
                // Limpar tabela
                const tbody = tabelaVinculos.querySelector('tbody');
                if (!tbody) return;
                
                tbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Carregando...</span>
                            </div>
                        </td>
                    </tr>
                `;
                
                // Se o professor não tem disciplinas
                if (!professor.disciplinas || professor.disciplinas.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="3" class="text-center">
                                Professor não possui disciplinas vinculadas
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                // Buscar turmas para cada disciplina
                const promessasTurmas = professor.disciplinas.map(idDisciplina => {
                    return fetch(CONFIG.getApiUrl(`disciplinas/${idDisciplina}/turmas`))
                        .then(response => response.ok ? response.json() : [])
                        .then(turmas => {
                            const disciplina = disciplinas.find(d => d.id_disciplina === idDisciplina);
                            return {
                                disciplina: disciplina || { id_disciplina: idDisciplina, nome_disciplina: 'Disciplina não encontrada' },
                                turmas: turmas || []
                            };
                        });
                });
                
                Promise.all(promessasTurmas)
                    .then(resultados => {
                        if (resultados.length === 0) {
                            tbody.innerHTML = `
                                <tr>
                                    <td colspan="3" class="text-center">
                                        Não foi possível carregar os dados de vínculos
                                    </td>
                                </tr>
                            `;
                            return;
                        }
                        
                        // Limpar tabela
                        tbody.innerHTML = '';
                        
                        // Adicionar linhas para cada disciplina e suas turmas
                        resultados.forEach(resultado => {
                            const { disciplina, turmas } = resultado;
                            
                            // Se não tem turmas
                            if (turmas.length === 0) {
                                const tr = document.createElement('tr');
                                tr.classList.add('table-warning');
                                tr.innerHTML = `
                                    <td>${disciplina.id_disciplina}</td>
                                    <td>${disciplina.nome_disciplina}</td>
                                    <td class="text-center text-warning">
                                        <i class="fas fa-exclamation-triangle"></i> 
                                        Sem turmas vinculadas
                                    </td>
                                `;
                                tbody.appendChild(tr);
                            } else {
                                // Para cada turma, criar uma linha
                                turmas.forEach((turma, index) => {
                                    const tr = document.createElement('tr');
                                    
                                    // Se é a primeira turma da disciplina, mostrar a disciplina
                                    if (index === 0) {
                                        tr.innerHTML = `
                                            <td rowspan="${turmas.length}">${disciplina.id_disciplina}</td>
                                            <td rowspan="${turmas.length}">${disciplina.nome_disciplina}</td>
                                            <td>${turma.id_turma} (${turma.serie || 'Série não informada'})</td>
                                        `;
                                    } else {
                                        tr.innerHTML = `
                                            <td>${turma.id_turma} (${turma.serie || 'Série não informada'})</td>
                                        `;
                                    }
                                    
                                    tbody.appendChild(tr);
                                });
                            }
                        });
                    });
            })
            .catch(error => {
                console.error("Erro ao buscar vínculos:", error);
                const tbody = tabelaVinculos.querySelector('tbody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="3" class="text-center text-danger">
                                Erro ao carregar vínculos: ${error.message}
                            </td>
                        </tr>
                    `;
                }
            });
    }
    
    /**
     * Carrega a tabela que mostra todos os professores, disciplinas e turmas
     */
    function carregarTabelaProfessoresDisciplinasTurmas() {
        console.log("Carregando tabela consolidada de professores, disciplinas e turmas");
        
        const tabelaRelacionalLista = document.getElementById('tabela-relacional-lista');
        if (!tabelaRelacionalLista) {
            console.error("Tabela relacional não encontrada");
            return;
        }
        
        // Mostrar indicador de carregamento
        tabelaRelacionalLista.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Buscar dados necessários
        Promise.all([
            fetch(CONFIG.getApiUrl('professores')).then(r => r.ok ? r.json() : []),
            fetch(CONFIG.getApiUrl('disciplinas')).then(r => r.ok ? r.json() : []),
            fetch(CONFIG.getApiUrl('turmas')).then(r => r.ok ? r.json() : [])
        ])
        .then(([professores, disciplinas, turmas]) => {
            // Se não houver dados
            if (professores.length === 0 || disciplinas.length === 0) {
                tabelaRelacionalLista.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            Não há dados suficientes para montar a tabela relacional
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Criar um mapa de professores por disciplina
            const professoresPorDisciplina = {};
            
            // Inicializar o mapa para todas as disciplinas
            disciplinas.forEach(disciplina => {
                professoresPorDisciplina[disciplina.id_disciplina] = [];
            });
            
            // Preencher o mapa com os professores
            professores.forEach(professor => {
                if (professor.disciplinas && professor.disciplinas.length > 0) {
                    professor.disciplinas.forEach(idDisciplina => {
                        if (professoresPorDisciplina[idDisciplina]) {
                            professoresPorDisciplina[idDisciplina].push(professor);
                        }
                    });
                }
            });
            
            // Criar linhas para a tabela
            const linhasPromessas = disciplinas.map(disciplina => {
                // Buscar turmas para esta disciplina
                return fetch(CONFIG.getApiUrl(`disciplinas/${disciplina.id_disciplina}/turmas`))
                    .then(response => response.ok ? response.json() : [])
                    .then(turmasDisciplina => {
                        // Se não há professores nem turmas para esta disciplina, não mostrar
                        const profs = professoresPorDisciplina[disciplina.id_disciplina] || [];
                        if (profs.length === 0 && turmasDisciplina.length === 0) {
                            return null;
                        }
                        
                        // Criar linha para a disciplina
                        const tr = document.createElement('tr');
                        tr.classList.add('disciplina-row');
                        
                        // Professores desta disciplina
                        const professoresHTML = profs.length > 0
                            ? profs.map(p => `<span class="badge bg-info">${p.id_professor} - ${p.nome_professor}</span>`).join(' ')
                            : '<span class="badge bg-warning text-dark">Sem professores</span>';
                        
                        // Turmas desta disciplina
                        const turmasHTML = turmasDisciplina.length > 0
                            ? turmasDisciplina.map(t => `<span class="badge bg-success">${t.id_turma} (${t.serie || 'S/I'})</span>`).join(' ')
                            : '<span class="badge bg-warning text-dark">Sem turmas</span>';
                        
                        tr.innerHTML = `
                            <td>${disciplina.id_disciplina}</td>
                            <td>${disciplina.nome_disciplina}</td>
                            <td>${professoresHTML}</td>
                            <td>${turmasHTML}</td>
                        `;
                        
                        return tr;
                    });
            });
            
            // Quando todas as linhas forem processadas
            Promise.all(linhasPromessas)
                .then(linhas => {
                    // Filtrar linhas nulas
                    const linhasValidas = linhas.filter(linha => linha);
                    
                    if (linhasValidas.length === 0) {
                        tabelaRelacionalLista.innerHTML = `
                            <tr>
                                <td colspan="4" class="text-center">
                                    Não há registros de vínculos entre professores, disciplinas e turmas
                                </td>
                            </tr>
                        `;
                        return;
                    }
                    
                    // Limpar tabela e adicionar linhas
                    tabelaRelacionalLista.innerHTML = '';
                    linhasValidas.forEach(linha => {
                        tabelaRelacionalLista.appendChild(linha);
                    });
                });
        })
        .catch(error => {
            console.error("Erro ao carregar tabela relacional:", error);
            tabelaRelacionalLista.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        Erro ao carregar tabela relacional: ${error.message}
                    </td>
                </tr>
            `;
        });
    }
    
    /**
     * Carrega o select de disciplinas para vínculo com professores
     */
    function carregarDisciplinasSelect() {
        console.log("Carregando disciplinas para select");
        
        if (!vinculoDisciplinas) {
            console.error("Select de disciplinas não encontrado");
            return;
        }
        
        // Limpar opções existentes, mantendo a primeira se for uma opção de placeholder
        while (vinculoDisciplinas.options.length > 0) {
            vinculoDisciplinas.remove(0);
        }
        
        // Buscar disciplinas da API
        fetch(CONFIG.getApiUrl('disciplinas'))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar disciplinas: ${response.statusText}`);
                }
                return response.json();
            })
            .then(disciplinas => {
                // Ordenar disciplinas por ID
                disciplinas.sort((a, b) => a.id_disciplina.localeCompare(b.id_disciplina));
                
                // Adicionar opções ao select
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina;
                    option.textContent = `${disciplina.id_disciplina} - ${disciplina.nome_disciplina}`;
                    option.dataset.nome = disciplina.nome_disciplina;
                    vinculoDisciplinas.appendChild(option);
                });
                
                // Se não houver disciplinas
                if (disciplinas.length === 0) {
                    const option = document.createElement('option');
                    option.disabled = true;
                    option.textContent = 'Nenhuma disciplina cadastrada';
                    vinculoDisciplinas.appendChild(option);
                }
            })
            .catch(error => {
                console.error("Erro ao carregar disciplinas para select:", error);
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = `Erro ao carregar disciplinas: ${error.message}`;
                vinculoDisciplinas.appendChild(option);
            });
    }
    
    /**
     * Atualiza a tabela que mostra as turmas vinculadas às disciplinas selecionadas
     */
    function atualizarTabelaDisciplinasTurmas() {
        console.log("Atualizando tabela de disciplinas e turmas");
        
        if (!vinculoDisciplinas || !disciplinasTurmasLista) {
            console.error("Elementos necessários não encontrados");
            return;
        }
        
        // Obter disciplinas selecionadas
        const disciplinasSelecionadas = Array.from(vinculoDisciplinas.selectedOptions).map(option => option.value);
        
        // Se não há disciplinas selecionadas
        if (disciplinasSelecionadas.length === 0) {
            disciplinasTurmasLista.innerHTML = `
                <tr class="text-center">
                    <td colspan="2">Selecione disciplinas para ver as turmas vinculadas</td>
                </tr>
            `;
            return;
        }
        
        // Mostrar loading
        disciplinasTurmasLista.innerHTML = `
            <tr>
                <td colspan="2" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
        
        // Criar promessas para buscar turmas de cada disciplina
        const promessasTurmas = disciplinasSelecionadas.map(idDisciplina => {
            return fetch(CONFIG.getApiUrl(`disciplinas/${idDisciplina}/turmas`))
                .then(response => response.ok ? response.json() : [])
                .then(turmas => {
                    const nomeDisciplina = Array.from(vinculoDisciplinas.options)
                        .find(opt => opt.value === idDisciplina)?.dataset.nome || idDisciplina;
                    
                    return {
                        id_disciplina: idDisciplina,
                        nome_disciplina: nomeDisciplina,
                        turmas: turmas
                    };
                });
        });
        
        // Quando todas as promessas forem resolvidas
        Promise.all(promessasTurmas)
            .then(resultados => {
                // Limpar tabela
                disciplinasTurmasLista.innerHTML = '';
                
                // Adicionar linha para cada disciplina
                resultados.forEach(resultado => {
                    const { id_disciplina, nome_disciplina, turmas } = resultado;
                    
                    // Se não tem turmas
                    if (!turmas || turmas.length === 0) {
                        const tr = document.createElement('tr');
                        tr.classList.add('table-warning');
                        tr.innerHTML = `
                            <td><strong>${id_disciplina}</strong> - ${nome_disciplina}</td>
                            <td class="text-center text-warning">
                                <i class="fas fa-exclamation-triangle"></i> 
                                Sem turmas vinculadas
                            </td>
                        `;
                        disciplinasTurmasLista.appendChild(tr);
                    } else {
                        // Criar linha para disciplina com turmas
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td><strong>${id_disciplina}</strong> - ${nome_disciplina}</td>
                            <td>
                                ${turmas.map(t => `
                                    <span class="badge bg-success">
                                        ${t.id_turma} (${t.serie || 'Série não informada'})
                                    </span>
                                `).join(' ')}
                            </td>
                        `;
                        disciplinasTurmasLista.appendChild(tr);
                    }
                });
            })
            .catch(error => {
                console.error("Erro ao atualizar tabela de disciplinas e turmas:", error);
                disciplinasTurmasLista.innerHTML = `
                    <tr>
                        <td colspan="2" class="text-center text-danger">
                            Erro ao carregar turmas: ${error.message}
                        </td>
                    </tr>
                `;
            });
    }
    
    /**
     * Busca professor por ID no localStorage ou na API
     * @param {string} id - ID do professor
     * @returns {Promise<Object>} - Promessa que resolve com o objeto do professor
     */
    function buscarProfessorPorId(id) {
        // Verificar no localStorage primeiro
        const professoresJSON = localStorage.getItem('professores');
        if (professoresJSON) {
            try {
                const professores = JSON.parse(professoresJSON);
                const professor = professores.find(p => p.id_professor === id);
                if (professor) return professor;
            } catch (e) {
                console.error("Erro ao parsear professores do localStorage:", e);
            }
        }
        
        // Se não encontrou, buscar da API
        return fetch(CONFIG.getApiUrl(`professores/${id}`))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Professor com ID ${id} não encontrado`);
                }
                return response.json();
            });
    }
    
    /**
     * Carrega um professor para edição
     * @param {string} id - ID do professor a ser editado
     */
    function editarProfessor(id) {
        console.log("Editando professor:", id);
        
        // Verificar se os elementos do formulário existem
        if (!formProfessor || !idProfessor || !nomeProfessor || !emailProfessor || !senhaProfessor) {
            console.error("Elementos do formulário não encontrados");
            return;
        }
        
        // Buscar professor
        const buscarPromise = typeof buscarProfessorPorId(id) === 'object' 
            ? Promise.resolve(buscarProfessorPorId(id))
            : buscarProfessorPorId(id);
            
        buscarPromise
            .then(professor => {
                // Preencher formulário
                idProfessor.value = professor.id_professor;
                nomeProfessor.value = professor.nome_professor || '';
                emailProfessor.value = professor.email_professor || '';
                senhaProfessor.value = ''; // Não preencher senha por segurança
                
                // Marcar ID como readonly
                idProfessor.readOnly = true;
                
                // Atualizar modo e título
                if (formModoProfessor) formModoProfessor.value = 'editar';
                if (formProfessorTitulo) formProfessorTitulo.textContent = 'Editar Professor';
                
                // Mostrar botão cancelar
                if (btnCancelarProfessor) btnCancelarProfessor.style.display = 'inline-block';
                
                // Marcar disciplinas selecionadas
                if (vinculoDisciplinas && professor.disciplinas) {
                    // Primeiro, desmarcar todas
                    Array.from(vinculoDisciplinas.options).forEach(option => {
                        option.selected = false;
                    });
                    
                    // Depois marcar as disciplinas do professor
                    professor.disciplinas.forEach(idDisciplina => {
                        const option = Array.from(vinculoDisciplinas.options)
                            .find(opt => opt.value === idDisciplina);
                        
                        if (option) option.selected = true;
                    });
                    
                    // Atualizar tabela de disciplinas e turmas
                    atualizarTabelaDisciplinasTurmas();
                }
                
                // Rolar para o formulário
                formProfessor.scrollIntoView({behavior: 'smooth'});
            })
            .catch(error => {
                console.error("Erro ao buscar professor para edição:", error);
                alert(`Erro ao carregar professor para edição: ${error.message}`);
            });
    }
    
    /**
     * Exclui um professor
     * @param {string} id - ID do professor a ser excluído
     */
    function excluirProfessor(id) {
        console.log("Excluindo professor:", id);
        
        // Confirmar exclusão
        if (!confirm(`Tem certeza que deseja excluir o professor ${id}?`)) {
            console.log("Exclusão cancelada pelo usuário");
            return;
        }
        
        // Excluir via API
        fetch(CONFIG.getApiUrl(`professores/${id}`), {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.detail || data.message || `Erro ${response.status}: ${response.statusText}`);
                });
            }
            
            console.log("Professor excluído com sucesso");
            alert("Professor excluído com sucesso!");
            
            // Recarregar lista de professores
            carregarProfessores();
            // Atualizar tabela relacional
            carregarTabelaProfessoresDisciplinasTurmas();
        })
        .catch(error => {
            console.error("Erro ao excluir professor:", error);
            alert(`Erro ao excluir professor: ${error.message}`);
        });
    }
}

// Exportar para o escopo global
window.initProfessores = initProfessores; 