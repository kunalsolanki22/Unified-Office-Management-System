import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Car, CheckCircle, Clock, XCircle, RefreshCw, Timer } from 'lucide-react';
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
    const [logs, setLogs] = useState([]);
    const [slots, setSlots] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ visitor_name: '', vehicle_number: '', vehicle_type: 'CAR', slot_code: '' });
    const [submitting, setSubmitting] = useState(false);
    const [mySlot, setMySlot] = useState(null);
    const [revoking, setRevoking] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all logs
            const logsRes = await parkingService.getLogs(1, 100);
            console.log('Parking logs:', logsRes);
            setLogs(logsRes.data?.logs || []);

            // Fetch available slots
            const availRes = await parkingService.getSlots('AVAILABLE');
            console.log('Available slots:', availRes);
            setSlots(availRes.data?.slots || []);

            // Fetch all slots for total count
            const allRes = await parkingService.getSlots();
            console.log('All slots:', allRes);
            setAllSlots(allRes.data?.slots || []);

            // My slot
            try {
                const myRes = await parkingService.mySlot();
                const myData = myRes.data || null;
                // Flatten the nested response for easier access
                if (myData?.has_active_parking && myData.slot) {
                    setMySlot({
                        slot_code: myData.slot.slot_code,
                        slot_label: myData.slot.slot_label,
                        vehicle_number: myData.vehicle?.vehicle_number,
                        vehicle_type: myData.vehicle?.vehicle_type,
                        entry_time: myData.entry_time,
                    });
                } else {
                    setMySlot(null);
                }
            } catch { setMySlot(null); }
        } catch (err) {
            console.error('Failed to fetch parking data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const availableSlots = slots.filter(s => (s.status || '').toUpperCase() === 'AVAILABLE');
    const occupiedSlots = allSlots.filter(s => (s.status || '').toUpperCase() === 'OCCUPIED');
    const activeLogs = logs.filter(l => l.is_active);
    const pastLogs = logs.filter(l => !l.is_active);

    const handleAllocate = async () => {
        try {
            setSubmitting(true);
            const res = await parkingService.allocate();
            toast.success(res.message || 'Parking allocated!');
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to allocate parking');
        } finally { setSubmitting(false); }
    };

    const handleRelease = async () => {
        try {
            setSubmitting(true);
            const res = await parkingService.release();
            toast.info(res.message || 'Parking released');
            setMySlot(null);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to release parking');
        } finally { setSubmitting(false); }
    };

    const handleRevoke = async (slotCode) => {
        try {
            setRevoking(slotCode);
            await parkingService.changeSlotStatus(slotCode, 'AVAILABLE');
            toast.info(`Slot ${slotCode} revoked and released`);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to revoke slot');
        } finally { setRevoking(null); }
    };

    const handleVisitorAssign = async () => {
        if (!form.visitor_name || !form.vehicle_number || !form.slot_code) {
            toast.error('Please fill all fields and select a slot');
            return;
        }
        try {
            setSubmitting(true);
            await parkingService.assignVisitor(form.visitor_name, form.vehicle_number, form.slot_code, form.vehicle_type);
            toast.success(`Visitor ${form.visitor_name} assigned to ${form.slot_code}!`);
            setForm({ visitor_name: '', vehicle_number: '', vehicle_type: 'CAR', slot_code: '' });
            setShowForm(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to assign visitor');
        } finally { setSubmitting(false); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
    const formatDuration = (mins) => {
        if (!mins) return '—';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const searchFilter = (log) => {
        const s = search.toLowerCase();
        return (log.user_name || '').toLowerCase().includes(s) || (log.vehicle_number || '').toLowerCase().includes(s) || (log.slot_code || '').toLowerCase().includes(s);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        PARKING <span className="text-[#f9b012]">REQUESTS</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">Slot Assignment & Visitor Management</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> REFRESH
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg">
                        <Car className="w-4 h-4" /> ASSIGN VISITOR
                    </button>
                </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`flex items-center gap-4 px-6 py-4 rounded-xl border ${mySlot?.slot_code ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                    <Car className={`w-6 h-6 ${mySlot?.slot_code ? 'text-green-600' : 'text-slate-400'}`} />
                    <div className="flex-1">
                        <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">My Parking</div>
                        {mySlot?.slot_code ? (
                            <div className="text-sm font-bold text-green-700">Slot {mySlot.slot_code} — {mySlot.vehicle_number || 'Assigned'}</div>
                        ) : (
                            <div className="text-sm font-bold text-slate-400">No slot assigned</div>
                        )}
                    </div>
                    {mySlot?.slot_code ? (
                        <button onClick={handleRelease} disabled={submitting} className="border border-red-200 text-red-500 px-4 py-2 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 disabled:opacity-50">RELEASE</button>
                    ) : (
                        <button onClick={handleAllocate} disabled={submitting} className="bg-[#1a367c] text-white px-4 py-2 rounded-lg text-xs font-bold tracking-widest hover:bg-[#2c4a96] shadow-md disabled:opacity-50">
                            {submitting ? 'ALLOCATING...' : 'REQUEST SLOT'}
                        </button>
                    )}
                </div>
                <div className={`flex items-center gap-3 px-6 py-4 rounded-xl border ${availableSlots.length > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">Available</div>
                        <div className="text-sm font-bold">{availableSlots.length} of {allSlots.length} slots</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-700">
                    <Car className="w-5 h-5" />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">Occupied</div>
                        <div className="text-sm font-bold">{occupiedSlots.length} slots in use</div>
                    </div>
                </div>
            </motion.div>

            {/* Visitor Form */}
            {showForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest mb-5">ASSIGN VISITOR PARKING</h3>
                    <div className="grid grid-cols-4 gap-4 mb-5">
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VISITOR NAME</label>
                            <input type="text" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} placeholder="Enter name"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c]" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VEHICLE NUMBER</label>
                            <input type="text" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} placeholder="MH 01 AB 1234"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c]" />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VEHICLE TYPE</label>
                            <select value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c]">
                                <option value="CAR">Car</option><option value="BIKE">Bike</option><option value="EV">EV</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">ASSIGN SLOT</label>
                            <select value={form.slot_code} onChange={e => setForm({ ...form, slot_code: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c]">
                                <option value="">Select slot...</option>
                                {availableSlots.map(s => <option key={s.slot_code} value={s.slot_code}>{s.slot_code}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleVisitorAssign} disabled={submitting}
                            className="bg-[#1a367c] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] disabled:opacity-50">
                            {submitting ? 'ASSIGNING...' : 'ASSIGN VISITOR'}
                        </button>
                        <button onClick={() => { setShowForm(false); setForm({ visitor_name: '', vehicle_number: '', vehicle_type: 'CAR', slot_code: '' }); }}
                            className="border border-slate-200 text-[#8892b0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50">CANCEL</button>
                    </div>
                </motion.div>
            )}

            {/* Currently Occupied — Manager can revoke */}
            {activeLogs.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Car className="w-4 h-4 text-[#f9b012]" /> Currently Occupied ({activeLogs.length})
                    </h3>
                    <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr] pb-3 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                        <div>USER / VISITOR</div><div>VEHICLE NO.</div><div>SLOT</div><div>ENTRY TIME</div><div>DURATION</div><div>ACTION</div>
                    </div>
                    <div className="space-y-1">
                        {activeLogs.filter(searchFilter).map((log) => {
                            const entryDate = log.entry_time ? new Date(log.entry_time) : null;
                            const now = new Date();
                            const liveMins = entryDate ? Math.floor((now - entryDate) / 60000) : null;
                            return (
                                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr] items-center p-4 rounded-xl hover:bg-green-50/50 transition-colors">
                                    <div className="text-sm font-bold text-[#1a367c]">{log.user_name || 'Unknown'}</div>
                                    <div className="text-sm text-[#8892b0]">{log.vehicle_number || '—'}</div>
                                    <div><span className="px-3 py-1 rounded-full text-[0.65rem] font-bold bg-blue-50 text-blue-600">{log.slot_code}</span></div>
                                    <div className="text-xs text-[#8892b0]">
                                        {formatDate(log.entry_time)}<br />
                                        <span className="text-[#1a367c] font-bold">{formatTime(log.entry_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-bold text-[#f9b012]">
                                        <Timer className="w-3 h-3" /> {formatDuration(liveMins)}
                                    </div>
                                    <div>
                                        <button onClick={() => handleRevoke(log.slot_code)} disabled={revoking === log.slot_code}
                                            className="border border-red-200 text-red-500 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all disabled:opacity-50">
                                            {revoking === log.slot_code ? 'REVOKING...' : 'REVOKE'}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Past Parking Logs */}
            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest uppercase">Past Parking Logs ({pastLogs.length})</h3>
                    <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px]">
                        <Search className="w-4 h-4 text-[#b0b0b0]" />
                        <input type="text" placeholder="SEARCH..." value={search} onChange={e => setSearch(e.target.value)}
                            className="bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium border-none" />
                    </div>
                </div>
                <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1fr] pb-3 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div>USER / VISITOR</div><div>VEHICLE NO.</div><div>SLOT</div><div>ENTRY</div><div>EXIT</div><div>DURATION</div>
                </div>
                <div className="space-y-1">
                    {pastLogs.filter(searchFilter).length === 0 && (
                        <div className="text-center py-12 text-[#8892b0] text-sm">No past logs found</div>
                    )}
                    {pastLogs.filter(searchFilter).map((log) => (
                        <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_1fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors">
                            <div className="text-sm font-bold text-[#1a367c]">{log.user_name || 'Unknown'}</div>
                            <div className="text-sm text-[#8892b0]">{log.vehicle_number || '—'}</div>
                            <div><span className="px-3 py-1 rounded-full text-[0.65rem] font-bold bg-slate-50 text-slate-500">{log.slot_code}</span></div>
                            <div className="text-xs text-[#8892b0]">{formatDate(log.entry_time)} {formatTime(log.entry_time)}</div>
                            <div className="text-xs text-[#8892b0]">{formatDate(log.exit_time)} {formatTime(log.exit_time)}</div>
                            <div className="text-xs font-bold text-[#8892b0]">{formatDuration(log.duration_mins)}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ParkingRequests;