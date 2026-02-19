import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Bell,
    CalendarDays,
    ArrowRight,
    Monitor,
    Projector,
    ClipboardList,
    Users
} from 'lucide-react';
import { deskService } from '../../services/deskService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalDesks: 0, availableDesks: 0, bookedDesks: 0, totalRooms: 0, pendingBookings: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const desksRes = await deskService.getDesks({ page_size: 100 });
                const desksArray = desksRes.data || [];
                const totalDesks = desksRes.total || desksArray.length;

                const today = new Date().toISOString().split('T')[0];
                let activeDeskBookings = 0;
                try {
                    const deskBookingsRes = await deskService.getDeskBookings({ page_size: 100 });
                    const deskBookingsArray = deskBookingsRes.data || [];
                    activeDeskBookings = deskBookingsArray.filter(b => {
                        const status = b.status.toLowerCase();
                        if (status !== 'confirmed' && status !== 'checked_in') return false;
                        return b.start_date <= today && b.end_date >= today;
                    }).length;
                } catch (e) {
                    console.warn('Could not fetch desk bookings:', e.message);
                }

                const bookedDesks = activeDeskBookings;
                const maintenanceDesks = desksArray.filter(d => d.status.toUpperCase() === 'MAINTENANCE').length;
                const availableDesks = totalDesks - bookedDesks - maintenanceDesks;

                const roomsRes = await deskService.getRooms({ page_size: 100 });
                const totalRooms = roomsRes.total || (roomsRes.data || []).length;

                let pendingBookings = 0;
                try {
                    const pendingRes = await deskService.getPendingRoomBookings();
                    pendingBookings = pendingRes.total || (pendingRes.data || []).length;
                } catch (e) {
                    console.warn('Could not fetch pending bookings:', e.message);
                }

                setStats({ totalDesks, availableDesks, bookedDesks, totalRooms, pendingBookings });
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

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
                {/* Pending Requests Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-4">
                            <Projector className="w-4 h-4 text-[#f9b012]" />
                            CONFERENCE REQUESTS
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] leading-tight mb-2">
                            {stats.pendingBookings} Pending<br />Requests
                        </div>
                        <p className="text-[#8892b0] text-[0.95rem] leading-relaxed max-w-[90%]">
                            Conference room booking requests awaiting your approval.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/conference-desk-manager/conference-booking')}
                            className="bg-[#1a367c] text-white px-7 py-3.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-3 hover:bg-[#2c4a96] transition-all hover:shadow-lg group/btn"
                        >
                            REVIEW REQUESTS
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                        <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>

                {/* Announcements Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col min-h-[320px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
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
                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>

                {/* Holidays Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col min-h-[320px] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
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
                            onClick={() => navigate('/conference-desk-manager/holidays')}
                            className="w-full bg-[#f8f9fa] text-[#1a367c] py-3 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a367c] hover:text-white transition-all group/btn"
                        >
                            VIEW CALENDAR
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </div>
                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>
            </div>

            {/* Stats Overview */}
            <div>
                <motion.div variants={itemVariants} className="mb-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">WORKSPACE OVERVIEW</h3>
                </motion.div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    {[
                        { label: 'Total Desks', value: String(stats.totalDesks), bg: '#FFF9E6', color: '#FFB012', text: '🖥️' },
                        { label: 'Available', value: String(stats.availableDesks), bg: '#E8F5E9', color: '#22C55E', text: '✓' },
                        { label: 'Booked', value: String(stats.bookedDesks), bg: '#E3F2FD', color: '#2196F3', text: '👤' },
                        { label: 'Conf. Rooms', value: String(stats.totalRooms), bg: '#F3E5F5', color: '#9C27B0', text: '🏢' },
                        { label: 'Pending', value: String(stats.pendingBookings), bg: '#FFEBEE', color: '#EF4444', text: '⏳' },
                    ].map((stat) => (
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

            {/* Quick Actions */}
            <div>
                <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">QUICK ACTIONS</h3>
                </motion.div>
                <div className="flex flex-wrap justify-center gap-6">
                    {[
                        { icon: Monitor, label: 'MANAGE DESKS', sub: 'Slot Allocation', path: '/conference-desk-manager/desk-booking' },
                        { icon: Projector, label: 'CONFERENCE ROOMS', sub: 'Booking Management', path: '/conference-desk-manager/conference-booking' },
                        { icon: Users, label: 'USER DIRECTORY', sub: 'Employee Lookup', path: '/conference-desk-manager/user-directory' },
                        { icon: ClipboardList, label: 'MY ATTENDANCE', sub: 'View Logs', path: '/conference-desk-manager/my-attendance' },
                    ].map((action, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            whileHover={{ y: -8, boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)' }}
                            onClick={() => navigate(action.path)}
                            className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group"
                        >
                            <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:text-[#f9b012] transition-colors relative z-10">
                                <action.icon className="w-7 h-7" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2 leading-tight relative z-10">
                                {action.label}
                            </h3>
                            <p className="text-[0.65rem] text-[#8892b0] font-medium relative z-10">{action.sub}</p>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;