import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Check, List, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const DeskManagement = () => {
    // Mock Data for Zones
    const [zones, setZones] = useState({
        A: Array.from({ length: 8 }, (_, i) => ({ id: `A${i + 1}`, status: i === 3 ? 'booked' : 'available' })),
        B: Array.from({ length: 4 }, (_, i) => ({ id: `B${i + 1}`, status: i === 2 ? 'booked' : 'available' }))
    });

    const [selectedDesk, setSelectedDesk] = useState(null);
    const [toast, setToast] = useState(null);

    // Mock Live Allocations Data
    const [allocations, setAllocations] = useState([
        { id: '1', deskId: '#A1', employee: 'Sarah Wilson' },
        { id: '2', deskId: '#A4', employee: 'Mike Ross' },
        { id: '3', deskId: '#B3', employee: 'Emma Stone' },
    ]);

    const handleDeskClick = (desk) => {
        if (desk.status === 'booked') return;
        setSelectedDesk(selectedDesk === desk.id ? null : desk.id);
    };

    const handleConfirmBooking = () => {
        if (!selectedDesk) return;

        // Update local state to show 'booked'
        const updatedZones = { ...zones };
        let deskFound = false;

        // Find and update the desk in Zone A
        updatedZones.A = updatedZones.A.map(d => {
            if (d.id === selectedDesk) {
                deskFound = true;
                return { ...d, status: 'booked' };
            }
            return d;
        });

        // If not in A, check Zone B
        if (!deskFound) {
            updatedZones.B = updatedZones.B.map(d => {
                if (d.id === selectedDesk) return { ...d, status: 'booked' };
                return d;
            });
        }

        setZones(updatedZones);

        // Add to allocations list
        setAllocations(prev => [
            { id: Date.now().toString(), deskId: `#${selectedDesk}`, employee: 'Current User' },
            ...prev
        ]);

        // Show Success Toast
        setToast({ message: `Desk ${selectedDesk} Successfully Booked!`, type: 'success' });

        // Reset Selection
        setSelectedDesk(null);
    };

    const handleCancelAllocation = (id) => {
        setAllocations(allocations.filter(a => a.id !== id));
        setToast({ message: 'Allocation Cancelled', type: 'success' });
    };

    const getDeskStyle = (desk) => {
        if (desk.status === 'booked') return 'bg-slate-100 text-slate-300 cursor-not-allowed';
        if (selectedDesk === desk.id) return 'bg-[#1a367c] text-white shadow-lg shadow-blue-900/20 ring-2 ring-offset-2 ring-[#1a367c]';
        return 'bg-white text-[#1a367c] border border-slate-200 hover:border-[#1a367c] hover:shadow-md';
    };

    const totalDesks = 12; // 8 in A + 4 in B
    const totalBooked = allocations.length; // Approximate derived from list for demo
    const totalFree = totalDesks - totalBooked;
    const utilizationPercentage = Math.round((totalBooked / totalDesks) * 100);

    return (
        <div className="space-y-6 animate-fade-in pb-10 relative">
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    DESK <span className="text-[#f9b012]">MANAGEMENT</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Zonal Seating Allocation
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-8">
                {/* LEFT COLUMN: SEATING MAP */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 relative h-fit">
                    {/* Free Badge */}
                    <div className="absolute top-8 right-8 bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[0.65rem] font-extrabold tracking-widest uppercase border border-green-100 shadow-sm">
                        {totalFree} DESKS AVAILABLE
                    </div>

                    {/* Zone A */}
                    <div className="mb-12">
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest mb-6 pl-2 border-l-4 border-[#f9b012]">
                            Zone A: Main Hall
                        </div>
                        <div className="bg-[#fafbfb] rounded-[24px] border-2 border-slate-100 border-dashed p-10 flex justify-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"></div>
                            <div className="grid grid-cols-4 gap-6">
                                {zones.A.map((desk) => (
                                    <motion.button
                                        key={desk.id}
                                        whileHover={desk.status !== 'booked' ? { scale: 1.1 } : {}}
                                        whileTap={desk.status !== 'booked' ? { scale: 0.95 } : {}}
                                        onClick={() => handleDeskClick(desk)}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold transition-colors duration-200 relative ${getDeskStyle(desk)}`}
                                    >
                                        {desk.id}
                                        {selectedDesk === desk.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-1.5 bg-[#f9b012] text-white rounded-full p-0.5"
                                            >
                                                <Check className="w-3 h-3" strokeWidth={4} />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Zone B */}
                    <div className="mb-12">
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest mb-6 pl-2 border-l-4 border-[#1a367c]">
                            Zone B: Window Side
                        </div>
                        <div className="bg-[#fafbfb] rounded-[24px] border-2 border-slate-100 border-dashed p-10 flex justify-center">
                            <div className="grid grid-cols-4 gap-6">
                                {zones.B.map((desk) => (
                                    <motion.button
                                        key={desk.id}
                                        whileHover={desk.status !== 'booked' ? { scale: 1.1 } : {}}
                                        whileTap={desk.status !== 'booked' ? { scale: 0.95 } : {}}
                                        onClick={() => handleDeskClick(desk)}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold transition-colors duration-200 relative ${getDeskStyle(desk)}`}
                                    >
                                        {desk.id}
                                        {selectedDesk === desk.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-1.5 -right-1.5 bg-[#f9b012] text-white rounded-full p-0.5"
                                            >
                                                <Check className="w-3 h-3" strokeWidth={4} />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center gap-10 mb-10 pb-8 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-lg border border-slate-200 bg-white"></div>
                            <span className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Available</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-lg bg-[#1a367c] shadow-md shadow-blue-900/20"></div>
                            <span className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-lg bg-slate-100 border border-slate-100"></div>
                            <span className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Booked</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <motion.div
                        whileHover={selectedDesk ? { scale: 1.01 } : {}}
                        whileTap={selectedDesk ? { scale: 0.99 } : {}}
                    >
                        <Button
                            className={`w-full py-5 text-sm font-bold tracking-[0.2em] justify-center rounded-2xl transition-all duration-300
                                ${selectedDesk ? 'bg-[#1a367c] shadow-xl shadow-blue-900/20 hover:shadow-2xl' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                            disabled={!selectedDesk}
                            onClick={handleConfirmBooking}
                        >
                            {selectedDesk ? `CONFIRM BOOKING FOR ${selectedDesk}` : 'SELECT A DESK'}
                        </Button>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: LIVE ALLOCATIONS */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <List className="w-5 h-5 text-[#1a367c]" />
                        <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-wide">Live Allocations</h3>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 pb-4 border-b border-slate-100 mb-4">
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Desk ID</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">Employee</div>
                        <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider text-right">Action</div>
                    </div>

                    {/* Allocations List */}
                    <div className="space-y-6 overflow-y-auto flex-1 max-h-[400px] mb-8 pr-2 custom-scrollbar">
                        {allocations.map((alloc) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                key={alloc.id}
                                className="grid grid-cols-[1fr_2fr_1fr] gap-4 items-center group"
                            >
                                <div className="text-sm font-bold text-[#1a367c]">{alloc.deskId}</div>
                                <div className="text-sm font-medium text-slate-600 group-hover:text-[#1a367c] transition-colors">{alloc.employee}</div>
                                <div className="text-right">
                                    <button
                                        onClick={() => handleCancelAllocation(alloc.id)}
                                        className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wide hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {allocations.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-xs font-medium italic">
                                No active allocations found.
                            </div>
                        )}
                    </div>

                    {/* Seating Utilization */}
                    <div className="mt-auto pt-8 border-t border-slate-100">
                        <h4 className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider mb-4">Seating Utilization</h4>

                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${utilizationPercentage}%` }}
                                transition={{ duration: 1, type: "spring" }}
                                className="h-full bg-[#1a367c] rounded-full"
                            ></motion.div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold">
                            <div className="text-[#1a367c]">{utilizationPercentage}% Occupied</div>
                            <div className="text-slate-400">{100 - utilizationPercentage}% Available</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeskManagement;
