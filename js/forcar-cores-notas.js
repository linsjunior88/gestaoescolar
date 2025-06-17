/**
 * SCRIPT PARA FORÇAR CORES DAS NOTAS
 * Este script aplica as cores corretas nas notas do boletim
 * Funciona independentemente do módulo de notas
 */

// Função para aplicar cores nas notas
function aplicarCoresNotas() {
    console.log('🎨 Iniciando aplicação forçada de cores das notas...');
    
    // Selecionar todos os elementos de nota
    const gradeElements = document.querySelectorAll('.grade-value, .average-value, .final-value');
    
    let elementosProcessados = 0;
    
    gradeElements.forEach(element => {
        const nota = parseFloat(element.textContent);
        
        if (!isNaN(nota)) {
            let cor;
            
            if (nota >= 6.0) {
                // Verde para notas boas (6.0 a 10.0)
                const intensidade = Math.min((nota - 6) / 4, 1);
                const verdeEscuro = Math.floor(0 + (128 * intensidade));
                const verdeClaro = Math.floor(128 + (127 * (1 - intensidade)));
                cor = `rgb(${verdeEscuro}, ${verdeClaro}, ${verdeEscuro})`;
            } else if (nota >= 4.0) {
                // Amarelo para notas de recuperação (4.0 a 5.99)
                const intensidade = (nota - 4) / 2;
                const amareloR = 255;
                const amareloG = 255;
                const amareloB = Math.floor(0 + (150 * (1 - intensidade)));
                cor = `rgb(${amareloR}, ${amareloG}, ${amareloB})`;
            } else {
                // Vermelho para notas ruins (0 a 3.99)
                const intensidade = nota / 4;
                const vermelhoR = Math.floor(128 + (127 * (1 - intensidade)));
                const vermelhoG = Math.floor(0 + (100 * intensidade));
                const vermelhoB = Math.floor(0 + (100 * intensidade));
                cor = `rgb(${vermelhoR}, ${vermelhoG}, ${vermelhoB})`;
            }
            
            // Aplicar a cor usando setProperty para máxima prioridade
            element.style.setProperty('background-color', cor, 'important');
            element.style.setProperty('color', 'white', 'important');
            element.style.setProperty('text-shadow', '0 1px 2px rgba(0,0,0,0.5)', 'important');
            element.style.setProperty('border', 'none', 'important');
            element.style.setProperty('padding', '4px 8px', 'important');
            element.style.setProperty('border-radius', '4px', 'important');
            element.style.setProperty('font-weight', '500', 'important');
            element.style.setProperty('display', 'inline-block', 'important');
            element.style.setProperty('min-width', '35px', 'important');
            element.style.setProperty('text-align', 'center', 'important');
            
            // Remover classes Bootstrap que possam interferir
            const classesToRemove = [
                'badge', 'bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-danger',
                'text-primary', 'text-info', 'text-success', 'text-warning', 'text-danger',
                'btn', 'btn-primary', 'btn-info', 'btn-success', 'btn-warning', 'btn-danger'
            ];
            
            classesToRemove.forEach(cls => {
                element.classList.remove(cls);
            });
            
            elementosProcessados++;
        }
    });
    
    console.log(`🎨 Cores aplicadas em ${elementosProcessados} elementos!`);
    
    // Adicionar classe de identificação para elementos processados
    gradeElements.forEach(el => {
        el.classList.add('cores-aplicadas');
    });
}

// Aplicar cores quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    aplicarCoresNotas();
});

// Aplicar cores quando novos elementos forem adicionados
const observer = new MutationObserver(function(mutations) {
    let novosElementos = false;
    
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const gradeElements = node.querySelectorAll ? 
                        node.querySelectorAll('.grade-value, .average-value, .final-value') : [];
                    
                    if (gradeElements.length > 0) {
                        novosElementos = true;
                    }
                }
            });
        }
    });
    
    if (novosElementos) {
        setTimeout(aplicarCoresNotas, 100);
    }
});

// Observar mudanças no DOM
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Aplicar cores a cada 2 segundos (fallback)
setInterval(function() {
    const elementosSemCores = document.querySelectorAll('.grade-value:not(.cores-aplicadas), .average-value:not(.cores-aplicadas), .final-value:not(.cores-aplicadas)');
    
    if (elementosSemCores.length > 0) {
        console.log(`🔄 Aplicando cores em ${elementosSemCores.length} elementos não processados...`);
        aplicarCoresNotas();
    }
}, 2000);

// Expor função globalmente para uso manual
window.aplicarCoresNotas = aplicarCoresNotas;

console.log('✅ Script de cores das notas carregado!'); 