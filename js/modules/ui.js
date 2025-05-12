/**
 * Módulo de UI
 * Contém funções reutilizáveis para componentes de interface do usuário
 */

const UIModule = {
    /**
     * Cria um modal Bootstrap com melhorias de acessibilidade e usabilidade
     * @param {string} id - ID do modal
     * @param {string} titulo - Título do modal
     * @param {string} conteudo - Conteúdo HTML do corpo do modal
     * @param {string} rodape - Conteúdo HTML do rodapé do modal
     * @param {string} tamanho - Classe de tamanho do modal (default: 'modal-lg')
     * @returns {bootstrap.Modal} - Instância do modal criado
     */
    criarModal: function(id, titulo, conteudo, rodape, tamanho = 'modal-lg') {
        // Remover modal existente com mesmo ID
        const modalAnterior = document.getElementById(id);
        if (modalAnterior) {
            const instanciaModal = bootstrap.Modal.getInstance(modalAnterior);
            if (instanciaModal) instanciaModal.dispose();
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
            setTimeout(() => {
                modalEl.remove();
            }, 300); // Pequeno delay para garantir que a animação termine
        });
        
        // Mostrar o modal
        modal.show();
        
        return modal;
    },
    
    /**
     * Mostra uma mensagem de erro em um toast
     * @param {string} mensagem - Mensagem de erro a ser exibida
     */
    mostrarErro: function(mensagem) {
        this.mostrarToast(mensagem, 'danger', 'exclamation-circle', 5000);
    },
    
    /**
     * Mostra uma mensagem de sucesso em um toast
     * @param {string} mensagem - Mensagem de sucesso a ser exibida
     */
    mostrarSucesso: function(mensagem) {
        this.mostrarToast(mensagem, 'success', 'check-circle', 3000);
    },
    
    /**
     * Mostra uma mensagem de informação em um toast
     * @param {string} mensagem - Mensagem de informação a ser exibida
     */
    mostrarInfo: function(mensagem) {
        this.mostrarToast(mensagem, 'info', 'info-circle', 4000);
    },
    
    /**
     * Mostra uma mensagem de alerta em um toast
     * @param {string} mensagem - Mensagem de alerta a ser exibida
     */
    mostrarAlerta: function(mensagem) {
        this.mostrarToast(mensagem, 'warning', 'exclamation-triangle', 4000);
    },
    
    /**
     * Função base para criar e mostrar um toast
     * @param {string} mensagem - Mensagem a ser exibida
     * @param {string} tipo - Tipo de toast (success, danger, warning, info)
     * @param {string} icone - Nome do ícone FontAwesome (sem o fa- prefix)
     * @param {number} delay - Tempo em ms para auto-esconder o toast
     */
    mostrarToast: function(mensagem, tipo, icone, delay) {
        // Verificar se já existe um toast container
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Criar ID único para o toast
        const toastId = 'toast-' + Date.now();
        
        // Criar o toast
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${icone} me-2"></i> ${mensagem}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
                </div>
            </div>
        `;
        
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
        
        // Rodapé do modal
        const modalFooter = `
            <button type="button" class="btn ${opt.classeBotaoConfirmar} btn-confirmar" autofocus>${opt.textoBotaoConfirmar}</button>
            <button type="button" class="btn ${opt.classeBotaoCancelar} btn-cancelar" data-bs-dismiss="modal">${opt.textoBotaoCancelar}</button>
        `;
        
        // Criar e mostrar modal
        const modal = this.criarModal(
            'modal-confirmacao',
            titulo,
            modalBody,
            modalFooter,
            'modal-sm'
        );
        
        // Adicionar eventos aos botões
        const btnConfirmar = document.querySelector('.btn-confirmar');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
                modal.hide();
            });
        }
        
        const btnCancelar = document.querySelector('.btn-cancelar');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                if (typeof onCancel === 'function') {
                    onCancel();
                }
            });
        }
        
        // Também chamar onCancel se o modal for fechado por outros meios
        const modalEl = document.getElementById('modal-confirmacao');
        modalEl.addEventListener('hidden.bs.modal', function(e) {
            // Verificar se o modal foi fechado por outro meio que não o botão cancelar
            const btnCancelarClicado = e.target.querySelector('.btn-cancelar');
            if (!btnCancelarClicado || !btnCancelarClicado.matches(':active')) {
                if (typeof onCancel === 'function') {
                    onCancel();
                }
            }
        });
    }
};

export default UIModule; 