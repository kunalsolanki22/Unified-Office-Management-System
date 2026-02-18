import api from './api';

export const deskService = {
    // ===== Desks =====
    getDesks: async (params = {}) => {
        const res = await api.get('/desks', { params });
        return res.data;
    },
    createDesk: async (data) => {
        const res = await api.post('/desks', data);
        return res.data;
    },
    updateDesk: async (id, data) => {
        const res = await api.put(`/desks/${id}`, data);
        return res.data;
    },
    deleteDesk: async (id) => {
        const res = await api.delete(`/desks/${id}`);
        return res.data;
    },

    // ===== Desk Bookings =====
    getDeskBookings: async (params = {}) => {
        const res = await api.get('/desks/bookings', { params });
        return res.data;
    },
    createDeskBooking: async (data) => {
        const res = await api.post('/desks/bookings', data);
        return res.data;
    },
    cancelDeskBooking: async (id, reason = '') => {
        const res = await api.delete(`/desks/bookings/${id}`, { params: { reason } });
        return res.data;
    },
    getMyDeskBookings: async () => {
        const res = await api.get('/desks/bookings/my');
        return res.data;
    },

    // ===== Conference Rooms =====
    getRooms: async (params = {}) => {
        const res = await api.get('/desks/rooms', { params });
        return res.data;
    },
    createRoom: async (data) => {
        const res = await api.post('/desks/rooms', data);
        return res.data;
    },
    updateRoom: async (id, data) => {
        const res = await api.put(`/desks/rooms/${id}`, data);
        return res.data;
    },
    deleteRoom: async (id) => {
        const res = await api.delete(`/desks/rooms/${id}`);
        return res.data;
    },

    // ===== Conference Room Bookings =====
    getRoomBookings: async (params = {}) => {
        const res = await api.get('/desks/rooms/bookings', { params });
        return res.data;
    },
    createRoomBooking: async (data) => {
        const res = await api.post('/desks/rooms/bookings', data);
        return res.data;
    },
    cancelRoomBooking: async (id, reason = '') => {
        const res = await api.delete(`/desks/rooms/bookings/${id}`, { params: { reason } });
        return res.data;
    },
    getPendingRoomBookings: async (params = {}) => {
        const res = await api.get('/desks/rooms/bookings/pending', { params });
        return res.data;
    },
    approveRoomBooking: async (id, notes = '') => {
        const res = await api.post(`/desks/rooms/bookings/${id}/approve`, { notes });
        return res.data;
    },
    rejectRoomBooking: async (id, reason) => {
        const res = await api.post(`/desks/rooms/bookings/${id}/reject`, { reason });
        return res.data;
    },
};