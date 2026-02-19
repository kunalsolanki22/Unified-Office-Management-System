import api from './api';

export const holidayService = {
    getHolidays: async (params = {}) => {
        const res = await api.get('/holidays/list', { params });
        return res.data;
    },
    createHoliday: async (data) => {
        const res = await api.post('/holidays/create', data);
        return res.data;
    },
    updateHoliday: async (id, data) => {
        const res = await api.put(`/holidays/${id}`, data);
        return res.data;
    },
    deleteHoliday: async (id) => {
        const res = await api.delete(`/holidays/${id}`);
        return res.data;
    },
};
