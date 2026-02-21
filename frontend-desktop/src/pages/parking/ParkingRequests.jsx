import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Car, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const initialSlots = [
    'A-01', 'A-03', 'A-04', 'A-06', 'A-07', 'A-09',
    'B-02', 'B-03', 'B-05', 'B-06', 'B-08', 'B-09', 'B-10',
    'C-01', 'C-02', 'C-04', 'C-05', 'C-07', 'C-08', 'C-09',
    'D-01', 'D-03', 'D-04', 'D-05', 'D-07',
];

// Existing requests in the system
const initialRequests = [
    { id: 1, employee: 'Marcus Bell', vehicle: 'MH 03 EF 9012', type: 'Car', date: '09 Feb 2026', status: 'Assigned', assignedSlot: 'A-02' },
    { id: 2, employee: 'Elena Vance', vehicle: 'MH 04 GH 3456', type: 'Bike', date: '09 Feb 2026', status: 'Revoked', assignedSlot: null },
];

// Simulate new request form state
const emptyForm = { employee: '', vehicle: '', type: 'Car' };

function ParkingRequests() {
    const [requests, setRequests] = useState(initialRequests);
    const [availableSlots, setAvailableSlots] = useState(initialSlots);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const filtered = requests.filter(r =>
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle.toLowerCase().includes(search.toLowerCase())
    );

    const handleRequest = () => {
        if (!form.employee || !form.vehicle) {
            toast.error('Please fill all fields');
            return;
        }

        const newId = requests.length + 1;

        if (availableSlots.length > 0) {
            // Slot available → auto-assign immediately
            const assignedSlot = availableSlots[0];
            setAvailableSlots(prev => prev.slice(1));
            setRequests(prev => [...prev, {
                id: newId,
                employee: form.employee,
                vehicle: form.vehicle,
                type: form.type,
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                status: 'Assigned',
                assignedSlot,
            }]);
            toast.success(`Slot ${assignedSlot} auto-assigned to ${form.employee}!`);
        } else {
            // No slot available → add to waiting queue
            setRequests(prev => [...prev, {
                id: newId,
                employee: form.employee,
                vehicle: form.vehicle,
                type: form.type,
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                status: 'Waiting',
                assignedSlot: null,
            }]);
            toast.warn(`No slots available. ${form.employee} added to waiting queue.`);
        }

        setForm(emptyForm);
        setShowForm(false);
    };

    const handleRevoke = (id) => {
        const req = requests.find(r => r.id === id);
        if (req?.assignedSlot) {
            // Free the slot back — insert in sorted order
            setAvailableSlots(prev => [...prev, req.assignedSlot].sort());

            // Check if anyone is waiting → auto-assign to first in queue
            const waiting = requests.find(r => r.status === 'Waiting');
            if (waiting) {
                const slotToAssign = req.assignedSlot;
                setRequests(prev => prev.map(r => {
                    if (r.id === id) return { ...r, status: 'Revoked', assignedSlot: null };
                    if (r.id === waiting.id) return { ...r, status: 'Assigned', assignedSlot: slotToAssign };
                    return r;
                }));
                setAvailableSlots(prev => prev.filter(s => s !== slotToAssign));
                toast.info(`Slot ${slotToAssign} reassigned to ${waiting.employee} from waiting queue`);
                return;
            }
        }
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Revoked', assignedSlot: null } : r));
        toast.info('Slot revoked');
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">

            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        PARKING <span className="text-[#f9b012]">REQUESTS</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Slot Auto-Assignment System
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg"
                >
                    <Car className="w-4 h-4" />
                    REQUEST PARKING
                </button>
            </motion.div>

            {/* Availability Banner */}
            <motion.div variants={itemVariants} className={`flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold tracking-wide w-fit
                ${availableSlots.length > 0
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}>
                <CheckCircle className="w-4 h-4" />
                {availableSlots.length > 0
                    ? `${availableSlots.length} SLOTS AVAILABLE — Next: ${availableSlots[0]}`
                    : 'NO SLOTS AVAILABLE — Requests will be queued'
                }
            </motion.div>

            {/* Request Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6"
                >
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest mb-5">NEW PARKING REQUEST</h3>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">EMPLOYEE NAME</label>
                            <input
                                type="text"
                                value={form.employee}
                                onChange={e => setForm({ ...form, employee: e.target.value })}
                                placeholder="Enter name"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VEHICLE NUMBER</label>
                            <input
                                type="text"
                                value={form.vehicle}
                                onChange={e => setForm({ ...form, vehicle: e.target.value })}
                                placeholder="MH 01 AB 1234"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">VEHICLE TYPE</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors"
                            >
                                <option value="Car">Car</option>
                                <option value="Bike">Bike</option>
                                <option value="EV">EV</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRequest}
                            className="bg-[#1a367c] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all"
                        >
                            {availableSlots.length > 0 ? `AUTO-ASSIGN ${availableSlots[0]}` : 'ADD TO QUEUE'}
                        </button>
                        <button
                            onClick={() => { setShowForm(false); setForm(emptyForm); }}
                            className="border border-slate-200 text-[#8892b0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all"
                        >
                            CANCEL
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Requests Table */}
            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input
                        type="text"
                        placeholder="SEARCH EMPLOYEE OR VEHICLE..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium border-none"
                    />
                </div>

                <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_1fr_1.5fr] pb-4 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div>EMPLOYEE</div>
                    <div>VEHICLE NO.</div>
                    <div>TYPE</div>
                    <div>DATE</div>
                    <div>SLOT</div>
                    <div>STATUS</div>
                    <div>ACTION</div>
                </div>

                <div className="space-y-1">
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-[#8892b0] text-sm">
                            No requests found
                        </div>
                    )}
                    {filtered.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1.5fr_1fr_1.5fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors"
                        >
                            <div className="text-sm font-bold text-[#1a367c]">{req.employee}</div>
                            <div className="text-sm text-[#8892b0]">{req.vehicle}</div>
                            <div className="text-sm text-[#8892b0]">{req.type}</div>
                            <div className="text-sm text-[#8892b0]">{req.date}</div>
                            <div>
                                {req.assignedSlot
                                    ? <span className="px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide bg-blue-50 text-blue-600">{req.assignedSlot}</span>
                                    : <span className="text-[#8892b0] text-xs">—</span>
                                }
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide flex items-center gap-1 w-fit
                                    ${req.status === 'Assigned' ? 'bg-green-50 text-green-600' :
                                        req.status === 'Waiting' ? 'bg-[#fff8e6] text-[#f9b012]' :
                                            'bg-red-50 text-red-500'}`}>
                                    {req.status === 'Assigned' && <CheckCircle className="w-3 h-3" />}
                                    {req.status === 'Waiting' && <Clock className="w-3 h-3" />}
                                    {req.status === 'Revoked' && <XCircle className="w-3 h-3" />}
                                    {req.status}
                                </span>
                            </div>
                            <div>
                                {req.status === 'Assigned' && (
                                    <button
                                        onClick={() => handleRevoke(req.id)}
                                        className="border border-red-200 text-red-500 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all"
                                    >
                                        REVOKE
                                    </button>
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