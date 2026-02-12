import {
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    Check
} from 'lucide-react';
import React from 'react';

const Attendance = () => {
    const [managerAudit, setManagerAudit] = React.useState([
        {
            id: 1,
            name: "James Carter",
            initial: "J",
            role: "PARKING LEAD",
            time: "09:24 AM",
            status: "FLAGGED",
            statusColor: "bg-red-100 text-red-500",
            statusText: "LATE CLOCK-IN (24M)",
            isLate: true
        },
        {
            id: 2,
            name: "Priya Verma",
            initial: "P",
            role: "DESK ADMIN",
            time: "08:58 AM",
            status: "VERIFIED",
            statusColor: "bg-green-100 text-green-600",
            statusText: "ON-TIME ENTRY",
            isLate: false
        }
    ]);

    const handleApprove = (id) => {
        setManagerAudit(prev => prev.map(record => {
            if (record.id === id) {
                return {
                    ...record,
                    status: "VERIFIED",
                    statusColor: "bg-green-100 text-green-600",
                    statusText: "ON-TIME ENTRY", // Or keep original text? sticking to "VERIFIED" implications
                    // If we approve a late entry, maybe we should change the text or keep it but show it's verified?
                    // For now, let's just change the status badge to VERIFIED.
                    isLate: false // Assuming approval clears the "late" flag visually or just validates it
                };
            }
            return record;
        }));
    };

    const handleReject = (id) => {
        // For now, let's remove the record or mark it as rejected. 
        // The UI design shows specific styles for FLAGGED and VERIFIED. 
        // Let's filter it out for "Reject" as if dismissing it, or update status if we had a "REJECTED" design.
        // Given the instructions "make sure every button is working properly", removing seems appropriate for "X".
        setManagerAudit(prev => prev.filter(record => record.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    MANAGER ATTENDANCE <span className="text-[#f9b012]">VALIDATION</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Verify Domain Leads & Approve Leave Requests
                </p>
            </div>

            <div className="space-y-6">
                {/* Daily Manager Audit */}
                <div>
                    <h3 className="text-[1.1rem] font-bold text-[#1a367c] mb-6 flex items-center gap-2">
                        DAILY ATTENDANCE VALIDATION
                    </h3>

                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-[1.1rem] font-bold text-[#1a367c]">Manager Audit</div>
                            <div className="text-xs font-bold text-[#8892b0]">Feb 10, 2026</div>
                        </div>

                        {managerAudit.map((record) => (
                            <div key={record.id} className="flex items-center bg-white border border-slate-100 p-4 rounded-xl mb-4 hover:shadow-md transition-shadow">
                                <div className={`w-10 h-10 ${record.id === 1 ? 'bg-[#1a4d8c] text-white' : 'bg-white border border-slate-200 text-slate-700'} rounded-lg flex justify-center items-center font-bold mr-4 shrink-0`}>
                                    {record.initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[0.9rem] font-semibold text-[#1a367c]">{record.name}</div>
                                    <div className="text-[0.7rem] text-[#8892b0] uppercase mt-1 flex items-center gap-2">
                                        {record.role} • <span className={`flex items-center gap-1 ${record.isLate ? 'text-red-500' : 'text-green-600'}`}>
                                            <Clock className="w-3 h-3" /> {record.time}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <div className={`inline-block px-2 py-1 rounded-md text-[0.7rem] font-bold ${record.statusColor}`}>
                                            {record.status}
                                        </div>
                                        <div className="text-[0.7rem] text-[#8892b0] mt-1">{record.statusText}</div>
                                    </div>
                                    {record.status === 'FLAGGED' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReject(record.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleApprove(record.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
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

export default Attendance;
