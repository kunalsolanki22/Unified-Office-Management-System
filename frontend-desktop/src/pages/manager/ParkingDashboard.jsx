import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckSquare, ArrowRight } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const stats = [
    { label: 'TOTAL SLOTS', value: '60', note: 'Ground + First Floor' },
    { label: 'OCCUPIED', value: '43', note: 'Currently in use' },
    { label: 'PENDING REQUESTS', value: '05', note: 'Awaiting approval' },
];

const shortcuts = [
    { icon: MapPin, label: 'SLOT MAP', sub: 'Floor-wise Slot Availability', path: '/manager/parking/slots' },
    { icon: CheckSquare, label: 'PARKING REQUESTS', sub: 'Review & Approve Employee Requests', path: '/manager/parking/requests' },
];

function ParkingDashboard() {
    const navigate = useNavigate();

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants}>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">Management Portal</p>
                <h1 className="text-[1.8rem] font-extrabold text-[#1a367c]">
                    Parking <span className="text-[#f9b012]">Manager</span>
                </h1>
                <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mt-1">Slot & Capacity Controls</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-150"></div>
                        <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mb-3 relative z-10">{stat.label}</p>
                        <p className="text-[2.5rem] font-extrabold text-[#1a367c] leading-tight relative z-10">{stat.value}</p>
                        <p className="text-[0.8rem] text-[#8892b0] mt-1 relative z-10">{stat.note}</p>
                        <div className="h-1 w-10 bg-[#f9b012] mt-4 rounded-full transition-all duration-300 group-hover:w-20"></div>
                    </motion.div>
                ))}
            </div>

            <div>
                <motion.div variants={itemVariants} className="mb-6">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-widest">QUICK ACTIONS</h3>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {shortcuts.map((item) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.label}
                                variants={itemVariants}
                                whileHover={{ y: -8, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
                                onClick={() => navigate(item.path)}
                                className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group"
                            >
                                <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:text-[#f9b012] transition-colors">
                                    <Icon className="w-7 h-7" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2">{item.label}</h3>
                                <p className="text-[0.65rem] text-[#8892b0] font-medium mb-4">{item.sub}</p>
                                <button className="flex items-center gap-2 text-[#1a367c] text-xs font-bold tracking-widest hover:gap-3 transition-all">
                                    OPEN <ArrowRight className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

export default ParkingDashboard;