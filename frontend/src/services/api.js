import axios from 'axios';
import logger from '../utils/logger';

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - log all outgoing requests
api.interceptors.request.use(
    (config) => {
        logger.info('api:request', `${config.method.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.method !== 'get' ? config.data : undefined
        });
        return config;
    },
    (error) => {
        logger.error('api:request', 'Request failed to send', {
            error: error.message
        });
        return Promise.reject(error);
    }
);

// Response interceptor - log all responses and errors
api.interceptors.response.use(
    (response) => {
        logger.debug('api:response', `${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
    },
    (error) => {
        const message = error.response
            ? `${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response.status}`
            : `${error.config?.method?.toUpperCase()} ${error.config?.url} - Network Error`;

        logger.error('api:error', message, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            error: error.message,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

// Projects
export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getOne: (id) => api.get(`/projects/${id}`),
    refresh: (id, projectTitle) => api.post(`/projects/${id}/refresh`, { project_title: projectTitle }),
    refreshAll: () => api.post('/projects/refresh-all'),
    getRefreshProgress: () => api.get('/projects/refresh-progress')
};

// Checkpoints
export const checkpointsAPI = {
    getAll: () => api.get('/checkpoints'),
    createProject: (id, projectTitle, note) =>
        api.post(`/checkpoints/project/${id}`, { project_title: projectTitle, note }),
    createCategory: (category, note) =>
        api.post(`/checkpoints/category/${category}`, { note }),
    createClass: (className, xrayType, note) =>
        api.post('/checkpoints/class', { class_name: className, xray_type: xrayType, note })
};

// Notifications
export const notificationsAPI = {
    getAll: () => api.get('/notifications'),
    dismiss: (index) => api.delete(`/notifications/${index}`)
};

// Scheduler
export const schedulerAPI = {
    getStatus: () => api.get('/scheduler/status'),
    start: (hour, minute) => api.post('/scheduler/start', { hour, minute }),
    stop: () => api.post('/scheduler/stop'),
    trigger: () => api.post('/scheduler/trigger'),
    getLogs: (lines = 50) => api.get(`/scheduler/logs?lines=${lines}`)
};

// Kaggle Data
export const kaggleAPI = {
    getAll: () => api.get('/kaggle'),
    updateCategory: (category, data) => api.put(`/kaggle/${category}`, data)
};

// Categories
export const categoriesAPI = {
    getAll: () => api.get('/categories'),
    getHistory: (category) => api.get(`/categories/${category}/history`),
    getLatest: (category) => api.get(`/categories/${category}/latest`)
};

// Metrics
export const metricsAPI = {
    getCombined: () => api.get('/metrics/combined')
};

// Modalities
export const modalitiesAPI = {
    getAll: () => api.get('/modalities'),
    update: (projectId, modality) => api.put(`/modalities/${projectId}`, { modality })
};

// Growth
export const growthAPI = {
    getMetrics: (threshold = 20) => api.get('/growth', { params: { threshold } }),
    getTimeSeries: (range = '7d') => api.get('/time-series', { params: { range } }),
    getTimeSeriesCustom: (startDate, endDate) => api.get('/time-series', {
        params: { startDate, endDate }
    })
};

export default api;
