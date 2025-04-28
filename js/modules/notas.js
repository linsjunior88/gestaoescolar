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
                const notaMensal = nota.nota_mensal !== undefined ? parseFloat(nota.nota_mensal) : 0;
                const notaBimestral = nota.nota_bimestral !== undefined ? parseFloat(nota.nota_bimestral) : 0;
                
                // Melhorar a detecção da nota de recuperação verificando todas as variações possíveis
                let notaRecuperacao = null;
                // Verificar todos os possíveis nomes para o campo de recuperação
                if (nota.nota_recuperacao !== undefined && nota.nota_recuperacao !== null && nota.nota_recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.nota_recuperacao);
                } else if (nota.recuperacao !== undefined && nota.recuperacao !== null && nota.recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.recuperacao);
                } else if (nota.rec !== undefined && nota.rec !== null && nota.rec !== "") {
                    notaRecuperacao = parseFloat(nota.rec);
                }
                
                // Calcular a média base: (mensal + bimestral) / 2
                const mediaBase = (notaMensal + notaBimestral) / 2;
                
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
                
                // Arredondar para uma casa decimal - .toFixed(1) já faz isso, mas vamos garantir
                // Exemplo: 5.25 deve virar 5.3
                mediaFinal = Math.round(mediaFinal * 10) / 10;
                
                console.log("Notas processadas:", {
                    mensal: notaMensal, 
                    bimestral: notaBimestral, 
                    recuperacao: notaRecuperacao, 
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
                    <td>${typeof notaMensal === 'number' ? notaMensal.toFixed(1) : '0.0'}</td>
                    <td>${typeof notaBimestral === 'number' ? notaBimestral.toFixed(1) : '0.0'}</td>
                    <td>${notaRecuperacao !== null && !isNaN(notaRecuperacao) ? notaRecuperacao.toFixed(1) : 'N/A'}</td>
                    <td>${typeof mediaFinal === 'number' && !isNaN(mediaFinal) ? mediaFinal.toFixed(1) : '0.0'}</td>
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
            // Buscar informações detalhadas da nota
            const nota = await ConfigModule.fetchApi(`/notas/${id}`);
            
            if (!nota) {
                this.mostrarErro("Nota não encontrada.");
                return;
            }
            
            console.log("Editando nota:", nota);
            
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
                
                // Melhorar a detecção da nota de recuperação verificando todas as variações possíveis
                let notaRecuperacao = null;
                // Verificar todos os possíveis nomes para o campo de recuperação
                if (nota.nota_recuperacao !== undefined && nota.nota_recuperacao !== null && nota.nota_recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.nota_recuperacao);
                } else if (nota.recuperacao !== undefined && nota.recuperacao !== null && nota.recuperacao !== "") {
                    notaRecuperacao = parseFloat(nota.recuperacao);
                } else if (nota.rec !== undefined && nota.rec !== null && nota.rec !== "") {
                    notaRecuperacao = parseFloat(nota.rec);
                }
                
                // Preencher o campo de recuperação se existir valor
                if (notaRecuperacao !== null && !isNaN(notaRecuperacao)) {
                    this.elements.inputNotaRecuperacao.value = notaRecuperacao;
                } else {
                    this.elements.inputNotaRecuperacao.value = '';
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
            
            // Verificar se pelo menos uma das notas está preenchida
            const notaMensal = this.elements.inputNotaMensal.value ? parseFloat(this.elements.inputNotaMensal.value) : null;
            const notaBimestral = this.elements.inputNotaBimestral.value ? parseFloat(this.elements.inputNotaBimestral.value) : null;
            const notaRecuperacao = this.elements.inputNotaRecuperacao.value ? parseFloat(this.elements.inputNotaRecuperacao.value) : null;
            
            if (notaMensal === null && notaBimestral === null) {
                this.mostrarErro("Informe pelo menos uma nota (mensal ou bimestral).");
                return;
            }
            
            // Validar valores das notas
            if (notaMensal !== null && (isNaN(notaMensal) || notaMensal < 0 || notaMensal > 10)) {
                this.mostrarErro("A nota mensal deve ser um número entre 0 e 10.");
                return;
            }
            
            if (notaBimestral !== null && (isNaN(notaBimestral) || notaBimestral < 0 || notaBimestral > 10)) {
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
            
            // Calcular média final (apenas se ambas as notas estiverem preenchidas)
            if (notaMensal !== null && notaBimestral !== null) {
                let mediaFinal = (notaMensal + notaBimestral) / 2;
                
                // Se tem recuperação e a média base é menor que 6, considerar a recuperação
                if (notaRecuperacao !== null && mediaFinal < 6) {
                    mediaFinal = (mediaFinal + notaRecuperacao) / 2;
                }
                
                notaDados.media_final = mediaFinal;
            } else if (notaMensal !== null) {
                // Se só tem nota mensal, ela é a média
                notaDados.media_final = notaMensal;
            } else if (notaBimestral !== null) {
                // Se só tem nota bimestral, ela é a média
                notaDados.media_final = notaBimestral;
            }
            
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
    },
    
    // Inicializar cabeçalhos de ordenação
    inicializarCabecalhosOrdenacao: function() {
        // Adicionar ícones de ordenação aos cabeçalhos da tabela
        const cabecalhos = document.querySelectorAll('#tabela-notas th[data-ordenavel]');
        cabecalhos.forEach(cabecalho => {
            const span = document.createElement('span');
            span.className = 'ms-1';
            span.innerHTML = '<i class="fas fa-sort text-muted"></i>';
            cabecalho.appendChild(span);
            
            // Adicionar classe para indicar que é ordenável
            cabecalho.classList.add('ordenavel');
            
            // Adicionar estilo de cursor pointer
            cabecalho.style.cursor = 'pointer';
        });
    },
    
    // Ordenar notas por coluna
    ordenarNotas: function(coluna) {
        // Atualizar estado de ordenação
        if (this.state.ordenacao.coluna === coluna) {
            // Inverter direção se já estiver ordenando por esta coluna
            this.state.ordenacao.direcao = this.state.ordenacao.direcao === 'asc' ? 'desc' : 'asc';
        } else {
            // Nova coluna, começar com ascendente
            this.state.ordenacao.coluna = coluna;
            this.state.ordenacao.direcao = 'asc';
        }
        
        // Ordenar os dados
        this.state.notas.sort((a, b) => {
            let valorA, valorB;
            
            // Extrair valores baseados na coluna selecionada
            switch (coluna) {
                case 'id':
                    valorA = a.id || 0;
                    valorB = b.id || 0;
                    break;
                case 'turma':
                    valorA = a.turma_id || a.id_turma || '';
                    valorB = b.turma_id || b.id_turma || '';
                    break;
                case 'disciplina':
                    valorA = a.disciplina_id || a.id_disciplina || '';
                    valorB = b.disciplina_id || b.id_disciplina || '';
                    break;
                case 'aluno':
                    valorA = a.aluno_id || a.id_aluno || '';
                    valorB = b.aluno_id || b.id_aluno || '';
                    break;
                case 'bimestre':
                    valorA = parseInt(a.bimestre) || 0;
                    valorB = parseInt(b.bimestre) || 0;
                    break;
                case 'ano':
                    valorA = parseInt(a.ano) || 0;
                    valorB = parseInt(b.ano) || 0;
                    break;
                case 'nota_mensal':
                    valorA = parseFloat(a.nota_mensal) || 0;
                    valorB = parseFloat(b.nota_mensal) || 0;
                    break;
                case 'nota_bimestral':
                    valorA = parseFloat(a.nota_bimestral) || 0;
                    valorB = parseFloat(b.nota_bimestral) || 0;
                    break;
                case 'nota_recuperacao':
                    valorA = a.nota_recuperacao !== null ? parseFloat(a.nota_recuperacao) || 0 : -1;
                    valorB = b.nota_recuperacao !== null ? parseFloat(b.nota_recuperacao) || 0 : -1;
                    break;
                case 'media_final':
                    const mediaA = a.media_final !== undefined ? parseFloat(a.media_final) : 
                        ((parseFloat(a.nota_mensal) || 0) + (parseFloat(a.nota_bimestral) || 0)) / 2;
                    const mediaB = b.media_final !== undefined ? parseFloat(b.media_final) : 
                        ((parseFloat(b.nota_mensal) || 0) + (parseFloat(b.nota_bimestral) || 0)) / 2;
                    valorA = mediaA;
                    valorB = mediaB;
                    break;
                default:
                    valorA = a[coluna];
                    valorB = b[coluna];
            }
            
            // Comparar valores baseado na direção
            if (this.state.ordenacao.direcao === 'asc') {
                return valorA > valorB ? 1 : -1;
            } else {
                return valorA < valorB ? 1 : -1;
            }
        });
        
        // Atualizar ícones de ordenação
        this.atualizarIconesOrdenacao();
        
        // Renderizar notas ordenadas
        this.renderizarNotas();
    },
    
    // Atualizar ícones de ordenação nos cabeçalhos
    atualizarIconesOrdenacao: function() {
        const cabecalhos = document.querySelectorAll('#tabela-notas th[data-ordenavel]');
        cabecalhos.forEach(cabecalho => {
            const coluna = cabecalho.dataset.coluna;
            const span = cabecalho.querySelector('span');
            
            if (coluna === this.state.ordenacao.coluna) {
                // Coluna atualmente ordenada
                if (this.state.ordenacao.direcao === 'asc') {
                    span.innerHTML = '<i class="fas fa-sort-up"></i>';
                } else {
                    span.innerHTML = '<i class="fas fa-sort-down"></i>';
                }
            } else {
                // Coluna não ordenada
                span.innerHTML = '<i class="fas fa-sort text-muted"></i>';
            }
        });
    },
    
    // NOVOS MÉTODOS PARA LANÇAMENTO EM MASSA DE NOTAS
    
    // Carregar disciplinas para a grade de notas
    carregarDisciplinasGrade: async function(turmaId) {
        if (!turmaId || !this.elements.massaDisciplina) return;
        
        // Limpar e desabilitar select de disciplina
        this.elements.massaDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
        this.elements.massaDisciplina.disabled = !turmaId;
        
        try {
            const disciplinas = await this.carregarDisciplinasDaTurma(turmaId);
            
            // Popular select de disciplinas para a grade
            if (disciplinas.length > 0) {
                // Usar Set para evitar duplicatas
                const disciplinasAdicionadas = new Set();
                
                disciplinas.forEach(disciplina => {
                    const disciplinaId = String(disciplina.id_disciplina || disciplina.id);
                    
                    if (!disciplinasAdicionadas.has(disciplinaId)) {
                        disciplinasAdicionadas.add(disciplinaId);
                        
                        const option = document.createElement('option');
                        option.value = disciplinaId;
                        option.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                        this.elements.massaDisciplina.appendChild(option);
                    }
                });
                
                console.log(`Adicionadas ${disciplinasAdicionadas.size} disciplinas únicas ao select da grade`);
            } else {
                console.log("Nenhuma disciplina disponível para esta turma");
            }
        } catch (error) {
            console.error("Erro ao carregar disciplinas para a grade:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas. Tente novamente.");
        }
    },
    
    // Calcular média para um aluno na grade
    calcularMediaAluno: function(notaMensal, notaBimestral, notaRecuperacao) {
        // Converter para números
        notaMensal = notaMensal ? parseFloat(notaMensal) : null;
        notaBimestral = notaBimestral ? parseFloat(notaBimestral) : null;
        notaRecuperacao = notaRecuperacao ? parseFloat(notaRecuperacao) : null;
        
        // Se não tem notas, retorna null
        if (notaMensal === null && notaBimestral === null) {
            return null;
        }
        
        // Se tem apenas uma das notas, ela é a média
        if (notaMensal === null) return notaBimestral;
        if (notaBimestral === null) return notaMensal;
        
        // Se tem as duas notas, calcula a média
        let media = (notaMensal + notaBimestral) / 2;
        
        // Se tem recuperação e a média é menor que 6, considera a recuperação
        if (notaRecuperacao !== null && media < 6) {
            media = (media + notaRecuperacao) / 2;
        }
        
        // Arredondar para uma casa decimal
        return Math.round(media * 10) / 10;
    },
    
    // Determinar o status do aluno com base na média
    determinarStatusAluno: function(media) {
        if (media === null) return { texto: 'Sem notas', classe: '' };
        
        if (media >= 6) {
            return { texto: 'Aprovado', classe: 'text-success' };
        } else if (media >= 4) {
            return { texto: 'Recuperação', classe: 'text-warning' };
        } else {
            return { texto: 'Recuperação', classe: 'text-danger' };
        }
    },
    
    // Atualizar média e status de um aluno na grade
    atualizarMediaAluno: function(linha) {
        const notaMensal = linha.querySelector('.nota-mensal').value;
        const notaBimestral = linha.querySelector('.nota-bimestral').value;
        const notaRecuperacao = linha.querySelector('.nota-recuperacao').value;
        
        const media = this.calcularMediaAluno(notaMensal, notaBimestral, notaRecuperacao);
        const status = this.determinarStatusAluno(media);
        
        // Atualizar média e status no DOM
        linha.querySelector('.media-aluno').textContent = media !== null ? media.toFixed(1) : '-';
        
        const statusEl = linha.querySelector('.status-aluno');
        statusEl.textContent = status.texto;
        statusEl.className = 'status-aluno ' + status.classe;
        
        return { media, status };
    },
    
    // Carregar grade de notas
    carregarGradeNotas: async function() {
        const turmaId = this.elements.massaTurma.value;
        const disciplinaId = this.elements.massaDisciplina.value;
        const bimestre = this.elements.massaBimestre.value;
        const ano = this.elements.massaAno.value;
        
        // Validar campos obrigatórios
        if (!turmaId) {
            this.mostrarErro("Selecione uma turma.");
            return;
        }
        
        if (!disciplinaId) {
            this.mostrarErro("Selecione uma disciplina.");
            return;
        }
        
        if (!bimestre) {
            this.mostrarErro("Selecione um bimestre.");
            return;
        }
        
        if (!ano) {
            this.mostrarErro("Informe o ano letivo.");
            return;
        }
        
        try {
            // Carregar alunos da turma
            const alunos = await this.carregarAlunosDaTurma(turmaId);
            
            if (!alunos || alunos.length === 0) {
                this.mostrarErro("Não foram encontrados alunos para esta turma.");
                return;
            }
            
            console.log("Alunos carregados para a grade:", alunos);
            
            // Carregar notas existentes para a combinação de turma, disciplina, bimestre e ano
            const filtros = {
                turma_id: turmaId,
                disciplina_id: disciplinaId,
                bimestre: bimestre,
                ano: ano
            };
            
            // Construir URL para buscar notas
            let endpoint = '/notas';
            const params = new URLSearchParams();
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            
            const queryString = params.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }
            
            console.log("Buscando notas para a grade com endpoint:", endpoint);
            const notas = await ConfigModule.fetchApi(endpoint);
            console.log("Notas recebidas para a grade:", notas);
            
            // Limpar corpo da grade
            this.elements.gradeNotasCorpo.innerHTML = '';
            
            // Construir a grade de notas
            alunos.forEach(aluno => {
                const alunoId = aluno.id_aluno || aluno.id;
                const alunoNome = aluno.nome_aluno || aluno.nome || 'N/A';
                
                // Procurar nota existente para este aluno
                const notaExistente = Array.isArray(notas) ? notas.find(nota => {
                    const notaAlunoId = nota.aluno_id || nota.id_aluno;
                    return String(notaAlunoId) === String(alunoId);
                }) : null;
                
                console.log(`Processando aluno ${alunoId} (${alunoNome}), nota existente:`, notaExistente);
                
                // Extrair valores das notas existentes
                const notaMensal = notaExistente ? notaExistente.nota_mensal : '';
                const notaBimestral = notaExistente ? notaExistente.nota_bimestral : '';
                const notaRecuperacao = notaExistente ? notaExistente.nota_recuperacao : '';
                const notaId = notaExistente ? notaExistente.id : '';
                
                // Calcular média e status
                const media = this.calcularMediaAluno(notaMensal, notaBimestral, notaRecuperacao);
                const status = this.determinarStatusAluno(media);
                
                // Criar linha na tabela
                const linha = document.createElement('tr');
                linha.dataset.alunoId = alunoId;
                linha.dataset.notaId = notaId; // Armazenar ID da nota se existir
                
                linha.innerHTML = `
                    <td>${alunoNome}</td>
                    <td>
                        <input type="number" class="form-control nota-mensal" min="0" max="10" step="0.1" value="${notaMensal || ''}">
                    </td>
                    <td>
                        <input type="number" class="form-control nota-bimestral" min="0" max="10" step="0.1" value="${notaBimestral || ''}">
                    </td>
                    <td>
                        <input type="number" class="form-control nota-recuperacao" min="0" max="10" step="0.1" value="${notaRecuperacao || ''}">
                    </td>
                    <td class="media-aluno">${media !== null ? media.toFixed(1) : '-'}</td>
                    <td class="status-aluno ${status.classe}">${status.texto}</td>
                `;
                
                // Adicionar event listeners para os inputs de notas
                const inputs = linha.querySelectorAll('input');
                inputs.forEach(input => {
                    input.addEventListener('input', () => {
                        this.atualizarMediaAluno(linha);
                    });
                });
                
                // Adicionar à tabela
                this.elements.gradeNotasCorpo.appendChild(linha);
            });
            
            // Mostrar a grade
            this.elements.gradeNotasWrapper.classList.remove('d-none');
            
            this.mostrarSucesso("Alunos carregados com sucesso. Informe as notas e clique em 'Salvar Todas as Notas'.");
            
        } catch (error) {
            console.error("Erro ao carregar grade de notas:", error);
            this.mostrarErro("Não foi possível carregar a grade de notas. Tente novamente mais tarde.");
        }
    },
    
    // Salvar notas em massa
    salvarNotasEmMassa: async function() {
        const turmaId = this.elements.massaTurma.value;
        const disciplinaId = this.elements.massaDisciplina.value;
        const bimestre = this.elements.massaBimestre.value;
        const ano = this.elements.massaAno.value;
        
        // Validar novamente
        if (!turmaId || !disciplinaId || !bimestre || !ano) {
            this.mostrarErro("Todos os campos de filtro são obrigatórios.");
            return;
        }
        
        try {
            // Coletar todas as linhas da tabela
            const linhas = this.elements.gradeNotasCorpo.querySelectorAll('tr');
            let sucessos = 0;
            let falhas = 0;
            let atualizacoes = 0;
            const erros = [];
            
            // Para cada linha, tentar salvar a nota
            for (const linha of linhas) {
                const alunoId = linha.dataset.alunoId;
                const notaId = linha.dataset.notaId;
                
                const notaMensal = linha.querySelector('.nota-mensal').value;
                const notaBimestral = linha.querySelector('.nota-bimestral').value;
                const notaRecuperacao = linha.querySelector('.nota-recuperacao').value;
                
                // Verificar se pelo menos uma nota foi informada
                if (!notaMensal && !notaBimestral) {
                    // Pular este aluno se não tiver nenhuma nota
                    continue;
                }
                
                // Criar objeto com os dados da nota
                const notaDados = {
                    id_turma: turmaId,
                    id_disciplina: disciplinaId,
                    id_aluno: alunoId,
                    bimestre: parseInt(bimestre),
                    ano: parseInt(ano),
                    nota_mensal: notaMensal ? parseFloat(notaMensal) : null,
                    nota_bimestral: notaBimestral ? parseFloat(notaBimestral) : null,
                    nota_recuperacao: notaRecuperacao ? parseFloat(notaRecuperacao) : null
                };
                
                // Calcular média final
                const media = this.calcularMediaAluno(notaMensal, notaBimestral, notaRecuperacao);
                if (media !== null) {
                    notaDados.media_final = media;
                }
                
                try {
                    let response;
                    
                    if (notaId) {
                        // Atualizar nota existente
                        response = await ConfigModule.fetchApi(`/notas/${notaId}`, {
                            method: 'PUT',
                            body: JSON.stringify(notaDados)
                        });
                        atualizacoes++;
                    } else {
                        // Criar nova nota
                        response = await ConfigModule.fetchApi('/notas', {
                            method: 'POST',
                            body: JSON.stringify(notaDados)
                        });
                        
                        // Atualizar o atributo data-nota-id com o novo ID
                        if (response && response.id) {
                            linha.dataset.notaId = response.id;
                        }
                        
                        sucessos++;
                    }
                } catch (error) {
                    console.error(`Erro ao salvar nota para o aluno ${alunoId}:`, error);
                    falhas++;
                    erros.push(`Erro ao salvar nota para o aluno ${alunoId}: ${error.message || 'Erro desconhecido'}`);
                }
            }
            
            // Mostrar mensagem de resultado
            if (sucessos > 0 || atualizacoes > 0) {
                const mensagem = `Notas salvas com sucesso! ${sucessos} novas notas criadas, ${atualizacoes} notas atualizadas.`;
                this.mostrarSucesso(mensagem);
                
                // Recarregar a grade para mostrar os dados atualizados
                await this.carregarGradeNotas();
            } else if (falhas === 0) {
                this.mostrarErro("Nenhuma nota foi informada para salvar.");
            }
            
            if (falhas > 0) {
                this.mostrarErro(`${falhas} notas não puderam ser salvas. Verifique o console para mais detalhes.`);
                console.error("Erros ao salvar notas:", erros);
            }
            
        } catch (error) {
            console.error("Erro ao salvar notas em massa:", error);
            this.mostrarErro("Ocorreu um erro ao salvar as notas. Tente novamente mais tarde.");
        }
    }
};

// Exportar módulo
export default NotasModule;
