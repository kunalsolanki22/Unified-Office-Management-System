import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="h-[90px] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-transparent pt-2.5 mb-8">
            <div>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">
                    SUPER ADMIN PORTAL
                </p>
                <h2 className="text-[1.1rem] text-[#1a367c] font-bold">Have a good day 😊</h2>
            </div>

            <div className="flex items-center gap-6">
                {/* Notification Bell */}
                <div className="relative cursor-pointer">
                    <Bell className="w-5 h-5 text-[#1a367c]" />
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f9b012] rounded-full border border-white"></div>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
                    <div className="text-right hidden sm:block">
                        <div className="text-[0.75rem] font-bold text-[#1a367c]">{user?.name || 'Super Admin'}</div>
                        <div className="text-[0.65rem] text-[#f9b012] font-semibold text-right">Administrator</div>
                    </div>
                    <div className="w-10 h-10 bg-[#1a367c] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-50">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
