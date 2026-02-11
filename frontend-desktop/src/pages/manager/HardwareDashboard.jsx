import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Package, Building2, ArrowRight, Bell, Calendar } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const stats = [
    { label: 'TOTAL ASSETS', value: '48', note: 'Across all categories' },
    { label: 'PENDING REQUESTS', value: '07', note: 'Awaiting your approval' },
    { label: 'ASSIGNED ASSETS', value: '35', note: 'Currently in use' },
];

const shortcuts = [
    { icon: ClipboardList, label: 'HARDWARE REQUESTS', sub: 'Review & Process Employee Requests', path: '/manager/hardware/requests' },
    { icon: Package, label: 'ASSET INVENTORY', sub: 'Manage & Assign Hardware Assets', path: '/manager/hardware/assets' },
    { icon: Building2, label: 'VENDOR DIRECTORY', sub: 'Manage Hardware Suppliers', path: '/manager/hardware/vendors' },
];

const announcements = [
    { date: 'FEB 10', title: 'Town Hall Meeting', sub: 'Quadrimester updates with CEO. 4:00 PM IST.' },
    { date: 'FEB 08', title: 'Policy Update: Remote Work', sub: 'Revised guidelines available in HR Registry.' },
];

const holidays = [
    { date: 'FEB 26', title: 'Maha Shivratri', sub: 'Public Holiday' },
    { date: 'MAR 14', title: 'Holi', sub: 'Festival of Colors' },
];

function HardwareDashboard() {
    const navigate = useNavigate();

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

            {/* Page Title */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    HARDWARE <span className="text-[#f9b012]">REGISTRY</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Inventory Assignment & Asset Control
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        className="bg-white p-8 rounded-[20px] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-150"></div>
                        <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mb-3 relative z-10">{stat.label}</p>
                        <p className="text-[2.5rem] font-extrabold text-[#1a367c] leading-tight relative z-10">{stat.value}</p>
                        <p className="text-[0.8rem] text-[#8892b0] mt-1 relative z-10">{stat.note}</p>
                        <div className="h-1 w-10 bg-[#f9b012] mt-4 rounded-full transition-all duration-300 group-hover:w-20"></div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <motion.div variants={itemVariants} className="mb-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">QUICK ACTIONS</h3>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {shortcuts.map((item) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.label}
                                variants={itemVariants}
                                whileHover={{ y: -8, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
                                onClick={() => navigate(item.path)}
                                className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group"
                            >
                                <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:text-[#f9b012] transition-colors">
                                    <Icon className="w-7 h-7" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2">{item.label}</h3>
                                <p className="text-[0.65rem] text-[#8892b0] font-medium mb-4">{item.sub}</p>
                                <button className="flex items-center gap-2 text-[#1a367c] text-xs font-bold tracking-widest hover:gap-3 transition-all">
                                    OPEN <ArrowRight className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Announcements + Holidays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Announcements */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: 'rgba(255,107,0,0.3)' }}
                    className="bg-white rounded-[24px] p-10 shadow-sm border border-[rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group"
                    style={{ minHeight: '280px' }}
                >
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-bl-full transition-transform duration-500 group-hover:scale-150"
                        style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.05) 0%, rgba(255,255,255,0) 70%)' }}>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[0.9rem] font-bold text-[#8892b0] tracking-[1px] uppercase mb-4">
                            <Bell className="w-[18px] h-[18px] text-[#f9b012]" strokeWidth={2} />
                            ORGANIZATION ANNOUNCEMENTS
                        </div>
                        <div className="mt-4 space-y-3">
                            {announcements.map((a, i) => (
                                <div key={i} className={`flex gap-3 pb-3 ${i < announcements.length - 1 ? 'border-b border-[#eee]' : ''}`}>
                                    <div className="text-[0.7rem] text-[#f9b012] font-bold min-w-[40px]">{a.date}</div>
                                    <div>
                                        <div className="text-[0.85rem] text-[#1a367c] font-semibold leading-snug">{a.title}</div>
                                        <div className="text-[0.75rem] text-[#8892b0] mt-0.5">{a.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-10 h-1 bg-[#f9b012] rounded mt-6 transition-all duration-300 group-hover:w-20"></div>
                </motion.div>

                {/* Upcoming Holidays */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: 'rgba(255,107,0,0.3)' }}
                    className="bg-white rounded-[24px] p-10 shadow-sm border border-[rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group"
                    style={{ minHeight: '280px' }}
                >
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-bl-full transition-transform duration-500 group-hover:scale-150"
                        style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.05) 0%, rgba(255,255,255,0) 70%)' }}>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[0.9rem] font-bold text-[#8892b0] tracking-[1px] uppercase mb-4">
                            <Calendar className="w-[18px] h-[18px] text-[#f9b012]" strokeWidth={2} />
                            UPCOMING HOLIDAYS
                        </div>
                        <div className="mt-4 space-y-3">
                            {holidays.map((h, i) => (
                                <div key={i} className={`flex gap-3 pb-3 ${i < holidays.length - 1 ? 'border-b border-[#eee]' : ''}`}>
                                    <div className="text-[0.7rem] text-[#f9b012] font-bold min-w-[40px]">{h.date}</div>
                                    <div>
                                        <div className="text-[0.85rem] text-[#1a367c] font-semibold leading-snug">{h.title}</div>
                                        <div className="text-[0.75rem] text-[#8892b0] mt-0.5">{h.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-10 h-1 bg-[#f9b012] rounded mt-6 transition-all duration-300 group-hover:w-20"></div>
                </motion.div>

            </div>

        </motion.div>
    );
}

export default HardwareDashboard;