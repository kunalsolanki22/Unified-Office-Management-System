import api from './api';

export const projectService = {
    getProjects: async (params = {}) => {
        const res = await api.get('/projects', { params });
        return res.data;
    },
    getMyProjects: async () => {
        const res = await api.get('/projects/my-projects');
        return res.data;
    },
    createProject: async (data) => {
        const res = await api.post('/projects', data);
        return res.data;
    },
    submitProject: async (id) => {
        const res = await api.post(`/projects/${id}/submit`);
        return res.data;
    },
    getProject: async (id) => {
        const res = await api.get(`/projects/${id}`);
        return res.data;
    },
    approveProject: async (id, action, notes = '', rejection_reason = '') => {
        const res = await api.post(`/projects/${id}/approve`, { action, notes, rejection_reason });
        return res.data;
    },
};
