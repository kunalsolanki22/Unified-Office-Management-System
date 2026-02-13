const BASE_URL = 'http://localhost:8000/api/v1';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// ─── PARKING ───────────────────────────────────────
export const getParkingStats = async () => {
    const res = await fetch(`${BASE_URL}/parking/slots/summary`, { headers: getHeaders() });
    return res.json();
};

export const getParkingSlots = async () => {
    const res = await fetch(`${BASE_URL}/parking/slots/list`, { headers: getHeaders() });
    return res.json();
};

export const getParkingLogs = async (page = 1, pageSize = 20) => {
    const res = await fetch(`${BASE_URL}/parking/logs/list?page=${page}&page_size=${pageSize}`, { headers: getHeaders() });
    return res.json();
};

export const createParkingSlot = async (slotCode) => {
    const res = await fetch(`${BASE_URL}/parking/slots/create?slot_code=${slotCode}`, {
        method: 'POST', headers: getHeaders()
    });
    return res.json();
};

export const deleteParkingSlot = async (slotCode) => {
    const res = await fetch(`${BASE_URL}/parking/slots/delete/${slotCode}`, {
        method: 'DELETE', headers: getHeaders()
    });
    return res.json();
};

export const changeSlotStatus = async (slotCode, newStatus) => {
    const res = await fetch(`${BASE_URL}/parking/slots/change-status/${slotCode}?new_status=${newStatus}`, {
        method: 'POST', headers: getHeaders()
    });
    return res.json();
};

// ─── IT ASSETS ─────────────────────────────────────
export const getAssets = async (page = 1, pageSize = 20) => {
    const res = await fetch(`${BASE_URL}/it-assets?page=${page}&page_size=${pageSize}`, { headers: getHeaders() });
    return res.json();
};

export const assignAsset = async (assetId, userId, notes = '') => {
    const res = await fetch(`${BASE_URL}/it-assets/${assetId}/assign`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, notes })
    });
    return res.json();
};

export const unassignAsset = async (assetId) => {
    const res = await fetch(`${BASE_URL}/it-assets/${assetId}/unassign`, {
        method: 'POST', headers: getHeaders()
    });
    return res.json();
};

// ─── IT REQUESTS ───────────────────────────────────
export const getITRequests = async (status = '', page = 1) => {
    const query = status ? `?status=${status}&page=${page}` : `?page=${page}`;
    const res = await fetch(`${BASE_URL}/it-requests${query}`, { headers: getHeaders() });
    return res.json();
};

export const approveITRequest = async (requestId, action, notes = '', rejectionReason = '') => {
    const res = await fetch(`${BASE_URL}/it-requests/${requestId}/approve`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
            action,
            notes,
            rejection_reason: rejectionReason
        })
    });
    return res.json();
};