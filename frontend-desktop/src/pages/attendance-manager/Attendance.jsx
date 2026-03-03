
import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService } from '../../services/attendanceService';

const AttendanceValidation = () => {
    const [managerLogs, setManagerLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedAuditId, setSelectedAuditId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPending = useCallback(async () => {
        try {
            setLoading(true);
            const res = await attendanceService.getPendingApprovals({ page_size: 50 });
            setManagerLogs(res?.data ?? []);
        } catch (error) {
            console.error("Failed to fetch approvals", error);
            // toast.error('Failed to load pending approvals.'); // Optional: suppress on mount if annoying
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleManagerAction = async (id, action) => {
        if (action === 'reject') {
            setSelectedAuditId(id);
            setRejectionReason('');
            setShowRejectModal(true);
            return;
        }

        // Approve Logic
        try {
            setActionLoading(id);
            await attendanceService.approveAttendance(id, 'approve');
            toast.success("Attendance Verified Successfully");
            setManagerLogs(prev => prev.filter(log => log.id !== id));
        } catch (err) {
            toast.error("Failed to verify attendance");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please enter a rejection reason.");
            return;
        }

        try {
            setActionLoading(selectedAuditId);
            await attendanceService.approveAttendance(selectedAuditId, 'reject', '', rejectionReason);
            toast.info("Attendance Rejected");
            setManagerLogs(prev => prev.filter(log => log.id !== selectedAuditId));
            setShowRejectModal(false);
        } catch (err) {
            toast.error("Failed to reject attendance");
        } finally {
            setActionLoading(null);
            setSelectedAuditId(null);
            setRejectionReason('');
        }
    };

    // Helper functions for UI mapping
    const getUserInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
    const getRandomColor = (name) => {
        const colors = ['bg-[#1a4d8c]', 'bg-slate-800', 'bg-blue-600', 'bg-indigo-600'];
        let hash = 0;
        for (let i = 0; i < (name?.length || 0); i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        try {
            if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // For simple time strings "10:00:00", treat as UTC
            const [h, m] = timeStr.split(':');
            const date = new Date();
            date.setUTCHours(parseInt(h), parseInt(m)); // Use UTC hours
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return timeStr; }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Reject Validation
                            </h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this attendance validation.
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
                                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                    MANAGER ATTENDANCE <span className="text-[#FFB012]">VALIDATION</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Verify Team Attendance & Approve Requests
                </p>
            </div>

            <div className="flex flex-col gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#FFB012]" />
                            DAILY ATTENDANCE VALIDATION
                        </h3>
                        {/* <span className="text-xs font-bold text-[#8892b0] bg-slate-100 px-3 py-1 rounded-full">Today</span> */}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[300px]">
                        <div className="flex justify-between items-center mb-6">
                            <div className="font-bold text-[#1e3a8a]">Manager Audit Queue</div>
                            <div className="text-xs font-bold text-[#FFB012] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                {loading ? '...' : `${managerLogs.length} PENDING REVIEWS`}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                            </div>
                        ) : managerLogs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 font-medium italic">
                                No pending attendance validations found.
                            </div>
                        ) : (
                            managerLogs.map((item) => {
                                const name = item.user?.full_name || item.user_name || item.user_code;
                                const isLate = false; // You can add logic here if backend provides 'is_late'
                                return (
                                    <div key={item.id} className={`flex items-center p-4 rounded-xl border mb-4 transition-all hover:shadow-md border-slate-100 bg-white`}>
                                        <div className={`w-10 h-10 ${getRandomColor(name)} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md mr-4 shrink-0`}>
                                            {getUserInitial(name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-[#1e3a8a] text-sm">{name}</div>
                                            <div className="text-[0.65rem] text-[#8892b0] font-bold tracking-wide mt-0.5 flex items-center gap-2">
                                                {item.user?.role || item.user_code}
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <Clock className="w-3 h-3" /> {formatTime(item.first_check_in)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.65rem] font-bold tracking-wide bg-amber-50 text-amber-600 border border-amber-100">
                                                <AlertTriangle className="w-3 h-3" />
                                                PENDING
                                            </span>

                                            <div className="flex gap-2 mt-1">
                                                <button
                                                    onClick={() => handleManagerAction(item.id, 'reject')}
                                                    disabled={actionLoading === item.id}
                                                    className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all disabled:opacity-50">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleManagerAction(item.id, 'approve')}
                                                    disabled={actionLoading === item.id}
                                                    className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all disabled:opacity-50">
                                                    {actionLoading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceValidation;
