/**
 * Script de inicialização para garantir que todas as funções necessárias
 * estejam disponíveis no escopo global e sejam chamadas corretamente.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("init.js: DOM carregado, inicializando funções...");
    
    // Tentar carregar turmas e disciplinas diretamente
    setTimeout(function() {
        console.log("Inicializando módulos via init.js automaticamente (timeout 1s)");
        try {
            console.log("Tentando inicializar turmas via init.js");
            if (typeof carregarTurmas === 'function') {
                carregarTurmas();
                console.log("✅ Turmas carregadas com sucesso");
            } else {
                console.error("❌ Função carregarTurmas não disponível");
            }
            
            console.log("Tentando inicializar disciplinas via init.js");
            if (typeof carregarDisciplinas === 'function') {
                carregarDisciplinas();
                console.log("✅ Disciplinas carregadas com sucesso");
            } else {
                console.error("❌ Função carregarDisciplinas não disponível");
            }
        } catch (e) {
            console.error("Erro ao inicializar módulos:", e);
            
            // Tentar recuperação de emergência
            console.log("Tentando método alternativo de inicialização...");
            
            // Recuperação para turmas
            try {
                console.log("Tentando carregar turmas manualmente");
                const turmasTableBody = document.getElementById('turmas-lista');
                if (turmasTableBody) {
                    // Mostrar indicador de carregamento
                    turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
                    
                    fetch(window.CONFIG.getApiUrl('/turmas'))
                        .then(response => response.ok ? response.json() : [])
                        .then(data => {
                            console.log("Turmas carregadas:", data.length);
                            
                            if (!data || data.length === 0) {
                                turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma turma encontrada.</td></tr>';
                                return;
                            }
                            
                            // Limpar e preencher a tabela
                            turmasTableBody.innerHTML = '';
                            data.forEach(turma => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${turma.id_turma}</td>
                                    <td>${turma.serie || '-'}</td>
                                    <td>${turma.turno || '-'}</td>
                                    <td>${turma.tipo_turma || 'Regular'}</td>
                                    <td>${turma.coordenador || '-'}</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary edit-turma" data-id="${turma.id_turma}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-turma" data-id="${turma.id_turma}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                turmasTableBody.appendChild(row);
                            });
                        })
                        .catch(error => {
                            console.error("Erro ao carregar turmas:", error);
                            turmasTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar turmas.</td></tr>';
                        });
                }
            } catch (e2) {
                console.error("Erro ao recuperar turmas:", e2);
            }
            
            // Recuperação para disciplinas
            try {
                console.log("Tentando carregar disciplinas manualmente");
                const disciplinasTableBody = document.getElementById('disciplinas-lista');
                if (disciplinasTableBody) {
                    // Mostrar indicador de carregamento
                    disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>';
                    
                    fetch(window.CONFIG.getApiUrl('/disciplinas'))
                        .then(response => response.ok ? response.json() : [])
                        .then(data => {
                            console.log("Disciplinas carregadas:", data.length);
                            
                            if (!data || data.length === 0) {
                                disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma disciplina encontrada.</td></tr>';
                                return;
                            }
                            
                            // Limpar e preencher a tabela
                            disciplinasTableBody.innerHTML = '';
                            data.forEach(disciplina => {
                                const row = document.createElement('tr');
                                row.innerHTML = `
                                    <td>${disciplina.id_disciplina}</td>
                                    <td>${disciplina.nome_disciplina}</td>
                                    <td>${disciplina.carga_horaria || '-'}</td>
                                    <td>${disciplina.descricao || '-'}</td>
                                    <td class="text-center">
                                        <button class="btn btn-sm btn-outline-primary edit-disciplina" data-id="${disciplina.id_disciplina}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-disciplina" data-id="${disciplina.id_disciplina}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                `;
                                disciplinasTableBody.appendChild(row);
                            });
                        })
                        .catch(error => {
                            console.error("Erro ao carregar disciplinas:", error);
                            disciplinasTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar disciplinas.</td></tr>';
                        });
                }
            } catch (e3) {
                console.error("Erro ao recuperar disciplinas:", e3);
            }
        }
    }, 1000);
}); 