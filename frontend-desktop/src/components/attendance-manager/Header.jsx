import { Bell, Search } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-[90px] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-transparent pt-2.5 mb-8">
            <div>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">
                    ATTENDANCE MANAGER PORTAL
                </p>
                <h2 className="text-[1.1rem] text-[#1a367c] font-bold">Have a good day 😊</h2>
            </div>

            {/* Search Bar (UI Only as requested) */}
            <div className="flex items-center bg-[#f8f9fa] rounded-[50px] px-6 py-3 w-[350px] border border-[#e0e0e0] mx-auto">
                <Search className="w-4 h-4 text-[#b0b0b0]" />
                <input
                    type="text"
                    placeholder="SEARCH PORTAL..."
                    className="bg-transparent border-none outline-none ml-2.5 w-full text-[0.85rem] tracking-[1px] text-[#1a367c] placeholder-[#b0b0b0] placeholder:text-[0.75rem] placeholder:tracking-[2px]"
                />
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-6 ml-2">
                <div className="relative cursor-pointer group">
                    <Bell className="w-5 h-5 text-[#0a192f] transition-transform group-hover:scale-110" />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f9b012] rounded-full border-2 border-white"></div>
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="text-right hidden sm:block">
                        <div className="text-[0.75rem] font-bold text-[#1a367c]">xyz Bhai</div>
                        <div className="text-[0.65rem] text-[#f9b012] font-semibold text-right">Attendance Manager</div>
                    </div>
                    <div className="w-10 h-10 bg-[#1a367c] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-50">
                        M
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
