import {
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    Check
} from 'lucide-react';

const Attendance = () => {
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

                        <div className="flex items-center bg-white border border-slate-100 p-4 rounded-xl mb-4 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-[#1a4d8c] text-white rounded-lg flex justify-center items-center font-bold mr-4 shrink-0">J</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[0.9rem] font-semibold text-[#1a367c]">James Carter</div>
                                <div className="text-[0.7rem] text-[#8892b0] uppercase mt-1 flex items-center gap-2">
                                    PARKING LEAD • <span className="flex items-center gap-1 text-red-500"><Clock className="w-3 h-3" /> 09:24 AM</span>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <div className="inline-block px-2 py-1 rounded-md text-[0.7rem] font-bold bg-red-100 text-red-500">FLAGGED</div>
                                    <div className="text-[0.7rem] text-[#8892b0] mt-1">LATE CLOCK-IN (24M)</div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-500 hover:bg-green-500 hover:text-white transition-all">
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center bg-white border border-slate-100 p-4 rounded-xl hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 bg-white border border-slate-200 text-slate-700 rounded-lg flex justify-center items-center font-bold mr-4 shrink-0">P</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[0.9rem] font-semibold text-[#1a367c]">Priya Verma</div>
                                <div className="text-[0.7rem] text-[#8892b0] uppercase mt-1 flex items-center gap-2">
                                    DESK ADMIN • <span className="flex items-center gap-1 text-green-600"><Clock className="w-3 h-3" /> 08:58 AM</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-block px-2 py-1 rounded-md text-[0.7rem] font-bold bg-green-100 text-green-600">VERIFIED</div>
                                <div className="text-[0.7rem] text-[#8892b0] mt-1">ON-TIME ENTRY</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
