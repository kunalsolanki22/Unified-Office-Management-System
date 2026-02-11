import { motion } from 'framer-motion';
import { CheckCircle, FileText, Check, X, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

const Approvals = () => {
    const handleAction = (action, item) => {
        if (action === 'approve') toast.success(`${item} Approved`);
        else toast.error(`${item} Rejected`);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#1a367c] flex items-center gap-2">
                    APPROVALS <span className="text-[#f9b012]">HUB</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium mt-1 uppercase tracking-wide">
                    Manage Pending Requests & Allocations
                </p>
            </div>

            <div className="space-y-10">
                {/* Leave Requests */}
                <div>
                    <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest mb-6 flex items-center gap-2.5">
                        <Clock className="w-5 h-5" />
                        LEAVE REQUEST MANAGEMENT
                    </h3>

                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-lg font-bold text-[#1a367c]">Pending Leave Requests</div>
                            <div className="text-xs font-bold text-[#f9b012] bg-orange-50 px-3 py-1.5 rounded-lg">2 PENDING</div>
                        </div>

                        <div className="space-y-4">
                            {/* Leave Item 1 */}
                            <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-bold text-[#1a367c] text-sm">Elena Vance</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction('reject', 'Leave Request')}
                                            className="w-8 h-8 rounded-full border border-red-100 text-red-500 bg-white flex items-center justify-center hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction('approve', 'Leave Request')}
                                            className="w-8 h-8 rounded-full bg-[#1a367c] text-white flex items-center justify-center hover:bg-[#2c4a96] hover:shadow-lg transition-all"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-[#f9b012] uppercase mb-4 tracking-wide">
                                    SECURITY • EMERGENCY • 2 DAYS
                                </div>
                                <div className="text-sm text-gray-600 pt-4 border-t border-slate-200 italic">
                                    "Statement: Critical Family Matter. Operational redundancy confirmed via Node Cluster B."
                                </div>
                            </div>

                            {/* Leave Item 2 */}
                            <div className="bg-[#f8f9fa] p-6 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="font-bold text-[#1a367c] text-sm">David Chen</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction('reject', 'Leave Request')}
                                            className="w-8 h-8 rounded-full border border-red-100 text-red-500 bg-white flex items-center justify-center hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction('approve', 'Leave Request')}
                                            className="w-8 h-8 rounded-full bg-[#1a367c] text-white flex items-center justify-center hover:bg-[#2c4a96] hover:shadow-lg transition-all"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-yellow-600 uppercase mb-4 tracking-wide">
                                    INFRASTRUCTURE • ANNUAL LEAVE • 5 DAYS
                                </div>
                                <div className="text-sm text-gray-600 pt-4 border-t border-slate-200 italic">
                                    "Statement: Project Transition Break. Operational redundancy confirmed via Node Cluster B."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project Requests */}
                <div>
                    <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest mb-6 flex items-center gap-2.5">
                        <FileText className="w-5 h-5" />
                        PROJECT & RESOURCE ALLOCATION
                    </h3>

                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-lg font-bold text-[#1a367c]">Project Requests</div>
                            <div className="text-xs font-bold text-[#8892b0] bg-slate-50 px-3 py-1.5 rounded-lg">High Impact</div>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {/* Project Item 1 */}
                            <div className="py-6 first:pt-0">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-[#1a367c] mb-1">Project Alpha: Phase 2 Expansion</h4>
                                        <div className="text-xs text-[#8892b0]">
                                            Requested by: <strong className="text-[#1a367c]">Sarah Miller (Cafeteria Ops)</strong> • Priority: <span className="text-[#f9b012] font-bold">HIGH</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction('reject', 'Project Request')}
                                            className="px-4 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all"
                                        >
                                            REJECT
                                        </button>
                                        <button
                                            onClick={() => handleAction('approve', 'Project Request')}
                                            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1a367c] text-white hover:bg-[#2c4a96] hover:shadow-lg transition-all"
                                        >
                                            APPROVE REQUEST
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Project Item 2 */}
                            <div className="py-6 last:pb-0">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div>
                                        <h4 className="text-sm font-bold text-[#1a367c] mb-1">Hardware Refresh: Q2 Cycle</h4>
                                        <div className="text-xs text-[#8892b0]">
                                            Requested by: <strong className="text-[#1a367c]">David Chen (Infrastructure)</strong> • Priority: <span className="text-yellow-600 font-bold">MEDIUM</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction('reject', 'Project Request')}
                                            className="px-4 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all"
                                        >
                                            REJECT
                                        </button>
                                        <button
                                            onClick={() => handleAction('approve', 'Project Request')}
                                            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1a367c] text-white hover:bg-[#2c4a96] hover:shadow-lg transition-all"
                                        >
                                            APPROVE REQUEST
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Approvals;
