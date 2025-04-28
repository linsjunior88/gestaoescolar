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
        gradeNotasCorpo: null,
        gradeLoader: null,
        gradeNotas: null
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
        
        // Adicionar estilos CSS para destaques
        this.adicionarEstilosCSS();
    },
    
    // Adicionar estilos CSS para destaques de sucesso e erro
    adicionarEstilosCSS: function() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .destaque-sucesso {
                animation: destaque-sucesso-anim 3s;
            }
            
            .destaque-erro {
                animation: destaque-erro-anim 5s;
            }
            
            @keyframes destaque-sucesso-anim {
                0%, 70% { box-shadow: inset 0 0 0 3px #198754; }
                100% { box-shadow: none; }
            }
            
            @keyframes destaque-erro-anim {
                0%, 70% { box-shadow: inset 0 0 0 3px #dc3545; }
                100% { box-shadow: none; }
            }
        `;
        document.head.appendChild(styleElement);
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        console.log("Cacheando elementos DOM do módulo de notas");
        
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
        this.elements.gradeLoader = document.getElementById('grade-loader');
        this.elements.gradeNotas = document.getElementById('grade-notas');
        
        // Verificar e criar o elemento gradeNotas se necessário
        if (!this.elements.gradeNotas) {
            console.warn("Elemento grade-notas não encontrado inicialmente");
            
            // Procurar por um elemento wrapper para conter a grade
            const gradeNotasWrapper = this.elements.gradeNotasWrapper || 
                                      document.querySelector('#grade-notas-wrapper') || 
                                      document.querySelector('#conteudo-notas');
            
            if (gradeNotasWrapper) {
                // Verificar se já existe um elemento com ID grade-notas dentro do wrapper
                let gradeNotasExistente = gradeNotasWrapper.querySelector('#grade-notas');
                
                if (gradeNotasExistente) {
                    console.log("Elemento grade-notas encontrado dentro do wrapper");
                    this.elements.gradeNotas = gradeNotasExistente;
                } else {
                    // Criar o elemento se não existir
                    console.log("Criando elemento grade-notas dinâmicamente durante inicialização");
                    const novoGradeNotas = document.createElement('div');
                    novoGradeNotas.id = 'grade-notas';
                    novoGradeNotas.className = 'mt-4';
                    gradeNotasWrapper.appendChild(novoGradeNotas);
                    this.elements.gradeNotas = novoGradeNotas;
                }
            } else {
                console.warn("Não foi possível encontrar um container adequado para a grade de notas");
            }
        }
        
        // Log para depuração de elementos críticos
        console.log("Estado dos elementos críticos após cachear:", {
            massaTurma: !!this.elements.massaTurma,
            massaDisciplina: !!this.elements.massaDisciplina,
            massaBimestre: !!this.elements.massaBimestre,
            massaAno: !!this.elements.massaAno,
            btnCarregarGrade: !!this.elements.btnCarregarGrade,
            btnSalvarGrade: !!this.elements.btnSalvarGrade,
            gradeNotas: !!this.elements.gradeNotas,
            gradeNotasWrapper: !!this.elements.gradeNotasWrapper
        });
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
                this.carregarDisciplinasGrade();
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
            console.log("Iniciando salvamento em massa de notas");
            
            // Obter todos os inputs de notas
            const notaInputs = document.querySelectorAll('.nota-input');
            
            // Verificar se há inputs preenchidos
            const inputsPreenchidos = Array.from(notaInputs).filter(input => input.value.trim() !== '');
            if (inputsPreenchidos.length === 0) {
                this.mostrarErro("Nenhuma nota foi preenchida. Por favor, insira pelo menos uma nota para salvar.");
                return;
            }
            
            // Obter dados dos filtros
            const turmaId = this.elements.massaTurma.value;
            const disciplinaId = this.elements.massaDisciplina.value;
            const bimestre = this.elements.massaBimestre.value;
            const ano = this.elements.massaAno.value;
            
            if (!turmaId || !disciplinaId || !bimestre || !ano) {
                this.mostrarErro("Informações incompletas. Recarregue a página e tente novamente.");
                return;
            }
            
            // Adicionar estilos CSS para feedback visual
            this.adicionarEstilosCSS();
            
            // Atualizar texto do botão e desabilitá-lo
            const btnSalvar = this.elements.btnSalvarGrade;
            const textoOriginal = btnSalvar.innerHTML;
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Salvando notas...';
            btnSalvar.disabled = true;
            btnSalvar.classList.add('btn-loading');
            
            // Remover destaques anteriores
            const linhasTabela = document.querySelectorAll('tbody tr');
            linhasTabela.forEach(linha => {
                linha.classList.remove('linha-sucesso', 'linha-erro', 'linha-aviso');
                const statusCell = linha.querySelector('.status-cell');
                if (statusCell) statusCell.innerHTML = '';
            });
            
            // Contadores para feedback
            let notasCriadas = 0;
            let notasAtualizadas = 0;
            let notasComErro = 0;
            
            // Processar cada nota
            for (const input of notaInputs) {
                const valor = input.value.trim();
                if (valor === '') continue;
                
                // Validar valor da nota
                const valorNumerico = parseFloat(valor);
                if (isNaN(valorNumerico) || valorNumerico < 0 || valorNumerico > 10) {
                    console.error(`Valor inválido para nota: ${valor}`);
                    
                    // Destacar linha com erro
                    const linha = input.closest('tr');
                    linha.classList.add('linha-erro');
                    linha.querySelector('.status-cell').innerHTML = '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i> Valor inválido (0-10)</span>';
                    
                    // Destacar o input também
                    input.classList.add('is-invalid');
                    
                    notasComErro++;
                    continue;
                }
                
                const alunoId = input.dataset.alunoId;
                const notaId = input.dataset.notaId;
                const linha = input.closest('tr');
                
                try {
                    let response;
                    let novaNotaId = notaId;
                    
                    // Preparar dados para API
                    const dadosNota = {
                        id_turma: turmaId,
                        id_disciplina: disciplinaId,
                        id_aluno: alunoId,
                        bimestre: bimestre,
                        ano: ano,
                        valor: valorNumerico
                    };
                    
                    // Mostrar status de processamento
                    linha.querySelector('.status-cell').innerHTML = '<span class="badge bg-secondary"><i class="fas fa-sync fa-spin me-1"></i> Processando...</span>';
                    
                    // Atualizar nota existente ou criar nova
                    if (notaId) {
                        // Atualizar nota existente
                        response = await ConfigModule.fetchApi(`/notas/${notaId}`, {
                            method: 'PUT',
                            body: JSON.stringify(dadosNota)
                        });
                        
                        if (!response.error) {
                            // Remover qualquer classe de erro anterior
                            input.classList.remove('is-invalid');
                            linha.classList.remove('linha-erro');
                            
                            // Adicionar classe de sucesso e badge
                            linha.classList.add('linha-sucesso');
                            linha.querySelector('.status-cell').innerHTML = '<span class="badge bg-success"><i class="fas fa-check me-1"></i> Atualizada</span>';
                            notasAtualizadas++;
                        } else {
                            throw new Error(`Erro ao atualizar nota: ${response.message || response.status}`);
                        }
                    } else {
                        // Criar nova nota
                        response = await ConfigModule.fetchApi('/notas', {
                            method: 'POST',
                            body: JSON.stringify(dadosNota)
                        });
                        
                        if (!response.error) {
                            const novaNota = response;
                            novaNotaId = novaNota.id;
                            
                            // Atualizar o dataset do input para futuros salvamentos
                            input.dataset.notaId = novaNotaId;
                            linha.dataset.notaId = novaNotaId;
                            
                            // Remover qualquer classe de erro anterior
                            input.classList.remove('is-invalid');
                            linha.classList.remove('linha-erro');
                            
                            // Adicionar classe de sucesso e badge
                            linha.classList.add('linha-sucesso');
                            linha.querySelector('.status-cell').innerHTML = '<span class="badge bg-primary"><i class="fas fa-plus-circle me-1"></i> Criada</span>';
                            notasCriadas++;
                        } else {
                            throw new Error(`Erro ao criar nota: ${response.message || response.status}`);
                        }
                    }
                } catch (error) {
                    console.error(`Erro ao salvar nota para aluno ${alunoId}:`, error);
                    linha.classList.add('linha-erro');
                    input.classList.add('is-invalid');
                    linha.querySelector('.status-cell').innerHTML = `<span class="badge bg-danger"><i class="fas fa-times me-1"></i> Erro ao salvar</span>`;
                    notasComErro++;
                }
            }
            
            // Restaurar botão
            btnSalvar.innerHTML = textoOriginal;
            btnSalvar.disabled = false;
            btnSalvar.classList.remove('btn-loading');
            
            // Mostrar mensagem de sucesso com resumo
            if (notasCriadas > 0 || notasAtualizadas > 0) {
                let mensagem = '<strong>Notas salvas com sucesso!</strong> ';
                const detalhes = [];
                
                if (notasCriadas > 0) {
                    detalhes.push(`<span class="badge bg-primary">${notasCriadas}</span> nova${notasCriadas > 1 ? 's' : ''} criada${notasCriadas > 1 ? 's' : ''}`);
                }
                
                if (notasAtualizadas > 0) {
                    detalhes.push(`<span class="badge bg-success">${notasAtualizadas}</span> atualizada${notasAtualizadas > 1 ? 's' : ''}`);
                }
                
                mensagem += detalhes.join(' e ');
                
                if (notasComErro > 0) {
                    mensagem += `. <span class="badge bg-danger">${notasComErro}</span> nota${notasComErro > 1 ? 's' : ''} com erro (veja os detalhes na tabela).`;
                } else {
                    mensagem += '.';
                }
                
                this.mostrarSucesso(mensagem);
                
                // Rolar para o topo da página para mostrar a mensagem
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Piscar a mensagem para chamar atenção
                setTimeout(() => {
                    const alertas = document.querySelectorAll('.alert-success');
                    alertas.forEach(alerta => {
                        alerta.classList.add('alerta-piscante');
                    });
                }, 100);
            } else if (notasComErro > 0) {
                this.mostrarErro(`<strong>Não foi possível salvar as notas.</strong> <span class="badge bg-danger">${notasComErro}</span> nota${notasComErro > 1 ? 's' : ''} com erro.`);
                
                // Rolar para o topo da página para mostrar a mensagem
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // Definir timeout para remover os destaques após algum tempo
            setTimeout(() => {
                document.querySelectorAll('.linha-sucesso, .linha-erro').forEach(linha => {
                    // Manter o destaque, mas diminuir gradualmente a intensidade
                    linha.classList.add('linha-fade');
                });
                // Não remover completamente para manter a referência visual
            }, 10000); // 10 segundos
            
        } catch (error) {
            console.error("Erro ao salvar notas em massa:", error);
            this.mostrarErro(`<strong>Ocorreu um erro ao tentar salvar as notas.</strong> ${error.message || 'Por favor, tente novamente.'}`);
            
            // Restaurar botão em caso de erro
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.innerHTML = 'Salvar Todas as Notas';
                this.elements.btnSalvarGrade.disabled = false;
                this.elements.btnSalvarGrade.classList.remove('btn-loading');
            }
            
            // Rolar para o topo da página para mostrar a mensagem de erro
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },
    
    // Adicionar estilos CSS para feedback visual das notas
    adicionarEstilosCSS: function() {
        // Verificar se os estilos já foram adicionados
        if (document.getElementById('notas-massa-estilos')) {
            return;
        }
        
        // Criar elemento de estilo
        const estilos = document.createElement('style');
        estilos.id = 'notas-massa-estilos';
        
        // Definir estilos CSS
        estilos.textContent = `
            .linha-sucesso {
                background-color: rgba(25, 135, 84, 0.15) !important;
                box-shadow: inset 0 0 0 1px rgba(25, 135, 84, 0.25);
                transition: all 0.3s ease;
            }
            
            .linha-erro {
                background-color: rgba(220, 53, 69, 0.15) !important;
                box-shadow: inset 0 0 0 1px rgba(220, 53, 69, 0.25);
                transition: all 0.3s ease;
            }
            
            .linha-fade {
                opacity: 0.8;
                transition: opacity 1s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes piscante {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            .alerta-piscante {
                animation: piscante 0.5s ease-in-out 3;
            }
            
            .status-cell .badge {
                animation: fadeIn 0.3s ease-in-out;
                font-size: 0.85rem;
                padding: 5px 8px;
            }
            
            .nota-input.is-invalid {
                border-color: #dc3545;
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
                background-repeat: no-repeat;
                background-position: right calc(0.375em + 0.1875rem) center;
                background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
            }
            
            .btn-loading {
                position: relative;
                pointer-events: none;
            }
            
            #conteudo-notas .alert {
                border-left: 5px solid transparent;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                opacity: 0.95;
                transition: all 0.3s ease;
            }
            
            #conteudo-notas .alert-success {
                border-left-color: #198754;
            }
            
            #conteudo-notas .alert-danger {
                border-left-color: #dc3545;
            }
            
            .alerta-destacado {
                transform: translateY(2px);
                box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15) !important;
                opacity: 1 !important;
            }
            
            @keyframes fade-out {
                from { opacity: 0.95; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-10px); }
            }
            
            .fade-out {
                animation: fade-out 0.5s ease forwards;
            }
            
            .status-cell {
                min-width: 120px;
            }
            
            /* Melhorar a aparência da grade de notas */
            #grade-notas table {
                border-collapse: separate;
                border-spacing: 0;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            #grade-notas thead th {
                background-color: #f8f9fa;
                border-bottom: 2px solid #dee2e6;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            #grade-notas .nota-input {
                transition: all 0.2s ease;
                border-radius: 4px;
            }
            
            #grade-notas .nota-input:focus {
                box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
                border-color: #86b7fe;
            }
            
            /* Estilos para indicar que a página está carregando */
            .page-loading #grade-notas {
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
        `;
        
        // Adicionar ao cabeçalho do documento
        document.head.appendChild(estilos);
    },
    
    // Carregar disciplinas para o lançamento em massa de notas
    carregarDisciplinasGrade: async function() {
        try {
            const turmaId = this.elements.massaTurma.value;

            // Limpar e desabilitar select de disciplinas se não tiver turma selecionada
            if (!turmaId) {
                this.elements.massaDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
                this.elements.massaDisciplina.disabled = true;
                return;
            }

            console.log("Carregando disciplinas para a turma:", turmaId);
            
            // Mostrar loading
            this.elements.massaDisciplina.innerHTML = '<option value="">Carregando...</option>';
            this.elements.massaDisciplina.disabled = true;

            // Buscar disciplinas vinculadas à turma
            const disciplinas = await ConfigModule.fetchApi(`/turmas/${turmaId}/disciplinas`);
            console.log("Disciplinas carregadas:", disciplinas);

            // Preencher select de disciplinas
            this.elements.massaDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
            
            // Usar Set para evitar duplicatas
            const disciplinasIds = new Set();
            
            // Verificar se disciplinas é um array e tem elementos
            if (Array.isArray(disciplinas) && disciplinas.length > 0) {
                disciplinas.forEach(disciplina => {
                    // Obter o ID da disciplina, considerando diferentes formatos de resposta
                    const id = disciplina.id_disciplina || disciplina.id;
                    const nome = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                    
                    console.log(`Processando disciplina: ID=${id}, Nome=${nome}`);
                    
                    // Verificar se a disciplina já foi adicionada
                    if (disciplinasIds.has(id)) {
                        console.log(`Disciplina ${id} já adicionada, ignorando duplicata`);
                        return;
                    }
                    
                    disciplinasIds.add(id);
                    
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = nome;
                    this.elements.massaDisciplina.appendChild(option);
                });
                
                console.log(`Total de ${disciplinasIds.size} disciplinas únicas adicionadas ao select`);
            } else {
                console.log("Nenhuma disciplina encontrada para esta turma ou resposta em formato inesperado");
                this.elements.massaDisciplina.innerHTML += '<option disabled>Nenhuma disciplina encontrada</option>';
            }

            // Habilitar select de disciplinas
            this.elements.massaDisciplina.disabled = false;

        } catch (error) {
            console.error("Erro ao carregar disciplinas para lançamento em massa:", error);
            this.mostrarErro("Erro ao carregar disciplinas. Por favor, tente novamente.");
            
            // Resetar select de disciplinas
            this.elements.massaDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
            this.elements.massaDisciplina.disabled = true;
        }
    },
    
    // Carregar grade de notas para edição em massa
    carregarGradeNotas: async function() {
        try {
            // Validar campos obrigatórios
            const turmaId = this.elements.massaTurma.value;
            const disciplinaId = this.elements.massaDisciplina.value;
            const bimestre = this.elements.massaBimestre.value;
            const ano = this.elements.massaAno.value;

            if (!turmaId || !disciplinaId || !bimestre || !ano) {
                this.mostrarErro("Preencha todos os campos: turma, disciplina, bimestre e ano.");
                return;
            }

            console.log("Carregando grade de notas para edição em massa:", { turmaId, disciplinaId, bimestre, ano });
            
            // Verificar se o elemento gradeNotas existe
            if (!this.elements.gradeNotas) {
                console.warn("Elemento gradeNotas não encontrado, tentando obter novamente");
                this.elements.gradeNotas = document.getElementById('grade-notas');
                
                // Se ainda não encontrou, criar o elemento
                if (!this.elements.gradeNotas) {
                    console.warn("Criando elemento grade-notas dinâmicamente");
                    const gradeNotasWrapper = document.querySelector('#grade-notas-wrapper') || document.querySelector('#conteudo-notas');
                    
                    if (gradeNotasWrapper) {
                        const novoGradeNotas = document.createElement('div');
                        novoGradeNotas.id = 'grade-notas';
                        novoGradeNotas.className = 'mt-4';
                        gradeNotasWrapper.appendChild(novoGradeNotas);
                        this.elements.gradeNotas = novoGradeNotas;
                    } else {
                        this.mostrarErro("Não foi possível encontrar o container para exibir as notas. Por favor, recarregue a página.");
                        console.error("Nenhum elemento #grade-notas-wrapper ou #conteudo-notas encontrado");
                        return;
                    }
                }
            }
            
            // Adicionar classe de carregamento à página
            const conteudoNotas = document.querySelector('#conteudo-notas');
            if (conteudoNotas) {
                conteudoNotas.classList.add('page-loading');
            }
            
            // Mostrar indicador de carregamento mais atrativo
            this.elements.gradeNotas.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-3 text-primary fw-bold">Carregando alunos e notas...</p>
                    <p class="text-muted">Turma: ${document.querySelector('#massa-turma option:checked')?.textContent || turmaId}</p>
                    <p class="text-muted">Disciplina: ${document.querySelector('#massa-disciplina option:checked')?.textContent || disciplinaId}</p>
                </div>
            `;
            
            // Habilitar o botão de salvar em massa
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.disabled = true;
            }
            
            // Buscar alunos da turma
            const alunos = await ConfigModule.fetchApi(`/turmas/${turmaId}/alunos`);
            console.log("Alunos carregados:", alunos);
            
            if (!alunos || !Array.isArray(alunos) || alunos.length === 0) {
                this.elements.gradeNotas.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Não há alunos cadastrados nesta turma.
                    </div>
                `;
                
                // Remover classe de carregamento
                if (conteudoNotas) {
                    conteudoNotas.classList.remove('page-loading');
                }
                
                return;
            }
            
            // Buscar notas existentes para esta turma, disciplina, bimestre e ano
            const filtro = `?id_turma=${turmaId}&id_disciplina=${disciplinaId}&bimestre=${bimestre}&ano=${ano}`;
            const notasExistentes = await ConfigModule.fetchApi(`/notas${filtro}`);
            console.log("Notas existentes:", notasExistentes);
            
            // Filtrar as notas para garantir que sejam apenas da turma, disciplina, bimestre e ano selecionados
            let notasFiltradas = [];
            
            if (Array.isArray(notasExistentes) && notasExistentes.length > 0) {
                notasFiltradas = notasExistentes.filter(nota => {
                    const notaTurmaId = nota.turma_id || nota.id_turma;
                    const notaDisciplinaId = nota.disciplina_id || nota.id_disciplina;
                    const notaBimestre = String(nota.bimestre);
                    const notaAno = String(nota.ano);
                    
                    const turmaMatch = String(notaTurmaId) === String(turmaId);
                    const disciplinaMatch = String(notaDisciplinaId) === String(disciplinaId);
                    const bimestreMatch = notaBimestre === String(bimestre);
                    const anoMatch = notaAno === String(ano);
                    
                    const isMatch = turmaMatch && disciplinaMatch && bimestreMatch && anoMatch;
                    if (isMatch) {
                        console.log(`Nota encontrada para filtros: ID=${nota.id}, aluno=${nota.id_aluno}, valor=${nota.valor || nota.nota_mensal || nota.nota_bimestral}`);
                    }
                    return isMatch;
                });
                
                console.log(`Filtro aplicado: ${notasFiltradas.length} notas correspondem aos critérios selecionados.`);
            }
            
            // Criar tabela para exibir os alunos e suas notas
            const tabela = document.createElement('table');
            tabela.className = 'table table-striped table-bordered table-hover';
            
            // Cabeçalho da tabela
            const thead = document.createElement('thead');
            thead.className = 'table-light';
            thead.innerHTML = `
                <tr>
                    <th width="5%" class="text-center">#</th>
                    <th width="40%">Aluno</th>
                    <th width="30%" class="text-center">Nota</th>
                    <th width="25%" class="text-center">Status</th>
                </tr>
            `;
            tabela.appendChild(thead);
            
            // Corpo da tabela
            const tbody = document.createElement('tbody');
            
            alunos.forEach((aluno, index) => {
                // Encontrar nota existente para este aluno, considerando vários formatos de ID
                const alunoId = aluno.id_aluno || aluno.id;
                console.log(`Buscando nota para aluno: ID=${alunoId}, Nome=${aluno.nome_aluno || aluno.nome}`);
                
                const notaExistente = Array.isArray(notasFiltradas) ? 
                    notasFiltradas.find(nota => {
                        const notaAlunoId = nota.id_aluno || nota.aluno_id;
                        const match = String(notaAlunoId) === String(alunoId) || 
                                     String(notaAlunoId) === String(aluno.id);
                        
                        if (match) {
                            console.log(`Correspondência encontrada: Nota ID=${nota.id}, aluno_id=${notaAlunoId}, valor=${nota.valor || nota.nota_mensal || nota.nota_bimestral}`);
                        }
                        return match;
                    }) : null;
                
                if (notaExistente) {
                    console.log(`Nota existente encontrada para aluno ${alunoId}:`, notaExistente);
                } else {
                    console.log(`Nenhuma nota existente para aluno ${alunoId}`);
                }
                
                const tr = document.createElement('tr');
                const alunoIdParaUsar = alunoId || aluno.id;
                tr.dataset.alunoId = alunoIdParaUsar;
                
                if (notaExistente) {
                    tr.dataset.notaId = notaExistente.id;
                }
                
                // Determinar o valor da nota a ser exibido, considerando diferentes formatos
                let valorNota = '';
                if (notaExistente) {
                    // Tentar obter o valor da nota considerando diferentes campos possíveis
                    if (notaExistente.valor !== undefined && notaExistente.valor !== null) {
                        valorNota = notaExistente.valor;
                    } else if (notaExistente.nota_mensal !== undefined && notaExistente.nota_mensal !== null) {
                        valorNota = notaExistente.nota_mensal;
                    } else if (notaExistente.nota_bimestral !== undefined && notaExistente.nota_bimestral !== null) {
                        valorNota = notaExistente.nota_bimestral;
                    }
                }
                
                tr.innerHTML = `
                    <td class="text-center align-middle">${index + 1}</td>
                    <td class="align-middle">${aluno.nome_aluno || aluno.nome || 'Aluno ' + alunoIdParaUsar}</td>
                    <td>
                        <div class="input-group">
                            <input type="text" 
                                   class="form-control nota-input" 
                                   data-aluno-id="${alunoIdParaUsar}" 
                                   ${notaExistente ? `data-nota-id="${notaExistente.id}"` : ''}
                                   value="${valorNota}" 
                                   placeholder="0.0 a 10.0">
                            <span class="input-group-text bg-light">/ 10</span>
                        </div>
                    </td>
                    <td class="status-cell text-center">
                        ${notaExistente ? '<span class="badge bg-info"><i class="fas fa-check-circle me-1"></i> Nota existente</span>' : ''}
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            tabela.appendChild(tbody);
            
            // Adicionar informações resumidas acima da tabela
            const infoDiv = document.createElement('div');
            infoDiv.className = 'bg-light p-3 mb-3 rounded border';
            infoDiv.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="mb-1">Lançamento de Notas - ${document.querySelector('#massa-bimestre option:checked')?.textContent || bimestre}º Bimestre ${ano}</h5>
                        <p class="mb-0 text-muted">
                            Turma: <strong>${document.querySelector('#massa-turma option:checked')?.textContent || turmaId}</strong> • 
                            Disciplina: <strong>${document.querySelector('#massa-disciplina option:checked')?.textContent || disciplinaId}</strong>
                        </p>
                    </div>
                    <div>
                        <span class="badge bg-primary">${alunos.length} alunos</span>
                        <span class="badge bg-info">${notasFiltradas.length} notas registradas</span>
                    </div>
                </div>
            `;
            
            // Substituir conteúdo da grade de notas
            this.elements.gradeNotas.innerHTML = '';
            this.elements.gradeNotas.appendChild(infoDiv);
            this.elements.gradeNotas.appendChild(tabela);
            
            // Adicionar dica de uso
            const dicaDiv = document.createElement('div');
            dicaDiv.className = 'alert alert-info mt-3';
            dicaDiv.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                <strong>Dica:</strong> Preencha as notas dos alunos (valores entre 0 e 10) e clique em "Salvar Todas as Notas" para registrá-las no sistema.
            `;
            this.elements.gradeNotas.appendChild(dicaDiv);
            
            // Habilitar o botão de salvar
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.disabled = false;
            }
            
            // Remover classe de carregamento
            if (conteudoNotas) {
                conteudoNotas.classList.remove('page-loading');
            }
            
        } catch (error) {
            console.error("Erro ao carregar grade de notas:", error);
            
            // Verificar se o elemento ainda não existe
            if (!this.elements.gradeNotas) {
                const mensagemErro = `<strong>Erro ao carregar grade de notas.</strong> ${error.message || 'Por favor, tente novamente.'}`;
                this.mostrarErro(mensagemErro);
                return;
            }
            
            this.mostrarErro(`<strong>Erro ao carregar grade de notas.</strong> ${error.message || 'Por favor, tente novamente.'}`);
            this.elements.gradeNotas.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    <strong>Erro ao carregar grade de notas.</strong> ${error.message || 'Por favor, tente novamente.'}
                </div>
            `;
            
            // Remover classe de carregamento
            const conteudoNotas = document.querySelector('#conteudo-notas');
            if (conteudoNotas) {
                conteudoNotas.classList.remove('page-loading');
            }
            
            // Desabilitar botão de salvar
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.disabled = true;
            }
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
        alertContainer.role = 'alert';
        alertContainer.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-2" style="font-size: 1.25rem;"></i>
                <div>${mensagem}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        const conteudoNotas = document.querySelector('#conteudo-notas');
        if (conteudoNotas) {
            // Verificar se já existe um alerta e remover
            const alertasExistentes = conteudoNotas.querySelectorAll('.alert');
            alertasExistentes.forEach(alerta => alerta.remove());
            
            // Inserir o novo alerta
            conteudoNotas.insertBefore(alertContainer, conteudoNotas.firstChild);
            
            // Adicionar efeito de destaque
            setTimeout(() => {
                alertContainer.classList.add('alerta-destacado');
            }, 10);
            
            // Auto-remover após 5 segundos
            setTimeout(() => {
                alertContainer.classList.remove('alerta-destacado');
                alertContainer.classList.add('fade-out');
                
                // Remover após a animação terminar
                setTimeout(() => {
                    if (alertContainer.parentNode) {
                        alertContainer.remove();
                    }
                }, 500);
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
        alertContainer.role = 'alert';
        alertContainer.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-circle me-2" style="font-size: 1.25rem;"></i>
                <div>${mensagem}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        const conteudoNotas = document.querySelector('#conteudo-notas');
        if (conteudoNotas) {
            // Verificar se já existe um alerta de erro e remover
            const alertasErroExistentes = conteudoNotas.querySelectorAll('.alert-danger');
            alertasErroExistentes.forEach(alerta => alerta.remove());
            
            // Inserir o novo alerta
            conteudoNotas.insertBefore(alertContainer, conteudoNotas.firstChild);
            
            // Adicionar efeito de destaque
            setTimeout(() => {
                alertContainer.classList.add('alerta-destacado');
            }, 10);
            
            // Auto-remover após 8 segundos (mais tempo para erros)
            setTimeout(() => {
                alertContainer.classList.remove('alerta-destacado');
                alertContainer.classList.add('fade-out');
                
                // Remover após a animação terminar
                setTimeout(() => {
                    if (alertContainer.parentNode) {
                        alertContainer.remove();
                    }
                }, 500);
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

