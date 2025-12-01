import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Logs API
export const logsAPI = {
    getRecent: async (params = {}) => {
        const { level = 'all', limit = 100, source = '' } = params;
        return axios.get(`${BASE_URL}/logs/recent`, {
            params: { level, limit, source }
        });
    },

    getStats: async () => {
        return axios.get(`${BASE_URL}/logs/stats`);
    },

    download: async (params = {}) => {
        const { format = 'json', level = 'all', source = '' } = params;
        const response = await axios.get(`${BASE_URL}/logs/download`, {
            params: { format, level, source },
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `logs-${new Date().toISOString().split('T')[0]}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        return response;
    }
};
