/**
 * Módulo de Notas
 * Contém todas as funções relacionadas à gestão de notas dos alunos
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const NotasModule = {
    // Estado do módulo
    state: {
        notas: [],
        notaSelecionada: null,
        modoEdicao: false,
        turmas: [],
        disciplinas: [],
        alunos: [],
        disciplinasTurma: [], // Para armazenar disciplinas de uma turma específica
        alunosTurma: [], // Para armazenar alunos de uma turma específica
        filtros: {
            turma: '',
            disciplina: '',
            aluno: '',
            bimestre: '',
            ano: new Date().getFullYear()
        }
    },
    
    // Elementos DOM
    elements: {
        listaNotas: null,
        formNota: null,
        selectTurma: null,
        selectDisciplina: null,
        selectAluno: null,
        selectBimestre: null,
        inputAno: null,
        inputNotaMensal: null,
        inputNotaBimestral: null,
        inputNotaRecuperacao: null,
        inputMediaFinal: null,
        btnSalvarNota: null,
        btnCancelarNota: null,
        btnNovaNota: null,
        filtroTurma: null,
        filtroDisciplina: null,
        filtroAluno: null,
        filtroBimestre: null,
        filtroAno: null,
        btnFiltrar: null,
        btnCalcularMedias: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de notas");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarTurmas();
        // Não carregaremos as notas no início, apenas quando um filtro for aplicado
        
        // Definir ano padrão no filtro
        if (this.elements.filtroAno) {
            this.elements.filtroAno.value = new Date().getFullYear();
        }
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        // Form e lista principal
        this.elements.listaNotas = document.getElementById('notas-lista');
        this.elements.formNota = document.getElementById('form-nota');
        
        // Elementos do form
        this.elements.selectTurma = document.getElementById('turma-nota');
        this.elements.selectDisciplina = document.getElementById('disciplina-nota');
        this.elements.selectAluno = document.getElementById('aluno-nota');
        this.elements.selectBimestre = document.getElementById('bimestre-nota');
        this.elements.inputAno = document.getElementById('ano-nota');
        this.elements.inputNotaMensal = document.getElementById('nota-mensal');
        this.elements.inputNotaBimestral = document.getElementById('nota-bimestral');
        this.elements.inputNotaRecuperacao = document.getElementById('nota-recuperacao');
        this.elements.inputMediaFinal = document.getElementById('media-final');
        
        // Botões principais
        this.elements.btnSalvarNota = document.getElementById('btn-salvar-nota');
        this.elements.btnCancelarNota = document.getElementById('btn-cancelar-nota');
        this.elements.btnNovaNota = document.getElementById('btn-nova-nota');
        this.elements.btnCalcularMedias = document.getElementById('btn-calcular-medias');
        
        // Filtros
        this.elements.filtroTurma = document.getElementById('filtro-turma-nota');
        this.elements.filtroDisciplina = document.getElementById('filtro-disciplina-nota');
        this.elements.filtroAluno = document.getElementById('filtro-aluno-nota');
        this.elements.filtroBimestre = document.getElementById('filtro-bimestre-nota');
        this.elements.filtroAno = document.getElementById('filtro-ano-nota');
        this.elements.btnFiltrar = document.getElementById('btn-filtrar-notas');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.formNota) {
            this.elements.formNota.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarNota();
            });
        }
        
        if (this.elements.btnCancelarNota) {
            this.elements.btnCancelarNota.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
        
        if (this.elements.btnNovaNota) {
            this.elements.btnNovaNota.addEventListener('click', () => {
                this.novaNota();
            });
        }
        
        if (this.elements.btnFiltrar) {
            this.elements.btnFiltrar.addEventListener('click', () => {
                this.filtrarNotas();
            });
        }
        
        // Listener para o botão de calcular médias
        if (this.elements.btnCalcularMedias) {
            this.elements.btnCalcularMedias.addEventListener('click', () => {
                this.calcularMedias();
            });
        }
        
        // Listeners para os inputs de notas para atualizar a média automaticamente
        if (this.elements.inputNotaMensal && this.elements.inputNotaBimestral) {
            this.elements.inputNotaMensal.addEventListener('input', () => this.calcularMediaForm());
            this.elements.inputNotaBimestral.addEventListener('input', () => this.calcularMediaForm());
            this.elements.inputNotaRecuperacao.addEventListener('input', () => this.calcularMediaForm());
        }
        
        // Listeners para selects de turma
        if (this.elements.selectTurma) {
            this.elements.selectTurma.addEventListener('change', () => {
                this.carregarDependenciasFormulario(this.elements.selectTurma.value);
            });
        }
        
        // Listener para filtro de turma
        if (this.elements.filtroTurma) {
            this.elements.filtroTurma.addEventListener('change', () => {
                this.carregarDependenciasFiltro(this.elements.filtroTurma.value);
            });
        }
    },
    
    // Carregar turmas para os selects
    carregarTurmas: async function() {
        try {
            const turmas = await ConfigModule.fetchApi('/turmas');
            this.state.turmas = turmas;
            this.popularSelectTurmas();
            console.log("Turmas carregadas com sucesso para o módulo de notas:", turmas);
        } catch (error) {
            console.error("Erro ao carregar turmas para o módulo de notas:", error);
            this.mostrarErro("Não foi possível carregar as turmas. Tente novamente mais tarde.");
        }
    },
    
    // Popular select de turmas
    popularSelectTurmas: function() {
        if (!this.elements.selectTurma || !this.elements.filtroTurma) return;
        
        // Limpar selects
        this.elements.selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        this.elements.filtroTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        
        // Adicionar opções
        this.state.turmas.forEach(turma => {
            const option1 = document.createElement('option');
            option1.value = turma.id_turma || turma.id;
            option1.textContent = `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})`;
            this.elements.selectTurma.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = turma.id_turma || turma.id;
            option2.textContent = `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})`;
            this.elements.filtroTurma.appendChild(option2);
        });
        
        // Desabilitar selects de disciplina e aluno até que uma turma seja selecionada
        if (this.elements.selectDisciplina) this.elements.selectDisciplina.disabled = true;
        if (this.elements.selectAluno) this.elements.selectAluno.disabled = true;
        if (this.elements.filtroDisciplina) this.elements.filtroDisciplina.disabled = true;
        if (this.elements.filtroAluno) this.elements.filtroAluno.disabled = true;
    },
    
    // Carregar disciplinas de uma turma específica
    carregarDisciplinasDaTurma: async function(turmaId) {
        if (!turmaId) {
            this.state.disciplinasTurma = [];
            return [];
        }
        
        try {
            const disciplinas = await ConfigModule.fetchApi(`/turmas/${turmaId}/disciplinas`);
            this.state.disciplinasTurma = disciplinas;
            console.log(`Disciplinas da turma ${turmaId} carregadas:`, disciplinas);
            return disciplinas;
        } catch (error) {
            console.error(`Erro ao carregar disciplinas da turma ${turmaId}:`, error);
            this.mostrarErro("Não foi possível carregar as disciplinas da turma.");
            return [];
        }
    },
    
    // Carregar alunos de uma turma específica
    carregarAlunosDaTurma: async function(turmaId) {
        if (!turmaId) {
            this.state.alunosTurma = [];
            return [];
        }
        
        try {
            const alunos = await ConfigModule.fetchApi(`/turmas/${turmaId}/alunos`);
            this.state.alunosTurma = alunos;
            console.log(`Alunos da turma ${turmaId} carregados:`, alunos);
            return alunos;
        } catch (error) {
            console.error(`Erro ao carregar alunos da turma ${turmaId}:`, error);
            this.mostrarErro("Não foi possível carregar os alunos da turma.");
            return [];
        }
    },
    
    // Carregar dependências para o formulário (disciplinas e alunos de uma turma)
    carregarDependenciasFormulario: async function(turmaId) {
        // Limpar e desabilitar selects de disciplina e aluno
        if (this.elements.selectDisciplina) {
            this.elements.selectDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
            this.elements.selectDisciplina.disabled = !turmaId;
        }
        
        if (this.elements.selectAluno) {
            this.elements.selectAluno.innerHTML = '<option value="">Selecione um aluno</option>';
            this.elements.selectAluno.disabled = !turmaId;
        }
        
        if (!turmaId) return;
        
        try {
            // Carregar disciplinas e alunos em paralelo
            const [disciplinas, alunos] = await Promise.all([
                this.carregarDisciplinasDaTurma(turmaId),
                this.carregarAlunosDaTurma(turmaId)
            ]);
            
            // Popular select de disciplinas
            if (disciplinas.length > 0 && this.elements.selectDisciplina) {
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina || disciplina.id;
                    option.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                    this.elements.selectDisciplina.appendChild(option);
                });
            }
            
            // Popular select de alunos
            if (alunos.length > 0 && this.elements.selectAluno) {
                alunos.forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.id_aluno || aluno.id;
                    option.textContent = aluno.nome_aluno || aluno.nome || 'N/A';
                    this.elements.selectAluno.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar dependências do formulário:", error);
        }
    },
    
    // Carregar dependências para o filtro (disciplinas e alunos de uma turma)
    carregarDependenciasFiltro: async function(turmaId) {
        // Limpar e desabilitar selects de disciplina e aluno
        if (this.elements.filtroDisciplina) {
            this.elements.filtroDisciplina.innerHTML = '<option value="">Todas as disciplinas</option>';
            this.elements.filtroDisciplina.disabled = !turmaId;
        }
        
        if (this.elements.filtroAluno) {
            this.elements.filtroAluno.innerHTML = '<option value="">Todos os alunos</option>';
            this.elements.filtroAluno.disabled = !turmaId;
        }
        
        if (!turmaId) return;
        
        try {
            // Carregar disciplinas e alunos em paralelo
            const [disciplinas, alunos] = await Promise.all([
                this.carregarDisciplinasDaTurma(turmaId),
                this.carregarAlunosDaTurma(turmaId)
            ]);
            
            // Popular select de disciplinas
            if (disciplinas.length > 0 && this.elements.filtroDisciplina) {
                disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina.id_disciplina || disciplina.id;
                    option.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                    this.elements.filtroDisciplina.appendChild(option);
                });
            }
            
            // Popular select de alunos
            if (alunos.length > 0 && this.elements.filtroAluno) {
                alunos.forEach(aluno => {
                    const option = document.createElement('option');
                    option.value = aluno.id_aluno || aluno.id;
                    option.textContent = aluno.nome_aluno || aluno.nome || 'N/A';
                    this.elements.filtroAluno.appendChild(option);
                });
            }
            
            // Preencher os anos nos filtros (de 2025 a 2030)
            if (this.elements.filtroAno && this.elements.filtroAno.tagName === "SELECT") {
                this.elements.filtroAno.innerHTML = '<option value="">Todos os anos</option>';
                const anoAtual = new Date().getFullYear();
                for (let ano = 2025; ano <= 2030; ano++) {
                    const option = document.createElement('option');
                    option.value = ano;
                    option.textContent = ano;
                    if (ano === anoAtual) option.selected = true;
                    this.elements.filtroAno.appendChild(option);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar dependências do filtro:", error);
        }
    },
    
    // Carregar notas da API
    carregarNotas: async function(filtros = {}) {
        try {
            if (!filtros.turma_id) {
                this.mostrarErro("Selecione uma turma para filtrar as notas");
                return;
            }
            
            let endpoint = '/notas';
            
            // Adicionar filtros à URL
            const params = new URLSearchParams();
            if (filtros.turma_id) params.append('turma_id', filtros.turma_id);
            if (filtros.disciplina_id) params.append('disciplina_id', filtros.disciplina_id);
            if (filtros.aluno_id) params.append('aluno_id', filtros.aluno_id);
            if (filtros.bimestre) params.append('bimestre', filtros.bimestre);
            if (filtros.ano) params.append('ano', filtros.ano);
            
            const queryString = params.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }
            
            console.log("Buscando notas com endpoint:", endpoint);
            const notas = await ConfigModule.fetchApi(endpoint);
            console.log("Notas recebidas da API:", notas);
            
            if (Array.isArray(notas) && notas.length > 0) {
                // Se a API retornou dados que não respeitam os filtros, precisamos filtrar localmente
                let notasFiltradas = notas;
                
                if (filtros.turma_id) {
                    notasFiltradas = notasFiltradas.filter(nota => {
                        const notaTurmaId = nota.turma_id || nota.id_turma;
                        return String(notaTurmaId) === String(filtros.turma_id);
                    });
                }
                
                if (filtros.disciplina_id) {
                    notasFiltradas = notasFiltradas.filter(nota => {
                        const notaDisciplinaId = nota.disciplina_id || nota.id_disciplina;
                        return String(notaDisciplinaId) === String(filtros.disciplina_id);
                    });
                }
                
                if (filtros.aluno_id) {
                    notasFiltradas = notasFiltradas.filter(nota => {
                        const notaAlunoId = nota.aluno_id || nota.id_aluno;
                        return String(notaAlunoId) === String(filtros.aluno_id);
                    });
                }
                
                if (filtros.bimestre) {
                    notasFiltradas = notasFiltradas.filter(nota => {
                        return String(nota.bimestre) === String(filtros.bimestre);
                    });
                }
                
                if (filtros.ano) {
                    notasFiltradas = notasFiltradas.filter(nota => {
                        return String(nota.ano) === String(filtros.ano);
                    });
                }
                
                console.log("Notas após filtro local:", notasFiltradas);
                this.state.notas = notasFiltradas;
            } else {
                this.state.notas = [];
            }
            
            this.renderizarNotas();
        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            this.mostrarErro("Não foi possível carregar as notas. Tente novamente mais tarde.");
        }
    },
    
    // Filtrar notas
    filtrarNotas: function() {
        const filtros = {
            turma_id: this.elements.filtroTurma.value,
            disciplina_id: this.elements.filtroDisciplina.value,
            aluno_id: this.elements.filtroAluno.value,
            bimestre: this.elements.filtroBimestre.value,
            ano: this.elements.filtroAno.value
        };
        
        console.log("Aplicando filtros:", filtros);
        this.carregarNotas(filtros);
    },
    
    // Renderizar lista de notas
    renderizarNotas: function() {
        if (!this.elements.listaNotas) return;
        
        this.elements.listaNotas.innerHTML = '';
        
        if (this.state.notas.length === 0) {
            this.elements.listaNotas.innerHTML = '<tr><td colspan="11" class="text-center">Nenhuma nota encontrada. Use os filtros acima para buscar notas.</td></tr>';
            return;
        }

        console.log("Renderizando notas:", this.state.notas);
        
        this.state.notas.forEach(nota => {
            // Logs para depuração
            console.log("Processando nota:", nota);
            
            // Encontrar nomes de turma, disciplina e aluno
            const turmaId = nota.turma_id || nota.id_turma;
            const disciplinaId = nota.disciplina_id || nota.id_disciplina;
            const alunoId = nota.aluno_id || nota.id_aluno;
            
            console.log("IDs: Turma=", turmaId, "Disciplina=", disciplinaId, "Aluno=", alunoId);
            
            // Buscar turma por ID (procurar tanto id_turma quanto id)
            const turma = this.state.turmas.find(t => 
                String(t.id_turma) === String(turmaId) || 
                String(t.id) === String(turmaId)
            );
            console.log("Turma encontrada:", turma);
            
            // Buscar disciplina nas listas disponíveis
            let disciplina = null;
            // Primeiro tentar na lista de disciplinas da turma
            if (this.state.disciplinasTurma.length > 0) {
                disciplina = this.state.disciplinasTurma.find(d => 
                    String(d.id_disciplina) === String(disciplinaId) || 
                    String(d.id) === String(disciplinaId)
                );
            }
            // Se não encontrar, buscar na lista global de disciplinas
            if (!disciplina && this.state.disciplinas && this.state.disciplinas.length > 0) {
                disciplina = this.state.disciplinas.find(d => 
                    String(d.id_disciplina) === String(disciplinaId) || 
                    String(d.id) === String(disciplinaId)
                );
            }
            console.log("Disciplina encontrada:", disciplina);
            
            // Buscar aluno nas listas disponíveis
            let aluno = null;
            // Primeiro tentar na lista de alunos da turma
            if (this.state.alunosTurma.length > 0) {
                aluno = this.state.alunosTurma.find(a => 
                    String(a.id_aluno) === String(alunoId) || 
                    String(a.id) === String(alunoId)
                );
            }
            // Se não encontrar, buscar na lista global de alunos
            if (!aluno && this.state.alunos && this.state.alunos.length > 0) {
                aluno = this.state.alunos.find(a => 
                    String(a.id_aluno) === String(alunoId) || 
                    String(a.id) === String(alunoId)
                );
            }
            console.log("Aluno encontrado:", aluno);
            
            // Garantir que todas as propriedades numéricas existam para evitar erros
            const notaMensal = nota.nota_mensal !== undefined ? parseFloat(nota.nota_mensal) : 0;
            const notaBimestral = nota.nota_bimestral !== undefined ? parseFloat(nota.nota_bimestral) : 0;
            const notaRecuperacao = nota.nota_recuperacao !== undefined && nota.nota_recuperacao !== null 
                ? parseFloat(nota.nota_recuperacao) 
                : null;
            
            // Calcular a média final se não estiver definida
            let mediaFinal = nota.media_final !== undefined ? parseFloat(nota.media_final) : null;
            if (mediaFinal === null) {
                mediaFinal = (notaMensal + notaBimestral) / 2;
                if (notaRecuperacao !== null && notaRecuperacao > mediaFinal) {
                    mediaFinal = notaRecuperacao;
                }
            }
            
            // Se não conseguirmos encontrar os objetos relacionados, usamos os IDs diretamente
            const turmaInfo = turma ? `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})` : turmaId || 'N/A';
            const disciplinaInfo = disciplina ? (disciplina.nome_disciplina || disciplina.nome || 'N/A') : disciplinaId || 'N/A';
            const alunoInfo = aluno ? (aluno.nome_aluno || aluno.nome || 'N/A') : alunoId || 'N/A';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${nota.id || 'N/A'}</td>
                <td>${turmaInfo}</td>
                <td>${disciplinaInfo}</td>
                <td>${alunoInfo}</td>
                <td>${nota.bimestre || 'N/A'}º</td>
                <td>${nota.ano || 'N/A'}</td>
                <td>${typeof notaMensal === 'number' ? notaMensal.toFixed(1) : '0.0'}</td>
                <td>${typeof notaBimestral === 'number' ? notaBimestral.toFixed(1) : '0.0'}</td>
                <td>${notaRecuperacao !== null ? (typeof notaRecuperacao === 'number' ? notaRecuperacao.toFixed(1) : '0.0') : 'N/A'}</td>
                <td>${typeof mediaFinal === 'number' ? mediaFinal.toFixed(1) : '0.0'}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-nota" data-id="${nota.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-nota" data-id="${nota.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-nota');
            const btnExcluir = row.querySelector('.excluir-nota');
            
            btnEditar.addEventListener('click', () => this.editarNota(nota.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(nota.id));
            
            this.elements.listaNotas.appendChild(row);
        });
    },
    
    // Calcular média local (no formulário)
    calcularMediaForm: function() {
        if (!this.elements.inputNotaMensal || !this.elements.inputNotaBimestral || !this.elements.inputMediaFinal) return;
        
        const notaMensal = parseFloat(this.elements.inputNotaMensal.value) || 0;
        const notaBimestral = parseFloat(this.elements.inputNotaBimestral.value) || 0;
        const notaRecuperacao = parseFloat(this.elements.inputNotaRecuperacao.value) || 0;
        
        let mediaFinal = (notaMensal + notaBimestral) / 2;
        
        // Se houver nota de recuperação e for maior que a média, substituir
        if (notaRecuperacao > 0 && notaRecuperacao > mediaFinal) {
            mediaFinal = notaRecuperacao;
        }
        
        this.elements.inputMediaFinal.textContent = mediaFinal.toFixed(1);
    },
    
    // Calcular médias de todos os alunos
    calcularMedias: async function() {
        try {
            await ConfigModule.fetchApi('/calcular-medias', {
                method: 'POST'
            });
            
            this.mostrarSucesso("Médias calculadas com sucesso!");
            
            // Recarregar notas para mostrar as médias atualizadas
            this.filtrarNotas();
        } catch (error) {
            console.error("Erro ao calcular médias:", error);
            this.mostrarErro("Não foi possível calcular as médias. Tente novamente mais tarde.");
        }
    },
    
    // Criar nova nota
    novaNota: function() {
        this.state.modoEdicao = false;
        this.state.notaSelecionada = null;
        
        if (this.elements.formNota) {
            this.elements.formNota.reset();
            this.elements.formNota.classList.remove('d-none');
            this.elements.inputMediaFinal.textContent = '0.0';
            
            // Limpar e desabilitar selects de disciplina e aluno
            if (this.elements.selectDisciplina) {
                this.elements.selectDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
                this.elements.selectDisciplina.disabled = true;
            }
            
            if (this.elements.selectAluno) {
                this.elements.selectAluno.innerHTML = '<option value="">Selecione um aluno</option>';
                this.elements.selectAluno.disabled = true;
            }
        }
        
        // Definir ano atual como padrão
        if (this.elements.inputAno) {
            this.elements.inputAno.value = new Date().getFullYear();
        }
        
        if (this.elements.selectTurma) {
            this.elements.selectTurma.focus();
        }
    },
    
    // Editar nota existente
    editarNota: async function(id) {
        try {
            // Buscar informações detalhadas da nota
            const nota = await ConfigModule.fetchApi(`/notas/${id}`);
            
            if (!nota) {
                this.mostrarErro("Nota não encontrada.");
                return;
            }
            
            this.state.modoEdicao = true;
            this.state.notaSelecionada = nota;
            
            const turmaId = nota.turma_id || nota.id_turma;
            
            // Carregar dependências primeiro (disciplinas e alunos da turma)
            await this.carregarDependenciasFormulario(turmaId);
            
            if (this.elements.formNota) {
                this.elements.formNota.classList.remove('d-none');
                this.elements.selectTurma.value = turmaId;
                this.elements.selectDisciplina.value = nota.disciplina_id || nota.id_disciplina;
                this.elements.selectAluno.value = nota.aluno_id || nota.id_aluno;
                this.elements.selectBimestre.value = nota.bimestre;
                this.elements.inputAno.value = nota.ano;
                this.elements.inputNotaMensal.value = nota.nota_mensal;
                this.elements.inputNotaBimestral.value = nota.nota_bimestral;
                this.elements.inputNotaRecuperacao.value = nota.nota_recuperacao || '';
                
                // Calcular e mostrar a média
                let mediaFinal = nota.media_final;
                if (mediaFinal === undefined) {
                    mediaFinal = (parseFloat(nota.nota_mensal) + parseFloat(nota.nota_bimestral)) / 2;
                    if (nota.nota_recuperacao && parseFloat(nota.nota_recuperacao) > mediaFinal) {
                        mediaFinal = parseFloat(nota.nota_recuperacao);
                    }
                }
                this.elements.inputMediaFinal.textContent = (mediaFinal || 0).toFixed(1);
                
                this.elements.selectTurma.focus();
            }
        } catch (error) {
            console.error("Erro ao editar nota:", error);
            this.mostrarErro("Não foi possível carregar os dados da nota para edição.");
        }
    },
    
    // Salvar nota (criar nova ou atualizar existente)
    salvarNota: async function() {
        try {
            // Verificar se todos os campos obrigatórios estão preenchidos
            if (!this.elements.selectTurma.value) {
                this.mostrarErro("Selecione uma turma.");
                return;
            }
            
            if (!this.elements.selectDisciplina.value) {
                this.mostrarErro("Selecione uma disciplina.");
                return;
            }
            
            if (!this.elements.selectAluno.value) {
                this.mostrarErro("Selecione um aluno.");
                return;
            }
            
            if (!this.elements.selectBimestre.value) {
                this.mostrarErro("Selecione um bimestre.");
                return;
            }
            
            if (!this.elements.inputAno.value) {
                this.mostrarErro("Informe o ano letivo.");
                return;
            }
            
            // Verificar se as notas são números válidos
            const notaMensal = parseFloat(this.elements.inputNotaMensal.value);
            const notaBimestral = parseFloat(this.elements.inputNotaBimestral.value);
            let notaRecuperacao = this.elements.inputNotaRecuperacao.value 
                ? parseFloat(this.elements.inputNotaRecuperacao.value) 
                : null;
            
            if (isNaN(notaMensal) || notaMensal < 0 || notaMensal > 10) {
                this.mostrarErro("A nota mensal deve ser um número entre 0 e 10.");
                return;
            }
            
            if (isNaN(notaBimestral) || notaBimestral < 0 || notaBimestral > 10) {
                this.mostrarErro("A nota bimestral deve ser um número entre 0 e 10.");
                return;
            }
            
            if (notaRecuperacao !== null && (isNaN(notaRecuperacao) || notaRecuperacao < 0 || notaRecuperacao > 10)) {
                this.mostrarErro("A nota de recuperação deve ser um número entre 0 e 10.");
                return;
            }
            
            // Para a API, usamos os nomes corretos esperados pelo backend
            const notaDados = {
                id_turma: this.elements.selectTurma.value,
                id_disciplina: this.elements.selectDisciplina.value,
                id_aluno: this.elements.selectAluno.value,
                bimestre: parseInt(this.elements.selectBimestre.value),
                ano: parseInt(this.elements.inputAno.value),
                nota_mensal: notaMensal,
                nota_bimestral: notaBimestral,
                nota_recuperacao: notaRecuperacao
            };
            
            // Calcular média final
            let mediaFinal = (notaDados.nota_mensal + notaDados.nota_bimestral) / 2;
            if (notaDados.nota_recuperacao && notaDados.nota_recuperacao > mediaFinal) {
                mediaFinal = notaDados.nota_recuperacao;
            }
            notaDados.media_final = mediaFinal;
            
            console.log("Salvando nota com dados:", notaDados);
            
            let response;
            
            if (this.state.modoEdicao && this.state.notaSelecionada) {
                // Atualizar nota existente
                response = await ConfigModule.fetchApi(`/notas/${this.state.notaSelecionada.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(notaDados)
                });
                
                this.mostrarSucesso("Nota atualizada com sucesso!");
            } else {
                // Verificar se já existe nota para este aluno, disciplina, bimestre e ano
                try {
                    // Criar nova nota
                    response = await ConfigModule.fetchApi('/notas', {
                        method: 'POST',
                        body: JSON.stringify(notaDados)
                    });
                    
                    this.mostrarSucesso("Nota criada com sucesso!");
                } catch (error) {
                    if (error.message && error.message.includes('422')) {
                        this.mostrarErro("Já existe uma nota para este aluno, disciplina, bimestre e ano.");
                    } else {
                        throw error; // Propagar outros erros
                    }
                    return; // Não limpar o formulário em caso de erro
                }
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Recarregar notas se os filtros estiverem ativos
            if (this.elements.filtroTurma.value) {
                this.filtrarNotas();
            }
            
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
            
            // Extrair detalhes do erro, se disponíveis
            let mensagemErro = "Não foi possível salvar a nota.";
            if (error.message) {
                if (error.message.includes('422')) {
                    mensagemErro = "Os dados da nota não foram aceitos pelo servidor. Verifique se os campos estão preenchidos corretamente.";
                } else if (error.message.includes('404')) {
                    mensagemErro = "Recurso não encontrado no servidor.";
                } else if (error.message.includes('403')) {
                    mensagemErro = "Você não tem permissão para realizar esta operação.";
                } else if (error.message.includes('500')) {
                    mensagemErro = "Erro interno do servidor. Tente novamente mais tarde.";
                }
            }
            
            this.mostrarErro(mensagemErro);
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.notaSelecionada = null;
        
        if (this.elements.formNota) {
            this.elements.formNota.reset();
            this.elements.formNota.classList.add('d-none');
            this.elements.inputMediaFinal.textContent = '0.0';
            
            // Desabilitar selects dependentes
            if (this.elements.selectDisciplina) this.elements.selectDisciplina.disabled = true;
            if (this.elements.selectAluno) this.elements.selectAluno.disabled = true;
        }
    },
    
    // Confirmar exclusão de nota
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.")) {
            this.excluirNota(id);
        }
    },
    
    // Excluir nota
    excluirNota: async function(id) {
        try {
            await ConfigModule.fetchApi(`/notas/${id}`, {
                method: 'DELETE'
            });
            
            // Remover nota da lista local
            this.state.notas = this.state.notas.filter(n => n.id !== id);
            
            // Atualizar lista de notas
            this.renderizarNotas();
            
            this.mostrarSucesso("Nota excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir nota:", error);
            this.mostrarErro("Não foi possível excluir a nota. Tente novamente mais tarde.");
        }
    },
    
    // Mostrar mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-success alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        document.querySelector('#conteudo-notas').insertBefore(alertContainer, document.querySelector('#conteudo-notas').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    },
    
    // Mostrar mensagem de erro
    mostrarErro: function(mensagem) {
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-danger alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        document.querySelector('#conteudo-notas').insertBefore(alertContainer, document.querySelector('#conteudo-notas').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default NotasModule;
