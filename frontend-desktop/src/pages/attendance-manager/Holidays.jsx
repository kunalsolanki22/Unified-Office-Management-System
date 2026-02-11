import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const Holidays = () => {
    const upcomingHolidays = [
        { date: 'FEB 26', name: 'Maha Shivratri', type: 'Public Holiday', day: 'Wednesday' },
        { date: 'MAR 14', name: 'Holi', type: 'Festival', day: 'Friday' },
        { date: 'MAR 30', name: 'Idul Fitr', type: 'Public Holiday', day: 'Monday' },
        { date: 'APR 10', name: 'Ram Navami', type: 'Restricted Holiday', day: 'Thursday' },
    ];

    const calendarGrid = Array(35).fill(null).map((_, i) => i + 1); // Simple grid for visual

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#1a367c] flex items-center gap-2">
                    HOLIDAY <span className="text-[#f9b012]">REGISTRY</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium mt-1 uppercase tracking-wide">
                    Organizational Calendar & Leave Planning
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming List */}
                <div className="lg:col-span-1 space-y-6">
                    <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest flex items-center gap-2.5">
                        <CalendarIcon className="w-5 h-5" />
                        UPCOMING PUBLIC HOLIDAYS
                    </h3>

                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="divide-y divide-slate-50">
                            {upcomingHolidays.map((holiday, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 hover:bg-slate-50 transition-colors group cursor-pointer"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="bg-[#f8f9fa] rounded-xl p-3 min-w-[70px] text-center border border-slate-100 group-hover:border-[#f9b012] transition-colors">
                                            <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase mb-1">{holiday.date.split(' ')[0]}</div>
                                            <div className="text-xl font-extrabold text-[#1a367c]">{holiday.date.split(' ')[1]}</div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#1a367c] mb-1">{holiday.name}</h4>
                                            <div className="text-xs text-[#8892b0] font-medium uppercase tracking-wide">
                                                {holiday.day} • <span className="text-[#f9b012]">{holiday.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                            <button className="text-xs font-bold text-[#1a367c] uppercase tracking-widest hover:text-[#f9b012] transition-colors">
                                Download Yearly Calendar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar View */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest flex items-center gap-2.5">
                            CALENDAR VIEW
                        </h3>
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                            <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronLeft className="w-4 h-4 text-[#1a367c]" />
                            </button>
                            <span className="text-xs font-bold text-[#1a367c] uppercase tracking-widest w-[100px] text-center">FEB 2026</span>
                            <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronRight className="w-4 h-4 text-[#1a367c]" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 mb-6">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <div key={day} className="text-center text-[0.65rem] font-bold text-[#8892b0] tracking-widest">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-4">
                            {/* Empty slots for start of month */}
                            {[...Array(6)].map((_, i) => <div key={`empty-${i}`}></div>)}

                            {/* Days */}
                            {[...Array(28)].map((_, i) => {
                                const day = i + 1;
                                const isHoliday = day === 26;
                                const isWeekend = (i + 7) % 7 === 0 || (i + 7) % 7 === 6; // Mock weekend logic

                                return (
                                    <div
                                        key={day}
                                        className={`
                                            aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer group transition-all
                                            ${isHoliday ? 'bg-[#f9b012] text-white shadow-md shadow-orange-200 scale-105' : 'hover:bg-slate-50 text-[#1a367c]'}
                                            ${day === 10 ? 'border-2 border-[#1a367c]' : ''}
                                        `}
                                    >
                                        <span className={`text-sm font-bold ${isWeekend && !isHoliday ? 'text-red-300' : ''}`}>{day}</span>
                                        {isHoliday && (
                                            <div className="absolute bottom-2 w-1 h-1 bg-white rounded-full"></div>
                                        )}
                                        {day === 10 && (
                                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1a367c] rounded-full border-2 border-white"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Holidays;
