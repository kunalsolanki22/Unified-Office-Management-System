import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    ClipboardList,
    Package,
    Building2,
    CalendarDays,
    LogOut,
    Menu,
    X,
    HardDrive
} from 'lucide-react';
import NotificationBell from '../components/manager/NotificationBell';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/hardware/dashboard' },
    { icon: ClipboardList, label: 'Requests', path: '/hardware/requests' },
    { icon: Package, label: 'Assets', path: '/hardware/assets' },
    { icon: Building2, label: 'Vendors', path: '/hardware/vendors' },
    { icon: CalendarDays, label: 'Holidays', path: '/hardware/holidays' },
];

const HardwareLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7f6]">

            {/* Sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ duration: 0.3 }}
                className="bg-white border-r border-[#e0e0e0] flex flex-col overflow-hidden flex-shrink-0"
            >
                {/* Logo */}
                <div className="h-[90px] flex items-center justify-between px-5 border-b border-[#f0f0f0]">
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 bg-[#1a367c] rounded-lg flex items-center justify-center">
                                <HardDrive className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="text-[0.75rem] font-extrabold text-[#1a367c] tracking-widest">HARDWARE</div>
                                <div className="text-[0.6rem] text-[#f9b012] font-semibold tracking-widest">MANAGER PORTAL</div>
                            </div>
                        </motion.div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-[#8892b0]"
                    >
                        {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <motion.button
                                key={item.path}
                                whileHover={{ x: 4 }}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-[#1a367c] text-white shadow-lg shadow-blue-900/20'
                                        : 'text-[#8892b0] hover:bg-slate-50 hover:text-[#1a367c]'
                                    }`}
                            >
                                <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                                {!collapsed && (
                                    <span className="text-[0.75rem] font-bold tracking-wide truncate">
                                        {item.label}
                                    </span>
                                )}
                                {!collapsed && isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-[#f9b012] rounded-full" />
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-3 py-4 border-t border-[#f0f0f0]">
                    <motion.button
                        whileHover={{ x: 4 }}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[#8892b0] hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                        <LogOut className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
                        {!collapsed && (
                            <span className="text-[0.75rem] font-bold tracking-wide">Logout</span>
                        )}
                    </motion.button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Header */}
                <header className="h-[90px] flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-transparent px-10 flex-shrink-0 relative z-50">
                    <div>
                        <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5">
                            IT HARDWARE MANAGER PORTAL
                        </p>
                        <h2 className="text-[1.1rem] text-[#1a367c] font-bold">
                            Have a good day 😊
                        </h2>
                    </div>
                    <div className="flex items-center gap-5">
                        <NotificationBell />
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[0.75rem] font-bold text-[#1a367c]">IT MANAGER</div>
                                <div className="text-[0.65rem] text-[#f9b012] font-semibold">Hardware & Assets</div>
                            </div>
                            <div className="w-10 h-10 bg-[#1a367c] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                                IT
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto px-10 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default HardwareLayout;