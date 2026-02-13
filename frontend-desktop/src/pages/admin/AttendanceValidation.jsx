import React, { useState } from 'react';
import {
    ShieldCheck,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const AttendanceValidation = () => {
    const [managerLogs, setManagerLogs] = useState([
        { id: 1, name: 'James Carter', role: 'PARKING LEAD', time: '09:24 AM', status: 'FLAGGED', note: 'LATE CLOCK-IN', color: 'bg-red-50 text-red-500', initial: 'J', initialBg: 'bg-[#1a4d8c]', isLate: true },
        { id: 2, name: 'Priya Verma', role: 'DESK ADMIN', time: '08:58 AM', status: 'VERIFIED', note: 'ON-TIME ENTRY', color: 'bg-green-50 text-green-600', initial: 'P', initialBg: 'bg-slate-800', isLate: false },
    ]);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedAuditId, setSelectedAuditId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleManagerAction = (id, action) => {
        if (action === 'reject') {
            setSelectedAuditId(id);
            setShowRejectModal(true);
            setRejectionReason('');
            return;
        }

        // Approve Logic
        setManagerLogs(prev => prev.map(log => {
            if (log.id === id) {
                return {
                    ...log,
                    status: 'VERIFIED',
                    color: 'bg-green-50 text-green-600',
                    isLate: false,
                    note: 'VERIFIED'
                };
            }
            return log;
        }));
        toast.success("Manager Log Verified");
    };

    const handleRejectSubmit = () => {
        if (!rejectionReason.trim()) {
            toast.error("Please enter a rejection reason.");
            return;
        }

        setManagerLogs(prev => prev.map(log => {
            if (log.id === selectedAuditId) {
                return {
                    ...log,
                    status: 'REJECTED',
                    color: 'bg-red-50 text-red-600',
                    isLate: false,
                    note: 'REJECTED'
                };
            }
            return log;
        }));

        setShowRejectModal(false);
        toast.info("Manager Log Rejected");
        setSelectedAuditId(null);
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
                    MANAGER ATTENDANCE <span className="text-[#FFB012]">VALIDATION</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Verify Domain Leads & Approve Leave Requests
                </p>
            </div>

            <div className="flex flex-col gap-8">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#1e3a8a] flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[#FFB012]" />
                            DAILY ATTENDANCE VALIDATION
                        </h3>
                        <span className="text-xs font-bold text-[#8892b0] bg-slate-100 px-3 py-1 rounded-full">Feb 13, 2026</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="font-bold text-[#1e3a8a]">Manager Audit Queue</div>
                            <div className="text-xs font-bold text-[#FFB012]">{managerLogs.filter(l => l.status === 'FLAGGED').length} PENDING REVIEWS</div>
                        </div>

                        {managerLogs.map((item) => (
                            <div key={item.id} className={`flex items-center p-4 rounded-xl border mb-4 transition-all hover:shadow-md ${item.isLate ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-white'}`}>
                                <div className={`w-10 h-10 ${item.initialBg} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md mr-4 shrink-0`}>
                                    {item.initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[#1e3a8a] text-sm">{item.name}</div>
                                    <div className="text-[0.65rem] text-[#8892b0] font-bold tracking-wide mt-0.5 flex items-center gap-2">
                                        {item.role}
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <Clock className="w-3 h-3" /> {item.time}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    {item.isLate ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.65rem] font-bold tracking-wide bg-red-100 text-red-600 border border-red-200">
                                            <AlertTriangle className="w-3 h-3" />
                                            {item.note}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.65rem] font-bold tracking-wide bg-green-100 text-green-600 border border-green-200">
                                            <CheckCircle className="w-3 h-3" />
                                            {item.status}
                                        </span>
                                    )}

                                    {item.isLate && (
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => handleManagerAction(item.id, 'reject')}
                                                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all">
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleManagerAction(item.id, 'approve')}
                                                className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all">
                                                <CheckCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                    {!item.isLate && (
                                        <span className="text-[0.65rem] text-slate-400 font-medium">Auto-verified by System</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceValidation;
