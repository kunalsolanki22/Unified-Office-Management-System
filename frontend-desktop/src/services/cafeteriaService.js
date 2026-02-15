import api from './api';

export const cafeteriaService = {
    getTables: async () => {
        const res = await api.get('/cafeteria/tables');
        return res.data;
    },
    getFoodItems: async (params = {}) => {
        const res = await api.get('/food-orders/items', { params });
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
        return res.data;
    },
    updateOrderStatus: async (id, status) => {
        const res = await api.put(`/food-orders/orders/${id}/status`, { status });
        return res.data;
    },
};
