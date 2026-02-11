import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Utensils, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname.includes(path);

    const navItems = [
        { name: 'Dashboard', path: '/cafeteria-manager/dashboard', icon: LayoutDashboard },
        { name: 'Menu Management', path: '/cafeteria-manager/menu', icon: Utensils },
        { name: 'Order History', path: '/cafeteria-manager/orders', icon: ShoppingBag },
    ];

    return (
        <aside className="w-[260px] bg-white text-[#1a367c] flex flex-col p-8 border-r border-[#e0e0e0] flex-shrink-0 h-full z-50">
            {/* Logo Section */}
            <div className="flex items-center gap-3 mb-12">
                <div className="w-10 h-10 bg-gradient-to-br from-[#20323c] to-[#2c4a96] rounded-full flex items-center justify-center text-white font-bold text-xl">
                    C
                </div>
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-[#1a367c] leading-tight tracking-tight">
                        CYGNET<span className="text-[#f9b012]">.ONE</span>
                    </h2>
                </div>
            </div>

            {/* Core Pillars Navigation */}
            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-bold pl-1">
                    Cafeteria Ops
                </div>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 mb-2
                            ${isActive(item.path)
                                ? 'bg-[#1a367c] text-white shadow-lg shadow-[#1a367c26]'
                                : 'text-[#8892b0] hover:bg-[#1a367c] hover:text-white hover:shadow-lg hover:shadow-[#1a367c26]'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                    </Link>
                ))}
            </div>

            {/* Footer / Exit Portal */}
            <div className="mt-auto">
                <button onClick={logout} className="flex items-center gap-2.5 text-[#8892b0] text-[0.8rem] font-medium cursor-pointer hover:text-[#1a367c] transition-colors pl-2 w-full text-left">
                    <LogOut className="w-4 h-4" />
                    EXIT PORTAL
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
