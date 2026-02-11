import { motion } from 'framer-motion';
import { ClipboardCheck, Check, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const Attendance = () => {
    const audits = [
        {
            id: 1,
            name: 'James Carter',
            role: 'PARKING LEAD',
            time: '09:24 AM',
            status: 'FLAGGED',
            statusDetail: 'LATE CLOCK-IN (24M)',
            avatarColor: 'bg-[#1a4d8c]',
            initial: 'J',
            statusColor: 'bg-red-50 text-red-500',
            borderColor: 'border-red-100'
        },
        {
            id: 2,
            name: 'Priya Verma',
            role: 'DESK ADMIN',
            time: '08:58 AM',
            status: 'VERIFIED',
            statusDetail: 'ON-TIME ENTRY',
            avatarColor: 'bg-slate-100 text-[#333]',
            initial: 'P',
            statusColor: 'bg-green-50 text-green-500',
            borderColor: 'border-slate-100'
        },
        {
            id: 3,
            name: 'Marcus Bell',
            role: 'INFRASTRUCTURE',
            time: 'PENDING',
            status: 'PENDING',
            statusDetail: 'SYSTEM CHECK REQUIRED',
            avatarColor: 'bg-slate-100 text-[#333]',
            initial: 'M',
            statusColor: 'bg-yellow-50 text-yellow-600',
            borderColor: 'border-slate-100'
        },
    ];

    const handleApprove = (name) => toast.success(`Attendance verified for ${name}`);
    const handleReject = (name) => toast.error(`Attendance flagged for ${name}`);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#1a367c] flex items-center gap-2">
                    MANAGER ATTENDANCE <span className="text-[#f9b012]">VALIDATION</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium mt-1 uppercase tracking-wide">
                    Verify Domain Leads & Approve Leave Requests
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest mb-6 flex items-center gap-2.5">
                        <ClipboardCheck className="w-5 h-5" />
                        DAILY ATTENDANCE VALIDATION
                    </h3>

                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-lg font-bold text-[#1a367c]">Manager Audit</div>
                            <div className="text-xs font-bold text-[#8892b0] bg-slate-50 px-3 py-1.5 rounded-lg">Feb 10, 2026</div>
                        </div>

                        <div className="space-y-4">
                            {audits.map((audit) => (
                                <motion.div
                                    key={audit.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex flex-col md:flex-row items-center gap-4 bg-white border ${audit.borderColor} p-4 rounded-2xl hover:shadow-sm transition-all`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${audit.avatarColor}`}>
                                        {audit.initial}
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <div className="text-sm font-bold text-[#1a367c]">{audit.name}</div>
                                        <div className="text-[0.65rem] font-bold text-[#8892b0] mt-0.5 tracking-wide">
                                            {audit.role} • {audit.time}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="text-right">
                                            <span className={`text-[0.65rem] font-bold px-2 py-1 rounded-md tracking-wide ${audit.statusColor}`}>
                                                {audit.status}
                                            </span>
                                            <div className="text-[0.65rem] font-bold text-[#8892b0] mt-1 tracking-wide uppercase">
                                                {audit.statusDetail}
                                            </div>
                                        </div>

                                        {audit.status !== 'VERIFIED' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReject(audit.name)}
                                                    className="w-8 h-8 rounded-full border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(audit.name)}
                                                    className="w-8 h-8 rounded-full bg-[#1a367c] text-white flex items-center justify-center hover:bg-[#2c4a96] hover:shadow-lg transition-all"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <button className="w-full mt-6 bg-[#1a367c] text-white py-4 rounded-xl text-xs font-bold tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all">
                            AUTHORIZE ALL REMAINING LOGS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
