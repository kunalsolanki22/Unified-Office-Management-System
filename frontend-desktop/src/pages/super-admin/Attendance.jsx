import { useState } from 'react';
import { CheckCircle2, XCircle, Calendar, AlertCircle, Shield, Clock, MapPin, UserCheck, Timer } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const dailyAudits = [
    { id: 1, name: 'Karan Sharma', role: 'Food Admin', time: '09:24 AM', status: 'Flagged', statusType: 'danger', note: 'Late Clock-in (+24m)', avatar: 'K', color: 'bg-orange-500' },
    { id: 2, name: 'Priya Verma', role: 'Desk Admin', time: '08:58 AM', status: 'Verified', statusType: 'success', note: 'On-time Entry', avatar: 'P', color: 'bg-emerald-600' },
    { id: 3, name: 'Marcus Bell', role: 'Infrastructure', time: 'Pending', status: 'Pending', statusType: 'warning', note: 'System Check Required', avatar: 'M', color: 'bg-blue-600' },
    { id: 4, name: 'Sarah Miller', role: 'Regional Admin', time: '08:45 AM', status: 'Verified', statusType: 'success', note: 'Early Entry', avatar: 'S', color: 'bg-indigo-600' },
];

const leavePetitions = [
    { id: 1, name: 'Elena Vance', type: 'Emergency', duration: '2 Days', date: 'Feb 12 - Feb 14', description: 'Statement: Critical Family Matter. Operational redundancy confirmed via Node Cluster B.', approved: false, avatar: 'E', color: 'bg-rose-600' },
    { id: 2, name: 'David Chen', type: 'Annual Leave', duration: '5 Days', date: 'Mar 01 - Mar 05', description: 'Statement: Project Transition Break. Operational redundancy confirmed via Node Cluster B.', approved: false, avatar: 'D', color: 'bg-slate-600' },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const Attendance = () => {
    return (
        <motion.div
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        Attendance <span className="text-orange-500">Adjudication</span>
                        <Badge variant="outline" className="text-xs border-slate-300 text-slate-500 uppercase tracking-widest font-bold">Live Stream</Badge>
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Audit real-time performance & manage administrator clearances</p>
                </div>
                <div className="flex gap-3">
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 text-sm font-medium text-slate-600">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>Server Time: 10:48 AM</span>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Audit Column */}
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                            Daily Audit Log
                        </h2>
                        <Badge variant="primary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                            {dailyAudits.length} Active Records
                        </Badge>
                    </div>

                    <Card className="min-h-[600px] flex flex-col relative border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/50 p-1">
                        <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                            {dailyAudits.map((audit) => (
                                <motion.div
                                    key={audit.id}
                                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                                    className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-slate-100 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("h-12 w-12 rounded-2xl text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-200", audit.color)}>
                                            {audit.avatar}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-base">{audit.name}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-1">
                                                <span className="uppercase tracking-wide">{audit.role}</span>
                                                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                                <div className="flex items-center gap-1 text-slate-500">
                                                    <Timer className="h-3 w-3" />
                                                    {audit.time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={audit.statusType} className="mb-1.5 rounded-lg uppercase text-[10px] font-bold tracking-wider px-2.5 py-1">{audit.status}</Badge>
                                        <div className={cn("text-[11px] font-medium", audit.statusType === 'danger' ? "text-red-500" : "text-slate-400")}>
                                            {audit.note}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50/50 rounded-b-3xl border-t border-slate-100 mt-auto">
                            <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white rounded-xl py-6 shadow-xl shadow-blue-900/20 active:scale-95 transition-all font-bold tracking-wide uppercase text-xs">
                                Authorize Daily Batch
                            </Button>
                            <div className="h-1 w-24 mx-auto bg-orange-500 rounded-full mt-6 opacity-20"></div>
                        </div>
                    </Card>
                </motion.div>

                {/* Leave Petitions Column */}
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                            <Shield className="h-5 w-5 text-orange-500" />
                            Leave Petitions
                        </h2>
                        <Badge variant="warning" className="bg-orange-50 text-orange-700 hover:bg-orange-100">
                            {leavePetitions.length} Pending
                        </Badge>
                    </div>

                    <Card className="min-h-[600px] border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/50 p-1 flex flex-col">
                        <div className="p-6 space-y-4 flex-1">
                            {leavePetitions.map((petition) => (
                                <motion.div
                                    key={petition.id}
                                    whileHover={{ y: -2 }}
                                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-opacity group-hover:opacity-50"></div>

                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                        <div className="flex gap-4">
                                            <div className={cn("h-10 w-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-md", petition.color)}>
                                                {petition.avatar}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 text-lg">{petition.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-orange-600 border-orange-200 bg-orange-50">
                                                        {petition.type}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400 font-medium">• {petition.duration}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {petition.date}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium italic">
                                            "{petition.description}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-4 text-center text-xs text-slate-400 font-medium border-t border-slate-100">
                            Review pending requests within 24 hours to maintain SLA
                        </div>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Attendance;
