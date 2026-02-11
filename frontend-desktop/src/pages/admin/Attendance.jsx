import { motion } from 'framer-motion';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

const Attendance = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    MANAGER ATTENDANCE <span className="text-[#f9b012]">VALIDATION</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Verify Domain Leads & Approve Leave Requests
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Manager Audit */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-lg font-bold text-[#1a367c]">Manager Audit</div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Clock className="w-5 h-5 text-[#f9b012]" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { name: 'James Carter', role: 'PARKING LEAD', time: '09:24 AM', status: 'FLAGGED', note: 'LATE CLOCK-IN (24M)', color: 'bg-red-50 text-red-500', initial: 'J', initialBg: 'bg-[#1a4d8c]' },
                            { name: 'Priya Verma', role: 'DESK ADMIN', time: '08:58 AM', status: 'VERIFIED', note: 'ON-TIME ENTRY', color: 'bg-green-50 text-green-600', initial: 'P', initialBg: 'bg-slate-800' },
                            { name: 'Marcus Bell', role: 'INFRASTRUCTURE', time: 'PENDING', status: 'PENDING', note: 'SYSTEM CHECK REQUIRED', color: 'bg-amber-50 text-amber-600', initial: 'M', initialBg: 'bg-slate-800' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center p-4 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                                <div className={`w-10 h-10 ${item.initialBg} text-white rounded-lg flex items-center justify-center font-bold mr-4`}>
                                    {item.initial}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-[#1a367c]">{item.name}</div>
                                    <div className="text-[0.65rem] font-bold text-[#8892b0] tracking-wide uppercase">{item.role} • {item.time}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-block px-2 py-1 rounded text-[0.65rem] font-bold tracking-wide mb-1 ${item.color}`}>
                                        {item.status}
                                    </div>
                                    <div className="text-[0.65rem] font-medium text-[#8892b0] tracking-wide">{item.note}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-6 bg-[#1a367c] text-white py-4 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10">
                        AUTHORIZE MANAGER LOGS
                    </button>
                </div>

                {/* Leave Requests */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-lg font-bold text-[#1a367c]">Leave Requests</div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-[#1a367c]" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[
                            { name: 'Elena Vance', type: 'SECURITY • EMERGENCY • 2 DAYS', reason: 'Critical Family Matter. Operational redundancy confirmed via Node Cluster B.', color: 'text-red-500' },
                            { name: 'David Chen', type: 'INFRASTRUCTURE • ANNUAL LEAVE • 5 DAYS', reason: 'Project Transition Break. Operational redundancy confirmed via Node Cluster B.', color: 'text-amber-500' },
                        ].map((leave, idx) => (
                            <div key={idx} className="bg-[#f8f9fa] p-6 rounded-2xl">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-sm font-bold text-[#1a367c] mb-1">{leave.name}</div>
                                        <div className={`text-[0.65rem] font-bold tracking-widest uppercase ${leave.color}`}>{leave.type}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="w-8 h-8 rounded-full border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors bg-white">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="w-8 h-8 rounded-full bg-[#1a367c] text-white flex items-center justify-center hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/20">
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-200">
                                    <p className="text-[0.75rem] text-[#666] leading-relaxed">
                                        <span className="font-bold text-[#8892b0] text-[0.65rem] tracking-wide uppercase mr-1">STATEMENT:</span>
                                        {leave.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Attendance;
