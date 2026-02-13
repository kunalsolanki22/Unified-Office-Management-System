import React from 'react';

const AnalyticsWidget = ({ label, value, valueColor = "text-[#1a367c]" }) => {
    return (
        <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
            <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-[1.8rem] font-extrabold ${valueColor}`}>{value}</div>
        </div>
    );
};

export default AnalyticsWidget;
