import axios from 'axios';

// Use the same base URL pattern as main API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/labelstudio-dashboard/api';

export const chatAPI = {
    sendMessage: async (message, conversationId = 'default') => {
        return axios.post(`${API_BASE_URL}/chat/message`, {
            message,
            conversationId
        });
    },

    getHistory: async (conversationId = 'default') => {
        return axios.get(`${API_BASE_URL}/chat/history/${conversationId}`);
    },

    clearHistory: async (conversationId = 'default') => {
        return axios.delete(`${API_BASE_URL}/chat/history/${conversationId}`);
    },

    getConversations: async () => {
        return axios.get(`${API_BASE_URL}/chat/conversations`);
    }
};
