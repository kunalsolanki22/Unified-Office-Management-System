import api from './api';

export const authService = {
    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        return res.data;
    },
    me: async () => {
        const res = await api.get('/auth/me');
        return res.data;
    },
    changePassword: async (current_password, new_password, confirm_password) => {
        const res = await api.post('/auth/change-password', {
            current_password,
            new_password,
            confirm_password
        });
        return res.data;
    },
};
