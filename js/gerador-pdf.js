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

// Função para obter o ID do aluno usando várias estratégias
function obterIdAluno(linha) {
    // Primeiro verifica o atributo data-aluno-id da linha
    let alunoId = linha.getAttribute('data-aluno-id');
    if (alunoId) return alunoId;
    
    // Tenta obter do atributo data-id da linha
    alunoId = linha.getAttribute('data-id');
    if (alunoId) return alunoId;
    
    // Verifica se existe algum atributo na linha que contenha 'aluno' e 'id'
    for (let i = 0; i < linha.attributes.length; i++) {
        const attrName = linha.attributes[i].name;
        if (attrName.includes('aluno') && attrName.includes('id')) {
            return linha.attributes[i].value;
        }
    }
    
    // Verifica se a primeira célula contém o ID do aluno (comumente o caso)
    try {
        const alunoCelula = linha.cells[0];
        if (alunoCelula) {
            // Verifica se a célula tem algum elemento interno com um ID
            const elementos = alunoCelula.querySelectorAll('[id], [data-id]');
            if (elementos.length > 0) {
                const elemento = elementos[0];
                const elementoId = elemento.id || elemento.getAttribute('data-id');
                if (elementoId) return elementoId;
            }
            
            // Verifica se a célula tem um texto que parece ser um ID (ALUxxx ou apenas números)
            const texto = alunoCelula.textContent.trim();
            if (/^ALU\d+$/i.test(texto) || /^A\d+$/i.test(texto) || /^\d+$/.test(texto)) {
                return texto;
            }
        }
    } catch (err) {
        console.error('Erro ao analisar célula do aluno:', err);
    }
    
    // Tenta extrair o ID do aluno com base no texto da tabela
    // Busca padrões como "ID: ALU001" ou similares no texto
    try {
        const textoCompleto = linha.textContent;
        const matchId = textoCompleto.match(/ID\s*[:]\s*([A-Z0-9]+)/i);
        if (matchId && matchId[1]) {
            return matchId[1];
        }
        
        // Procura por padrões que poderiam ser IDs de aluno
        const matchAluId = textoCompleto.match(/ALU[0-9]+/i);
        if (matchAluId) {
            return matchAluId[0];
        }
    } catch (err) {
        console.error('Erro ao analisar texto para extração de ID:', err);
    }
    
    // Se ainda não encontrou, busca em cada célula da linha
    try {
        for (let i = 0; i < linha.cells.length; i++) {
            const celula = linha.cells[i];
            
            // Tenta encontrar IDs nos atributos
            if (celula.hasAttribute('data-aluno-id')) {
                return celula.getAttribute('data-aluno-id');
            }
            if (celula.hasAttribute('data-id')) {
                return celula.getAttribute('data-id');
            }
            
            // Verifica elementos filhos que podem ter IDs
            const elementos = celula.querySelectorAll('[data-id], [data-aluno-id], [id]');
            for (let j = 0; j < elementos.length; j++) {
                const elemento = elementos[j];
                const elementoId = elemento.getAttribute('data-aluno-id') || 
                                  elemento.getAttribute('data-id') || 
                                  elemento.id;
                if (elementoId && (elementoId.includes('ALU') || /^\d+$/.test(elementoId))) {
                    return elementoId;
                }
            }
            
            // Verifica o texto da célula
            const textoCelula = celula.textContent.trim();
            if (/^ALU\d+$/i.test(textoCelula) || /^A\d+$/i.test(textoCelula)) {
                return textoCelula;
            }
        }
    } catch (err) {
        console.error('Erro ao procurar ID em células:', err);
    }
    
    console.warn('Não foi possível encontrar o ID do aluno para a linha:', linha);
    return 'N/A';
}

// Função auxiliar para extrair a matrícula do aluno da tabela
function extrairMatriculasAlunos() {
    console.log('Buscando IDs de alunos na tabela...');
    const tabela = document.getElementById('tabela-notas');
    if (!tabela) return {};
    
    const tbody = tabela.querySelector('tbody');
    if (!tbody) return {};
    
    const linhas = tbody.querySelectorAll('tr');
    const alunos = {};
    
    linhas.forEach((linha, index) => {
        if (linha.cells.length <= 1) return;
        
        try {
            // Pegar o nome do aluno (geralmente na primeira célula)
            const nomeAluno = linha.cells[0].textContent.trim();
            
            // Tentar várias abordagens para obter o ID
            // 1. Atributos da linha
            const matriculaDosDados = linha.getAttribute('data-aluno-id') || 
                                      linha.getAttribute('data-id');
            
            // 2. Verificar células específicas que possam conter IDs
            const idDaPrimeiraCelula = linha.cells[0].getAttribute('data-id') || 
                                      (linha.cells[0].querySelector('[data-id]') ? 
                                      linha.cells[0].querySelector('[data-id]').getAttribute('data-id') : null);
            
            // 3. Verificar elementos com classe ou ID específicos
            const elementosComID = linha.querySelectorAll('[id*="aluno"], [class*="aluno"]');
            let idDosElementos = null;
            if (elementosComID.length > 0) {
                for (const elem of elementosComID) {
                    if (elem.id && elem.id.includes('ALU')) {
                        idDosElementos = elem.id;
                        break;
                    }
                    if (elem.getAttribute('data-id')) {
                        idDosElementos = elem.getAttribute('data-id');
                        break;
                    }
                }
            }
            
            // 4. Verificar botões ou links que podem ter o ID nos eventos
            const botoes = linha.querySelectorAll('button, a');
            let idDosBotoes = null;
            if (botoes.length > 0) {
                for (const botao of botoes) {
                    const onclick = botao.getAttribute('onclick');
                    if (onclick && onclick.includes('ALU')) {
                        const match = onclick.match(/['"]([A-Z0-9]+)['"]/i);
                        if (match && match[1]) {
                            idDosBotoes = match[1];
                            break;
                        }
                    }
                }
            }
            
            // Consolidar todas as tentativas
            const idFinal = matriculaDosDados || idDaPrimeiraCelula || idDosElementos || idDosBotoes || 'N/A';
            
            alunos[nomeAluno] = {
                linha: index + 1,
                matricula: idFinal
            };
            
        } catch (err) {
            console.error('Erro ao processar linha:', err);
        }
    });
    
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
        
        // Extrair e mostrar no console as matrículas dos alunos antes de gerar o PDF
        const matriculas = extrairMatriculasAlunos();
        console.log('Matrículas dos alunos encontradas:', matriculas);
        
        // Garantir que as bibliotecas estejam disponíveis
        await garantirBibliotecasPDF();
        
        // Criar documento PDF usando a forma mais compatível possível
        let doc;
        try {
            // Primeiro método: usar window.jspdf.jsPDF (forma UMD padrão)
            if (typeof window.jspdf !== 'undefined' && typeof window.jspdf.jsPDF === 'function') {
                const { jsPDF } = window.jspdf;
                doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4'
                });
                console.log('PDF criado com jspdf.jsPDF');
            } 
            // Segundo método: usar window.jsPDF (forma global)
            else if (typeof window.jsPDF === 'function') {
                doc = new window.jsPDF({
                    orientation: 'landscape',
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
        
        // Definir colunas para o PDF - Alterado "Idaluno" para "Matric."
        const colunas = [
            { header: 'Matric.', dataKey: 'idaluno' },
            { header: 'Aluno', dataKey: 'aluno' },
            { header: 'Disciplina', dataKey: 'disciplina' },
            { header: 'Turma', dataKey: 'turma' },
            { header: 'Bimestre', dataKey: 'bimestre' },
            { header: 'N.Mensal', dataKey: 'mensal' },
            { header: 'N.Bimestral', dataKey: 'bimestral' },
            { header: 'Recup.', dataKey: 'recuperacao' },
            { header: 'Média', dataKey: 'media' },
            { header: 'Status', dataKey: 'status' }
        ];
        
        // Coletar dados da tabela
        const dados = [];
        const linhas = tbody.querySelectorAll('tr');
        
        // Excluir qualquer linha que não tenha conteúdo ou seja apenas de mensagem
        linhas.forEach(linha => {
            // Pular linhas de mensagem (como "Nenhum resultado encontrado")
            if (linha.cells.length <= 1) return;
            
            // Obter o ID do aluno usando a função específica
            const alunoId = obterIdAluno(linha);
            
            // Obter os dados das células
            const aluno = linha.cells[0].textContent.trim();
            const disciplina = linha.cells[1].textContent.trim();
            const turma = linha.cells[2].textContent.trim();
            const bimestre = linha.cells[3].textContent.trim();
            const mensal = linha.cells[4].textContent.trim();
            const bimestral = linha.cells[5].textContent.trim();
            const recuperacao = linha.cells[6].textContent.trim();
            const media = linha.cells[7].textContent.trim();
            
            // Verificação para evitar status duplicado
            let status = linha.cells[8].textContent.trim();
            // Corrigir texto duplicado "AprovadoAprovado" ou "ReprovadoReprovado"
            status = status.replace(/Aprovado{2,}/g, 'Aprovado')
                          .replace(/Reprovado{2,}/g, 'Reprovado');
            if (status.includes('Aprovado')) status = 'Aprovado';
            if (status.includes('Reprovado')) status = 'Reprovado';
            
            // Adicionar linha ao array de dados
            dados.push({
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
        });
        
        // Verificar se há dados para adicionar
        if (dados.length === 0) {
            throw new Error('Nenhum dado válido encontrado na tabela.');
        }
        
        // Configurações da tabela - Ajustado larguras das colunas para não truncar
        const options = {
            startY: 30, // Posição inicial da tabela
            headStyles: {
                fillColor: [41, 98, 255], // Cor azul para o cabeçalho
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center', // Centralizar cabeçalhos
                valign: 'middle',  // Alinhar verticalmente ao meio
                fontSize: 9,       // Reduzir tamanho da fonte para evitar quebras
                cellPadding: {top: 3, right: 2, bottom: 3, left: 2} // Padding mais preciso
            },
            bodyStyles: {
                fontSize: 8       // Tamanho de fonte para o corpo da tabela
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240] // Cor cinza claro para linhas alternadas
            },
            // Definir larguras das colunas para melhor visualização
            columnStyles: {
                idaluno: { cellWidth: 15, halign: 'center' },
                aluno: { cellWidth: 35, halign: 'left' },
                disciplina: { cellWidth: 30, halign: 'left' },
                turma: { cellWidth: 15, halign: 'center' },
                bimestre: { cellWidth: 18, halign: 'center' },
                mensal: { cellWidth: 15, halign: 'center' },
                bimestral: { cellWidth: 20, halign: 'center' },
                recuperacao: { cellWidth: 15, halign: 'center' },
                media: { cellWidth: 12, halign: 'center' },
                status: { cellWidth: 18, halign: 'center' }
            },
            // Impedir quebra de linha nos textos e lidar com células muito estreitas
            styles: {
                overflow: 'ellipsize',  // Truncar com ... se não couber
                cellWidth: 'auto',      // Usar a largura disponível sem quebrar palavras
                fontSize: 8,
                minCellHeight: 8
            },
            // Garantir que todos os textos caibam dentro das células
            willDrawCell: function(data) {
                // Reduzir o tamanho da fonte se o texto for muito longo para a célula
                if (data.cell.text && typeof data.cell.text === 'string') {
                    const text = data.cell.text;
                    const maxWidth = data.cell.styles.cellWidth;
                    
                    // Aproximação do tamanho do texto baseado na fonte atual
                    const textWidth = text.length * data.cell.styles.fontSize * 0.5;
                    
                    if (textWidth > maxWidth) {
                        // Reduzir a fonte para caber
                        data.cell.styles.fontSize = Math.floor(maxWidth / (text.length * 0.5));
                    }
                }
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
