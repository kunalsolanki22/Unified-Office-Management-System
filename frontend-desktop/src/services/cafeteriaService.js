import api from './api';

export const cafeteriaService = {
    getTables: async (params = {}) => {
        try {
            const res = await api.get('/cafeteria/tables', { params });
            console.log('getTables response:', res);
            return res.data;
        } catch (error) {
            console.error('getTables error:', error);
            throw error;
        }
    },
    getFoodItems: async (params = {}) => {
        const res = await api.get('/food-orders/items', { params });
        console.log('getFoodItems response:', res);
        return res.data;
    },
    createFoodItem: async (data) => {
        const res = await api.post('/food-orders/items', data);
        return res.data;
    },
    updateFoodItem: async (id, data) => {
        const res = await api.put(`/food-orders/items/${id}`, data);
        return res.data;
    },
    getOrders: async (params = {}) => {
        const res = await api.get('/food-orders/orders', { params });
        console.log('getOrders response:', res);
        return res.data;
    },
    updateOrderStatus: async (id, status) => {
        const res = await api.put(`/food-orders/orders/${id}/status`, { status });
        return res.data;
    },
    getDashboardStats: async () => {
        const res = await api.get('/food-orders/dashboard/stats');
        console.log('getDashboardStats response:', res);
        return res.data;
    },
    getReservations: async (params = {}) => {
        const res = await api.get('/cafeteria/bookings', { params });
        console.log('getReservations response:', res);
        return res.data;
    },
    getCafeteriaStats: async () => {
        const res = await api.get('/cafeteria/stats');
        console.log('getCafeteriaStats response:', res);
        return res.data;
    },
    createBooking: async (data) => {
        const res = await api.post('/cafeteria/bookings', data);
        return res.data;
    },
    cancelBooking: async (id) => {
        const res = await api.delete(`/cafeteria/bookings/${id}`);
        return res.data;
    },
    createTable: async (data) => {
        const res = await api.post('/cafeteria/tables', data);
        return res.data;
    },
    getUserDirectory: async (params = {}) => {
        const res = await api.get('/users/directory', { params });
        return res.data;
    }
};
