import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CalendarCheck,
    Bell,
    CalendarDays,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import { holidayService } from '../../services/holidayService';

const Dashboard = () => {
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState('—');
    const [holidays, setHolidays] = useState([]);
    const [loadingHolidays, setLoadingHolidays] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const leaveRes = await leaveService.getPendingLeaves({ page_size: 1 });
                setPendingCount(leaveRes?.total ?? 0);
            } catch { setPendingCount(0); }

            try {
                setLoadingHolidays(true);
                const holRes = await holidayService.getHolidays({ upcoming_only: true, page_size: 3 });
                setHolidays(holRes?.data ?? []);
            } catch { setHolidays([]); }
            finally { setLoadingHolidays(false); }
        };
        fetchData();
    }, []);

    const formatHolidayDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Requests Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[#8892b0] font-bold text-sm tracking-widest mb-4">
                            <CalendarCheck className="w-4 h-4 text-[#f9b012]" />
                            LEAVE APPROVALS
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] leading-tight mb-2 bg-gradient-to-r from-[#1a367c] to-[#2c4a96] bg-clip-text text-transparent">
                            {pendingCount === '—' ? (
                                <span className="text-3xl text-slate-300">—</span>
                            ) : (
                                <>{pendingCount} Pending<br />Approval{pendingCount !== 1 ? 's' : ''}</>
                            )}
                        </div>
                        <p className="text-[#8892b0] text-[0.95rem] leading-relaxed max-w-[90%]">
                            Review leave requests submitted by your team members.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/reporting-manager/approvals')}
                            className="bg-[#1a367c] text-white px-7 py-3.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-3 hover:bg-[#2c4a96] transition-all hover:shadow-lg hover:shadow-blue-900/20 group/btn"
                        >
                            REVIEW REQUESTS
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-[#8892b0]">
                        <Bell className="w-10 h-10 mb-3 opacity-15" />
                        <p className="text-sm font-medium">No announcements at this time.</p>
                        <p className="text-xs mt-1 opacity-70">Check back later for updates.</p>
                    </div>
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
                            onClick={() => navigate('/reporting-manager/holidays')}
                            className="w-full bg-[#f8f9fa] text-[#1a367c] py-3 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a367c] hover:text-white transition-all group/btn"
                        >
                            VIEW CALENDAR
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </div>
                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
