import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, Calendar, MapPin, CheckSquare, ArrowRight } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const announcements = [
    { date: 'FEB 10', title: 'Town Hall Meeting', sub: 'Quadrimester updates with CEO. 4:00 PM IST.' },
    { date: 'FEB 08', title: 'Policy Update: Remote Work', sub: 'Revised guidelines available in HR Registry.' },
];

const holidays = [
    { date: 'FEB 26', title: 'Maha Shivratri', sub: 'Public Holiday' },
    { date: 'MAR 14', title: 'Holi', sub: 'Festival of Colors' },
];

const stats = [
    {
        label: 'Total Slots', value: '37',
        iconBg: '#FFF9E6', iconColor: '#FFB012',
        icon: <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>P</span>
    },
    {
        label: 'Available', value: '24',
        iconBg: '#E8F5E9', iconColor: '#22C55E',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        )
    },
    {
        label: 'Occupied', value: '11',
        iconBg: '#FFF9E6', iconColor: '#FFB012',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
        )
    },
    {
        label: 'Disabled', value: '2',
        iconBg: '#FFEBEE', iconColor: '#EF4444',
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
        )
    },
];

function ParkingDashboard() {
    const navigate = useNavigate();

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

            {/* Page Title */}
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-[#20323c] mb-1">
                    PARKING <span className="text-[#f9b012]">MANAGER</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Slot & Capacity Controls
                </p>
            </motion.div>

            {/* Top 3 Dashboard Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Leave Requests Card */}
                <motion.div
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: 'rgba(255,107,0,0.3)' }}
                    className="bg-white rounded-[24px] p-10 shadow-sm border border-[rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group"
                    style={{ minHeight: '320px' }}
                >
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-bl-full transition-transform duration-500 group-hover:scale-150"
                        style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.05) 0%, rgba(255,255,255,0) 70%)' }}>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-[0.9rem] font-bold text-[#8892b0] tracking-[1px] uppercase mb-4">
                            <FileText className="w-[18px] h-[18px] text-[#f9b012]" strokeWidth={2} />
                            LEAVE REQUESTS
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#20323c] leading-tight mb-2"
                            style={{ background: 'linear-gradient(45deg, #20323c, #2d3436)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            3 Pending<br />Approvals
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/manager/parking/requests')}
                            className="bg-[#20323c] text-white flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold tracking-[0.5px] hover:shadow-[0_8px_20px_rgba(10,25,47,0.2)] hover:-translate-y-0.5 transition-all relative overflow-hidden"
                        >
                            REVIEW REQUESTS
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-1 bg-[#f9b012] rounded mt-6 transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>

                {/* Announcements Card */}
                <motion.div
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: 'rgba(255,107,0,0.3)' }}
                    className="bg-white rounded-[24px] p-10 shadow-sm border border-[rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group"
                    style={{ minHeight: '320px' }}
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
                                        <div className="text-[0.85rem] text-[#20323c] font-semibold leading-snug">{a.title}</div>
                                        <div className="text-[0.75rem] text-[#8892b0] mt-0.5">{a.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-10 h-1 bg-[#f9b012] rounded mt-6 transition-all duration-300 group-hover:w-20"></div>
                </motion.div>

                {/* Upcoming Holidays Card */}
                <motion.div
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: 'rgba(255,107,0,0.3)' }}
                    className="bg-white rounded-[24px] p-10 shadow-sm border border-[rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group"
                    style={{ minHeight: '320px' }}
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
                                        <div className="text-[0.85rem] text-[#20323c] font-semibold leading-snug">{h.title}</div>
                                        <div className="text-[0.75rem] text-[#8892b0] mt-0.5">{h.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <button className="bg-[#20323c] text-white flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold tracking-[0.5px] hover:shadow-[0_8px_20px_rgba(10,25,47,0.2)] hover:-translate-y-0.5 transition-all">
                            VIEW CALENDAR
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-1 bg-[#f9b012] rounded mt-6 transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Parking Overview Stats */}
            <motion.div variants={itemVariants}>
                <div className="text-[0.8rem] font-bold text-[#20323c] uppercase tracking-[1px] mb-5">PARKING OVERVIEW</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                            className="bg-white flex items-center justify-between gap-5 px-7 py-6 rounded-2xl shadow-sm border border-[rgba(0,0,0,0.03)] transition-all"
                        >
                            <div className="flex flex-col">
                                <div className="text-[0.8rem] text-[#8892b0] font-semibold mb-2">{stat.label}</div>
                                <div className="text-[2.2rem] font-extrabold text-[#20323c] leading-none">{stat.value}</div>
                            </div>
                            <div
                                className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                                style={{ background: stat.iconBg, color: stat.iconColor }}
                            >
                                {stat.icon}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

        </motion.div>
    );
}

export default ParkingDashboard;