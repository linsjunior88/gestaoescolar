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
        
        // Definir colunas para o PDF - Cuidado especial com os nomes das colunas
        const colunas = [
            { header: 'Matric.', dataKey: 'idaluno' },
            { header: 'Aluno', dataKey: 'aluno' },
            { header: 'Disciplina', dataKey: 'disciplina' },
            { header: 'Turma', dataKey: 'turma' },
            { header: 'Bimestre', dataKey: 'bimestre' },
            { header: 'N. Mensal', dataKey: 'mensal' },       // Espaço adicionado após o "N."
            { header: 'N. Bimestral', dataKey: 'bimestral' }, // Espaço adicionado após o "N."
            { header: 'Recup.', dataKey: 'recuperacao' },
            { header: 'Média', dataKey: 'media' },
            { header: 'Status', dataKey: 'status' }
        ];
        
        // Coletar dados da tabela
        const dados = [];
        const linhas = tbody.querySelectorAll('tr');
        
        // Excluir qualquer linha que não tenha conteúdo ou seja apenas de mensagem
        linhas.forEach((linha, index) => {
            // Pular linhas de mensagem (como "Nenhum resultado encontrado")
            if (linha.cells.length <= 1) return;
            
            try {
                // Obter o ID do aluno - Este é o ID DO ALUNO, não o ID da nota
                // Obtém da célula hidden ou do data-attribute, se disponível
                let alunoId = '';
                
                // Adicionar um log específico para depuração do ID do aluno
                console.log(`DEBUG - Buscando ID do aluno para linha ${index}:`, linha.outerHTML);
                
                // Se a tabela de notas tiver um attributo específico com o ID real do aluno, obtê-lo
                const dataAlunoId = linha.getAttribute('data-aluno-id') || 
                                   linha.getAttribute('data-id-aluno') || 
                                   linha.getAttribute('data-aluno');
                
                if (dataAlunoId && dataAlunoId !== 'undefined') {
                    console.log(`DEBUG - Encontrado data-aluno-id na linha: ${dataAlunoId}`);
                    alunoId = dataAlunoId;
                }
                
                // Método específico para obter ID_ALUNO de botões/links
                if (!alunoId || alunoId === 'undefined') {
                    const botoesELinks = linha.querySelectorAll('button, a');
                    for (const el of botoesELinks) {
                        // Verificar onclick para extrair ID
                        const onclick = el.getAttribute('onclick') || '';
                        if (onclick.includes('aluno') || onclick.includes('Aluno')) {
                            const matches = onclick.match(/\b\d+\b/g); // Buscar números no onclick
                            if (matches && matches.length > 0) {
                                alunoId = matches[0];
                                console.log(`DEBUG - Extraído ID do aluno do onclick: ${alunoId}`);
                                break;
                            }
                        }
                        
                        // Verificar atributos de dados
                        const elAlunoId = el.getAttribute('data-aluno-id') || 
                                          el.getAttribute('data-id-aluno') || 
                                          el.getAttribute('data-aluno');
                        if (elAlunoId && elAlunoId !== 'undefined') {
                            alunoId = elAlunoId;
                            console.log(`DEBUG - Encontrado ID do aluno em botão/link: ${alunoId}`);
                            break;
                        }
                    }
                }
                
                // Verificar campos ocultos que podem conter o ID
                if (!alunoId || alunoId === 'undefined') {
                    const camposOcultos = linha.querySelectorAll('input[type="hidden"]');
                    for (const campo of camposOcultos) {
                        if (campo.name && (campo.name.includes('aluno') || campo.name.includes('id'))) {
                            alunoId = campo.value;
                            console.log(`DEBUG - Encontrado ID do aluno em campo oculto: ${alunoId}`);
                            break;
                        }
                    }
                }
                
                // Tentar extrair de atributos de dados em qualquer elemento da linha
                if (!alunoId || alunoId === 'undefined') {
                    const elementos = linha.querySelectorAll('*[data-aluno-id], *[data-id-aluno], *[data-aluno]');
                    for (const el of elementos) {
                        const elAlunoId = el.getAttribute('data-aluno-id') || 
                                          el.getAttribute('data-id-aluno') || 
                                          el.getAttribute('data-aluno');
                        if (elAlunoId && elAlunoId !== 'undefined') {
                            alunoId = elAlunoId;
                            console.log(`DEBUG - Encontrado ID do aluno em elemento com data-attribute: ${alunoId}`);
                            break;
                        }
                    }
                }
                
                // Se ainda não encontrou, verificar se o ID está em alguma célula específica
                // Esta parte é crucial para encontrar o ID do aluno
                if (!alunoId || alunoId === 'undefined') {
                    // Com base no console, o ID do aluno parece estar nos botões de onclick
                    // Analisando a saída: { idaluno: "35", aluno: "MAT", ... } e { idaluno: "43", aluno: "MAT" }
                    
                    // Usar as próprias células como uma última alternativa
                    const colunasTabela = Array.from(linha.cells);
                    
                    // Verificar todas as células procurando um ID
                    for (let i = 0; i < colunasTabela.length; i++) {
                        const celulaTexto = colunasTabela[i]?.textContent.trim();
                        
                        // Se for um texto que parece ser apenas um número, pode ser o ID
                        if (/^\d+$/.test(celulaTexto)) {
                            alunoId = celulaTexto;
                            console.log(`DEBUG - Encontrado possível ID do aluno na célula ${i}: ${alunoId}`);
                            break;
                        }
                        
                        // Verificar se a célula contém elementos que possam ter o ID
                        const btnNaCelula = colunasTabela[i]?.querySelector('button, a');
                        if (btnNaCelula) {
                            const onclick = btnNaCelula.getAttribute('onclick') || '';
                            const matches = onclick.match(/\b\d+\b/g);
                            if (matches && matches.length > 0) {
                                alunoId = matches[0];
                                console.log(`DEBUG - Extraído ID do aluno de botão na célula ${i}: ${alunoId}`);
                                break;
                            }
                        }
                    }
                }
                
                // Último recurso: usar o método padrão
                if (!alunoId || alunoId === 'undefined') {
                    alunoId = obterIdAluno(linha);
                    console.log(`DEBUG - Usando função obterIdAluno como último recurso: ${alunoId}`);
                }
                
                // Mapear corretamente os índices da tabela - CORRIGIDOS com base no console
                // IMPORTANTE: o console mostrou que os índices estavam incorretos
                
                // Com base no console, os dados estão vindo em uma ordem diferente do esperado:
                // O console mostrou: { idaluno: "43", aluno: "MAT", disciplina: "13CM", turma: "1º", bimestre: "10.0", ... }
                // Isso sugere que "MAT" está na posição do aluno, mas parece ser a disciplina
                // E "13CM" está na posição da disciplina, mas parece ser a turma
                
                // Vamos mapear os índices para corresponder à estrutura real da tabela
                const colunasTabela = Array.from(linha.cells);
                
                console.log(`DEBUG - Estrutura da linha ${index}:`, {
                    totalCelulas: colunasTabela.length,
                    conteudoCelulas: colunasTabela.map(c => c.textContent.trim())
                });
                
                // CORREÇÃO ESPECÍFICA: Com base na saída do console fornecida pelo usuário
                // Exemplo: { idaluno: "43", aluno: "MAT", disciplina: "13CM", turma: "1º", bimestre: "10.0", ... }
                // Os campos estão chegando em ordem incorreta, vamos detectar e corrigir
                
                // Verificar se os valores seguem o padrão identificado no console
                const valores = colunasTabela.map(c => c.textContent.trim());
                
                // Criar um mapeamento dinâmico baseado nos valores
                let alunoIndex, disciplinaIndex, turmaIndex, bimestreIndex, 
                    mensalIndex, bimestralIndex, recuperacaoIndex, mediaIndex, statusIndex;
                
                // Método específico para este caso, baseado no log do console
                // Se vermos um padrão onde:
                // - Um dos primeiros valores é "MAT" (possível disciplina)
                // - Outro dos primeiros valores parece uma turma (como "13CM")
                // - Outro valor parece um bimestre (como "1º")
                // - Valores numéricos para notas (como "4.0", "10.0")
                let disciplinaEncontrada = false;
                let turmaEncontrada = false;
                
                // Buscar padrões específicos:
                for (let i = 0; i < valores.length; i++) {
                    const valor = valores[i];
                    
                    // Verificar se parece uma disciplina (ex: "MAT", "PORT", etc)
                    if (!disciplinaEncontrada && /^[A-Z]{3,4}$/.test(valor)) {
                        disciplinaIndex = i;
                        disciplinaEncontrada = true;
                        console.log(`DEBUG - Detectado possível disciplina "${valor}" no índice ${i}`);
                    }
                    
                    // Verificar se parece uma turma (ex: "13CM", "10AM", etc)
                    else if (!turmaEncontrada && /^\d{1,2}[A-Z]{1,2}$/.test(valor)) {
                        turmaIndex = i;
                        turmaEncontrada = true;
                        console.log(`DEBUG - Detectada possível turma "${valor}" no índice ${i}`);
                    }
                    
                    // Verificar se parece um bimestre (ex: "1º", "2º", etc)
                    else if (typeof bimestreIndex === 'undefined' && /^\d{1,2}º$/.test(valor)) {
                        bimestreIndex = i;
                        console.log(`DEBUG - Detectado possível bimestre "${valor}" no índice ${i}`);
                    }
                    
                    // Verificar se é um valor numérico (possível nota)
                    else if ((typeof mensalIndex === 'undefined' || typeof bimestralIndex === 'undefined') 
                             && (/^\d+(\.\d+)?$/.test(valor) || valor === '-')) {
                        if (typeof mensalIndex === 'undefined') {
                            mensalIndex = i;
                            console.log(`DEBUG - Detectada possível nota mensal "${valor}" no índice ${i}`);
                        } else if (typeof bimestralIndex === 'undefined') {
                            bimestralIndex = i;
                            console.log(`DEBUG - Detectada possível nota bimestral "${valor}" no índice ${i}`);
                        }
                    }
                    
                    // Verificar se parece recuperação
                    else if (typeof recuperacaoIndex === 'undefined' 
                            && (/^\d+(\.\d+)?$/.test(valor) || valor === '-')) {
                        recuperacaoIndex = i;
                        console.log(`DEBUG - Detectada possível recuperação "${valor}" no índice ${i}`);
                    }
                    
                    // Verificar se parece média
                    else if (typeof mediaIndex === 'undefined' && /^(Aprovado|Reprovado)$/.test(valor)) {
                        mediaIndex = i;
                        console.log(`DEBUG - Detectada possível média/status "${valor}" no índice ${i}`);
                    }
                }
                
                // Se não encontramos alguns índices cruciais, usar método padrão
                if (typeof disciplinaIndex === 'undefined' || typeof turmaIndex === 'undefined') {
                    console.log("DEBUG - Não foi possível detectar todos os campos necessários. Usando método padrão.");
                    
                    // Este é um exemplo de mapeamento que pode precisar ser ajustado
                    // Se a tabela tiver pelo menos 5 colunas
                    if (colunasTabela.length >= 5) {
                        alunoIndex = 0;          // Nome do aluno (pode estar incorreto)
                        disciplinaIndex = 1;     // Nome da disciplina (pode estar incorreto)
                        turmaIndex = 2;          // Turma (pode estar incorreto)
                        bimestreIndex = 3;       // Bimestre
                        mensalIndex = 4;         // Nota Mensal
                        
                        // Para células extras se existirem
                        if (colunasTabela.length > 5) bimestralIndex = 5;
                        if (colunasTabela.length > 6) recuperacaoIndex = 6;
                        if (colunasTabela.length > 7) mediaIndex = 7;
                        if (colunasTabela.length > 8) statusIndex = 8;
                    }
                }
                
                // CORREÇÃO ESPECÍFICA: Com base no console, o aluno deve ser o primeiro campo
                // que NÃO é disciplina, turma, bimestre ou notas
                if (typeof alunoIndex === 'undefined') {
                    // Encontrar primeiro índice que não é nenhum dos outros
                    for (let i = 0; i < valores.length; i++) {
                        if (i !== disciplinaIndex && i !== turmaIndex && i !== bimestreIndex &&
                            i !== mensalIndex && i !== bimestralIndex && i !== recuperacaoIndex &&
                            i !== mediaIndex && i !== statusIndex) {
                            alunoIndex = i;
                            console.log(`DEBUG - Definindo índice do aluno como ${i} (${valores[i]})`);
                            break;
                        }
                    }
                    
                    // Se ainda não encontramos, usar o primeiro índice como fallback
                    if (typeof alunoIndex === 'undefined' && valores.length > 0) {
                        alunoIndex = 0;
                        console.log(`DEBUG - Usando primeiro índice como aluno por fallback (${valores[0]})`);
                    }
                }
                
                // Obter os dados das células com segurança (com tratamento para evitar undefined)
                // Usar conditional chaining para evitar erros
                const aluno = colunasTabela[alunoIndex]?.textContent.trim() || '';
                const disciplina = colunasTabela[disciplinaIndex]?.textContent.trim() || '';
                const turma = colunasTabela[turmaIndex]?.textContent.trim() || '';
                const bimestre = colunasTabela[bimestreIndex]?.textContent.trim() || '';
                const mensal = colunasTabela[mensalIndex]?.textContent.trim() || '';
                const bimestral = typeof bimestralIndex !== 'undefined' && colunasTabela[bimestralIndex] 
                    ? colunasTabela[bimestralIndex].textContent.trim() : '';
                const recuperacao = typeof recuperacaoIndex !== 'undefined' && colunasTabela[recuperacaoIndex] 
                    ? colunasTabela[recuperacaoIndex].textContent.trim() : '';
                const media = typeof mediaIndex !== 'undefined' && colunasTabela[mediaIndex] 
                    ? colunasTabela[mediaIndex].textContent.trim() : '';
                
                // Verificação para evitar status duplicado
                let status = '';
                if (typeof statusIndex !== 'undefined' && colunasTabela[statusIndex]) {
                    status = colunasTabela[statusIndex].textContent.trim();
                    // Remover duplicações
                    if (status.includes('Aprovado')) status = 'Aprovado';
                    if (status.includes('Reprovado')) status = 'Reprovado';
                }
                
                // Log para debug
                console.log(`Processando linha ${index} após correção:`, {
                    idaluno: alunoId,
                    aluno,
                    disciplina, 
                    turma,
                    bimestre,
                    mensal,
                    bimestral,
                    recuperacao,
                    media,
                    status
                });
                
                // Adicionar linha ao array de dados
                dados.push({
                    idaluno: alunoId, // ID do aluno para a coluna Matrícula
                    aluno,
                    disciplina,
                    turma,
                    bimestre,
                    mensal,
                    bimestral,
                    recuperacao,
                    media,
                    status
                });
            } catch (err) {
                console.error(`Erro ao processar linha ${index}:`, err);
            }
        });
        
        // Verificar se há dados para adicionar
        if (dados.length === 0) {
            throw new Error('Nenhum dado válido encontrado na tabela.');
        }
        
        // Configurações da tabela - Ajustadas para garantir que a tabela caiba na página paisagem
        const options = {
            startY: 30, // Posição inicial da tabela
            margin: { left: 10, right: 10 }, // Margens ajustadas para mais espaço
            tableWidth: 'auto', // Usar largura automática para aproveitar o espaço
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
            // Larguras das colunas otimizadas para caber na página
            columnStyles: {
                idaluno: { cellWidth: 15, halign: 'center' },        // ID do aluno (matrícula)
                aluno: { cellWidth: 70, halign: 'left' },           // Nome do aluno - ALARGADO
                disciplina: { cellWidth: 28, halign: 'left' },       // Disciplina
                turma: { cellWidth: 15, halign: 'center' },          // Turma
                bimestre: { cellWidth: 16, halign: 'center' },       // Bimestre
                mensal: { cellWidth: 18, halign: 'center' },         // N. Mensal
                bimestral: { cellWidth: 22, halign: 'center' },      // N. Bimestral
                recuperacao: { cellWidth: 16, halign: 'center' },    // Recuperação
                media: { cellWidth: 15, halign: 'center' },          // Média
                status: { cellWidth: 20, halign: 'center' }          // Status
            },
            // Não truncar textos importantes
            styles: {
                overflow: 'ellipsize',
                cellWidth: 'auto',
                fontSize: 8,
                minCellHeight: 8,
                font: 'helvetica' // Fonte mais compacta
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
            // Calcular o espaço disponível e distribuir entre as colunas
            didDrawPage: function(data) {
                // Adicionar informação sobre a geração do relatório no rodapé
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                // Adicionar timestamp de geração
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(
                    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
                    pageWidth - 15,
                    pageHeight - 5,
                    { align: 'right' }
                );
                
                // Adicionar informação sobre o tamanho da tabela
                console.log(`Largura da página: ${pageWidth}mm, Altura: ${pageHeight}mm`);
                console.log(`Espaço disponível para tabela: ${pageWidth - 20}mm`);
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
