import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    CalendarDays,
    Zap,
    BarChart3,
    LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import logo from '../../assets/cygnet-logo.png';

const menuItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/super-admin/dashboard' },
    { icon: Users, label: 'ADMIN', path: '/super-admin/admins' },
    { icon: CalendarCheck, label: 'ATTENDANCE', path: '/super-admin/attendance' },
    { icon: CalendarDays, label: 'HOLIDAYS', path: '/super-admin/holidays' },
    { icon: Zap, label: 'ACTION HUB', path: '/super-admin/actions' },
    { icon: BarChart3, label: 'ANALYTICS', path: '/super-admin/analytics' },
];

const Sidebar = () => {
    const location = useLocation();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white shadow-sm transition-transform">
            <div className="flex h-16 items-center border-b border-slate-100 px-6">
                <Link to="/super-admin/dashboard" className="flex items-center gap-3">
                    <img src={logo} alt="Cygnet.One" className="h-8 w-auto object-contain" />
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        CYGNET<span style={{ color: '#ffb012' }}>.ONE</span>
                    </span>
                </Link>
            </div>

            <div className="p-4">
                <div className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    CORE PILLARS
                </div>
                <nav className="space-y-1">
                    {menuItems.slice(0, 4).map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute left-0 h-8 w-1 rounded-r-full bg-blue-600"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-8 mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ACCESS TOOLS
                </div>
                <nav className="space-y-1">
                    {menuItems.slice(4).map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                                {item.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute left-0 h-8 w-1 rounded-r-full bg-blue-600"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="absolute bottom-4 left-4 right-4 space-y-4">
                <button
                    className="group flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-red-600 uppercase tracking-widest"
                    onClick={() => console.log("Logout clicked")}
                >
                    <LogOut className="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-500" />
                    EXIT PORTAL
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
