import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Utensils, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/cafeteria-manager/dashboard' },
        { name: 'Menu Management', icon: Utensils, path: '/cafeteria-manager/menu' },
        { name: 'Orders', icon: ClipboardList, path: '/cafeteria-manager/orders' },
    ];

    return (
        <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xl font-bold text-gray-800 dark:text-white">Cafeteria Manager</span>
            </div>
            <div className="flex-1 overflow-y-auto">
                <nav className="px-2 py-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
                                ${location.pathname === item.path
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150 ease-in-out"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
