import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const Attendance = () => {
    const [auditData] = useState([
        { name: 'Karan Sharma', role: 'FOOD ADMIN', time: '09:24 AM', status: 'FLAGGED', note: 'LATE CLOCK-IN (24M)', color: 'bg-red-50 text-red-500', initial: 'K', initialBg: 'bg-[#1a4d8c]' },
        { name: 'Priya Verma', role: 'DESK ADMIN', time: '08:58 AM', status: 'VERIFIED', note: 'ON-TIME ENTRY', color: 'bg-green-50 text-green-600', initial: 'P', initialBg: 'bg-slate-800' },
        { name: 'Marcus Bell', role: 'INFRASTRUCTURE', time: 'PENDING', status: 'PENDING', note: 'SYSTEM CHECK REQUIRED', color: 'bg-amber-50 text-amber-600', initial: 'M', initialBg: 'bg-slate-800' },
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAudit = auditData.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [petitions, setPetitions] = useState([
        { id: 1, name: 'Elena Vance', type: 'EMERGENCY • 2 DAYS', reason: 'Critical Family Matter. Operational redundancy confirmed via Node Cluster B.', color: 'text-red-500' },
        { id: 2, name: 'David Chen', type: 'ANNUAL LEAVE • 5 DAYS', reason: 'Project Transition Break. Operational redundancy confirmed via Node Cluster B.', color: 'text-amber-500' },
    ]);

    const handleAuthorizeBatch = () => {
        toast.success("Daily batch authorized successfully!");
    };

    const handlePetitionAction = (id, action) => {
        setPetitions(prev => prev.filter(p => p.id !== id));
        if (action === 'approve') {
            toast.success("Leave petition approved.");
        } else {
            toast.info("Leave petition rejected.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    ATTENDANCE <span className="text-[#f9b012]">ADJUDICATION</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Audit Performance & Manage Administrator Clearances
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Audit */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-lg font-bold text-[#1a367c]">Daily Audit</div>
                        {/* Search Bar */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm w-[200px]">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search audit..."
                                className="ml-2 bg-transparent border-none outline-none text-[0.7rem] font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredAudit.length > 0 ? (
                            filteredAudit.map((item, idx) => (
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
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm font-medium italic">
                                No audit records found.
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAuthorizeBatch}
                        className="w-full mt-6 bg-[#1a367c] text-white py-4 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10"
                    >
                        AUTHORIZE DAILY BATCH
                    </button>
                </div>

                {/* Leave Petitions */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-lg font-bold text-[#1a367c]">Leave Petitions</div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-[#1a367c]" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-6">
                            {petitions.map((leave) => (
                                <div key={leave.id} className="bg-[#f8f9fa] p-6 rounded-2xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="text-sm font-bold text-[#1a367c] mb-1">{leave.name}</div>
                                            <div className={`text-[0.65rem] font-bold tracking-widest uppercase ${leave.color}`}>{leave.type}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePetitionAction(leave.id, 'reject')}
                                                className="w-8 h-8 rounded-full border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors bg-white"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handlePetitionAction(leave.id, 'approve')}
                                                className="w-8 h-8 rounded-full bg-[#1a367c] text-white flex items-center justify-center hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/20"
                                            >
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
            </div>
        </motion.div>
    );
};

export default Attendance;
