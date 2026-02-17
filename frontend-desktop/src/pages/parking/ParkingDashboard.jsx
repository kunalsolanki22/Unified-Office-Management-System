import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, MapPin, CheckSquare, ArrowRight, Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import { parkingService } from '../../services/parkingService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const ParkingDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, disabled: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const summaryRes = await parkingService.getSummary();
                console.log('Parking summary response:', summaryRes);
                const summaryData = summaryRes.data || summaryRes;
                setStats({
                    total: summaryData.total_slots ?? summaryData.total ?? 0,
                    available: summaryData.available_slots ?? summaryData.available ?? 0,
                    occupied: summaryData.occupied_slots ?? summaryData.occupied ?? 0,
                    disabled: summaryData.disabled_slots ?? summaryData.disabled ?? 0,
                });
            } catch (err) {
                console.error('Parking summary error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const quickActions = [
        { icon: Car,       label: 'PARKING MANAGER',  sub: 'Slot & Capacity Controls',      path: '/parking/slots' },
        { icon: Coffee,    label: 'CAFETERIA OPS',     sub: 'Food Provisioning Oversight',   path: '/parking/services' },
        { icon: Monitor,   label: 'DESK MANAGEMENT',   sub: 'Workspace Allocation',          path: '/parking/services' },
        { icon: Users,     label: 'CONFERENCE MGMT',   sub: 'Room Booking & Scheduling',     path: '/parking/services' },
        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment',          path: '/parking/services' },
    ];

    const statsCards = [
        { label: 'Total Slots',  value: String(stats.total),     bg: '#FFF9E6', color: '#FFB012', text: 'P' },
        { label: 'Available',    value: String(stats.available),  bg: '#E8F5E9', color: '#22C55E', text: '✓' },
        { label: 'Occupied',     value: String(stats.occupied),   bg: '#FFF9E6', color: '#FFB012', text: '⏱' },
        { label: 'Disabled',     value: String(stats.disabled),   bg: '#FFEBEE', color: '#EF4444', text: '✕' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[#8892b0] font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-4">
                            <Car className="w-4 h-4 text-[#f9b012]" />
                            PARKING REQUESTS
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] leading-tight mb-2">
                            Pending<br />Approvals
                        </div>
                        <p className="text-[#8892b0] text-[0.95rem] leading-relaxed max-w-[90%]">
                            Employee parking slot requests awaiting your review and approval.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/parking/requests')}
                            className="bg-[#1a367c] text-white px-7 py-3.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-3 hover:bg-[#2c4a96] transition-all hover:shadow-lg group/btn"
                        >
                            REVIEW REQUESTS
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                        <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col min-h-[320px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-6">
                        <Bell className="w-4 h-4 text-[#f9b012]" />
                        ORGANIZATION ANNOUNCEMENTS
                    </div>
                    <div className="flex-1 space-y-4">
                        {[
                            { date: 'FEB 10', title: 'Town Hall Meeting', desc: 'Quadrimester updates with CEO. 4:00 PM IST.' },
                            { date: 'FEB 08', title: 'Policy Update: Remote Work', desc: 'Revised guidelines available in HR Registry.' },
                        ].map((ann, idx) => (
                            <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">{ann.date}</div>
                                <div>
                                    <div className="font-bold text-[#1a367c] text-sm mb-1">{ann.title}</div>
                                    <div className="text-xs text-[#8892b0]">{ann.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col min-h-[320px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-6">
                        <CalendarDays className="w-4 h-4 text-[#f9b012]" />
                        UPCOMING HOLIDAYS
                    </div>
                    <div className="flex-1 space-y-4">
                        {[
                            { date: 'FEB 26', title: 'Maha Shivratri', desc: 'Public Holiday' },
                            { date: 'MAR 14', title: 'Holi', desc: 'Festival of Colors' },
                        ].map((holiday, idx) => (
                            <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">{holiday.date}</div>
                                <div>
                                    <div className="font-bold text-[#1a367c] text-sm mb-1">{holiday.title}</div>
                                    <div className="text-xs text-[#8892b0]">{holiday.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-50">
                        <button
                            onClick={() => navigate('/parking/holidays')}
                            className="w-full bg-[#f8f9fa] text-[#1a367c] py-3 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a367c] hover:text-white transition-all group/btn"
                        >
                            VIEW CALENDAR
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </div>
                </motion.div>
            </div>

            <div>
                <motion.div variants={itemVariants} className="mb-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">PARKING OVERVIEW</h3>
                </motion.div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {statsCards.map((stat) => (
                        <motion.div
                            key={stat.label}
                            variants={itemVariants}
                            className="bg-white flex items-center justify-between gap-4 px-6 py-5 rounded-[20px] shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                        >
                            <div>
                                <div className="text-[0.8rem] text-[#8892b0] font-semibold mb-1">{stat.label}</div>
                                <div className="text-[2rem] font-extrabold text-[#1a367c]">{stat.value}</div>
                            </div>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0"
                                style={{ background: stat.bg, color: stat.color }}>
                                {stat.text}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div>
                <motion.div variants={itemVariants} className="flex flex-col gap-1 mb-6">
                    <h3 className="text-2xl font-bold text-[#1a367c]">
                        QUICK <span className="text-[#f9b012]">ACTIONS</span>
                    </h3>
                    <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                        Access Frequently Used Services
                    </p>
                </motion.div>
                <div className="flex flex-wrap justify-center gap-6">
                    {quickActions.map((action, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            onClick={() => navigate(action.path)}
                            className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
                        >
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:bg-[#1a367c] group-hover:text-white transition-colors duration-300">
                                <action.icon className="w-7 h-7" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2">
                                {action.label.split(' ').map((word, i) => (
                                    <span key={i} className="block">{word}</span>
                                ))}
                            </h3>
                            <p className="text-xs text-[#8892b0] leading-relaxed mb-6 px-4">{action.sub}</p>
                            <div className="mt-auto opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <span className="text-xs font-bold text-[#f9b012] flex items-center gap-1">
                                    LAUNCH <ArrowRight className="w-3 h-3" />
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                        </motion.div>
                    ))}
                </div>
            </div>

        </motion.div>
    );
};

export default ParkingDashboard;