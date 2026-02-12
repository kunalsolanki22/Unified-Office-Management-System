import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Bookmark, Search } from 'lucide-react';

import Calendar from '../../components/ui/Calendar';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

const Holidays = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

    // const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    // const dates = Array.from({ length: 28 }, (_, i) => i + 1); // Feb 2026 has 28 days

    const [holidays] = useState([
        { date: 'Jan 26, 2026', name: 'Republic Day', day: 'Monday', category: 'NATIONAL', status: 'COMPLETED', color: 'text-green-500' },
        { date: 'Feb 26, 2026', name: 'Maha Shivratri', day: 'Thursday', category: 'RELIGIOUS', status: 'UPCOMING', color: 'text-[#f9b012]' },
        { date: 'Mar 14, 2026', name: 'Holi', day: 'Saturday', category: 'FESTIVAL', status: 'SCHEDULED', color: 'text-slate-400' },
        { date: 'Mar 29, 2026', name: 'Ram Navami', day: 'Sunday', category: 'RELIGIOUS', status: 'SCHEDULED', color: 'text-slate-400' },
        { date: 'Apr 10, 2026', name: 'Good Friday', day: 'Friday', category: 'RELIGIOUS', status: 'SCHEDULED', color: 'text-slate-400' },
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredHolidays = holidays.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.date.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    HOLIDAY <span className="text-[#f9b012]">REGISTRY</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Manage Global Off-Days for the Administrative Force
                </p>
            </div>

            <div className={`grid grid-cols-1 gap-8 ${isSuperAdmin ? 'lg:grid-cols-[2fr_1fr]' : ''}`}>
                {/* Calendar Card */}
                <Calendar events={holidays} />

                {/* Proclaim Form - Only for Super Admin */}
                {isSuperAdmin && (
                    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                        <h3 className="text-lg font-bold text-[#1a367c] mb-8">PROCLAIM HOLIDAY</h3>

                        <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider block">EVENT NAME</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Maha Shivratri"
                                    className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium placeholder:text-[#999]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider block">EXECUTION DATE</label>
                                <input
                                    type="text"
                                    placeholder="dd / mm / yyyy"
                                    className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium placeholder:text-[#999]"
                                />
                            </div>
                        </div>

                        <button className="w-full mt-auto bg-[#1a367c] text-white py-4 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2">
                            + COMMIT TO REGISTRY
                        </button>
                    </div>
                )}
            </div>

            {/* List Section */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <div className="flex items-center gap-3 text-[#1a367c] font-bold text-lg">
                        <Bookmark className="w-5 h-5" />
                        ANNOUNCED HOLIDAYS
                    </div>
                    {/* Search Bar */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm w-[250px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search holidays..."
                            className="ml-3 bg-transparent border-none outline-none text-xs font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#f8f9fa] text-left">
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Date</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Event Name</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Day</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Category</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHolidays.length > 0 ? (
                                filteredHolidays.map((h, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-[#fafbfb] transition-colors last:border-none">
                                        <td className="p-6 text-sm font-bold text-[#1a367c]">{h.date}</td>
                                        <td className="p-6 text-sm font-medium text-[#1a367c]">{h.name}</td>
                                        <td className="p-6 text-sm text-[#8892b0]">{h.day}</td>
                                        <td className="p-6">
                                            <span className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide bg-[#f9b012]/10 text-[#f9b012] uppercase">
                                                {h.category}
                                            </span>
                                        </td>
                                        <td className={`p-6 text-xs font-bold tracking-wide uppercase ${h.color}`}>
                                            {h.status}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400 text-sm font-medium italic">
                                        No holidays match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default Holidays;
