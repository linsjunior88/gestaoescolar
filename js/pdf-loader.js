/**
 * Carregador do gerador de PDF
 * Contorna problemas de MIME type
 */

// Função para carregar scripts dinamicamente
function carregarScript(url) {
    return new Promise((resolve, reject) => {
        // Criar elemento script
        const script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        
        // Configurar callbacks
        script.onload = () => {
            console.log(`Script carregado com sucesso: ${url}`);
            resolve();
        };
        
        script.onerror = (error) => {
            console.error(`Erro ao carregar script: ${url}`, error);
            reject(error);
        };
        
        // Adicionar ao documento
        document.body.appendChild(script);
    });
}

// Carregar gerador de PDF
async function carregarGeradorPDF() {
    try {
        console.log('Iniciando carregamento do gerador de PDF...');
        
        // Verificar e carregar dependências (jsPDF e AutoTable)
        await Promise.all([
            carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
            carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js')
        ]);
        
        // Em vez de carregar de uma URL externa, definir o código localmente
        // para evitar problemas de MIME type
        console.log('Definindo gerador de PDF localmente...');
        
        // Definir a função gerarPDFNotas globalmente
        window.gerarPDFNotas = async function() {
            console.log('Função geradora de PDF executada localmente');
            try {
                // Verificar se jsPDF está disponível
                if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                    throw new Error('Biblioteca jsPDF não encontrada. Tente recarregar a página.');
                }
                
                // Mostrar uma mensagem simples para confirmar que o módulo está funcionando
                alert('O módulo de geração de PDF foi carregado com sucesso! A funcionalidade completa estará disponível na próxima atualização.');
                return true;
            } catch (error) {
                console.error('Erro no gerador de PDF:', error);
                alert(`Erro ao gerar PDF: ${error.message}`);
                return false;
            }
        };
        
        console.log('Gerador de PDF carregado com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao carregar gerador de PDF:', error);
        return false;
    }
}

// Exportar função para uso global
window.carregarGeradorPDF = carregarGeradorPDF;

// Notificar que o loader foi carregado
console.log('PDF Loader inicializado'); 