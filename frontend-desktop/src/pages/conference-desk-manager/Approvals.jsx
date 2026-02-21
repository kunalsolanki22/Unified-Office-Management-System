import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, X, AlertCircle, Projector, RefreshCw, Ghost, Calendar, Clock, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { deskService } from '../../services/deskService';

const Approvals = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchPending = async () => {
        try {
            setLoading(true);
            const res = await deskService.getPendingRoomBookings({ page_size: 100 });
            console.log('Pending bookings response:', res);
            setPendingBookings(res.data || []);
        } catch (err) {
            console.error('Failed to load pending bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const handleApprove = async (booking) => {
        try {
            setSubmitting(true);
            await deskService.approveRoomBooking(booking.id, 'Approved by manager');
            toast.success(`Booking "${booking.title}" approved!`);
            await fetchPending();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to approve booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectClick = (booking) => {
        setSelectedBooking(booking);
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
            await deskService.rejectRoomBooking(selectedBooking.id, rejectionReason);
            toast.info(`Booking "${selectedBooking.title}" rejected`);
            setShowRejectModal(false);
            setSelectedBooking(null);
            await fetchPending();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reject booking');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[#8892b0] font-medium">Loading approvals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Rejection Modal */}
            {showRejectModal && selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Reject Booking
                            </h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                            <div className="text-sm font-bold text-[#1a367c] mb-1">{selectedBooking.title}</div>
                            <div className="text-xs text-[#8892b0]">
                                {selectedBooking.room_code} — {selectedBooking.room_label} • {selectedBooking.booking_date}
                            </div>
                            <div className="text-xs text-[#8892b0]">
                                {selectedBooking.start_time} — {selectedBooking.end_time} • {selectedBooking.user_code}
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this booking request.
                        </p>

                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 text-sm font-medium text-[#1e3a8a] placeholder:text-slate-400 resize-none mb-6"
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleRejectSubmit} disabled={submitting}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg ${submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}>
                                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                        APPROVALS <span className="text-[#FFB012]">HUB</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                        Manage Pending Conference Room Booking Requests
                    </p>
                </div>
                <button onClick={fetchPending} className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> REFRESH
                </button>
            </div>

            {/* Pending Bookings */}
            <div>
                <h3 className="text-lg font-bold text-[#1e3a8a] mb-4 flex items-center gap-2">
                    <Projector className="w-5 h-5 text-[#FFB012]" />
                    CONFERENCE ROOM BOOKINGS
                </h3>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="font-bold text-[#1e3a8a]">Pending Booking Requests</div>
                        <div className="text-xs font-bold text-[#FFB012] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            {pendingBookings.length} PENDING
                        </div>
                    </div>

                    {pendingBookings.length > 0 ? (
                        pendingBookings.map((booking) => (
                            <motion.div key={booking.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                                            {(booking.user_code || '?')[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1e3a8a] text-sm">{booking.title}</div>
                                            <div className="flex items-center gap-3 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase flex-wrap">
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
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleRejectClick(booking)} disabled={submitting}
                                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleApprove(booking)} disabled={submitting}
                                            className="w-9 h-9 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all">
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {booking.description && (
                                    <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 italic">
                                        "{booking.description}"
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Ghost className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No pending booking requests</p>
                            <p className="text-xs mt-1">All conference room requests have been processed</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Approvals;