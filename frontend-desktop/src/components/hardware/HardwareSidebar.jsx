import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, CheckSquare,
    CalendarDays, User, Zap, LogOut, Building2
} from 'lucide-react';
import logo from '../../assets/cygnet-logo.png';
import { useAuth } from '../../context/AuthContext';

const corePillars = [
    { name: 'Dashboard',      path: '/hardware/dashboard',      icon: LayoutDashboard },
    { name: 'User Directory', path: '/admin/user-directory',          icon: Users },
    { name: 'Approvals',      path: '/hardware/requests',       icon: CheckSquare },
    { name: 'Vendors',        path: '/hardware/vendors',        icon: Building2 },
    { name: 'Holidays',       path: '/hardware/holidays',       icon: CalendarDays },
];

const accessTools = [
    { name: 'My Attendance', path: '/hardware/my-attendance', icon: User },
    { name: 'Services',      path: '/hardware/services',      icon: Zap },
];

const HardwareSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname.includes(path);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-[260px] bg-white text-[#1a367c] flex flex-col p-8 border-r border-[#e0e0e0] flex-shrink-0 h-full z-50">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
                <img src={logo} alt="Cygnet Logo" className="w-10 h-10 object-contain" />
                <div className="flex flex-col">
                    <h2 className="text-[1.2rem] font-bold text-[#1e3a8a] m-0 leading-tight">
                        CYGNET<span className="text-[#FFB012]">.ONE</span>
                    </h2>
                </div>
            </div>

            {/* Core Pillars */}
            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-semibold">        
                    Core Pillars
                </div>
                {corePillars.map((item) => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 mb-2
                            ${isActive(item.path)
                                ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/10'
                                : 'text-[#8892b0] hover:bg-slate-50 hover:text-[#1e3a8a]'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-[#FFB012]' : ''}`} />
                        {item.name}
                    </div>
                ))}
            </div>

            {/* Access Tools */}
            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-semibold">        
                    Access Tools
                </div>
                {accessTools.map((item) => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 mb-2
                            ${isActive(item.path)
                                ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/10'
                                : 'text-[#8892b0] hover:bg-slate-50 hover:text-[#1e3a8a]'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.name}
                    </div>
                ))}
            </div>

            {/* Exit Portal */}
            <div className="mt-auto">
                <div
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-[#8892b0] text-sm font-medium cursor-pointer hover:text-red-500 transition-colors pl-2"
                >
                    <LogOut className="w-4 h-4" />
                    EXIT PORTAL
                </div>
            </div>
        </aside>
    );
};

export default HardwareSidebar;