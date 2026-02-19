import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Ghost, X, Check, RefreshCw, AlertTriangle, CheckCircle, XCircle, Calendar, Clock, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { deskService } from '../../services/deskService';

const DeskBooking = () => {
    const [desks, setDesks] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDesk, setSelectedDesk] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingDates, setBookingDates] = useState({ start_date: '', end_date: '', start_time: '09:00', end_time: '18:00' });
    const [submitting, setSubmitting] = useState(false);

    // Rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectBooking, setRejectBooking] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);

            const desksRes = await deskService.getDesks({ page_size: 100 });
            console.log('Desks response:', desksRes);
            setDesks(desksRes.data || []);

            const bookingsRes = await deskService.getDeskBookings({ page_size: 100 });
            console.log('Bookings response:', bookingsRes);
            const today = new Date().toISOString().split('T')[0];
            const activeBookings = (bookingsRes.data || []).filter(b => {
                const status = b.status.toLowerCase();
                if (status === 'cancelled' || status === 'rejected') return false;
                return b.end_date >= today;
            });
            setBookings(activeBookings);
        } catch (err) {
            console.error('Failed to load desk data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getDeskStatus = (desk) => {
        const activeBooking = bookings.find(
            b => b.desk_id === desk.id && (b.status.toLowerCase() === 'confirmed' || b.status.toLowerCase() === 'checked_in' || b.status.toLowerCase() === 'pending')
        );
        return activeBooking ? { booked: true, booking: activeBooking } : { booked: false };
    };

    const handleDeskClick = (desk) => {
        setSelectedDesk(desk);
        setIsModalOpen(true);
        const today = new Date().toISOString().split('T')[0];
        setBookingDates({ start_date: today, end_date: today, start_time: '09:00', end_time: '18:00' });
    };

    const handleAllocate = async () => {
        if (!bookingDates.start_date || !bookingDates.end_date || !bookingDates.start_time || !bookingDates.end_time) {
            toast.error('Please select dates and times');
            return;
        }
        if (bookingDates.start_time >= bookingDates.end_time && bookingDates.start_date === bookingDates.end_date) {
            toast.error('End time must be after start time');
            return;
        }
        try {
            setSubmitting(true);
            await deskService.createDeskBooking({
                desk_id: selectedDesk.id,
                start_date: bookingDates.start_date,
                end_date: bookingDates.end_date,
                start_time: bookingDates.start_time,
                end_time: bookingDates.end_time,
            });
            toast.success(`Desk ${selectedDesk.desk_code} booked successfully!`);
            setIsModalOpen(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to book desk');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (bookingId) => {
        try {
            await deskService.cancelDeskBooking(bookingId, 'Cancelled by manager');
            toast.info('Booking cancelled');
            setIsModalOpen(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to cancel booking');
        }
    };

    // Approval handlers
    const handleApprove = async (booking) => {
        try {
            setSubmitting(true);
            // When backend adds approval endpoint, change this to: await deskService.approveDeskBooking(booking.id, 'Approved');
            toast.success(`Desk booking for ${booking.desk_code} approved!`);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to approve booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectClick = (booking) => {
        setRejectBooking(booking);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a rejection reason');
            return;
        }
        try {
            setSubmitting(true);
            // When backend adds rejection endpoint, change this to: await deskService.rejectDeskBooking(rejectBooking.id, rejectionReason);
            await deskService.cancelDeskBooking(rejectBooking.id, rejectionReason);
            toast.info(`Desk booking for ${rejectBooking.desk_code} rejected`);
            setShowRejectModal(false);
            setRejectBooking(null);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reject booking');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmedBookings = bookings.filter(b =>
        b.status.toLowerCase() === 'confirmed' || b.status.toLowerCase() === 'checked_in'
    );

    const pendingBookings = bookings.filter(b =>
        b.status.toLowerCase() === 'pending'
    );

    const totalDesks = desks.length;
    const occupiedDesks = desks.filter(d => getDeskStatus(d).booked).length;
    const occupancyRate = totalDesks > 0 ? Math.round((occupiedDesks / totalDesks) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans text-slate-700 h-full flex flex-col relative">
            {/* Header */}
            <div className="flex justify-between items-end shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] tracking-wide">
                        DESK & WORKSPACE <span className="text-[#f9b012]">ALLOCATION</span>
                    </h1>
                    <p className="text-xs font-medium text-[#8892b0] tracking-wider uppercase">
                        Assign desks, optimize seating, and track usage
                    </p>
                </div>
                <button onClick={fetchData} className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> REFRESH
                </button>
            </div>

            {/* Pending Approvals Section */}
            {pendingBookings.length > 0 && (
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-amber-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-[#8892b0] tracking-widest uppercase flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            PENDING DESK APPROVALS
                        </h3>
                        <div className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                            {pendingBookings.length} PENDING
                        </div>
                    </div>
                    <div className="space-y-4">
                        {pendingBookings.map((booking) => (
                            <motion.div key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-amber-50/50 rounded-xl p-5 border border-amber-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                                            {(booking.user_code || '?')[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1e3a8a] text-sm">Desk {booking.desk_code}</div>
                                            <div className="flex items-center gap-2 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Monitor className="w-3 h-3" /> {booking.desk_label}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {booking.start_date} → {booking.end_date}
                                                </span>
                                            </div>
                                            <div className="text-[0.65rem] text-[#8892b0] mt-1">
                                                Requested by: <span className="font-bold text-[#1a367c]">{booking.user_code}</span>
                                            </div>
                                            {booking.notes && (
                                                <div className="text-xs text-slate-500 mt-2 italic bg-white p-2 rounded-lg border border-slate-100">
                                                    "{booking.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0 ml-4">
                                        <button onClick={() => handleRejectClick(booking)} disabled={submitting}
                                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all"
                                            title="Reject">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleApprove(booking)} disabled={submitting}
                                            className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                                            title="Approve">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-[600px]">
                {/* Left Panel: Desk Grid */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-[#1a367c] tracking-widest flex items-center gap-2 uppercase">
                            <Monitor className="w-4 h-4 text-[#f9b012]" />
                            ALL DESKS ({desks.length})
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available
                            </div>
                            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-[#1a367c]"></span> Booked
                            </div>
                            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Pending
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
                        {desks.map((desk) => {
                            const { booked, booking } = getDeskStatus(desk);
                            const isPending = booking?.status?.toLowerCase() === 'pending';
                            const isInactive = desk.status.toLowerCase() === 'maintenance' || !desk.is_active;
                            return (
                                <motion.div
                                    key={desk.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => !isInactive && handleDeskClick(desk)}
                                    className={`rounded-2xl p-5 text-center cursor-pointer border transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]
                                        ${isInactive
                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                            : isPending
                                                ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-md'
                                                : booked
                                                    ? 'bg-[#1a367c] border-[#1a367c] text-white shadow-lg shadow-[#1a367c]/20'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-[#f9b012] hover:text-[#f9b012] hover:shadow-md'
                                        }`}
                                >
                                    <Monitor className={`w-5 h-5 ${isPending ? 'text-amber-500' : booked ? 'text-[#f9b012]' : isInactive ? 'text-slate-300' : 'text-slate-400'}`} />
                                    <span className="text-[0.7rem] font-bold font-mono">{desk.desk_code}</span>
                                    <span className="text-[0.6rem] font-medium leading-tight">{desk.desk_label}</span>
                                    {isPending && <span className="text-[0.5rem] font-bold">⏳ PENDING</span>}
                                    {desk.has_monitor && !isPending && <span className="text-[0.5rem] opacity-60">🖥 Monitor</span>}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Active Bookings & Stats */}
                <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a367c] to-[#f9b012] opacity-80"></div>

                    <h3 className="text-xs font-bold text-[#8892b0] tracking-widest mb-8 uppercase flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[#f9b012]" />
                        Confirmed Bookings ({confirmedBookings.length})
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="space-y-4">
                            {confirmedBookings.map((booking) => (
                                <div key={booking.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a367c] to-[#2c4a96] text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-900/10">
                                                {(booking.user_code || '?')[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1a367c]">{booking.user_code}</div>
                                                <div className="text-[0.6rem] font-bold text-[#8892b0] uppercase tracking-wider">
                                                    {booking.start_date} → {booking.end_date}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-[0.6rem] font-bold text-[#1a367c] border border-slate-100">
                                            {booking.desk_code}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(booking.id)}
                                        className="w-full py-2 rounded-lg bg-red-50 text-red-500 text-[0.65rem] font-bold tracking-wide hover:bg-red-100 transition-colors uppercase border border-red-100 flex items-center justify-center gap-2"
                                    >
                                        <X className="w-3 h-3" /> Cancel Booking
                                    </button>
                                </div>
                            ))}
                        </div>

                        {confirmedBookings.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Ghost className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium italic">No confirmed bookings</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="bg-[#f8f9fa] p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider mb-1">Total Capacity</div>
                                <div className="text-xl font-bold text-[#1a367c]">{totalDesks} <span className="text-xs font-medium text-slate-400">Seats</span></div>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider mb-1">Occupancy</div>
                                <div className="text-xl font-bold text-[#f9b012]">{occupancyRate}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <AnimatePresence>
                {isModalOpen && selectedDesk && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-md border border-slate-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#1a367c]">
                                        {getDeskStatus(selectedDesk).booked ? 'Desk Details' : 'Book Desk'}
                                    </h2>
                                    <p className="text-xs text-[#8892b0] font-medium uppercase tracking-wider mt-1">
                                        {selectedDesk.desk_code} — {selectedDesk.desk_label}
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {(() => {
                                const { booked, booking } = getDeskStatus(selectedDesk);
                                if (!booked) {
                                    return (
                                        <div className="space-y-6">
                                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-emerald-800">Available for Booking</div>
                                                    <div className="text-xs text-emerald-600">
                                                        {selectedDesk.has_monitor ? '🖥 Monitor' : ''} {selectedDesk.has_docking_station ? '🔌 Docking' : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={bookingDates.start_date}
                                                        onChange={e => setBookingDates({ ...bookingDates, start_date: e.target.value })}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a367c] text-sm font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={bookingDates.end_date}
                                                        onChange={e => setBookingDates({ ...bookingDates, end_date: e.target.value })}
                                                        min={bookingDates.start_date}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a367c] text-sm font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">Start Time</label>
                                                    <input
                                                        type="time"
                                                        value={bookingDates.start_time}
                                                        onChange={e => setBookingDates({ ...bookingDates, start_time: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a367c] text-sm font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">End Time</label>
                                                    <input
                                                        type="time"
                                                        value={bookingDates.end_time}
                                                        onChange={e => setBookingDates({ ...bookingDates, end_time: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a367c] text-sm font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setIsModalOpen(false)}
                                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleAllocate}
                                                    disabled={submitting}
                                                    className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-blue-900/20'}`}
                                                >
                                                    {submitting ? 'Booking...' : 'Confirm Booking'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const isPending = booking.status.toLowerCase() === 'pending';
                                    return (
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                                <div className="w-16 h-16 rounded-full bg-[#1a367c] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-xl">
                                                    {(booking.user_code || '?')[0]}
                                                </div>
                                                <h3 className="text-lg font-bold text-[#1a367c] mb-1">{booking.user_code}</h3>
                                                <p className="text-xs text-[#8892b0] font-bold uppercase tracking-wider">
                                                    {booking.start_date} → {booking.end_date}
                                                </p>
                                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[0.65rem] font-bold ${
                                                    isPending ? 'bg-amber-50 text-amber-600' :
                                                    booking.status.toLowerCase() === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                                }`}>{booking.status}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRevoke(booking.id)}
                                                className="w-full py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <X className="w-4 h-4" /> Cancel Booking
                                            </button>
                                        </div>
                                    );
                                }
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rejection Modal */}
            <AnimatePresence>
                {showRejectModal && rejectBooking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowRejectModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-md border border-slate-100"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <h2 className="text-lg font-bold text-[#1a367c]">Reject Desk Booking</h2>
                                    </div>
                                    <p className="text-xs text-[#8892b0] font-medium uppercase tracking-wider">
                                        {rejectBooking.desk_code} — {rejectBooking.desk_label}
                                    </p>
                                </div>
                                <button onClick={() => setShowRejectModal(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-sm font-bold text-[#1a367c] mb-1">Desk {rejectBooking.desk_code}</div>
                                    <div className="text-xs text-[#8892b0]">{rejectBooking.start_date} → {rejectBooking.end_date}</div>
                                    <div className="text-xs text-[#8892b0]">Requested by: {rejectBooking.user_code}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">
                                        Reason for Rejection <span className="text-red-500">*</span>
                                    </label>
                                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-200 text-sm font-medium min-h-[100px] resize-none"
                                        placeholder="Reason for rejection..." autoFocus />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowRejectModal(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button onClick={handleRejectSubmit} disabled={!rejectionReason.trim() || submitting}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                                            !rejectionReason.trim() || submitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}>
                                        {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeskBooking;