import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Monitor,
    ClipboardList,
    Package,
    Building2,
    Car,
    MapPin,
    CheckSquare,
    LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import logo from '../../assets/cygnet-logo.png';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const hardwareItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', path: '/manager/hardware/dashboard' },
    { icon: ClipboardList, label: 'REQUESTS', path: '/manager/hardware/requests' },
    { icon: Package, label: 'ASSETS', path: '/manager/hardware/assets' },
    { icon: Building2, label: 'VENDORS', path: '/manager/hardware/vendors' },
];

const parkingItems = [
    { icon: Car, label: 'DASHBOARD', path: '/manager/parking/dashboard' },
    { icon: MapPin, label: 'SLOT MAP', path: '/manager/parking/slots' },
    { icon: CheckSquare, label: 'REQUESTS', path: '/manager/parking/requests' },
];

const NavItem = ({ item }) => {
    const location = useLocation();
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
        <Link
            to={item.path}
            className={cn(
                "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
            {item.label}
            {isActive && (
                <motion.div
                    layoutId="manager-sidebar-active"
                    className="absolute left-0 h-8 w-1 rounded-r-full bg-blue-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />
            )}
        </Link>
    );
};

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white shadow-sm">
            <div className="flex h-16 items-center border-b border-slate-100 px-6">
                <Link to="/manager/hardware/dashboard" className="flex items-center gap-3">
                    <img src={logo} alt="Cygnet.One" className="h-8 w-auto object-contain" />
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                        CYGNET<span style={{ color: '#ffb012' }}>.ONE</span>
                    </span>
                </Link>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100vh-8rem)]">
                <div className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    IT HARDWARE
                </div>
                <nav className="space-y-1 mb-6">
                    {hardwareItems.map(item => <NavItem key={item.path} item={item} />)}
                </nav>

                <div className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    PARKING
                </div>
                <nav className="space-y-1">
                    {parkingItems.map(item => <NavItem key={item.path} item={item} />)}
                </nav>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-red-600 uppercase tracking-widest"
                >
                    <LogOut className="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-500" />
                    EXIT PORTAL
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;