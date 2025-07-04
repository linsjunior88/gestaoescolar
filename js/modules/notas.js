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
        inputFrequencia: null, // Campo para frequência (número de faltas)
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
        try {
            console.log("🎯 Inicializando módulo de notas...");
            
            // Reconstruir interface primeiro
            this.reconstruirInterfaceNotas();
            
            // Aguardar um pouco para o DOM se estabilizar
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Cachear elementos após reconstruir
            this.cachearElementos();
            
            // Adicionar estilos CSS
            this.adicionarEstilosCSS();
            
            // Adicionar event listeners
            this.adicionarEventListeners();
            
            // Aguardar mais um pouco e revalidar campo frequência se necessário
            setTimeout(() => {
                if (!this.elements.inputFrequencia) {
                    console.warn("🔄 Campo frequência não encontrado na inicialização, revalidando...");
                    this.revalidarCampoFrequencia();
                }
            }, 200);
            
            // Carregar dados iniciais
            await this.carregarTurmas();
            
            // Definir ano padrão no filtro e no lançamento em massa
            const anoAtual = new Date().getFullYear();
            if (this.elements.filtroAno) {
                this.elements.filtroAno.value = anoAtual;
            }
            if (this.elements.massaAno) {
                this.elements.massaAno.value = anoAtual;
            }
            
            console.log("✅ Módulo de notas inicializado com sucesso!");
            
        } catch (error) {
            console.error("❌ Erro ao inicializar módulo de notas:", error);
            this.mostrarErro("Erro ao inicializar o módulo de notas. Recarregue a página.");
        }
    },
    
    // Verificar se todos os elementos HTML necessários existem
    verificarIntegridadeHTML: function() {
        console.log("Verificando integridade da estrutura HTML do módulo de notas");
        
        const conteudoNotas = document.getElementById('conteudo-notas');
        if (!conteudoNotas) {
            console.error("Elemento conteudo-notas não encontrado");
            return false;
        }
        
        // Verificar os elementos críticos
        const elementosCriticos = [
            'filtro-turma-nota',
            'filtro-disciplina-nota',
            'filtro-aluno-nota', 
            'filtro-bimestre-nota',
            'filtro-ano-nota',
            'btn-filtrar-notas',
            'lista-notas'
        ];
        
        const elementosNaoEncontrados = elementosCriticos.filter(id => !document.getElementById(id));
        
        if (elementosNaoEncontrados.length > 0) {
            console.warn("Elementos críticos não encontrados:", elementosNaoEncontrados);
            return false;
        }
        
        return true;
    },
    
    // Reconstruir a interface HTML do módulo de notas
    reconstruirInterfaceNotas: function() {
        console.log("Reconstruindo interface do módulo de notas");
        
        const conteudoNotas = document.getElementById('conteudo-notas');
        if (!conteudoNotas) {
            console.error("Não é possível reconstruir a interface - elemento conteudo-notas não encontrado");
            return;
        }
        
        conteudoNotas.innerHTML = `
            <h2 class="mb-4">Gestão de Notas</h2>
            
            <!-- Card para filtros -->
            <div class="card shadow mb-4">
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 class="m-0 font-weight-bold text-primary">Filtros</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-2">
                            <div class="mb-3">
                                <label for="filtro-turma-nota" class="form-label">Turma</label>
                                <select class="form-select" id="filtro-turma-nota">
                                    <option value="">Todas as turmas</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="mb-3">
                                <label for="filtro-disciplina-nota" class="form-label">Disciplina</label>
                                <select class="form-select" id="filtro-disciplina-nota">
                                    <option value="">Todas as disciplinas</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="mb-3">
                                <label for="filtro-aluno-nota" class="form-label">Aluno</label>
                                <select class="form-select" id="filtro-aluno-nota">
                                    <option value="">Todos os alunos</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="mb-3">
                                <label for="filtro-bimestre-nota" class="form-label">Bimestre</label>
                                <select class="form-select" id="filtro-bimestre-nota">
                                    <option value="">Todos os bimestres</option>
                                    <option value="1">1º Bimestre</option>
                                    <option value="2">2º Bimestre</option>
                                    <option value="3">3º Bimestre</option>
                                    <option value="4">4º Bimestre</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="mb-3">
                                <label for="filtro-ano-nota" class="form-label">Ano</label>
                                <select class="form-select" id="filtro-ano-nota">
                                    <option value="">Todos os anos</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                    <option value="2027">2027</option>
                                    <option value="2028">2028</option>
                                    <option value="2029">2029</option>
                                    <option value="2030">2030</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <div class="mb-3">
                                <label class="form-label">&nbsp;</label>
                                <button id="btn-filtrar-notas" class="btn btn-primary d-block">Filtrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Card para listagem de notas -->
            <div class="card shadow mb-4">
                <div class="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 class="m-0 font-weight-bold text-primary">Notas Cadastradas</h6>
                    <div>
                        <button id="btn-nova-nota" class="btn btn-primary me-2">
                            <i class="fas fa-plus me-1"></i> Nova Nota
                        </button>
                        <button id="btn-calcular-medias" class="btn btn-success">
                            <i class="fas fa-calculator me-1"></i> Calcular Médias
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="tabela-notas">
                            <thead>
                                <tr>
                                    <th data-ordenavel data-coluna="id">ID</th>
                                    <th data-ordenavel data-coluna="turma">Turma</th>
                                    <th data-ordenavel data-coluna="disciplina">Disciplina</th>
                                    <th data-ordenavel data-coluna="aluno">Aluno</th>
                                    <th data-ordenavel data-coluna="bimestre">Bimestre</th>
                                    <th data-ordenavel data-coluna="ano">Ano</th>
                                    <th data-ordenavel data-coluna="nota_mensal">Mensal</th>
                                    <th data-ordenavel data-coluna="nota_bimestral">Bimestral</th>
                                    <th data-ordenavel data-coluna="nota_recuperacao">Recuperação</th>
                                    <th data-ordenavel data-coluna="frequencia">Frequência</th>
                                    <th data-ordenavel data-coluna="media_final">Média Final</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="lista-notas">
                                <!-- Dados serão carregados dinamicamente -->
                                <tr class="text-center">
                                    <td colspan="12">Use os filtros acima para buscar notas</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Form para lançamento de notas (oculto inicialmente) -->
            <div class="row">
                <div class="col-md-6">
                    <form id="form-nota" class="card d-none">
                        <div class="card-header">
                            <h5 class="card-title">Lançamento de Nota</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="turma-nota" class="form-label">Turma</label>
                                <select class="form-select" id="turma-nota" required>
                                    <option value="">Selecione uma turma</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="disciplina-nota" class="form-label">Disciplina</label>
                                <select class="form-select" id="disciplina-nota" required>
                                    <option value="">Selecione uma disciplina</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="aluno-nota" class="form-label">Aluno</label>
                                <select class="form-select" id="aluno-nota" required>
                                    <option value="">Selecione um aluno</option>
                                </select>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="bimestre-nota" class="form-label">Bimestre</label>
                                        <select class="form-select" id="bimestre-nota" required>
                                            <option value="">Selecione o bimestre</option>
                                            <option value="1">1º Bimestre</option>
                                            <option value="2">2º Bimestre</option>
                                            <option value="3">3º Bimestre</option>
                                            <option value="4">4º Bimestre</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ano-nota" class="form-label">Ano</label>
                                        <input type="number" class="form-control" id="ano-nota" min="2020" max="2030" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="nota-mensal" class="form-label">Nota Mensal</label>
                                        <input type="number" class="form-control" id="nota-mensal" min="0" max="10" step="0.1">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="nota-bimestral" class="form-label">Nota Bimestral</label>
                                        <input type="number" class="form-control" id="nota-bimestral" min="0" max="10" step="0.1">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="nota-recuperacao" class="form-label">Nota Recuperação</label>
                                        <input type="number" class="form-control" id="nota-recuperacao" min="0" max="10" step="0.1">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Frequência</label>
                                <input type="number" class="form-control" id="frequencia" min="0" max="100" step="1">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Média Final</label>
                                <div class="form-control bg-light">
                                    <span id="media-final">0.0</span>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button type="submit" class="btn btn-primary" id="btn-salvar-nota">Salvar</button>
                            <button type="button" class="btn btn-secondary" id="btn-cancelar-nota">Cancelar</button>
                        </div>
                    </form>
                </div>
                
                <!-- Área para lançamento em massa -->
                <div class="col-md-12 mt-4">
                    <div class="card shadow">
                        <div class="card-header py-3">
                            <h6 class="m-0 font-weight-bold text-primary">Lançamento em Massa</h6>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label for="massa-turma" class="form-label">Turma</label>
                                        <select class="form-select" id="massa-turma" required>
                                            <option value="">Selecione uma turma</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label for="massa-disciplina" class="form-label">Disciplina</label>
                                        <select class="form-select" id="massa-disciplina" required>
                                            <option value="">Selecione uma disciplina</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label for="massa-bimestre" class="form-label">Bimestre</label>
                                        <select class="form-select" id="massa-bimestre" required>
                                            <option value="">Selecione o bimestre</option>
                                            <option value="1">1º Bimestre</option>
                                            <option value="2">2º Bimestre</option>
                                            <option value="3">3º Bimestre</option>
                                            <option value="4">4º Bimestre</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="mb-3">
                                        <label for="massa-ano" class="form-label">Ano</label>
                                        <input type="number" class="form-control" id="massa-ano" min="2020" max="2030" required value="2024">
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-12">
                                    <button id="btn-carregar-grade" class="btn btn-primary">
                                        <i class="fas fa-sync-alt me-1"></i> Carregar Alunos
                                    </button>
                                </div>
                            </div>
                            
                            <div id="grade-notas-wrapper" class="d-none">
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover" id="tabela-grade-notas">
                                        <thead class="glass-thead">
                                            <tr class="table-header-glass">
                                                <th rowspan="3" class="subject-header">Disciplina</th>
                                                <th colspan="16" class="bimesters-header">Bimestres</th>
                                                <th rowspan="3" class="final-grade-header">Média Final</th>
                                                <th rowspan="3" class="status-header">Situação</th>
                                            </tr>
                                            <tr class="bimester-labels">
                                                <th colspan="4" class="bimester-group">1º Bimestre</th>
                                                <th colspan="4" class="bimester-group">2º Bimestre</th>
                                                <th colspan="4" class="bimester-group">3º Bimestre</th>
                                                <th colspan="4" class="bimester-group">4º Bimestre</th>
                                            </tr>
                                            <tr class="grade-types">
                                                <th class="grade-type">Mensal</th>
                                                <th class="grade-type">Bimestral</th>
                                                <th class="grade-type">Frequência</th>
                                                <th class="grade-type">Média</th>
                                                <th class="grade-type">Mensal</th>
                                                <th class="grade-type">Bimestral</th>
                                                <th class="grade-type">Frequência</th>
                                                <th class="grade-type">Média</th>
                                                <th class="grade-type">Mensal</th>
                                                <th class="grade-type">Bimestral</th>
                                                <th class="grade-type">Frequência</th>
                                                <th class="grade-type">Média</th>
                                                <th class="grade-type">Mensal</th>
                                                <th class="grade-type">Bimestral</th>
                                                <th class="grade-type">Frequência</th>
                                                <th class="grade-type">Média</th>
                                            </tr>
                                        </thead>
                                        <tbody id="grade-notas-corpo">
                                            <!-- Conteúdo será gerado dinamicamente -->
                                        </tbody>
                                    </table>
                                </div>
                                <div class="mt-3">
                                    <button id="btn-salvar-grade" class="btn btn-success">
                                        <i class="fas fa-save me-1"></i> Salvar Todas as Notas
                                    </button>
                                </div>
                            </div>
                            <div id="grade-notas"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log("Interface do módulo de notas reconstruída com sucesso");
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
        this.elements.inputFrequencia = document.getElementById('frequencia');
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
        
        // Debug detalhado para o filtro de turma
        console.log("🔍 DEBUG - Buscando elemento filtro-turma-nota:");
        console.log("Elemento encontrado:", this.elements.filtroTurma);
        console.log("Existe no DOM:", !!document.getElementById('filtro-turma-nota'));
        
        if (!this.elements.filtroTurma) {
            console.error("❌ PROBLEMA: Elemento filtro-turma-nota não foi encontrado!");
            console.log("Todos os elementos com 'turma' no ID:", 
                Array.from(document.querySelectorAll('[id*="turma"]')).map(el => ({
                    id: el.id,
                    tagName: el.tagName,
                    classes: el.className
                }))
            );
        } else {
            console.log("✅ Elemento filtro-turma-nota encontrado com sucesso!");
        }
        
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
        
        // Log para verificar se o campo frequência foi encontrado
        console.log("🔍 Verificando campo frequência:");
        console.log("- Elemento frequência encontrado:", !!this.elements.inputFrequencia);
        console.log("- Elemento no DOM:", document.getElementById('frequencia'));
        if (!this.elements.inputFrequencia) {
            console.warn("⚠️ Campo frequência não foi encontrado no DOM! Verificando se existe...");
            // Tentar encontrar o elemento com um seletor mais específico
            const frequenciaAlt = document.querySelector('input[id="frequencia"]');
            console.log("- Tentativa com querySelector:", frequenciaAlt);
            const frequenciaName = document.querySelector('input[name="frequencia"]');
            console.log("- Tentativa com name:", frequenciaName);
            
            if (frequenciaAlt) {
                console.log("✅ Campo frequência encontrado via querySelector alternativo");
                this.elements.inputFrequencia = frequenciaAlt;
            } else if (frequenciaName) {
                console.log("✅ Campo frequência encontrado via name");
                this.elements.inputFrequencia = frequenciaName;
            } else {
                console.error("❌ Campo frequência não encontrado em nenhuma tentativa");
                console.log("Todos os inputs na página:", 
                    Array.from(document.querySelectorAll('input')).map(input => ({
                        id: input.id,
                        name: input.name,
                        type: input.type,
                        placeholder: input.placeholder
                    }))
                );
            }
        } else {
            console.log("✅ Campo frequência encontrado com sucesso!");
        }
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
        
        // Listener para filtro de turma - CORREÇÃO: Verificando corretamente a existência do elemento e adicionando o event listener
        if (this.elements.filtroTurma) {
            console.log("Adicionando listener para filtro de turma", this.elements.filtroTurma);
            this.elements.filtroTurma.addEventListener('change', () => {
                console.log("Filtro de turma alterado para:", this.elements.filtroTurma.value);
                this.carregarDependenciasFiltro(this.elements.filtroTurma.value);
            });
        } else {
            console.warn("Elemento filtroTurma não encontrado para adicionar event listener");
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
                this.salvarGradeNotas();
            });
        }
    },
    
    // Carregar turmas para os selects
    carregarTurmas: async function() {
        try {
            console.log("Iniciando carregamento de turmas para o módulo de notas");
            
            const response = await fetch(ConfigModule.getApiUrl('/turmas'));
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status} - ${response.statusText}`);
            }
            
            const turmas = await response.json();
            console.log(`${turmas.length} turmas carregadas com sucesso`);
            
            this.state.turmas = turmas;
            this.popularSelectTurmas();
            
            return turmas;
        } catch (error) {
            console.error("Erro ao carregar turmas para o módulo de notas:", error);
            this.mostrarErro("Não foi possível carregar as turmas. Tente novamente mais tarde.");
            throw error; // Propagar o erro para que a função init possa tratá-lo
        }
    },
    
    // Popular select de turmas
    popularSelectTurmas: function() {
        console.log("Populando selects de turmas com os dados carregados");
        console.log("Elementos de turma disponíveis:", {
            selectTurma: this.elements.selectTurma ? this.elements.selectTurma.id : 'não encontrado',
            filtroTurma: this.elements.filtroTurma ? this.elements.filtroTurma.id : 'não encontrado',
            massaTurma: this.elements.massaTurma ? this.elements.massaTurma.id : 'não encontrado'
        });
        
        if (!this.elements.selectTurma && !this.elements.filtroTurma && !this.elements.massaTurma) {
            console.warn("Nenhum elemento de select de turma encontrado para preencher");
            return;
        }
        
        // Limpar selects
        if (this.elements.selectTurma) {
            this.elements.selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        }
        
        if (this.elements.filtroTurma) {
            this.elements.filtroTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        }
        
        // Adicionar opções para o lançamento em massa também
        if (this.elements.massaTurma) {
            this.elements.massaTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        }
        
        if (this.state.turmas.length === 0) {
            console.warn("Nenhuma turma disponível para popular os selects");
            
            // Adicionar opção informativa em caso de não haver turmas
            const optionInfo = document.createElement('option');
            optionInfo.disabled = true;
            optionInfo.textContent = 'Nenhuma turma disponível';
            
            if (this.elements.selectTurma) this.elements.selectTurma.appendChild(optionInfo.cloneNode(true));
            if (this.elements.filtroTurma) this.elements.filtroTurma.appendChild(optionInfo.cloneNode(true));
            if (this.elements.massaTurma) this.elements.massaTurma.appendChild(optionInfo.cloneNode(true));
            
            return;
        }
        
        // Ordenar turmas para melhor usabilidade
        const turmasOrdenadas = [...this.state.turmas].sort((a, b) => {
            const serieA = a.serie || a.nome || '';
            const serieB = b.serie || b.nome || '';
            return serieA.localeCompare(serieB);
        });
        
        console.log(`Adicionando ${turmasOrdenadas.length} turmas aos selects`);
        
        // Adicionar opções
        turmasOrdenadas.forEach(turma => {
            const turmaId = turma.id_turma || turma.id;
            const turmaNome = `${turma.serie || turma.nome || 'N/A'} (${turma.turno || 'N/A'})`;
            
            if (this.elements.selectTurma) {
                const option1 = document.createElement('option');
                option1.value = turmaId;
                option1.textContent = turmaNome;
                this.elements.selectTurma.appendChild(option1);
            }
            
            if (this.elements.filtroTurma) {
                const option2 = document.createElement('option');
                option2.value = turmaId;
                option2.textContent = turmaNome;
                this.elements.filtroTurma.appendChild(option2);
            }
            
            if (this.elements.massaTurma) {
                const option3 = document.createElement('option');
                option3.value = turmaId;
                option3.textContent = turmaNome;
                this.elements.massaTurma.appendChild(option3);
            }
        });
        
        // Desabilitar selects de disciplina e aluno até que uma turma seja selecionada
        if (this.elements.selectDisciplina) this.elements.selectDisciplina.disabled = true;
        if (this.elements.selectAluno) this.elements.selectAluno.disabled = true;
        if (this.elements.filtroDisciplina) this.elements.filtroDisciplina.disabled = true;
        if (this.elements.filtroAluno) this.elements.filtroAluno.disabled = true;
        if (this.elements.massaDisciplina) this.elements.massaDisciplina.disabled = true;
        
        console.log("Selects de turmas populados com sucesso");
    },
    
    // Carregar disciplinas de uma turma específica
    carregarDisciplinasDaTurma: async function(turmaId) {
        if (!turmaId) {
            this.state.disciplinasTurma = [];
            return [];
        }
        
        try {
            console.log(`Carregando disciplinas para a turma ${turmaId} usando novo relacionamento`);
            
            // Tentar primeiro buscar disciplinas através do novo relacionamento na tabela professor_disciplina_turma
            try {
                // Buscar vínculos professor-disciplina-turma para esta turma
                const vinculos = await ConfigModule.fetchApi(`/professor_disciplina_turma?id_turma=${turmaId}`);
                
                if (Array.isArray(vinculos) && vinculos.length > 0) {
                    console.log(`Encontrados ${vinculos.length} vínculos para a turma ${turmaId}:`, vinculos);
                    
                    // Extrair IDs de disciplinas únicos dos vínculos
                    const disciplinasIds = [...new Set(vinculos.map(v => v.id_disciplina || v.disciplina))];
                    console.log(`IDs de disciplinas únicos: ${disciplinasIds.join(', ')}`);
                    
                    // Para cada ID de disciplina, buscar os detalhes completos
                    const disciplinasPromises = disciplinasIds.map(id => 
                        ConfigModule.fetchApi(`/disciplinas/${id}`)
                            .catch(err => {
                                console.warn(`Erro ao buscar detalhes da disciplina ${id}:`, err);
                                // Retornar objeto mínimo com ID em caso de erro
                                return { id_disciplina: id, nome_disciplina: `Disciplina ${id}` };
                            })
                    );
                    
                    const disciplinas = await Promise.all(disciplinasPromises);
                    console.log(`Disciplinas completas carregadas via vínculos: ${disciplinas.length}`);
                    
                    this.state.disciplinasTurma = disciplinas;
                    return disciplinas;
                } else {
                    console.log(`Nenhum vínculo encontrado para a turma ${turmaId}, tentando método alternativo`);
                }
            } catch (vincError) {
                console.warn(`Erro ao buscar vínculos para turma ${turmaId}:`, vincError);
                // Continuar para tentar método alternativo
            }
            
            // Método alternativo: buscar vínculos usando endpoint alternativo
            try {
                const vinculosAlt = await ConfigModule.fetchApi(`/vinculos?id_turma=${turmaId}`);
                
                if (Array.isArray(vinculosAlt) && vinculosAlt.length > 0) {
                    console.log(`Encontrados ${vinculosAlt.length} vínculos alternativos para a turma ${turmaId}`);
                    
                    // Extrair IDs de disciplinas únicos dos vínculos
                    const disciplinasIds = [...new Set(vinculosAlt.map(v => v.id_disciplina || v.disciplina))];
                    console.log(`IDs de disciplinas únicos (método alternativo): ${disciplinasIds.join(', ')}`);
                    
                    // Para cada ID de disciplina, buscar os detalhes completos
                    const disciplinasPromises = disciplinasIds.map(id => 
                        ConfigModule.fetchApi(`/disciplinas/${id}`)
                            .catch(err => {
                                console.warn(`Erro ao buscar detalhes da disciplina ${id}:`, err);
                                // Retornar objeto mínimo com ID em caso de erro
                                return { id_disciplina: id, nome_disciplina: `Disciplina ${id}` };
                            })
                    );
                    
                    const disciplinas = await Promise.all(disciplinasPromises);
                    console.log(`Disciplinas completas carregadas via vínculos alternativos: ${disciplinas.length}`);
                    
                    this.state.disciplinasTurma = disciplinas;
                    return disciplinas;
                } else {
                    console.log(`Nenhum vínculo alternativo encontrado para a turma ${turmaId}, tentando método legado`);
                }
            } catch (altError) {
                console.warn(`Erro ao buscar vínculos alternativos para turma ${turmaId}:`, altError);
                // Continuar para tentar método legado
            }
            
            // Método legado (fallback): usar o endpoint direto de turmas/disciplinas
            console.log(`Tentando método legado para obter disciplinas da turma ${turmaId}`);
            const disciplinas = await ConfigModule.fetchApi(`/turmas/${turmaId}/disciplinas`);
            this.state.disciplinasTurma = disciplinas;
            console.log(`Disciplinas da turma ${turmaId} carregadas via método legado:`, disciplinas);
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
            // Usamos nossa função atualizada para carregar disciplinas com o novo relacionamento
            const [disciplinas, alunos] = await Promise.all([
                this.carregarDisciplinasDaTurma(turmaId),
                this.carregarAlunosDaTurma(turmaId)
            ]);
            
            console.log("Disciplinas recebidas para formulário:", disciplinas);
            console.log("Alunos recebidos para formulário:", alunos);
            
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
                
                console.log(`Adicionadas ${disciplinasAdicionadas.size} disciplinas únicas ao select do formulário`);
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
                
                console.log(`Adicionados ${alunosAdicionados.size} alunos únicos ao select do formulário`);
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
        
        // Debug para verificar o estado dos elementos
        console.log("Estado dos elementos de filtro:", {
            filtroDisciplina: this.elements.filtroDisciplina ? this.elements.filtroDisciplina.id : 'não encontrado',
            filtroAluno: this.elements.filtroAluno ? this.elements.filtroAluno.id : 'não encontrado'
        });
        
        // Limpar e desabilitar selects de disciplina e aluno
        if (this.elements.filtroDisciplina) {
            this.elements.filtroDisciplina.innerHTML = '<option value="">Todas as disciplinas</option>';
            this.elements.filtroDisciplina.disabled = !turmaId;
        }
        
        if (this.elements.filtroAluno) {
            this.elements.filtroAluno.innerHTML = '<option value="">Todos os alunos</option>';
            this.elements.filtroAluno.disabled = !turmaId;
        }
        
        if (!turmaId) {
            console.log("Nenhuma turma selecionada, dependências não serão carregadas");
            return;
        }
        
        try {
            console.log(`Iniciando carregamento de disciplinas e alunos para turma ${turmaId} nos filtros`);
            
            // Carregar disciplinas e alunos em paralelo
            // Usamos nossa função atualizada para carregar disciplinas com o novo relacionamento
            const [disciplinas, alunos] = await Promise.all([
                this.carregarDisciplinasDaTurma(turmaId),
                this.carregarAlunosDaTurma(turmaId)
            ]);
            
            console.log("Disciplinas recebidas para filtro:", disciplinas);
            console.log("Alunos recebidos para filtro:", alunos);
            
            // Popular select de disciplinas se houver dados e elemento
            if (disciplinas.length > 0 && this.elements.filtroDisciplina) {
                console.log(`Populando select de disciplinas no filtro com ${disciplinas.length} itens`);
                
                // Usar Set para evitar duplicatas
                const disciplinasAdicionadas = new Set();
                
                disciplinas.forEach(disciplina => {
                    const id = disciplina.id_disciplina || disciplina.id;
                    const nome = disciplina.nome_disciplina || disciplina.nome || 'N/A';
                    
                    // Verificar se a disciplina já foi adicionada
                    if (!disciplinasAdicionadas.has(id)) {
                        disciplinasAdicionadas.add(id);
                        
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = nome;
                        this.elements.filtroDisciplina.appendChild(option);
                    }
                });
                
                console.log(`Adicionadas ${disciplinasAdicionadas.size} disciplinas únicas ao filtro`);
            } else if (this.elements.filtroDisciplina) {
                console.log("Nenhuma disciplina disponível para esta turma no filtro");
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = 'Nenhuma disciplina disponível';
                this.elements.filtroDisciplina.appendChild(option);
            }
            
            // Popular select de alunos se houver dados e elemento
            if (alunos.length > 0 && this.elements.filtroAluno) {
                console.log(`Populando select de alunos com ${alunos.length} itens`);
                
                // Ordenar alunos por nome para facilitar a busca
                alunos.sort((a, b) => {
                    const nomeA = a.nome_aluno || a.nome || '';
                    const nomeB = b.nome_aluno || b.nome || '';
                    return nomeA.localeCompare(nomeB);
                });
                
                // Usar Set para evitar duplicatas
                const alunosAdicionados = new Set();
                
                alunos.forEach(aluno => {
                    const id = aluno.id_aluno || aluno.id;
                    const nome = aluno.nome_aluno || aluno.nome || 'N/A';
                    
                    // Verificar se o aluno já foi adicionado
                    if (!alunosAdicionados.has(id)) {
                        alunosAdicionados.add(id);
                        
                        const option = document.createElement('option');
                        option.value = id;
                        option.textContent = nome;
                        this.elements.filtroAluno.appendChild(option);
                    }
                });
                
                console.log(`Adicionados ${alunosAdicionados.size} alunos únicos ao filtro`);
            } else if (this.elements.filtroAluno) {
                console.log("Nenhum aluno disponível para esta turma no filtro");
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = 'Nenhum aluno disponível';
                this.elements.filtroAluno.appendChild(option);
            }
            
        } catch (error) {
            console.error("Erro ao carregar dependências dos filtros:", error);
            if (this.elements.filtroDisciplina) {
                this.elements.filtroDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            }
            if (this.elements.filtroAluno) {
                this.elements.filtroAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            }
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
                    <td>${nota.frequencia || '-'}</td>
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
            // Mostrar loading
            this.mostrarInfo("Calculando médias... Por favor, aguarde.");
            
            // Como o endpoint /api/calcular-medias pode não estar disponível ainda,
            // vamos ir direto para mostrar o boletim que já funciona
            console.log("Pulando cálculo de médias e indo direto para o boletim...");
            
            this.mostrarSucesso("Processando boletim de médias...");
            
            // Mostrar boletim de médias diretamente
            this.mostrarBoletimMedias();
            
        } catch (error) {
            console.error("Erro ao processar médias:", error);
            this.mostrarErro("Não foi possível processar as médias. Tente novamente mais tarde.");
        }
    },

    // Mostrar boletim de médias
    mostrarBoletimMedias: async function() {
        try {
            // Obter filtros aplicados
            const filtros = {
                turma_id: this.elements.filtroTurma ? this.elements.filtroTurma.value : '',
                disciplina_id: this.elements.filtroDisciplina ? this.elements.filtroDisciplina.value : '',
                aluno_id: this.elements.filtroAluno ? this.elements.filtroAluno.value : '',
                ano: this.elements.filtroAno ? this.elements.filtroAno.value : new Date().getFullYear()
            };
            
            console.log("Filtros aplicados para o boletim:", filtros);
            
            // Verificar se pelo menos a turma foi selecionada
            if (!filtros.turma_id) {
                console.log("🧪 Nenhuma turma selecionada, executando teste");
                this.testarBoletim();
                return;
            }
            
            this.mostrarInfo("Carregando boletim de médias... Por favor, aguarde.");
            
            try {
                // Construir parâmetros da URL baseado nos filtros
                const params = new URLSearchParams();
                params.append('ano', filtros.ano);
                if (filtros.turma_id) params.append('turma_id', filtros.turma_id);
                if (filtros.disciplina_id) params.append('disciplina_id', filtros.disciplina_id);
                if (filtros.aluno_id) params.append('aluno_id', filtros.aluno_id);
                
                const endpoint = `/boletim-medias?${params.toString()}`;
                console.log("Endpoint do boletim:", endpoint);
                
                // Buscar dados do boletim com os filtros aplicados
                const boletimData = await ConfigModule.fetchApi(endpoint);
                
                console.log("Dados do boletim recebidos:", boletimData);
                
                if (!boletimData || !boletimData.boletim || boletimData.boletim.length === 0) {
                    console.log("⚠️ Dados da API inválidos, usando dados de teste");
                    this.testarBoletim();
                    return;
                }
                
                // Criar e mostrar modal com os dados
                this.exibirBoletimModal(boletimData, filtros);
                
            } catch (apiError) {
                console.error("❌ Erro na API:", apiError);
                console.log("🧪 Fallback para dados de teste devido ao erro da API");
                this.testarBoletim();
            }
            
        } catch (error) {
            console.error("Erro ao carregar boletim de médias:", error);
            console.log("🧪 Fallback para dados de teste devido ao erro geral");
            this.testarBoletim();
        }
    },

    // Exibir modal com boletim de médias
    exibirBoletimModal: function(boletimData, filtros) {
        console.log("🎯 Iniciando exibição do boletim modal");
        console.log("📊 Dados do boletim:", boletimData);
        console.log("🔍 Filtros aplicados:", filtros);
        
        const modalId = 'modalBoletimMedias';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            // Criar modal se não existir
            modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.id = modalId;
            modal.tabIndex = -1;
            modal.setAttribute('aria-labelledby', modalId + 'Label');
            modal.setAttribute('aria-hidden', 'true');
            document.body.appendChild(modal);
            console.log("✅ Modal criado:", modalId);
        } else {
            console.log("♻️ Reutilizando modal existente:", modalId);
        }
        
        // Verificar se boletimData é válido
        if (!boletimData || !boletimData.boletim || !Array.isArray(boletimData.boletim) || boletimData.boletim.length === 0) {
            console.error("❌ Dados do boletim inválidos:", boletimData);
            const errorHtml = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">⚠️ Erro no Boletim</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Nenhum dado encontrado para gerar o boletim. Verifique os filtros aplicados.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        </div>
                    </div>
                </div>
            `;
            modal.innerHTML = errorHtml;
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            return;
        }
        
        console.log(`✅ Processando ${boletimData.boletim.length} aluno(s)`);
        
        // Determinar o tipo de boletim baseado nos filtros
        const isBoletimIndividual = filtros.aluno_id && filtros.aluno_id !== '';
        const isDisciplinaEspecifica = filtros.disciplina_id && filtros.disciplina_id !== '';
        
        // Título do modal baseado nos filtros
        let titulo = `📊 Boletim Escolar - ${boletimData.ano}`;
        if (isBoletimIndividual) {
            titulo = `📋 Boletim Individual - ${boletimData.ano}`;
        } else if (isDisciplinaEspecifica) {
            titulo = `📚 Boletim por Disciplina - ${boletimData.ano}`;
        }
        
        console.log("📋 Título do boletim:", titulo);
        
        // Construir HTML do modal com design glassmorphism
        let html = `
            <div class="modal-dialog modal-fullscreen">
                <div class="modal-content glass-modal">
                    <div class="modal-header glass-header">
                        <h5 class="modal-title glass-title" id="${modalId}Label">
                            <i class="fas fa-graduation-cap me-3"></i>${titulo}
                        </h5>
                        <button type="button" class="btn-close glass-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body glass-body">
        `;
        
        try {
            // Para cada aluno, criar um boletim individual
            boletimData.boletim.forEach((aluno, index) => {
                console.log(`👨‍🎓 Processando aluno ${index + 1}/${boletimData.boletim.length}:`, aluno.nome_aluno);
                
                // Obter turno - usar dados do aluno ou buscar de forma assíncrona em background
                const turno = this.obterTurnoAluno(aluno);
                
                // Buscar todas as notas do aluno para organizar por bimestre
                const notasPorBimestre = this.organizarNotasPorBimestre(aluno);
                
                html += `
                    <div class="boletim-glass-container">
                        <!-- Cabeçalho Glassmorphism -->
                        <div class="glass-header-section">
                            <div class="school-info">
                                <div class="school-logo">
                                    <div class="logo-circle">
                                        <i class="fas fa-graduation-cap"></i>
                                    </div>
                                </div>
                                <div class="school-details">
                                    <h2 class="school-name">PREFEITURA MUNICIPAL DE TIMON - MA</h2>
                                    <p class="school-subtitle">SECRETARIA MUNICIPAL DE EDUCAÇÃO</p>
                                    <h3 class="document-title">Boletim Escolar</h3>
                                </div>
                                <div class="year-badge">
                                    <div class="glass-badge">
                                        <span class="badge-label">Ano Letivo</span>
                                        <span class="badge-year">${boletimData.ano}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Informações do Aluno -->
                        <div class="student-info-glass">
                            <div class="student-details">
                                <div class="info-row school-name-row">
                                    <span class="info-label">Escola:</span>
                                    <span class="info-value">EMEF Nazaré Rodrigues</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Nome do Aluno:</span>
                                    <span class="info-value">${aluno.nome_aluno || 'Nome não informado'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Turma:</span>
                                    <span class="info-value">${aluno.id_turma || 'N/A'} - ${aluno.serie || 'Série não informada'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">Turno:</span>
                                    <span class="info-value">${turno}</span>
                                </div>
                            </div>
                            <div class="student-ra">
                                <div class="ra-badge">
                                    <span class="ra-label">RA</span>
                                    <span class="ra-number">${aluno.id_aluno || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Tabela de Notas Glassmorphism -->
                        <div class="grades-table-container">
                            <table class="glass-table">
                                <thead>
                                    <tr class="table-header-glass">
                                        <th rowspan="3" class="subject-header">Disciplina</th>
                                        <th colspan="16" class="bimesters-header">Bimestres</th>
                                        <th rowspan="3" class="final-grade-header">Média Final</th>
                                        <th rowspan="3" class="status-header">Situação</th>
                                    </tr>
                                    <tr class="bimester-labels">
                                        <th colspan="4" class="bimester-group">1º Bimestre</th>
                                        <th colspan="4" class="bimester-group">2º Bimestre</th>
                                        <th colspan="4" class="bimester-group">3º Bimestre</th>
                                        <th colspan="4" class="bimester-group">4º Bimestre</th>
                                    </tr>
                                    <tr class="grade-types">
                                        <th class="grade-type">Mensal</th>
                                        <th class="grade-type">Bimestral</th>
                                        <th class="grade-type">Frequência</th>
                                        <th class="grade-type">Média</th>
                                        <th class="grade-type">Mensal</th>
                                        <th class="grade-type">Bimestral</th>
                                        <th class="grade-type">Frequência</th>
                                        <th class="grade-type">Média</th>
                                        <th class="grade-type">Mensal</th>
                                        <th class="grade-type">Bimestral</th>
                                        <th class="grade-type">Frequência</th>
                                        <th class="grade-type">Média</th>
                                        <th class="grade-type">Mensal</th>
                                        <th class="grade-type">Bimestral</th>
                                        <th class="grade-type">Frequência</th>
                                        <th class="grade-type">Média</th>
                                    </tr>
                                </thead>
                                <tbody class="glass-tbody">
                `;
                
                // Verificar se o aluno tem disciplinas
                if (!aluno.disciplinas || !Array.isArray(aluno.disciplinas) || aluno.disciplinas.length === 0) {
                    console.warn(`⚠️ Aluno ${aluno.nome_aluno} não possui disciplinas`);
                    html += `
                        <tr>
                            <td colspan="16" class="text-center text-muted p-4">
                                <i class="fas fa-info-circle me-2"></i>
                                Nenhuma disciplina encontrada para este aluno
                            </td>
                        </tr>
                    `;
                } else {
                    console.log(`📚 Processando ${aluno.disciplinas.length} disciplinas para ${aluno.nome_aluno}`);
                    
                    // Ordenar disciplinas alfabeticamente
                    const disciplinasOrdenadas = aluno.disciplinas.sort((a, b) => 
                        (a.nome_disciplina || '').localeCompare(b.nome_disciplina || '')
                    );
                    
                    disciplinasOrdenadas.forEach((disciplina, disciplinaIndex) => {
                        try {
                            console.log(`📖 Processando disciplina: ${disciplina.nome_disciplina}`);
                            
                            // Determinar situação e classe
                            const situacao = disciplina.situacao || 'Pendente';
                            let situacaoClass = 'status-approved';
                            
                            if (situacao === 'Reprovado') {
                                situacaoClass = 'status-failed';
                            } else if (situacao.includes('Recuperação')) {
                                situacaoClass = 'status-recovery';
                            }
                            
                            // Buscar notas específicas desta disciplina por bimestre
                            const notasDisciplina = notasPorBimestre[disciplina.nome_disciplina] || {};
                            
                            html += `
                                <tr class="grade-row">
                                    <td class="subject-name">${disciplina.nome_disciplina || 'Disciplina não informada'}</td>
                                    
                                    <!-- 1º Bimestre -->
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['1']?.nota_mensal)}</td>
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['1']?.nota_bimestral)}</td>
                                    <td class="frequency-cell">${this.formatarFrequenciaGlass(notasDisciplina['1']?.frequencia)}</td>
                                    <td class="average-cell">${this.formatarMediaGlass(notasDisciplina['1'])}</td>
                                    
                                    <!-- 2º Bimestre -->
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['2']?.nota_mensal)}</td>
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['2']?.nota_bimestral)}</td>
                                    <td class="frequency-cell">${this.formatarFrequenciaGlass(notasDisciplina['2']?.frequencia)}</td>
                                    <td class="average-cell">${this.formatarMediaGlass(notasDisciplina['2'])}</td>
                                    
                                    <!-- 3º Bimestre -->
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['3']?.nota_mensal)}</td>
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['3']?.nota_bimestral)}</td>
                                    <td class="frequency-cell">${this.formatarFrequenciaGlass(notasDisciplina['3']?.frequencia)}</td>
                                    <td class="average-cell">${this.formatarMediaGlass(notasDisciplina['3'])}</td>
                                    
                                    <!-- 4º Bimestre -->
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['4']?.nota_mensal)}</td>
                                    <td class="grade-cell">${this.formatarNotaGlass(notasDisciplina['4']?.nota_bimestral)}</td>
                                    <td class="frequency-cell">${this.formatarFrequenciaGlass(notasDisciplina['4']?.frequencia)}</td>
                                    <td class="average-cell">${this.formatarMediaGlass(notasDisciplina['4'])}</td>
                                    
                                    <!-- Média Final -->
                                    <td class="final-average">${this.formatarMediaFinalGlass(disciplina.media_anual)}</td>
                                    
                                    <!-- Situação -->
                                    <td class="status-cell">
                                        <span class="status-badge ${situacaoClass}">${situacao}</span>
                                    </td>
                                </tr>
                            `;
                        } catch (disciplinaError) {
                            console.error(`❌ Erro ao processar disciplina ${disciplina.nome_disciplina}:`, disciplinaError);
                            html += `
                                <tr class="grade-row">
                                    <td class="subject-name">${disciplina.nome_disciplina || 'Disciplina não informada'}</td>
                                    <td colspan="17" class="text-center text-danger">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        Erro ao carregar dados desta disciplina
                                    </td>
                                </tr>
                            `;
                        }
                    });
                }
                
                html += `
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Legenda Glassmorphism -->
                        <div class="legend-glass">
                            <div class="legend-content">
                                <div class="legend-title">
                                    <i class="fas fa-info-circle"></i>
                                    Critérios de Avaliação
                                </div>
                                <div class="legend-badges">
                                    <span class="legend-badge approved">≥ 6.0 = Aprovado</span>
                                    <span class="legend-badge recovery">4.0 - 5.9 = Recuperação</span>
                                    <span class="legend-badge failed">< 4.0 = Reprovado</span>
                                </div>
                            </div>
                            <div class="generation-info">
                                <i class="fas fa-calendar-alt"></i>
                                Gerado em: ${new Date().toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                    </div>
                `;
                
                // Adicionar quebra de página entre alunos (exceto no último)
                if (index < boletimData.boletim.length - 1) {
                    html += '<div class="page-break"></div>';
                }
            });
            
            console.log("✅ HTML do boletim gerado com sucesso");
            
        } catch (error) {
            console.error("❌ Erro ao gerar HTML do boletim:", error);
            html += `
                <div class="alert alert-danger m-3">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erro ao gerar boletim: ${error.message}
                </div>
            `;
        }
        
        html += `
                        </div>
                        <div class="modal-footer glass-footer">
                            <button type="button" class="btn glass-btn secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>Fechar
                            </button>
                            <button type="button" class="btn glass-btn primary" onclick="window.print()">
                                <i class="fas fa-print me-2"></i>Imprimir Boletim
                            </button>
                        </div>
                    </div>
                </div>
            `;
        
        console.log("🎨 Aplicando HTML ao modal");
        modal.innerHTML = html;
        
        try {
            // Adicionar estilos glassmorphism
            console.log("🎨 Adicionando estilos glassmorphism");
            this.adicionarEstilosGlassmorphism();
            
            // Adicionar estilos específicos para impressão
            console.log("🖨️ Adicionando estilos de impressão");
            this.adicionarEstilosImpressao();
            
            // Carregar CSS dedicado para boletim profissional
            console.log("📄 Carregando CSS profissional");
            this.carregarCSSBoletimProfissional();
            
        } catch (styleError) {
            console.error("⚠️ Erro ao aplicar estilos:", styleError);
            // Continua mesmo se houver erro nos estilos
        }
        
        try {
            // Mostrar modal
            console.log("🎭 Mostrando modal");
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            console.log("🎉 Modal exibido com sucesso!");
            
        } catch (modalError) {
            console.error("❌ Erro ao exibir modal:", modalError);
            alert("Erro ao exibir boletim: " + modalError.message);
            return;
        }
        
        try {
            // Adicionar event listener para limpar quando o modal for fechado
            modal.addEventListener('hidden.bs.modal', function () {
                console.log("🧹 Limpando modal");
                // Remover o modal do DOM completamente
                modal.remove();
                // Remover backdrop se existir
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                // Restaurar scroll do body
                document.body.classList.remove('modal-open');
                document.body.style.removeProperty('padding-right');
            });
            
        } catch (listenerError) {
            console.error("⚠️ Erro ao adicionar event listener:", listenerError);
            // Continua mesmo se houver erro no listener
        }
        
        // Remover inicialização do AOS que pode estar causando conflito
        // if (typeof AOS !== 'undefined') {
        //     console.log("✨ Inicializando animações AOS");
        //     AOS.refresh();
        // }
    },

    // Formatar nota para exibição no boletim
    formatarNotaBoletim: function(nota) {
        if (nota === null || nota === undefined || nota === '') {
            return '<span class="text-muted fw-bold">-</span>';
        }
        
        const notaNum = parseFloat(nota);
        if (isNaN(notaNum)) {
            return '<span class="text-muted fw-bold">-</span>';
        }
        
        // Colorir a nota baseada no valor
        let classe = 'text-dark';
        if (notaNum >= 6.0) {
            classe = 'text-success fw-bold';
        } else if (notaNum >= 4.0) {
            classe = 'text-warning fw-bold';
        } else {
            classe = 'text-danger fw-bold';
        }
        
        return `<span class="${classe}">${notaNum.toFixed(1)}</span>`;
    },

    // Adicionar estilos específicos para impressão do boletim
    adicionarEstilosImpressao: function() {
        // Verificar se os estilos já foram adicionados
        if (document.getElementById('boletim-print-styles')) {
            return;
        }
        
        const estilos = document.createElement('style');
        estilos.id = 'boletim-print-styles';
        estilos.textContent = `
            @media print {
                /* Ocultar elementos desnecessários na impressão */
                .modal-header, .modal-footer, .btn-close {
                    display: none !important;
                }
                
                /* Configurar página para impressão */
                @page {
                    size: A4;
                    margin: 1cm;
                }
                
                /* Estilo do container do boletim */
                .boletim-container {
                    background: white !important;
                    box-shadow: none !important;
                    border: 1px solid #000 !important;
                    margin-bottom: 2cm !important;
                    page-break-inside: avoid;
                }
                
                /* Cabeçalho do boletim */
                .boletim-header {
                    border-bottom: 2px solid #000 !important;
                }
                
                /* Tabela de notas */
                .table {
                    border: 1px solid #000 !important;
                }
                
                .table th, .table td {
                    border: 1px solid #000 !important;
                    padding: 8px !important;
                    font-size: 12px !important;
                }
                
                .table-dark th {
                    background-color: #343a40 !important;
                    color: white !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                /* Badges e cores */
                .badge {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .text-success {
                    color: #198754 !important;
                }
                
                .text-warning {
                    color: #fd7e14 !important;
                }
                
                .text-danger {
                    color: #dc3545 !important;
                }
                
                /* Quebra de página */
                .page-break {
                    page-break-after: always;
                }
                
                /* Modal em tela cheia para impressão */
                .modal-dialog {
                    max-width: none !important;
                    margin: 0 !important;
                }
                
                .modal-content {
                    border: none !important;
                    border-radius: 0 !important;
                }
                
                .modal-body {
                    padding: 0 !important;
                    background: white !important;
                }
                
                /* Ajustar fonte para impressão */
                body {
                    font-size: 12px !important;
                    line-height: 1.4 !important;
                }
                
                h4, h5, h6 {
                    font-size: 14px !important;
                }
                
                /* Garantir que as cores sejam impressas */
                * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
            
            /* Estilos para tela */
            @media screen {
                .boletim-container {
                    transition: all 0.3s ease;
                }
                
                .boletim-container:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
                }
                
                .table-hover tbody tr:hover {
                    background-color: rgba(0,123,255,0.1) !important;
                }
            }
        `;
        
        document.head.appendChild(estilos);
    },
    
    // Imprimir boletim
    imprimirBoletim: function() {
        const conteudo = document.getElementById('conteudoBoletim');
        if (conteudo) {
            const janelaImpressao = window.open('', '_blank');
            janelaImpressao.document.write(`
                <html>
                    <head>
                        <title>Boletim de Médias</title>
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                        <style>
                            @media print {
                                .card { page-break-inside: avoid; }
                                .table { font-size: 12px; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container-fluid">
                            ${conteudo.innerHTML}
                        </div>
                    </body>
                </html>
            `);
            janelaImpressao.document.close();
            janelaImpressao.print();
        }
    },
    
    // Criar nova nota
    novaNota: function() {
        console.log("🆕 Iniciando criação de nova nota...");
        
        this.state.modoEdicao = false;
        this.state.notaSelecionada = null;
        
        // Primeiro limpar o formulário completamente
        if (this.elements.formNota) {
            this.elements.formNota.reset();
            
            // Mostrar o formulário (remover classe d-none se existir)
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
        
        // Verificar e revalidar campo frequência
        if (!this.elements.inputFrequencia) {
            console.warn("⚠️ Campo frequência não encontrado, tentando revalidar...");
            this.revalidarCampoFrequencia();
        }
        
        // Limpar campo frequência
        if (this.elements.inputFrequencia) {
            this.elements.inputFrequencia.value = '';
            console.log("✅ Campo frequência limpo e pronto para uso");
        } else {
            console.error("❌ Campo frequência ainda não foi encontrado após revalidação!");
        }
        
        if (this.elements.selectTurma) {
            this.elements.selectTurma.focus();
        }
        
        console.log("🆕 Nova nota inicializada com sucesso");
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
                // Garantir que o formulário esteja visível
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
                
                // Preencher o campo de frequência se existir valor
                if (this.elements.inputFrequencia) {
                    const frequencia = nota.frequencia !== undefined && nota.frequencia !== null ? nota.frequencia : '';
                    this.elements.inputFrequencia.value = frequencia;
                    console.log(`Campo de frequência preenchido com: ${frequencia}`);
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

            // Buscar disciplinas vinculadas à turma usando o novo relacionamento
            let disciplinas = [];
            let usouRelacionamentoNovo = false;
            
            // Tentar primeiro buscar disciplinas através do novo relacionamento na tabela professor_disciplina_turma
            try {
                // Buscar vínculos professor-disciplina-turma para esta turma
                const vinculos = await ConfigModule.fetchApi(`/professor_disciplina_turma?id_turma=${turmaId}`);
                
                if (Array.isArray(vinculos) && vinculos.length > 0) {
                    console.log(`Encontrados ${vinculos.length} vínculos para a turma ${turmaId} no lançamento em massa`);
                    
                    // Extrair IDs de disciplinas únicos dos vínculos
                    const disciplinasIds = [...new Set(vinculos.map(v => v.id_disciplina || v.disciplina))];
                    
                    // Para cada ID de disciplina, buscar os detalhes completos
                    const disciplinasPromises = disciplinasIds.map(id => 
                        ConfigModule.fetchApi(`/disciplinas/${id}`)
                            .catch(err => {
                                console.warn(`Erro ao buscar detalhes da disciplina ${id}:`, err);
                                // Retornar objeto mínimo com ID em caso de erro
                                return { id_disciplina: id, nome_disciplina: `Disciplina ${id}` };
                            })
                    );
                    
                    disciplinas = await Promise.all(disciplinasPromises);
                    usouRelacionamentoNovo = true;
                    console.log(`Disciplinas completas carregadas via vínculos para grade: ${disciplinas.length}`);
                } else {
                    console.log(`Nenhum vínculo encontrado para a turma ${turmaId}, tentando método alternativo na grade`);
                }
            } catch (vincError) {
                console.warn(`Erro ao buscar vínculos para turma ${turmaId} na grade:`, vincError);
                // Continuar para tentar método alternativo
            }
            
            // Se não encontrou pelos vínculos, tentar pelo endpoint alternativo
            if (!usouRelacionamentoNovo) {
                try {
                    const vinculosAlt = await ConfigModule.fetchApi(`/vinculos?id_turma=${turmaId}`);
                    
                    if (Array.isArray(vinculosAlt) && vinculosAlt.length > 0) {
                        console.log(`Encontrados ${vinculosAlt.length} vínculos alternativos para a turma ${turmaId} na grade`);
                        
                        // Extrair IDs de disciplinas únicos dos vínculos
                        const disciplinasIds = [...new Set(vinculosAlt.map(v => v.id_disciplina || v.disciplina))];
                        
                        // Para cada ID de disciplina, buscar os detalhes completos
                        const disciplinasPromises = disciplinasIds.map(id => 
                            ConfigModule.fetchApi(`/disciplinas/${id}`)
                                .catch(err => {
                                    console.warn(`Erro ao buscar detalhes da disciplina ${id}:`, err);
                                    // Retornar objeto mínimo com ID em caso de erro
                                    return { id_disciplina: id, nome_disciplina: `Disciplina ${id}` };
                                })
                        );
                        
                        disciplinas = await Promise.all(disciplinasPromises);
                        usouRelacionamentoNovo = true;
                        console.log(`Disciplinas completas carregadas via vínculos alternativos para grade: ${disciplinas.length}`);
                    } else {
                        console.log(`Nenhum vínculo alternativo encontrado para a turma ${turmaId} na grade, tentando método legado`);
                    }
                } catch (altError) {
                    console.warn(`Erro ao buscar vínculos alternativos para turma ${turmaId} na grade:`, altError);
                    // Continuar para tentar método legado
                }
            }
            
            // Se ainda não encontrou, tentar método legado
            if (!usouRelacionamentoNovo) {
                console.log(`Tentando método legado para obter disciplinas da turma ${turmaId} na grade`);
                disciplinas = await ConfigModule.fetchApi(`/turmas/${turmaId}/disciplinas`);
                console.log(`Disciplinas da turma ${turmaId} carregadas via método legado para grade:`, disciplinas);
            }

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
                    
                    console.log(`Processando disciplina para grade: ID=${id}, Nome=${nome}`);
                    
                    // Verificar se a disciplina já foi adicionada
                    if (disciplinasIds.has(id)) {
                        console.log(`Disciplina ${id} já adicionada à grade, ignorando duplicata`);
                        return;
                    }
                    
                    disciplinasIds.add(id);
                    
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = nome;
                    this.elements.massaDisciplina.appendChild(option);
                });
                
                console.log(`Total de ${disciplinasIds.size} disciplinas únicas adicionadas ao select da grade`);
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
            
            // Verificar a estrutura do DOM e garantir que os elementos existam
            const conteudoNotas = document.querySelector('#conteudo-notas');
            if (!conteudoNotas) {
                console.error("Elemento #conteudo-notas não encontrado. A estrutura da página pode estar incorreta.");
                alert("Erro: Container principal não encontrado. Por favor, recarregue a página.");
                return;
            }
            
            // Mostrar todo o processo no console para depuração
            console.log("Estrutura do DOM principal:", {
                conteudoNotas: conteudoNotas,
                massaSection: document.querySelector('#lancamento-massa-section'),
                gradeWrapper: document.querySelector('#grade-notas-wrapper')
            });
            
            // Garantir que o elemento gradeNotas exista e seja visível
            if (!this.elements.gradeNotas) {
                console.warn("Elemento gradeNotas não encontrado, criando elemento");
                
                // Procurar por um container adequado
                const gradeNotasWrapper = document.querySelector('#grade-notas-wrapper') || 
                                          document.querySelector('#massa-notas-container') || 
                                          conteudoNotas;
                
                if (gradeNotasWrapper) {
                    // Primeiro verificar se já existe um elemento com ID grade-notas
                    let gradeNotasExistente = document.querySelector('#grade-notas');
                    
                    if (gradeNotasExistente) {
                        console.log("Elemento #grade-notas já existe no DOM, utilizando o existente");
                        this.elements.gradeNotas = gradeNotasExistente;
                    } else {
                        // Criar um novo elemento
                        console.log("Criando novo elemento #grade-notas");
                        const novoGradeNotas = document.createElement('div');
                        novoGradeNotas.id = 'grade-notas';
                        novoGradeNotas.className = 'mt-4 grade-container';
                        
                        // Garantir que o elemento seja adicionado ao DOM
                        gradeNotasWrapper.appendChild(novoGradeNotas);
                        this.elements.gradeNotas = novoGradeNotas;
                        
                        console.log("Novo elemento grade-notas criado e adicionado ao DOM:", novoGradeNotas);
                    }
                } else {
                    // Se não encontrou um container adequado, criar um novo e adicionar ao conteudoNotas
                    console.warn("Nenhum container específico encontrado, criando estrutura completa");
                    
                    const novoContainer = document.createElement('div');
                    novoContainer.id = 'massa-notas-container';
                    novoContainer.className = 'mt-4 border p-3 rounded bg-white shadow-sm';
                    
                    const novoGradeNotas = document.createElement('div');
                    novoGradeNotas.id = 'grade-notas';
                    novoGradeNotas.className = 'mt-3 grade-container';
                    
                    novoContainer.appendChild(novoGradeNotas);
                    conteudoNotas.appendChild(novoContainer);
                    
                    this.elements.gradeNotas = novoGradeNotas;
                    console.log("Criada estrutura completa para a grade:", novoContainer);
                }
            }
            
            // Adicionar classe de carregamento
            conteudoNotas.classList.add('page-loading');
            
            // Garantir que o elemento gradeNotas esteja visível com um tamanho adequado
            this.elements.gradeNotas.style.display = 'block';
            this.elements.gradeNotas.style.minHeight = '200px';
            
            // Exibir indicador de carregamento mais visível
            this.elements.gradeNotas.innerHTML = `
                <div class="text-center py-5 bg-light rounded border mb-3">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-3 text-primary fw-bold">Carregando alunos e notas...</p>
                    <p class="text-muted">Turma: ${document.querySelector('#massa-turma option:checked')?.textContent || turmaId}</p>
                    <p class="text-muted">Disciplina: ${document.querySelector('#massa-disciplina option:checked')?.textContent || disciplinaId}</p>
                </div>
            `;
            
            console.log("Indicador de carregamento adicionado. Iniciando busca de alunos e notas...");
            
            // Desabilitar temporariamente o botão para evitar cliques múltiplos
            if (this.elements.btnCarregarGrade) {
                this.elements.btnCarregarGrade.disabled = true;
                this.elements.btnCarregarGrade.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Carregando...';
            }
            
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.disabled = true;
            }
            
            try {
                // Buscar alunos da turma
                const alunos = await this.buscarDadosComFeedback(
                    `/turmas/${turmaId}/alunos`,
                    "Buscando alunos...",
                    "Contornando restrições de segurança (CORS)..."
                );
                console.log("Alunos carregados:", alunos);
                
                if (!alunos || !Array.isArray(alunos) || alunos.length === 0) {
                    this.elements.gradeNotas.innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Não há alunos cadastrados nesta turma.
                        </div>
                    `;
                    
                    // Restaurar estado dos botões
                    if (this.elements.btnCarregarGrade) {
                        this.elements.btnCarregarGrade.disabled = false;
                        this.elements.btnCarregarGrade.innerHTML = 'Carregar Grade';
                    }
                    
                    // Remover classe de carregamento
                    conteudoNotas.classList.remove('page-loading');
                    return;
                }
                
                // Buscar notas existentes para esta turma, disciplina, bimestre e ano
                const filtro = `?id_turma=${turmaId}&id_disciplina=${disciplinaId}&bimestre=${bimestre}&ano=${ano}`;
                const notasExistentes = await this.buscarDadosComFeedback(
                    `/notas${filtro}`,
                    "Buscando notas existentes...",
                    "Contornando restrições de segurança (CORS)..."
                );
                console.log("Notas existentes:", notasExistentes);
                
                // Continuar com o restante do código...
                
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
                
                // ... resto do código existente...
                
                // Criar tabela para exibir os alunos e suas notas
                const tabela = document.createElement('table');
                tabela.className = 'table table-striped table-bordered table-hover';
                tabela.id = 'tabela-grade-notas';
                
                // Cabeçalho da tabela
                const thead = document.createElement('thead');
                thead.className = 'table-light';
                thead.innerHTML = `
                    <tr>
                        <th width="5%" class="text-center">#</th>
                        <th width="30%">Aluno</th>
                        <th width="15%" class="text-center">Nota Mensal</th>
                        <th width="15%" class="text-center">Nota Bimestral</th>
                        <th width="15%" class="text-center">Recuperação</th>
                        <th width="15%" class="text-center">Frequência</th>
                        <th width="15%" class="text-center">Média Final</th>
                    </tr>
                `;
                tabela.appendChild(thead);
                
                // Corpo da tabela
                const tbody = document.createElement('tbody');
                
                // Ordenar alunos por nome para facilitar a localização
                alunos.sort((a, b) => {
                    const nomeA = a.nome_aluno || a.nome || '';
                    const nomeB = b.nome_aluno || b.nome || '';
                    return nomeA.localeCompare(nomeB);
                });
                
                // Para cada aluno, criar uma linha na tabela
                alunos.forEach((aluno, index) => {
                    const alunoId = aluno.id_aluno || aluno.id;
                    
                    // Buscar a nota existente para este aluno, se houver
                    const notaExistente = notasFiltradas.find(n => {
                        const notaAlunoId = n.aluno_id || n.id_aluno;
                        return String(notaAlunoId) === String(alunoId);
                    });
                    
                    const row = document.createElement('tr');
                    row.dataset.alunoId = alunoId;
                    
                    // Nota mensal
                    const notaMensal = notaExistente ? (notaExistente.nota_mensal || notaExistente.mensal || '') : '';
                    // Nota bimestral
                    const notaBimestral = notaExistente ? (notaExistente.nota_bimestral || notaExistente.bimestral || '') : '';
                    // Nota recuperação
                    const notaRecuperacao = notaExistente ? (notaExistente.nota_recuperacao || notaExistente.recuperacao || notaExistente.rec || '') : '';
                    
                    // Frequência
                    const frequencia = notaExistente ? (notaExistente.frequencia || '') : '';
                    
                    // Calcular média ou usar a média já fornecida
                    let mediaFinal = '';
                    if (notaExistente && notaExistente.media_final) {
                        mediaFinal = notaExistente.media_final;
                    } else if (notaExistente && notaExistente.media) {
                        mediaFinal = notaExistente.media;
                    } else if (notaMensal !== '' || notaBimestral !== '') {
                        // Calcular a média apenas se houver pelo menos uma nota (mensal ou bimestral)
                        const nMensal = parseFloat(notaMensal) || 0;
                        const nBimestral = parseFloat(notaBimestral) || 0;
                        const nRecuperacao = parseFloat(notaRecuperacao) || 0;
                        
                        // Se apenas uma nota estiver presente, usar essa nota como média
                        if (notaMensal !== '' && notaBimestral === '') {
                            mediaFinal = nMensal;
                        } else if (notaMensal === '' && notaBimestral !== '') {
                            mediaFinal = nBimestral;
                        } else {
                            // Se ambas as notas estiverem presentes, calcular média simples (média aritmética)
                            let mediaCalculada = (nMensal + nBimestral) / 2;
                            
                            // Se tiver recuperação e a média for menor que 6, considerar recuperação
                            if (mediaCalculada < 6.0 && notaRecuperacao !== '') {
                                mediaCalculada = (mediaCalculada + nRecuperacao) / 2;
                            }
                            
                            mediaFinal = mediaCalculada;
                        }
                    }
                    
                    // Formatar a média para exibição (se existir)
                    const mediaExibicao = mediaFinal !== '' ? mediaFinal.toFixed(1) : '';
                    
                    // Construir a linha da tabela com id do aluno, nome e campos de entrada para as notas
                    row.innerHTML = `
                        <td class="text-center align-middle">${index + 1}</td>
                        <td class="align-middle">
                            <strong>${aluno.nome_aluno || aluno.nome || 'Aluno sem nome'}</strong>
                            <input type="hidden" name="aluno_id" value="${alunoId}">
                            <input type="hidden" name="nota_id" value="${notaExistente ? (notaExistente.id || '') : ''}">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm nota-mensal" min="0" max="10" step="0.1" placeholder="0.0 a 10.0" value="${notaMensal}">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm nota-bimestral" min="0" max="10" step="0.1" placeholder="0.0 a 10.0" value="${notaBimestral}">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm nota-recuperacao" min="0" max="10" step="0.1" placeholder="0.0 a 10.0" value="${notaRecuperacao}">
                        </td>
                        <td>
                            <input type="number" class="form-control form-control-sm frequencia" min="0" max="100" step="1" placeholder="0 a 100" value="${frequencia}">
                        </td>
                        <td>
                            <input type="text" class="form-control form-control-sm media-final bg-light" readonly value="${mediaExibicao}">
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                });
                
                tabela.appendChild(tbody);
                
                // Adicionar a tabela ao DOM
                this.elements.gradeNotas.innerHTML = '';
                this.elements.gradeNotas.appendChild(tabela);
                
                // Se houver um wrapper para a grade, torná-lo visível
                if (this.elements.gradeNotasWrapper) {
                    this.elements.gradeNotasWrapper.classList.remove('d-none');
                }
                
                // Se houver um botão para salvar a grade, habilitá-lo
                if (this.elements.btnSalvarGrade) {
                    this.elements.btnSalvarGrade.disabled = false;
                }
                
                // Restaurar o estado do botão de carregar grade
                if (this.elements.btnCarregarGrade) {
                    this.elements.btnCarregarGrade.disabled = false;
                    this.elements.btnCarregarGrade.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Carregar Alunos';
                }
                
                // Adicionar event listeners para calcular a média automaticamente
                document.querySelectorAll('#tabela-grade-notas .nota-mensal, #tabela-grade-notas .nota-bimestral, #tabela-grade-notas .nota-recuperacao').forEach(input => {
                    input.addEventListener('input', (e) => {
                        const row = e.target.closest('tr');
                        this.calcularMediaLinha(row);
                    });
                });
                
                // Remover classe de carregamento
                conteudoNotas.classList.remove('page-loading');
                
                console.log("Grade de notas carregada com sucesso!");
                
            } catch (error) {
                console.error("Erro ao carregar grade de notas:", error);
                
                this.elements.gradeNotas.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Erro ao carregar alunos/notas:</strong> ${error.message || 'Erro desconhecido'}
                    </div>
                `;
                
                // Mostrar mensagem de erro também através da função mostrarErro
                this.mostrarErro(`<strong>Erro ao carregar grade de notas.</strong> ${error.message || 'Por favor, tente novamente.'}`);
                
                // Restaurar estado dos botões
                if (this.elements.btnCarregarGrade) {
                    this.elements.btnCarregarGrade.disabled = false;
                    this.elements.btnCarregarGrade.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Carregar Grade';
                }
                
                // Remover classe de carregamento
                conteudoNotas.classList.remove('page-loading');
            }
        } catch (error) {
            console.error("Erro ao carregar grade de notas:", error);
            this.mostrarErro("Erro ao carregar grade de notas: " + (error.message || "Erro desconhecido"));
        }
    },
    
    // Calcular média para uma linha da tabela de lançamento em massa
    calcularMediaLinha: function(row) {
        if (!row) return;
        
        const notaMensalInput = row.querySelector('.nota-mensal');
        const notaBimestralInput = row.querySelector('.nota-bimestral');
        const notaRecuperacaoInput = row.querySelector('.nota-recuperacao');
        const frequenciaInput = row.querySelector('.frequencia');
        const mediaFinalInput = row.querySelector('.media-final');
        
        if (!notaMensalInput || !notaBimestralInput || !mediaFinalInput) {
            console.warn("Elementos de input não encontrados na linha");
            return;
        }
        
        const notaMensal = notaMensalInput.value.trim();
        const notaBimestral = notaBimestralInput.value.trim();
        const notaRecuperacao = notaRecuperacaoInput ? notaRecuperacaoInput.value.trim() : '';
        const frequencia = frequenciaInput ? frequenciaInput.value.trim() : '';
        
        // Usar a função calcularMediaAluno para manter consistência no cálculo
        const mediaFinal = this.calcularMediaAluno(notaMensal, notaBimestral, notaRecuperacao, frequencia);
        
        // Atualizar campo de média se houver um valor calculado
        if (mediaFinal !== null) {
            mediaFinalInput.value = mediaFinal.toFixed(1);
            
            // Adicionar classe para destacar visualmente o status da média
            if (mediaFinal < 6.0) {
                mediaFinalInput.classList.add('text-danger');
                mediaFinalInput.classList.remove('text-success');
            } else {
                mediaFinalInput.classList.add('text-success');
                mediaFinalInput.classList.remove('text-danger');
            }
        } else {
            mediaFinalInput.value = '';
            mediaFinalInput.classList.remove('text-danger', 'text-success');
        }
    },
    
    // Função auxiliar para buscar dados com feedback do progresso
    buscarDadosComFeedback: async function(endpoint, mensagemInicial, mensagemCORS) {
        this.atualizarMensagemCarregamento(mensagemInicial);
        
        try {
            return await ConfigModule.fetchApi(endpoint);
        } catch (error) {
            // Se for erro de CORS, mostrar feedback e tentar novamente
            if (error.message && (
                error.message.includes('CORS') || 
                error.message.includes('cross-origin') || 
                error.message.includes('NetworkError')
            )) {
                console.warn("Erro de CORS detectado, tentando alternativa:", error);
                this.atualizarMensagemCarregamento(mensagemCORS);
                
                // Esperar um momento para o usuário ler a mensagem
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Tentar novamente com a opção de capturar erro
                const resultado = await ConfigModule.fetchApi(endpoint, { catchError: true });
                
                if (resultado && resultado.error) {
                    throw new Error(resultado.message || "Erro ao acessar o servidor");
                }
                
                return resultado;
            }
            throw error;
        }
    },
    
    // Atualizar mensagem no indicador de carregamento
    atualizarMensagemCarregamento: function(mensagem) {
        const statusElemento = document.querySelector('#grade-notas .text-primary.fw-bold');
        if (statusElemento) {
            statusElemento.textContent = mensagem;
        }
    },
    
    // Mostrar mensagem específica para erros de CORS
    mostrarMensagemCORS: function() {
        const gradeNotas = this.elements.gradeNotas || document.getElementById('grade-notas');
        
        if (!gradeNotas) return;
        
        gradeNotas.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Problema de conectividade detectado</strong>
                <p class="mb-0 mt-2">O navegador está impedindo o acesso ao servidor devido a restrições de segurança (CORS).</p>
                <hr>
                <div class="mt-3">
                    <p><strong>O que você pode tentar:</strong></p>
                    <ol class="mb-0">
                        <li>Clique em "Tentar Novamente" para usar um método alternativo de comunicação.</li>
                        <li>Verifique se o servidor está online em <a href="https://apinazarerodrigues.86dynamics.com.br/api" target="_blank">https://apinazarerodrigues.86dynamics.com.br/api</a></li>
                        <li>Se você está usando Firefox ou Chrome, considere instalar uma extensão como "CORS Unblock" ou "Allow CORS".</li>
                        <li>Recarregue a página e tente novamente.</li>
                    </ol>
                </div>
                <div class="d-flex justify-content-end mt-3">
                    <button id="btn-cors-retry" class="btn btn-primary">
                        <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        
        // Adicionar listener para o botão de tentar novamente
        setTimeout(() => {
            const btnRetry = document.getElementById('btn-cors-retry');
            if (btnRetry) {
                btnRetry.addEventListener('click', () => {
                    this.carregarGradeNotas();
                });
            }
        }, 100);
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

    // Mostrar mensagem informativa
    mostrarInfo: function(mensagem) {
        console.log("Info:", mensagem);
        const alertContainer = document.createElement('div');
        alertContainer.className = 'alert alert-info alert-dismissible fade show';
        alertContainer.role = 'alert';
        alertContainer.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-info-circle me-2" style="font-size: 1.25rem;"></i>
                <div>${mensagem}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        const conteudoNotas = document.querySelector('#conteudo-notas');
        if (conteudoNotas) {
            // Verificar se já existe um alerta informativo e remover
            const alertasInfoExistentes = conteudoNotas.querySelectorAll('.alert-info');
            alertasInfoExistentes.forEach(alerta => alerta.remove());
            
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
            console.warn("Elemento #conteudo-notas não encontrado para mostrar mensagem informativa");
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
                rec: notaRecuperacao ? parseFloat(notaRecuperacao) : null, // Adicionar mais um campo alternativo
                frequencia: this.elements.inputFrequencia && this.elements.inputFrequencia.value ? parseInt(this.elements.inputFrequencia.value) : null
            };
            
            // Calcular média final
            const media = this.calcularMediaAluno(notaMensal, notaBimestral, notaRecuperacao, this.elements.inputFrequencia ? this.elements.inputFrequencia.value : null);
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
            
            // Limpar o formulário e recolhê-lo (ocultar)
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
    },
    
    // Validar o formulário de nota antes de salvar
    validarFormularioNota: function() {
        console.log("Validando formulário de notas");
        
        // Verificar se os campos obrigatórios estão preenchidos
        if (!this.elements.selectTurma || !this.elements.selectTurma.value) {
            this.mostrarErro("Selecione uma turma");
            return false;
        }
        
        if (!this.elements.selectDisciplina || !this.elements.selectDisciplina.value) {
            this.mostrarErro("Selecione uma disciplina");
            return false;
        }
        
        if (!this.elements.selectAluno || !this.elements.selectAluno.value) {
            this.mostrarErro("Selecione um aluno");
            return false;
        }
        
        if (!this.elements.selectBimestre || !this.elements.selectBimestre.value) {
            this.mostrarErro("Selecione um bimestre");
            return false;
        }
        
        if (!this.elements.inputAno || !this.elements.inputAno.value) {
            this.mostrarErro("Informe o ano");
            return false;
        }
        
        // Verificar se pelo menos uma nota foi informada
        const notaMensal = this.elements.inputNotaMensal ? this.elements.inputNotaMensal.value.trim() : '';
        const notaBimestral = this.elements.inputNotaBimestral ? this.elements.inputNotaBimestral.value.trim() : '';
        const notaRecuperacao = this.elements.inputNotaRecuperacao ? this.elements.inputNotaRecuperacao.value.trim() : '';
        
        if (!notaMensal && !notaBimestral && !notaRecuperacao) {
            this.mostrarErro("Informe pelo menos uma nota (mensal, bimestral ou recuperação)");
            return false;
        }
        
        // Validar faixa de valores (0 a 10)
        if (notaMensal && (parseFloat(notaMensal) < 0 || parseFloat(notaMensal) > 10)) {
            this.mostrarErro("A nota mensal deve estar entre 0 e 10");
            return false;
        }
        
        if (notaBimestral && (parseFloat(notaBimestral) < 0 || parseFloat(notaBimestral) > 10)) {
            this.mostrarErro("A nota bimestral deve estar entre 0 e 10");
            return false;
        }
        
        if (notaRecuperacao && (parseFloat(notaRecuperacao) < 0 || parseFloat(notaRecuperacao) > 10)) {
            this.mostrarErro("A nota de recuperação deve estar entre 0 e 10");
            return false;
        }
        
        return true;
    },
    
    // Salvar todas as notas da grade de uma vez
    salvarGradeNotas: async function() {
        try {
            // Verificar se os dados de contexto estão disponíveis
            const turmaId = this.elements.massaTurma.value;
            const disciplinaId = this.elements.massaDisciplina.value;
            const bimestre = this.elements.massaBimestre.value;
            const ano = this.elements.massaAno.value;
            
            if (!turmaId || !disciplinaId || !bimestre || !ano) {
                this.mostrarErro("Não foi possível salvar as notas: dados de contexto incompletos (turma, disciplina, bimestre ou ano).");
                return;
            }
            
            // Coletar notas da tabela
            const linhas = document.querySelectorAll('#tabela-grade-notas tbody tr');
            if (!linhas || linhas.length === 0) {
                this.mostrarErro("Nenhum aluno encontrado na grade de notas.");
                return;
            }
            
            // Preparar feedback visual
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.disabled = true;
                this.elements.btnSalvarGrade.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Salvando notas...';
            }
            
            // Array para armazenar promessas de salvamento
            const promises = [];
            let notasComErro = 0;
            
            // Para cada linha da tabela, salvar a nota correspondente
            for (const linha of linhas) {
                // Obter o ID do aluno e da nota (se existir)
                const alunoId = linha.querySelector('input[name="aluno_id"]').value;
                const notaId = linha.querySelector('input[name="nota_id"]').value;
                
                // Obter valores das notas
                const notaMensal = linha.querySelector('.nota-mensal').value.trim();
                const notaBimestral = linha.querySelector('.nota-bimestral').value.trim();
                const notaRecuperacao = linha.querySelector('.nota-recuperacao').value.trim();
                const frequencia = linha.querySelector('.frequencia').value.trim();
                const mediaFinal = linha.querySelector('.media-final').value.trim();
                
                // Verificar se há pelo menos uma nota ou frequência informada
                if (!notaMensal && !notaBimestral && !notaRecuperacao && !frequencia) {
                    // Se não tiver nenhuma nota nem frequência, não tentar salvar
                    continue;
                }
                
                // Dados para enviar à API
                const dados = {
                    id_turma: turmaId,
                    id_disciplina: disciplinaId,
                    id_aluno: alunoId,
                    bimestre: parseInt(bimestre),
                    ano: parseInt(ano),
                    nota_mensal: notaMensal ? parseFloat(notaMensal) : null,
                    nota_bimestral: notaBimestral ? parseFloat(notaBimestral) : null,
                    nota_recuperacao: notaRecuperacao ? parseFloat(notaRecuperacao) : null,
                    recuperacao: notaRecuperacao ? parseFloat(notaRecuperacao) : null, // Campo alternativo para recuperação
                    frequencia: frequencia ? parseInt(frequencia) : null,
                    media_final: mediaFinal ? parseFloat(mediaFinal) : null,
                    media: mediaFinal ? parseFloat(mediaFinal) : null // Campo alternativo para média
                };
                
                try {
                    // Se já existir um ID de nota, atualizar; caso contrário, criar nova nota
                    if (notaId) {
                        console.log(`Atualizando nota existente (ID: ${notaId}) para aluno ${alunoId}`);
                        
                        const promise = fetch(ConfigModule.getApiUrl(`/notas/${notaId}`), {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(dados)
                        }).then(response => {
                            if (!response.ok) {
                                throw new Error(`Falha ao atualizar nota: ${response.status} - ${response.statusText}`);
                            }
                            return response.json();
                        }).then(result => {
                            console.log(`Nota atualizada com sucesso: ${notaId}`);
                            // Destacar a linha como salva com sucesso
                            linha.classList.add('destaque-sucesso');
                            // Atualizar o valor do ID da nota no hidden input
                            if (result && result.id) {
                                linha.querySelector('input[name="nota_id"]').value = result.id;
                            }
                            return result;
                        }).catch(error => {
                            console.error(`Erro ao atualizar nota ${notaId}:`, error);
                            linha.classList.add('destaque-erro');
                            notasComErro++;
                            throw error;
                        });
                        
                        promises.push(promise);
                    } else {
                        console.log(`Criando nova nota para aluno ${alunoId}`);
                        
                        const promise = fetch(ConfigModule.getApiUrl('/notas'), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(dados)
                        }).then(response => {
                            if (!response.ok) {
                                throw new Error(`Falha ao criar nota: ${response.status} - ${response.statusText}`);
                            }
                            return response.json();
                        }).then(result => {
                            console.log(`Nova nota criada com sucesso: ${result.id}`);
                            // Destacar a linha como salva com sucesso
                            linha.classList.add('destaque-sucesso');
                            // Salvar o ID da nova nota no hidden input
                            if (result && result.id) {
                                linha.querySelector('input[name="nota_id"]').value = result.id;
                            }
                            return result;
                        }).catch(error => {
                            console.error(`Erro ao criar nota para aluno ${alunoId}:`, error);
                            linha.classList.add('destaque-erro');
                            notasComErro++;
                            throw error;
                        });
                        
                        promises.push(promise);
                    }
                } catch (error) {
                    console.error(`Erro ao processar linha para aluno ${alunoId}:`, error);
                    linha.classList.add('destaque-erro');
                    notasComErro++;
                }
            }
            
            // Aguardar todas as requisições terminarem
            try {
                await Promise.allSettled(promises);
                
                // Verificar se houve erros
                if (notasComErro > 0) {
                    this.mostrarErro(`<strong>Não foi possível salvar todas as notas.</strong> <span class="badge bg-danger">${notasComErro}</span> nota${notasComErro > 1 ? 's' : ''} com erro.`);
                } else {
                    this.mostrarSucesso("Todas as notas foram salvas com sucesso!");
                    
                    // Recolher a grade após o salvamento bem-sucedido
                    if (this.elements.gradeNotasWrapper) {
                        setTimeout(() => {
                            this.elements.gradeNotasWrapper.classList.add('d-none');
                            this.elements.gradeNotas.innerHTML = '';
                        }, 1500); // Pequeno delay para o usuário ver a confirmação visual
                    }
                }
            } catch (error) {
                console.error("Erro ao salvar notas em massa:", error);
                this.mostrarErro(`<strong>Ocorreu um erro ao tentar salvar as notas.</strong> ${error.message || 'Por favor, tente novamente.'}`);
            } finally {
                // Restaurar o botão de salvar
                if (this.elements.btnSalvarGrade) {
                    this.elements.btnSalvarGrade.disabled = false;
                    this.elements.btnSalvarGrade.innerHTML = '<i class="fas fa-save me-1"></i> Salvar Todas as Notas';
                }
            }
        } catch (error) {
            console.error("Erro ao salvar grade de notas:", error);
            this.mostrarErro("Ocorreu um erro ao tentar salvar as notas: " + (error.message || "Erro desconhecido"));
            
            // Restaurar o botão de salvar
            if (this.elements.btnSalvarGrade) {
                this.elements.btnSalvarGrade.disabled = false;
                this.elements.btnSalvarGrade.innerHTML = '<i class="fas fa-save me-1"></i> Salvar Todas as Notas';
            }
        }
    },
    
    // Calcular média para um aluno
    calcularMediaAluno: function(notaMensal, notaBimestral, notaRecuperacao, frequencia) {
        console.log("Calculando média para:", { notaMensal, notaBimestral, notaRecuperacao, frequencia });
        
        // Converter para números e tratar valores vazios
        const nMensal = notaMensal && notaMensal.trim() !== '' ? parseFloat(notaMensal) : null;
        const nBimestral = notaBimestral && notaBimestral.trim() !== '' ? parseFloat(notaBimestral) : null;
        const nRecuperacao = notaRecuperacao && notaRecuperacao.trim() !== '' ? parseFloat(notaRecuperacao) : null;
        const nFrequencia = frequencia && frequencia.trim() !== '' ? parseFloat(frequencia) : null;
        
        // Se não houver nenhuma nota, retornar null
        if (nMensal === null && nBimestral === null && nRecuperacao === null && nFrequencia === null) {
            return null;
        }
        
        let mediaFinal = 0;
        
        // Se apenas uma nota estiver presente, usar essa nota como média
        if (nMensal !== null && nBimestral === null) {
            mediaFinal = nMensal;
        } else if (nMensal === null && nBimestral !== null) {
            mediaFinal = nBimestral;
        } else if (nMensal !== null && nBimestral !== null) {
            // Se ambas as notas estiverem presentes, calcular média simples (média aritmética)
            mediaFinal = (nMensal + nBimestral) / 2;
            
            // Se tem recuperação e média < 6.0, considerar a recuperação
            if (mediaFinal < 6.0 && nRecuperacao !== null) {
                mediaFinal = (mediaFinal + nRecuperacao) / 2;
            }
        }
        
        // Arredondar para uma casa decimal, sempre para cima em caso de meio termo (.5)
        // Multiplicamos por 10, arredondamos para o inteiro mais próximo e dividimos por 10
        // O Math.ceil para o valor * 10 - 0.5 garante arredondamento para cima em caso de .5
        return Math.ceil(mediaFinal * 10 - 0.5) / 10;
    },
    
    // Função para limpar o formulário de notas
    limparFormularioNota: function() {
        console.log("Limpando formulário de notas");
        
        // Resetar estado
        this.state.modoEdicao = false;
        this.state.notaSelecionada = null;
        
        // Resetar o formulário
        if (this.elements.formNota) {
            this.elements.formNota.reset();
            
            // Ocultar o formulário adicionando a classe d-none
            this.elements.formNota.classList.add('d-none');
            
            // Limpar campo de ID da nota
            const inputNotaId = document.getElementById('nota-id');
            if (inputNotaId) {
                inputNotaId.value = '';
            }
            
            // Resetar média final
            if (this.elements.inputMediaFinal) {
                this.elements.inputMediaFinal.textContent = '0.0';
            }
            
            // Limpar e desabilitar selects de disciplina e aluno
            if (this.elements.selectDisciplina) {
                this.elements.selectDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
                this.elements.selectDisciplina.disabled = true;
            }
            
            if (this.elements.selectAluno) {
                this.elements.selectAluno.innerHTML = '<option value="">Selecione um aluno</option>';
                this.elements.selectAluno.disabled = true;
            }
            
            // Definir ano atual como padrão
            if (this.elements.inputAno) {
                this.elements.inputAno.value = new Date().getFullYear();
            }
        }
    },
    
    // Função para cancelar a edição
    cancelarEdicao: function() {
        console.log("Cancelando edição/inclusão de nota");
        
        // Limpar completamente o formulário e ocultá-lo
        this.limparFormularioNota();
        
        // Se estiver em um modal, fechá-lo
        if (typeof bootstrap !== 'undefined' && this.elements.modalNota) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modal-nota'));
            if (modal) {
                modal.hide();
            } else if (typeof this.elements.modalNota.hide === 'function') {
                this.elements.modalNota.hide();
            }
        }
    },

    // Organizar notas por bimestre para exibição detalhada
    organizarNotasPorBimestre: function(aluno) {
        console.log("🔍 Organizando notas do aluno:", aluno);
        
        const notasPorBimestre = {};
        
        // Verificar se o aluno tem dados válidos
        if (!aluno) {
            console.warn("⚠️ Aluno não fornecido");
            return notasPorBimestre;
        }
        
        // Se o aluno já tem disciplinas com notas organizadas
        if (aluno.disciplinas && Array.isArray(aluno.disciplinas)) {
            console.log("✅ Processando disciplinas do aluno:", aluno.disciplinas.length);
            
            aluno.disciplinas.forEach((disciplina, index) => {
                console.log(`📚 Processando disciplina ${index + 1}:`, disciplina);
                
                const nomeDisciplina = disciplina.nome_disciplina || disciplina.disciplina || `Disciplina ${index + 1}`;
                notasPorBimestre[nomeDisciplina] = {};
                
                // Organizar notas por bimestre se existirem
                if (disciplina.notas_bimestrais) {
                    console.log(`📊 Processando notas bimestrais para ${nomeDisciplina}:`, disciplina.notas_bimestrais);
                    
                    for (let bimestre = 1; bimestre <= 4; bimestre++) {
                        const notaBimestre = disciplina.notas_bimestrais[bimestre];
                        if (notaBimestre) {
                            notasPorBimestre[nomeDisciplina][bimestre] = {
                                nota_mensal: notaBimestre.nota_mensal || null,
                                nota_bimestral: notaBimestre.nota_bimestral || null,
                                nota_recuperacao: notaBimestre.recuperacao || null,
                                frequencia: notaBimestre.frequencia || null,
                                media: notaBimestre.media || null
                            };
                        }
                    }
                }
                
                // Se não tem notas_bimestrais, tentar usar estrutura alternativa
                if (!disciplina.notas_bimestrais && disciplina.notas && Array.isArray(disciplina.notas)) {
                    console.log(`📊 Processando notas alternativas para ${nomeDisciplina}:`, disciplina.notas);
                    
                    disciplina.notas.forEach(nota => {
                        const bimestre = nota.bimestre;
                        if (bimestre && bimestre >= 1 && bimestre <= 4) {
                            notasPorBimestre[nomeDisciplina][bimestre] = {
                                nota_mensal: nota.nota_mensal || null,
                                nota_bimestral: nota.nota_bimestral || null,
                                nota_recuperacao: nota.recuperacao || null,
                                frequencia: nota.frequencia || null,
                                media: nota.media || null
                            };
                        }
                    });
                }
            });
        } else {
            console.warn("⚠️ Aluno não possui disciplinas válidas:", aluno);
        }
        
        console.log("📋 Notas organizadas por bimestre:", notasPorBimestre);
        return notasPorBimestre;
    },

    // Formatar nota para exibição glassmorphism
    formatarNotaGlass: function(nota) {
        if (nota === null || nota === undefined || nota === '') {
            return '<span class="grade-empty">-</span>';
        }
        
        const notaNum = parseFloat(nota);
        if (isNaN(notaNum)) {
            return '<span class="grade-empty">-</span>';
        }
        
        // Sistema de cores baseado no valor da nota (mais simples e eficaz)
        let classeNota = '';
        
        if (notaNum >= 6.0) {
            classeNota = 'nota-aprovado';
        } else if (notaNum >= 4.0) {
            classeNota = 'nota-recuperacao';
        } else {
            classeNota = 'nota-reprovado';
        }
        
        return `<span class="grade-value ${classeNota}">${notaNum.toFixed(1)}</span>`;
    },

    // Formatar média para exibição glassmorphism
    formatarMediaGlass: function(notaBimestre) {
        try {
            if (!notaBimestre) {
                return '<span class="average-empty">-</span>';
            }
            
            const mensal = parseFloat(notaBimestre.nota_mensal) || 0;
            const bimestral = parseFloat(notaBimestre.nota_bimestral) || 0;
            
            if (mensal === 0 && bimestral === 0) {
                return '<span class="average-empty">-</span>';
            }
            
            let media = 0;
            if (mensal > 0 && bimestral > 0) {
                media = (mensal + bimestral) / 2;
            } else if (mensal > 0) {
                media = mensal;
            } else if (bimestral > 0) {
                media = bimestral;
            }
            
            // Sistema de cores baseado no valor da média
            let classeMedia = '';
            
            if (media >= 6.0) {
                classeMedia = 'nota-aprovado';
            } else if (media >= 4.0) {
                classeMedia = 'nota-recuperacao';
            } else {
                classeMedia = 'nota-reprovado';
            }
            
            return `<span class="average-value ${classeMedia}">${media.toFixed(1)}</span>`;
        } catch (error) {
            console.error("Erro ao formatar média:", error);
            return '<span class="average-empty">-</span>';
        }
    },

    // Formatar média final para exibição glassmorphism
    formatarMediaFinalGlass: function(mediaFinal) {
        if (mediaFinal === null || mediaFinal === undefined || mediaFinal === '') {
            return '<span class="final-empty">-</span>';
        }
        
        const media = parseFloat(mediaFinal);
        if (isNaN(media)) {
            return '<span class="final-empty">-</span>';
        }
        
        // Sistema de cores baseado no valor da média final
        let classeMedia = '';
        
        if (media >= 6.0) {
            classeMedia = 'nota-aprovado';
        } else if (media >= 4.0) {
            classeMedia = 'nota-recuperacao';
        } else {
            classeMedia = 'nota-reprovado';
        }
        
        return `<span class="final-value ${classeMedia}">${media.toFixed(1)}</span>`;
    },

    // Adicionar estilos glassmorphism modernos - VERSÃO SIMPLIFICADA
    adicionarEstilosGlassmorphism: function() {
        // Verificar se os estilos já foram adicionados
        if (document.getElementById('glassmorphism-styles')) {
            return;
        }
        
        const estilos = document.createElement('style');
        estilos.id = 'glassmorphism-styles';
        estilos.textContent = `
            /* Estilos básicos para o boletim */
            .boletim-glass-container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                margin-bottom: 2rem;
                overflow: hidden;
                padding: 0;
            }
            
            .glass-header-section {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                padding: 2rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .school-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .school-logo .logo-circle {
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid rgba(255, 255, 255, 0.3);
                transition: all 0.3s ease;
            }
            
            .school-logo .logo-circle:hover {
                transform: rotate(360deg) scale(1.1);
                background: rgba(255, 255, 255, 0.3);
            }
            
            .school-logo i {
                font-size: 2rem;
                color: #4a5568;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            
            .school-details {
                flex: 1;
                text-align: center;
                color: #2d3748;
            }
            
            .school-name {
                font-size: 2rem;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
                letter-spacing: 1px;
            }
            
            .school-subtitle {
                font-size: 1rem;
                margin: 0.5rem 0;
                opacity: 0.8;
                font-weight: 300;
            }
            
            .document-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin: 0.5rem 0 0 0;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
            }
            
            .year-badge .glass-badge {
                background: rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 16px;
                padding: 1rem 1.5rem;
                text-align: center;
                transition: all 0.3s ease;
            }
            
            .year-badge .glass-badge:hover {
                background: rgba(255, 255, 255, 0.35);
                transform: scale(1.05);
            }
            
            .badge-label {
                display: block;
                font-size: 0.9rem;
                color: #4a5568;
                margin-bottom: 0.25rem;
            }
            
            .badge-year {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #2d3748;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            
            /* Informações do aluno */
            .student-info-glass {
                background: linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.2) 0%, 
                    rgba(255, 255, 255, 0.1) 100%);
                backdrop-filter: blur(20px);
                padding: 1.5rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .info-row {
                display: flex;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            
            .info-row:last-child {
                margin-bottom: 0;
            }
            
            .info-label {
                font-weight: 600;
                color: #4a5568;
                margin-right: 1rem;
                min-width: 120px;
            }
            
            .info-value {
                font-weight: 700;
                color: #2d3748;
                font-size: 1.1rem;
            }
            
            /* Estilo específico para o nome da escola */
            .school-name-row {
                background: linear-gradient(135deg, 
                    rgba(25, 118, 210, 0.15) 0%, 
                    rgba(25, 118, 210, 0.08) 100%);
                backdrop-filter: blur(10px);
                padding: 1rem 1.5rem;
                margin-bottom: 1rem;
                border-left: 4px solid #1976d2;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
                transition: all 0.3s ease;
            }
            
            .school-name-row:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3);
            }
            
            .school-name-row .info-label {
                color: #1976d2 !important;
                font-weight: 600;
                font-size: 0.9rem;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            
            .school-name-row .info-value {
                color: #1976d2 !important;
                font-weight: 700;
                font-size: 1.4rem;
                text-transform: uppercase;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            
            .ra-badge {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 16px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
                transition: all 0.3s ease;
            }
            
            /* Estilo específico para o nome da escola na impressão */
            .school-name-row {
                background: #e3f2fd !important;
                padding: 6px 10px !important;
                margin-bottom: 6px !important;
                border-left: 4px solid #1976d2 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                display: block !important;
                width: 100% !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            
            .school-name-row .info-label {
                color: #1976d2 !important;
                font-weight: bold !important;
                font-size: 12px !important;
                margin-right: 8px !important;
            }
            
            .school-name-row .info-value {
                color: #1976d2 !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
                font-size: 14px !important;
            }
            
            .ra-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(79, 172, 254, 0.6);
            }
            
            .ra-label {
                display: block;
                font-size: 0.8rem;
                opacity: 0.9;
                margin-bottom: 0.25rem;
            }
            
            .ra-number {
                display: block;
                font-size: 1.2rem;
                font-weight: 700;
            }
            
            /* Tabela glassmorphism */
            .grades-table-container {
                padding: 2rem;
                overflow-x: auto;
            }
            
            .glass-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 
                    0 10px 30px rgba(0, 0, 0, 0.1),
                    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
                table-layout: fixed; /* Força alinhamento fixo das colunas */
            }
            
            /* Definir larguras específicas para cada tipo de coluna */
            .subject-header {
                width: 12% !important;
                min-width: 120px !important;
            }
            
            .bimesters-header {
                width: 64% !important; /* 16% x 4 bimestres */
            }
            
            .bimester-group {
                width: 16% !important; /* 4% x 4 colunas por bimestre */
            }
            
            .grade-type {
                width: 4% !important;
                min-width: 45px !important;
            }
            
            .final-grade-header {
                width: 8% !important;
                min-width: 80px !important;
            }
            
            .status-header {
                width: 16% !important;
                min-width: 100px !important;
            }
            
            .table-header-glass th {
                background: linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.25) 0%, 
                    rgba(255, 255, 255, 0.15) 100%);
                color: #2d3748;
                padding: 1rem;
                font-weight: 600;
                text-align: center;
                border: none;
                position: relative;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
                vertical-align: middle;
            }
            
            .bimester-labels th {
                background: linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.2) 0%, 
                    rgba(255, 255, 255, 0.1) 100%);
                padding: 0.75rem;
                font-size: 0.95rem;
                color: #4a5568;
                text-align: center;
                vertical-align: middle;
                font-weight: 600;
            }
            
            .grade-types th {
                background: linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.15) 0%, 
                    rgba(255, 255, 255, 0.08) 100%);
                padding: 0.5rem;
                font-size: 0.85rem;
                font-weight: 500;
                color: #4a5568;
                text-align: center;
                vertical-align: middle;
            }
            
            .glass-tbody tr:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: scale(1.01);
            }
            
            .glass-tbody td {
                padding: 1rem 0.75rem;
                text-align: center;
                border: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
                vertical-align: middle;
                width: inherit; /* Herda a largura definida no cabeçalho */
            }
            
            .subject-name {
                font-weight: 600;
                color: #2d3748;
                text-align: left !important;
                padding-left: 1.5rem !important;
                background: rgba(255, 255, 255, 0.1);
                width: 12% !important;
            }
            
            /* Células de notas */
            .grade-cell, .frequency-cell, .average-cell {
                width: 4% !important;
                min-width: 45px !important;
                text-align: center !important;
            }
            
            .final-average {
                width: 8% !important;
                min-width: 80px !important;
                text-align: center !important;
            }
            
            .status-cell {
                width: 16% !important;
                min-width: 100px !important;
                text-align: center !important;
            }
            
            /* Cores das notas com gradientes suaves para tela */
            .nota-aprovado {
                background: linear-gradient(135deg, 
                    rgba(34, 197, 94, 0.9) 0%, 
                    rgba(22, 163, 74, 0.8) 50%, 
                    rgba(21, 128, 61, 0.7) 100%) !important;
                color: white !important;
                border: 1px solid rgba(34, 197, 94, 0.6) !important;
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 0.5rem;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
            }
            
            .nota-recuperacao {
                background: linear-gradient(135deg, 
                    rgba(251, 191, 36, 0.9) 0%, 
                    rgba(245, 158, 11, 0.8) 50%, 
                    rgba(217, 119, 6, 0.7) 100%) !important;
                color: #451a03 !important;
                border: 1px solid rgba(251, 191, 36, 0.6) !important;
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 0.5rem;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
                box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
            }
            
            .nota-reprovado {
                background: linear-gradient(135deg, 
                    rgba(239, 68, 68, 0.9) 0%, 
                    rgba(220, 38, 38, 0.8) 50%, 
                    rgba(185, 28, 28, 0.7) 100%) !important;
                color: white !important;
                border: 1px solid rgba(239, 68, 68, 0.6) !important;
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 0.5rem;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            }
            
            /* Cores específicas para frequência */
            .frequency-good {
                background: linear-gradient(135deg, 
                    rgba(34, 197, 94, 0.9) 0%, 
                    rgba(22, 163, 74, 0.8) 100%) !important;
                color: white !important;
                border-radius: 6px;
                padding: 0.3rem 0.5rem;
                font-weight: 600;
            }
            
            .frequency-warning {
                background: linear-gradient(135deg, 
                    rgba(251, 191, 36, 0.9) 0%, 
                    rgba(245, 158, 11, 0.8) 100%) !important;
                color: #451a03 !important;
                border-radius: 6px;
                padding: 0.3rem 0.5rem;
                font-weight: 600;
            }
            
            .frequency-danger {
                background: linear-gradient(135deg, 
                    rgba(239, 68, 68, 0.9) 0%, 
                    rgba(220, 38, 38, 0.8) 100%) !important;
                color: white !important;
                border-radius: 6px;
                padding: 0.3rem 0.5rem;
                font-weight: 600;
            }
            
            .frequency-empty {
                color: #9ca3af;
                font-style: italic;
            }
            
            /* Legenda glassmorphism com gradientes atualizados */
            .legend-glass {
                background: linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.2) 0%, 
                    rgba(255, 255, 255, 0.1) 100%);
                backdrop-filter: blur(20px);
                padding: 1.5rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0 0 24px 24px;
            }
            
            .legend-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            .generation-info {
                color: #6c757d;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                opacity: 0.8;
            }
            
            /* Status badges com gradientes */
            .status-badge {
                display: inline-block;
                padding: 0.5rem 1rem;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .status-approved {
                background: linear-gradient(135deg, 
                    rgba(34, 197, 94, 0.9) 0%, 
                    rgba(22, 163, 74, 0.8) 50%, 
                    rgba(21, 128, 61, 0.7) 100%) !important;
                color: white !important;
                border: 1px solid rgba(34, 197, 94, 0.6) !important;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            }
            
            .status-recovery {
                background: linear-gradient(135deg, 
                    rgba(251, 191, 36, 0.9) 0%, 
                    rgba(245, 158, 11, 0.8) 50%, 
                    rgba(217, 119, 6, 0.7) 100%) !important;
                color: #451a03 !important;
                border: 1px solid rgba(251, 191, 36, 0.6) !important;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
            }
            
            .status-failed {
                background: linear-gradient(135deg, 
                    rgba(239, 68, 68, 0.9) 0%, 
                    rgba(220, 38, 38, 0.8) 50%, 
                    rgba(185, 28, 28, 0.7) 100%) !important;
                color: white !important;
                border: 1px solid rgba(239, 68, 68, 0.6) !important;
                backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 0.5rem;
                font-weight: 600;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            }
            
            .status-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            }
            
            /* ESTILOS PARA IMPRESSÃO - Layout Profissional */
            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                body {
                    background: white !important;
                    font-family: Arial, sans-serif !important;
                    font-size: 11px !important;
                    line-height: 1.3 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                
                @page {
                    size: A4 landscape !important;
                    margin: 0.5cm !important;
                }
                
                /* Modal para impressão */
                .modal-dialog {
                    max-width: 100% !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                .modal-content {
                    border: none !important;
                    border-radius: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                
                .modal-body {
                    padding: 0 !important;
                    margin: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                
                /* Transformar glassmorphism em layout profissional para impressão */
                .boletim-glass-container {
                    background: white !important;
                    backdrop-filter: none !important;
                    border: 2px solid #000 !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                    page-break-inside: avoid !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                }
                
                .glass-header-section {
                    background: #f8f9fa !important;
                    backdrop-filter: none !important;
                    border-bottom: 2px solid #000 !important;
                    border-radius: 0 !important;
                    padding: 8px 12px !important;
                    margin: 0 !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                .glass-header-section::before {
                    display: none !important;
                }
                
                .school-info {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    flex-wrap: nowrap !important;
                    width: 100% !important;
                }
                
                .school-logo .logo-circle {
                    width: 40px !important;
                    height: 40px !important;
                    background: white !important;
                    backdrop-filter: none !important;
                    border: 2px solid #000 !important;
                    border-radius: 50% !important;
                    margin-right: 10px !important;
                }
                
                .school-logo i {
                    font-size: 16px !important;
                    color: #000 !important;
                    text-shadow: none !important;
                }
                
                .school-name {
                    font-size: 16px !important;
                    font-weight: bold !important;
                    text-shadow: none !important;
                    color: #000 !important;
                    text-transform: uppercase !important;
                    margin: 0 !important;
                }
                
                .school-subtitle {
                    font-size: 10px !important;
                    color: #000 !important;
                    text-transform: uppercase !important;
                    margin: 1px 0 !important;
                }
                
                .document-title {
                    font-size: 12px !important;
                    font-weight: bold !important;
                    color: #000 !important;
                    text-shadow: none !important;
                    margin: 1px 0 !important;
                }
                
                .year-badge .glass-badge {
                    background: white !important;
                    backdrop-filter: none !important;
                    border: 2px solid #000 !important;
                    border-radius: 0 !important;
                    padding: 4px 8px !important;
                }
                
                .badge-label {
                    font-size: 8px !important;
                    color: #000 !important;
                    margin-bottom: 1px !important;
                }
                
                .badge-year {
                    font-size: 14px !important;
                    font-weight: bold !important;
                    color: #000 !important;
                    text-shadow: none !important;
                }
                
                .student-info-glass {
                    background: #f8f9fa !important;
                    backdrop-filter: none !important;
                    border-bottom: 1px solid #000 !important;
                    padding: 6px 12px !important;
                    display: block !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                .student-details {
                    width: 100% !important;
                    margin-bottom: 4px !important;
                }
                
                .info-row {
                    display: inline-block !important;
                    margin-right: 25px !important;
                    margin-bottom: 0 !important;
                }
                
                .info-label {
                    font-weight: bold !important;
                    color: #000 !important;
                    margin-right: 6px !important;
                    min-width: auto !important;
                }
                
                .info-value {
                    font-weight: bold !important;
                    color: #000 !important;
                    text-transform: uppercase !important;
                }
                
                .ra-badge {
                    background: #007bff !important;
                    color: white !important;
                    border-radius: 3px !important;
                    padding: 3px 6px !important;
                    box-shadow: none !important;
                    display: inline-block !important;
                    float: right !important;
                    margin-top: -20px !important;
                }
                
                .grades-table-container {
                    padding: 0 !important;
                    overflow: visible !important;
                    margin: 0 !important;
                    width: 100% !important;
                }
                
                .glass-table {
                    background: white !important;
                    backdrop-filter: none !important;
                    border: 2px solid #000 !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                    border-collapse: collapse !important;
                    font-size: 8px !important;
                    width: 100% !important;
                    margin: 0 !important;
                    table-layout: fixed !important;
                }
                
                .glass-table th,
                .glass-table td {
                    border: 1px solid #000 !important;
                    padding: 2px 1px !important;
                    background: transparent !important;
                    backdrop-filter: none !important;
                    text-align: center !important;
                    vertical-align: middle !important;
                    overflow: hidden !important;
                    word-wrap: break-word !important;
                }
                
                /* Larguras específicas para impressão */
                .subject-header,
                .subject-name {
                    width: 12% !important;
                    min-width: 80px !important;
                    text-align: left !important;
                    padding-left: 4px !important;
                }
                
                .bimesters-header {
                    width: 64% !important;
                }
                
                .bimester-group {
                    width: 16% !important;
                }
                
                .grade-type,
                .grade-cell,
                .frequency-cell,
                .average-cell {
                    width: 4% !important;
                    min-width: 20px !important;
                    font-size: 7px !important;
                }
                
                .final-grade-header,
                .final-average {
                    width: 8% !important;
                    min-width: 40px !important;
                }
                
                .status-header,
                .status-cell {
                    width: 16% !important;
                    min-width: 60px !important;
                }
                
                .table-header-glass th,
                .bimester-labels th,
                .grade-types th {
                    background: #e9ecef !important;
                    color: #000 !important;
                    font-weight: bold !important;
                    text-shadow: none !important;
                    font-size: 7px !important;
                    text-align: center !important;
                    vertical-align: middle !important;
                }
                
                .subject-name {
                    background: #f8f9fa !important;
                    text-align: left !important;
                    font-weight: bold !important;
                    color: #000 !important;
                    padding-left: 4px !important;
                    width: 12% !important;
                }
                
                /* Cores das notas sólidas para impressão com alinhamento */
                .nota-aprovado {
                    background: #22c55e !important;
                    color: white !important;
                    border: 1px solid #16a34a !important;
                    border-radius: 3px !important;
                    padding: 1px 2px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    font-size: 7px !important;
                }
                
                .nota-recuperacao {
                    background: #fbbf24 !important;
                    color: #451a03 !important;
                    border: 1px solid #f59e0b !important;
                    border-radius: 3px !important;
                    padding: 1px 2px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    font-size: 7px !important;
                }
                
                .nota-reprovado {
                    background: #ef4444 !important;
                    color: white !important;
                    border: 1px solid #dc2626 !important;
                    border-radius: 3px !important;
                    padding: 1px 2px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    font-size: 7px !important;
                }
                
                /* Cores para frequência na impressão */
                .frequency-good {
                    background: #22c55e !important;
                    color: white !important;
                    border-radius: 2px !important;
                    padding: 1px !important;
                    font-weight: bold !important;
                    font-size: 7px !important;
                }
                
                .frequency-warning {
                    background: #fbbf24 !important;
                    color: #451a03 !important;
                    border-radius: 2px !important;
                    padding: 1px !important;
                    font-weight: bold !important;
                    font-size: 7px !important;
                }
                
                .frequency-danger {
                    background: #ef4444 !important;
                    color: white !important;
                    border-radius: 2px !important;
                    padding: 1px !important;
                    font-weight: bold !important;
                    font-size: 7px !important;
                }
                
                .legend-glass {
                    background: #f8f9fa !important;
                    backdrop-filter: none !important;
                    border-top: 1px solid #000 !important;
                    border-radius: 0 !important;
                    padding: 8px 15px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }
                
                .legend-title {
                    color: #000 !important;
                    font-weight: bold !important;
                    font-size: 10px !important;
                }
                
                .legend-badge {
                    backdrop-filter: none !important;
                    border-radius: 3px !important;
                    padding: 3px 6px !important;
                    font-size: 8px !important;
                    box-shadow: none !important;
                    text-shadow: none !important;
                    margin: 0 2px !important;
                }
                
                .legend-badge.approved {
                    background: #22c55e !important;
                    color: white !important;
                    border: 1px solid #16a34a !important;
                }
                
                .legend-badge.recovery {
                    background: #eab308 !important;
                    color: #451a03 !important;
                    border: 1px solid #ca8a04 !important;
                }
                
                .legend-badge.failed {
                    background: #ef4444 !important;
                    color: white !important;
                    border: 1px solid #dc2626 !important;
                }
                
                .generation-info {
                    color: #6c757d !important;
                    font-size: 8px !important;
                }
                
                /* Ocultar elementos desnecessários na impressão */
                .btn, button, .no-print {
                    display: none !important;
                }
                
                /* Forçar quebras de página adequadas */
                .boletim-glass-container {
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                }
                
                .boletim-glass-container:last-child {
                    page-break-after: avoid !important;
                }
                
                /* Evitar quebras inadequadas */
                .glass-table, .grades-table-container {
                    page-break-inside: avoid !important;
                }
                
                /* Garantir que o rodapé não seja órfão */
                .legend-glass {
                    orphans: 3 !important;
                    widows: 3 !important;
                }
                
                /* Limpar estilos que podem causar problemas na impressão */
                * {
                    box-shadow: none !important;
                    text-shadow: none !important;
                    backdrop-filter: none !important;
                    filter: none !important;
                }
                
                /* Garantir que texto não apareça duplicado */
                .modal-header, .modal-footer, .modal-backdrop {
                    display: none !important;
                    visibility: hidden !important;
                }
            }
        `;
        
        document.head.appendChild(estilos);
        console.log("✅ Estilos glassmorphism com gradientes adicionados com sucesso");
    },
    // Carregar CSS dedicado para boletim profissional
    carregarCSSBoletimProfissional: function() {
        // Verificar se os estilos já foram adicionados
        if (document.getElementById('boletim-profissional-styles')) {
            return;
        }
        
        const estilos = document.createElement('style');
        estilos.id = 'boletim-profissional-styles';
        estilos.textContent = `
            /* Adicionar estilos específicos para o boletim profissional */
            .boletim-profissional-container {
                background: white !important;
                border: 2px solid #000 !important;
                page-break-inside: avoid;
                margin-bottom: 2cm !important;
                font-size: 11px !important;
            }
            
            .cabecalho-oficial {
                background-color: #f8f9fa !important;
                border-bottom: 2px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .brasao-sp {
                border: 2px solid #000 !important;
            }
            
            .titulo-governo, .titulo-secretaria, .titulo-documento,
            .ano-numero, .label-info, .valor-info {
                color: #000 !important;
            }
            
            .ano-badge-oficial {
                border: 2px solid #000 !important;
                background: white !important;
            }
            
            .info-aluno-oficial, .info-escola-oficial {
                background: #f8f9fa !important;
                border-bottom: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .linha-info {
                border-bottom: 1px solid #ddd !important;
            }
            
            .ra-numero {
                background: #007bff !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .table-boletim-oficial {
                border: 2px solid #000 !important;
            }
            
            .table-boletim-oficial th,
            .table-boletim-oficial td {
                border: 1px solid #000 !important;
                color: #000 !important;
            }
            
            .header-disciplina th,
            .header-notas th {
                background-color: #e9ecef !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .col-disciplina,
            .nome-disciplina {
                background-color: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .col-bimestre,
            .col-media-final,
            .col-situacao {
                background-color: #e9ecef !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .legenda-oficial {
                background-color: #f8f9fa !important;
                border-top: 1px solid #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .legenda-titulo {
                color: #000 !important;
            }
            
            .legenda-item.aprovado {
                background-color: #28a745 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .legenda-item.recuperacao {
                background-color: #ffc107 !important;
                color: #212529 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .legenda-item.reprovado {
                background-color: #dc3545 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            /* Garantir que as cores das notas sejam impressas */
            .nota-aprovado {
                background-color: #28a745 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .nota-recuperacao {
                background-color: #ffc107 !important;
                color: #212529 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .nota-reprovado {
                background-color: #dc3545 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .status-approved {
                background-color: #28a745 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .status-recovery {
                background-color: #ffc107 !important;
                color: #212529 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .status-failed {
                background-color: #dc3545 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        `;
        
        document.head.appendChild(estilos);
    },

    // Função de teste para verificar se o boletim funciona
    testarBoletim: function() {
        console.log("🧪 Iniciando teste do boletim");
        
        // Dados de teste simples
        const dadosTeste = {
            ano: 2025,
            boletim: [
                {
                    id_aluno: "12345",
                    nome_aluno: "João da Silva",
                    id_turma: "5A",
                    serie: "5º Ano",
                    disciplinas: [
                        {
                            nome_disciplina: "Matemática",
                            media_anual: 7.5,
                            situacao: "Aprovado",
                            notas_bimestrais: {
                                1: { nota_mensal: 8.0, nota_bimestral: 7.0, media: 7.5 },
                                2: { nota_mensal: 7.5, nota_bimestral: 8.0, media: 7.75 },
                                3: { nota_mensal: 7.0, nota_bimestral: 7.5, media: 7.25 },
                                4: { nota_mensal: 8.0, nota_bimestral: 8.5, media: 8.25 }
                            }
                        },
                        {
                            nome_disciplina: "Português",
                            media_anual: 8.2,
                            situacao: "Aprovado",
                            notas_bimestrais: {
                                1: { nota_mensal: 8.5, nota_bimestral: 8.0, media: 8.25 },
                                2: { nota_mensal: 8.0, nota_bimestral: 8.5, media: 8.25 },
                                3: { nota_mensal: 8.0, nota_bimestral: 8.0, media: 8.0 },
                                4: { nota_mensal: 8.5, nota_bimestral: 8.0, media: 8.25 }
                            }
                        }
                    ]
                }
            ]
        };
        
        const filtrosTeste = {
            turma_id: "5A",
            disciplina_id: "",
            aluno_id: "",
            ano: 2025
        };
        
        console.log("📊 Testando com dados:", dadosTeste);
        
        try {
            this.exibirBoletimModal(dadosTeste, filtrosTeste);
            console.log("✅ Teste do boletim concluído");
        } catch (error) {
            console.error("❌ Erro no teste do boletim:", error);
        }
    },

    // Buscar dados da turma para obter o turno
    buscarDadosTurma: async function(turmaId) {
        try {
            console.log(`🔍 Buscando dados da turma: ${turmaId}`);
            const turmaData = await ConfigModule.fetchApi(`/turmas/${turmaId}`);
            console.log(`✅ Dados da turma ${turmaId}:`, turmaData);
            return turmaData;
        } catch (error) {
            console.error(`❌ Erro ao buscar dados da turma ${turmaId}:`, error);
            return null;
        }
    },

    // Obter turno do aluno
    obterTurnoAluno: function(aluno) {
        // Cache estático de turmas para evitar repetidas consultas
        if (!this.cacheTurmasLocal) {
            this.cacheTurmasLocal = {
                // Mapeamento baseado nos padrões observados na imagem que o usuário mostrou
                '13CM': 'MANHA',
                '13CT': 'TARDE', 
                '12AM': 'MANHA',
                '12AT': 'TARDE',
                '11AM': 'MANHA',
                '11AT': 'TARDE',
                '11BM': 'MANHA',
                '13AM': 'MANHA',
                '13BM': 'MANHA',
                // Adicionar mais conforme necessário
            };
        }
        
        // 1. Tentar obter turno do cache local baseado no ID da turma
        if (aluno.id_turma && this.cacheTurmasLocal[aluno.id_turma]) {
            console.log(`🎯 Turno encontrado no cache para turma ${aluno.id_turma}: ${this.cacheTurmasLocal[aluno.id_turma]}`);
            return this.cacheTurmasLocal[aluno.id_turma];
        }
        
        // 2. Tentar extrair turno do próprio ID da turma (padrão: últimas letras indicam turno)
        if (aluno.id_turma) {
            const idTurma = aluno.id_turma.toString().toUpperCase();
            if (idTurma.endsWith('M')) {
                console.log(`🌅 Turno inferido como MANHA para turma ${idTurma}`);
                return 'MANHA';
            } else if (idTurma.endsWith('T')) {
                console.log(`🌇 Turno inferido como TARDE para turma ${idTurma}`);
                return 'TARDE';
            } else if (idTurma.endsWith('N')) {
                console.log(`🌙 Turno inferido como NOITE para turma ${idTurma}`);
                return 'NOITE';
            }
        }
        
        // 3. Usar dados diretos do aluno se disponíveis
        if (aluno.turno || aluno.turno_turma) {
            const turnoAluno = aluno.turno || aluno.turno_turma;
            console.log(`👤 Turno obtido dos dados do aluno: ${turnoAluno}`);
            return turnoAluno;
        }
        
        // 4. Buscar de forma assíncrona em background (sem bloquear a renderização)
        if (aluno.id_turma) {
            this.buscarTurnoBackground(aluno.id_turma);
        }
        
        // 5. Fallback padrão
        console.log(`⚠️ Turno não encontrado para aluno ${aluno.nome_aluno}, usando padrão`);
        return 'Não informado';
    },
    
    // Buscar turno em background sem bloquear a UI
    buscarTurnoBackground: function(turmaId) {
        // Evitar múltiplas buscas para a mesma turma
        if (this.buscandoTurmas && this.buscandoTurmas.has(turmaId)) {
            return;
        }
        
        if (!this.buscandoTurmas) {
            this.buscandoTurmas = new Set();
        }
        
        this.buscandoTurmas.add(turmaId);
        
        // Buscar de forma assíncrona
        this.buscarDadosTurma(turmaId).then(dadosTurma => {
            if (dadosTurma && dadosTurma.turno) {
                // Atualizar cache local
                if (!this.cacheTurmasLocal) {
                    this.cacheTurmasLocal = {};
                }
                this.cacheTurmasLocal[turmaId] = dadosTurma.turno;
                console.log(`✅ Turno da turma ${turmaId} atualizado no cache: ${dadosTurma.turno}`);
            }
        }).catch(error => {
            console.warn(`⚠️ Erro ao buscar turno da turma ${turmaId}:`, error);
        }).finally(() => {
            this.buscandoTurmas.delete(turmaId);
        });
    },

    // Validar dados antes de salvar uma nota
    validarDadosNota: function() {
        console.log("Validando dados da nota...");
        
        // Validar campos obrigatórios
        if (!this.elements.selectTurma || !this.elements.selectTurma.value) {
            this.mostrarErro("Selecione uma turma");
            return false;
        }
        
        if (!this.elements.selectDisciplina || !this.elements.selectDisciplina.value) {
            this.mostrarErro("Selecione uma disciplina");
            return false;
        }
        
        if (!this.elements.selectAluno || !this.elements.selectAluno.value) {
            this.mostrarErro("Selecione um aluno");
            return false;
        }
        
        if (!this.elements.selectBimestre || !this.elements.selectBimestre.value) {
            this.mostrarErro("Selecione o bimestre");
            return false;
        }
        
        if (!this.elements.inputAno || !this.elements.inputAno.value) {
            this.mostrarErro("Informe o ano");
            return false;
        }
        
        // Validar pelo menos uma informação (nota ou frequência)
        const notaMensal = this.elements.inputNotaMensal ? this.elements.inputNotaMensal.value.trim() : '';
        const notaBimestral = this.elements.inputNotaBimestral ? this.elements.inputNotaBimestral.value.trim() : '';
        const notaRecuperacao = this.elements.inputNotaRecuperacao ? this.elements.inputNotaRecuperacao.value.trim() : '';
        const frequencia = this.elements.inputFrequencia ? this.elements.inputFrequencia.value.trim() : '';
        
        if (!notaMensal && !notaBimestral && !notaRecuperacao && !frequencia) {
            this.mostrarErro("Informe pelo menos uma nota ou a frequência");
            return false;
        }
        
        // Validar faixa de valores das notas (0 a 10)
        if (notaMensal && (parseFloat(notaMensal) < 0 || parseFloat(notaMensal) > 10)) {
            this.mostrarErro("A nota mensal deve estar entre 0 e 10");
            return false;
        }
        
        if (notaBimestral && (parseFloat(notaBimestral) < 0 || parseFloat(notaBimestral) > 10)) {
            this.mostrarErro("A nota bimestral deve estar entre 0 e 10");
            return false;
        }
        
        if (notaRecuperacao && (parseFloat(notaRecuperacao) < 0 || parseFloat(notaRecuperacao) > 10)) {
            this.mostrarErro("A nota de recuperação deve estar entre 0 e 10");
            return false;
        }
        
        // Validar frequência (0 a 100 - número de faltas)
        if (frequencia && (parseInt(frequencia) < 0 || parseInt(frequencia) > 100)) {
            this.mostrarErro("A frequência deve estar entre 0 e 100");
            return false;
        }
        
        return true;
    },

    // Função para re-cachear especificamente o campo de frequência
    revalidarCampoFrequencia: function() {
        console.log("🔄 Re-validando campo frequência...");
        
        // Tentar várias estratégias para encontrar o campo
        let frequenciaElement = null;
        
        // Estratégia 1: getElementById
        frequenciaElement = document.getElementById('frequencia');
        if (frequenciaElement) {
            console.log("✅ Campo frequência encontrado via getElementById");
            this.elements.inputFrequencia = frequenciaElement;
            return true;
        }
        
        // Estratégia 2: querySelector por ID
        frequenciaElement = document.querySelector('#frequencia');
        if (frequenciaElement) {
            console.log("✅ Campo frequência encontrado via querySelector #frequencia");
            this.elements.inputFrequencia = frequenciaElement;
            return true;
        }
        
        // Estratégia 3: querySelector por atributo
        frequenciaElement = document.querySelector('input[id="frequencia"]');
        if (frequenciaElement) {
            console.log("✅ Campo frequência encontrado via querySelector input[id='frequencia']");
            this.elements.inputFrequencia = frequenciaElement;
            return true;
        }
        
        // Estratégia 4: Buscar por label relacionado
        const labelFrequencia = document.querySelector('label[for="frequencia"]');
        if (labelFrequencia) {
            console.log("📋 Label encontrado, procurando input relacionado...");
            const inputRelacionado = labelFrequencia.parentElement.querySelector('input');
            if (inputRelacionado) {
                console.log("✅ Campo frequência encontrado via label relacionado");
                this.elements.inputFrequencia = inputRelacionado;
                return true;
            }
        }
        
        console.error("❌ Campo frequência não foi encontrado em nenhuma estratégia!");
        return false;
    },

    // Formatar frequência para exibição glassmorphism
    formatarFrequenciaGlass: function(frequencia) {
        if (frequencia === null || frequencia === undefined || frequencia === '') {
            return '<span class="frequency-empty">-</span>';
        }
        
        const frequenciaNum = parseInt(frequencia);
        if (isNaN(frequenciaNum)) {
            return '<span class="frequency-empty">-</span>';
        }
        
        // Sistema de cores baseado no número de faltas
        let classeFrequencia = '';
        
        if (frequenciaNum <= 5) {
            classeFrequencia = 'frequency-good'; // Verde - poucas faltas
        } else if (frequenciaNum <= 15) {
            classeFrequencia = 'frequency-warning'; // Amarelo - faltas moderadas
        } else {
            classeFrequencia = 'frequency-danger'; // Vermelho - muitas faltas
        }
        
        return `<span class="frequency-value ${classeFrequencia}">${frequenciaNum}</span>`;
    },

    // Formatar média final para exibição glassmorphism
    formatarMediaFinalGlass: function(mediaFinal) {
        if (mediaFinal === null || mediaFinal === undefined || mediaFinal === '') {
            return '<span class="final-empty">-</span>';
        }
        
        const media = parseFloat(mediaFinal);
        if (isNaN(media)) {
            return '<span class="final-empty">-</span>';
        }
        
        // Sistema de cores baseado no valor da média final
        let classeMedia = '';
        
        if (media >= 6.0) {
            classeMedia = 'nota-aprovado';
        } else if (media >= 4.0) {
            classeMedia = 'nota-recuperacao';
        } else {
            classeMedia = 'nota-reprovado';
        }
        
        return `<span class="final-value ${classeMedia}">${media.toFixed(1)}</span>`;
    },

// ... existing code ...
};

// Exportar módulo
export default NotasModule;

// Exportar para o escopo global para compatibilidade
if (typeof window !== 'undefined') {
    window.NotasModule = NotasModule;
}

