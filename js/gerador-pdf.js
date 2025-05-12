/**
 * Gerador de PDF para o módulo de notas
 * Utiliza as bibliotecas jsPDF e jspdf-autotable
 */

// Variável para controlar se a geração de PDF já está em andamento
let gerandoPDF = false;

// Função utilitária para carregar um script JS dinamicamente
function carregarScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Falha ao carregar o script: ${url}`));
        document.head.appendChild(script);
    });
}

// Função para garantir que as bibliotecas jsPDF e AutoTable estejam disponíveis
async function garantirBibliotecasPDF() {
    // Verificar se o jsPDF já está disponível
    const jspdfDisponivel = typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined';
    
    // Se jsPDF não estiver disponível, tentar carregar
    if (!jspdfDisponivel) {
        console.log('jsPDF não encontrado, tentando carregar dinamicamente...');
        try {
            await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            console.log('jsPDF carregado com sucesso!');
        } catch (err) {
            console.error('Erro ao carregar jsPDF:', err);
            throw new Error('Não foi possível carregar a biblioteca jsPDF.');
        }
    }
    
    // Verificar se podemos criar um documento jsPDF
    let jsPDFConstructor;
    let testDoc;
    
    try {
        if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function') {
            jsPDFConstructor = window.jspdf.jsPDF;
        } else if (typeof window.jsPDF === 'function') {
            jsPDFConstructor = window.jsPDF;
        } else {
            throw new Error('Construtor jsPDF não encontrado mesmo após tentativa de carregamento.');
        }
        
        // Testar criação de documento
        testDoc = new jsPDFConstructor();
    } catch (err) {
        console.error('Erro ao criar documento jsPDF:', err);
        throw new Error('Não foi possível criar um documento PDF.');
    }
    
    // Verificar se o AutoTable está disponível
    const autoTableDisponivel = typeof testDoc.autoTable === 'function';
    
    // Se AutoTable não estiver disponível, tentar carregar
    if (!autoTableDisponivel) {
        console.log('AutoTable não encontrado, tentando carregar dinamicamente...');
        try {
            await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.29/jspdf.plugin.autotable.min.js');
            console.log('AutoTable carregado com sucesso!');
        } catch (err) {
            console.error('Erro ao carregar AutoTable:', err);
            throw new Error('Não foi possível carregar o plugin AutoTable.');
        }
    }
    
    // Verificar novamente se o AutoTable está disponível após o carregamento
    testDoc = new jsPDFConstructor();
    if (typeof testDoc.autoTable !== 'function') {
        throw new Error('Plugin AutoTable não está disponível mesmo após o carregamento.');
    }
    
    console.log('Bibliotecas PDF carregadas e verificadas com sucesso!');
    return true;
}

// Função principal para obter ID do aluno (melhorada para buscar na API)
function obterIdAluno(linha) {
    console.log('Tentando obter ID do aluno para a linha:', linha);
    
    // 1. ESTRATÉGIA: Verificar se o DOM tem o ID diretamente no atributo data-id
    const dataId = linha.getAttribute('data-id') || linha.getAttribute('data-aluno-id');
    if (dataId && dataId !== 'undefined') {
        console.log('Encontrado ID direto no atributo data-id:', dataId);
        return dataId;
    }
    
    // 2. ESTRATÉGIA: Verificar se existe um elemento span ou div com a classe "aluno-id" ou "matricula"
    const idElement = linha.querySelector('.aluno-id, .matricula, [data-aluno-id], .id-aluno');
    if (idElement) {
        const idFromElement = idElement.textContent.trim() || idElement.getAttribute('data-id') || idElement.getAttribute('data-aluno-id');
        if (idFromElement && idFromElement !== 'undefined') {
            console.log('Encontrado ID em elemento específico:', idFromElement);
            return idFromElement;
        }
    }
    
    // 3. ESTRATÉGIA: Verificar data attribute em todas as células
    for (let i = 0; i < linha.cells.length; i++) {
        const cell = linha.cells[i];
        const cellDataId = cell.getAttribute('data-id') || cell.getAttribute('data-aluno-id');
        if (cellDataId && cellDataId !== 'undefined') {
            console.log('Encontrado ID na célula', i, ':', cellDataId);
            return cellDataId;
        }
        
        // Verificar também dentro das células
        const innerIdElement = cell.querySelector('[data-id], [data-aluno-id]');
        if (innerIdElement) {
            const innerDataId = innerIdElement.getAttribute('data-id') || innerIdElement.getAttribute('data-aluno-id');
            if (innerDataId && innerDataId !== 'undefined') {
                console.log('Encontrado ID em elemento dentro da célula', i, ':', innerDataId);
                return innerDataId;
            }
        }
    }
    
    // 4. ESTRATÉGIA: Buscar o ID no dataset do elemento TR ou seus filhos
    for (const key in linha.dataset) {
        if (key.toLowerCase().includes('aluno') || key.toLowerCase().includes('id')) {
            const datasetId = linha.dataset[key];
            if (datasetId && datasetId !== 'undefined') {
                console.log('Encontrado ID no dataset:', key, datasetId);
                return datasetId;
            }
        }
    }
    
    // 5. ESTRATÉGIA: Buscar dentro de todos os botões ou links que possuam data-id
    const botoes = linha.querySelectorAll('button, a');
    for (const btn of botoes) {
        const btnId = btn.getAttribute('data-id') || btn.getAttribute('data-aluno-id');
        if (btnId && btnId !== 'undefined') {
            console.log('Encontrado ID em botão/link:', btnId);
            return btnId;
        }
        
        // Verificar onclick que possa conter ID
        const onclick = btn.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/(\b\d+\b)/); // Buscar números no onclick
            if (match && match[1]) {
                console.log('Encontrado ID em onclick de botão:', match[1]);
                return match[1];
            }
        }
    }
    
    // 6. ESTRATÉGIA: Verificar se a primeira célula é numérica e pode ser um ID
    try {
        if (linha.cells && linha.cells.length > 0) {
            const firstCellText = linha.cells[0].textContent.trim();
            if (/^\d+$/.test(firstCellText)) {
                console.log('Primeira célula contém um ID numérico:', firstCellText);
                return firstCellText;
            }
        }
    } catch (e) {
        console.error('Erro ao verificar primeira célula:', e);
    }
    
    // 7. ESTRATÉGIA: Verificar se alguma célula contém um ID formatado (ex: ID: 123)
    for (let i = 0; i < linha.cells.length; i++) {
        const cellText = linha.cells[i].textContent.trim();
        const idMatch = cellText.match(/(ID|Id|id)[\s:]?(\d+)/);
        if (idMatch && idMatch[2]) {
            console.log('Encontrado padrão de ID na célula', i, ':', idMatch[2]);
            return idMatch[2];
        }
    }
    
    // 8. ESTRATÉGIA: Verificar inputs escondidos que possam ter o ID
    const hiddenInputs = linha.querySelectorAll('input[type="hidden"]');
    for (const input of hiddenInputs) {
        if (input.name && (input.name.includes('id') || input.name.includes('aluno'))) {
            console.log('Encontrado ID em input escondido:', input.value);
            return input.value;
        }
    }
    
    // 9. ESTRATÉGIA: Tentar extrair do ID do elemento TR
    if (linha.id && /\d+/.test(linha.id)) {
        const idFromLineId = linha.id.match(/\d+/)[0];
        console.log('Extraído ID do próprio ID da linha:', idFromLineId);
        return idFromLineId;
    }
    
    // 10. ESTRATÉGIA (ESPECÍFICA PARA O RELATÓRIO): A primeira célula geralmente mostra ID ou matrícula
    if (linha.cells && linha.cells.length > 0) {
        // Se estamos no corpo da tabela e a primeira célula parece ser um ID
        const matriculaCell = linha.cells[0].textContent.trim();
        if (matriculaCell && /\d+/.test(matriculaCell)) {
            console.log('Usando conteúdo da primeira célula como ID:', matriculaCell);
            return matriculaCell.match(/\d+/)[0]; // Extrai apenas os números
        }
    }
    
    // ÚLTIMA ESTRATÉGIA: Gerar um ID temporário
    console.warn('Não foi possível encontrar um ID real. Usando ID temporário baseado na posição da linha.');
    return `TMP${Date.now().toString().slice(-4)}`;
}

// Função para buscar ID do aluno via API
async function buscarIdAlunoViaAPI(nomeAluno) {
    if (!nomeAluno || nomeAluno.length < 3) return null;
    
    console.log('Tentando buscar ID do aluno via API para:', nomeAluno);
    
    try {
        // Verificar se temos uma função global para buscar alunos
        if (typeof window.buscarAlunosPorNome === 'function') {
            const alunos = await window.buscarAlunosPorNome(nomeAluno);
            if (alunos && alunos.length > 0) {
                console.log(`Encontrado ID via API para ${nomeAluno}:`, alunos[0].id_aluno);
                return alunos[0].id_aluno;
            }
        }
        
        // Verificar se temos uma URL padrão para a API
        const apiUrl = window.apiBaseUrl || '/api';
        const url = `${apiUrl}/alunos/buscar?nome=${encodeURIComponent(nomeAluno)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao buscar aluno: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.length > 0) {
            console.log(`Encontrado ID via API para ${nomeAluno}:`, data[0].id_aluno);
            return data[0].id_aluno;
        }
        
        return null;
    } catch (error) {
        console.warn('Erro ao buscar aluno via API:', error);
        return null;
    }
}

// Melhorar a função extrairMatriculasAlunos para buscar IDs via API
async function extrairMatriculasAlunos() {
    console.log('Buscando IDs de alunos na tabela...');
    const tabela = document.getElementById('tabela-notas');
    if (!tabela) return {};
    
    const tbody = tabela.querySelector('tbody');
    if (!tbody) return {};
    
    const linhas = tbody.querySelectorAll('tr');
    const alunos = {};
    
    // Criar um cache local para evitar múltiplas requisições para o mesmo aluno
    const cacheLocal = {};
    
    // Coletar promessas para buscar IDs de todos os alunos ao mesmo tempo
    const promessas = [];
    
    linhas.forEach((linha, index) => {
        if (linha.cells.length <= 1) return;
        
        const promessa = (async () => {
            try {
                // Pegar o nome do aluno (geralmente na primeira célula)
                const nomeAluno = linha.cells[0].textContent.trim();
                
                // Primeiro tentar obter o ID usando métodos DOM
                let idAluno = obterIdAluno(linha);
                
                // Se não conseguiu um ID válido, tentar via API
                if (idAluno === 'N/A' || idAluno.startsWith('TMP')) {
                    // Verificar se já temos este aluno no cache local
                    if (cacheLocal[nomeAluno]) {
                        idAluno = cacheLocal[nomeAluno];
                    } else {
                        // Buscar via API
                        const idViaAPI = await buscarIdAlunoViaAPI(nomeAluno);
                        if (idViaAPI) {
                            idAluno = idViaAPI;
                            cacheLocal[nomeAluno] = idViaAPI;
                        }
                    }
                }
                
                // Atualizar o registro global
                alunos[nomeAluno] = {
                    linha: index + 1,
                    matricula: idAluno
                };
                
            } catch (err) {
                console.error('Erro ao processar linha:', err);
            }
        })();
        
        promessas.push(promessa);
    });
    
    // Esperar todas as promessas terminarem
    await Promise.all(promessas);
    
    console.log('Matrículas encontradas:', alunos);
    return alunos;
}

// Função para obter o ID do aluno a partir do ID da nota via API
function obterIdAlunoPorNota(idNota) {
    console.log(`Tentando obter ID do aluno para a nota ${idNota} via API`);
    
    if (!idNota || idNota === "undefined") {
        console.warn("ID da nota não fornecido para consulta API");
        return null;
    }
    
    try {
        // Verificar se temos acesso à API
        if (!window.apiBaseUrl) {
            console.warn("Base URL da API não disponível");
            return null;
        }
        
        // Construir URL da API para buscar nota
        const apiUrl = `${window.apiBaseUrl}/notas/${idNota}`;
        console.log(`Consultando API: ${apiUrl}`);
        
        // Fazer chamada síncrona para API
        const xhr = new XMLHttpRequest();
        xhr.open('GET', apiUrl, false); // false = síncrono
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.send();
        if (xhr.status === 200) {
            const resposta = JSON.parse(xhr.responseText);
            if (resposta && resposta.id_aluno) {
                console.log(`API retornou ID do aluno: ${resposta.id_aluno}`);
                return resposta.id_aluno.toString();
            } else {
                console.warn("API retornou resposta sem ID do aluno:", resposta);
                return null;
            }
        } else {
            console.warn(`Erro na chamada API: ${xhr.status} - ${xhr.statusText}`);
            return null;
        }
    } catch (err) {
        console.error(`Erro ao consultar API para nota ${idNota}:`, err);
        return null;
    }
}

// Função para gerar um PDF com as notas da tabela
async function gerarPDFNotas() {
    // Verificar se já está gerando PDF para evitar múltiplas execuções
    if (gerandoPDF) {
        console.log('Já existe uma geração de PDF em andamento. Aguarde...');
        return;
    }
    
    // Marcar que está gerando o PDF
    gerandoPDF = true;
    
    console.log('Iniciando geração de PDF das notas');
    
    try {
        // Verificar se a tabela de notas existe
        const tabela = document.getElementById('tabela-notas');
        if (!tabela) {
            throw new Error('Tabela de notas não encontrada. Verifique se a tabela foi carregada corretamente.');
        }
        
        // Verificar se há linhas na tabela
        const tbody = tabela.querySelector('tbody');
        if (!tbody || tbody.querySelectorAll('tr').length === 0) {
            throw new Error('Nenhuma nota encontrada na tabela. Filtre uma turma primeiro.');
        }
        
        // Investigar a estrutura da tabela e attributes disponíveis
        console.log('=== INVESTIGAÇÃO DA TABELA DE NOTAS ===');
        console.log('ID da tabela:', tabela.id);
        console.log('Classes da tabela:', tabela.className);
        console.log('Data attributes da tabela:', Object.keys(tabela.dataset).map(k => `data-${k}=${tabela.dataset[k]}`).join(', '));
        
        // Inspecionar a primeira linha para entender a estrutura
        const primeiraLinha = tbody.querySelector('tr');
        if (primeiraLinha) {
            console.log('=== ANÁLISE DA PRIMEIRA LINHA ===');
            console.log('HTML da primeira linha:', primeiraLinha.outerHTML);
            console.log('Atributos da primeira linha:', Array.from(primeiraLinha.attributes).map(a => `${a.name}="${a.value}"`).join(', '));
            console.log('Dataset da primeira linha:', Object.keys(primeiraLinha.dataset).map(k => `${k}: ${primeiraLinha.dataset[k]}`).join(', '));
            
            // Inspecionar cada célula da primeira linha
            Array.from(primeiraLinha.cells).forEach((cell, index) => {
                console.log(`Célula ${index}:`, {
                    texto: cell.textContent.trim(),
                    html: cell.innerHTML,
                    attrs: Array.from(cell.attributes).map(a => `${a.name}="${a.value}"`).join(', '),
                    dataset: Object.keys(cell.dataset).map(k => `${k}: ${cell.dataset[k]}`).join(', ')
                });
            });
        }
        
        // Extrair e mostrar no console as matrículas dos alunos antes de gerar o PDF
        console.log('Estrutura da tabela que estamos tentando processar:', tabela.outerHTML);
        
        // Console.log de debug para inspecionar todas as linhas
        const linhasDebug = tbody.querySelectorAll('tr');
        console.log(`Encontradas ${linhasDebug.length} linhas na tabela`);
        linhasDebug.forEach((linha, idx) => {
            console.log(`Linha ${idx+1}:`, linha.outerHTML);
        });
        
        // Buscar os IDs dos alunos com suporte a API
        const matriculas = await extrairMatriculasAlunos();
        console.log('Matrículas encontradas (incluindo via API):', matriculas);
        
        // Garantir que as bibliotecas estejam disponíveis
        await garantirBibliotecasPDF();
        
        // Criar documento PDF usando a forma mais compatível possível
        let doc;
        try {
            // Primeiro método: usar window.jspdf.jsPDF (forma UMD padrão)
            if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function') {
                const { jsPDF } = window.jspdf;
                doc = new jsPDF({
                    orientation: 'landscape',  // IMPORTANTE: Usar orientação paisagem para mais espaço
                    unit: 'mm',
                    format: 'a4'
                });
                console.log('PDF criado com jspdf.jsPDF');
            } 
            // Segundo método: usar window.jsPDF (forma global)
            else if (typeof window.jsPDF === 'function') {
                doc = new window.jsPDF({
                    orientation: 'landscape',  // IMPORTANTE: Usar orientação paisagem para mais espaço
                    unit: 'mm',
                    format: 'a4'
                });
                console.log('PDF criado com window.jsPDF');
            } else {
                throw new Error('Não foi possível encontrar o construtor jsPDF.');
            }
        } catch (err) {
            console.error('Erro ao criar instância jsPDF:', err);
            throw new Error(`Não foi possível criar o documento PDF: ${err.message}`);
        }
        
        // Verificar se o AutoTable está disponível
        if (typeof doc.autoTable !== 'function') {
            throw new Error('Plugin AutoTable não encontrado. Tente carregar a página novamente.');
        }
        
        // Adicionar título
        const titulo = 'Relatório de Notas';
        doc.setFontSize(18);
        doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        // Adicionar informações adicionais
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        doc.setFontSize(10);
        doc.text(`Gerado em: ${dataAtual}`, doc.internal.pageSize.getWidth() - 20, 10, { align: 'right' });
        
        // Adicionar logotipo da escola (se disponível)
        const logoElement = document.querySelector('img[alt="Logo Nazaré Rodrigues"]');
        if (logoElement && logoElement.src) {
            try {
                // Imagem está disponível no DOM, tentamos usá-la
                doc.addImage(logoElement.src, 'PNG', 14, 10, 25, 10);
            } catch (logoError) {
                console.warn('Não foi possível adicionar o logotipo ao PDF:', logoError);
            }
        }
        
        // Coletar informações dos filtros
        const filtroTurma = document.getElementById('filtro-turma-notas');
        const filtroDisciplina = document.getElementById('filtro-disciplina-notas');
        const filtroBimestre = document.getElementById('filtro-bimestre-notas');
        const filtroAno = document.getElementById('filtro-ano-notas');
        
        // Adicionar informações dos filtros
        let filtroInfo = '';
        
        if (filtroTurma && filtroTurma.selectedIndex > 0) {
            filtroInfo += `Turma: ${filtroTurma.options[filtroTurma.selectedIndex].text} | `;
        }
        
        if (filtroDisciplina && filtroDisciplina.selectedIndex > 0) {
            filtroInfo += `Disciplina: ${filtroDisciplina.options[filtroDisciplina.selectedIndex].text} | `;
        }
        
        if (filtroBimestre && filtroBimestre.selectedIndex > 0) {
            filtroInfo += `Bimestre: ${filtroBimestre.options[filtroBimestre.selectedIndex].text} | `;
        }
        
        if (filtroAno && filtroAno.selectedIndex > 0) {
            filtroInfo += `Ano: ${filtroAno.options[filtroAno.selectedIndex].text} | `;
        }
        
        // Remover o último separador
        if (filtroInfo.endsWith('| ')) {
            filtroInfo = filtroInfo.substring(0, filtroInfo.length - 2);
        }
        
        // Adicionar informações dos filtros ao PDF
        if (filtroInfo) {
            doc.setFontSize(11);
            doc.text(filtroInfo, doc.internal.pageSize.getWidth() / 2, 23, { align: 'center' });
        }
        
        // Definir colunas para o PDF
        const colunas = [
            { header: 'Matrícula', dataKey: 'idaluno' },
            { header: 'Aluno', dataKey: 'aluno' },
            { header: 'Disciplina', dataKey: 'disciplina' },
            { header: 'Turma', dataKey: 'turma' },
            { header: 'Bimestre', dataKey: 'bimestre' },
            { header: 'N. Mensal', dataKey: 'mensal' },
            { header: 'N. Bimestral', dataKey: 'bimestral' },
            { header: 'Recup.', dataKey: 'recuperacao' },
            { header: 'Média', dataKey: 'media' },
            { header: 'Status', dataKey: 'status' }
        ];
        
        // Coletar dados da tabela
        const dados = [];
        const linhas = tbody.querySelectorAll('tr');
        
        linhas.forEach((linha, index) => {
            // Pular linhas de mensagem (como "Nenhum resultado encontrado")
            if (linha.querySelector('td[colspan]')) return;

            const colunasTabela = linha.querySelectorAll('td');
            if (colunasTabela.length < 10) return; // Pular linhas incompletas

            // Extrair dados da linha
            const idAluno = colunasTabela[0].textContent.trim();
            const nomeAluno = colunasTabela[1].textContent.trim();
            const disciplina = colunasTabela[2].textContent.trim();
            const turma = colunasTabela[3].textContent.trim();
            const bimestre = colunasTabela[4].textContent.trim();
            const mensal = colunasTabela[5].textContent.trim();
            const bimestral = colunasTabela[6].textContent.trim();
            const recuperacao = colunasTabela[7].textContent.trim();
            const media = colunasTabela[8].textContent.trim();
            const status = colunasTabela[9].textContent.trim();

            // Adicionar linha ao array de dados
            dados.push({
                idaluno: idAluno,
                aluno: nomeAluno,
                disciplina,
                turma,
                bimestre,
                mensal,
                bimestral,
                recuperacao,
                media,
                status
            });
        });

        // Ordenar dados por nome do aluno
        dados.sort((a, b) => a.aluno.localeCompare(b.aluno));
        
        // Verificar se há dados para adicionar
        if (dados.length === 0) {
            throw new Error('Nenhum dado válido encontrado na tabela.');
        }
        
        // Calcular a largura total necessária para a tabela
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        console.log(`Dimensões da página: ${pageWidth}mm x ${pageHeight}mm (Modo paisagem)`);
        
        // Total da largura necessária (soma das larguras de todas as colunas)
        // Vamos deixar uma margem de 10mm em cada lado
        const margemLateral = 10;
        const larguraDisponivel = pageWidth - (margemLateral * 2);
        console.log(`Largura disponível para tabela: ${larguraDisponivel}mm`);
        
        // Definir as larguras ótimas para cada coluna com base no tamanho disponível
        const larguraTotal = 220; // Total planejado para as colunas (deixa espaço para margem)
        
        // Ajustar proporcionalmente se necessário
        const fatorAjuste = larguraDisponivel / larguraTotal;
        console.log(`Fator de ajuste para tabela: ${fatorAjuste.toFixed(2)}`);
        
        // Configurações da tabela - Ajustadas para centralizar na página
        const options = {
            startY: 30, // Posição inicial da tabela
            margin: { left: margemLateral, right: margemLateral }, // Margens laterais iguais
            tableWidth: 'auto', // Usar largura automática para aproveitar o espaço
            // Centralizar a tabela horizontalmente
            styles: {
                halign: 'center',
                valign: 'middle',
                overflow: 'ellipsize',
                fontSize: 8,
                minCellHeight: 8,
                font: 'helvetica' // Fonte mais compacta
            },
            headStyles: {
                fillColor: [41, 98, 255],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center', 
                valign: 'middle',
                fontSize: 9,
                cellPadding: {top: 3, right: 2, bottom: 3, left: 2}
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: {top: 2, right: 2, bottom: 2, left: 2} // Reduzir padding para economizar espaço
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            // AJUSTE FINAL DE LARGURAS - Redistribuir o espaço para evitar o erro "units width could not fit page"
            columnStyles: {
                idaluno: { cellWidth: 16, halign: 'center' },        // ID do aluno (matrícula)
                aluno: { cellWidth: 62, halign: 'left' },           // Nome do aluno - reduzido para acomodar
                disciplina: { cellWidth: 20, halign: 'center' },     // Disciplina - centralizando
                turma: { cellWidth: 15, halign: 'center' },          // Turma
                bimestre: { cellWidth: 15, halign: 'center' },       // Bimestre 
                mensal: { cellWidth: 16, halign: 'center' },         // N. Mensal 
                bimestral: { cellWidth: 20, halign: 'center' },      // N. Bimestral 
                recuperacao: { cellWidth: 16, halign: 'center' },    // Recuperação
                media: { cellWidth: 15, halign: 'center' },          // Média
                status: { cellWidth: 25, halign: 'center' }          // Status
            },
            // Ajustar o tamanho da fonte para textos longos
            willDrawCell: function(data) {
                // Reduzir o tamanho da fonte se o texto for muito longo para a célula
                if (data.cell.text && typeof data.cell.text === 'string') {
                    const text = data.cell.text;
                    const maxWidth = data.cell.styles.cellWidth;
                    
                    // Aproximação do tamanho do texto baseado na fonte atual
                    const textWidth = text.length * data.cell.styles.fontSize * 0.5;
                    
                    if (textWidth > maxWidth) {
                        // Reduzir a fonte para caber - mas não menor que 6
                        const newSize = Math.max(6, Math.floor(maxWidth / (text.length * 0.5)));
                        data.cell.styles.fontSize = newSize;
                    }
                }
            },
            // Adicionar informações na página
            didDrawPage: function(data) {
                // Adicionar informação sobre a geração do relatório no rodapé
                
                // Adicionar timestamp de geração
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(
                    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
                    pageWidth - 15,
                    pageHeight - 5,
                    { align: 'right' }
                );
                
                // Adicionar rodapé centralizado
                doc.setFontSize(8);
                doc.setTextColor(80);
                doc.text(
                    'EMEF Nazaré Rodrigues - Sistema de Gestão Escolar',
                    pageWidth / 2,
                    pageHeight - 5,
                    { align: 'center' }
                );
                
                // Adicionar número da página no rodapé
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(
                    `Página ${doc.internal.getNumberOfPages()}`,
                    15,
                    pageHeight - 5,
                    { align: 'left' }
                );
            }
        };
        
        // Tentar gerar a tabela
        try {
            doc.autoTable({
                columns: colunas,
                body: dados,
                ...options,
                // Estilo para células com status
                didDrawCell: function(data) {
                    if (data.column.dataKey === 'status') {
                        const statusText = data.cell.raw;
                        
                        // Garantir que temos um status válido e não duplicado
                        if (statusText === 'Aprovado') {
                            doc.setFillColor(200, 255, 200); // Verde claro
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                            doc.setTextColor(0, 100, 0); // Verde escuro
                            doc.text('Aprovado', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                                align: 'center',
                                baseline: 'middle'
                            });
                            return true; // Para evitar que o plugin desenhe o texto
                        }
                        else if (statusText === 'Reprovado' || statusText.includes('Reprovado')) {
                            doc.setFillColor(255, 200, 200); // Vermelho claro
                            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                            doc.setTextColor(100, 0, 0); // Vermelho escuro
                            doc.text('Reprovado', data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, {
                                align: 'center',
                                baseline: 'middle'
                            });
                            return true; // Para evitar que o plugin desenhe o texto
                        }
                    }
                }
            });
        } catch (tableErr) {
            console.error('Erro ao gerar tabela no PDF:', tableErr);
            throw new Error(`Erro ao gerar tabela: ${tableErr.message}`);
        }
        
        // Adicionar rodapé
        const numeroPaginas = doc.internal.getNumberOfPages();
        for (let i = 1; i <= numeroPaginas; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(
                `Página ${i} de ${numeroPaginas}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
            doc.text(
                'EMEF Nazaré Rodrigues',
                doc.internal.pageSize.getWidth() - 15,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'right' }
            );
        }
        
        // Salvar o PDF
        const nomeArquivo = `Notas_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
        doc.save(nomeArquivo);
        
        console.log(`PDF gerado com sucesso: ${nomeArquivo}`);
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert(`Erro ao gerar PDF: ${error.message}`);
    } finally {
        // Sempre liberar o controle quando terminar
        gerandoPDF = false;
    }
}

// Registrar a função globalmente
window.gerarPDFNotas = gerarPDFNotas;

// Log para indicar que o script foi carregado
console.log('Módulo gerador-pdf.js carregado com sucesso');
