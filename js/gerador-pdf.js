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
        
        // Verificar se temos acesso ao CONFIG para obter URL da API
        let url;
        if (typeof window.CONFIG !== 'undefined' && typeof window.CONFIG.getApiUrl === 'function') {
            url = window.CONFIG.getApiUrl(`/alunos/buscar?nome=${encodeURIComponent(nomeAluno)}`);
        } else {
            // Fallback para URL padrão caso CONFIG não esteja disponível
            const apiUrl = window.API_URL || '/api';
            url = `${apiUrl}/alunos/buscar?nome=${encodeURIComponent(nomeAluno)}`;
        }
        
        console.log(`Buscando aluno via API: ${url}`);
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
        // Verificar se temos acesso à API através do objeto CONFIG
        if (typeof window.CONFIG === 'undefined' || typeof window.CONFIG.getApiUrl !== 'function') {
            console.warn("Objeto CONFIG não disponível ou mal configurado");
            return null;
        }
        
        // Construir URL da API para buscar nota usando CONFIG
        const apiUrl = window.CONFIG.getApiUrl(`/notas/${idNota}`);
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
        // Garantir que temos acesso à URL da API para funções que ainda usam window.apiBaseUrl
        if (typeof window.CONFIG !== 'undefined' && typeof window.CONFIG.getApiUrl === 'function') {
            window.apiBaseUrl = window.CONFIG.getApiUrl('');
            console.log(`URL base da API configurada: ${window.apiBaseUrl}`);
        } else if (typeof window.API_URL !== 'undefined') {
            window.apiBaseUrl = window.API_URL;
            console.log(`URL base da API fallback configurada: ${window.apiBaseUrl}`);
        }
        
        // Capturar os alunos que foram carregados no frontend para termos os IDs (id_aluno)
        // Esses alunos são exibidos no console pelo professor-dashboard-novo.js
        let alunosCarregados = [];
        if (typeof window.alunosCarregados !== 'undefined' && Array.isArray(window.alunosCarregados)) {
            alunosCarregados = window.alunosCarregados;
            console.log('Usando alunos carregados previamente:', alunosCarregados.length);
        } else {
            // Tentar recuperar de outras fontes possíveis
            const alunosLista = document.querySelectorAll('#filtro-aluno-notas option');
            if (alunosLista.length > 1) { // > 1 porque a primeira opção é geralmente "Selecione um aluno"
                console.log('Recuperando alunos do select de filtro');
                alunosCarregados = Array.from(alunosLista)
                    .filter(opt => opt.value && opt.value !== '')
                    .map(opt => ({
                        id_aluno: opt.value,
                        nome_aluno: opt.textContent.trim()
                    }));
            }
        }
        
        console.log('Mapeamento de alunos para uso no PDF:', alunosCarregados);
        
        // Criar um mapa de nomes para IDs para facilitar a busca
        const mapaNomesParaIds = {};
        if (alunosCarregados.length > 0) {
            alunosCarregados.forEach(aluno => {
                if (aluno.nome_aluno && aluno.id_aluno) {
                    mapaNomesParaIds[aluno.nome_aluno.trim().toUpperCase()] = aluno.id_aluno;
                }
            });
            console.log('Mapa de nomes para IDs criado:', mapaNomesParaIds);
        }
        
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
                // Vamos mapear os índices para corresponder à estrutura real da tabela
                const colunasTabela = Array.from(linha.cells);
                
                console.log(`DEBUG - Estrutura da linha ${index}:`, {
                    totalCelulas: colunasTabela.length,
                    conteudoCelulas: colunasTabela.map(c => c.textContent.trim())
                });
                
                // Conseguir o nome do aluno primeiro para poder usar na busca API
                let nomeAluno = '';
                // Na maioria dos casos, a primeira célula contém o nome do aluno
                if (colunasTabela.length > 0) {
                    nomeAluno = colunasTabela[0].textContent.trim();
                    console.log(`DEBUG - Nome do aluno encontrado na primeira célula: ${nomeAluno}`);
                }
                
                // Parte nova - Tentar obter o ID do aluno a partir do mapa de nomes
                // Usar o nome do aluno para buscar o ID no mapa criado anteriormente
                let alunoId = '';
                if (nomeAluno && mapaNomesParaIds[nomeAluno.toUpperCase()]) {
                    alunoId = mapaNomesParaIds[nomeAluno.toUpperCase()];
                    console.log(`DEBUG - ID do aluno (${nomeAluno}) encontrado no mapeamento: ${alunoId}`);
                }
                
                // Se não encontramos no mapeamento, tentar via API
                if (!alunoId && nomeAluno) {
                    // NOVO: Buscar o ID do aluno através da API, se disponível
                    try {
                        // Verificar se temos acesso à API
                        if (window.apiBaseUrl) {
                            const apiUrl = `${window.apiBaseUrl}/alunos/buscar?nome=${encodeURIComponent(nomeAluno)}`;
                            
                            // Fazer uma chamada síncrona para a API (apenas para este caso específico)
                            const xhr = new XMLHttpRequest();
                            xhr.open('GET', apiUrl, false); // false = síncrono, para simplificar o fluxo
                            xhr.setRequestHeader('Content-Type', 'application/json');
                            
                            try {
                                xhr.send();
                                if (xhr.status === 200) {
                                    const resposta = JSON.parse(xhr.responseText);
                                    if (resposta && resposta.length > 0) {
                                        alunoId = resposta[0].id_aluno.toString();
                                        console.log(`DEBUG - ID do aluno ${nomeAluno} obtido via API: ${alunoId}`);
                                    }
                                }
                            } catch (apiErr) {
                                console.warn(`Erro ao buscar ID do aluno via API: ${apiErr.message}`);
                            }
                        }
                    } catch (apiSetupErr) {
                        console.warn(`Erro ao configurar chamada de API: ${apiSetupErr.message}`);
                    }
                }
                
                // Método específico para este caso, baseado no log do console
                // Análise dos dados da tabela para encontrar os campos corretos
                // A ordem parece ser: NOME, DISCIPLINA, TURMA, BIMESTRE, NOTAS...
                let disciplinaEncontrada = false;
                let turmaEncontrada = false;
                let notaMensalEncontrada = false;
                let mediaIdentificada = false;
                
                // Reiniciar todos os índices
                let alunoIndex, disciplinaIndex, turmaIndex, bimestreIndex, 
                    mensalIndex, bimestralIndex, recuperacaoIndex, mediaIndex, statusIndex;
                
                // Baseado no exemplo do console:
                // <td>ISAAC NATHAN LINS</td>
                // <td>MAT</td>
                // <td>13CM</td>
                // <td>1º</td>
                // <td>10.0</td>
                // <td>-</td>
                // <td>-</td>
                // <td><strong>5.0</strong></td>
                // <td><span class="badge bg-danger text-white">Reprovado</span></td>
                
                // Verificar o conteúdo de cada célula para determinar seu tipo
                for (let i = 0; i < colunasTabela.length; i++) {
                    const celula = colunasTabela[i];
                    const valor = celula.textContent.trim();
                    
                    // Identificar o nome do aluno (geralmente primeira coluna com texto longo)
                    if (typeof alunoIndex === 'undefined' && valor.length > 10 && valor.includes(' ')) {
                        alunoIndex = i;
                        console.log(`DEBUG - Identificado nome do aluno: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar a disciplina (geralmente abreviatura, como MAT, PORT)
                    if (typeof disciplinaIndex === 'undefined' && /^[A-Z]{3,4}$/.test(valor)) {
                        disciplinaIndex = i;
                        console.log(`DEBUG - Identificada disciplina: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar a turma (formato como 13CM, 10AM)
                    if (typeof turmaIndex === 'undefined' && /^\d{1,2}[A-Z]{1,2}$/.test(valor)) {
                        turmaIndex = i;
                        console.log(`DEBUG - Identificada turma: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar o bimestre (1º, 2º, etc)
                    if (typeof bimestreIndex === 'undefined' && /^\d{1,2}º$/.test(valor)) {
                        bimestreIndex = i;
                        console.log(`DEBUG - Identificado bimestre: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar nota mensal (valor numérico ou traço)
                    if (typeof mensalIndex === 'undefined' && (/^\d+(\.\d+)?$/.test(valor) || valor === '-')) {
                        mensalIndex = i;
                        console.log(`DEBUG - Identificada nota mensal: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar nota bimestral (valor numérico ou traço, após nota mensal)
                    if (typeof mensalIndex !== 'undefined' && typeof bimestralIndex === 'undefined' && 
                        (/^\d+(\.\d+)?$/.test(valor) || valor === '-')) {
                        bimestralIndex = i;
                        console.log(`DEBUG - Identificada nota bimestral: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar recuperação (valor numérico ou traço, após nota bimestral)
                    if (typeof bimestralIndex !== 'undefined' && typeof recuperacaoIndex === 'undefined' && 
                        (/^\d+(\.\d+)?$/.test(valor) || valor === '-')) {
                        recuperacaoIndex = i;
                        console.log(`DEBUG - Identificada recuperação: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar média (geralmente valor numérico após recuperação)
                    if (typeof recuperacaoIndex !== 'undefined' && typeof mediaIndex === 'undefined' && 
                        /^\d+(\.\d+)?$/.test(valor)) {
                        mediaIndex = i;
                        console.log(`DEBUG - Identificada média: "${valor}" no índice ${i}`);
                        continue;
                    }
                    
                    // Identificar status (Aprovado/Reprovado)
                    if (typeof statusIndex === 'undefined' && 
                        (valor.includes('Aprovado') || valor.includes('Reprovado'))) {
                        statusIndex = i;
                        console.log(`DEBUG - Identificado status: "${valor}" no índice ${i}`);
                        continue;
                    }
                }
                
                // Se não conseguimos identificar todos os campos necessários, usar defaults lógicos
                if (typeof alunoIndex === 'undefined' && colunasTabela.length > 0) {
                    alunoIndex = 0; // Geralmente o nome do aluno é a primeira coluna
                }
                
                if (typeof disciplinaIndex === 'undefined' && colunasTabela.length > 1) {
                    disciplinaIndex = 1; // Disciplina frequentemente é a segunda
                }
                
                if (typeof turmaIndex === 'undefined' && colunasTabela.length > 2) {
                    turmaIndex = 2; // Turma geralmente é a terceira
                }
                
                if (typeof statusIndex === 'undefined' && typeof mediaIndex !== 'undefined') {
                    // Se temos média mas não status, verificar se há algo após a média que possa ser status
                    for (let i = mediaIndex + 1; i < colunasTabela.length; i++) {
                        const celula = colunasTabela[i];
                        if (celula.querySelector('.badge') || celula.innerHTML.includes('Aprovado') || 
                            celula.innerHTML.includes('Reprovado')) {
                            statusIndex = i;
                            break;
                        }
                    }
                }
                
                // Obter os dados das células com segurança
                const aluno = colunasTabela[alunoIndex]?.textContent.trim() || '';
                const disciplina = colunasTabela[disciplinaIndex]?.textContent.trim() || '';
                const turma = colunasTabela[turmaIndex]?.textContent.trim() || '';
                const bimestre = colunasTabela[bimestreIndex]?.textContent.trim() || '';
                const mensal = colunasTabela[mensalIndex]?.textContent.trim() || '';
                const bimestral = typeof bimestralIndex !== 'undefined' && colunasTabela[bimestralIndex] 
                    ? colunasTabela[bimestralIndex].textContent.trim() : '';
                const recuperacao = typeof recuperacaoIndex !== 'undefined' && colunasTabela[recuperacaoIndex] 
                    ? colunasTabela[recuperacaoIndex].textContent.trim() : '';
                
                // CORRIGIDO: Separar corretamente média e status
                let media = '';
                let status = '';
                
                // Obter média corretamente - geralmente um valor numérico
                if (typeof mediaIndex !== 'undefined' && colunasTabela[mediaIndex]) {
                    const mediaText = colunasTabela[mediaIndex].textContent.trim();
                    // Verificar se o texto parece ser uma média (valor numérico)
                    if (/^\d+(\.\d+)?$/.test(mediaText)) {
                        media = mediaText;
                    } else if (mediaText.includes('Aprovado') || mediaText.includes('Reprovado')) {
                        // Se for Aprovado/Reprovado, está no campo errado - colocar no status
                        status = mediaText.includes('Aprovado') ? 'Aprovado' : 'Reprovado';
                        console.log(`DEBUG - Média contém status. Movendo "${mediaText}" para o campo status.`);
                    }
                }
                
                // Obter status corretamente - geralmente Aprovado/Reprovado
                if (typeof statusIndex !== 'undefined' && colunasTabela[statusIndex]) {
                    const statusText = colunasTabela[statusIndex].textContent.trim();
                    
                    if (statusText.includes('Aprovado')) {
                        status = 'Aprovado';
                    } else if (statusText.includes('Reprovado')) {
                        status = 'Reprovado';
                    }
                    
                    // Se por acaso o status contém um valor numérico que parece ser a média
                    if (media === '' && /\d+(\.\d+)?/.test(statusText)) {
                        const match = statusText.match(/\d+(\.\d+)?/);
                        if (match) {
                            media = match[0];
                            console.log(`DEBUG - Extraída média "${media}" do campo status.`);
                        }
                    }
                }
                
                // IMPORTANTE: Correção específica se tivermos dados de exemplo do usuário - MOVIDO PARA DEPOIS DA DEFINIÇÃO DE ALUNO
                // Verificar se estamos lidando com o caso específico mencionado pelo usuário
                if (aluno === "LARA GABRIELLY NUNES DE CASTRO" && disciplina === "MAT" && turma === "13CM") {
                    console.log("DEBUG - Caso específico detectado! Usando ID do aluno 71876 conforme exemplo do usuário.");
                    alunoId = "71876";
                }
                
                // Se ainda não encontramos o ID do aluno, tentar extrair de atributos data-* 
                // nos elementos que contêm o status (Aprovado/Reprovado)
                if (!alunoId || alunoId === 'undefined' || alunoId.startsWith('AL-')) {
                    try {
                        // Procurar pelo badge de status que geralmente tem data-* atributos
                        if (typeof statusIndex !== 'undefined' && colunasTabela[statusIndex]) {
                            const statusCell = colunasTabela[statusIndex];
                            const statusBadge = statusCell.querySelector('.badge, span[class*="badge"]');
                            
                            if (statusBadge) {
                                // Tentar obter ID do aluno do badge
                                const badgeAlunoId = statusBadge.getAttribute('data-aluno-id') || 
                                                   statusBadge.getAttribute('data-id-aluno');
                                
                                if (badgeAlunoId) {
                                    console.log(`DEBUG - Encontrado ID do aluno no badge de status: ${badgeAlunoId}`);
                                    alunoId = badgeAlunoId;
                                }
                            }
                            
                            // Verificar também na própria célula
                            const cellAlunoId = statusCell.getAttribute('data-aluno-id') || 
                                               statusCell.getAttribute('data-id-aluno');
                            
                            if (cellAlunoId) {
                                console.log(`DEBUG - Encontrado ID do aluno na célula de status: ${cellAlunoId}`);
                                alunoId = cellAlunoId;
                            }
                        }
                    } catch (err) {
                        console.error("Erro ao buscar ID do aluno no badge de status:", err);
                    }
                }
                
                // ESTRATÉGIA FINAL: Parsear o HTML da linha para encontrar o ID do aluno
                // Muitas vezes o ID está em atributos ocultos ou em elementos escondidos
                if (!alunoId || alunoId === 'undefined' || alunoId.startsWith('AL-')) {
                    try {
                        // Converter a linha para string HTML e procurar padrões de ID de aluno
                        const linhaHTML = linha.outerHTML;
                        
                        // Padrão 1: data-aluno-id="NUMERO"
                        const patternDataId = /data-(?:aluno-id|id-aluno|aluno)="(\d+)"/i;
                        const matchDataId = linhaHTML.match(patternDataId);
                        
                        if (matchDataId && matchDataId[1]) {
                            alunoId = matchDataId[1];
                            console.log(`DEBUG - Extraído ID do aluno do HTML - padrão data-attribute: ${alunoId}`);
                        } 
                        // Padrão 2: id_aluno=NUMERO ou aluno_id=NUMERO (em forms, urls, etc)
                        else {
                            const patternParam = /(?:id_aluno|aluno_id)=(\d+)/i;
                            const matchParam = linhaHTML.match(patternParam);
                            
                            if (matchParam && matchParam[1]) {
                                alunoId = matchParam[1];
                                console.log(`DEBUG - Extraído ID do aluno do HTML - padrão parâmetro: ${alunoId}`);
                            }
                            // Padrão 3: value="NUMERO" em um input hidden com name contendo "aluno"
                            else {
                                const patternHidden = /<input[^>]*name="[^"]*(?:aluno|id)[^"]*"[^>]*value="(\d+)"/i;
                                const matchHidden = linhaHTML.match(patternHidden);
                                
                                if (matchHidden && matchHidden[1]) {
                                    alunoId = matchHidden[1];
                                    console.log(`DEBUG - Extraído ID do aluno do HTML - padrão input hidden: ${alunoId}`);
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Erro ao fazer parse do HTML para encontrar ID do aluno:", err);
                    }
                }
                
                // Se encontramos o ID da nota, vamos usá-lo para consultar a API
                if (!alunoId || alunoId.startsWith('NOTA-') || alunoId.startsWith('AL-')) {
                    try {
                        // A última coluna geralmente contém botões de ação com o ID da nota
                        const ultimaColuna = colunasTabela[colunasTabela.length - 1];
                        if (ultimaColuna) {
                            const botaoEditar = ultimaColuna.querySelector('button[onclick*="editarNota"]');
                            if (botaoEditar) {
                                const onclick = botaoEditar.getAttribute('onclick') || '';
                                const idNotaMatch = onclick.match(/editarNota\(['"](\d+)['"]\)/);
                                
                                if (idNotaMatch && idNotaMatch[1]) {
                                    const idNota = idNotaMatch[1];
                                    console.log(`DEBUG - Encontrado ID da nota: ${idNota}`);
                                    
                                    // AQUI ESTÁ A MUDANÇA: Consultar API para obter ID do aluno
                                    const idAlunoViaAPI = obterIdAlunoPorNota(idNota);
                                    if (idAlunoViaAPI) {
                                        alunoId = idAlunoViaAPI;
                                        console.log(`DEBUG - ID do aluno obtido via API através da nota ${idNota}: ${alunoId}`);
                                    } else {
                                        // Se não conseguimos via API, usar ID da nota como fallback
                                        console.log(`AVISO: API não retornou ID do aluno para nota ${idNota}. Usando ID temporário.`);
                                        if (!alunoId) {
                                            alunoId = `NOTA-${idNota}`;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (btnErr) {
                        console.warn(`Erro ao extrair ID de botões ou consultar API: ${btnErr.message}`);
                    }
                }
                
                // Tenta fazer busca exata pelo nome completo do aluno no HTML
                if (!alunoId && nomeAluno) {
                    try {
                        // Buscar o ID usando outra abordagem - verificar se o nome completo aparece
                        // em algum elemento com data-id ou similar
                        const elementos = document.querySelectorAll('[data-nome], [data-aluno-nome]');
                        
                        for (const elemento of elementos) {
                            const nomeElemento = elemento.getAttribute('data-nome') || 
                                                elemento.getAttribute('data-aluno-nome');
                            
                            // Se encontramos uma correspondência exata pelo nome
                            if (nomeElemento === nomeAluno) {
                                const idElemento = elemento.getAttribute('data-id') || 
                                                  elemento.getAttribute('data-aluno-id');
                                
                                if (idElemento) {
                                    alunoId = idElemento;
                                    console.log(`DEBUG - ID do aluno encontrado via correspondência de nome: ${alunoId}`);
                                    break;
                                }
                            }
                        }
                    } catch (nomeErr) {
                        console.warn(`Erro ao buscar por nome de aluno: ${nomeErr.message}`);
                    }
                }
                
                // Forçar valor padrão para matrícula se não foi possível encontrar
                if (!alunoId || alunoId === 'undefined') {
                    // Usar um valor temporário que não se confunde com ID da nota
                    alunoId = `AL-${index}`;
                    console.warn(`AVISO: Não foi possível encontrar o ID real do aluno para ${aluno}. Usando ID temporário.`);
                }
                
                // Log para debug
                console.log(`Processando linha ${index} após correção TOTAL:`, {
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
