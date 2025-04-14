// Script para testar a API de notas

// Função para fazer requisições à API
async function fetchAPI(url) {
    try {
        console.log(`Fazendo requisição para: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Resposta recebida:', data);
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error.message);
        return null;
    }
}

// Testar o endpoint de notas completas filtrado por professor
async function testNotasCompletoProfessor() {
    const professorId = 'PROF002';
    const url = `http://localhost:4000/api/notas/completo/?professor_id=${professorId}`;
    
    console.log(`\n=== TESTANDO NOTAS COMPLETAS DO PROFESSOR ${professorId} ===`);
    const notas = await fetchAPI(url);
    
    if (notas && Array.isArray(notas)) {
        console.log(`Total de notas encontradas: ${notas.length}`);
        
        if (notas.length > 0) {
            console.log('Exemplo de nota:');
            console.log(JSON.stringify(notas[0], null, 2));
            
            // Verificar se os campos nome_aluno estão presentes
            const notasSemNomeAluno = notas.filter(nota => !nota.nome_aluno);
            if (notasSemNomeAluno.length > 0) {
                console.error(`PROBLEMA: ${notasSemNomeAluno.length} notas não têm o campo nome_aluno!`);
                console.error('Exemplo:', notasSemNomeAluno[0]);
            } else {
                console.log('OK: Todas as notas têm o campo nome_aluno');
            }
        }
    } else {
        console.error('ERRO: Falha ao buscar notas ou resposta não é um array');
    }
}

// Testar criação de uma nota
async function testCriarNota() {
    const url = 'http://localhost:4000/api/notas/';
    const notaData = {
        id_aluno: 'ALU001',
        id_disciplina: 'MAT',
        id_turma: '2A',
        ano: 2024,
        bimestre: 2,
        nota_mensal: 7.5,
        nota_bimestral: 8.0,
        recuperacao: null,
        media: 7.8
    };
    
    console.log('\n=== TESTANDO CRIAÇÃO DE NOTA ===');
    console.log('Dados a enviar:', notaData);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(notaData)
        });
        
        const responseText = await response.text();
        console.log(`Status da resposta: ${response.status} ${response.statusText}`);
        console.log('Resposta:', responseText);
        
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('Nota criada com sucesso:', data);
            } catch (e) {
                console.log('Resposta não é JSON válido');
            }
        } else {
            console.error('Falha ao criar nota');
        }
    } catch (error) {
        console.error('Erro na requisição:', error.message);
    }
}

// Executar os testes
async function runTests() {
    console.log('Iniciando testes da API...');
    
    await testNotasCompletoProfessor();
    // await testCriarNota(); // Descomente para testar a criação de notas
    
    console.log('\nTestes concluídos!');
}

// Iniciar testes quando o script for carregado
runTests(); 