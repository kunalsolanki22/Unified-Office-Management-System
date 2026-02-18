import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    ClipboardCheck,
    FileText,
    Briefcase,
    Calendar,
    Clock,
    LogOut,
    Car,
    Coffee,
    Monitor,
    Video,
    HardDrive,
    Bell,
    ClipboardList,
    Zap,
    CalendarCheck,
    CheckSquare
} from 'lucide-react';
import logo from '../assets/cygnet-logo.png';

const ReportingManagerLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname.includes(path);

    const navItems = [
        { path: '/reporting-manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/reporting-manager/user-directory', label: 'User Directory', icon: Users },
        { path: '/reporting-manager/attendance-validation', label: 'Attendance', icon: CalendarCheck },
        { path: '/reporting-manager/approvals', label: 'Approvals', icon: CheckSquare },
        { path: '/reporting-manager/project-proposal', label: 'Projects', icon: Briefcase },
        { path: '/reporting-manager/holidays', label: 'Holidays', icon: Calendar },
    ];

    const accessTools = [
        { path: '/reporting-manager/my-attendance', label: 'My Attendance', icon: ClipboardList },
        { path: '/reporting-manager/action-hub', label: 'Services', icon: Zap },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-[#333] font-sans">
            {/* Sidebar */}
            <aside className="w-[260px] bg-white text-[#20323c] flex flex-col p-8 border-r border-[#e0e0e0] shrink-0">
                <div className="flex items-center gap-3 mb-12">
                    <img src={logo} alt="Cygnet Logo" className="w-10 h-10 object-contain" />
                    <div className="flex flex-col">
                        <h2 className="text-[1.2rem] font-bold text-[#1e3a8a] m-0 leading-tight">CYGNET<span className="text-[#FFB012]">.ONE</span></h2>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-semibold">Core Pillars</div>
                    {navItems.map((item) => (
                        <div
                            key={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 mb-2 ${isActive(item.path)
                                ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/10'
                                : 'text-[#8892b0] hover:bg-slate-50 hover:text-[#1e3a8a]'
                                }`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-[#FFB012]' : ''}`} />
                            {item.label}
                        </div>
                    ))}
                </div>

                <div className="mb-8">
                    <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-semibold">Access Tools</div>
                    {accessTools.map((item, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 mb-2 ${isActive(item.path)
                                ? 'bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/10'
                                : 'text-[#8892b0] hover:bg-slate-50 hover:text-[#1e3a8a]'
                                }`}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </div>
                    ))}
                </div>

                <div className="mt-auto">
                    <div
                        className="flex items-center gap-3 text-[#8892b0] text-sm font-medium cursor-pointer hover:text-red-500 transition-colors pl-2"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        EXIT PORTAL
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto bg-white px-10">
                {/* Header */}
                <header className="h-[90px] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-transparent pt-5">
                    <div>
                        <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5">
                            Reporting Manager Portal
                        </p>
                        <h2 className="text-[1.1rem] text-[#1e3a8a] font-bold">
                            Have a good day, {user?.name?.split(' ')[0] || 'User'} 😊
                        </h2>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative cursor-pointer group">
                            <Bell className="w-5 h-5 text-[#0a192f] group-hover:text-[#FFB012] transition-colors" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FFB012] rounded-full border-2 border-white"></div>
                        </div>

                        <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-[#1e3a8a]">{user?.name || 'User'}</div>
                                <div className="text-[0.65rem] text-[#FFB012] font-semibold">Reporting Manager</div>
                            </div>
                            <div className="w-10 h-10 bg-[#1e3a8a] text-white rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-offset-2 ring-[#FFB012]/20">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="py-8 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default ReportingManagerLayout;
