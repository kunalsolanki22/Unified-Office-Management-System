import { motion } from 'framer-motion';
import { FileText, Megaphone, Calendar, Users, Activity, UserMinus, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Total Employees', value: '1,248', icon: Users, color: 'text-[#1a367c]', bg: 'bg-[#1a367c]/10' },
        { label: 'Active Today', value: '1,180', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'On Leave', value: '42', icon: UserMinus, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: 'Ongoing Projects', value: '8', icon: Briefcase, color: 'text-[#f9b012]', bg: 'bg-[#f9b012]/10' },
    ];

    const projects = [
        {
            title: 'AI Attendance System',
            subtitle: 'Automated facial recognition integration',
            lead: 'Sarah Miller',
            deadline: 'Mar 15, 2026',
            progress: 75,
            status: 'In Progress',
            statusColor: 'bg-[#1a367c]/10 text-[#1a367c]',
            iconColor: 'bg-[#1a367c]/10 text-[#1a367c]'
        },
        {
            title: 'Hardware Refresh Q2',
            subtitle: 'Company-wide laptop upgrade cycle',
            lead: 'David Chen',
            deadline: 'Apr 01, 2026',
            progress: 20,
            status: 'Planning',
            statusColor: 'bg-[#f9b012]/10 text-[#f9b012]',
            iconColor: 'bg-[#f9b012]/10 text-[#f9b012]'
        },
        {
            title: 'Cafeteria Expansion',
            subtitle: 'New seating area construction',
            lead: 'Elena Vance',
            deadline: 'Feb 28, 2026',
            progress: 90,
            status: 'In Review',
            statusColor: 'bg-green-500/10 text-green-500',
            iconColor: 'bg-green-500/10 text-green-500'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Top Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Project Requests */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-radial-gradient from-orange-500/5 to-transparent rounded-bl-full transform scale-100 group-hover:scale-150 transition-transform duration-500"></div>
                    <div>
                        <div className="flex items-center gap-2.5 text-sm font-bold text-[#8892b0] tracking-widest uppercase mb-4">
                            <FileText className="w-4 h-4 text-[#f9b012]" />
                            PROJECT REQUESTS
                        </div>
                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#1a367c] to-[#2d3436] mb-3 leading-tight">
                            3 Pending<br />Approvals
                        </div>
                        <p className="text-[#8892b0] text-sm leading-relaxed max-w-[90%]">
                            Review resource allocation and project initiation requests from Team Leads.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/attendance-manager/approvals')}
                            className="bg-[#1a367c] text-white px-7 py-3.5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group/btn"
                        >
                            <span className="relative z-10">REVIEW REQUESTS</span>
                            <ChevronRight className="w-4 h-4 relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                        </button>
                        <div className="w-10 h-1 bg-[#f9b012] rounded-full mt-6 group-hover:w-20 transition-all duration-300"></div>
                    </div>
                </motion.div>

                {/* Organization Announcements */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-radial-gradient from-orange-500/5 to-transparent rounded-bl-full transform scale-100 group-hover:scale-150 transition-transform duration-500"></div>
                    <div>
                        <div className="flex items-center gap-2.5 text-sm font-bold text-[#8892b0] tracking-widest uppercase mb-4">
                            <Megaphone className="w-4 h-4 text-[#f9b012]" />
                            ORGANIZATION ANNOUNCEMENTS
                        </div>
                        <div className="space-y-4 mt-6">
                            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[40px]">FEB 10</div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c] mb-1">Town Hall Meeting</div>
                                    <div className="text-xs text-[#8892b0]">Quadrimester updates with CEO. 4:00 PM IST.</div>
                                </div>
                            </div>
                            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[40px]">FEB 08</div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c] mb-1">Policy Update: Remote Work</div>
                                    <div className="text-xs text-[#8892b0]">Revised guidelines available in HR Registry.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Upcoming Holidays */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden group hover:-translate-y-2 hover:shadow-lg transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-radial-gradient from-orange-500/5 to-transparent rounded-bl-full transform scale-100 group-hover:scale-150 transition-transform duration-500"></div>
                    <div>
                        <div className="flex items-center gap-2.5 text-sm font-bold text-[#8892b0] tracking-widest uppercase mb-4">
                            <Calendar className="w-4 h-4 text-[#f9b012]" />
                            UPCOMING HOLIDAYS
                        </div>
                        <div className="space-y-4 mt-6">
                            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[40px]">FEB 26</div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c] mb-1">Maha Shivratri</div>
                                    <div className="text-xs text-[#8892b0]">Public Holiday</div>
                                </div>
                            </div>
                            <div className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                <div className="text-xs font-bold text-[#f9b012] min-w-[40px]">MAR 14</div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c] mb-1">Holi</div>
                                    <div className="text-xs text-[#8892b0]">Festival of Colors</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={() => navigate('/attendance-manager/holidays')}
                            className="bg-[#1a367c] text-white px-7 py-3.5 rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group/btn"
                        >
                            <span className="relative z-10">VIEW CALENDAR</span>
                            <ChevronRight className="w-4 h-4 relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                        </button>
                        <div className="w-10 h-1 bg-[#f9b012] rounded-full mt-6 group-hover:w-20 transition-all duration-300"></div>
                    </div>
                </motion.div>
            </div>

            {/* Attendance Overview Stats */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-sm font-bold text-[#1a367c] tracking-widest uppercase">ATTENDANCE OVERVIEW</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                        >
                            <div className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">{stat.value}</div>
                                <div className="text-[0.7rem] font-bold text-[#8892b0] tracking-wider uppercase">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Ongoing Project Details */}
            <div>
                <div className="flex justify-between items-center mb-6 mt-4">
                    <h2 className="text-sm font-bold text-[#1a367c] tracking-widest uppercase">ONGOING PROJECT DETAILS</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {projects.map((project, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            className="bg-white p-6 rounded-[20px] shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex justify-between items-center mb-5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${project.iconColor}`}>
                                    <Briefcase className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div className={`text-[0.65rem] font-bold px-3 py-1 rounded-full uppercase tracking-wide ${project.statusColor}`}>
                                    {project.status}
                                </div>
                            </div>

                            <h3 className="text-base font-bold text-[#1a367c] mb-1.5">{project.title}</h3>
                            <p className="text-sm text-[#8892b0] mb-5 leading-relaxed">{project.subtitle}</p>

                            <div className="flex justify-between pb-5 border-b border-slate-50 mb-5">
                                <div>
                                    <div className="text-[0.65rem] font-semibold text-[#8892b0] uppercase mb-1">Team Lead</div>
                                    <div className="text-sm font-bold text-[#1a367c]">{project.lead}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[0.65rem] font-semibold text-[#8892b0] uppercase mb-1">Deadline</div>
                                    <div className="text-sm font-bold text-[#1a367c]">{project.deadline}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#1a367c] rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs font-bold text-[#1a367c]">{project.progress}%</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
