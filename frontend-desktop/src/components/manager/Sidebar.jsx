import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, Package, Building2,
    Car, MapPin, CheckSquare, LogOut
} from 'lucide-react';
import logo from '../../assets/cygnet-logo.png';

const Sidebar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const hardwareItems = [
        { name: 'Dashboard', path: '/manager/hardware/dashboard', icon: LayoutDashboard },
        { name: 'Requests', path: '/manager/hardware/requests', icon: ClipboardList },
        { name: 'Assets', path: '/manager/hardware/assets', icon: Package },
        { name: 'Vendors', path: '/manager/hardware/vendors', icon: Building2 },
    ];

    const parkingItems = [
        { name: 'Dashboard', path: '/manager/parking/dashboard', icon: Car },
        { name: 'Slot Map', path: '/manager/parking/slots', icon: MapPin },
        { name: 'Requests', path: '/manager/parking/requests', icon: CheckSquare },
    ];

    return (
        <aside className="w-[260px] bg-white text-[#1a367c] flex flex-col p-8 border-r border-[#e0e0e0] flex-shrink-0 h-full z-50">
            <div className="flex items-center gap-3 mb-12">
                <img src={logo} alt="Cygnet Logo" className="w-10 h-10 object-contain" />
                <h2 className="text-lg font-bold text-[#1a367c] leading-tight tracking-tight">
                    CYGNET<span className="text-[#f9b012]">.ONE</span>
                </h2>
            </div>

            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-bold pl-1">
                    IT Hardware
                </div>
                {hardwareItems.map((item) => (
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

            <div className="mb-8">
                <div className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] mb-4 font-bold pl-1">
                    Parking
                </div>
                {parkingItems.map((item) => (
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

            <div className="mt-auto">
                <Link
                    to="/login"
                    className="flex items-center gap-2.5 text-[#8892b0] text-[0.8rem] font-medium cursor-pointer hover:text-[#1a367c] transition-colors pl-2"
                >
                    <LogOut className="w-4 h-4" />
                    EXIT PORTAL
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;