import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, List, Plus, X, Users, Tag, Info, Clock, Minus, PartyPopper, Coffee, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { cafeteriaService } from '../../services/cafeteriaService';

// ─── Add Table Modal ────────────────────────────────────────────────────────
const AddTableModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({ table_label: '', capacity: 4, table_type: 'regular', notes: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.table_label.trim()) { setError('Table label is required.'); return; }
        try {
            setSaving(true);
            await cafeteriaService.createTable({
                table_label: form.table_label.trim(),
                capacity: Number(form.capacity),
                table_type: form.table_type,
                notes: form.notes.trim() || null,
            });
            onSuccess();
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to create table.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-md z-10"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-[#1a367c]">ADD NEW TABLE</h2>
                        <p className="text-xs text-[#8892b0] mt-0.5">Table code will be auto-generated</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Table Label *</label>
                        <input type="text" value={form.table_label} onChange={e => setForm(f => ({ ...f, table_label: e.target.value }))}
                            placeholder="e.g. Window Table 3"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Capacity</label>
                            <input type="number" min={1} max={20} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all" />
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Type</label>
                            <select value={form.table_type} onChange={e => setForm(f => ({ ...f, table_type: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all bg-white">
                                <option value="regular">Regular</option>
                                <option value="high_top">High Top</option>
                                <option value="booth">Booth</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Notes (optional)</label>
                        <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="e.g. Near the window"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all" />
                    </div>
                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 rounded-xl bg-[#1a367c] text-white text-sm font-bold hover:bg-[#142a5e] transition-all shadow-lg shadow-blue-900/20 disabled:opacity-60">
                            {saving ? 'Adding...' : 'Add Table'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ─── Booking Modal ──────────────────────────────────────────────────────────
const BookingModal = ({ table, bookings = [], onClose, onSuccess }) => {
    const [bookingDate, setBookingDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [guestCount, setGuestCount] = useState(1);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const minDuration = 10;
    const maxDuration = 180;
    const step = 10;

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setBookingDate(today);

        const now = new Date();
        const mins = Math.ceil(now.getMinutes() / 10) * 10;
        now.setMinutes(mins, 0, 0);
        if (mins >= 60) now.setHours(now.getHours() + 1, 0, 0, 0);
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        setStartTime(`${h}:${m}`);
    }, []);

    const calculateEndTime = () => {
        if (!startTime) return '';
        const [h, m] = startTime.split(':').map(Number);
        const totalMin = h * 60 + m + duration;
        const endH = Math.floor(totalMin / 60) % 24;
        const endM = totalMin % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    };

    const formatDuration = (mins) => {
        if (mins < 60) return `${mins} min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const handleSubmit = async () => {
        if (!startTime) { setError('Please select a start time'); return; }
        if (!bookingDate) { setError('Please select a date'); return; }
        const endTime = calculateEndTime();
        if (!endTime) { setError('Invalid time selection'); return; }

        if (table.status?.toLowerCase() === 'inactive') {
            setError('This table is currently inactive');
            return;
        }

        const now = new Date();
        const start = new Date(`${bookingDate}T${startTime}`);
        if (start < now) {
            setError('Booking time must be in the future');
            return;
        }

        const hasOverlap = bookings.some(b => {
            if (b.table_id !== table.id) return false;
            if (b.booking_date !== bookingDate) return false;
            if (b.status?.toLowerCase() !== 'confirmed') return false;
            return (startTime < b.end_time && endTime > b.start_time);
        });

        if (hasOverlap) {
            setError('This table is already booked for the selected time slot');
            return;
        }

        try {
            setSaving(true);
            await cafeteriaService.createBooking({
                table_id: table.id,
                booking_date: bookingDate,
                start_time: startTime,
                end_time: endTime,
                guest_count: guestCount,
                notes: notes.trim() || null,
            });
            onSuccess(table.table_code);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Booking failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-md z-10 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#1a367c] shadow-sm">
                            <Coffee className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-[#1a367c] tracking-tight">RESERVE TABLE</h2>
                            <p className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest leading-none mt-1">
                                {table.table_code} · {table.table_label} (Seats {table.capacity})
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-[#8892b0] hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Date Picker */}
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">RESERVATION DATE</label>
                        <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 text-sm text-[#1a367c] font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1a367c]/10 transition-all" />
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">START TIME</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 text-sm text-[#1a367c] font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1a367c]/10 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Duration Picker */}
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">DURATION</label>
                            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-200">
                                <button onClick={() => setDuration(d => Math.max(minDuration, d - step))}
                                    disabled={duration <= minDuration}
                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all">
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <div className="text-center">
                                    <div className="text-sm font-extrabold text-[#1a367c]">{formatDuration(duration)}</div>
                                </div>
                                <button onClick={() => setDuration(d => Math.min(maxDuration, d + step))}
                                    disabled={duration >= maxDuration}
                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Guest Count */}
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">GUESTS</label>
                            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-200">
                                <button onClick={() => setGuestCount(g => Math.max(1, g - 1))}
                                    disabled={guestCount <= 1}
                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all">
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <div className="text-center">
                                    <div className="text-sm font-extrabold text-[#1a367c]">{guestCount}</div>
                                </div>
                                <button onClick={() => setGuestCount(g => Math.min(table.capacity, g + 1))}
                                    disabled={guestCount >= table.capacity}
                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all">
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-2">
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">NOTES (OPTIONAL)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Add special requests or occasion details..." rows={2}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 text-sm text-[#1a367c] font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1a367c]/10 transition-all resize-none" />
                    </div>

                    {/* Summary */}
                    <div className="bg-[#1a367c]/5 rounded-[24px] p-5 border border-[#1a367c]/10">
                        <div className="flex items-center justify-between text-[#1a367c]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className="text-[0.65rem] font-bold uppercase tracking-widest">SUMMARY</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black tracking-tight">
                                    {startTime} — {calculateEndTime()}
                                </div>
                                <div className="text-[0.6rem] font-bold text-[#8892b0] uppercase tracking-widest">
                                    {bookingDate === new Date().toISOString().split('T')[0] ? 'TODAY' : bookingDate}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                            <Info className="w-4 h-4 flex-shrink-0" />
                            <p className="text-[0.7rem] font-bold">{error}</p>
                        </div>
                    )}

                    <button onClick={handleSubmit} disabled={saving}
                        className="w-full py-5 rounded-[24px] bg-[#1a367c] text-white text-[0.75rem] font-black tracking-[0.2em] hover:bg-[#142a5e] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 uppercase">
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>RESERVING...</span>
                            </>
                        ) : (
                            <>
                                <span>CONFIRM RESERVATION</span>
                                <Check className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const DeskManagement = () => {
    const [tables, setTables] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [releasingId, setReleasingId] = useState(null);
    const [confirmReleaseId, setConfirmReleaseId] = useState(null);
    const [showAddTable, setShowAddTable] = useState(false);
    const [hoveredTable, setHoveredTable] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tablesRes, bookingsRes] = await Promise.all([
                cafeteriaService.getTables({ page: 1, page_size: 100 }),
                cafeteriaService.getReservations({ page: 1, page_size: 100 })
            ]);

            // Robust data mapping
            const tablesData = tablesRes?.data?.tables || tablesRes?.data || (Array.isArray(tablesRes) ? tablesRes : []);
            const allBookings = bookingsRes?.data?.bookings || bookingsRes?.data || (Array.isArray(bookingsRes) ? bookingsRes : []);

            console.log('Cafeteria Manager Fetch - Tables:', tablesData.length, 'Bookings:', allBookings.length);

            // Only show active bookings (not expired)
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const activeBookings = allBookings.filter(b => {
                const status = (b.status || '').toLowerCase();
                if (status !== 'confirmed' && status !== 'pending') return false;
                if (b.booking_date < today) return false;
                if (b.booking_date === today && b.end_time && b.end_time <= currentTime) return false;
                return true;
            });

            console.log('Refined Active Bookings:', activeBookings.length);

            setTables(tablesData);
            setBookings(activeBookings);
        } catch (error) {
            console.error("Failed to fetch desk data", error);
            setToast({ message: 'Failed to load data', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleTableClick = (table, isBooked) => {
        if (isBooked) return;
        setSelectedTable(table);
        setShowBookingModal(true);
    };

    const handleBookingSuccess = (tableCode) => {
        setShowBookingModal(false);
        setSelectedTable(null);
        setToast({ message: `Table ${tableCode} Successfully Booked!`, type: 'success' });
        fetchData();
    };

    const handleCancelAllocation = async (bookingId) => {
        try {
            setReleasingId(bookingId);
            setConfirmReleaseId(null);
            await cafeteriaService.cancelBooking(bookingId);
            setBookings(prev => prev.filter(b => b.id !== bookingId));
            setToast({ message: 'Table Released Successfully', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to release table.', type: 'error' });
            await fetchData();
        } finally {
            setReleasingId(null);
        }
    };

    const handleTableAdded = () => {
        setShowAddTable(false);
        setToast({ message: 'New table added to layout!', type: 'success' });
        fetchData();
    };

    const isTableBooked = (tableId) => bookings.some(b => b.table_id === tableId);

    const getBookingForTable = (tableId) => bookings.find(b => b.table_id === tableId);

    const getTableStyle = (tableId, isBooked) => {
        if (isBooked) return 'bg-slate-100 text-slate-300 cursor-not-allowed border-slate-100';
        return 'bg-white text-[#1a367c] border-slate-200 hover:border-[#1a367c] hover:shadow-md cursor-pointer';
    };

    const totalTables = tables.length;
    const totalBooked = bookings.length;
    const totalFree = Math.max(0, totalTables - totalBooked);
    const utilizationPercentage = totalTables > 0 ? Math.round((totalBooked / totalTables) * 100) : 0;

    return (
        <div className="space-y-6 pb-10 relative animate-fade-in">
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            <AnimatePresence>
                {showAddTable && <AddTableModal onClose={() => setShowAddTable(false)} onSuccess={handleTableAdded} />}
            </AnimatePresence>

            <AnimatePresence>
                {showBookingModal && selectedTable && (
                    <BookingModal table={selectedTable} bookings={bookings} onClose={() => { setShowBookingModal(false); setSelectedTable(null); }} onSuccess={handleBookingSuccess} />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        DESK <span className="text-[#f9b012]">MANAGEMENT</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Cafeteria Seating Allocation
                    </p>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAddTable(true)}
                    className="flex items-center gap-2 bg-[#1a367c] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-lg shadow-blue-900/20 hover:bg-[#142a5e] transition-colors">
                    <Plus className="w-4 h-4" /> ADD TABLE
                </motion.button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-8">
                {/* LEFT: SEATING MAP */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 relative h-fit min-h-[500px]">
                    <div className="absolute top-8 right-8 bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[0.65rem] font-extrabold tracking-widest uppercase border border-green-100 shadow-sm z-10">
                        {loading ? '...' : totalFree} AVAILABLE
                    </div>

                    <div className="mb-12 mt-12">
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest mb-6 pl-2 border-l-4 border-[#1a367c]">
                            Table Layout · {loading ? '...' : totalTables} tables
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64 text-slate-400 text-sm">Loading tables...</div>
                        ) : tables.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-64 gap-3">
                                <p className="text-slate-400 text-sm">No tables yet.</p>
                                <button onClick={() => setShowAddTable(true)}
                                    className="text-xs font-bold text-[#1a367c] underline underline-offset-2">Add your first table</button>
                            </div>
                        ) : (
                            <div className="bg-[#fafbfb] rounded-[24px] border-2 border-slate-100 border-dashed p-10 flex justify-center relative overflow-visible">
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {tables.map((table) => {
                                        if (!table?.id) return null;
                                        const booked = isTableBooked(table.id);
                                        const booking = getBookingForTable(table.id);
                                        const isHovered = hoveredTable === table.id;
                                        return (
                                            <div key={table.id} className="relative"
                                                onMouseEnter={() => setHoveredTable(table.id)}
                                                onMouseLeave={() => setHoveredTable(null)}>
                                                <AnimatePresence>
                                                    {isHovered && (
                                                        <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 6, scale: 0.95 }} transition={{ duration: 0.15 }}
                                                            className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 w-48 bg-[#1a367c] text-white rounded-2xl shadow-xl shadow-blue-900/30 p-3 pointer-events-none">
                                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a367c] rotate-45 rounded-sm" />
                                                            <p className="text-[0.6rem] font-extrabold tracking-widest text-blue-200 uppercase mb-2">{table.table_code}</p>
                                                            <p className="text-xs font-bold text-white leading-tight mb-2">{table.table_label || '—'}</p>
                                                            <div className="space-y-1.5 border-t border-white/10 pt-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Users className="w-3 h-3 text-blue-200 shrink-0" />
                                                                    <span className="text-[0.65rem] text-blue-100">Capacity: <span className="font-bold text-white">{table.capacity}</span></span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <Tag className="w-3 h-3 text-blue-200 shrink-0" />
                                                                    <span className="text-[0.65rem] text-blue-100 capitalize">{(table.table_type || 'regular').replace('_', ' ')}</span>
                                                                </div>
                                                                {booked && booking && (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                                                                        <span className="text-[0.65rem] text-amber-200">{booking.start_time?.slice(0, 5)} → {booking.end_time?.slice(0, 5)}</span>
                                                                    </div>
                                                                )}
                                                                {table.notes && (
                                                                    <div className="flex items-start gap-1.5">
                                                                        <Info className="w-3 h-3 text-blue-200 shrink-0 mt-0.5" />
                                                                        <span className="text-[0.65rem] text-blue-100 leading-tight">{table.notes}</span>
                                                                    </div>
                                                                )}
                                                                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${booked ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${booked ? 'bg-red-400' : 'bg-green-400'}`} />
                                                                    {booked ? 'Booked' : 'Available'}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <motion.button whileHover={!booked ? { scale: 1.1 } : { scale: 1.05 }}
                                                    whileTap={!booked ? { scale: 0.95 } : {}}
                                                    onClick={() => handleTableClick(table, booked)}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-200 relative border ${getTableStyle(table.id, booked)}`}
                                                    disabled={booked}>
                                                    {table.table_code ? table.table_code.replace('TBL-', '') : '?'}
                                                </motion.button>
                                            </div>
                                        );
                                    })}
                                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowAddTable(true)}
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-300 hover:border-[#1a367c] hover:text-[#1a367c] transition-all duration-200"
                                        title="Add new table">
                                        <Plus className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-10 mb-10 pb-8 border-b border-slate-50">
                        {[
                            { color: 'bg-white border border-slate-200', label: 'Available' },
                            { color: 'bg-slate-100', label: 'Booked' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-lg ${color}`} />
                                <span className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-xs text-[#8892b0] font-medium">Click any available table to book</p>
                </div>

                {/* RIGHT: LIVE ALLOCATIONS */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 h-full flex flex-col min-h-[600px]">
                    <div className="flex items-center gap-3 mb-8">
                        <List className="w-5 h-5 text-[#1a367c]" />
                        <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-wide">Live Allocations</h3>
                        {!loading && bookings.length > 0 && (
                            <span className="ml-auto text-xs bg-[#1a367c] text-white px-2 py-0.5 rounded-full font-bold">{bookings.length}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-3 pb-4 border-b border-slate-100 mb-4">
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Table</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Booked By</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Time</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider text-right">Action</div>
                    </div>

                    <div className="space-y-1 overflow-y-auto flex-1 max-h-[400px] mb-8 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400 text-xs">Loading...</div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs font-medium italic">No active allocations found.</div>
                        ) : (
                            <AnimatePresence>
                                {bookings.map((alloc) => {
                                    if (!alloc?.id) return null;
                                    const isReleasing = releasingId === alloc.id;
                                    const isConfirming = confirmReleaseId === alloc.id;
                                    const isOccasion = alloc.notes?.startsWith('🎉');
                                    return (
                                        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                                            key={alloc.id} className="rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50">
                                            <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] gap-3 items-center">
                                                <div>
                                                    <div className="text-sm font-bold text-[#1a367c] leading-tight">{alloc.table_label || alloc.table_code || '?'}</div>
                                                    <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{alloc.table_code}</div>
                                                </div>
                                                <div className="truncate" title={alloc.user_code}>
                                                    <div className="text-sm font-medium text-slate-600 leading-tight truncate">{alloc.user_name || alloc.user_code || 'Unknown'}</div>
                                                    {isOccasion && <div className="text-[0.6rem] text-[#f9b012] font-bold mt-0.5">{alloc.notes}</div>}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-[#1a367c]">
                                                        {alloc.start_time?.slice(0, 5)} → {alloc.end_time?.slice(0, 5)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {!isConfirming && (
                                                        <button onClick={() => setConfirmReleaseId(alloc.id)}
                                                            disabled={isReleasing || !!releasingId}
                                                            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wide hover:underline disabled:opacity-40">
                                                            {isReleasing ? '...' : 'Release'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <AnimatePresence>
                                                {isConfirming && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                        className="mt-2 flex items-center justify-end gap-2 overflow-hidden">
                                                        <span className="text-[0.65rem] text-slate-400 font-medium mr-1">Release this table?</span>
                                                        <button onClick={() => setConfirmReleaseId(null)}
                                                            className="text-[0.65rem] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all">Cancel</button>
                                                        <button onClick={() => handleCancelAllocation(alloc.id)}
                                                            className="text-[0.65rem] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-all shadow-sm">Yes, Release</button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Utilization */}
                    <div className="mt-auto pt-8 border-t border-slate-100">
                        <h4 className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider mb-4">Seating Utilization</h4>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${utilizationPercentage}%` }}
                                transition={{ duration: 1, type: "spring" }} className="h-full bg-[#1a367c] rounded-full" />
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold">
                            <div className="text-[#1a367c]">{utilizationPercentage}% Occupied</div>
                            <div className="text-slate-400">{100 - utilizationPercentage}% Available</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeskManagement;