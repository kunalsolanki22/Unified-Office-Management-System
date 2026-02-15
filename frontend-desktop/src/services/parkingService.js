import api from './api';

export const parkingService = {
    getSummary: async () => {
        const res = await api.get('/parking/slots/summary');
        return res.data;
    },
    getSlots: async (status = null) => {
        const params = status ? { status } : {};
        const res = await api.get('/parking/slots/list', { params });
        return res.data;
    },
    createSlot: async (slot_label, parking_type = 'employee') => {
        const res = await api.post('/parking/slots/create', null, {
            params: { slot_label, parking_type }
        });
        return res.data;
    },
    deleteSlot: async (slot_code) => {
        const res = await api.delete(`/parking/slots/delete/${slot_code}`);
        return res.data;
    },
    getLogs: async (page = 1, page_size = 20) => {
        const res = await api.get('/parking/logs/list', { params: { page, page_size } });
        return res.data;
    },
    assignVisitor: async (visitor_name, vehicle_number, slot_code, vehicle_type = 'CAR') => {
        const res = await api.post('/parking/slots/assign-visitor', null, {
            params: { visitor_name, vehicle_number, slot_code, vehicle_type }
        });
        return res.data;
    },
    changeSlotStatus: async (slot_code, new_status) => {
        const res = await api.post(`/parking/slots/change-status/${slot_code}`, null, {
            params: { new_status }
        });
        return res.data;
    },
    allocate: async () => {
        const res = await api.post('/parking/allocate');
        return res.data;
    },
    release: async () => {
        const res = await api.post('/parking/release');
        return res.data;
    },
    mySlot: async () => {
        const res = await api.get('/parking/my-slot');
        return res.data;
    },
};
