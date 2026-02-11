import { Check, X } from 'lucide-react';

const Approvals = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    PENDING <span className="text-[#f9b012]">APPROVALS</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Review and Action Employee Requests
                </p>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-[1.1rem] font-bold text-[#1a367c]">Request Queue</div>
                    <div className="px-3 py-1 rounded-full text-[0.7rem] font-bold bg-amber-100 text-amber-600 uppercase tracking-wide">3 PENDING</div>
                </div>

                <div className="space-y-4">
                    {/* Request 1 */}
                    <div className="flex items-center bg-white border border-slate-100 p-5 rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-[#d35400] text-white rounded-lg flex justify-center items-center font-bold mr-4 shrink-0 shadow-sm">R</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[0.9rem] font-semibold text-[#1a367c]">Rajesh Kumar</div>
                            <div className="text-[0.7rem] text-[#8892b0] uppercase font-bold mt-0.5">SYSTEM ADMIN • LEAVE REQUEST</div>
                            <div className="text-xs text-slate-600 mt-1">Requested Sick Leave for Feb 12, 2026.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                <X className="w-3.5 h-3.5" /> REJECT
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all">
                                <Check className="w-3.5 h-3.5" /> APPROVE
                            </button>
                        </div>
                    </div>

                    {/* Request 2 */}
                    <div className="flex items-center bg-white border border-slate-100 p-5 rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-[#2c3e50] text-white rounded-lg flex justify-center items-center font-bold mr-4 shrink-0 shadow-sm">A</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[0.9rem] font-semibold text-[#1a367c]">Anita Desai</div>
                            <div className="text-[0.7rem] text-[#8892b0] uppercase font-bold mt-0.5">HR ASSOCIATE • WFH REQUEST</div>
                            <div className="text-xs text-slate-600 mt-1">Work from home on Feb 14, 2026.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                <X className="w-3.5 h-3.5" /> REJECT
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all">
                                <Check className="w-3.5 h-3.5" /> APPROVE
                            </button>
                        </div>
                    </div>

                    {/* Request 3 */}
                    <div className="flex items-center bg-white border border-slate-100 p-5 rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-[#16a085] text-white rounded-lg flex justify-center items-center font-bold mr-4 shrink-0 shadow-sm">S</div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[0.9rem] font-semibold text-[#1a367c]">Sam Wilson</div>
                            <div className="text-[0.7rem] text-[#8892b0] uppercase font-bold mt-0.5">INTERN • ATTENDANCE REGULARIZATION</div>
                            <div className="text-xs text-slate-600 mt-1">Forgot check-in on Feb 09.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                <X className="w-3.5 h-3.5" /> REJECT
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all">
                                <Check className="w-3.5 h-3.5" /> APPROVE
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Approvals;
