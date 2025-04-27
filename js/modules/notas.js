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
        await Promise.all([
            this.carregarTurmas(),
            this.carregarDisciplinas()
        ]);
        this.carregarNotas();
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
        
        // Listener para o select de turma para atualizar a lista de alunos
        if (this.elements.selectTurma) {
            this.elements.selectTurma.addEventListener('change', () => {
                this.carregarAlunosPorTurma(this.elements.selectTurma.value);
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
    
    // Carregar disciplinas para os selects
    carregarDisciplinas: async function() {
        try {
            const disciplinas = await ConfigModule.fetchApi('/disciplinas');
            this.state.disciplinas = disciplinas;
            this.popularSelectDisciplinas();
            console.log("Disciplinas carregadas com sucesso para o módulo de notas:", disciplinas);
        } catch (error) {
            console.error("Erro ao carregar disciplinas para o módulo de notas:", error);
            this.mostrarErro("Não foi possível carregar as disciplinas. Tente novamente mais tarde.");
        }
    },
    
    // Popular select de turmas
    popularSelectTurmas: function() {
        if (!this.elements.selectTurma || !this.elements.filtroTurma) return;
        
        // Limpar selects
        this.elements.selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
        this.elements.filtroTurma.innerHTML = '<option value="">Todas as turmas</option>';
        
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
    
    // Popular select de disciplinas
    popularSelectDisciplinas: function() {
        if (!this.elements.selectDisciplina || !this.elements.filtroDisciplina) return;
        
        // Limpar selects
        this.elements.selectDisciplina.innerHTML = '<option value="">Selecione uma disciplina</option>';
        this.elements.filtroDisciplina.innerHTML = '<option value="">Todas as disciplinas</option>';
        
        // Adicionar opções
        this.state.disciplinas.forEach(disciplina => {
            const option1 = document.createElement('option');
            option1.value = disciplina.id_disciplina || disciplina.id;
            option1.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
            this.elements.selectDisciplina.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = disciplina.id_disciplina || disciplina.id;
            option2.textContent = disciplina.nome_disciplina || disciplina.nome || 'N/A';
            this.elements.filtroDisciplina.appendChild(option2);
        });
    },
    
    // Carregar alunos por turma
    carregarAlunosPorTurma: async function(turmaId) {
        if (!turmaId) {
            this.state.alunos = [];
            this.popularSelectAlunos();
            return;
        }
        
        try {
            const alunos = await ConfigModule.fetchApi(`/alunos?turma_id=${turmaId}`);
            this.state.alunos = alunos;
            this.popularSelectAlunos();
            console.log("Alunos carregados com sucesso para a turma:", turmaId);
        } catch (error) {
            console.error("Erro ao carregar alunos para a turma:", turmaId, error);
            this.mostrarErro("Não foi possível carregar os alunos. Tente novamente mais tarde.");
        }
    },
    
    // Popular select de alunos
    popularSelectAlunos: function() {
        if (!this.elements.selectAluno || !this.elements.filtroAluno) return;
        
        // Limpar selects
        this.elements.selectAluno.innerHTML = '<option value="">Selecione um aluno</option>';
        
        // Também atualizar filtro de alunos, mantendo a opção todos
        if (this.elements.filtroAluno) {
            this.elements.filtroAluno.innerHTML = '<option value="">Todos os alunos</option>';
        }
        
        // Adicionar opções
        this.state.alunos.forEach(aluno => {
            const option1 = document.createElement('option');
            option1.value = aluno.id_aluno || aluno.id;
            option1.textContent = aluno.nome_aluno || aluno.nome || 'N/A';
            this.elements.selectAluno.appendChild(option1);
            
            if (this.elements.filtroAluno) {
                const option2 = document.createElement('option');
                option2.value = aluno.id_aluno || aluno.id;
                option2.textContent = aluno.nome_aluno || aluno.nome || 'N/A';
                this.elements.filtroAluno.appendChild(option2);
            }
        });
    },
    
    // Carregar notas da API
    carregarNotas: async function(filtros = {}) {
        try {
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
            
            const notas = await ConfigModule.fetchApi(endpoint);
            this.state.notas = notas;
            this.renderizarNotas();
            console.log("Notas carregadas com sucesso:", notas);
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
        
        this.carregarNotas(filtros);
    },
    
    // Renderizar lista de notas
    renderizarNotas: function() {
        if (!this.elements.listaNotas) return;
        
        this.elements.listaNotas.innerHTML = '';
        
        if (this.state.notas.length === 0) {
            this.elements.listaNotas.innerHTML = '<tr><td colspan="11" class="text-center">Nenhuma nota cadastrada</td></tr>';
            return;
        }
        
        this.state.notas.forEach(nota => {
            // Encontrar nomes de turma, disciplina e aluno
            const turma = this.state.turmas.find(t => 
                (t.id_turma && t.id_turma === nota.turma_id) || t.id === nota.turma_id
            ) || { serie: 'N/A', turno: 'N/A' };
            
            const disciplina = this.state.disciplinas.find(d => 
                (d.id_disciplina && d.id_disciplina === nota.disciplina_id) || d.id === nota.disciplina_id
            ) || { nome_disciplina: 'N/A' };
            
            // Buscar aluno na lista de alunos ou alunosFiltrados
            let aluno = { nome_aluno: 'N/A', nome: 'N/A' };
            const todosAlunos = [...this.state.alunos, ...this.state.alunosFiltrados];
            if (todosAlunos.length > 0) {
                const alunoEncontrado = todosAlunos.find(a => 
                    (a.id_aluno && a.id_aluno === nota.aluno_id) || a.id === nota.aluno_id
                );
                if (alunoEncontrado) {
                    aluno = alunoEncontrado;
                }
            }
            
            // Garantir que todas as propriedades numéricas existam para evitar erros
            const notaMensal = nota.nota_mensal !== undefined ? nota.nota_mensal : 0;
            const notaBimestral = nota.nota_bimestral !== undefined ? nota.nota_bimestral : 0;
            const notaRecuperacao = nota.nota_recuperacao !== undefined ? nota.nota_recuperacao : null;
            
            // Calcular a média final se não estiver definida
            let mediaFinal = nota.media_final;
            if (mediaFinal === undefined) {
                mediaFinal = (notaMensal + notaBimestral) / 2;
                if (notaRecuperacao !== null && notaRecuperacao > mediaFinal) {
                    mediaFinal = notaRecuperacao;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${nota.id || 'N/A'}</td>
                <td>${turma.serie || 'N/A'}</td>
                <td>${disciplina.nome_disciplina || disciplina.nome || 'N/A'}</td>
                <td>${aluno.nome_aluno || aluno.nome || 'N/A'}</td>
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
    calcularMediaLocal: function() {
        if (!this.elements.inputNotaMensal || !this.elements.inputNotaBimestral || !this.elements.spanMediaFinal) return;
        
        const notaMensal = parseFloat(this.elements.inputNotaMensal.value) || 0;
        const notaBimestral = parseFloat(this.elements.inputNotaBimestral.value) || 0;
        const notaRecuperacao = parseFloat(this.elements.inputNotaRecuperacao.value) || 0;
        
        let mediaFinal = (notaMensal + notaBimestral) / 2;
        
        // Se houver nota de recuperação e for maior que a média, substituir
        if (notaRecuperacao > 0 && notaRecuperacao > mediaFinal) {
            mediaFinal = notaRecuperacao;
        }
        
        this.elements.spanMediaFinal.textContent = mediaFinal.toFixed(1);
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
            this.elements.spanMediaFinal.textContent = '0.0';
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
    editarNota: function(id) {
        const nota = this.state.notas.find(n => n.id === id);
        if (!nota) return;
        
        this.state.modoEdicao = true;
        this.state.notaSelecionada = nota;
        
        // Carregar alunos da turma primeiro
        this.carregarAlunosPorTurma(nota.turma_id).then(() => {
            if (this.elements.formNota) {
                this.elements.formNota.classList.remove('d-none');
                this.elements.selectTurma.value = nota.turma_id;
                this.elements.selectDisciplina.value = nota.disciplina_id;
                this.elements.selectAluno.value = nota.aluno_id;
                this.elements.selectBimestre.value = nota.bimestre;
                this.elements.inputAno.value = nota.ano;
                this.elements.inputNotaMensal.value = nota.nota_mensal;
                this.elements.inputNotaBimestral.value = nota.nota_bimestral;
                this.elements.inputNotaRecuperacao.value = nota.nota_recuperacao || '';
                this.elements.spanMediaFinal.textContent = nota.media_final.toFixed(1);
                this.elements.selectTurma.focus();
            }
        });
    },
    
    // Salvar nota (criar nova ou atualizar existente)
    salvarNota: async function() {
        try {
            const notaDados = {
                turma_id: parseInt(this.elements.selectTurma.value),
                disciplina_id: parseInt(this.elements.selectDisciplina.value),
                aluno_id: parseInt(this.elements.selectAluno.value),
                bimestre: parseInt(this.elements.selectBimestre.value),
                ano: parseInt(this.elements.inputAno.value),
                nota_mensal: parseFloat(this.elements.inputNotaMensal.value),
                nota_bimestral: parseFloat(this.elements.inputNotaBimestral.value),
                nota_recuperacao: this.elements.inputNotaRecuperacao.value ? parseFloat(this.elements.inputNotaRecuperacao.value) : null
            };
            
            // Calcular média final
            let mediaFinal = (notaDados.nota_mensal + notaDados.nota_bimestral) / 2;
            if (notaDados.nota_recuperacao && notaDados.nota_recuperacao > mediaFinal) {
                mediaFinal = notaDados.nota_recuperacao;
            }
            notaDados.media_final = mediaFinal;
            
            let response;
            
            if (this.state.modoEdicao && this.state.notaSelecionada) {
                // Atualizar nota existente
                response = await ConfigModule.fetchApi(`/notas/${this.state.notaSelecionada.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(notaDados)
                });
                
                // Atualizar nota na lista local
                const index = this.state.notas.findIndex(n => n.id === this.state.notaSelecionada.id);
                if (index !== -1) {
                    this.state.notas[index] = { ...this.state.notas[index], ...notaDados };
                }
                
                this.mostrarSucesso("Nota atualizada com sucesso!");
            } else {
                // Criar nova nota
                response = await ConfigModule.fetchApi('/notas', {
                    method: 'POST',
                    body: JSON.stringify(notaDados)
                });
                
                // Adicionar nova nota à lista local
                this.state.notas.push(response);
                
                this.mostrarSucesso("Nota criada com sucesso!");
            }
            
            // Resetar formulário e estado
            this.cancelarEdicao();
            
            // Atualizar lista de notas
            this.renderizarNotas();
            
        } catch (error) {
            console.error("Erro ao salvar nota:", error);
            this.mostrarErro("Não foi possível salvar a nota. Tente novamente mais tarde.");
        }
    },
    
    // Cancelar edição
    cancelarEdicao: function() {
        this.state.modoEdicao = false;
        this.state.notaSelecionada = null;
        
        if (this.elements.formNota) {
            this.elements.formNota.reset();
            this.elements.formNota.classList.add('d-none');
            this.elements.spanMediaFinal.textContent = '0.0';
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
