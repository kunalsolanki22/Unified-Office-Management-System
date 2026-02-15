import api from './api';

export const userService = {
    getDirectory: async (params = {}) => {
        const res = await api.get('/users/directory', { params });
        return res.data;
    },
    getUsers: async (params = {}) => {
        const res = await api.get('/users', { params });
        return res.data;
    },
    createUser: async (data) => {
        const res = await api.post('/users', data);
        return res.data;
    },
    updateUser: async (id, data) => {
        const res = await api.put(`/users/${id}`, data);
        return res.data;
    },
    deleteUser: async (id) => {
        const res = await api.delete(`/users/${id}`);
        return res.data;
    },
    toggleActive: async (id) => {
        const res = await api.post(`/users/${id}/toggle-active`);
        return res.data;
    },
};
