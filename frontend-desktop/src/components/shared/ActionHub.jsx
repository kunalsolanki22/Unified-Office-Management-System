import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ActionHub = ({ actions = [], title = "SERVICES" }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-sm font-bold text-[#1a367c] tracking-widest uppercase">{title}</h1>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
                {actions.map((action, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -8, boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)' }}
                        onClick={() => action.path ? navigate(action.path) : null}
                        className={`w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group ${action.path ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                    >
                        <div className="absolute inset-0 bg-radial-gradient from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-[#1a367c] group-hover:bg-[#1a367c] group-hover:text-white transition-colors duration-300 relative z-10">
                            <action.icon className="w-7 h-7" strokeWidth={1.5} />
                        </div>

                        <h3 className="text-sm font-bold text-[#1a367c] tracking-wide mb-2 leading-tight relative z-10">
                            {action.label.split(' ').map((line, i) => (
                                <span key={i} className="block">{line}</span>
                            ))}
                        </h3>
                        <div className="text-xs text-[#8892b0] leading-relaxed mb-6 px-4 relative z-10">{action.sub}</div>

                        <div className="mt-auto opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 relative z-10">
                            <span className="text-xs font-bold text-[#f9b012] flex items-center gap-1">
                                LAUNCH <ArrowRight className="w-3 h-3" />
                            </span>
                        </div>

                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#f9b012] rounded-t-lg transition-all duration-300 group-hover:w-full group-hover:rounded-none"></div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ActionHub;
