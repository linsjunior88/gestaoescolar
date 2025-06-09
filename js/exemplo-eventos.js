/**
 * Script para adicionar eventos de exemplo ao calendário escolar
 * Para fins de demonstração e teste
 */

import { CalendarioAPI } from './api.js';

const eventosExemplo = [
    {
        titulo: "Início do Ano Letivo 2025",
        descricao: "Primeiro dia de aula do ano letivo de 2025",
        data_inicio: "2025-02-05",
        data_fim: "2025-02-05",
        tipo_evento: "evento_escolar",
        cor: "#27ae60",
        criado_por: "Sistema"
    },
    {
        titulo: "Carnaval",
        descricao: "Feriado Nacional - Carnaval",
        data_inicio: "2025-03-03",
        data_fim: "2025-03-04",
        tipo_evento: "feriado_nacional",
        cor: "#e74c3c",
        criado_por: "Sistema"
    },
    {
        titulo: "Reunião de Pais e Mestres",
        descricao: "Reunião para discussão do desenvolvimento dos alunos",
        data_inicio: "2025-03-15",
        data_fim: "2025-03-15",
        hora_inicio: "14:00",
        hora_fim: "17:00",
        tipo_evento: "reuniao",
        cor: "#3498db",
        criado_por: "Sistema"
    },
    {
        titulo: "Dia Internacional da Mulher",
        descricao: "Atividades comemorativas ao Dia da Mulher",
        data_inicio: "2025-03-08",
        data_fim: "2025-03-08",
        tipo_evento: "evento_escolar",
        cor: "#e91e63",
        criado_por: "Sistema"
    },
    {
        titulo: "Conselho de Classe - 1º Bimestre",
        descricao: "Avaliação do desempenho dos alunos no primeiro bimestre",
        data_inicio: "2025-04-28",
        data_fim: "2025-04-30",
        tipo_evento: "conselho_classe",
        cor: "#8e44ad",
        criado_por: "Sistema"
    },
    {
        titulo: "Festa Junina",
        descricao: "Festa tradicional da escola com apresentações e comidas típicas",
        data_inicio: "2025-06-21",
        data_fim: "2025-06-21",
        hora_inicio: "18:00",
        hora_fim: "22:00",
        tipo_evento: "festa_junina",
        cor: "#f1c40f",
        criado_por: "Sistema"
    },
    {
        titulo: "Recesso de Julho",
        descricao: "Período de recesso escolar",
        data_inicio: "2025-07-21",
        data_fim: "2025-07-31",
        tipo_evento: "evento_escolar",
        cor: "#95a5a6",
        criado_por: "Sistema"
    },
    {
        titulo: "Independência do Brasil",
        descricao: "Feriado Nacional - Dia da Independência",
        data_inicio: "2025-09-07",
        data_fim: "2025-09-07",
        tipo_evento: "feriado_nacional",
        cor: "#e74c3c",
        criado_por: "Sistema"
    },
    {
        titulo: "Dia das Crianças",
        descricao: "Atividades especiais para o Dia das Crianças",
        data_inicio: "2025-10-12",
        data_fim: "2025-10-12",
        tipo_evento: "evento_escolar",
        cor: "#ff6b6b",
        criado_por: "Sistema"
    },
    {
        titulo: "Semana da Consciência Negra",
        descricao: "Atividades educativas sobre a consciência negra",
        data_inicio: "2025-11-17",
        data_fim: "2025-11-21",
        tipo_evento: "evento_escolar",
        cor: "#2c3e50",
        criado_por: "Sistema"
    },
    {
        titulo: "Formatura 5º Ano",
        descricao: "Cerimônia de formatura dos alunos do 5º ano",
        data_inicio: "2025-12-15",
        data_fim: "2025-12-15",
        hora_inicio: "19:00",
        hora_fim: "22:00",
        tipo_evento: "formatura",
        cor: "#e67e22",
        criado_por: "Sistema"
    },
    {
        titulo: "Natal",
        descricao: "Feriado Nacional - Natal",
        data_inicio: "2025-12-25",
        data_fim: "2025-12-25",
        tipo_evento: "feriado_nacional",
        cor: "#e74c3c",
        criado_por: "Sistema"
    }
];

// Função para adicionar eventos de exemplo
export async function adicionarEventosExemplo() {
    console.log("Adicionando eventos de exemplo ao calendário...");
    
    let sucessos = 0;
    let erros = 0;
    
    for (const evento of eventosExemplo) {
        try {
            await CalendarioAPI.criarEvento(evento);
            console.log(`✅ Evento criado: ${evento.titulo}`);
            sucessos++;
        } catch (error) {
            console.error(`❌ Erro ao criar evento "${evento.titulo}":`, error);
            erros++;
        }
        
        // Aguardar um pouco entre as requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Resumo da importação:`);
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📝 Total: ${eventosExemplo.length}`);
    
    return { sucessos, erros, total: eventosExemplo.length };
}

// Função para remover todos os eventos (útil para testes)
export async function limparEventosExemplo() {
    console.log("Buscando eventos para remoção...");
    
    try {
        const eventos = await CalendarioAPI.listarEventos();
        const eventosDoSistema = eventos.filter(evento => evento.criado_por === 'Sistema');
        
        console.log(`Encontrados ${eventosDoSistema.length} eventos do sistema para remoção`);
        
        let removidos = 0;
        for (const evento of eventosDoSistema) {
            try {
                await CalendarioAPI.excluirEvento(evento.id);
                console.log(`🗑️ Evento removido: ${evento.titulo}`);
                removidos++;
            } catch (error) {
                console.error(`❌ Erro ao remover evento "${evento.titulo}":`, error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\n📊 Remoção concluída: ${removidos} eventos removidos`);
        return removidos;
        
    } catch (error) {
        console.error("Erro ao buscar eventos para remoção:", error);
        throw error;
    }
}

// Expor funções globalmente para uso no console do navegador
if (typeof window !== 'undefined') {
    window.CalendarioExemplos = {
        adicionar: adicionarEventosExemplo,
        limpar: limparEventosExemplo
    };
}

export default {
    adicionarEventosExemplo,
    limparEventosExemplo,
    eventosExemplo
}; 