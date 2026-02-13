import React from 'react';
import { User, CheckCircle, AlertTriangle, XCircle, History } from 'lucide-react';
import Button from '../ui/Button';

const DeskBookingList = ({ allocations, onCancel, onToggleMaintenance, onViewHistory }) => {
    if (allocations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <Monitor className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm font-semibold text-slate-400">No desk allocations</p>
                <p className="text-xs">All desks are currently available</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {allocations.map((allocation) => (
                <div
                    key={allocation.id}
                    className="bg-[#fafbfc] rounded-xl p-4 border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[1.1rem] font-extrabold text-[#1a367c] mb-1">Desk {allocation.id}</div>
                            <div className="flex items-center gap-1.5 text-xs text-[#8892b0] font-semibold">
                                <User className="w-3 h-3" />
                                {allocation.user}
                            </div>
                        </div>
                        {allocation.status === 'Booked' ? (
                            <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Booked
                            </span>
                        ) : (
                            <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Maintenance
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-[0.7rem] mb-3">
                        <CalendarIcon className="w-3 h-3" />
                        {allocation.date}
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {allocation.status === 'Booked' && (
                            <Button
                                size="sm"
                                className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 border-none h-8 text-[0.7rem]"
                                onClick={() => onCancel(allocation.id)}
                            >
                                <XCircle className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className={`flex-1 h-8 text-[0.7rem] border-none ${allocation.status === 'Maintenance'
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                }`}
                            onClick={() => onToggleMaintenance(allocation.id)}
                        >
                            {allocation.status === 'Maintenance' ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Clear Maint.</>
                            ) : (
                                <><AlertTriangle className="w-3 h-3 mr-1" /> Maintenace</>
                            )}
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Helper Icon
const CalendarIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const Monitor = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
        <line x1="8" y1="21" x2="16" y2="21"></line>
        <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>
);

export default DeskBookingList;
