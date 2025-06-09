/**
 * Módulo de API
 * Configurações e funções para comunicação com a API
 */

// Configuração da API - usar a mesma URL do config.js
export const API_BASE_URL = 'https://apinazarerodrigues.86dynamics.com.br/api';

// Função para fazer requisições HTTP
export async function makeRequest(url, options = {}) {
    try {
        // Se o ConfigModule existe, usar seu método para lidar com CORS
        if (window.CONFIG && window.CONFIG.fetchApi) {
            // Extrair apenas o endpoint da URL completa
            const endpoint = url.replace(API_BASE_URL, '');
            return await window.CONFIG.fetchApi(endpoint, options);
        }
        
        // Fallback caso CONFIG não esteja disponível
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            ...options
        };

        console.log(`Fazendo requisição para: ${url}`);
        console.log(`Método: ${defaultOptions.method}`);
        
        if (defaultOptions.body) {
            console.log(`Payload:`, defaultOptions.body);
        }

        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error(`Erro na requisição para ${url}:`, error);
        throw error;
    }
}

// Funções específicas para o calendário
export const CalendarioAPI = {
    // Listar eventos
    async listarEventos(filtros = {}) {
        const params = new URLSearchParams();
        
        if (filtros.mes) params.append('mes', filtros.mes);
        if (filtros.ano) params.append('ano', filtros.ano);
        if (filtros.tipo_evento) params.append('tipo_evento', filtros.tipo_evento);
        if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
        if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
        
        const queryString = params.toString();
        const url = `${API_BASE_URL}/calendario/eventos${queryString ? '?' + queryString : ''}`;
        
        return await makeRequest(url);
    },

    // Criar evento
    async criarEvento(dadosEvento) {
        return await makeRequest(`${API_BASE_URL}/calendario/eventos`, {
            method: 'POST',
            body: JSON.stringify(dadosEvento)
        });
    },

    // Obter evento específico
    async obterEvento(eventoId) {
        return await makeRequest(`${API_BASE_URL}/calendario/eventos/${eventoId}`);
    },

    // Atualizar evento
    async atualizarEvento(eventoId, dadosEvento) {
        return await makeRequest(`${API_BASE_URL}/calendario/eventos/${eventoId}`, {
            method: 'PUT',
            body: JSON.stringify(dadosEvento)
        });
    },

    // Excluir evento
    async excluirEvento(eventoId) {
        return await makeRequest(`${API_BASE_URL}/calendario/eventos/${eventoId}`, {
            method: 'DELETE'
        });
    },

    // Obter tipos de evento
    async obterTiposEvento() {
        return await makeRequest(`${API_BASE_URL}/calendario/tipos-evento`);
    },

    // Obter resumo mensal
    async obterResumoMensal(ano, mes) {
        return await makeRequest(`${API_BASE_URL}/calendario/resumo-mensal/${ano}/${mes}`);
    },

    // Testar conexão com o calendário
    async testarConexao() {
        return await makeRequest(`${API_BASE_URL}/calendario/teste`);
    }
};

// Exportar para uso em outros módulos
export default {
    API_BASE_URL,
    makeRequest,
    CalendarioAPI
}; 