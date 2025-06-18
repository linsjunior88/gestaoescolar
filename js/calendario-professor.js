/**
 * Calendário Acadêmico para Professor
 * Sistema de Gestão Escolar EMEF Nazaré Rodrigues
 */

class CalendarioProfessor {
    constructor() {
        this.calendar = null;
        this.eventosCarregados = [];
        this.filtrosAtivos = new Set(['feriado_nacional', 'feriado_estadual', 'feriado_municipal', 'evento_escolar', 'reuniao', 'conselho_classe', 'formatura', 'festa_junina', 'semana_pedagogica', 'outro']);
        
        this.init();
    }

    init() {
        console.log('🗓️ Inicializando calendário acadêmico para professor...');
        
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            this.initCalendar();
            this.carregarEventos();
        }, 1000);
    }

    initCalendar() {
        const calendarEl = document.getElementById('calendario-escolar-professor');
        
        if (!calendarEl) {
            console.warn('❌ Elemento do calendário não encontrado');
            return;
        }
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            locale: 'pt-br',
            initialView: 'dayGridMonth',
            height: 'auto',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            buttonText: {
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana'
            },
            events: [],
            eventClick: (info) => this.mostrarDetalhesEvento(info.event),
            datesSet: () => this.atualizarEstatisticas(),
            eventDidMount: (info) => {
                info.el.setAttribute('title', 
                    `${info.event.title}\n${info.event.extendedProps.tipo_evento || ''}\n${info.event.extendedProps.descricao || ''}`
                );
            }
        });

        this.calendar.render();
        console.log('✅ Calendário inicializado com sucesso');
    }

    async carregarEventos() {
        try {
            console.log('🔄 Carregando eventos do calendário...');
            
            const response = await fetch(CONFIG.getApiUrl('/calendario/eventos'));
            
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            
            const eventos = await response.json();
            console.log('📦 Eventos recebidos:', eventos.length);
            
            if (Array.isArray(eventos)) {
                this.eventosCarregados = eventos;
                this.atualizarCalendarioEventos();
            } else {
                console.error('❌ Resposta da API não é um array:', eventos);
                this.eventosCarregados = [];
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar eventos:', error);
            this.eventosCarregados = [];
        }
    }

    atualizarCalendarioEventos() {
        if (!this.calendar) return;
        
        console.log('🔄 Atualizando eventos no calendário...');
        
        const eventosFormatados = this.eventosCarregados.map(evento => {
            const dataFim = evento.data_fim || evento.data_inicio;
            
            return {
                id: evento.id,
                title: evento.titulo,
                start: evento.data_inicio + (evento.hora_inicio ? 'T' + evento.hora_inicio : ''),
                end: dataFim + (evento.hora_fim ? 'T' + evento.hora_fim : ''),
                backgroundColor: evento.cor || this.getCorPorTipo(evento.tipo_evento),
                borderColor: evento.cor || this.getCorPorTipo(evento.tipo_evento),
                allDay: !evento.hora_inicio,
                extendedProps: {
                    ...evento
                }
            };
        });

        this.calendar.removeAllEvents();
        this.calendar.addEventSource(eventosFormatados);
        
        console.log('✅ Calendário atualizado com', eventosFormatados.length, 'eventos');
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

    mostrarDetalhesEvento(evento) {
        const detalhes = `
            Evento: ${evento.title}
            Tipo: ${evento.extendedProps.tipo_evento || 'Não informado'}
            Data: ${this.formatarData(evento.start)}
            ${evento.extendedProps.descricao ? `Descrição: ${evento.extendedProps.descricao}` : ''}
        `;
        
        alert(detalhes);
    }

    atualizarEstatisticas() {
        if (!this.calendar) return;
        
        console.log('📊 Atualizando estatísticas do calendário...');
        
        const elementosEstatisticas = {
            totalEventos: document.getElementById('total-eventos-mes-professor'),
            totalFeriados: document.getElementById('total-feriados-mes-professor'),
            totalEventosEscolares: document.getElementById('total-eventos-escolares-mes-professor'),
            totalReunioes: document.getElementById('total-reunioes-mes-professor')
        };
        
        if (!elementosEstatisticas.totalEventos) {
            console.log('📄 Elementos de estatísticas não encontrados');
            return;
        }
        
        const dataAtual = this.calendar.getDate();
        const ano = dataAtual.getFullYear();
        const mes = dataAtual.getMonth() + 1;
        
        const eventosDoMes = this.eventosCarregados.filter(evento => {
            const dataEvento = new Date(evento.data_inicio);
            return dataEvento.getFullYear() === ano && (dataEvento.getMonth() + 1) === mes;
        });
        
        const contadores = {
            total: eventosDoMes.length,
            feriados: eventosDoMes.filter(e => e.tipo_evento && e.tipo_evento.includes('feriado')).length,
            eventos_escolares: eventosDoMes.filter(e => e.tipo_evento === 'evento_escolar').length,
            reunioes: eventosDoMes.filter(e => e.tipo_evento === 'reuniao').length
        };
        
        // Atualizar badges
        elementosEstatisticas.totalEventos.textContent = contadores.total;
        elementosEstatisticas.totalFeriados.textContent = contadores.feriados;
        elementosEstatisticas.totalEventosEscolares.textContent = contadores.eventos_escolares;
        elementosEstatisticas.totalReunioes.textContent = contadores.reunioes;
        
        // Atualizar próximos eventos
        this.atualizarProximosEventos();
        
        console.log('✅ Estatísticas atualizadas:', contadores);
    }

    atualizarProximosEventos() {
        const hoje = new Date();
        const proximosEventos = this.eventosCarregados
            .filter(evento => {
                const dataEvento = new Date(evento.data_inicio);
                return dataEvento >= hoje;
            })
            .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
            .slice(0, 5);

        const container = document.getElementById('lista-proximos-eventos-professor');
        
        if (!container) return;
        
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

    formatarData(data) {
        if (typeof data === 'string') {
            data = new Date(data);
        }
        return data.toLocaleDateString('pt-BR');
    }
}

// Inicializar calendário quando o dashboard estiver ativo
let calendarioProfessor = null;

// Função para inicializar o calendário (será chamada no dashboard)
window.initCalendarioProfessor = function() {
    if (!calendarioProfessor) {
        calendarioProfessor = new CalendarioProfessor();
    }
};

// Auto-inicialização se estivermos na página do professor
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página do professor
    if (document.getElementById('calendario-escolar-professor')) {
        console.log('📅 Página do professor detectada, inicializando calendário...');
        setTimeout(() => {
            window.initCalendarioProfessor();
        }, 2000);
    }
}); 