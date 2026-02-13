import React from 'react';
import { cn } from '../../utils/cn';
import { Monitor, Coffee, AlertTriangle, Lock } from 'lucide-react';

const Desk = ({ id, status, onClick }) => {
    return (
        <div
            onClick={() => onClick(id)}
            className={cn(
                "w-[50px] h-[50px] rounded-xl flex items-center justify-center text-[11px] font-extrabold cursor-pointer transition-all duration-200 relative group",
                status === 'Available' && "bg-white text-[#1a367c] border-2 border-slate-200 hover:scale-105 hover:shadow-lg",
                status === 'Booked' && "bg-slate-300 text-slate-500 border-none cursor-not-allowed",
                status === 'Maintenance' && "bg-red-100 text-red-500 border-2 border-red-300"
            )}
        >
            {status === 'Booked' && <Lock className="w-3 h-3 absolute bottom-1 right-1 opacity-50" />}
            {status === 'Maintenance' && <AlertTriangle className="w-3 h-3 absolute bottom-1 right-1 opacity-50" />}
            {id.split('-')[1]}
        </div>
    );
};

const FloorMap = ({ desks, onDeskClick }) => {
    const getDeskStatus = (id) => {
        const desk = desks.find(d => d.id === id);
        return desk ? desk.status : 'Available';
    };

    return (
        <div className="bg-[#f8fafc] rounded-3xl p-10 border-2 border-dashed border-slate-300 w-full overflow-auto flex justify-center min-h-[500px]">
            <div className="w-full max-w-[600px] relative">

                {/* Top Section */}
                <div className="flex justify-between mb-12">
                    <div className="bg-slate-200 rounded-2xl w-40 h-24 flex items-center justify-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                        Meeting Room 01
                    </div>
                    <div className="flex flex-col gap-4 opacity-30">
                        <Coffee className="text-green-600 w-6 h-6" />
                        <Coffee className="text-green-600 w-6 h-6" />
                    </div>
                </div>

                {/* Pod Cluster 1 */}
                <div className="flex justify-around mb-14 gap-8">
                    <div className="grid grid-cols-2 gap-3">
                        {['A-101', 'A-102', 'A-103', 'A-104'].map(id => (
                            <Desk key={id} id={id} status={getDeskStatus(id)} onClick={onDeskClick} />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['A-105', 'A-106', 'A-107', 'A-108'].map(id => (
                            <Desk key={id} id={id} status={getDeskStatus(id)} onClick={onDeskClick} />
                        ))}
                    </div>
                </div>

                {/* Hallway */}
                <div className="h-10 w-full mb-12 flex items-center justify-center relative">
                    <div className="w-full border-t border-dashed border-slate-300"></div>
                    <span className="absolute bg-[#f8fafc] px-4 text-[10px] font-bold text-slate-400 tracking-[0.2em]">HALLWAY</span>
                </div>

                {/* Bottom Section */}
                <div className="flex justify-between items-end">
                    <div className="grid grid-cols-2 gap-3">
                        {['W-201', 'W-202'].map(id => (
                            <Desk key={id} id={id} status={getDeskStatus(id)} onClick={onDeskClick} />
                        ))}
                    </div>

                    <div className="bg-slate-200 rounded-2xl w-32 h-24 flex items-center justify-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                        Chill Zone
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {['W-203', 'W-204'].map(id => (
                            <Desk key={id} id={id} status={getDeskStatus(id)} onClick={onDeskClick} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FloorMap;
