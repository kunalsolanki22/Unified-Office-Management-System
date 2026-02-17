import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Car, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { parkingService } from '../../services/parkingService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function ParkingRequests() {
    const [requests, setRequests] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ employee: '', vehicle: '', type: 'Car' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch parking logs
            const logsRes = await parkingService.getLogs();
            console.log('Parking logs response:', logsRes);
            // Backend returns: { data: { total, page, page_size, logs: [...] } }
            const logsArray = logsRes.data?.logs || logsRes.logs || [];
            const mapped = logsArray.map((r) => ({
                id: r.id,
                employee: r.user_name || '—',
                vehicle: r.vehicle_number || '—',
                type: 'Car',
                date: r.entry_time
                    ? new Date(r.entry_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—',
                status: r.is_active ? 'Active' : 'Released',
                assignedSlot: r.slot_code || null,
            }));
            setRequests(mapped);

            // Fetch available slots
            const slotsRes = await parkingService.getSlots('available');
            console.log('Available slots response:', slotsRes);
            // Backend returns: { data: { total, slots: [...] } }
            const slotsArray = slotsRes.data?.slots || slotsRes.slots || [];
            const slotCodes = slotsArray.map(s => s.slot_code).filter(Boolean).sort();
            setAvailableSlots(slotCodes);

        } catch (err) {
            console.error('Failed to load parking requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = requests.filter(r =>
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle.toLowerCase().includes(search.toLowerCase())
    );

    const handleRequest = async () => {
        if (!form.employee || !form.vehicle) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            setSubmitting(true);
            if (availableSlots.length > 0) {
                await parkingService.assignVisitor(form.employee, form.vehicle, availableSlots[0], form.type.toUpperCase());
                toast.success(`Slot ${availableSlots[0]} assigned to ${form.employee}!`);
            } else {
                toast.warn('No slots available.');
            }
            setForm({ employee: '', vehicle: '', type: 'Car' });
            setShowForm(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to process request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (request) => {
        if (!request.assignedSlot) return;
        try {
            await parkingService.changeSlotStatus(request.assignedSlot, 'available');
            toast.info(`Slot ${request.assignedSlot} revoked`);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to revoke slot');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        PARKING <span className="text-[#f9b012]">REQUESTS</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Slot Auto-Assignment System
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="flex items-center gap-2 border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all">
                        <RefreshCw className="w-4 h-4" /> REFRESH
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg">
                        <Car className="w-4 h-4" /> REQUEST PARKING
                    </button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold tracking-wide w-fit ${availableSlots.length > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                <CheckCircle className="w-4 h-4" />
                {availableSlots.length > 0 ? `${availableSlots.length} SLOTS AVAILABLE — Next: ${availableSlots[0]}` : 'NO SLOTS AVAILABLE'}
            </motion.div>

            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest mb-5">NEW PARKING REQUEST</h3>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VISITOR / EMPLOYEE NAME</label>
                            <input type="text" value={form.employee} onChange={e => setForm({ ...form, employee: e.target.value })} placeholder="Enter name" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VEHICLE NUMBER</label>
                            <input type="text" value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} placeholder="MH 01 AB 1234" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VEHICLE TYPE</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors">
                                <option value="Car">Car</option>
                                <option value="Bike">Bike</option>
                                <option value="EV">EV</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleRequest} disabled={submitting} className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all ${submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#1a367c] text-white hover:bg-[#2c4a96]'}`}>
                            {submitting ? 'PROCESSING...' : availableSlots.length > 0 ? `AUTO-ASSIGN ${availableSlots[0]}` : 'ADD TO QUEUE'}
                        </button>
                        <button onClick={() => { setShowForm(false); setForm({ employee: '', vehicle: '', type: 'Car' }); }} className="border border-slate-200 text-[#8892b0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all">CANCEL</button>
                    </div>
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input type="text" placeholder="SEARCH EMPLOYEE OR VEHICLE..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium border-none" />
                </div>

                <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_1fr_1.5fr] pb-4 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div>EMPLOYEE</div><div>VEHICLE NO.</div><div>TYPE</div><div>DATE</div><div>SLOT</div><div>STATUS</div><div>ACTION</div>
                </div>

                <div className="space-y-1">
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-[#8892b0] text-sm">No requests found</div>
                    )}
                    {filtered.map((req) => (
                        <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_1fr_1.5fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors">
                            <div className="text-sm font-bold text-[#1a367c]">{req.employee}</div>
                            <div className="text-sm text-[#8892b0]">{req.vehicle}</div>
                            <div className="text-sm text-[#8892b0]">{req.type}</div>
                            <div className="text-sm text-[#8892b0]">{req.date}</div>
                            <div>
                                {req.assignedSlot
                                    ? <span className="px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide bg-blue-50 text-blue-600">{req.assignedSlot}</span>
                                    : <span className="text-[#8892b0] text-xs">—</span>}
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide flex items-center gap-1 w-fit ${
                                    req.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {req.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {req.status}
                                </span>
                            </div>
                            <div>
                                {req.status === 'Active' && req.assignedSlot && (
                                    <button onClick={() => handleRevoke(req)} className="border border-red-200 text-red-500 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all">REVOKE</button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ParkingRequests;