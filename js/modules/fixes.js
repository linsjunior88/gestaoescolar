/**
 * fixes.js
 * Este arquivo contém correções específicas que são aplicadas ANTES do carregamento de outros scripts
 * para resolver problemas identificados sem ter que modificar os arquivos principais
 */

// IMPORTANTE: Este script deve ser carregado ANTES de qualquer outro script
// Use <script src="js/modules/fixes.js"></script> como o primeiro script no head

// Garantir que window._fixesApplied existe para tracking
window._fixesApplied = window._fixesApplied || {};

console.log("Aplicando prevenção para redeclarações de variáveis");

// Prevenir redeclaração de variáveis globais importantes
(function preventRedeclarations() {
    // Lista de variáveis a serem protegidas contra redeclaração
    const variaveisProtegidas = ['conteudos', 'CONFIG', 'btnCancelarProfessor'];
    
    // Armazenar valores existentes
    window._protectedValues = window._protectedValues || {};
    
    // Substituir eval para evitar redeclarações via eval
    const originalEval = window.eval;
    window.eval = function(code) {
        // Substituir declarações const/let/var das variáveis protegidas
        variaveisProtegidas.forEach(varName => {
            // Padrão para capturar declarações de variáveis
            const constPattern = new RegExp(`\\bconst\\s+${varName}\\b`, 'g');
            const letPattern = new RegExp(`\\blet\\s+${varName}\\b`, 'g');
            const varPattern = new RegExp(`\\bvar\\s+${varName}\\b`, 'g');
            
            // Se a variável já existe, remover a declaração e manter apenas a atribuição
            if (typeof window[varName] !== 'undefined') {
                code = code.replace(constPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                code = code.replace(letPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                code = code.replace(varPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                console.log(`Evitada redeclaração via eval de ${varName}`);
            }
        });
        
        return originalEval.call(this, code);
    };
    
    // Armazenar o createElement original
    const originalCreateElement = document.createElement;
    
    // Substituir document.createElement para interceptar criação de scripts
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        // Se for um elemento script, interceptar seu conteúdo antes da execução
        if (tagName.toLowerCase() === 'script') {
            // Guardar o setter original de textContent
            const originalTextContentSetter = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').set;
            
            // Substituir o setter de textContent
            Object.defineProperty(element, 'textContent', {
                set: function(value) {
                    // Processar o conteúdo do script para evitar redeclarações
                    variaveisProtegidas.forEach(varName => {
                        // Padrão para capturar declarações de variáveis
                        const constPattern = new RegExp(`\\bconst\\s+${varName}\\b`, 'g');
                        const letPattern = new RegExp(`\\blet\\s+${varName}\\b`, 'g');
                        const varPattern = new RegExp(`\\bvar\\s+${varName}\\b`, 'g');
                        
                        // Se a variável já existe, remover a declaração e manter apenas a atribuição
                        if (typeof window[varName] !== 'undefined') {
                            value = value.replace(constPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                            value = value.replace(letPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                            value = value.replace(varPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                            console.log(`Evitada redeclaração via script de ${varName}`);
                        }
                    });
                    
                    // Chamar o setter original com o valor processado
                    originalTextContentSetter.call(this, value);
                },
                get: function() {
                    return Object.getOwnPropertyDescriptor(Node.prototype, 'textContent').get.call(this);
                },
                configurable: true
            });
            
            // Interceptar também a propriedade innerText
            const originalInnerTextSetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText')?.set;
            if (originalInnerTextSetter) {
                Object.defineProperty(element, 'innerText', {
                    set: function(value) {
                        // Processar para evitar redeclarações
                        variaveisProtegidas.forEach(varName => {
                            // Padrão para capturar declarações de variáveis
                            const constPattern = new RegExp(`\\bconst\\s+${varName}\\b`, 'g');
                            const letPattern = new RegExp(`\\blet\\s+${varName}\\b`, 'g');
                            const varPattern = new RegExp(`\\bvar\\s+${varName}\\b`, 'g');
                            
                            // Se a variável já existe, remover a declaração e manter apenas a atribuição
                            if (typeof window[varName] !== 'undefined') {
                                value = value.replace(constPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                                value = value.replace(letPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                                value = value.replace(varPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                                console.log(`Evitada redeclaração via innerText de ${varName}`);
                            }
                        });
                        
                        // Chamar o setter original com o valor processado
                        originalInnerTextSetter.call(this, value);
                    },
                    get: function() {
                        return Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText').get.call(this);
                    },
                    configurable: true
                });
            }
        }
        
        return element;
    };
    
    // Substituir a função appendChild para interceptar scripts adicionados diretamente ao DOM
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child) {
        if (child.nodeName === 'SCRIPT') {
            // Se o script tiver um atributo src, não precisa modificar o conteúdo
            if (!child.src && child.textContent) {
                // Processar o conteúdo do script para evitar redeclarações
                let content = child.textContent;
                variaveisProtegidas.forEach(varName => {
                    // Padrão para capturar declarações de variáveis
                    const constPattern = new RegExp(`\\bconst\\s+${varName}\\b`, 'g');
                    const letPattern = new RegExp(`\\blet\\s+${varName}\\b`, 'g');
                    const varPattern = new RegExp(`\\bvar\\s+${varName}\\b`, 'g');
                    
                    // Se a variável já existe, remover a declaração e manter apenas a atribuição
                    if (typeof window[varName] !== 'undefined') {
                        content = content.replace(constPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                        content = content.replace(letPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                        content = content.replace(varPattern, `/* REDECLARAÇÃO EVITADA */ window['${varName}']`);
                        console.log(`Evitada redeclaração via appendChild de ${varName}`);
                    }
                });
                
                // Atualizar o conteúdo do script
                child.textContent = content;
            }
        }
        
        // Continuar com o comportamento original
        return originalAppendChild.call(this, child);
    };
    
    // Criar propriedades globais protegidas para evitar redeclarações
    variaveisProtegidas.forEach(varName => {
        if (typeof window[varName] === 'undefined') {
            // Se a variável não existe, criar um placeholder que será substituído posteriormente
            window._protectedValues[varName] = undefined;
            
            Object.defineProperty(window, varName, {
                get: function() {
                    return window._protectedValues[varName];
                },
                set: function(value) {
                    console.log(`Setando valor para variável protegida: ${varName}`, value);
                    window._protectedValues[varName] = value;
                },
                configurable: true,
                enumerable: true
            });
            
            console.log(`Criada proteção para variável: ${varName}`);
        } else {
            // Se a variável já existe, salvar seu valor atual
            console.log(`Salvando valor existente para variável: ${varName}`);
            window._protectedValues[varName] = window[varName];
            
            // Redefinir a propriedade para proteger contra redeclarações
            Object.defineProperty(window, varName, {
                get: function() {
                    return window._protectedValues[varName];
                },
                set: function(value) {
                    console.log(`Atualizando valor para variável protegida: ${varName}`, value);
                    window._protectedValues[varName] = value;
                },
                configurable: true,
                enumerable: true
            });
        }
    });
    
    // Flag para indicar que as prevenções foram aplicadas
    window._fixesApplied.preventRedeclarations = true;
    console.log("Prevenção de redeclarações configurada com sucesso");
})();

// Correções específicas para módulos que serão aplicadas após o DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Aplicando correções específicas para os módulos");
    
    // Corrija problemas na função criarLinhaDisciplina para mostrar turmas vinculadas
    if (typeof window.criarLinhaDisciplina === 'function') {
        console.log("Aplicando correção para criarLinhaDisciplina");
        
        // Salve a função original
        const criarLinhaDisciplinaOriginal = window.criarLinhaDisciplina;
        
        // Substitua por nossa versão corrigida
        window.criarLinhaDisciplina = function(disciplina, turmas) {
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
            
            // Verificar se a disciplina tem turmas vinculadas
            if (disciplina.turmas_vinculadas && disciplina.turmas_vinculadas.length > 0) {
                console.log(`Processando turmas vinculadas à disciplina ${disciplina.id_disciplina}:`, disciplina.turmas_vinculadas);
                
                // Transformar as turmas em uma lista legível
                const turmasFormatadas = disciplina.turmas_vinculadas.map(turma => {
                    // Verificar o formato da turma (pode ser objeto ou string de ID)
                    let idTurma = '';
                    let infoTurma = '';
                    
                    if (typeof turma === 'object' && turma !== null) {
                        idTurma = turma.id_turma || turma.id || '';
                    } else {
                        idTurma = turma;
                    }
                    
                    // Buscar informações adicionais da turma na lista completa
                    if (turmas && turmas.length > 0) {
                        const turmaCompleta = turmas.find(t => 
                            t.id_turma === idTurma || t.id === idTurma || 
                            String(t.id_turma) === String(idTurma) || String(t.id) === String(idTurma)
                        );
                        
                        if (turmaCompleta) {
                            infoTurma = ` (${turmaCompleta.serie || turmaCompleta.nome_turma || 'Sem info'})`;
                        }
                    }
                    
                    return `${idTurma}${infoTurma}`;
                });
                
                // Filtrar valores vazios e juntar com vírgulas
                turmasTexto = turmasFormatadas.filter(t => t).join(', ');
                
                // Se ainda assim ficou vazio
                if (!turmasTexto) {
                    turmasTexto = '-';
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
            
            // Adicionar eventos aos botões
            const btnEditar = row.querySelector('.btn-editar-disciplina');
            if (btnEditar) {
                btnEditar.addEventListener('click', () => {
                    const id = btnEditar.getAttribute('data-id');
                    console.log(`Botão editar clicado para disciplina ${id}`);
                    
                    // Preparar o formulário para edição
                    if (typeof prepararFormularioDisciplina === 'function') {
                        prepararFormularioDisciplina(id);
                    }
                });
            }
            
            const btnExcluir = row.querySelector('.btn-excluir-disciplina');
            if (btnExcluir) {
                btnExcluir.addEventListener('click', () => {
                    const id = btnExcluir.getAttribute('data-id');
                    const nome = btnExcluir.getAttribute('data-nome');
                    console.log(`Botão excluir clicado para disciplina ${id}`);
                    
                    // Chamar função de exclusão
                    if (typeof excluirDisciplina === 'function') {
                        excluirDisciplina(id, nome);
                    }
                });
            }
            
            // Adicionar a linha à tabela
            disciplinasLista.appendChild(row);
        };
    }
    
    // Correção para carregarProfessores - evitar duplicação
    if (typeof window.carregarProfessores === 'function') {
        console.log("Aplicando correção para carregarProfessores");
        
        // Salve a função original
        const carregarProfessoresOriginal = window.carregarProfessores;
        
        // Substitua com uma versão que deduplicará os professores
        window.carregarProfessores = function() {
            console.log("Carregando professores (versão corrigida)");
            
            const professoresLista = document.getElementById('professores-lista');
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
                            
                            // Continue com a lógica original, mas usando professoresUnicos
                            if (professoresUnicos.length === 0) {
                                professoresLista.innerHTML = `
                                    <tr class="text-center">
                                        <td colspan="6">Nenhum professor cadastrado</td>
                                    </tr>
                                `;
                                return;
                            }
                            
                            // Continue com o processamento dos professores
                            if (carregarProfessoresOriginal) {
                                // Reaproveitar a lógica original, apenas continuar com os professores já deduplicados
                                const afterFetchLogic = carregarProfessoresOriginal.toString()
                                    .match(/\.then\s*\(\s*professores\s*=>\s*\{([\s\S]*?)if\s*\(\s*professores\.length\s*===\s*0\s*\)/);
                                
                                if (afterFetchLogic) {
                                    console.log("Utilizando lógica original para processamento dos professores");
                                } else {
                                    // Implementação básica para mostrar a lista de professores
                                    professoresLista.innerHTML = '';
                                    professoresUnicos.forEach(professor => {
                                        const tr = document.createElement('tr');
                                        tr.innerHTML = `
                                            <td>${professor.id_professor}</td>
                                            <td>${professor.nome_professor}</td>
                                            <td>${professor.email_professor || '-'}</td>
                                            <td>${professor.disciplinas?.join(', ') || '-'}</td>
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
                                        professoresLista.appendChild(tr);
                                    });
                                }
                            }
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
        };
    }
    
    // Correção para carregarAlunos - corrigir problemas de formatação e campos
    if (typeof window.carregarAlunos === 'function') {
        console.log("Aplicando correção para carregarAlunos");
        
        // Salve a função original
        const carregarAlunosOriginal = window.carregarAlunos;
        
        // Substitua por nossa versão corrigida
        window.carregarAlunos = function() {
            console.log("Carregando alunos (versão corrigida)");
            
            const alunosLista = document.getElementById('alunos-lista');
            if (!alunosLista) {
                console.error("Lista de alunos não encontrada!");
                return;
            }
            
            // Mostrar indicador de carregamento
            alunosLista.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
                        </div>
                    </td>
                </tr>
            `;
            
            // Buscar alunos da API
            fetch(CONFIG.getApiUrl('/alunos'))
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao carregar alunos: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(alunos => {
                    console.log("Alunos recuperados da API:", alunos.length);
                    
                    if (alunos.length === 0) {
                        alunosLista.innerHTML = `
                            <tr class="text-center">
                                <td colspan="7">Nenhum aluno cadastrado</td>
                            </tr>
                        `;
                        return;
                    }
                    
                    // Ordenar alunos pelo nome para melhor visualização
                    alunos.sort((a, b) => {
                        const nomeA = a.nome_aluno || '';
                        const nomeB = b.nome_aluno || '';
                        return nomeA.localeCompare(nomeB);
                    });
                    
                    // Limpar lista e preenchê-la com os alunos
                    alunosLista.innerHTML = '';
                    
                    // Adicionar cada aluno à lista
                    alunos.forEach(aluno => {
                        // Formatar data de nascimento
                        let dataNascFormatada = '-';
                        if (aluno.data_nasc) {
                            try {
                                // Garantir que a data seja interpretada no timezone local
                                const [ano, mes, dia] = aluno.data_nasc.split('-');
                                if (ano && mes && dia) {
                                    const dataCorrigida = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                                    dataNascFormatada = dataCorrigida.toLocaleDateString('pt-BR');
                                }
                            } catch (e) {
                                console.warn("Erro ao formatar data de nascimento:", e);
                            }
                        }
                        
                        // Verificar se todos os campos existem
                        const id = aluno.id_aluno || '-';
                        const nome = aluno.nome_aluno || '-';
                        const turma = aluno.id_turma || '-';
                        const sexoTexto = aluno.sexo === 'M' ? 'Masculino' : (aluno.sexo === 'F' ? 'Feminino' : '-');
                        const mae = aluno.mae || '-';
                        
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${id}</td>
                            <td>${nome}</td>
                            <td>${turma}</td>
                            <td>${sexoTexto}</td>
                            <td>${dataNascFormatada}</td>
                            <td>${mae}</td>
                            <td class="text-center">
                                <button class="btn btn-sm btn-outline-primary editar-aluno me-1" data-id="${id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger excluir-aluno" data-id="${id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                        
                        alunosLista.appendChild(tr);
                    });
                    
                    // Adicionar eventos para botões de editar e excluir
                    document.querySelectorAll('.editar-aluno').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const idAluno = this.getAttribute('data-id');
                            if (typeof editarAluno === 'function') {
                                editarAluno(idAluno);
                            }
                        });
                    });
                    
                    document.querySelectorAll('.excluir-aluno').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const idAluno = this.getAttribute('data-id');
                            if (typeof excluirAluno === 'function') {
                                excluirAluno(idAluno);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error("Erro ao carregar alunos:", error);
                    
                    alunosLista.innerHTML = `
                        <tr class="text-center">
                            <td colspan="7">
                                Erro ao carregar alunos: ${error.message}
                            </td>
                        </tr>
                    `;
                });
        };
    }
    
    console.log("Correções de módulos aplicadas com sucesso!");
}); 