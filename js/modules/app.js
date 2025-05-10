// Função para inicializar a aplicação
async function initApp() {
    console.log("Iniciando aplicação...");
    
    // Inicializar módulos
    await TurmasModule.init();
    await DisciplinasModule.init();
    await ProfessoresModule.init();
    await AlunosModule.init();
    await NotasModule.init();
    
    // Carregar dados do dashboard
    loadDashboardData();
    
    // Exibir mensagem de boas-vindas e informação sobre o novo sistema
    mostrarMensagemSistema();
    
    // Exibir o conteúdo do dashboard
    showContent('dashboard');
}

// Mostrar mensagem informativa sobre o novo sistema
function mostrarMensagemSistema() {
    // Criar o modal
    const modalHTML = `
    <div class="modal fade" id="sistemaInfoModal" tabindex="-1" aria-labelledby="sistemaInfoModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="sistemaInfoModalLabel">Atualização do Sistema</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i> <strong>Novidade!</strong> O sistema foi atualizado para facilitar a gestão de disciplinas e turmas.
                    </div>
                    <p>Agora, o vínculo entre disciplinas e turmas é feito diretamente no cadastro de professores, permitindo que:</p>
                    <ul>
                        <li>Diferentes professores lecionem a mesma disciplina em diferentes conjuntos de turmas</li>
                        <li>Um professor possa ser vinculado a uma disciplina específica em turmas específicas</li>
                        <li>Não há mais restrições no vínculo entre disciplinas e turmas</li>
                    </ul>
                    <p>Acesse o módulo de <strong>Professores</strong> para gerenciar estes vínculos.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendi</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Adicionar o modal ao body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Exibir o modal
    setTimeout(() => {
        const modal = new bootstrap.Modal(document.getElementById('sistemaInfoModal'));
        modal.show();
    }, 1000);
} 