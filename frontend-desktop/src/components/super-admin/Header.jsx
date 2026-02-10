import { Bell, Search, User } from 'lucide-react';
import { Badge } from '../ui/Badge';

const Header = () => {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm transition-all shadow-sm">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Command Node..."
                        className="h-9 w-64 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
                </button>

                <div className="h-8 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-slate-900">Root Admin</span>
                        <span className="text-[10px] font-medium text-orange-500 uppercase tracking-wider">Online</span>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white ring-2 ring-blue-100">
                        M
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
