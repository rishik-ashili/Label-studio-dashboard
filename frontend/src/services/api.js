import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Projects
export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getOne: (id) => api.get(`/projects/${id}`),
    refresh: (id, projectTitle) => api.post(`/projects/${id}/refresh`, { project_title: projectTitle }),
    refreshAll: () => api.post('/projects/refresh-all')
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

export default api;
