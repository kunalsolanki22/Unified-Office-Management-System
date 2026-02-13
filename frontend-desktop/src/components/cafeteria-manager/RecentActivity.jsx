import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const RecentActivity = () => {
    const activities = [
        {
            id: 1,
            title: 'Stock Updated',
            time: '2 minutes ago',
            type: 'success',
            icon: CheckCircle2,
            color: 'text-green-500',
            bgColor: 'bg-green-50'
        },
        {
            id: 2,
            title: 'Desk B-02 Cancelled',
            time: '1 hour ago',
            type: 'warning',
            icon: XCircle,
            color: 'text-[#f9b012]',
            bgColor: 'bg-[#f9b012]/10'
        }
    ];

    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-full faade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-[#1a367c]">Recent Activity</div>
                <Clock className="w-4 h-4 text-[#8892b0]" />
            </div>
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 items-start hover:shadow-sm transition-shadow">
                        <div className={`p-2 rounded-full ${activity.bgColor} shrink-0`}>
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#1a367c]">{activity.title}</p>
                            <p className="text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
