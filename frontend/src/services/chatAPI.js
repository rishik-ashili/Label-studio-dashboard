import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const chatAPI = {
    sendMessage: async (message, conversationId = 'default') => {
        return axios.post(`${BASE_URL}/chat/message`, {
            message,
            conversationId
        });
    },

    getHistory: async (conversationId = 'default') => {
        return axios.get(`${BASE_URL}/chat/history/${conversationId}`);
    },

    clearHistory: async (conversationId = 'default') => {
        return axios.delete(`${BASE_URL}/chat/history/${conversationId}`);
    },

    getConversations: async () => {
        return axios.get(`${BASE_URL}/chat/conversations`);
    }
};
