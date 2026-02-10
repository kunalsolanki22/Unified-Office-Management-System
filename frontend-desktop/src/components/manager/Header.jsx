import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 w-64">
                <span className="text-xs text-slate-400 uppercase tracking-widest">Command Node...</span>
            </div>
            <div className="flex items-center gap-4">
                <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-400"></span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">IT MANAGER</p>
                        <p className="text-xs text-green-500 uppercase tracking-widest">ONLINE</p>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3a5c] text-white text-sm font-bold">
                        {user?.email?.[0]?.toUpperCase() || 'M'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;