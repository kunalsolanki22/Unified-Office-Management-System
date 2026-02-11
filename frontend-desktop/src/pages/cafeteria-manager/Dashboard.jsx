import { motion } from 'framer-motion';
import {
    Users,
    ShoppingBag,
    Utensils,
    TrendingUp,
    Clock,
    AlertCircle,
    Car,
    Coffee,
    Monitor,
    HardDrive
} from 'lucide-react';

const Dashboard = () => {

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
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    CAFETERIA <span className="text-[#f9b012]">OVERVIEW</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Monitor Daily Operations & Performance
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Orders */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-[#1a367c]/10 text-[#1a367c] flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">142</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Total Orders</div>
                    </div>
                </motion.div>

                {/* Revenue */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">₹12,450</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Revenue Today</div>
                    </div>
                </motion.div>

                {/* Active Menu Items */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-[#f9b012]/10 text-[#f9b012] flex items-center justify-center shrink-0">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">24</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Active Items</div>
                    </div>
                </motion.div>

                {/* Pending Orders */}
                <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:-translate-y-1 transition-transform hover:shadow-lg">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-extrabold text-[#1a367c] leading-tight mb-1">5</div>
                        <div className="text-[0.65rem] text-[#8892b0] font-bold uppercase tracking-wider">Pending Orders</div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                    <h3 className="text-[1.1rem] font-bold text-[#1a367c] mb-6 flex items-center gap-2">
                        RECENT ORDERS
                    </h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c]">Order #102{i}</div>
                                    <div className="text-xs text-[#8892b0]">2 items • ₹240</div>
                                </div>
                                <span className="text-[0.65rem] font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md uppercase">Processing</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                    <h3 className="text-[1.1rem] font-bold text-[#1a367c] mb-6 flex items-center gap-2">
                        LOW STOCK ALERTS
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <div>
                                <div className="text-sm font-bold text-red-700">Coffee Beans</div>
                                <div className="text-xs text-red-600">Only 2kg remaining. Reorder required.</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            <div>
                                <div className="text-sm font-bold text-orange-700">Milk Cartons</div>
                                <div className="text-xs text-orange-600">10 units left. Expected to last 1 day.</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>


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
                            // onClick={() => navigate('/cafeteria-manager/action-hub')} 
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
