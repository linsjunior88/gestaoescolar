/**
 * Módulo de Calendário Escolar
 * Sistema de Gestão Escolar EMEF Nazaré Rodrigues
 */

import { API_BASE_URL, makeRequest } from './api.js';

class CalendarioEscolar {
    constructor() {
        this.calendar = null;
        this.eventosCarregados = [];
        this.filtrosAtivos = new Set(['feriado_nacional', 'feriado_estadual', 'feriado_municipal', 'evento_escolar', 'reuniao', 'conselho_classe', 'outro']);
        this.eventoAtual = null;
        
        this.init();
    }

    init() {
        this.initCalendar();
        this.bindEvents();
        this.carregarEventos();
        this.atualizarEstatisticas();
    }

    initCalendar() {
        const calendarEl = document.getElementById('calendario-escolar');
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'pt-br',
            initialView: 'dayGridMonth',
            height: 'auto',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia'
            },
            events: [],
            eventClick: (info) => this.mostrarDetalhesEvento(info.event),
            dateClick: (info) => this.criarEventoData(info.date),
            datesSet: () => this.atualizarEstatisticas(),
            eventDidMount: (info) => {
                // Adicionar tooltip com informações do evento
                info.el.setAttribute('title', 
                    `${info.event.title}\n${info.event.extendedProps.tipo_evento || ''}\n${info.event.extendedProps.descricao || ''}`
                );
            }
        });

        this.calendar.render();
    }

    bindEvents() {
        // Botão novo evento
        document.getElementById('btn-novo-evento').addEventListener('click', () => {
            this.abrirModalEvento();
        });

        // Botão filtros
        document.getElementById('btn-filtros-calendario').addEventListener('click', () => {
            this.abrirModalFiltros();
        });

        // Form de evento
        document.getElementById('form-evento').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEvento();
        });

        // Checkbox de evento recorrente
        document.getElementById('evento-recorrente').addEventListener('change', (e) => {
            const recorrenciaOptions = document.getElementById('recorrencia-options');
            if (e.target.checked) {
                recorrenciaOptions.classList.remove('d-none');
            } else {
                recorrenciaOptions.classList.add('d-none');
                document.getElementById('evento-recorrencia').value = '';
            }
        });

        // Filtros
        document.getElementById('btn-aplicar-filtros').addEventListener('click', () => {
            this.aplicarFiltros();
        });

        document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
            this.limparFiltros();
        });

        // Botões do modal de detalhes
        document.getElementById('btn-editar-evento').addEventListener('click', () => {
            this.editarEvento();
        });

        document.getElementById('btn-excluir-evento').addEventListener('click', () => {
            this.excluirEvento();
        });

        // Sincronização de data fim quando data início muda
        document.getElementById('evento-data-inicio').addEventListener('change', (e) => {
            const dataFim = document.getElementById('evento-data-fim');
            if (!dataFim.value || new Date(dataFim.value) < new Date(e.target.value)) {
                dataFim.value = e.target.value;
            }
        });
    }

    async carregarEventos() {
        try {
            const response = await makeRequest(`${API_BASE_URL}/calendario/eventos`);
            this.eventosCarregados = response;
            this.atualizarCalendarioEventos();
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            this.mostrarMensagem('Erro ao carregar eventos do calendário', 'error');
        }
    }

    atualizarCalendarioEventos() {
        const eventosFiltrados = this.eventosCarregados.filter(evento => 
            this.filtrosAtivos.has(evento.tipo_evento)
        );

        const eventosFormatados = eventosFiltrados.map(evento => ({
            id: evento.id,
            title: evento.titulo,
            start: evento.data_inicio + (evento.hora_inicio ? 'T' + evento.hora_inicio : ''),
            end: evento.data_fim + (evento.hora_fim ? 'T' + evento.hora_fim : ''),
            backgroundColor: evento.cor || this.getCorPorTipo(evento.tipo_evento),
            borderColor: evento.cor || this.getCorPorTipo(evento.tipo_evento),
            allDay: !evento.hora_inicio,
            extendedProps: {
                ...evento
            }
        }));

        this.calendar.removeAllEvents();
        this.calendar.addEventSource(eventosFormatados);
    }

    getCorPorTipo(tipo) {
        const cores = {
            'feriado_nacional': '#e74c3c',
            'feriado_estadual': '#9b59b6',
            'feriado_municipal': '#f39c12',
            'evento_escolar': '#27ae60',
            'reuniao': '#3498db',
            'conselho_classe': '#8e44ad',
            'formatura': '#e67e22',
            'festa_junina': '#f1c40f',
            'semana_pedagogica': '#1abc9c',
            'outro': '#95a5a6'
        };
        return cores[tipo] || '#3498db';
    }

    abrirModalEvento(evento = null) {
        const modal = new bootstrap.Modal(document.getElementById('modalEvento'));
        const form = document.getElementById('form-evento');
        const titulo = document.getElementById('modalEventoLabel');

        // Limpar formulário
        form.reset();
        document.getElementById('recorrencia-options').classList.add('d-none');
        document.getElementById('evento-cor').value = '#3498db';

        if (evento) {
            // Edição
            titulo.textContent = 'Editar Evento';
            this.preencherFormularioEvento(evento);
        } else {
            // Criação
            titulo.textContent = 'Novo Evento';
            document.getElementById('evento-id').value = '';
            // Definir data padrão como hoje
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('evento-data-inicio').value = hoje;
            document.getElementById('evento-data-fim').value = hoje;
        }

        modal.show();
    }

    preencherFormularioEvento(evento) {
        document.getElementById('evento-id').value = evento.id;
        document.getElementById('evento-titulo').value = evento.titulo;
        document.getElementById('evento-descricao').value = evento.descricao || '';
        document.getElementById('evento-data-inicio').value = evento.data_inicio;
        document.getElementById('evento-data-fim').value = evento.data_fim;
        document.getElementById('evento-hora-inicio').value = evento.hora_inicio || '';
        document.getElementById('evento-hora-fim').value = evento.hora_fim || '';
        document.getElementById('evento-tipo').value = evento.tipo_evento;
        document.getElementById('evento-cor').value = evento.cor || this.getCorPorTipo(evento.tipo_evento);
        document.getElementById('evento-observacoes').value = evento.observacoes || '';
        
        if (evento.recorrente) {
            document.getElementById('evento-recorrente').checked = true;
            document.getElementById('recorrencia-options').classList.remove('d-none');
            document.getElementById('evento-recorrencia').value = evento.frequencia_recorrencia || '';
        }
    }

    criarEventoData(data) {
        this.abrirModalEvento();
        const dataStr = data.toISOString().split('T')[0];
        document.getElementById('evento-data-inicio').value = dataStr;
        document.getElementById('evento-data-fim').value = dataStr;
    }

    async salvarEvento() {
        try {
            const formData = new FormData(document.getElementById('form-evento'));
            const eventoData = {
                titulo: document.getElementById('evento-titulo').value,
                descricao: document.getElementById('evento-descricao').value,
                data_inicio: document.getElementById('evento-data-inicio').value,
                data_fim: document.getElementById('evento-data-fim').value,
                hora_inicio: document.getElementById('evento-hora-inicio').value || null,
                hora_fim: document.getElementById('evento-hora-fim').value || null,
                tipo_evento: document.getElementById('evento-tipo').value,
                cor: document.getElementById('evento-cor').value,
                recorrente: document.getElementById('evento-recorrente').checked,
                frequencia_recorrencia: document.getElementById('evento-recorrencia').value || null,
                observacoes: document.getElementById('evento-observacoes').value,
                criado_por: 'Sistema' // Pode ser alterado para o usuário logado
            };

            const eventoId = document.getElementById('evento-id').value;

            let response;
            if (eventoId) {
                // Atualização
                response = await makeRequest(`${API_BASE_URL}/calendario/eventos/${eventoId}`, {
                    method: 'PUT',
                    body: JSON.stringify(eventoData)
                });
            } else {
                // Criação
                response = await makeRequest(`${API_BASE_URL}/calendario/eventos`, {
                    method: 'POST',
                    body: JSON.stringify(eventoData)
                });
            }

            this.mostrarMensagem('Evento salvo com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalEvento')).hide();
            await this.carregarEventos();
            this.atualizarEstatisticas();

        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            this.mostrarMensagem('Erro ao salvar evento', 'error');
        }
    }

    mostrarDetalhesEvento(evento) {
        this.eventoAtual = evento.extendedProps;
        const modal = new bootstrap.Modal(document.getElementById('modalDetalhesEvento'));
        const content = document.getElementById('detalhes-evento-content');

        const horaInicio = evento.extendedProps.hora_inicio 
            ? `às ${evento.extendedProps.hora_inicio}` 
            : '';
        const horaFim = evento.extendedProps.hora_fim 
            ? ` até ${evento.extendedProps.hora_fim}` 
            : '';

        content.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h6 class="fw-bold">${evento.title}</h6>
                    <p class="text-muted mb-2">
                        <i class="fas fa-calendar me-1"></i>
                        ${this.formatarData(evento.extendedProps.data_inicio)} 
                        ${evento.extendedProps.data_inicio !== evento.extendedProps.data_fim 
                            ? ` até ${this.formatarData(evento.extendedProps.data_fim)}` 
                            : ''}
                        ${horaInicio}${horaFim}
                    </p>
                    <p class="mb-2">
                        <span class="badge" style="background-color: ${evento.backgroundColor}">
                            ${this.getTipoEventoLabel(evento.extendedProps.tipo_evento)}
                        </span>
                    </p>
                    ${evento.extendedProps.descricao ? `
                        <div class="mb-3">
                            <strong>Descrição:</strong>
                            <p class="mt-1">${evento.extendedProps.descricao}</p>
                        </div>
                    ` : ''}
                    ${evento.extendedProps.observacoes ? `
                        <div class="mb-3">
                            <strong>Observações:</strong>
                            <p class="mt-1">${evento.extendedProps.observacoes}</p>
                        </div>
                    ` : ''}
                    ${evento.extendedProps.recorrente ? `
                        <p class="mb-2">
                            <i class="fas fa-redo me-1"></i>
                            Evento recorrente (${evento.extendedProps.frequencia_recorrencia})
                        </p>
                    ` : ''}
                    <small class="text-muted">
                        Criado por: ${evento.extendedProps.criado_por} em 
                        ${this.formatarDataHora(evento.extendedProps.data_criacao)}
                    </small>
                </div>
            </div>
        `;

        modal.show();
    }

    editarEvento() {
        bootstrap.Modal.getInstance(document.getElementById('modalDetalhesEvento')).hide();
        setTimeout(() => {
            this.abrirModalEvento(this.eventoAtual);
        }, 300);
    }

    async excluirEvento() {
        if (!this.eventoAtual || !confirm('Tem certeza que deseja excluir este evento?')) {
            return;
        }

        try {
            await makeRequest(`${API_BASE_URL}/calendario/eventos/${this.eventoAtual.id}`, {
                method: 'DELETE'
            });

            this.mostrarMensagem('Evento excluído com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('modalDetalhesEvento')).hide();
            await this.carregarEventos();
            this.atualizarEstatisticas();

        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            this.mostrarMensagem('Erro ao excluir evento', 'error');
        }
    }

    abrirModalFiltros() {
        const modal = new bootstrap.Modal(document.getElementById('modalFiltros'));
        
        // Atualizar checkboxes com filtros ativos
        document.querySelectorAll('.filtro-tipo').forEach(checkbox => {
            checkbox.checked = this.filtrosAtivos.has(checkbox.value);
        });

        modal.show();
    }

    aplicarFiltros() {
        this.filtrosAtivos.clear();
        
        document.querySelectorAll('.filtro-tipo:checked').forEach(checkbox => {
            this.filtrosAtivos.add(checkbox.value);
        });

        this.atualizarCalendarioEventos();
        this.atualizarEstatisticas();
    }

    limparFiltros() {
        document.querySelectorAll('.filtro-tipo').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        this.filtrosAtivos = new Set(['feriado_nacional', 'feriado_estadual', 'feriado_municipal', 'evento_escolar', 'reuniao', 'conselho_classe', 'outro']);
        this.atualizarCalendarioEventos();
        this.atualizarEstatisticas();
    }

    async atualizarEstatisticas() {
        const dataAtual = this.calendar.getDate();
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth() + 1;

        try {
            const response = await makeRequest(`${API_BASE_URL}/calendario/resumo-mensal/${ano}/${mes}`);
            
            // Atualizar badges do painel
            document.getElementById('total-eventos-mes').textContent = response.total_eventos;
            
            // Resetar contadores
            document.getElementById('total-feriados-mes').textContent = '0';
            document.getElementById('total-eventos-escolares-mes').textContent = '0';
            document.getElementById('total-reunioes-mes').textContent = '0';

            // Atualizar contadores por tipo
            response.por_tipo.forEach(tipo => {
                if (tipo.tipo.includes('feriado')) {
                    const atual = parseInt(document.getElementById('total-feriados-mes').textContent);
                    document.getElementById('total-feriados-mes').textContent = atual + tipo.quantidade;
                } else if (tipo.tipo === 'evento_escolar') {
                    document.getElementById('total-eventos-escolares-mes').textContent = tipo.quantidade;
                } else if (tipo.tipo === 'reuniao') {
                    document.getElementById('total-reunioes-mes').textContent = tipo.quantidade;
                }
            });

            // Atualizar próximos eventos
            this.atualizarProximosEventos();

        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    atualizarProximosEventos() {
        const hoje = new Date();
        const proximosEventos = this.eventosCarregados
            .filter(evento => {
                const dataEvento = new Date(evento.data_inicio);
                return dataEvento >= hoje && this.filtrosAtivos.has(evento.tipo_evento);
            })
            .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
            .slice(0, 5);

        const container = document.getElementById('lista-proximos-eventos');
        
        if (proximosEventos.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum evento próximo</p>';
            return;
        }

        container.innerHTML = proximosEventos.map(evento => `
            <div class="d-flex align-items-center mb-2 p-2 border-start border-3" 
                 style="border-color: ${evento.cor || this.getCorPorTipo(evento.tipo_evento)} !important;">
                <div class="flex-grow-1">
                    <div class="fw-bold small">${evento.titulo}</div>
                    <div class="text-muted small">
                        ${this.formatarData(evento.data_inicio)}
                        ${evento.hora_inicio ? ` às ${evento.hora_inicio}` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getTipoEventoLabel(tipo) {
        const labels = {
            'feriado_nacional': 'Feriado Nacional',
            'feriado_estadual': 'Feriado Estadual',
            'feriado_municipal': 'Feriado Municipal',
            'evento_escolar': 'Evento Escolar',
            'reuniao': 'Reunião',
            'conselho_classe': 'Conselho de Classe',
            'formatura': 'Formatura',
            'festa_junina': 'Festa Junina',
            'semana_pedagogica': 'Semana Pedagógica',
            'outro': 'Outro'
        };
        return labels[tipo] || tipo;
    }

    formatarData(dataStr) {
        const data = new Date(dataStr + 'T00:00:00');
        return data.toLocaleDateString('pt-BR');
    }

    formatarDataHora(dataHoraStr) {
        const data = new Date(dataHoraStr);
        return data.toLocaleString('pt-BR');
    }

    mostrarMensagem(mensagem, tipo = 'info') {
        // Implementar sistema de notificações
        // Por enquanto, usar alert simples
        if (tipo === 'error') {
            alert('Erro: ' + mensagem);
        } else {
            alert(mensagem);
        }
    }
}

// Exportar para uso em outros módulos
export { CalendarioEscolar }; 