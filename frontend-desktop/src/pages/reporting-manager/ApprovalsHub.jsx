
import React, { useState, useEffect, useCallback } from 'react';
import {
    FileText,
    CheckCircle,
    XCircle,
    Calendar,
    X,
    AlertCircle,
    Loader2,
    User
} from 'lucide-react';
import { toast } from 'react-toastify';
import { leaveService } from '../../services/leaveService';

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

const ApprovalsHub = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPending = useCallback(async () => {
        try {
            setLoading(true);
            const res = await leaveService.getPendingLeaves({ page_size: 50 });
            setLeaveRequests(res?.data ?? []);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
            toast.error('Failed to load leave requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    // --- Leave Handlers ---
    const handleLeaveApprove = async (id) => {
        try {
            setActionLoading(id);
            await leaveService.approveLeave(id, 'approve');
            setLeaveRequests(prev => prev.filter(r => r.id !== id));
            toast.success('Leave Request Approved');
        } catch {
            toast.error('Failed to approve leave request.');
        } finally {
            setActionLoading(null);
        }
    };

    // --- General Rejection Logic ---
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
            await leaveService.approveLeave(selectedId, 'reject', '', rejectionReason);
            setLeaveRequests(prev => prev.filter(r => r.id !== selectedId));
            setShowRejectModal(false);
            toast.info('Leave Request Rejected');
        } catch {
            toast.error('Failed to reject leave request.');
        } finally {
            setActionLoading(null);
            setSelectedId(null);
        }
    };

    const formatDateRange = (start, end) => {
        if (!start) return '—';
        const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${s} – ${e}`;
    };

    // Helper to extract user name safely
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
                                Reject Leave Request
                            </h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this leave request.
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
                    APPROVALS <span className="text-[#FFB012]">HUB</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Manage Team Approvals
                </p>
            </div>

            {/* LEAVE REQUESTS SECTION */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FFB012]" />
                        LEAVE REQUESTS
                    </h3>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="font-bold text-[#1e3a8a]">Pending Leave Requests</div>
                        <div className="text-xs font-bold text-[#FFB012] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            {loading ? '...' : `${leaveRequests.length} PENDING`}
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-300">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : leaveRequests.length > 0 ? (
                        leaveRequests.map((leave) => {
                            const fullName = getUserName(leave);
                            const initial = fullName.charAt(0).toUpperCase();
                            const avatarColor = getAvatarColor(fullName);
                            const isActing = actionLoading === leave.id;
                            return (
                                <div key={leave.id} className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 ${avatarColor} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0`}>
                                                {initial}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[#1e3a8a] text-sm">{fullName}</div>
                                                <div className="flex items-center gap-3 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase flex-wrap">
                                                    <span>{leave.user_code}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-amber-500">{leave.leave_type_name || leave.leave_type}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                <div className="text-[0.65rem] text-[#8892b0] mt-1">
                                                    {formatDateRange(leave.start_date, leave.end_date)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button
                                                onClick={() => handleRejectOpen(leave.id)}
                                                disabled={isActing}
                                                className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-40"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleLeaveApprove(leave.id)}
                                                disabled={isActing}
                                                className="w-9 h-9 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all disabled:opacity-40"
                                            >
                                                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    {leave.reason && (
                                        <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 italic">
                                            "{leave.reason}"
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <User className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium italic">No pending leave requests.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApprovalsHub;
