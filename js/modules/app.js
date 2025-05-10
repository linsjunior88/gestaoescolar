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
    
    // Exibir o conteúdo do dashboard
    showContent('dashboard');
} 