/**
 * utils.js
 * Contém funções utilitárias usadas em várias partes do sistema
 */

/**
 * Formata uma data para exibição no formato brasileiro
 * @param {string|Date} data A data a ser formatada
 * @param {boolean} comHoras Se true, inclui as horas no formato
 * @returns {string} Data formatada
 */
function formatarData(data, comHoras = false) {
    if (!data) return '-';
    
    try {
        const dataObj = data instanceof Date ? data : new Date(data);
        
        // Verificar se é uma data válida
        if (isNaN(dataObj.getTime())) return '-';
        
        const dia = String(dataObj.getDate()).padStart(2, '0');
        const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
        const ano = dataObj.getFullYear();
        
        if (comHoras) {
            const hora = String(dataObj.getHours()).padStart(2, '0');
            const minuto = String(dataObj.getMinutes()).padStart(2, '0');
            return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
        }
        
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        console.error("Erro ao formatar data:", error);
        return '-';
    }
}

/**
 * Formata um valor como moeda brasileira
 * @param {number} valor O valor a ser formatado
 * @returns {string} Valor formatado como moeda brasileira
 */
function formatarMoeda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

/**
 * Formata um valor como nota escolar (com uma casa decimal)
 * @param {number} valor A nota a ser formatada
 * @returns {string} Nota formatada
 */
function formatarNota(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return '-';
    
    // Arredondar para uma casa decimal
    const valorFormatado = Math.round(valor * 10) / 10;
    
    // Converter para string com uma casa decimal
    return valorFormatado.toFixed(1).replace('.', ',');
}

/**
 * Converte valor do turno para texto
 * @param {string|number} turno Código do turno (M, T, N ou 1, 2, 3)
 * @returns {string} Nome do turno por extenso
 */
function turno2texto(turno) {
    if (!turno) return '-';
    
    // Normalize turno to uppercase if it's a string
    const turnoNormalizado = typeof turno === 'string' ? turno.toUpperCase() : turno;
    
    // Map turno to text
    switch (turnoNormalizado) {
        case 'M':
        case 1:
            return 'Matutino';
        case 'T':
        case 2:
            return 'Vespertino';
        case 'N':
        case 3:
            return 'Noturno';
        case 'I':
        case 4:
            return 'Integral';
        default:
            return turno;
    }
}

/**
 * Verifica se um objeto está vazio
 * @param {Object} obj O objeto a ser verificado
 * @returns {boolean} True se o objeto estiver vazio
 */
function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

/**
 * Sanitiza uma string para uso em HTML
 * @param {string} str A string a ser sanitizada
 * @returns {string} String sanitizada
 */
function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Gera um ID único baseado em timestamp e número aleatório
 * @returns {string} ID único
 */
function gerarId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Trunca um texto para um tamanho máximo
 * @param {string} texto O texto a ser truncado
 * @param {number} tamanho O tamanho máximo
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, tamanho) {
    if (!texto) return '';
    if (texto.length <= tamanho) return texto;
    return texto.substring(0, tamanho) + '...';
}

// Exportar funções para o escopo global
window.formatarData = formatarData;
window.formatarMoeda = formatarMoeda;
window.formatarNota = formatarNota;
window.turno2texto = turno2texto;
window.isEmptyObject = isEmptyObject;
window.sanitizeHTML = sanitizeHTML;
window.gerarId = gerarId;
window.truncarTexto = truncarTexto; 