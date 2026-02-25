import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Projector, Users, X, AlertTriangle, MessageSquare, RefreshCw, Ghost, Plus, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { deskService } from '../../services/deskService';

const ConferenceBooking = () => {
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
    const [releaseReason, setReleaseReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Rejection modal for approvals
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectBooking, setRejectBooking] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // New booking form
    const [showBookForm, setShowBookForm] = useState(false);
    const [newBooking, setNewBooking] = useState({
        room_id: '', booking_date: '', start_time: '', end_time: '',
        title: '', description: '', attendees_count: 1
    });

    const fetchData = async () => {
        try {
            setLoading(true);

            const roomsRes = await deskService.getRooms({ page_size: 100 });
            console.log('Rooms response:', roomsRes);
            setRooms(roomsRes.data || []);

            const bookingsRes = await deskService.getRoomBookings({ page_size: 100 });
            console.log('Room bookings response:', bookingsRes);
            setBookings(bookingsRes.data || []);
        } catch (err) {
            console.error('Failed to load conference data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Clock tick to force re-render for time-based room status checks
    const [, setClockTick] = useState(0);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 15000);
        const ticker = setInterval(() => setClockTick(t => t + 1), 30000);
        return () => { clearInterval(interval); clearInterval(ticker); };
    }, []);

    const getRoomStatus = (room) => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const activeBooking = bookings.find(b => {
            if (b.room_id !== room.id) return false;
            const status = (b.status || '').toLowerCase();
            if (status !== 'confirmed' && status !== 'pending') return false;
            // Filter out past-date bookings
            if (b.booking_date && b.booking_date < todayStr) return false;
            // Filter out expired bookings for today
            if (b.booking_date === todayStr && b.end_time && b.end_time <= currentTime) return false;
            return true;
        });
        return activeBooking ? 'Booked' : 'Available';
    };

    const handleReleaseClick = (booking) => {
        setSelectedBooking(booking);
        setReleaseReason('');
        setIsReleaseModalOpen(true);
    };

    const confirmRelease = async () => {
        if (!releaseReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }
        try {
            setSubmitting(true);
            await deskService.cancelRoomBooking(selectedBooking.id, releaseReason);
            toast.success('Booking released successfully');
            setIsReleaseModalOpen(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to release booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateBooking = async () => {
        const { room_id, booking_date, start_time, end_time, title, description, attendees_count } = newBooking;

        if (!room_id || !booking_date || !start_time || !end_time || !title) {
            toast.error('Please fill all required fields');
            return;
        }

        const now = new Date();
        const start = new Date(`${booking_date}T${start_time}`);
        const end = new Date(`${booking_date}T${end_time}`);

        // 1. Future Date Check
        if (start < now) {
            toast.error('Start time must be in the future');
            return;
        }

        // 2. Time Order Check
        if (start >= end) {
            toast.error('End time must be after start time');
            return;
        }

        // 3. Capacity Check
        const selectedRoom = rooms.find(r => r.id === room_id);
        if (selectedRoom && parseInt(attendees_count) > selectedRoom.capacity) {
            toast.error(`Attendees count exceeds room capacity (${selectedRoom.capacity})`);
            return;
        }

        try {
            setSubmitting(true);
            await deskService.createRoomBooking({
                room_id,
                booking_date,
                start_time,
                end_time,
                title,
                description: description || '',
                attendees_count: parseInt(attendees_count) || 1,
            });
            toast.success('Room booking created!');
            setShowBookForm(false);
            setNewBooking({ room_id: '', booking_date: '', start_time: '', end_time: '', title: '', description: '', attendees_count: 1 });
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    // Approval handlers
    const handleApprove = async (booking) => {
        try {
            setSubmitting(true);
            await deskService.approveRoomBooking(booking.id, 'Approved by manager');
            toast.success(`"${booking.title}" approved!`);
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
            await deskService.rejectRoomBooking(rejectBooking.id, rejectionReason);
            toast.info(`"${rejectBooking.title}" rejected`);
            setShowRejectModal(false);
            setRejectBooking(null);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reject booking');
        } finally {
            setSubmitting(false);
        }
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isBookingActive = (b) => {
        if (b.booking_date && b.booking_date < todayStr) return false;
        if (b.booking_date === todayStr && b.end_time && b.end_time <= currentTime) return false;
        return true;
    };

    const activeBookings = bookings.filter(b =>
        b.status.toLowerCase() === 'confirmed' && isBookingActive(b)
    );

    const pendingBookings = bookings.filter(b =>
        b.status.toLowerCase() === 'pending' && isBookingActive(b)
    );

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
                        CONFERENCE & MEETING <span className="text-[#f9b012]">ROOMS</span>
                    </h1>
                    <p className="text-xs font-medium text-[#8892b0] tracking-wider uppercase">
                        Monitor Room Status and Manage Bookings
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchData} className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> REFRESH
                    </button>
                    <button onClick={() => setShowBookForm(!showBookForm)} className="bg-[#1a367c] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> BOOK ROOM
                    </button>
                </div>
            </div>

            {/* New Booking Form */}
            <AnimatePresence>
                {showBookForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">BOOK A CONFERENCE ROOM</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">ROOM</label>
                                <select
                                    value={newBooking.room_id}
                                    onChange={e => setNewBooking({ ...newBooking, room_id: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                >
                                    <option value="">Select room</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>{r.room_label} ({r.room_code}) — Cap: {r.capacity}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">DATE</label>
                                <input type="date" value={newBooking.booking_date}
                                    onChange={e => setNewBooking({ ...newBooking, booking_date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">START TIME</label>
                                <input type="time" value={newBooking.start_time}
                                    onChange={e => setNewBooking({ ...newBooking, start_time: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">END TIME</label>
                                <input type="time" value={newBooking.end_time}
                                    onChange={e => setNewBooking({ ...newBooking, end_time: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">TITLE *</label>
                                <input type="text" value={newBooking.title} placeholder="e.g. Sprint Planning"
                                    onChange={e => setNewBooking({ ...newBooking, title: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">ATTENDEES</label>
                                <input type="number" value={newBooking.attendees_count} min="1"
                                    onChange={e => setNewBooking({ ...newBooking, attendees_count: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">DESCRIPTION</label>
                                <input type="text" value={newBooking.description} placeholder="Optional"
                                    onChange={e => setNewBooking({ ...newBooking, description: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowBookForm(false)} className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">CANCEL</button>
                            <button onClick={handleCreateBooking} disabled={submitting}
                                className={`px-6 py-3 rounded-xl text-white text-xs font-bold transition-colors shadow-lg ${submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1a367c] hover:bg-[#2c4a96]'}`}>
                                {submitting ? 'BOOKING...' : '+ BOOK ROOM'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pending Approvals Section */}
            {pendingBookings.length > 0 && (
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-amber-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold text-[#8892b0] tracking-widest uppercase flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            PENDING APPROVALS
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
                                            <div className="font-bold text-[#1e3a8a] text-sm">{booking.title}</div>
                                            <div className="flex items-center gap-2 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Projector className="w-3 h-3" /> {booking.room_code} — {booking.room_label}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {booking.booking_date}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {booking.start_time} — {booking.end_time}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {booking.attendees_count} attendees
                                                </span>
                                            </div>
                                            <div className="text-[0.65rem] text-[#8892b0] mt-1">
                                                Requested by: <span className="font-bold text-[#1a367c]">{booking.user_code}</span>
                                            </div>
                                            {booking.description && (
                                                <div className="text-xs text-slate-500 mt-2 italic bg-white p-2 rounded-lg border border-slate-100">
                                                    "{booking.description}"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left: Room Status */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-[#8892b0] tracking-widest uppercase flex items-center gap-2">
                        <Projector className="w-4 h-4 text-[#1a367c]" />
                        Room Status ({rooms.length} Rooms)
                    </h3>
                    <div className="space-y-4">
                        {rooms.map((room) => {
                            const status = getRoomStatus(room);
                            const amenities = [];
                            if (room.has_projector) amenities.push('Projector');
                            if (room.has_whiteboard) amenities.push('Whiteboard');
                            if (room.has_video_conferencing) amenities.push('Video Conf');
                            return (
                                <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all pl-6">
                                    <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-lg ${status === 'Available' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h2 className="text-lg font-bold text-[#1a367c]">{room.room_label}</h2>
                                            <div className="text-xs text-[#8892b0] mt-1 flex items-center gap-2">
                                                <span>{room.room_code}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>Capacity: {room.capacity}</span>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 text-[0.65rem] font-bold rounded-lg uppercase tracking-wider border
                                            ${status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                            {status}
                                        </span>
                                    </div>
                                    {amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {amenities.map(item => (
                                                <span key={item} className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{item}</span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                        {rooms.length === 0 && (
                            <div className="text-center py-12 text-[#8892b0] text-sm">No conference rooms found</div>
                        )}
                    </div>
                </div>

                {/* Right: Confirmed Bookings */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 min-h-[500px]">
                    <h3 className="text-xs font-bold text-[#8892b0] tracking-widest uppercase flex items-center gap-2 mb-8">
                        <Users className="w-4 h-4 text-[#f9b012]" />
                        Confirmed Bookings ({activeBookings.length})
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50">
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Room</th>
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Title</th>
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Date & Time</th>
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeBookings.map((booking) => (
                                    <motion.tr key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 font-bold text-[#1a367c] text-sm">{booking.room_code}</td>
                                        <td className="py-5 text-sm text-slate-700">{booking.title}</td>
                                        <td className="py-5 text-xs text-slate-500">
                                            <div>{booking.booking_date}</div>
                                            <div className="text-[0.65rem]">{booking.start_time} — {booking.end_time}</div>
                                        </td>
                                        <td className="py-5 text-right">
                                            <button onClick={() => handleReleaseClick(booking)}
                                                className="px-4 py-2 rounded-lg bg-red-50 text-red-500 text-[0.65rem] font-bold uppercase tracking-wide hover:bg-red-100 transition-all border border-red-100">
                                                RELEASE
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                                {activeBookings.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center">
                                            <Ghost className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                            <p className="text-slate-400 text-xs italic">No confirmed room bookings</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Release Modal */}
            <AnimatePresence>
                {isReleaseModalOpen && selectedBooking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsReleaseModalOpen(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-md border border-slate-100"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <h2 className="text-lg font-bold text-[#1a367c]">Release Booking</h2>
                                    </div>
                                    <p className="text-xs text-[#8892b0] font-medium uppercase tracking-wider">
                                        {selectedBooking.room_code} — {selectedBooking.title}
                                    </p>
                                </div>
                                <button onClick={() => setIsReleaseModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-red-700 font-medium">
                                    You are about to cancel this booking. This action cannot be undone.
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">
                                        Reason for Cancellation <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <textarea value={releaseReason} onChange={e => setReleaseReason(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-200 text-sm font-medium min-h-[100px] resize-none"
                                            placeholder="e.g. Urgent maintenance required..." autoFocus />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsReleaseModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Back</button>
                                    <button onClick={confirmRelease} disabled={!releaseReason.trim() || submitting}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${!releaseReason.trim() || submitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}>
                                        {submitting ? 'Releasing...' : 'Confirm Release'}
                                    </button>
                                </div>
                            </div>
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
                                        <h2 className="text-lg font-bold text-[#1a367c]">Reject Booking</h2>
                                    </div>
                                    <p className="text-xs text-[#8892b0] font-medium uppercase tracking-wider">
                                        {rejectBooking.room_code} — {rejectBooking.title}
                                    </p>
                                </div>
                                <button onClick={() => setShowRejectModal(false)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-sm font-bold text-[#1a367c] mb-1">{rejectBooking.title}</div>
                                    <div className="text-xs text-[#8892b0]">{rejectBooking.booking_date} • {rejectBooking.start_time} — {rejectBooking.end_time}</div>
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
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${!rejectionReason.trim() || submitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}>
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

export default ConferenceBooking;