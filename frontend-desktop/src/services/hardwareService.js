import api from './api';

export const hardwareService = {
    getAssets: async (params = {}) => {
        const res = await api.get('/it-assets', { params });
        return res.data;
    },
    createAsset: async (data) => {
        const res = await api.post('/it-assets', data);
        return res.data;
    },
    updateAsset: async (id, data) => {
        const res = await api.put(`/it-assets/${id}`, data);
        return res.data;
    },
    deleteAsset: async (id) => {
        const res = await api.delete(`/it-assets/${id}`);
        return res.data;
    },
    assignAsset: async (id, user_code, notes = '') => {
        const res = await api.post(`/it-assets/${id}/assign`, null, {
            params: { user_code, notes }
        });
        return res.data;
    },
    unassignAsset: async (id) => {
        const res = await api.post(`/it-assets/${id}/unassign`);
        return res.data;
    },
    getRequests: async (params = {}) => {
        const res = await api.get('/it-requests', { params });
        return res.data;
    },
    createRequest: async (data) => {
        const res = await api.post('/it-requests', data);
        return res.data;
    },
    approveRequest: async (id, action, notes = '', rejection_reason = '') => {
        const body = { action, notes, rejection_reason };
        const res = await api.post(`/it-requests/${id}/approve`, body);
        return res.data;
    },
};