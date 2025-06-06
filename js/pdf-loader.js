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
        
        // Carregar o gerador de PDF
        await carregarScript('./gerador-pdf.js');
        
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