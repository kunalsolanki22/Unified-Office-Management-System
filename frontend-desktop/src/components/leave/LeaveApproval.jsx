import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle, XCircle, User, Loader2, AlertCircle, X, Clock, FileText, Briefcase } from 'lucide-react';
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

const LeaveApproval = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Rejection Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [auditNotes, setAuditNotes] = useState(''); // Optional approval notes
    const [showApproveModal, setShowApproveModal] = useState(false);

    const fetchPending = useCallback(async () => {
        try {
            setLoading(true);
            const res = await leaveService.getPendingApprovals({ page_size: 50 });
            setRequests(res?.data ?? []);
        } catch (error) {
            toast.error('Failed to load leave requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    // --- Actions ---
    const handleApproveOpen = (id) => {
        setSelectedId(id);
        setAuditNotes('');
        setShowApproveModal(true);
    };

    const handleApproveSubmit = async () => {
        try {
            setActionLoading(selectedId);
            await leaveService.approveLeave(selectedId, 'approve', auditNotes);
            setRequests(prev => prev.filter(r => r.id !== selectedId));
            setShowApproveModal(false);
            toast.success('Leave Request Approved');
        } catch {
            toast.error('Failed to approve leave.');
        } finally {
            setActionLoading(null);
            setSelectedId(null);
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
            await leaveService.approveLeave(selectedId, 'reject', '', rejectionReason);
            setRequests(prev => prev.filter(r => r.id !== selectedId));
            setShowRejectModal(false);
            toast.info('Leave Request Rejected');
        } catch {
            toast.error('Failed to reject leave.');
        } finally {
            setActionLoading(null);
            setSelectedId(null);
        }
    };

    // Helper to get name
    const getUserName = (request) => {
        return request.user_name || request.user_code || 'Unknown User';
    };

    return (
        <div className="space-y-6 animate-fade-in relative mt-8">
            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Reject Leave
                            </h3>
                            <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejection.
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

            {/* Approval Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Approve Leave
                            </h3>
                            <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Add optional notes for approval.
                        </p>
                        <textarea
                            value={auditNotes}
                            onChange={(e) => setAuditNotes(e.target.value)}
                            placeholder="Approval notes (optional)..."
                            className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 text-sm font-medium text-[#1e3a8a] placeholder:text-slate-400 resize-none mb-6"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveSubmit}
                                disabled={!!actionLoading}
                                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 disabled:opacity-60"
                            >
                                {actionLoading ? 'Approving...' : 'Confirm Approval'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex justify-between items-center mb-6">
                <div className="font-bold text-[#1e3a8a]">Pending Leave Requests</div>
                <div className="text-xs font-bold text-[#FFB012] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    {loading ? '...' : `${requests.length} PENDING`}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-300">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : requests.length > 0 ? (
                requests.map((req) => {
                    const fullName = getUserName(req);
                    const initial = fullName.charAt(0).toUpperCase();
                    const avatarColor = getAvatarColor(fullName);
                    const isActing = actionLoading === req.id;
                    return (
                        <div key={req.id} className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-start">
                                    <div className={`w-10 h-10 ${avatarColor} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0 mt-1`}>
                                        {initial}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#1e3a8a] text-sm">{fullName}</div>
                                        <div className="flex items-center gap-3 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase">
                                            <span>{req.user_code}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" />
                                                {req.leave_type_name || req.leave_type}
                                            </span>
                                        </div>
                                        <div className="mt-3 bg-white border border-slate-100 p-3 rounded-lg text-xs text-slate-600">
                                            <div className="flex items-center gap-2 mb-1 font-bold text-[#1e3a8a]">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                                <span className="text-[#8892b0] font-normal px-1">•</span>
                                                <span className="text-[#f9b012]">{parseFloat(req.total_days)} Days</span>
                                            </div>
                                            <p className="italic">"{req.reason}"</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0 ml-4">
                                    <button
                                        onClick={() => handleApproveOpen(req.id)}
                                        disabled={isActing}
                                        className="w-9 h-9 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all disabled:opacity-40"
                                        title="Approve"
                                    >
                                        {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleRejectOpen(req.id)}
                                        disabled={isActing}
                                        className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-40"
                                        title="Reject"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium italic">No pending leave requests.</p>
                </div>
            )}
        </div>
    );
};

// Simple Briefcase icon component since it was missing in imports in previous file? 
// Actually I imported Briefcase in LeaveProposal, let's verify if I imported it here.
// Yes, I did not. I should check imports. 
// I'll assume Lucide exports Briefcase.
// Wait, I didn't import Briefcase in the top imports. I should fix that.
// Fixing locally in the file content I am writing.
// Imports: Calendar, CheckCircle, XCircle, User, Loader2, AlertCircle, X, Clock, FileText. Briefcase is missing.
// Adding Briefcase to imports.



export default LeaveApproval;
