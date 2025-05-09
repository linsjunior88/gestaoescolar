/**
 * Gerador de PDF de relatórios para o sistema escolar
 * Este arquivo contém funções para gerar PDFs de diferentes relatórios do sistema
 */

// Função para gerar um PDF a partir da tabela de notas
function gerarPDFNotas() {
    console.log("Iniciando geração de PDF de notas...");
    
    try {
        // Verificar se bibliotecas estão carregadas
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            throw new Error("Biblioteca jsPDF não carregada. Recarregue a página e tente novamente.");
        }
        
        // Obter valores dos filtros
        const filtroTurma = document.getElementById('filtro-turma-notas');
        const filtroDisciplina = document.getElementById('filtro-disciplina-notas');
        const filtroBimestre = document.getElementById('filtro-bimestre-notas');
        const filtroAno = document.getElementById('filtro-ano-notas');
        
        // Obter nomes para o título do relatório
        const turmaNome = filtroTurma && filtroTurma.selectedOptions.length > 0 ? filtroTurma.selectedOptions[0].text : 'Todas';
        const disciplinaNome = filtroDisciplina && filtroDisciplina.selectedOptions.length > 0 ? filtroDisciplina.selectedOptions[0].text : 'Todas';
        const bimestreNome = filtroBimestre && filtroBimestre.selectedOptions.length > 0 ? filtroBimestre.selectedOptions[0].text : 'Todos';
        const anoNome = filtroAno && filtroAno.selectedOptions.length > 0 ? filtroAno.selectedOptions[0].text : '';
        
        // Verificar se há notas carregadas na tabela
        const tabelaNotas = document.getElementById('tabela-notas');
        const tbodyNotas = document.getElementById('notas-lista');
        
        if (!tabelaNotas || !tbodyNotas) {
            throw new Error("Tabela de notas não encontrada");
        }
        
        const linhas = tbodyNotas.querySelectorAll('tr');
        if (linhas.length === 0) {
            alert("Não há notas para gerar o relatório. Por favor, filtre alguma turma primeiro.");
            return;
        }
        
        // Inicializar jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        
        // Configurar cabeçalho do documento
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Relatório de Notas - EMEF Nazaré Rodrigues', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
        
        // Adicionar informações do filtro
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        let filtroTexto = `Turma: ${turmaNome} | Disciplina: ${disciplinaNome} | Bimestre: ${bimestreNome}`;
        if (anoNome) {
            filtroTexto += ` | Ano: ${anoNome}`;
        }
        doc.text(filtroTexto, doc.internal.pageSize.getWidth() / 2, 25, { align: 'center' });
        
        // Data e hora da geração
        const dataAtual = new Date();
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR');
        const horaFormatada = dataAtual.toLocaleTimeString('pt-BR');
        doc.setFontSize(10);
        doc.text(`Gerado em: ${dataFormatada} às ${horaFormatada}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
        
        // Preparar dados para a tabela
        // Colunas da tabela no PDF
        const colunas = [
            { header: 'Aluno', dataKey: 'aluno' },
            { header: 'Turma', dataKey: 'turma' },
            { header: 'Disciplina', dataKey: 'disciplina' },
            { header: 'Bimestre', dataKey: 'bimestre' },
            { header: 'Nota Mensal', dataKey: 'mensal' },
            { header: 'Nota Bimestral', dataKey: 'bimestral' },
            { header: 'Recuperação', dataKey: 'recuperacao' },
            { header: 'Média', dataKey: 'media' },
            { header: 'Status', dataKey: 'status' }
        ];
        
        // Extrair dados da tabela
        const dados = [];
        linhas.forEach(linha => {
            // Ignorar linhas de mensagem
            if (linha.querySelector('td[colspan]')) {
                return;
            }
            
            const celulas = linha.querySelectorAll('td');
            if (celulas.length >= 8) { // Verifica se há células suficientes
                // Determinar o status com base na média
                const mediaCell = celulas[7].textContent.trim();
                const notaMedia = parseFloat(mediaCell);
                let status = '';
                
                if (!isNaN(notaMedia)) {
                    if (notaMedia >= 6) {
                        status = 'Aprovado';
                    } else {
                        // Verificar se tem recuperação
                        const recuperacaoCell = celulas[6].textContent.trim();
                        if (recuperacaoCell !== '-' && recuperacaoCell !== '') {
                            status = 'Em Recuperação';
                        } else {
                            status = 'Reprovado';
                        }
                    }
                }
                
                // Adicionar linha à tabela
                dados.push({
                    aluno: celulas[0].textContent.trim(),
                    turma: celulas[1].textContent.trim(),
                    disciplina: celulas[2].textContent.trim(),
                    bimestre: celulas[3].textContent.trim(),
                    mensal: celulas[4].textContent.trim(),
                    bimestral: celulas[5].textContent.trim(),
                    recuperacao: celulas[6].textContent.trim(),
                    media: mediaCell,
                    status: status
                });
            }
        });
        
        // Ordenar dados por nome do aluno (ordem alfabética)
        dados.sort((a, b) => a.aluno.localeCompare(b.aluno));
        
        // Gerar tabela no PDF
        doc.autoTable({
            columns: colunas,
            body: dados,
            startY: 35,
            styles: {
                fontSize: 10,
                cellPadding: 3,
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [66, 139, 202],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240]
            },
            columnStyles: {
                media: { fontStyle: 'bold' },
                status: { 
                    fontStyle: 'bold',
                    cellCallback: function(cell, data) {
                        if (data === 'Aprovado') {
                            cell.styles.textColor = [0, 128, 0]; // Verde
                        } else if (data === 'Reprovado') {
                            cell.styles.textColor = [220, 0, 0]; // Vermelho
                        } else if (data === 'Em Recuperação') {
                            cell.styles.textColor = [255, 140, 0]; // Laranja
                        }
                    }
                }
            },
            margin: { top: 40 }
        });
        
        // Adicionar paginação
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            
            // Adicionar rodapé
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('EMEF Nazaré Rodrigues - Sistema de Gestão Escolar', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
        }
        
        // Mostrar pré-visualização antes de salvar
        const pdfOutput = doc.output('datauristring');
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <html>
            <head>
                <title>Pré-visualização do Relatório de Notas</title>
                <style>
                    body { margin: 0; overflow: hidden; }
                    iframe { border: none; width: 100vw; height: 100vh; }
                </style>
            </head>
            <body>
                <iframe width="100%" height="100%" src="${pdfOutput}"></iframe>
            </body>
            </html>
        `);
        
        console.log("PDF gerado com sucesso!");
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert(`Erro ao gerar o PDF: ${error.message}`);
    }
}

// Registrar função no escopo global
window.gerarPDFNotas = gerarPDFNotas; 