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
        },
        ordenacao: {
            coluna: 'id',
            direcao: 'asc'
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
        btnCalcularMedias: null,
        massaTurma: null,
        massaDisciplina: null,
        massaBimestre: null,
        massaAno: null,
        btnCarregarGrade: null,
        btnSalvarGrade: null,
        gradeNotasWrapper: null,
        gradeNotasCorpo: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de notas");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarTurmas();
        // Não carregaremos as notas no início, apenas quando um filtro for aplicado
        
        // Definir ano padrão no filtro e no lançamento em massa
        const anoAtual = new Date().getFullYear();
        if (this.elements.filtroAno) {
            this.elements.filtroAno.value = anoAtual;
        }
        if (this.elements.massaAno) {
            this.elements.massaAno.value = anoAtual;
        }
        
        // Inicializar cabecalhos de ordenação
        this.inicializarCabecalhosOrdenacao();
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        // Form e lista principal
        this.elements.listaNotas = document.getElementById('lista-notas');
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
        
        // Elementos para lançamento em massa
        this.elements.massaTurma = document.getElementById('massa-turma');
        this.elements.massaDisciplina = document.getElementById('massa-disciplina');
        this.elements.massaBimestre = document.getElementById('massa-bimestre');
        this.elements.massaAno = document.getElementById('massa-ano');
        this.elements.btnCarregarGrade = document.getElementById('btn-carregar-grade');
        this.elements.btnSalvarGrade = document.getElementById('btn-salvar-grade');
        this.elements.gradeNotasWrapper = document.getElementById('grade-notas-wrapper');
        this.elements.gradeNotasCorpo = document.getElementById('grade-notas-corpo');
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
        
        // Adicionar event listeners para cabeçalhos da tabela para ordenação
        const cabecalhos = document.querySelectorAll('#tabela-notas th[data-ordenavel]');
        cabecalhos.forEach(cabecalho => {
            cabecalho.addEventListener('click', () => {
                const coluna = cabecalho.dataset.coluna;
                this.ordenarNotas(coluna);
            });
        });
        
        // Novos event listeners para lançamento em massa
        if (this.elements.massaTurma) {
            this.elements.massaTurma.addEventListener('change', () => {
                this.carregarDisciplinasGrade(this.elements.massaTurma.value);
            });
        }
        
        if (this.elements.btnCarregarGrade) {
            this.elements.btnCarregarGrade.addEventListener('click', () => {
                this.carregarGradeNotas();
            });
        }
        
        if (this.elements.btnSalvarGrade) {
            this.elements.btnSalvarGrade.addEventListener('click', () => {
                this.salvarNotasEmMassa();
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
        
        // Adicionar opções para o lançamento em massa também
        if (this.elements.massaTurma) {
            this.elements.massaTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        }
        
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
            
            // Adicionar para o lançamento em massa também
            if (this.elements.massaTurma) {
                const option3 = document.createElement('option');
                option3.value = turma.id_turma || turma.id;
                option3.textContent = `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})`;
                this.elements.massaTurma.appendChild(option3);
            }
        });
        
        // Desabilitar selects de disciplina e aluno até que uma turma seja selecionada
        if (this.elements.selectDisciplina) this.elements.selectDisciplina.disabled = true;
        if (this.elements.selectAluno) this.elements.selectAluno.disabled = true;
        if (this.elements.filtroDisciplina) this.elements.filtroDisciplina.disabled = true;
        if (this.elements.filtroAluno) this.elements.filtroAluno.disabled = true;
        if (this.elements.massaDisciplina) this.elements.massaDisciplina.disabled = true;
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
        console.log("Carregando dependências do formulário para turma:", turmaId);
        
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
            
            console.log("Disciplinas recebidas:", disciplinas);
            console.log("Alunos recebidos:", alunos);
            
            // Popular select de disciplinas
            if (disciplinas.length > 0 && this.elements.selectDisciplina) {
                // Criar um conjunto para armazenar IDs de disciplinas já adicionadas
                const disciplinasAdicionadas = new Set();
                
                disciplinas.forEach(disciplina => {
                    const disciplinaId = String(disciplina.id_disciplina || disciplina.id);
                    
                    // Verificar se esta disciplina já foi adicionada
                    if (!disciplinasAdicionadas.has(disciplinaId)) {
                        disciplinasAdicionadas.add(disciplinaId);
                        
                        const option = document.createElement('option');
                        option.value = disciplinaId;
                        option.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                        this.elements.selectDisciplina.appendChild(option);
                    } else {
                        console.log(`Disciplina ${disciplinaId} ignorada (duplicada)`);
                    }
                });
                
                console.log(`Adicionadas ${disciplinasAdicionadas.size} disciplinas únicas ao select`);
            } else {
                console.log("Nenhuma disciplina disponível para esta turma ou elemento select não encontrado");
            }
            
            // Popular select de alunos
            if (alunos.length > 0 && this.elements.selectAluno) {
                // Criar um conjunto para armazenar IDs de alunos já adicionados
                const alunosAdicionados = new Set();
                
                alunos.forEach(aluno => {
                    const alunoId = String(aluno.id_aluno || aluno.id);
                    
                    // Verificar se este aluno já foi adicionado
                    if (!alunosAdicionados.has(alunoId)) {
                        alunosAdicionados.add(alunoId);
                        
                        const option = document.createElement('option');
                        option.value = alunoId;
                        option.textContent = aluno.nome_aluno || aluno.nome || 'N/A';
                        this.elements.selectAluno.appendChild(option);
                    } else {
                        console.log(`Aluno ${alunoId} ignorado (duplicado)`);
                    }
                });
                
                console.log(`Adicionados ${alunosAdicionados.size} alunos únicos ao select`);
            } else {
                console.log("Nenhum aluno disponível para esta turma ou elemento select não encontrado");
            }
        } catch (error) {
            console.error("Erro ao carregar dependências do formulário:", error);
        }
    },
    
    // Carregar dependências para o filtro (disciplinas e alunos de uma turma)
    carregarDependenciasFiltro: async function(turmaId) {
        console.log("Carregando dependências do filtro para turma:", turmaId);
        
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
            
            console.log("Disciplinas recebidas para filtro:", disciplinas);
            console.log("Alunos recebidos para filtro:", alunos);
            
            // Popular select de disciplinas
            if (disciplinas.length > 0 && this.elements.filtroDisciplina) {
                // Criar um conjunto para armazenar IDs de disciplinas já adicionadas
                const disciplinasAdicionadas = new Set();
                
                disciplinas.forEach(disciplina => {
                    const disciplinaId = String(disciplina.id_disciplina || disciplina.id);
                    
                    // Verificar se esta disciplina já foi adicionada
                    if (!disciplinasAdicionadas.has(disciplinaId)) {
                        disciplinasAdicionadas.add(disciplinaId);
                        
                        const option = document.createElement('option');
                        option.value = disciplinaId;
                        option.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                        this.elements.filtroDisciplina.appendChild(option);
                    } else {
                        console.log(`Disciplina ${disciplinaId} ignorada no filtro (duplicada)`);
                    }
                });
                
                console.log(`Adicionadas ${disciplinasAdicionadas.size} disciplinas únicas ao filtro`);
            } else {
                console.log("Nenhuma disciplina disponível para esta turma ou elemento filtro não encontrado");
            }
            
            // Popular select de alunos
            if (alunos.length > 0 && this.elements.filtroAluno) {
                // Criar um conjunto para armazenar IDs de alunos já adicionados
                const alunosAdicionados = new Set();
                
                alunos.forEach(aluno => {
                    const alunoId = String(aluno.id_aluno || aluno.id);
                    
                    // Verificar se este aluno já foi adicionado
                    if (!alunosAdicionados.has(alunoId)) {
                        alunosAdicionados.add(alunoId);
                        
                        const option = document.createElement('option');
                        option.value = alunoId;
                        option.textContent = aluno.nome_aluno || aluno.nome || 'N/A';
                        this.elements.filtroAluno.appendChild(option);
                    } else {
                        console.log(`Aluno ${alunoId} ignorado no filtro (duplicado)`);
                    }
                });
                
                console.log(`Adicionados ${alunosAdicionados.size} alunos únicos ao filtro`);
            } else {
                console.log("Nenhum aluno disponível para esta turma ou elemento filtro não encontrado");
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
            console.log("URL completa da API:", ConfigModule.getApiUrl(endpoint));
            
            try {
                const notas = await ConfigModule.fetchApi(endpoint, { catchError: true });
                
                // Verificar se houve erro na requisição
                if (notas && notas.error) {
                    console.error("Erro retornado pela API:", notas);
                    this.mostrarErro(`Erro ao carregar notas: ${notas.message || 'Servidor indisponível'}`);
                    this.elements.listaNotas.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Erro ao carregar notas. O servidor pode estar indisponível.</td></tr>';
                    return;
                }
                
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
            } catch (fetchError) {
                console.error("Erro ao buscar notas da API:", fetchError);
                this.mostrarErro("Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.");
                this.elements.listaNotas.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.</td></tr>';
            }
        } catch (error) {
            console.error("Erro geral ao carregar notas:", error);
            this.mostrarErro("Ocorreu um erro inesperado. Tente novamente mais tarde.");
            this.elements.listaNotas.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Ocorreu um erro inesperado. Tente novamente mais tarde.</td></tr>';
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
        if (!this.elements.listaNotas) {
            console.error("Elemento listaNotas não encontrado");
            return;
        }
        
        // Limpar a tabela atual
        this.elements.listaNotas.innerHTML = '';
        
        if (this.state.notas.length === 0) {
            this.elements.listaNotas.innerHTML = '<tr><td colspan="11" class="text-center">Nenhuma nota encontrada. Use os filtros acima para buscar notas.</td></tr>';
            return;
        }

        console.log("Renderizando notas:", this.state.notas);
        
        // Para cada nota, criar uma linha na tabela
        this.state.notas.forEach(nota => {
            try {
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
                const notaMensal = nota.nota_mensal !== undefined && nota.nota_mensal !== null ? parseFloat(nota.nota_mensal) : null;
                const notaBimestral = nota.nota_bimestral !== undefined && nota.nota_bimestral !== null ? parseFloat(nota.nota_bimestral) : null;
                
                // Melhorar a detecção da nota de recuperação verificando todas as variações possíveis
                let notaRecuperacao = null;
                
                // Log para depuração dos valores de recuperação
                console.log("Valores de recuperação na nota:", {
                    nota_recuperacao: nota.nota_recuperacao,
                    recuperacao: nota.recuperacao,
                    rec: nota.rec
                });
                
                // Verificar todos os possíveis nomes para o campo de recuperação
                if (nota.nota_recuperacao !== undefined && nota.nota_recuperacao !== null && nota.nota_recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.nota_recuperacao);
                } else if (nota.recuperacao !== undefined && nota.recuperacao !== null && nota.recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.recuperacao);
                } else if (nota.rec !== undefined && nota.rec !== null && nota.rec !== "") {
                    notaRecuperacao = parseFloat(nota.rec);
                }
                
                console.log("Valores processados:", {
                    notaMensal, 
                    notaBimestral, 
                    notaRecuperacao
                });
                
                // Calcular a média base: (mensal + bimestral) / 2
                let mediaBase = 0;
                if (notaMensal !== null && notaBimestral !== null) {
                    mediaBase = (notaMensal + notaBimestral) / 2;
                } else if (notaMensal !== null) {
                    mediaBase = notaMensal;
                } else if (notaBimestral !== null) {
                    mediaBase = notaBimestral;
                }
                
                // Determinar a situação do aluno com base na média
                let situacao = '';
                let corFundo = '';
                let mediaFinal = mediaBase;
                
                if (mediaBase >= 6.0) {
                    // Aprovado no bimestre - fundo verde claro
                    situacao = 'Aprovado';
                    corFundo = 'bg-success bg-opacity-10';
                } else if (mediaBase >= 4.0 && mediaBase < 6.0) {
                    // Recuperação - fundo amarelo claro
                    situacao = 'Recuperação';
                    corFundo = 'bg-warning bg-opacity-10';
                    
                    // Se tem nota de recuperação, calcular nova média: (mediaBase + recuperacao) / 2
                    if (notaRecuperacao !== null && !isNaN(notaRecuperacao)) {
                        mediaFinal = (mediaBase + notaRecuperacao) / 2;
                    }
                } else if (mediaBase < 4.0) {
                    // Recuperação (caso crítico) - fundo vermelho claro
                    situacao = 'Recuperação';
                    corFundo = 'bg-danger bg-opacity-10';
                    
                    // Se tem nota de recuperação, calcular nova média: (mediaBase + recuperacao) / 2
                    if (notaRecuperacao !== null && !isNaN(notaRecuperacao)) {
                        mediaFinal = (mediaBase + notaRecuperacao) / 2;
                    }
                }
                
                // Arredondar para uma casa decimal
                mediaFinal = Math.round(mediaFinal * 10) / 10;
                
                console.log("Médias calculadas:", {
                    mediaBase: mediaBase,
                    mediaFinal: mediaFinal,
                    situacao: situacao
                });
                
                // Se não conseguirmos encontrar os objetos relacionados, usamos os IDs diretamente
                const turmaInfo = turma ? `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})` : turmaId || 'N/A';
                const disciplinaInfo = disciplina ? (disciplina.nome_disciplina || disciplina.nome || 'N/A') : disciplinaId || 'N/A';
                const alunoInfo = aluno ? (aluno.nome_aluno || aluno.nome || 'N/A') : alunoId || 'N/A';
                
                // Criar a linha da tabela
                const row = document.createElement('tr');
                
                // Adicionar classe para cor de fundo baseada na situação
                if (corFundo) {
                    row.className = corFundo;
                }
                
                row.innerHTML = `
                    <td>${nota.id || 'N/A'}</td>
                    <td>${turmaInfo}</td>
                    <td>${disciplinaInfo}</td>
                    <td>${alunoInfo}</td>
                    <td>${nota.bimestre || 'N/A'}º</td>
                    <td>${nota.ano || 'N/A'}</td>
                    <td>${notaMensal !== null ? notaMensal.toFixed(1) : '-'}</td>
                    <td>${notaBimestral !== null ? notaBimestral.toFixed(1) : '-'}</td>
                    <td>${notaRecuperacao !== null && !isNaN(notaRecuperacao) ? notaRecuperacao.toFixed(1) : '-'}</td>
                    <td>${typeof mediaFinal === 'number' && !isNaN(mediaFinal) ? mediaFinal.toFixed(1) : '-'}</td>
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
                
                if (btnEditar) btnEditar.addEventListener('click', () => this.editarNota(nota.id));
                if (btnExcluir) btnExcluir.addEventListener('click', () => this.confirmarExclusao(nota.id));
                
                // Adicionar a linha à tabela
                this.elements.listaNotas.appendChild(row);
            } catch (error) {
                console.error("Erro ao renderizar nota:", error, nota);
            }
        });
        
        // Atualizar ícones de ordenação
        this.atualizarIconesOrdenacao();
    },
    
    // Calcular média local (no formulário)
    calcularMediaForm: function() {
        if (!this.elements.inputNotaMensal || !this.elements.inputNotaBimestral || !this.elements.inputMediaFinal) return;
        
        const notaMensal = parseFloat(this.elements.inputNotaMensal.value) || 0;
        const notaBimestral = parseFloat(this.elements.inputNotaBimestral.value) || 0;
        const notaRecuperacao = parseFloat(this.elements.inputNotaRecuperacao.value) || 0;
        
        // Calcular média base (mensal + bimestral) / 2
        let mediaBase = (notaMensal + notaBimestral) / 2;
        let mediaFinal = mediaBase;
        
        // Verificar situação com base na média
        if (mediaBase < 6.0 && notaRecuperacao > 0) {
            // Se média < 6.0 e tem nota de recuperação, calcular (média + recuperação) / 2
            mediaFinal = (mediaBase + notaRecuperacao) / 2;
        }
        
        // Arredondar para uma casa decimal
        mediaFinal = Math.round(mediaFinal * 10) / 10;
        
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
            console.log(`Iniciando edição da nota ID: ${id}`);
            
            // Buscar informações detalhadas da nota
            const nota = await ConfigModule.fetchApi(`/notas/${id}`);
            
            if (!nota) {
                this.mostrarErro("Nota não encontrada.");
                return;
            }
            
            console.log("Dados da nota para edição:", nota);
            
            this.state.modoEdicao = true;
            this.state.notaSelecionada = nota;
            
            const turmaId = nota.turma_id || nota.id_turma;
            
            // Carregar dependências primeiro (disciplinas e alunos da turma)
            await this.carregarDependenciasFormulario(turmaId);
            
            // Verificar se há um campo de ID oculto para a nota
            const inputNotaId = document.getElementById('nota-id');
            if (inputNotaId) {
                console.log(`Definindo ID da nota no campo oculto: ${nota.id}`);
                inputNotaId.value = nota.id;
            } else {
                console.warn("Campo de ID da nota não encontrado no DOM");
            }
            
            if (this.elements.formNota) {
                this.elements.formNota.classList.remove('d-none');
                this.elements.selectTurma.value = turmaId;
                this.elements.selectDisciplina.value = nota.disciplina_id || nota.id_disciplina;
                this.elements.selectAluno.value = nota.aluno_id || nota.id_aluno;
                this.elements.selectBimestre.value = nota.bimestre;
                this.elements.inputAno.value = nota.ano;
                this.elements.inputNotaMensal.value = nota.nota_mensal !== undefined && nota.nota_mensal !== null ? nota.nota_mensal : '';
                this.elements.inputNotaBimestral.value = nota.nota_bimestral !== undefined && nota.nota_bimestral !== null ? nota.nota_bimestral : '';
                
                // Log para depuração dos valores de recuperação
                console.log("Valores de recuperação na nota:", {
                    nota_recuperacao: nota.nota_recuperacao,
                    recuperacao: nota.recuperacao,
                    rec: nota.rec
                });
                
                // Melhorar a detecção da nota de recuperação verificando todas as variações possíveis
                let notaRecuperacao = null;
                
                // Verificar todos os possíveis nomes para o campo de recuperação
                if (nota.nota_recuperacao !== undefined && nota.nota_recuperacao !== null && nota.nota_recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.nota_recuperacao);
                    console.log("Recuperação obtida de nota_recuperacao:", notaRecuperacao);
                } else if (nota.recuperacao !== undefined && nota.recuperacao !== null && nota.recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.recuperacao);
                    console.log("Recuperação obtida de recuperacao:", notaRecuperacao);
                } else if (nota.rec !== undefined && nota.rec !== null && nota.rec !== "") {
                    notaRecuperacao = parseFloat(nota.rec);
                    console.log("Recuperação obtida de rec:", notaRecuperacao);
                }
                
                // Preencher o campo de recuperação se existir valor
                if (notaRecuperacao !== null && !isNaN(notaRecuperacao)) {
                    this.elements.inputNotaRecuperacao.value = notaRecuperacao;
                    console.log(`Campo de recuperação preenchido com: ${notaRecuperacao}`);
                } else {
                    this.elements.inputNotaRecuperacao.value = '';
                    console.log("Campo de recuperação deixado em branco");
                }
                
                // Calcular e mostrar a média
                this.calcularMediaForm();
                
                this.elements.selectTurma.focus();
            }
        } catch (error) {
            console.error("Erro ao editar nota:", error);
            this.mostrarErro("Não foi possível carregar os dados da nota para edição.");
        }
    },
    
    // Confirmar exclusão de uma nota
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza de que deseja excluir esta nota?")) {
            this.excluirNota(id);
        }
    },
    
    // Excluir uma nota
    excluirNota: async function(id) {
        try {
            await ConfigModule.fetchApi(`/notas/${id}`, {
                method: 'DELETE'
            });
            
            this.mostrarSucesso("Nota excluída com sucesso!");
            
            // Recarregar notas
            this.filtrarNotas();
        } catch (error) {
            console.error("Erro ao excluir nota:", error);
            this.mostrarErro("Não foi possível excluir a nota. Tente novamente mais tarde.");
        }
    },
    
    // Salvar notas em massa
    salvarNotasEmMassa: async function() {
        try {
            const notas = this.state.notas.map(nota => ({
                turma_id: nota.turma_id || nota.id_turma,
                disciplina_id: nota.disciplina_id || nota.id_disciplina,
                aluno_id: nota.aluno_id || nota.id_aluno,
                nota_mensal: nota.nota_mensal,
                nota_bimestral: nota.nota_bimestral,
                nota_recuperacao: nota.nota_recuperacao,
                bimestre: nota.bimestre,
                ano: nota.ano
            }));
            
            await ConfigModule.fetchApi('/notas/massa', {
                method: 'POST',
                body: JSON.stringify(notas)
            });
            
            this.mostrarSucesso("Notas salvas com sucesso!");
            
            // Recarregar notas
            this.filtrarNotas();
        } catch (error) {
            console.error("Erro ao salvar notas em massa:", error);
            this.mostrarErro("Não foi possível salvar as notas em massa. Tente novamente mais tarde.");
        }
    },
    
    // Carregar notas de uma turma específica
    carregarGradeNotas: async function() {
        try {
            const turmaId = this.elements.massaTurma.value;
            await this.carregarNotas({ turma_id: turmaId });
        } catch (error) {
            console.error("Erro ao carregar notas da turma:", error);
            this.mostrarErro("Não foi possível carregar as notas da turma.");
        }
    },
    
    // Carregar disciplinas de uma turma específica
    carregarDisciplinasGrade: async function(turmaId) {
        try {
            const disciplinas = await this.carregarDisciplinasDaTurma(turmaId);
            console.log("Disciplinas da turma:", disciplinas);
        } catch (error) {
            console.error("Erro ao carregar disciplinas da turma:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas da turma.");
        }
    },
    
    // Inicializar cabeçalhos de ordenação
    inicializarCabecalhosOrdenacao: function() {
        const cabecalhos = document.querySelectorAll('#tabela-notas th[data-ordenavel]');
        cabecalhos.forEach(cabecalho => {
            const coluna = cabecalho.dataset.coluna;
            const direcao = this.state.ordenacao.coluna === coluna ? this.state.ordenacao.direcao : 'asc';
            
            cabecalho.addEventListener('click', () => {
                this.ordenarNotas(coluna, direcao);
            });
        });
    },
    
    // Ordenar notas
    ordenarNotas: function(coluna, direcao) {
        if (this.state.notas.length > 0) {
            this.state.ordenacao.coluna = coluna;
            this.state.ordenacao.direcao = direcao;
            
            this.state.notas.sort((a, b) => {
                const valorA = a[coluna] || '';
                const valorB = b[coluna] || '';
                
                if (typeof valorA === 'string' && typeof valorB === 'string') {
                    return direcao === 'asc' ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA);
                } else if (typeof valorA === 'number' && typeof valorB === 'number') {
                    return direcao === 'asc' ? valorA - valorB : valorB - valorA;
                }
                return 0;
            });
            
            this.renderizarNotas();
        }
    },
    
    // Atualizar ícones de ordenação
    atualizarIconesOrdenacao: function() {
        const cabecalhos = document.querySelectorAll('#tabela-notas th[data-ordenavel]');
        cabecalhos.forEach(cabecalho => {
            const coluna = cabecalho.dataset.coluna;
            const direcao = this.state.ordenacao.coluna === coluna ? this.state.ordenacao.direcao : 'asc';
            
            cabecalho.innerHTML = `
                ${coluna.charAt(0).toUpperCase() + coluna.slice(1)}
                <i class="fas fa-sort-${direcao === 'asc' ? 'up' : 'down'}"></i>
            `;
        });
    },
    
    // Mostrar mensagem de sucesso
    mostrarSucesso: function(mensagem) {
        console.log("Sucesso:", mensagem);
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-success alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        const conteudoNotas = document.querySelector('#conteudo-notas');
        if (conteudoNotas) {
            conteudoNotas.insertBefore(alertContainer, conteudoNotas.firstChild);
            
            // Auto-remover após 5 segundos
            setTimeout(() => {
                alertContainer.remove();
            }, 5000);
        } else {
            console.warn("Elemento #conteudo-notas não encontrado para mostrar mensagem de sucesso");
        }
    },
    
    // Mostrar mensagem de erro
    mostrarErro: function(mensagem) {
        console.error("Erro:", mensagem);
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-danger alert-dismissible fade show';
        alertContainer.innerHTML = `
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        const conteudoNotas = document.querySelector('#conteudo-notas');
        if (conteudoNotas) {
            conteudoNotas.insertBefore(alertContainer, conteudoNotas.firstChild);
            
            // Auto-remover após 8 segundos (mais tempo para erros)
            setTimeout(() => {
                alertContainer.remove();
            }, 8000);
        } else {
            // Se não encontrar o elemento, mostrar alerta nativo
            console.warn("Elemento #conteudo-notas não encontrado, usando alert nativo");
            alert(`Erro: ${mensagem}`);
        }
    },
    
    // Salvar nota individual
    salvarNota: async function() {
        if (!this.validarFormularioNota()) {
            return;
        }
        
        console.log('Elementos do formulário:', this.elements);
        
        // Verificar se o campo de ID existe e obter o ID da nota
        const inputNotaId = document.getElementById('nota-id');
        const notaId = inputNotaId ? inputNotaId.value : (this.state.notaSelecionada ? this.state.notaSelecionada.id : null);
        
        console.log('ID da nota a salvar:', notaId);
        
        const notaMensal = this.elements.inputNotaMensal.value.trim();
        const notaBimestral = this.elements.inputNotaBimestral.value.trim();
        const notaRecuperacao = this.elements.inputNotaRecuperacao.value.trim();
        
        console.log('Valores a salvar:', {
            mensal: notaMensal,
            bimestral: notaBimestral,
            recuperacao: notaRecuperacao
        });
        
        // Adicionar feedback visual
        const btnSalvar = this.elements.btnSalvarNota;
        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Salvando...';
        btnSalvar.disabled = true;
        
        try {
            const notaDados = {
                id_turma: this.elements.selectTurma.value,
                id_disciplina: this.elements.selectDisciplina.value,
                id_aluno: this.elements.selectAluno.value,
                bimestre: parseInt(this.elements.selectBimestre.value),
                ano: parseInt(this.elements.inputAno.value),
                nota_mensal: notaMensal ? parseFloat(notaMensal) : null,
                nota_bimestral: notaBimestral ? parseFloat(notaBimestral) : null,
                nota_recuperacao: notaRecuperacao ? parseFloat(notaRecuperacao) : null,
                recuperacao: notaRecuperacao ? parseFloat(notaRecuperacao) : null,
                rec: notaRecuperacao ? parseFloat(notaRecuperacao) : null // Adicionar mais um campo alternativo
            };
            
            // Calcular média final
            const media = this.calcularMediaAluno(notaMensal, notaBimestral, notaRecuperacao);
            if (media !== null) {
                notaDados.media_final = media;
                notaDados.media = media; // Para compatibilidade
            }
            
            console.log("Dados completos da nota a salvar:", notaDados);
            
            let response;
            if (notaId) {
                // Atualizar nota existente
                console.log(`Atualizando nota existente (ID: ${notaId})`);
                response = await ConfigModule.fetchApi(`/notas/${notaId}`, {
                    method: 'PUT',
                    body: JSON.stringify(notaDados)
                });
                console.log("Nota atualizada com sucesso:", response);
                this.mostrarSucesso("Nota atualizada com sucesso!");
            } else {
                // Verificar se já existe uma nota para este aluno, disciplina, bimestre e ano
                const filtro = `?id_turma=${notaDados.id_turma}&id_disciplina=${notaDados.id_disciplina}&id_aluno=${notaDados.id_aluno}&bimestre=${notaDados.bimestre}&ano=${notaDados.ano}`;
                const notasExistentes = await ConfigModule.fetchApi(`/notas${filtro}`);
                
                if (notasExistentes && notasExistentes.length > 0) {
                    // Já existe uma nota, atualize-a em vez de criar uma nova
                    const notaExistente = notasExistentes[0];
                    console.log(`Nota já existe (ID: ${notaExistente.id}), atualizando em vez de criar nova`);
                    response = await ConfigModule.fetchApi(`/notas/${notaExistente.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(notaDados)
                    });
                    console.log("Nota existente atualizada com sucesso:", response);
                    this.mostrarSucesso("Nota existente atualizada com sucesso!");
                } else {
                    // Criar nova nota
                    console.log("Criando nova nota");
                    response = await ConfigModule.fetchApi('/notas', {
                        method: 'POST',
                        body: JSON.stringify(notaDados)
                    });
                    console.log("Nova nota criada com sucesso:", response);
                    this.mostrarSucesso("Nova nota criada com sucesso!");
                }
            }
            
            // Se estamos em um modal, fechá-lo
            if (typeof bootstrap !== 'undefined' && this.elements.modalNota) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modal-nota'));
                if (modal) {
                    modal.hide();
                } else if (typeof this.elements.modalNota.hide === 'function') {
                    this.elements.modalNota.hide();
                }
            }
            
            // Limpar o formulário
            this.limparFormularioNota();
            
            // Se tiver filtros aplicados, recarregar a grade
            if (this.elements.filtroTurma.value && 
                this.elements.filtroDisciplina.value && 
                this.elements.filtroBimestre.value && 
                this.elements.filtroAno.value) {
                await this.filtrarNotas();
            }
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
            this.mostrarErro(`Erro ao salvar nota: ${error.message || 'Erro desconhecido'}`);
        } finally {
            // Restaurar estado do botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
        }
    }
};

// Exportar módulo
export default NotasModule;
