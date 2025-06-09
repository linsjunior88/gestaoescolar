/**
 * Arquivo principal da aplicação
 * Responsável por inicializar e coordenar todos os módulos
 */

// Importar módulos
import ConfigModule from './modules/config.js';
import UIModule from './modules/ui.js';
import DashboardModule from './modules/dashboard.js';
import TurmasModule from './modules/turmas.js';
import DisciplinasModule from './modules/disciplinas.js';
import ProfessoresModule from './modules/professores.js';
import AlunosModule from './modules/alunos.js';
import NotasModule from './modules/notas.js';
import { CalendarioEscolar } from './calendario.js';

// Objeto principal da aplicação
const App = {
    // Módulos da aplicação
    modules: {
        config: ConfigModule,
        dashboard: DashboardModule,
        turmas: TurmasModule,
        disciplinas: DisciplinasModule,
        professores: ProfessoresModule,
        alunos: AlunosModule,
        notas: NotasModule
    },
    
    // Instância do calendário
    calendario: null,
    
    // Links do menu
    links: {},
    
    // Conteúdos das seções
    conteudos: {},
    
    // Estado atual da aplicação
    state: {
        currentSection: 'dashboard',
        initializedModules: new Set() // Controlar quais módulos já foram inicializados
    },
    
    // Inicializar aplicação
    init: async function() {
        console.log("Inicializando aplicação...");
        
        try {
            // Configurar API
            await ConfigModule.init();
            
            // Inicializar links do menu
            this.initLinks();
            
            // Ativar seção inicial (dashboard)
            this.ativarSecao('dashboard-link');
            
            // Criar container para toasts
            this.criarToastContainer();
            
            // Configurar atualizações automáticas do dashboard
            this.configurarAtualizacoesDashboard();
            
            // Carregar o pdf-loader para contornar problemas de MIME
            this.carregarPDFLoader();
            
            console.log("Aplicação inicializada com sucesso!");
        } catch (error) {
            console.error("Erro ao inicializar aplicação:", error);
            this.mostrarErroInicializacao(error);
        }
    },
    
    // Carregar o loader do PDF
    carregarPDFLoader: function() {
        try {
            // Criar elemento script
            const script = document.createElement('script');
            script.src = './js/pdf-loader.js';
            script.type = 'text/javascript';
            
            // Adicionar manipuladores de eventos
            script.onload = () => {
                console.log("PDF Loader carregado com sucesso!");
                // Após carregar o loader, carregar o gerador de PDF
                if (window.carregarGeradorPDF) {
                    setTimeout(() => {
                        window.carregarGeradorPDF().then(sucesso => {
                            if (sucesso) {
                                console.log("Gerador de PDF inicializado com sucesso via loader!");
                            } else {
                                console.error("Falha ao inicializar gerador de PDF via loader");
                            }
                        });
                    }, 1000);
                }
            };
            
            script.onerror = (error) => {
                console.error("Erro ao carregar PDF Loader:", error);
            };
            
            // Adicionar ao documento
            document.body.appendChild(script);
        } catch (error) {
            console.error("Erro ao tentar carregar o PDF Loader:", error);
        }
    },
    
    // Configurar atualizações automáticas do dashboard
    configurarAtualizacoesDashboard: function() {
        console.log("Configurando atualizações do dashboard");
        
        // Forçar atualização ao mudar de aba no navegador (apenas se estiver no dashboard)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.state.currentSection === 'dashboard' && DashboardModule.atualizarDashboard) {
                console.log("Página visível novamente, atualizando dashboard");
                DashboardModule.atualizarDashboard();
            }
        });
        
        // Atualizar dashboard apenas uma vez após inicialização completa
        setTimeout(() => {
            if (DashboardModule.atualizarDashboard) {
                console.log("Atualizando dashboard após inicialização");
                DashboardModule.atualizarDashboard();
            }
        }, 2000);
    },
    
    // Inicializar links do menu
    initLinks: function() {
        // Mapear os links do menu para seus respectivos conteúdos
        this.links = {
            'dashboard-link': document.getElementById('dashboard-link'),
            'turmas-link': document.getElementById('turmas-link'),
            'disciplinas-link': document.getElementById('disciplinas-link'),
            'professores-link': document.getElementById('professores-link'),
            'alunos-link': document.getElementById('alunos-link'),
            'notas-link': document.getElementById('notas-link')
        };
        
        this.conteudos = {
            'dashboard-link': document.getElementById('conteudo-dashboard'),
            'turmas-link': document.getElementById('conteudo-turmas'),
            'disciplinas-link': document.getElementById('conteudo-disciplinas'),
            'professores-link': document.getElementById('conteudo-professores'),
            'alunos-link': document.getElementById('conteudo-alunos'),
            'notas-link': document.getElementById('conteudo-notas')
        };
        
        // Adicionar eventos de clique para alternar entre as seções
        for (const key in this.links) {
            if (this.links[key]) {
                this.links[key].addEventListener('click', (e) => {
                    e.preventDefault();
                    this.ativarSecao(key);
                });
            }
        }
    },
    
    // Ativar seção selecionada
    ativarSecao: function(linkId) {
        console.log("Ativando seção para o link:", linkId);
        
        // Atualizar seção atual
        const moduleMap = {
            'dashboard-link': 'dashboard',
            'turmas-link': 'turmas',
            'disciplinas-link': 'disciplinas',
            'professores-link': 'professores',
            'alunos-link': 'alunos',
            'notas-link': 'notas'
        };
        this.state.currentSection = moduleMap[linkId] || 'dashboard';
        
        // Desativar todos os links e conteúdos
        for (const key in this.links) {
            if (this.links[key]) {
                this.links[key].classList.remove('active');
            }
        }
        
        for (const key in this.conteudos) {
            if (this.conteudos[key]) {
                this.conteudos[key].classList.add('d-none');
            }
        }
        
        // Ativar link e conteúdo selecionados
        if (this.links[linkId]) {
            this.links[linkId].classList.add('active');
        }
        
        if (this.conteudos[linkId]) {
            this.conteudos[linkId].classList.remove('d-none');
        }
        
        // Inicializar módulo correspondente
        this.inicializarModuloAtivo(linkId);
    },
    
    // Inicializar módulo ativo
    inicializarModuloAtivo: function(linkId) {
        // Mapear link para nome do módulo
        const moduleMap = {
            'dashboard-link': 'dashboard',
            'turmas-link': 'turmas',
            'disciplinas-link': 'disciplinas',
            'professores-link': 'professores',
            'alunos-link': 'alunos',
            'notas-link': 'notas'
        };
        
        const moduleName = moduleMap[linkId];
        
        if (moduleName) {
            console.log(`Ativando módulo: ${moduleName}`);
            try {
                if (this.modules[moduleName]) {
                    // Verificar se o módulo já foi inicializado
                    if (!this.state.initializedModules.has(moduleName)) {
                        console.log(`Inicializando módulo pela primeira vez: ${moduleName}`);
                        this.modules[moduleName].init();
                        this.state.initializedModules.add(moduleName);
                    } else {
                        console.log(`Módulo ${moduleName} já foi inicializado, apenas ativando`);
                        
                        // Para o módulo de professores, apenas recarregar os dados se necessário
                        if (moduleName === 'professores' && this.modules.professores.carregarProfessores) {
                            // Usar um debounce para evitar chamadas múltiplas
                            if (!this.modules.professores.state.carregandoProfessores) {
                                console.log("Recarregando dados dos professores");
                                this.modules.professores.carregarProfessores();
                            }
                        }
                    }
                    
                    // Se estamos ativando o dashboard, forçar sua atualização
                    if (moduleName === 'dashboard' && this.modules.dashboard.atualizarDashboard) {
                        console.log("Forçando atualização do dashboard ao navegar para ele");
                        this.modules.dashboard.atualizarDashboard();
                        
                        // Inicializar calendário se ainda não foi inicializado
                        if (!this.calendario) {
                            console.log("Inicializando calendário escolar...");
                            setTimeout(() => {
                                try {
                                    this.calendario = new CalendarioEscolar();
                                    console.log("Calendário escolar inicializado com sucesso!");
                                } catch (error) {
                                    console.error("Erro ao inicializar calendário:", error);
                                }
                            }, 500); // Aguardar um pouco para garantir que o DOM está pronto
                        } else {
                            // Se o calendário já existe, recarregar os eventos
                            console.log("Recarregando eventos do calendário...");
                            setTimeout(() => {
                                if (this.calendario && this.calendario.reload) {
                                    this.calendario.reload();
                                }
                            }, 100);
                        }
                    }
                } else {
                    console.warn(`Módulo ${moduleName} não encontrado ou não inicializado.`);
                }
            } catch (error) {
                console.error(`Erro ao inicializar módulo ${moduleName}:`, error);
                const conteudo = this.conteudos[linkId];
                if (conteudo) {
                    conteudo.innerHTML = `
                        <div class="alert alert-danger">
                            <strong>Erro!</strong> Ocorreu um problema ao inicializar este módulo.
                            <br>Detalhes: ${error.message || 'Erro desconhecido'}
                            <br><br>
                            <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                        </div>
                    `;
                }
            }
        }
    },
    
    // Mostrar erro de inicialização
    mostrarErroInicializacao: function(error) {
        const mainContent = document.querySelector('.container-fluid');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="alert alert-danger mt-4">
                    <strong>Erro!</strong> Não foi possível inicializar a aplicação. 
                    <br>Detalhes: ${error.message || 'Erro desconhecido'}
                    <br><br>
                    <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                </div>
            `;
        }
    },
    
    // Criar container para mensagens toast
    criarToastContainer: function() {
        // Verificar se já existe
        if (document.getElementById('toast-container')) return;
        
        // Criar container
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';
        
        // Adicionar ao body
        document.body.appendChild(toastContainer);
    }
};

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// Exportar aplicação para uso global
window.App = App;
