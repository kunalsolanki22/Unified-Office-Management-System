import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, List, Plus, X, Users, Tag, Info } from 'lucide-react';
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
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-md z-10"
            >
                {/* Header */}
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
                    {/* Label */}
                    <div>
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Table Label *</label>
                        <input
                            type="text"
                            value={form.table_label}
                            onChange={e => setForm(f => ({ ...f, table_label: e.target.value }))}
                            placeholder="e.g. Window Table 3"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all"
                        />
                    </div>

                    {/* Capacity + Type row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Capacity</label>
                            <input
                                type="number"
                                min={1} max={20}
                                value={form.capacity}
                                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Type</label>
                            <select
                                value={form.table_type}
                                onChange={e => setForm(f => ({ ...f, table_type: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all bg-white"
                            >
                                <option value="regular">Regular</option>
                                <option value="high_top">High Top</option>
                                <option value="booth">Booth</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block mb-1.5">Notes (optional)</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="e.g. Near the window"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 focus:border-[#1a367c] transition-all"
                        />
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
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

// ─── Main Component ─────────────────────────────────────────────────────────
const DeskManagement = () => {
    const [tables, setTables] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
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
            const tablesData = Array.isArray(tablesRes) ? tablesRes : (tablesRes.data || []);
            const allBookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.data || []);
            const confirmedBookings = allBookings.filter(b => b.status?.toLowerCase() === 'confirmed');
            setTables(tablesData);
            setBookings(confirmedBookings);
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
        setSelectedTable(selectedTable === table.id ? null : table.id);
    };

    const handleConfirmBooking = async () => {
        if (!selectedTable) return;
        try {
            const table = tables.find(t => t.id === selectedTable);
            await cafeteriaService.createBooking({
                table_id: selectedTable,
                booking_date: new Date().toISOString().split('T')[0],
                start_time: "09:00",
                end_time: "18:00",
                guest_count: 1
            });
            setToast({ message: `Table ${table?.table_code || 'Selected'} Successfully Booked!`, type: 'success' });
            setSelectedTable(null);
            await fetchData();
        } catch (error) {
            setToast({ message: error?.response?.data?.detail || 'Booking failed. Try again.', type: 'error' });
        }
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

    const getTableStyle = (tableId, isBooked) => {
        if (isBooked) return 'bg-slate-100 text-slate-300 cursor-not-allowed border-slate-100';
        if (selectedTable === tableId) return 'bg-[#1a367c] text-white shadow-lg shadow-blue-900/20 ring-2 ring-offset-2 ring-[#1a367c] border-transparent';
        return 'bg-white text-[#1a367c] border-slate-200 hover:border-[#1a367c] hover:shadow-md cursor-pointer';
    };

    const totalTables = tables.length;
    const totalBooked = bookings.length;
    const totalFree = Math.max(0, totalTables - totalBooked);
    const utilizationPercentage = totalTables > 0 ? Math.round((totalBooked / totalTables) * 100) : 0;

    return (
        <div className="space-y-6 pb-10 relative animate-fade-in">
            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </AnimatePresence>

            {/* Add Table Modal */}
            <AnimatePresence>
                {showAddTable && (
                    <AddTableModal
                        onClose={() => setShowAddTable(false)}
                        onSuccess={handleTableAdded}
                    />
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
                {/* Add Table Button */}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAddTable(true)}
                    className="flex items-center gap-2 bg-[#1a367c] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-lg shadow-blue-900/20 hover:bg-[#142a5e] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    ADD TABLE
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
                                    className="text-xs font-bold text-[#1a367c] underline underline-offset-2">
                                    Add your first table
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#fafbfb] rounded-[24px] border-2 border-slate-100 border-dashed p-10 flex justify-center relative overflow-visible">
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                    {tables.map((table) => {
                                        if (!table?.id) return null;
                                        const booked = isTableBooked(table.id);
                                        const isHovered = hoveredTable === table.id;
                                        return (
                                            <div
                                                key={table.id}
                                                className="relative"
                                                onMouseEnter={() => setHoveredTable(table.id)}
                                                onMouseLeave={() => setHoveredTable(null)}
                                            >
                                                {/* Tooltip */}
                                                <AnimatePresence>
                                                    {isHovered && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 w-44 bg-[#1a367c] text-white rounded-2xl shadow-xl shadow-blue-900/30 p-3 pointer-events-none"
                                                        >
                                                            {/* Arrow */}
                                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a367c] rotate-45 rounded-sm" />
                                                            {/* Table code */}
                                                            <p className="text-[0.6rem] font-extrabold tracking-widest text-blue-200 uppercase mb-2">{table.table_code}</p>
                                                            {/* Label */}
                                                            <p className="text-xs font-bold text-white leading-tight mb-2">{table.table_label || '—'}</p>
                                                            <div className="space-y-1.5 border-t border-white/10 pt-2">
                                                                {/* Capacity */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <Users className="w-3 h-3 text-blue-200 shrink-0" />
                                                                    <span className="text-[0.65rem] text-blue-100">Capacity: <span className="font-bold text-white">{table.capacity}</span></span>
                                                                </div>
                                                                {/* Type */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <Tag className="w-3 h-3 text-blue-200 shrink-0" />
                                                                    <span className="text-[0.65rem] text-blue-100 capitalize">{(table.table_type || 'regular').replace('_', ' ')}</span>
                                                                </div>
                                                                {/* Notes */}
                                                                {table.notes && (
                                                                    <div className="flex items-start gap-1.5">
                                                                        <Info className="w-3 h-3 text-blue-200 shrink-0 mt-0.5" />
                                                                        <span className="text-[0.65rem] text-blue-100 leading-tight">{table.notes}</span>
                                                                    </div>
                                                                )}
                                                                {/* Status */}
                                                                <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold ${booked ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${booked ? 'bg-red-400' : 'bg-green-400'}`} />
                                                                    {booked ? 'Booked' : 'Available'}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Table tile */}
                                                <motion.button
                                                    whileHover={!booked ? { scale: 1.1 } : { scale: 1.05 }}
                                                    whileTap={!booked ? { scale: 0.95 } : {}}
                                                    onClick={() => handleTableClick(table, booked)}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-200 relative border ${getTableStyle(table.id, booked)}`}
                                                    disabled={booked}
                                                >
                                                    {table.table_code ? table.table_code.replace('TBL-', '') : '?'}
                                                    {selectedTable === table.id && (
                                                        <motion.div
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="absolute -top-1.5 -right-1.5 bg-[#f9b012] text-white rounded-full p-0.5 shadow-sm"
                                                        >
                                                            <Check className="w-3 h-3" strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            </div>
                                        );
                                    })}


                                    {/* Add Table shortcut tile */}
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setShowAddTable(true)}
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-300 hover:border-[#1a367c] hover:text-[#1a367c] transition-all duration-200"
                                        title="Add new table"
                                    >
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
                            { color: 'bg-[#1a367c]', label: 'Selected' },
                            { color: 'bg-slate-100', label: 'Booked' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-lg ${color}`} />
                                <span className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Book Button */}
                    <motion.div whileHover={selectedTable ? { scale: 1.01 } : {}} whileTap={selectedTable ? { scale: 0.99 } : {}}>
                        <Button
                            className={`w-full py-5 text-sm font-bold tracking-[0.2em] justify-center rounded-2xl transition-all duration-300
                                ${selectedTable ? 'bg-[#1a367c] shadow-xl shadow-blue-900/20 hover:shadow-2xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                            disabled={!selectedTable}
                            onClick={handleConfirmBooking}
                        >
                            {selectedTable ? 'CONFIRM BOOKING' : 'SELECT A TABLE TO BOOK'}
                        </Button>
                    </motion.div>
                </div>

                {/* RIGHT: LIVE ALLOCATIONS */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 h-full flex flex-col min-h-[600px]">
                    <div className="flex items-center gap-3 mb-8">
                        <List className="w-5 h-5 text-[#1a367c]" />
                        <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-wide">Live Allocations</h3>
                        {!loading && bookings.length > 0 && (
                            <span className="ml-auto text-xs bg-[#1a367c] text-white px-2 py-0.5 rounded-full font-bold">
                                {bookings.length}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-[1.2fr_2fr_1fr] gap-4 pb-4 border-b border-slate-100 mb-4">
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Table</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Booked By</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider text-right">Action</div>
                    </div>

                    <div className="space-y-1 overflow-y-auto flex-1 max-h-[400px] mb-8 pr-1 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400 text-xs">Loading...</div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs font-medium italic">
                                No active allocations found.
                            </div>
                        ) : (
                            <AnimatePresence>
                                {bookings.map((alloc) => {
                                    if (!alloc?.id) return null;
                                    const isReleasing = releasingId === alloc.id;
                                    const isConfirming = confirmReleaseId === alloc.id;
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            key={alloc.id}
                                            className="rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-slate-50"
                                        >
                                            <div className="grid grid-cols-[1.2fr_2fr_1fr] gap-4 items-center">
                                                <div>
                                                    <div className="text-sm font-bold text-[#1a367c] leading-tight">{alloc.table_label || alloc.table_code || '?'}</div>
                                                    <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{alloc.table_code}</div>
                                                </div>
                                                <div className="truncate" title={alloc.user_code}>
                                                    <div className="text-sm font-medium text-slate-600 leading-tight truncate">{alloc.user_name || alloc.user_code || 'Unknown'}</div>
                                                    <div className="text-[0.6rem] text-slate-400 font-mono mt-0.5">{alloc.user_code}</div>
                                                </div>
                                                <div className="text-right">
                                                    {!isConfirming && (
                                                        <button
                                                            onClick={() => setConfirmReleaseId(alloc.id)}
                                                            disabled={isReleasing || !!releasingId}
                                                            className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wide hover:underline disabled:opacity-40"
                                                        >
                                                            {isReleasing ? '...' : 'Release'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Inline confirm */}
                                            <AnimatePresence>
                                                {isConfirming && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-2 flex items-center justify-end gap-2 overflow-hidden"
                                                    >
                                                        <span className="text-[0.65rem] text-slate-400 font-medium mr-1">Release this table?</span>
                                                        <button
                                                            onClick={() => setConfirmReleaseId(null)}
                                                            className="text-[0.65rem] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelAllocation(alloc.id)}
                                                            className="text-[0.65rem] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-all shadow-sm"
                                                        >
                                                            Yes, Release
                                                        </button>
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
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${utilizationPercentage}%` }}
                                transition={{ duration: 1, type: "spring" }}
                                className="h-full bg-[#1a367c] rounded-full"
                            />
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
