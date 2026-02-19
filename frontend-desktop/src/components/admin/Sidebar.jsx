import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CalendarCheck, CalendarDays, Zap, LogOut, CheckSquare } from 'lucide-react';
import logo from '../../assets/cygnet-logo.png';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Helper to determine if a route is active
    const isActive = (path) => location.pathname === path;

    const corePillars = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Project Approvals', path: '/admin/project-approvals', icon: CheckSquare },
        { name: 'User Directory', path: '/admin/user-directory', icon: Users },
        { name: 'Attendance', path: '/admin/attendance-validation', icon: CalendarCheck },
        { name: 'Approvals', path: '/admin/approvals-hub', icon: CheckSquare },
        { name: 'Holidays', path: '/admin/holidays', icon: CalendarDays },
    ];

    const accessTools = [
        { name: 'My Attendance', path: '/admin/my-attendance', icon: CheckSquare },
        { name: 'Services', path: '/admin/action-hub', icon: Zap },
    ];

    return (
        <aside className="w-[260px] bg-white text-[#1a367c] flex flex-col p-8 border-r border-[#e0e0e0] flex-shrink-0 h-full z-50">
            {/* Logo Section */}
            <div className="flex items-center gap-3 mb-12">
                <img src={logo} alt="Cygnet Logo" className="w-10 h-10 object-contain" />
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-[#1a367c] leading-tight tracking-tight">
                        CYGNET<span className="text-[#f9b012]">.ONE</span>
                    </h2>
                </div>
            </div>

            {/* Core Pillars Navigation */}
            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-bold pl-1">
                    Core Pillars
                </div>
                {corePillars.map((item) => (
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

            {/* Access Tools Navigation */}
            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-bold pl-1">
                    Access Tools
                </div>
                {accessTools.map((item) => (
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
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 text-[#8892b0] text-[0.8rem] font-medium cursor-pointer hover:text-red-500 transition-colors pl-2 w-full text-left"
                >
                    <LogOut className="w-4 h-4" />
                    EXIT PORTAL
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
