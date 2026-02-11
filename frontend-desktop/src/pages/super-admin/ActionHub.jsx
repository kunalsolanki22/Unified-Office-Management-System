import React from 'react';
import { motion } from 'framer-motion';
import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';

const ActionHub = () => {
    const actions = [
        { icon: Car, label: 'PARKING MANAGER', sub: 'Slot & Capacity Controls' },
        { icon: Coffee, label: 'CAFETERIA OPS', sub: 'Food Provisioning Oversight' },
        { icon: Monitor, label: 'DESK MANAGEMENT', sub: 'Workspace Allocation' },
        { icon: Users, label: 'CONFERENCE MGMT', sub: 'Room Booking & Scheduling' },
        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    ACTION <span className="text-[#f9b012]">HUB</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Centralized Controls for Operational Modules
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
                {actions.map((action, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)' }}
                        className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(25%-18px)] bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-pointer relative overflow-hidden group min-h-[250px] justify-center transition-all duration-300"
                    >
                        <div className="absolute inset-0 bg-radial-gradient from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:text-[#f9b012] transition-colors relative z-10">
                            <action.icon className="w-7 h-7" strokeWidth={1.5} />
                        </div>

                        <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2 leading-tight relative z-10 w-full">
                            {action.label.split(' ').map((line, i) => (
                                <span key={i} className="block">{line}</span>
                            ))}
                        </h3>
                        <p className="text-[0.65rem] text-[#8892b0] font-medium relative z-10">{action.sub}</p>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ActionHub;
