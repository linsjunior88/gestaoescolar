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
    
    // Links do menu
    links: {},
    
    // Conteúdos das seções
    conteudos: {},
    
    // Estado atual da aplicação
    state: {
        currentSection: 'dashboard'
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
        console.log("Configurando atualizações automáticas do dashboard");
        
        // Forçar atualização do dashboard a cada minuto
        setInterval(() => {
            console.log("Atualizando dashboard automaticamente");
            if (DashboardModule.atualizarDashboard) {
                DashboardModule.atualizarDashboard();
            }
        }, 60000); // 1 minuto
        
        // Forçar atualização ao mudar de aba no navegador
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && DashboardModule.atualizarDashboard) {
                console.log("Página visível novamente, atualizando dashboard");
                DashboardModule.atualizarDashboard();
            }
        });
        
        // Atualizar dashboard após inicialização completa
        setTimeout(() => {
            if (DashboardModule.atualizarDashboard) {
                console.log("Atualizando dashboard após inicialização");
                DashboardModule.atualizarDashboard();
            }
        }, 1500);
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
            console.log(`Inicializando módulo: ${moduleName}`);
            try {
                if (this.modules[moduleName]) {
                    // Para outros módulos ou se o módulo notas já estiver carregado
                    this.modules[moduleName].init();
                    
                    // Se estamos ativando o dashboard, forçar sua atualização
                    if (moduleName === 'dashboard' && this.modules.dashboard.atualizarDashboard) {
                        console.log("Forçando atualização do dashboard ao navegar para ele");
                        this.modules.dashboard.atualizarDashboard();
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
