import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const RecentActivity = ({ activities = [] }) => {
    // Helper to format relative time
    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return `${Math.floor(diffInHours / 24)} days ago`;
    };

    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-full faade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-[#1a367c]">Recent Activity</div>
                <Clock className="w-4 h-4 text-[#8892b0]" />
            </div>
            <div className="space-y-4">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">No recent activity</div>
                ) : (
                    activities.map((activity, index) => {
                        const isOrder = activity.type === 'order';
                        const Icon = isOrder ? CheckCircle2 : XCircle; // Or specific icons
                        const bgColor = isOrder ? 'bg-green-50' : 'bg-orange-50';
                        const textColor = isOrder ? 'text-green-500' : 'text-orange-500';

                        return (
                            <div key={index} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 items-start hover:shadow-sm transition-shadow">
                                <div className={`p-2 rounded-full ${bgColor} shrink-0`}>
                                    <Icon className={`w-4 h-4 ${textColor}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#1a367c]">{activity.title}</p>
                                    <p className="text-[0.65rem] text-[#8892b0] font-bold tracking-wide uppercase mt-1">
                                        {getRelativeTime(activity.time)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
