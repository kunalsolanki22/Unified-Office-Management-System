import React from 'react';
import { cn } from '../../utils/cn';

const DashboardCard = ({ title, icon: Icon, children, className }) => {
    return (
        <div className={cn(
            "bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between min-h-[320px] relative overflow-hidden transition-all duration-400 hover:-translate-y-2 group",
            className
        )}>
            <div>
                <div className="flex items-center gap-2.5 mb-4 text-xs font-bold text-[#8892b0] tracking-widest uppercase">
                    {Icon && <Icon className="w-[18px] h-[18px]" strokeWidth={2} />}
                    {title}
                </div>
                {children}
            </div>
            <div className="w-10 h-1 bg-[#f9b012] rounded-full mt-6 transition-all duration-300 group-hover:w-20" />
        </div>
    );
};

export default DashboardCard;
