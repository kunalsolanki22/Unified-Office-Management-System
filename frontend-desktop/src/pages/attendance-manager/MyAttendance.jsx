
const MyAttendance = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    MY <span className="text-[#f9b012]">ATTENDANCE</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    View your personal attendance records
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                    <h3 className="text-[1.1rem] font-bold text-[#1a367c] mb-6 flex items-center gap-2">REGULARIZE ATTENDANCE</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">DATE</label>
                            <input type="date" className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">REASON</label>
                            <select className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20">
                                <option>Forgot to Check-in</option>
                                <option>Technical Issue</option>
                                <option>On Duty</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2 mb-8">
                        <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">DESCRIPTION</label>
                        <textarea className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20" rows="3" placeholder="Enter details..."></textarea>
                    </div>
                    <button className="bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest shadow-lg shadow-[#1a367c]/20 hover:bg-[#2c4a96] transition-all">
                        SUBMIT REQUEST
                    </button>
                </div>

                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 h-fit">
                    <h3 className="text-[1.1rem] font-bold text-[#1a367c] mb-6">SUMMARY</h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                            <div className="text-3xl font-extrabold text-[#1a367c]">22</div>
                            <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">Present Days</div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                            <div className="text-3xl font-extrabold text-[#1a367c]">2</div>
                            <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">Leaves Taken</div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                            <div className="text-3xl font-extrabold text-[#1a367c]">0</div>
                            <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">Lates</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAttendance;
