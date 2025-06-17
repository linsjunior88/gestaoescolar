/**
 * Script de Inicialização da Aplicação
 * Carrega os módulos necessários e verifica a conectividade com o backend
 */

// Configuração da API
const CONFIG = {
    apiUrl: 'https://apinazarerodrigues.86dynamics.com.br/api',
    debug: true
};

// Verificar status da API
async function verificarAPI() {
    try {
        console.log('🔍 Verificando conectividade com o backend...');
        
        const response = await fetch(CONFIG.apiUrl + '/status', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend conectado com sucesso!', data);
            document.getElementById('api-status').innerHTML = '✅ API Conectada';
            document.getElementById('api-status').className = 'badge bg-success';
            return true;
        } else {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Erro ao conectar com o backend:', error);
        document.getElementById('api-status').innerHTML = '❌ API Desconectada';
        document.getElementById('api-status').className = 'badge bg-danger';
        
        // Mostrar alerta de erro
        mostrarAlertaConexao(error.message);
        return false;
    }
}

// Mostrar alerta de conexão
function mostrarAlertaConexao(erro) {
    const alertaHtml = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Problema de Conectividade:</strong> Não foi possível conectar ao backend.
            <br><small>Erro: ${erro}</small>
            <br><small>Algumas funcionalidades podem não estar disponíveis.</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Adicionar alerta no topo da página
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertAdjacentHTML('afterbegin', alertaHtml);
    }
}

// Criar badge de status da API
function criarStatusAPI() {
    // Adicionar badge de status no navbar
    const navbar = document.querySelector('.navbar-nav');
    if (navbar) {
        const statusHtml = `
            <li class="nav-item">
                <span id="api-status" class="badge bg-secondary me-2">
                    <i class="fas fa-circle-notch fa-spin me-1"></i>Verificando API...
                </span>
            </li>
        `;
        navbar.insertAdjacentHTML('beforeend', statusHtml);
    }
}

// Inicializar aplicação básica
function inicializarApp() {
    console.log('🚀 Inicializando Sistema de Gestão Escolar...');
    
    // Criar status da API
    criarStatusAPI();
    
    // Verificar conectividade
    verificarAPI();
    
    // Configurar navegação básica
    configurarNavegacao();
    
    // Configurar formulários básicos
    configurarFormularios();
    
    console.log('📋 Sistema carregado (modo básico)');
}

// Configurar navegação entre seções
function configurarNavegacao() {
    const navLinks = document.querySelectorAll('.nav-link[id$="-link"]');
    const sections = document.querySelectorAll('.content-section, [id^="conteudo-"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classes ativas
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.add('d-none'));
            
            // Ativar link clicado
            this.classList.add('active');
            
            // Mostrar seção correspondente
            const linkId = this.id;
            const sectionId = linkId.replace('-link', '');
            const section = document.getElementById(`conteudo-${sectionId}`);
            
            if (section) {
                section.classList.remove('d-none');
                console.log(`📄 Seção ativa: ${sectionId}`);
            }
        });
    });
    
    // Ativar dashboard por padrão
    const dashboardLink = document.getElementById('dashboard-link');
    const dashboardSection = document.getElementById('conteudo-dashboard');
    
    if (dashboardLink && dashboardSection) {
        dashboardLink.classList.add('active');
        dashboardSection.classList.remove('d-none');
    }
}

// Configurar formulários básicos
function configurarFormularios() {
    // Adicionar validação básica
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!this.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.classList.add('was-validated');
        });
    });
}

// Funções utilitárias para API
window.AppUtils = {
    // Fazer requisição para API
    fetchAPI: async function(endpoint, options = {}) {
        try {
            const url = CONFIG.apiUrl + endpoint;
            console.log(`📡 Requisição: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            throw error;
        }
    },
    
    // Mostrar toast de notificação
    showToast: function(message, type = 'info') {
        const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastElement = toastContainer.lastElementChild;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarApp);

// Expor configurações globalmente
window.CONFIG = CONFIG; 