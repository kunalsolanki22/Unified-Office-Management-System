
const Orders = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    ORDER <span className="text-[#f9b012]">HISTORY</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    View Past and Ongoing Transactions
                </p>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-sm font-bold text-[#1a367c]">Order #102{i}</span>
                                    <span className="text-xs text-slate-400">• Today, 12:30 PM</span>
                                </div>
                                <div className="text-xs text-[#8892b0]">2x Veg Sandwich, 1x Coke</div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-[#1a367c] text-sm mb-1">₹340</div>
                                <span className="text-[0.65rem] font-bold px-2 py-1 bg-green-100 text-green-600 rounded-md uppercase">Completed</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Orders;
