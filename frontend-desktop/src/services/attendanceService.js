import api from './api';

export const attendanceService = {
    checkIn: async () => {
        const res = await api.post('/attendance/check-in');
        return res.data;
    },
    checkOut: async () => {
        const res = await api.post('/attendance/check-out');
        return res.data;
    },
    getMyAttendance: async (params = {}) => {
        const res = await api.get('/attendance/my', { params });
        return res.data;
    },
    getAllAttendance: async (params = {}) => {
        const res = await api.get('/attendance', { params });
        return res.data;
    },
    getPendingApprovals: async (params = {}) => {
        const res = await api.get('/attendance/pending-approvals', { params });
        return res.data;
    },
    approveAttendance: async (id, action, notes = '', rejection_reason = '') => {
        const res = await api.post(`/attendance/${id}/approve`, { action, notes, rejection_reason });
        return res.data;
    },
};
