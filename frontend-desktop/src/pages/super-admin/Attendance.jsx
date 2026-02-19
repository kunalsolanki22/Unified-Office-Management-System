
import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Loader2,
    AlertCircle,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService } from '../../services/attendanceService';

const AVATAR_COLORS = [
    'bg-blue-600', 'bg-indigo-600', 'bg-purple-600',
    'bg-green-600', 'bg-pink-600', 'bg-orange-600',
    'bg-teal-600', 'bg-rose-600'
];

const getAvatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const AttendanceValidation = () => {
    const [attendanceRequests, setAttendanceRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPending = useCallback(async () => {
        try {
            setLoading(true);
            const res = await attendanceService.getPendingApprovals({ page_size: 50 });
            setAttendanceRequests(res?.data ?? []);
        } catch (error) {
            console.error("Failed to fetch attendance approvals", error);
            toast.error('Failed to load attendance requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    // --- Actions ---
    const handleApprove = async (id) => {
        try {
            setActionLoading(id);
            await attendanceService.approveAttendance(id, 'approve');
            setAttendanceRequests(prev => prev.filter(r => r.id !== id));
            toast.success('Attendance Approved');
        } catch {
            toast.error('Failed to approve attendance.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectOpen = (id) => {
        setSelectedId(id);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please enter a rejection reason.');
            return;
        }

        try {
            setActionLoading(selectedId);
            await attendanceService.approveAttendance(selectedId, 'reject', '', rejectionReason);
            setAttendanceRequests(prev => prev.filter(r => r.id !== selectedId));
            setShowRejectModal(false);
            toast.info('Attendance Rejected');
        } catch {
            toast.error('Failed to reject attendance.');
        } finally {
            setActionLoading(null);
            setSelectedId(null);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        try {
            // If it's a full ISO string, parse appropriately, otherwise assume HH:MM:SS (UTC)
            if (timeStr.includes('T')) {
                return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            // For simple time strings "10:00:00", treat as UTC
            const [h, m] = timeStr.split(':');
            const date = new Date();
            date.setUTCHours(parseInt(h), parseInt(m)); // Use UTC hours
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return timeStr; }
    };

    // Helper to get name
    const getUserName = (request) => {
        return request.user?.full_name || request.user_name || request.user_code || 'Unknown User';
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Reject Attendance
                            </h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this attendance record.
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 text-sm font-medium text-[#1e3a8a] placeholder:text-slate-400 resize-none mb-6"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!!actionLoading}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-60"
                            >
                                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                    ATTENDANCE <span className="text-[#FFB012]">VALIDATION</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Validate Team Attendance
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="font-bold text-[#1e3a8a]">Pending Validations</div>
                    <div className="text-xs font-bold text-[#FFB012] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                        {loading ? '...' : `${attendanceRequests.length} PENDING`}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-slate-300">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : attendanceRequests.length > 0 ? (
                    attendanceRequests.map((req) => {
                        const fullName = getUserName(req);
                        const initial = fullName.charAt(0).toUpperCase();
                        const avatarColor = getAvatarColor(fullName);
                        const isActing = actionLoading === req.id;
                        return (
                            <div key={req.id} className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-10 h-10 ${avatarColor} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0`}>
                                            {initial}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1e3a8a] text-sm">{fullName}</div>
                                            <div className="flex items-center gap-3 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase">
                                                <span>{req.user_code}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(req.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="hidden md:flex gap-8">
                                        <div>
                                            <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wide mb-1">Check In</div>
                                            <div className="font-mono text-sm font-bold text-green-600">{formatTime(req.first_check_in)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wide mb-1">Check Out</div>
                                            <div className="font-mono text-sm font-bold text-orange-500">{formatTime(req.last_check_out)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wide mb-1">Total Hours</div>
                                            <div className="font-mono text-sm font-bold text-[#1e3a8a] flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {req.total_hours}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0 ml-4">
                                        <button
                                            onClick={() => handleRejectOpen(req.id)}
                                            disabled={isActing}
                                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-40"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req.id)}
                                            disabled={isActing}
                                            className="w-9 h-9 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all disabled:opacity-40"
                                        >
                                            {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <User className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium italic">No pending attendance validations.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceValidation;
