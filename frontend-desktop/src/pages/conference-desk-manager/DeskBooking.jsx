import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Coffee, Armchair, Ghost, Sun, Wifi, X, Check, UserPlus, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DeskBooking = () => {
    const navigate = useNavigate();

    // -- State --
    const [selectedDesk, setSelectedDesk] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeName, setEmployeeName] = useState('');

    const [allocations, setAllocations] = useState([
        { id: '102', employee: 'Sarah Wilson', deskId: '102', avatar: 'S', role: 'Designer' },
        { id: '302', employee: 'Mike Ross', deskId: '302', avatar: 'M', role: 'Developer' },
    ]);

    const [desks, setDesks] = useState([
        // Island 1 (Left Side)
        { id: '101', status: 'available', x: '12%', y: '20%', orientation: 'bottom' },
        { id: '102', status: 'booked', x: '22%', y: '20%', orientation: 'bottom' },
        { id: '103', status: 'available', x: '12%', y: '35%', orientation: 'top' },
        { id: '104', status: 'available', x: '22%', y: '35%', orientation: 'top' },

        // Island 2 (Center)
        { id: '201', status: 'available', x: '45%', y: '40%', orientation: 'right' },
        { id: '202', status: 'available', x: '55%', y: '40%', orientation: 'left' },

        // Island 3 (Right Side)
        { id: '301', status: 'available', x: '78%', y: '20%', orientation: 'bottom' },
        { id: '302', status: 'booked', x: '88%', y: '20%', orientation: 'bottom' },
        { id: '303', status: 'available', x: '78%', y: '35%', orientation: 'top' },
        { id: '304', status: 'available', x: '88%', y: '35%', orientation: 'top' },

        // Corner Pod
        { id: '401', status: 'available', x: '15%', y: '75%', orientation: 'right', type: 'standing' },
        { id: '402', status: 'available', x: '25%', y: '75%', orientation: 'left', type: 'standing' },
    ]);

    // -- Handlers --

    const handleDeskClick = (desk) => {
        setSelectedDesk(desk);
        setIsModalOpen(true);
        setEmployeeName(''); // Reset form
    };

    const handleAllocate = () => {
        if (!employeeName.trim()) {
            toast.error("Please enter an employee name");
            return;
        }

        // Update Desk Status
        setDesks(desks.map(d => d.id === selectedDesk.id ? { ...d, status: 'booked' } : d));

        // Add to Allocations
        const newAllocation = {
            id: selectedDesk.id,
            employee: employeeName,
            deskId: selectedDesk.id,
            avatar: employeeName.charAt(0).toUpperCase(),
            role: 'Employee' // Default role
        };
        setAllocations([...allocations, newAllocation]);

        toast.success(`Desk ${selectedDesk.id} allocated to ${employeeName}`);
        setIsModalOpen(false);
    };

    const handleRevoke = (deskId) => {
        // Update Desk Status
        setDesks(desks.map(d => d.id === deskId ? { ...d, status: 'available' } : d));

        // Remove from Allocations
        setAllocations(allocations.filter(a => a.deskId !== deskId));

        toast.info(`Allocation for Desk ${deskId} revoked`);
        setIsModalOpen(false); // Close modal if open for this desk
    };

    // Calculate Occupancy
    const totalDesks = desks.length;
    const occupiedDesks = desks.filter(d => d.status === 'booked').length;
    const occupancyRate = Math.round((occupiedDesks / totalDesks) * 100);


    return (
        <div className="space-y-8 font-sans text-slate-700 h-full flex flex-col relative">
            {/* Header */}
            <div className="flex flex-col gap-1 shrink-0">
                <h1 className="text-2xl font-bold text-[#1a367c] tracking-wide">
                    DESK & WORKSPACE <span className="text-[#f9b012]">ALLOCATION</span>
                </h1>
                <p className="text-xs font-medium text-[#8892b0] tracking-wider uppercase">
                    Assign desks, optimize seating, and track usage
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-[600px]">
                {/* Left Panel: Floor Plan */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6 z-10">
                        <h3 className="text-sm font-bold text-[#1a367c] tracking-widest flex items-center gap-2 uppercase">
                            <Monitor className="w-4 h-4 text-[#f9b012]" />
                            Wing A (Floor 1)
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available
                            </div>
                            <div className="flex items-center gap-2 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-[#1a367c]"></span> Booked
                            </div>
                        </div>
                    </div>

                    {/* Floor Plan Container */}
                    <div className="flex-1 bg-slate-50 rounded-[24px] border border-slate-200 relative overflow-hidden shadow-inner cursor-grab active:cursor-grabbing">

                        {/* Floor Grid */}
                        <div className="absolute inset-0 opacity-[0.05]"
                            style={{
                                backgroundImage: 'linear-gradient(#1a367c 1px, transparent 1px), linear-gradient(90deg, #1a367c 1px, transparent 1px)',
                                backgroundSize: '40px 40px'
                            }}>
                        </div>

                        {/* Structural Features - Windows (Top) */}
                        <div className="absolute top-0 left-10 right-10 h-1 bg-sky-200/30 flex justify-between px-20">
                            {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-2 bg-sky-100 rounded-b-lg shadow-sm border border-sky-200/50"></div>)}
                        </div>

                        {/* Meeting Room */}
                        <div className="absolute top-[60%] right-[5%] w-[25%] h-[30%] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-sm">
                            <div className="absolute inset-x-4 top-0 h-1 bg-slate-200/50 rounded-b-lg"></div>
                            <div className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mb-1">Meeting Room 1</div>
                            <div className="flex gap-1 opacity-20"><Armchair className="w-3 h-3" /><Armchair className="w-3 h-3" /></div>
                        </div>

                        {/* Chill Zone */}
                        <div className="absolute bottom-[5%] left-[5%] w-[30%] h-[20%] bg-orange-50 rounded-[2rem] border border-orange-100 flex items-center justify-center opacity-80">
                            <Coffee className="w-4 h-4 text-orange-300 mr-2" />
                            <span className="text-[0.6rem] font-bold text-orange-400 uppercase tracking-widest">Lounge</span>
                        </div>

                        {/* Desks */}
                        {desks.map((desk) => (
                            <motion.div
                                key={desk.id}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeskClick(desk)}
                                className={`absolute w-16 h-12 rounded-lg shadow-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 z-10
                                    ${desk.status === 'booked'
                                        ? 'bg-[#1a367c] border-[#1a367c] text-white shadow-lg shadow-[#1a367c]/20'
                                        : 'bg-white border-slate-300 text-slate-500 hover:border-[#f9b012] hover:text-[#f9b012] hover:shadow-md'}
                                `}
                                style={{
                                    left: desk.x,
                                    top: desk.y,
                                    borderRadius: desk.type === 'standing' ? '4px' : '8px'
                                }}
                            >
                                <div className={`w-8 h-0.5 rounded-full ${desk.status === 'booked' ? 'bg-white/20' : 'bg-slate-200'}`}></div>
                                <span className="text-[0.6rem] font-bold font-mono">D{desk.id.slice(-2)}</span>

                                {/* Chair Indicator */}
                                <div className={`absolute w-6 h-1.5 rounded-full transition-colors 
                                    ${desk.status === 'available' ? 'bg-slate-200' : 'bg-[#f9b012]'}
                                    ${desk.orientation === 'bottom' ? '-bottom-2' :
                                        desk.orientation === 'top' ? '-top-2' :
                                            desk.orientation === 'left' ? '-left-2 w-1.5 h-6' : '-right-2 w-1.5 h-6'}
                                `}></div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Active Allocations */}
                <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col h-full relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a367c] to-[#f9b012] opacity-80"></div>

                    <h3 className="text-xs font-bold text-[#8892b0] tracking-widest mb-8 uppercase flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[#f9b012]" />
                        Active Allocations
                    </h3>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-4">
                            {allocations.map((alloc) => (
                                <div key={alloc.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a367c] to-[#2c4a96] text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-blue-900/10">
                                                {alloc.avatar}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1a367c]">{alloc.employee}</div>
                                                <div className="text-[0.6rem] font-bold text-[#8892b0] uppercase tracking-wider flex items-center gap-1">
                                                    {alloc.role}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-slate-50 rounded-lg text-[0.6rem] font-bold text-[#1a367c] border border-slate-100">
                                            D-{alloc.deskId}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => handleRevoke(alloc.deskId)}
                                        className="w-full py-2 rounded-lg bg-red-50 text-red-500 text-[0.65rem] font-bold tracking-wide hover:bg-red-100 transition-colors uppercase border border-red-100 flex items-center justify-center gap-2"
                                    >
                                        <X className="w-3 h-3" /> Revoke Access
                                    </button>
                                </div>
                            ))}
                        </div>

                        {allocations.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Ghost className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium italic">No desks allocated</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="bg-[#f8f9fa] p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider mb-1">Total Capacity</div>
                                <div className="text-xl font-bold text-[#1a367c]">{totalDesks} <span className="text-xs font-medium text-slate-400">Seats</span></div>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider mb-1">Occupancy</div>
                                <div className="text-xl font-bold text-[#f9b012]">{occupancyRate}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocation Modal */}
            <AnimatePresence>
                {isModalOpen && selectedDesk && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[24px] shadow-2xl p-8 w-full max-w-md border border-slate-100"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-[#1a367c]">
                                        {selectedDesk.status === 'booked' ? 'Desk details' : 'Allocate Desk'}
                                    </h2>
                                    <p className="text-xs text-[#8892b0] font-medium uppercase tracking-wider mt-1">
                                        Managing Desk {selectedDesk.id}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {selectedDesk.status === 'available' ? (
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <Check className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-emerald-800">Available for Allocation</div>
                                            <div className="text-xs text-emerald-600">This desk is currently free.</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">Assign To Employee</label>
                                        <div className="relative">
                                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={employeeName}
                                                onChange={(e) => setEmployeeName(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a367c] focus:border-transparent text-sm font-medium transition-all"
                                                placeholder="Enter employee name..."
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAllocate}
                                            className="flex-1 py-3 rounded-xl bg-[#1a367c] text-white font-bold text-sm hover:bg-[#2c4a96] shadow-lg shadow-blue-900/20 transition-all"
                                        >
                                            Confirm Allocation
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                        <div className="w-16 h-16 rounded-full bg-[#1a367c] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-xl">
                                            {allocations.find(a => a.deskId === selectedDesk.id)?.avatar || '?'}
                                        </div>
                                        <h3 className="text-lg font-bold text-[#1a367c] mb-1">
                                            {allocations.find(a => a.deskId === selectedDesk.id)?.employee || 'Unknown User'}
                                        </h3>
                                        <p className="text-xs text-[#8892b0] font-bold uppercase tracking-wider">
                                            {allocations.find(a => a.deskId === selectedDesk.id)?.role || 'Employee'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleRevoke(selectedDesk.id)}
                                        className="w-full py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> Revoke Allocation
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeskBooking;
