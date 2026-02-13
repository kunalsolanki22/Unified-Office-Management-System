import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

const getPortalInfo = (user) => {
    if (!user) return { label: 'MANAGER PORTAL', role: 'Manager' };

    const role = user.role;
    const type = user.manager_type;

    if (role === 'SuperAdmin') return { label: 'SUPER ADMIN PORTAL', role: 'Super Admin' };
    if (role === 'Admin') return { label: 'ADMIN PORTAL', role: 'Admin' };
    if (role === 'TeamLead') return { label: 'TEAM LEAD PORTAL', role: 'Team Lead' };
    if (role === 'AttendanceManager') return { label: 'ATTENDANCE MANAGER PORTAL', role: 'Attendance Manager' };
    if (role === 'ReportingManager') return { label: 'REPORTING MANAGER PORTAL', role: 'Reporting Manager' };
    if (role === 'CafeteriaManager') return { label: 'CAFETERIA MANAGER PORTAL', role: 'Cafeteria Manager' };
    if (role === 'Manager' && type === 'parking') return { label: 'PARKING MANAGER PORTAL', role: 'Parking Manager' };
    if (role === 'Manager' && type === 'it_support') return { label: 'IT HARDWARE MANAGER PORTAL', role: 'IT Manager' };

    return { label: 'MANAGER PORTAL', role: 'Manager' };
};

const Header = () => {
    const { user } = useAuth();
    const { label, role } = getPortalInfo(user);
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : role.charAt(0).toUpperCase();

    return (
        <header className="h-[90px] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-transparent pt-2.5 mb-8">
            <div>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">
                    {label}
                </p>
                <h2 className="text-[1.1rem] text-[#1a367c] font-bold">Have a good day 😊</h2>
            </div>

            <div className="flex items-center gap-6">
                {/* Functional Notification Bell */}
                <NotificationBell />

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
                    <div className="text-right hidden sm:block">
                        <div className="text-[0.75rem] font-bold text-[#1a367c]">
                            {user?.name || 'User'}
                        </div>
                        <div className="text-[0.65rem] text-[#f9b012] font-semibold text-right">
                            {role}
                        </div>
                    </div>
                    <div className="w-10 h-10 bg-[#1a367c] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-50">
                        {initial}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;