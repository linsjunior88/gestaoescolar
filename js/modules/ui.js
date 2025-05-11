/**
 * Módulo de UI
 * Contém funções reutilizáveis para componentes de interface do usuário
 */

const UIModule = {
    /**
     * Cria um modal Bootstrap com melhorias de acessibilidade e usabilidade
     * @param {Object} options - Objeto com as opções do modal
     * @param {string} options.titulo - Título do modal
     * @param {string} options.conteudo - Conteúdo HTML do corpo do modal
     * @param {Array} options.botoes - Array de objetos com configurações dos botões
     * @param {string} options.tamanho - Classe de tamanho do modal (default: 'modal-lg')
     * @returns {bootstrap.Modal} - Instância do modal criado
     */
    criarModal: function(options) {
        // Processar opções
        let id, titulo, conteudo, tamanho, botoes, rodape;
        
        // Suporte ao antigo formato de parâmetros (retrocompatibilidade)
        if (typeof options === 'string' || arguments.length > 1) {
            console.warn('UIModule.criarModal: Formato antigo de parâmetros detectado. Por favor, atualize para o formato de objeto único.');
            id = options;
            titulo = arguments[1];
            conteudo = arguments[2];
            rodape = arguments[3];
            tamanho = arguments[4] || 'modal-lg';
        } else {
            // Novo formato usando objeto de opções
            id = options.id || 'modal-' + Date.now();
            titulo = options.titulo || 'Janela';
            conteudo = options.conteudo || '';
            tamanho = options.tamanho || 'modal-lg';
            
            // Processar botões para criar o rodapé
            if (options.botoes && Array.isArray(options.botoes)) {
                rodape = options.botoes.map(botao => {
                    const btnClass = botao.classe || 'btn-secondary';
                    const btnText = botao.texto || 'Fechar';
                    const btnId = botao.id || `btn-${btnText.toLowerCase().replace(/\s+/g, '-')}-${id}`;
                    const btnAttrs = botao.fecharModal !== false ? 'data-bs-dismiss="modal"' : '';
                    const btnAutoFocus = botao.autoFocus ? 'autofocus' : '';
                    
                    return `<button type="button" id="${btnId}" class="btn ${btnClass}" ${btnAttrs} ${btnAutoFocus}>${btnText}</button>`;
                }).join('\n');
            } else {
                // Rodapé padrão
                rodape = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>`;
            }
        }
        
        // Remover modal existente com mesmo ID
        const modalAnterior = document.getElementById(id);
        if (modalAnterior) {
            try {
                const instanciaModal = bootstrap.Modal.getInstance(modalAnterior);
                if (instanciaModal) instanciaModal.dispose();
            } catch (e) {
                console.warn('Erro ao descartar modal anterior:', e);
            }
            modalAnterior.remove();
        }
        
        // Criar modal com melhorias de acessibilidade
        const modalHtml = `
            <div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}-titulo" aria-hidden="true" role="dialog">
                <div class="modal-dialog ${tamanho}">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${id}-titulo">${titulo}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            ${conteudo}
                        </div>
                        <div class="modal-footer">
                            ${rodape}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHtml;
        document.body.appendChild(modalElement);
        
        const modalEl = document.getElementById(id);
        const modal = new bootstrap.Modal(modalEl, {
            keyboard: true,
            backdrop: true,
            focus: true
        });
        
        // Foco automático no primeiro botão ou elemento focável
        modalEl.addEventListener('shown.bs.modal', function() {
            // Procurar primeiro pelo elemento com atributo autofocus
            const autoFocusElement = modalEl.querySelector('[autofocus]');
            if (autoFocusElement) {
                autoFocusElement.focus();
                return;
            }
            
            // Caso não encontre elemento com autofocus, procurar pelo primeiro focável
            const focusableElements = modalEl.querySelectorAll('button:not([data-bs-dismiss="modal"]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length) {
                focusableElements[0].focus();
            }
        });
        
        // Fechar clicando no overlay (fundo escuro)
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) {
                modal.hide();
            }
        });
        
        // Adicionar tecla ESC para fechar (Bootstrap já faz isso, mas para garantir)
        const escKeyHandler = (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('modal-open')) {
                modal.hide();
            }
        };
        
        document.addEventListener('keydown', escKeyHandler);
        
        // Garantir que o modal seja removido totalmente ao ser fechado
        modalEl.addEventListener('hidden.bs.modal', function() {
            document.removeEventListener('keydown', escKeyHandler);
            
            // Limpar quaisquer backdrops associados
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                try {
                    backdrop.classList.remove('show');
                    backdrop.remove();
                } catch (e) {
                    console.warn("Erro ao remover backdrop:", e);
                }
            });
            
            // Restaurar o scroll e limpar classes do body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Remover o modal após pequeno delay para garantir que a animação termine
            setTimeout(() => {
                try {
                    modalEl.remove();
                    console.log(`Modal ${id} removido do DOM`);
                } catch (e) {
                    console.warn("Erro ao remover modal:", e);
                }
            }, 300);
        });
        
        // Adicionar eventos para os botões se fornecidos como objetos
        if (options.botoes && Array.isArray(options.botoes)) {
            options.botoes.forEach((botao, index) => {
                if (typeof botao.onClick === 'function') {
                    const btnId = botao.id || `btn-${botao.texto.toLowerCase().replace(/\s+/g, '-')}-${id}`;
                    const btnElement = document.getElementById(btnId);
                    if (btnElement) {
                        btnElement.addEventListener('click', (e) => {
                            botao.onClick(e);
                            if (botao.fecharModal !== false) {
                                modal.hide();
                            }
                        });
                    }
                }
            });
        }
        
        // Mostrar o modal
        modal.show();
        
        return modal;
    },
    
    /**
     * Limpa todos os modais abertos
     */
    limparModais: function() {
        console.log("Limpando todos os modais via UIModule");
        
        // Fechar todos os modais via Bootstrap (abordagem suave)
        document.querySelectorAll('.modal.show').forEach(modal => {
            try {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            } catch (error) {
                console.warn("Erro ao tentar fechar modal via Bootstrap:", error);
            }
        });
        
        // Usar setTimeout para garantir que a animação termine antes da limpeza forçada
        setTimeout(() => {
            // Remover forçadamente todos os backdrops
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                try {
                    backdrop.classList.remove('show');
                    backdrop.remove();
                } catch (e) {
                    console.warn("Erro ao remover backdrop:", e);
                }
            });
            
            // Se ainda houver modais, removê-los diretamente
            document.querySelectorAll('.modal').forEach(modal => {
                try {
                    modal.classList.remove('show');
                    modal.style.display = 'none';
                    modal.setAttribute('aria-hidden', 'true');
                    modal.removeAttribute('aria-modal');
                    modal.removeAttribute('role');
                    setTimeout(() => modal.remove(), 100);
                } catch (e) {
                    console.warn("Erro ao limpar modal:", e);
                    try { modal.remove(); } catch (e) { /* ignorar */ }
                }
            });
            
            // Remover estilos e classes que podem bloquear scrolling
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Limpar qualquer indicador de carregamento global
            document.querySelectorAll('.global-spinner, .loading-indicator').forEach(loader => {
                if (!loader.closest('.preserve-loader')) {
                    try { loader.remove(); } catch (e) { /* ignorar */ }
                }
            });
            
            // Remover qualquer overlay restante
            document.querySelectorAll('.modal-open-overlay, .loading-overlay').forEach(overlay => {
                try { overlay.remove(); } catch (e) { /* ignorar */ }
            });
        }, 150);
    },
    
    /**
     * Mostra uma mensagem de erro em um toast
     * @param {string} mensagem - Mensagem de erro a ser exibida
     * @param {string} titulo - Título opcional
     * @param {number} duracao - Duração em ms
     */
    mostrarErro: function(mensagem, titulo = 'Erro', duracao = 5000) {
        this.mostrarToast(mensagem, 'danger', 'exclamation-circle', duracao, titulo);
    },
    
    /**
     * Mostra uma mensagem de sucesso em um toast
     * @param {string} mensagem - Mensagem de sucesso a ser exibida
     * @param {string} titulo - Título opcional
     * @param {number} duracao - Duração em ms
     */
    mostrarSucesso: function(mensagem, titulo = 'Sucesso', duracao = 3000) {
        this.mostrarToast(mensagem, 'success', 'check-circle', duracao, titulo);
    },
    
    /**
     * Mostra uma mensagem de informação em um toast
     * @param {string} mensagem - Mensagem de informação a ser exibida
     * @param {string} titulo - Título opcional
     * @param {number} duracao - Duração em ms
     */
    mostrarInfo: function(mensagem, titulo = 'Informação', duracao = 4000) {
        this.mostrarToast(mensagem, 'info', 'info-circle', duracao, titulo);
    },
    
    /**
     * Mostra uma mensagem de alerta em um toast
     * @param {string} mensagem - Mensagem de alerta a ser exibida
     * @param {string} titulo - Título opcional
     * @param {number} duracao - Duração em ms
     */
    mostrarAlerta: function(mensagem, titulo = 'Alerta', duracao = 4000) {
        this.mostrarToast(mensagem, 'warning', 'exclamation-triangle', duracao, titulo);
    },
    
    /**
     * Função base para criar e mostrar um toast
     * @param {string} mensagem - Mensagem a ser exibida
     * @param {string} tipo - Tipo de toast (success, danger, warning, info)
     * @param {string} icone - Nome do ícone FontAwesome (sem o fa- prefix)
     * @param {number} delay - Tempo em ms para auto-esconder o toast
     * @param {string} titulo - Título opcional para o toast
     */
    mostrarToast: function(mensagem, tipo, icone, delay, titulo = null) {
        // Verificar se já existe um toast container
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = "1080"; // Maior que modais (1050)
            document.body.appendChild(toastContainer);
        }
        
        // Criar ID único para o toast
        const toastId = 'toast-' + Date.now();
        
        // Criar o toast com ou sem header baseado no título
        let toastHtml;
        
        if (titulo) {
            toastHtml = `
                <div id="${toastId}" class="toast text-white bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header bg-${tipo} text-white">
                        <i class="fas fa-${icone} me-2"></i>
                        <strong class="me-auto">${titulo}</strong>
                        <small>Agora</small>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
                    </div>
                    <div class="toast-body">
                        ${mensagem}
                    </div>
                </div>
            `;
        } else {
            toastHtml = `
                <div id="${toastId}" class="toast align-items-center text-white bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="fas fa-${icone} me-2"></i> ${mensagem}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
                    </div>
                </div>
            `;
        }
        
        // Adicionar o toast ao container
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        
        // Inicializar e mostrar o toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: delay
        });
        
        toast.show();
        
        // Remover o toast do DOM quando for fechado
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    },
    
    /**
     * Mostra um diálogo de confirmação personalizado
     * @param {string} mensagem - Mensagem de confirmação
     * @param {string} titulo - Título do diálogo
     * @param {Function} onConfirm - Função a ser executada ao confirmar
     * @param {Function} onCancel - Função a ser executada ao cancelar
     * @param {Object} options - Opções adicionais (botões, cores, etc)
     */
    confirmar: function(mensagem, titulo = 'Confirmar', onConfirm, onCancel, options = {}) {
        const opt = {
            textoBotaoConfirmar: options.textoBotaoConfirmar || 'Confirmar',
            textoBotaoCancelar: options.textoBotaoCancelar || 'Cancelar',
            classeBotaoConfirmar: options.classeBotaoConfirmar || 'btn-primary',
            classeBotaoCancelar: options.classeBotaoCancelar || 'btn-secondary',
            icone: options.icone || 'question-circle'
        };
        
        // Criar corpo do modal
        const modalBody = `
            <div class="text-center mb-4">
                <i class="fas fa-${opt.icone} fa-3x text-${opt.classeBotaoConfirmar.replace('btn-', '')}"></i>
            </div>
            <p class="text-center">${mensagem}</p>
        `;
        
        // Criar modal com objeto de opções
        this.criarModal({
            id: 'modal-confirmacao',
            titulo: titulo,
            conteudo: modalBody,
            tamanho: 'modal-sm',
            botoes: [
                {
                    texto: opt.textoBotaoConfirmar,
                    classe: opt.classeBotaoConfirmar,
                    onClick: onConfirm,
                    autoFocus: true
                },
                {
                    texto: opt.textoBotaoCancelar,
                    classe: opt.classeBotaoCancelar,
                    onClick: onCancel,
                    fecharModal: true
                }
            ]
        });
    }
};

// Expor globalmente para uso fácil em scripts não-modular
window.UIModule = UIModule; 