import { motion } from 'framer-motion';
import { Shield, Coffee, Car, Ticket, Activity, Users, FileText, Settings, ExternalLink } from 'lucide-react';

const ActionHub = () => {
    const services = [
        { icon: Activity, title: 'System Health', desc: 'Monitor node status', color: 'text-green-500', bg: 'bg-green-50' },
        { icon: Shield, title: 'Access Control', desc: 'Manage door permissions', color: 'text-[#1a367c]', bg: 'bg-[#1a367c]/5' },
        { icon: Coffee, title: 'Cafeteria Services', desc: 'View menu & orders', color: 'text-[#f9b012]', bg: 'bg-[#f9b012]/10' },
        { icon: Users, title: 'Visitor Pass', desc: 'Issue temporary badges', color: 'text-purple-500', bg: 'bg-purple-50' },
        { icon: Car, title: 'Parking', desc: 'Slot allocation & logs', color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: Ticket, title: 'Support Ticket', desc: 'Raise IT/Admin requests', color: 'text-red-500', bg: 'bg-red-50' },
        { icon: FileText, title: 'Reports', desc: 'Download audit logs', color: 'text-slate-600', bg: 'bg-slate-100' },
        { icon: Settings, title: 'Settings', desc: 'Configure portal vars', color: 'text-slate-600', bg: 'bg-slate-100' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#1a367c] flex items-center gap-2">
                    SERVICES <span className="text-[#f9b012]">& ACTION HUB</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium mt-1 uppercase tracking-wide">
                    Internal Tools & Quick Actions
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.map((service, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>

                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${service.bg} ${service.color}`}>
                            <service.icon className="w-6 h-6" />
                        </div>

                        <h3 className="text-base font-bold text-[#1a367c] mb-1 group-hover:text-[#f9b012] transition-colors">
                            {service.title}
                        </h3>
                        <p className="text-xs text-[#8892b0] uppercase tracking-wide font-medium">
                            {service.desc}
                        </p>

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4 text-[#1a367c]" />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-[#f8f9fa] border border-slate-200 rounded-[20px] p-8 mt-12 text-center">
                <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest mb-3">Need Access to More Tools?</h3>
                <p className="text-sm text-[#8892b0] max-w-lg mx-auto mb-6">
                    Request elevated privileges or access to specific departmental tools through the Super Admin console or contact IT Support.
                </p>
                <button className="bg-white border border-[#1a367c] text-[#1a367c] px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1a367c] hover:text-white transition-all">
                    Contact IT Support
                </button>
            </div>
        </div>
    );
};

export default ActionHub;
