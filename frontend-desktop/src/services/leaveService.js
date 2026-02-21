import api from './api';

export const leaveService = {
    // Get leave balances
    getBalance: async (year) => {
        const params = year ? { year } : {};
        const res = await api.get('/leave/balance', { params });
        return res.data;
    },

    // Apply for leave
    createLeave: async (data) => {
        return await api.post('/leave/requests', data);
    },

    // Get my leave history
    getMyLeaves: async (params = {}) => {
        const res = await api.get('/leave/requests', { params });
        return res.data;
    },

    // Get pending approvals (hierarchy aware)
    getPendingApprovals: async (params = {}) => {
        const res = await api.get('/leave/approvals', { params });
        return res.data;
    },

    // Approve/Reject leave
    approveLeave: async (id, action, notes = '', rejection_reason = '') => {
        const payload = {
            action,
            notes,
            rejection_reason
        };
        const response = await api.post(`/leave/requests/${id}/approve`, payload);
        return response.data;
    },

    // Cancel leave
    cancelLeave: async (id, reason = '') => {
        const res = await api.post(`/leave/requests/${id}/cancel`, { reason });
        return res.data;
    },

    // Admin/Manager view specific user balance
    getUserBalance: async (userId, year) => {
        const params = year ? { year } : {};
        const res = await api.get(`/leave/balance/${userId}`, { params });
        return res.data;
    }
};
