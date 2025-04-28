/**
 * Arquivo principal da aplicação
 * Responsável por inicializar e coordenar todos os módulos
 */

// Importar módulos
import ConfigModule from './modules/config.js';
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
        
        // Inicializar módulo de configuração primeiro
        this.modules.config.init();
        
        // Carregar o módulo de notas dinamicamente
        try {
            const NotasModule = await import('./modules/notas.js')
                .then(module => module.default)
                .catch(error => {
                    console.error("Erro ao carregar módulo de notas:", error);
                    return {
                        init: function() {
                            console.warn("Usando módulo de notas de fallback");
                            const notasContent = document.getElementById('conteudo-notas');
                            if (notasContent) {
                                notasContent.innerHTML = `
                                    <div class="alert alert-danger">
                                        <strong>Erro!</strong> Não foi possível carregar o módulo de notas. 
                                        <br>Detalhes: ${error.message || 'Erro desconhecido'}
                                        <br><br>
                                        <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                                    </div>
                                `;
                            }
                        }
                    };
                });
            
            this.modules.notas = NotasModule;
            console.log("Módulo de notas carregado com sucesso");
        } catch (error) {
            console.error("Erro ao carregar módulo de notas:", error);
            // Criar um módulo de fallback
            this.modules.notas = {
                init: function() {
                    console.warn("Usando módulo de notas de fallback após exceção");
                    const notasContent = document.getElementById('conteudo-notas');
                    if (notasContent) {
                        notasContent.innerHTML = `
                            <div class="alert alert-danger">
                                <strong>Erro!</strong> Não foi possível carregar o módulo de notas. 
                                <br>Detalhes: ${error.message || 'Erro desconhecido'}
                                <br><br>
                                <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
                            </div>
                        `;
                    }
                }
            };
        }
        
        // Inicializar links do menu
        this.initLinks();
        
        // Ativar seção inicial (dashboard)
        this.ativarSecao('dashboard-link');
        
        console.log("Aplicação inicializada com sucesso!");
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
        
        if (moduleName && this.modules[moduleName]) {
            console.log(`Inicializando módulo: ${moduleName}`);
            try {
                this.modules[moduleName].init();
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
    }
};

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// Exportar aplicação para uso global
window.App = App;
