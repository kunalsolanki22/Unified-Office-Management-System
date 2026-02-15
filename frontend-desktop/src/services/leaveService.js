import api from './api';

export const leaveService = {
    getMyLeaves: async (params = {}) => {
        const res = await api.get('/leave/requests/my', { params });
        return res.data;
    },
    getAllLeaves: async (params = {}) => {
        const res = await api.get('/leave/requests', { params });
        return res.data;
    },
    getPendingLeaves: async () => {
        const res = await api.get('/leave/requests/pending');
        return res.data;
    },
    createLeave: async (data) => {
        const res = await api.post('/leave/requests', data);
        return res.data;
    },
    approveLeave: async (id, action, notes = '', rejection_reason = '') => {
        const res = await api.post(`/leave/requests/${id}/approve`, { action, notes, rejection_reason });
        return res.data;
    },
    cancelLeave: async (id) => {
        const res = await api.post(`/leave/requests/${id}/cancel`);
        return res.data;
    },
    getBalance: async () => {
        const res = await api.get('/leave/balance');
        return res.data;
    },
};
