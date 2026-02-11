import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle, AlertTriangle, Coffee } from 'lucide-react';

const MyAttendance = () => {
    const stats = [
        { label: 'Present Days', value: '18', total: '/ 22', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Leaves Taken', value: '1', total: '/ 12', icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Avg Hours', value: '8.4', total: 'Hrs', icon: Clock, color: 'text-[#f9b012]', bg: 'bg-orange-50' },
        { label: 'Pending Approvals', value: '0', total: 'Req', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    const logs = [
        { date: 'Feb 10, 2026', checkIn: '09:02 AM', checkOut: '06:15 PM', status: 'Present', duration: '9h 13m' },
        { date: 'Feb 09, 2026', checkIn: '08:55 AM', checkOut: '06:05 PM', status: 'Present', duration: '9h 10m' },
        { date: 'Feb 08, 2026', checkIn: '-', checkOut: '-', status: 'Weekend', duration: '-' },
        { date: 'Feb 07, 2026', checkIn: '-', checkOut: '-', status: 'Weekend', duration: '-' },
        { date: 'Feb 06, 2026', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'Present', duration: '9h 15m' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] flex items-center gap-2">
                        MY ATTENDANCE <span className="text-[#f9b012]">& LEAVES</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium mt-1 uppercase tracking-wide">
                        Personal Attendance Records & Leave Application
                    </p>
                </div>
                <button className="bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    APPLY FOR LEAVE
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-5"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-[#1a367c]">{stat.value}</span>
                                <span className="text-xs font-bold text-[#8892b0]">{stat.total}</span>
                            </div>
                            <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wide">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Attendance Log Table */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest">Recent Activity Log</h3>
                    <div className="text-xs font-bold text-[#8892b0]">FEB 2026</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#f8f9fa]">
                            <tr>
                                <th className="px-8 py-4 text-left text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-left text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Check In</th>
                                <th className="px-8 py-4 text-left text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Check Out</th>
                                <th className="px-8 py-4 text-left text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Status</th>
                                <th className="px-8 py-4 text-left text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-5 text-sm font-bold text-[#1a367c]">{log.date}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{log.checkIn}</td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-600">{log.checkOut}</td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[0.65rem] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${log.status === 'Present' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-[#1a367c]">{log.duration}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyAttendance;
