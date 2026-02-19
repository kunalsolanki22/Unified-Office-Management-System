import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    CalendarCheck,
    CalendarDays,
    Bell,
    X,
    Plus,
    Car,
    Coffee,
    Monitor,
    Users,
    HardDrive,
    ArrowRight,
    Loader2
} from 'lucide-react';
import ActionHub from './ActionHub';

// ... (imports remain the same, ensure ActionHub is imported)

const Dashboard = () => {
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState([]);
    const [loadingHolidays, setLoadingHolidays] = useState(true);

    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                setLoadingHolidays(true);
                const res = await holidayService.getHolidays({ upcoming_only: true, page_size: 3 });
                setHolidays(res?.data ?? []);
            } catch { setHolidays([]); }
            finally { setLoadingHolidays(false); }
        };
        fetchHolidays();
    }, []);

    const formatHolidayDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    };

    const [announcements, setAnnouncements] = useState([
        { id: 1, date: 'FEB 10', title: 'Town Hall Meeting', desc: 'Quadrimester updates with CEO. 4:00 PM IST.' },
        { id: 2, date: 'FEB 08', title: 'Policy Update: Remote Work', desc: 'Revised guidelines available in HR Registry.' }
    ]);
    const [showForm, setShowForm] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ date: '', title: '', desc: '' });

    const handleAddAnnouncement = () => {
        if (newAnnouncement.date && newAnnouncement.title && newAnnouncement.desc) {
            setAnnouncements([{ id: Date.now(), ...newAnnouncement }, ...announcements]);
            setNewAnnouncement({ date: '', title: '', desc: '' });
            setShowForm(false);
        }
    };

    const handleDeleteAnnouncement = (id) => {
        if (window.confirm('Are you sure you want to remove this announcement?')) {
            setAnnouncements(announcements.filter(a => a.id !== id));
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Admin Attendance Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-4">
                            <CalendarCheck className="w-4 h-4 text-[#f9b012]" />
                            ADMIN ATTENDANCE
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] leading-tight mb-2 bg-gradient-to-r from-[#1a367c] to-[#2c4a96] bg-clip-text text-transparent">
                            Verification<br />Pending
                        </div>
                        <p className="text-[#8892b0] text-[0.95rem] leading-relaxed max-w-[90%]">
                            System-wide verification cycle for Feb 24 requires immediate attention.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/super-admin/attendance')}
                            className="bg-[#1a367c] text-white px-7 py-3.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-3 hover:bg-[#2c4a96] transition-all hover:shadow-lg hover:shadow-blue-900/20 group/btn"
                        >
                            LAUNCH ADJUDICATION
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                        <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>

                {/* Organization Announcements Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col min-h-[320px] relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                    <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-6">
                        <Bell className="w-4 h-4 text-[#f9b012]" />
                        ORGANIZATION ANNOUNCEMENTS
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        <AnimatePresence>
                            {announcements.map((ann) => (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex gap-4 pb-4 border-b border-slate-100 group/item relative"
                                >
                                    <button
                                        onClick={() => handleDeleteAnnouncement(ann.id)}
                                        className="absolute right-0 top-0 w-6 h-6 bg-red-50 text-red-500 rounded flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">{ann.date}</div>
                                    <div className="flex-1 pr-6">
                                        <div className="font-bold text-[#1a367c] text-sm mb-1">{ann.title}</div>
                                        <div className="text-xs text-[#8892b0]">{ann.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-dashed border-slate-200 mt-4 pt-4 overflow-hidden"
                            >
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="DATE (e.g. FEB 12)"
                                        className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200 focus:outline-none focus:border-[#1a367c]"
                                        value={newAnnouncement.date}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, date: e.target.value.toUpperCase() })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="TITLE"
                                        className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200 focus:outline-none focus:border-[#1a367c]"
                                        value={newAnnouncement.title}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="DESCRIPTION"
                                        className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200 focus:outline-none focus:border-[#1a367c]"
                                        value={newAnnouncement.desc}
                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, desc: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAddAnnouncement}
                                            className="flex-1 bg-[#1a367c] text-white text-[0.65rem] font-bold py-2 rounded hover:bg-[#2c4a96]"
                                        >
                                            PUBLISH
                                        </button>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="flex-1 bg-slate-100 text-[#8892b0] text-[0.65rem] font-bold py-2 rounded hover:bg-slate-200"
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!showForm && (
                        <div className="mt-4 pt-2">
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-[#1a367c] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#2c4a96] transition-all shadow-md hover:shadow-lg"
                            >
                                <Plus className="w-3.5 h-3.5" /> POST UPDATE
                            </button>
                        </div>
                    )}
                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>

                {/* Upcoming Holidays Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col min-h-[320px] relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                    <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-6">
                        <CalendarDays className="w-4 h-4 text-[#f9b012]" />
                        UPCOMING HOLIDAYS
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {loadingHolidays ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            </div>
                        ) : holidays.length > 0 ? (
                            holidays.map((h) => (
                                <div key={h.id} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">
                                        {formatHolidayDate(h.date)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-[#1a367c] text-sm mb-1">{h.name}</div>
                                        <div className="text-xs text-[#8892b0]">{h.holiday_type || 'Public Holiday'}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-[#8892b0]">
                                <CalendarDays className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium">No upcoming holidays</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50">
                        <button
                            onClick={() => navigate('/super-admin/holidays')}
                            className="w-full bg-[#f8f9fa] text-[#1a367c] py-3 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a367c] hover:text-white transition-all group/btn"
                        >
                            VIEW CALENDAR
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </div>
                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>
            </div>

            {/* Quick Actions - Replaced with Shared Component */}
            <motion.div variants={itemVariants}>
                <ActionHub />
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;

