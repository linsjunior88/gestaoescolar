// Função para criar vínculos para cada disciplina
function criarVinculos(disciplinasParaVincular) {
    const promessasVinculos = disciplinasParaVincular.map(idDisciplina => {
        // Implementação do vínculo para cada disciplina
        return Promise.resolve(idDisciplina);
    });
    return Promise.all(promessasVinculos);
}

return criarVinculos(disciplinasComTurmas); 