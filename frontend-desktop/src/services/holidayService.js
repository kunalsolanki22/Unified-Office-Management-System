import api from './api';

export const holidayService = {
    getHolidays: async (year = new Date().getFullYear()) => {
        const res = await api.get('/holidays', { params: { year } });
        return res.data;
    },
    createHoliday: async (data) => {
        const res = await api.post('/holidays', data);
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
