import { useNavigate } from 'react-router-dom';
import { Car, Utensils, Monitor, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, HoverEffectCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Header Section */}
            <motion.div variants={item} className="flex items-end justify-between">
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Management Portal</div>
                    <h1 className="text-3xl font-bold text-blue-900">Good Morning, Super Admin</h1>
                </div>
                <div className="mb-1">
                    <Badge variant="success" className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        System Nominal
                    </Badge>
                </div>
            </motion.div>

            {/* Action Cards Row */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-8 border-none shadow-xl bg-white rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wide mb-2">Admin Attendance</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8">System-wide verification cycle for Feb 24 is pending.</p>

                    <Button
                        onClick={() => navigate('/super-admin/attendance')}
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all"
                    >
                        Launch Adjudication
                    </Button>
                </Card>

                <Card className="p-8 border-none shadow-xl bg-white rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                    <h3 className="text-lg font-bold text-blue-900 uppercase tracking-wide mb-2">Holiday Protocol</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8">Next public holiday: Maha Shivratri (Feb 26).</p>

                    <Button
                        onClick={() => navigate('/super-admin/holidays')}
                        className="w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all"
                    >
                        Manage Holiday Calendar
                    </Button>
                </Card>
            </motion.div>

            {/* Analytics Row */}
            <motion.div variants={item}>
                <Card className="p-8 border-none shadow-xl bg-white rounded-3xl">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Real-Time Force Analytics</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-x divide-slate-100">
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-bold text-blue-900 mb-1">92%</div>
                            <div className="h-1 w-8 bg-green-500 rounded-full mb-3"></div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presence Rate</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-bold text-blue-900 mb-1">14</div>
                            <div className="h-1 w-8 bg-orange-500 rounded-full mb-3"></div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Leaves</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-bold text-blue-900 mb-1">03</div>
                            <div className="h-1 w-8 bg-red-500 rounded-full mb-3"></div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Flags</div>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Module Proxies Section */}
            <motion.div variants={item} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-bold text-blue-900 uppercase tracking-widest">Module Proxies</h2>
                    <button
                        onClick={() => navigate('/super-admin/actions')}
                        className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-1"
                    >
                        View Master Hub <ArrowRight className="h-3 w-3" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    <HoverEffectCard className="p-8 flex items-center justify-between rounded-3xl border-none shadow-xl bg-white cursor-pointer group" onClick={() => navigate('/super-admin/actions')}>
                        <div>
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-900 mb-4 group-hover:scale-110 transition-transform">
                                <Car className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-900">Parking Manager</h3>
                            <p className="text-xs text-slate-400 font-medium">Slot & Capacity Controls</p>
                        </div>
                    </HoverEffectCard>

                    <HoverEffectCard className="p-8 flex items-center justify-between rounded-3xl border-none shadow-xl bg-white cursor-pointer group" onClick={() => navigate('/super-admin/actions')}>
                        <div>
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-900 mb-4 group-hover:scale-110 transition-transform">
                                <Utensils className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-blue-900">Cafeteria Ops</h3>
                            <p className="text-xs text-slate-400 font-medium">Food & Desk Oversight</p>
                        </div>
                    </HoverEffectCard>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Dashboard;
