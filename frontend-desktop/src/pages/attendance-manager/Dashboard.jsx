import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CalendarCheck,
    Bell,
    CalendarDays,
    ArrowRight,
    Users,
    CheckCircle,
    AlertCircle,
    Clock,
    Activity,
    Car,
    Coffee,
    Monitor,
    HardDrive
} from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

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
                            PROJECT REQUESTS
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] leading-tight mb-2 bg-gradient-to-r from-[#1a367c] to-[#2c4a96] bg-clip-text text-transparent">
                            3 Pending<br />Approvals
                        </div>
                        <p className="text-[#8892b0] text-[0.95rem] leading-relaxed max-w-[90%]">
                            Review resource allocation and project initiation requests from Team Leads.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <button
                            onClick={() => navigate('/attendance-manager/attendance')}
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

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {[
                            { date: 'FEB 10', title: 'Town Hall Meeting', desc: 'Quadrimester updates with CEO. 4:00 PM IST.' },
                            { date: 'FEB 08', title: 'Policy Update: Remote Work', desc: 'Revised guidelines available in HR Registry.' }
                        ].map((ann, idx) => (
                            <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">{ann.date}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-[#1a367c] text-sm mb-1">{ann.title}</div>
                                    <div className="text-xs text-[#8892b0]">{ann.desc}</div>
                                </div>
                            </div>
                        ))}
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
                        {[
                            { date: 'FEB 26', title: 'Maha Shivratri', desc: 'Public Holiday' },
                            { date: 'MAR 14', title: 'Holi', desc: 'Festival of Colors' }
                        ].map((holiday, idx) => (
                            <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 last:mb-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[50px] pt-1">{holiday.date}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-[#1a367c] text-sm mb-1">{holiday.title}</div>
                                    <div className="text-xs text-[#8892b0]">{holiday.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50">
                        <button
                            onClick={() => navigate('/attendance-manager/holidays')}
                            className="w-full bg-[#f8f9fa] text-[#1a367c] py-3 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a367c] hover:text-white transition-all group/btn"
                        >
                            VIEW CALENDAR
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </div>


                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="flex items-center justify-between mb-6 mt-10">
                <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">ATTENDANCE OVERVIEW</h3>
            </motion.div>

            <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Total Employees */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-[#1a367c]/10 text-[#1a367c] flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">1,248</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Total Employees</div>
                    </div>
                </motion.div>

                {/* Active Employees */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">1,180</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Active Today</div>
                    </div>
                </motion.div>

                {/* On Leave */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">42</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">On Leave</div>
                    </div>
                </motion.div>

                {/* Pending Requests */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-[#f9b012]/10 text-[#f9b012] flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">8</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Pending Request</div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-between mb-6 mt-10">
                <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">ACTIVITY STATUS</h3>
            </motion.div>

            <motion.div variants={containerVariants} className="flex flex-col gap-4 mb-10">
                <motion.div variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-5 transition-all hover:translate-x-1 hover:shadow-md relative">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center shrink-0 text-green-500 z-10 relative">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2 gap-4">
                            <h4 className="text-[0.95rem] font-bold text-[#1a367c] m-0">Marked Attendance</h4>
                            <span className="text-xs text-[#8892b0] font-semibold whitespace-nowrap">Just now</span>
                        </div>
                        <p className="text-[0.85rem] text-slate-500 italic mb-3">Successfully checked in at 09:15 AM - On time arrival</p>
                        <span className="inline-block text-[0.65rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-green-500/10 text-green-500">Attendance</span>
                    </div>
                </motion.div>
            </motion.div>


            {/* Quick Actions */}
            <div>
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between mb-6"
                >
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">QUICK ACTIONS</h3>
                </motion.div>

                <div className="flex flex-wrap justify-center gap-6">
                    {[
                        { icon: Car, label: 'PARKING MANAGER', sub: 'Slot & Capacity Controls' },
                        { icon: Coffee, label: 'CAFETERIA OPS', sub: 'Food Provisioning Oversight' },
                        { icon: Monitor, label: 'DESK MANAGEMENT', sub: 'Workspace Allocation' },
                        { icon: Users, label: 'CONFERENCE MGMT', sub: 'Room Booking & Scheduling' },
                        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment' },
                    ].map((action, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            whileHover={{ y: -8, boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)' }}
                            onClick={() => navigate('/attendance-manager/action-hub')}
                            className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-radial-gradient from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:text-[#f9b012] transition-colors relative z-10">
                                <action.icon className="w-7 h-7" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2 leading-tight relative z-10">
                                {action.label.split(' ').map((line, i) => (
                                    <span key={i} className="block">{line}</span>
                                ))}
                            </h3>
                            <p className="text-[0.65rem] text-[#8892b0] font-medium relative z-10">{action.sub}</p>

                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div >
    );
};

export default Dashboard;
