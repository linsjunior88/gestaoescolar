/**
 * Arquivo principal da aplicação
 * Responsável por inicializar e coordenar todos os módulos
 */

// Importar módulos
import ConfigModule from './modules/config.js';
import CORSBypassModule from './modules/cors-bypass.js';
import DashboardModule from './modules/dashboard.js';
import TurmasModule from './modules/turmas.js';
import DisciplinasModule from './modules/disciplinas.js';
import ProfessoresModule from './modules/professores.js';
import AlunosModule from './modules/alunos.js';

// Objeto principal da aplicação
const App = {
    // Módulos da aplicação
    modules: {
        config: ConfigModule,
        corsBypass: CORSBypassModule,
        dashboard: DashboardModule,
        turmas: TurmasModule,
        disciplinas: DisciplinasModule,
        professores: ProfessoresModule,
        alunos: AlunosModule,
        notas: null // Será carregado dinamicamente
    },
    
    // Links do menu
    links: {},
    
    // Conteúdos das seções
    conteudos: {},
    
    // Inicializar aplicação
    init: async function() {
        console.log("Inicializando aplicação...");
        
        try {
            // Inicializar módulo de configuração
            await ConfigModule.init();
            
            // Inicializar gerenciamento de seções
            this.initLinks();
            
            // Inicializar módulo inicial (dashboard)
            await this.ativarSecao('dashboard-link');
            
            console.log("Aplicação inicializada com sucesso!");
        } catch (error) {
            console.error("Erro ao inicializar aplicação:", error);
            this.mostrarErroInicializacao(error);
        }
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
                // Carregar o módulo de notas sob demanda, se ainda não estiver carregado
                if (moduleName === 'notas' && !this.modules.notas) {
                    console.log('Carregando módulo de notas dinamicamente...');
                    
                    // Adicionar indicador de carregamento
                    const notasContent = this.conteudos[linkId];
                    if (notasContent) {
                        notasContent.innerHTML = `
                            <div class="d-flex justify-content-center my-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Carregando...</span>
                                </div>
                            </div>
                        `;
                    }
                    
                    // Função para lidar com erro ao carregar o módulo
                    const handleError = (error) => {
                        console.error('Erro ao carregar módulo de notas:', error);
                        if (notasContent) {
                            notasContent.innerHTML = `
                                <div class="alert alert-danger mt-3">
                                    <strong>Erro!</strong> Não foi possível carregar o módulo de notas.
                                    <br>Detalhes: ${error.message || 'Erro desconhecido'}
                                    <br><br>
                                    <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                                </div>
                            `;
                        }
                    };
                    
                    // Tentar usar importação dinâmica (ES modules)
                    try {
                        import('./modules/notas.js')
                            .then(module => {
                                this.modules.notas = module.default;
                                console.log('Módulo de notas carregado com sucesso via import dinâmico');
                                
                                // Inicializar o módulo após carregar
                                this.modules.notas.init().catch(err => {
                                    console.error('Erro ao inicializar módulo de notas:', err);
                                    if (notasContent) {
                                        notasContent.innerHTML = `
                                            <div class="alert alert-danger mt-3">
                                                <strong>Erro!</strong> Não foi possível inicializar o módulo de notas.
                                                <br>Detalhes: ${err.message || 'Erro desconhecido'}
                                                <br><br>
                                                <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                                            </div>
                                        `;
                                    }
                                });
                            })
                            .catch(handleError);
                    } catch (importError) {
                        // Fallback para navegadores que não suportam importação dinâmica
                        console.warn('Import dinâmico não suportado, tentando método alternativo...', importError);
                        
                        // Criar script tag e carregar o módulo
                        const script = document.createElement('script');
                        script.type = 'module';
                        script.onload = () => {
                            // Verificar se o módulo foi carregado globalmente
                            if (window.NotasModule) {
                                this.modules.notas = window.NotasModule;
                                console.log('Módulo de notas carregado com sucesso via script tag');
                                this.modules.notas.init().catch(handleError);
                            } else {
                                handleError(new Error('Módulo carregado, mas não encontrado no escopo global'));
                            }
                        };
                        script.onerror = () => handleError(new Error('Falha ao carregar script do módulo de notas'));
                        script.src = './js/modules/notas.js';
                        document.head.appendChild(script);
                    }
                } else if (this.modules[moduleName]) {
                    // Para outros módulos ou se o módulo notas já estiver carregado
                    this.modules[moduleName].init();
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
        const notasContent = document.getElementById('conteudo-notas');
        if (notasContent) {
            notasContent.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Erro!</strong> Não foi possível inicializar a aplicação. 
                    <br>Detalhes: ${error.message || 'Erro desconhecido'}
                    <br><br>
                    <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                </div>
            `;
        }
    }
};

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// Exportar aplicação para uso global
window.App = App;
