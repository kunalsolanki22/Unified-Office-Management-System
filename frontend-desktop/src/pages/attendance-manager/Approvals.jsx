import React, { useState } from 'react';
import {
    FileText,
    CheckCircle,
    XCircle,
    Calendar,
    Check,
    X,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const ApprovalsHub = () => {
    const [leaveRequests, setLeaveRequests] = useState([
        { id: 1, name: 'Elena Vance', type: 'SECURITY • EMERGENCY • 2 DAYS', reason: 'Critical Family Matter. Operational redundancy confirmed via Node Cluster B.', color: 'text-red-500', initial: 'E', initialBg: 'bg-purple-600', role: 'Security' },
        { id: 2, name: 'David Chen', type: 'INFRASTRUCTURE • ANNUAL LEAVE • 5 DAYS', reason: 'Project Transition Break. Operational redundancy confirmed via Node Cluster B.', color: 'text-amber-500', initial: 'D', initialBg: 'bg-indigo-600', role: 'Infrastructure' },
    ]);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]); // Can be single or multiple
    const [rejectionReason, setRejectionReason] = useState('');

    const handleLeaveAction = (id, action) => {
        if (action === 'reject') {
            setSelectedIds([id]);
            setShowRejectModal(true);
            setRejectionReason('');
            return;
        }

        // Approve Logic
        setLeaveRequests(prev => prev.filter(req => req.id !== id));
        toast.success("Leave Request Approved");
    };

    const handleRejectSubmit = () => {
        if (!rejectionReason.trim()) {
            toast.error("Please enter a rejection reason.");
            return;
        }

        setLeaveRequests(prev => prev.filter(req => !selectedIds.includes(req.id)));
        setShowRejectModal(false);
        toast.info("Leave Request Rejected");
        setSelectedIds([]);
        setRejectionReason('');
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Reject Request
                            </h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this leave request. This will be communicated to the employee.
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
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Confirm Rejection
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
                    Manage Pending Requests & Allocations
                </p>
            </div>

            <div className="flex flex-col gap-8">
                <div>
                    <h3 className="text-lg font-bold text-[#1e3a8a] mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FFB012]" />
                        LEAVE REQUEST MANAGEMENT
                    </h3>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="font-bold text-[#1e3a8a]">Pending Leave Requests</div>
                            <div className="text-xs font-bold text-[#FFB012] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">{leaveRequests.length} PENDING</div>
                        </div>

                        {leaveRequests.length > 0 ? (
                            leaveRequests.map((leave) => (
                                <div key={leave.id} className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 ${leave.initialBg} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md`}>{leave.initial}</div>
                                            <div>
                                                <div className="font-bold text-[#1e3a8a] text-sm">{leave.name}</div>
                                                <div className="flex items-center gap-3 mt-1 text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase">
                                                    <span>{leave.role}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className={leave.color}>{leave.type.split('•')[1]}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {leave.type.split('•')[2]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'reject')}
                                                className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleLeaveAction(leave.id, 'approve')}
                                                className="w-9 h-9 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all">
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200 italic">
                                        "{leave.reason}"
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-xs font-medium italic">
                                No pending leave requests.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalsHub;
