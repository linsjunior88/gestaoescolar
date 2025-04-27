/**
 * Módulo de Alunos
 * Contém todas as funções relacionadas à gestão de alunos
 */

import ConfigModule from './config.js';

// Namespace para evitar conflitos
const AlunosModule = {
    // Estado do módulo
    state: {
        alunos: [],
        alunoSelecionado: null,
        modoEdicao: false,
        turmas: [], // Para o select de turmas
        disciplinas: [], // Para o select de disciplinas
        alunosFiltrados: [], // Para armazenar os alunos de uma turma específica
        disciplinasTurma: [], // Disciplinas de uma turma específica
        ordenacao: {
            coluna: 'nome', // Ordenação padrão por nome
            direcao: 'asc' // Direção ascendente
        }
    },
    
    // Elementos DOM
    elements: {
        listaAlunos: null,
        formAluno: null,
        inputNomeAluno: null,
        selectSexoAluno: null,
        inputDataNasc: null,
        inputMaeAluno: null,
        selectTurma: null,
        btnSalvarAluno: null,
        btnCancelarAluno: null,
        btnNovoAluno: null,
        filtroTurma: null,
        filtroDisciplina: null,
        filtroAlunoNome: null,
        btnFiltrar: null
    },
    
    // Inicializar módulo
    init: async function() {
        console.log("Inicializando módulo de alunos");
        this.cachearElementos();
        this.adicionarEventListeners();
        await this.carregarTurmas();
        // Não carregaremos todos os alunos no início, apenas quando um filtro for aplicado
    },
    
    // Cachear elementos DOM para melhor performance
    cachearElementos: function() {
        this.elements.listaAlunos = document.getElementById('lista-alunos');
        this.elements.formAluno = document.getElementById('form-aluno');
        this.elements.inputNomeAluno = document.getElementById('nome-aluno');
        this.elements.selectSexoAluno = document.getElementById('sexo-aluno');
        this.elements.inputDataNasc = document.getElementById('data-nasc');
        this.elements.inputMaeAluno = document.getElementById('mae-aluno');
        this.elements.selectTurma = document.getElementById('turma-aluno');
        this.elements.btnSalvarAluno = document.getElementById('btn-salvar-aluno');
        this.elements.btnCancelarAluno = document.getElementById('btn-cancelar-aluno');
        this.elements.btnNovoAluno = document.getElementById('btn-novo-aluno');
        this.elements.filtroTurma = document.getElementById('filtro-turma');
        this.elements.filtroDisciplina = document.getElementById('filtro-disciplina');
        this.elements.filtroAlunoNome = document.getElementById('filtro-aluno-nome');
        this.elements.btnFiltrar = document.getElementById('btn-filtrar-alunos');
    },
    
    // Adicionar event listeners
    adicionarEventListeners: function() {
        if (this.elements.formAluno) {
            this.elements.formAluno.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarAluno();
            });
        }
        
        if (this.elements.btnCancelarAluno) {
            this.elements.btnCancelarAluno.addEventListener('click', () => {
                this.cancelarEdicao();
            });
        }
        
        if (this.elements.btnNovoAluno) {
            this.elements.btnNovoAluno.addEventListener('click', () => {
                this.novoAluno();
            });
        }
        
        if (this.elements.btnFiltrar) {
            this.elements.btnFiltrar.addEventListener('click', () => {
                this.filtrarAlunos();
            });
        }
        
        // Evento para quando selecionar uma turma no filtro
        if (this.elements.filtroTurma) {
            this.elements.filtroTurma.addEventListener('change', () => {
                this.carregarDependenciasDoFiltro();
            });
        }
        
        // Adicionar ordenação aos cabeçalhos da tabela
        document.querySelectorAll('#lista-alunos-cabecalho th[data-ordenavel="true"]').forEach(th => {
            th.addEventListener('click', () => {
                const coluna = th.dataset.coluna;
                this.ordenarAlunos(coluna);
            });
            
            // Adicionar cursor pointer para indicar que é clicável
            th.style.cursor = 'pointer';
            
            // Adicionar ícone de ordenação
            const icone = document.createElement('i');
            icone.className = 'fas fa-sort ms-1';
            icone.style.opacity = '0.3';
            th.appendChild(icone);
        });
    },
    
    // Carregar turmas para o select
    carregarTurmas: async function() {
        try {
            const turmas = await ConfigModule.fetchApi('/turmas');
            this.state.turmas = turmas;
            this.popularSelectTurmas();
            console.log("Turmas carregadas com sucesso para o módulo de alunos:", turmas);
        } catch (error) {
            console.error("Erro ao carregar turmas para o módulo de alunos:", error);
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
    },
    
    // Carregar disciplinas de uma turma específica
    carregarDisciplinasDaTurma: async function(turmaId) {
        try {
            const disciplinas = await ConfigModule.fetchApi(`/turmas/${turmaId}/disciplinas`);
            this.state.disciplinasTurma = disciplinas;
            console.log(`Disciplinas da turma ${turmaId} carregadas:`, disciplinas);
            
            // Popular select de disciplinas
            this.elements.filtroDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
            
            disciplinas.forEach(disciplina => {
                const option = document.createElement('option');
                option.value = disciplina.id_disciplina;
                option.textContent = disciplina.nome_disciplina || disciplina.nome || disciplina.id_disciplina;
                this.elements.filtroDisciplina.appendChild(option);
            });
            
            // Habilitar o select de disciplinas
            this.elements.filtroDisciplina.disabled = false;
            
            return disciplinas;
        } catch (error) {
            console.error(`Erro ao carregar disciplinas da turma ${turmaId}:`, error);
            this.elements.filtroDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
            this.elements.filtroDisciplina.disabled = true;
            return [];
        }
    },
    
    // Carregar alunos de uma turma específica
    carregarAlunosDaTurma: async function(turmaId) {
        try {
            const alunos = await ConfigModule.fetchApi(`/turmas/${turmaId}/alunos`);
            this.state.alunosFiltrados = alunos;
            console.log(`Alunos da turma ${turmaId} carregados:`, alunos);
            
            // Popular select de alunos para filtro
            this.elements.filtroAlunoNome.innerHTML = '<option value="">Selecione um aluno</option>';
            
            alunos.forEach(aluno => {
                const option = document.createElement('option');
                option.value = aluno.id_aluno;
                option.textContent = aluno.nome_aluno || aluno.nome;
                this.elements.filtroAlunoNome.appendChild(option);
            });
            
            // Habilitar o select de alunos
            this.elements.filtroAlunoNome.disabled = false;
            
            return alunos;
        } catch (error) {
            console.error(`Erro ao carregar alunos da turma ${turmaId}:`, error);
            this.elements.filtroAlunoNome.innerHTML = '<option value="">Erro ao carregar alunos</option>';
            this.elements.filtroAlunoNome.disabled = true;
            return [];
        }
    },
    
    // Carregar dependências quando uma turma é selecionada no filtro
    carregarDependenciasDoFiltro: async function() {
        const turmaId = this.elements.filtroTurma.value;
        
        if (!turmaId) {
            // Se nenhuma turma for selecionada, desabilitar os outros filtros
            this.elements.filtroDisciplina.disabled = true;
            this.elements.filtroDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
            
            this.elements.filtroAlunoNome.disabled = true;
            this.elements.filtroAlunoNome.innerHTML = '<option value="">Selecione um aluno</option>';
            
            return;
        }
        
        // Carregar disciplinas e alunos da turma selecionada
        await Promise.all([
            this.carregarDisciplinasDaTurma(turmaId),
            this.carregarAlunosDaTurma(turmaId)
        ]);
    },
    
    // Filtrar alunos conforme os critérios selecionados
    filtrarAlunos: async function() {
        const turmaId = this.elements.filtroTurma.value;
        if (!turmaId) {
            this.mostrarErro("Selecione uma turma para filtrar os alunos.");
            return;
        }
        
        const disciplinaId = this.elements.filtroDisciplina.value;
        const alunoId = this.elements.filtroAlunoNome.value;
        
        try {
            let endpoint = `/turmas/${turmaId}/alunos`;
            let params = [];
            
            if (disciplinaId) {
                params.push(`disciplina_id=${disciplinaId}`);
            }
            
            if (alunoId) {
                params.push(`aluno_id=${alunoId}`);
            }
            
            if (params.length > 0) {
                endpoint += `?${params.join('&')}`;
            }
            
            const alunos = await ConfigModule.fetchApi(endpoint);
            this.state.alunos = alunos;
            this.renderizarAlunos();
            console.log("Alunos filtrados carregados com sucesso:", alunos);
        } catch (error) {
            console.error("Erro ao filtrar alunos:", error);
            this.mostrarErro("Não foi possível filtrar os alunos. Tente novamente mais tarde.");
        }
    },
    
    // Ordenar alunos
    ordenarAlunos: function(coluna) {
        // Se clicar na mesma coluna, inverte a direção
        if (coluna === this.state.ordenacao.coluna) {
            this.state.ordenacao.direcao = this.state.ordenacao.direcao === 'asc' ? 'desc' : 'asc';
        } else {
            // Se clicar em uma coluna diferente, usa essa coluna com direção ascendente
            this.state.ordenacao.coluna = coluna;
            this.state.ordenacao.direcao = 'asc';
        }
        
        // Atualizar ícones de ordenação
        this.atualizarIconesOrdenacao();
        
        // Renderizar alunos ordenados
        this.renderizarAlunos();
    },
    
    // Atualizar ícones de ordenação
    atualizarIconesOrdenacao: function() {
        document.querySelectorAll('#lista-alunos-cabecalho th[data-ordenavel="true"]').forEach(th => {
            const icone = th.querySelector('i');
            if (icone) {
                // Resetar todos os ícones primeiro
                icone.className = 'fas fa-sort ms-1';
                icone.style.opacity = '0.3';
                
                // Definir o ícone apropriado para a coluna de ordenação atual
                if (th.dataset.coluna === this.state.ordenacao.coluna) {
                    icone.className = this.state.ordenacao.direcao === 'asc' ? 
                        'fas fa-sort-up ms-1' : 'fas fa-sort-down ms-1';
                    icone.style.opacity = '1';
                }
            }
        });
    },
    
    // Aplicar ordenação à lista de alunos
    aplicarOrdenacao: function(alunos) {
        const coluna = this.state.ordenacao.coluna;
        const direcao = this.state.ordenacao.direcao;
        
        return [...alunos].sort((a, b) => {
            let valorA, valorB;
            
            if (coluna === 'turma') {
                const turmaA = this.state.turmas.find(t => 
                    (t.id_turma && t.id_turma === a.turma_id) || t.id === a.turma_id
                ) || { id_turma: '', serie: '' };
                
                const turmaB = this.state.turmas.find(t => 
                    (t.id_turma && t.id_turma === b.turma_id) || t.id === b.turma_id
                ) || { id_turma: '', serie: '' };
                
                valorA = turmaA.id_turma || '';
                valorB = turmaB.id_turma || '';
            } else if (coluna === 'id') {
                valorA = a.id_aluno || a.id || '';
                valorB = b.id_aluno || b.id || '';
            } else if (coluna === 'nome') {
                valorA = a.nome_aluno || a.nome || '';
                valorB = b.nome_aluno || b.nome || '';
            } else if (coluna === 'sexo') {
                valorA = a.sexo || '';
                valorB = b.sexo || '';
            } else if (coluna === 'data_nasc') {
                valorA = a.data_nasc || '';
                valorB = b.data_nasc || '';
            } else if (coluna === 'mae') {
                valorA = a.mae || '';
                valorB = b.mae || '';
            }
            
            // Converter para minúsculas para comparação case-insensitive
            if (typeof valorA === 'string') valorA = valorA.toLowerCase();
            if (typeof valorB === 'string') valorB = valorB.toLowerCase();
            
            // Ordenar
            if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
            if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // Renderizar lista de alunos
    renderizarAlunos: function() {
        if (!this.elements.listaAlunos) return;
        
        this.elements.listaAlunos.innerHTML = '';
        
        if (this.state.alunos.length === 0) {
            this.elements.listaAlunos.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum aluno encontrado. Use os filtros acima para buscar alunos.</td></tr>';
            return;
        }
        
        // Aplicar ordenação
        const alunosOrdenados = this.aplicarOrdenacao(this.state.alunos);
        
        // Atualizar ícones de ordenação
        this.atualizarIconesOrdenacao();
        
        alunosOrdenados.forEach(aluno => {
            // Encontrar informações da turma
            const turma = this.state.turmas.find(t => 
                (t.id_turma && t.id_turma === aluno.turma_id) || 
                t.id === aluno.turma_id
            ) || { id_turma: 'N/A' };
            
            // Formatar data de nascimento para exibição
            let dataNascFormatada = 'N/A';
            if (aluno.data_nasc) {
                try {
                    const dataNasc = new Date(aluno.data_nasc);
                    dataNascFormatada = dataNasc.toLocaleDateString('pt-BR');
                } catch (e) {
                    console.error("Erro ao formatar data:", e);
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${turma.id_turma || 'N/A'}</td>
                <td>${aluno.id_aluno || aluno.id || 'N/A'}</td>
                <td>${aluno.nome_aluno || aluno.nome || 'N/A'}</td>
                <td>${aluno.sexo === 'M' ? 'Masculino' : (aluno.sexo === 'F' ? 'Feminino' : 'N/A')}</td>
                <td>${dataNascFormatada}</td>
                <td>${aluno.mae || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary editar-aluno" data-id="${aluno.id_aluno || aluno.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger excluir-aluno" data-id="${aluno.id_aluno || aluno.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Adicionar event listeners para os botões
            const btnEditar = row.querySelector('.editar-aluno');
            const btnExcluir = row.querySelector('.excluir-aluno');
            
            btnEditar.addEventListener('click', () => this.editarAluno(aluno.id_aluno || aluno.id));
            btnExcluir.addEventListener('click', () => this.confirmarExclusao(aluno.id_aluno || aluno.id));
            
            this.elements.listaAlunos.appendChild(row);
        });
    },
    
    // Criar novo aluno
    novoAluno: function() {
        this.state.modoEdicao = false;
        this.state.alunoSelecionado = null;
        
        if (this.elements.formAluno) {
            this.elements.formAluno.reset();
            this.elements.formAluno.classList.remove('d-none');
        }
        
        if (this.elements.inputNomeAluno) {
            this.elements.inputNomeAluno.focus();
        }
    },
    
    // Editar aluno existente
    editarAluno: async function(id) {
        try {
            // Buscar informações detalhadas do aluno
            const aluno = await ConfigModule.fetchApi(`/alunos/${id}`);
            
            if (!aluno) {
                this.mostrarErro("Aluno não encontrado.");
                return;
            }
            
            this.state.modoEdicao = true;
            this.state.alunoSelecionado = aluno;
            
            if (this.elements.formAluno) {
                this.elements.formAluno.classList.remove('d-none');
                this.elements.inputNomeAluno.value = aluno.nome_aluno || aluno.nome || '';
                this.elements.selectSexoAluno.value = aluno.sexo || '';
                
                // Formatar data para o input do tipo date (YYYY-MM-DD)
                if (aluno.data_nasc) {
                    const dataNasc = new Date(aluno.data_nasc);
                    const dataFormatada = dataNasc.toISOString().split('T')[0]; // Formato YYYY-MM-DD
                    this.elements.inputDataNasc.value = dataFormatada;
                } else {
                    this.elements.inputDataNasc.value = '';
                }
                
                this.elements.inputMaeAluno.value = aluno.mae || '';
                this.elements.selectTurma.value = aluno.turma_id || '';
                this.elements.inputNomeAluno.focus();
            }
        } catch (error) {
            console.error("Erro ao editar aluno:", error);
            this.mostrarErro("Não foi possível carregar os dados do aluno para edição.");
        }
    },
    
    // Salvar aluno (criar novo ou atualizar existente)
    salvarAluno: async function() {
        try {
            // Verificar se a data de nascimento está em formato válido
            const dataNasc = this.elements.inputDataNasc.value;
            let dataFormatada = null;
            
            if (dataNasc) {
                dataFormatada = new Date(dataNasc);
                if (isNaN(dataFormatada.getTime())) {
                    this.mostrarErro("Data de nascimento inválida.");
                    return;
                }
            }
            
            const alunoDados = {
                nome_aluno: this.elements.inputNomeAluno.value,
                sexo: this.elements.selectSexoAluno.value,
                data_nasc: dataNasc, // Formato YYYY-MM-DD é aceito pela API
                mae: this.elements.inputMaeAluno.value,
                turma_id: this.elements.selectTurma.value
            };
            
            // Adicionar id_aluno se estivermos editando
            if (this.state.modoEdicao && this.state.alunoSelecionado) {
                alunoDados.id_aluno = this.state.alunoSelecionado.id_aluno || this.state.alunoSelecionado.id;
            }
            
            console.log("Salvando aluno com dados:", alunoDados);
            
            let response;
            
            if (this.state.modoEdicao && this.state.alunoSelecionado) {
                // Identificador para a API
                const alunoId = this.state.alunoSelecionado.id_aluno || this.state.alunoSelecionado.id;
                
                // Atualizar aluno existente
                response = await ConfigModule.fetchApi(`/alunos/${alunoId}`, {
                    method: 'PUT',
                    body: JSON.stringify(alunoDados)
                });
                
                this.mostrarSucesso("Aluno atualizado com sucesso!");
            } else {
                // Criar novo aluno
                response = await ConfigModule.fetchApi('/alunos', {
                    method: 'POST',
                    body: JSON.stringify(alunoDados)
                });
                
                this.mostrarSucesso("Aluno criado com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Recarregar lista de alunos se algum filtro estiver ativo
            if (this.elements.filtroTurma.value) {
                this.filtrarAlunos();
            }
            
        } catch (error) {
            console.error("Erro ao salvar aluno:", error);
            this.mostrarErro("Não foi possível salvar o aluno. Tente novamente mais tarde.");
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.alunoSelecionado = null;
        
        if (this.elements.formAluno) {
            this.elements.formAluno.reset();
            this.elements.formAluno.classList.add('d-none');
        }
    },
    
    // Confirmar exclusão de aluno
    confirmarExclusao: function(id) {
        if (confirm("Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.")) {
            this.excluirAluno(id);
        }
    },
    
    // Excluir aluno
    excluirAluno: async function(id) {
        try {
            const alunoId = id;
            
            await ConfigModule.fetchApi(`/alunos/${alunoId}`, {
                method: 'DELETE'
            });
            
            // Remover aluno da lista local
            this.state.alunos = this.state.alunos.filter(a => 
                (a.id_aluno !== alunoId) && (a.id !== alunoId)
            );
            
            // Atualizar lista de alunos
            this.renderizarAlunos();
            
            this.mostrarSucesso("Aluno excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir aluno:", error);
            this.mostrarErro("Não foi possível excluir o aluno. Tente novamente mais tarde.");
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
        
        document.querySelector('#conteudo-alunos').insertBefore(alertContainer, document.querySelector('#conteudo-alunos').firstChild);
        
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
        
        document.querySelector('#conteudo-alunos').insertBefore(alertContainer, document.querySelector('#conteudo-alunos').firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            alertContainer.remove();
        }, 5000);
    }
};

// Exportar módulo
export default AlunosModule;
