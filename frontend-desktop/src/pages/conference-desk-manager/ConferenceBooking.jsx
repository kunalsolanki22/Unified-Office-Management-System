import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Projector, Users, Info, Search, Ghost, AlertTriangle, X, CheckSquare, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

const ConferenceBooking = () => {
    // -- State --
    const [halls, setHalls] = useState([
        {
            id: 'Hall A',
            name: 'Conference Hall A',
            capacity: '12 People',
            floor: 'Floor 2',
            amenities: ['TV Screen', 'Whiteboard', 'Video Conf'],
            status: 'Available'
        },
        {
            id: 'Hall C',
            name: 'Executive Boardroom',
            capacity: '20 People',
            floor: 'Floor 3',
            amenities: ['Projector', 'Sound System', 'Coffee Machine'],
            status: 'Available'
        },
        {
            id: 'Hall D',
            name: 'Creative Lab',
            capacity: '8 People',
            floor: 'Floor 1',
            amenities: ['Whiteboard', 'Bean Bags', 'TV'],
            status: 'Available'
        }
    ]);

    const [activeBookings, setActiveBookings] = useState([
        { id: 'Hall B', hallId: 'Hall B', employee: 'Jessica Pearson', bookingId: 'BK-001', time: '09:00 - 11:00' },
        { id: 'Hall E', hallId: 'Hall E', employee: 'Harvey Specter', bookingId: 'BK-002', time: '14:00 - 15:30' }
    ]);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
    const [releaseReason, setReleaseReason] = useState('');

    // -- Handlers --

    const handleReleaseClick = (booking) => {
        setSelectedBooking(booking);
        setReleaseReason(''); // Reset reason
        setIsReleaseModalOpen(true);
    };

    const confirmRelease = () => {
        if (!releaseReason.trim()) {
            toast.error("Please provide a reason for cancellation");
            return;
        }

        // Remove from active bookings
        setActiveBookings(activeBookings.filter(b => b.bookingId !== selectedBooking.bookingId));

        // Add back to available (mock data recreation)
        const restoredHall = {
            id: selectedBooking.hallId,
            name: selectedBooking.hallId === 'Hall B' ? 'Conference Hall B' : selectedBooking.hallId === 'Hall E' ? 'Strategy Room' : `Conference ${selectedBooking.hallId}`,
            capacity: '10 People',
            floor: 'Floor 2',
            amenities: ['TV Screen', 'Video Conf'],
            status: 'Available'
        };

        setHalls([...halls, restoredHall]);

        toast.success(`Booking released: ${releaseReason}`);
        setIsReleaseModalOpen(false);
    };

    return (
        <div className="space-y-8 font-sans text-slate-700 h-full flex flex-col relative">
            {/* Header */}
            <div className="flex flex-col gap-1 shrink-0">
                <h1 className="text-2xl font-bold text-[#1a367c] tracking-wide">
                    CONFERENCE & MEETING <span className="text-[#f9b012]">ROOMS</span>
                </h1>
                <p className="text-xs font-medium text-[#8892b0] tracking-wider uppercase">
                    Monitor Room Status and Manage Cancellations
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Room Status (Read Only) */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold text-[#8892b0] tracking-widest uppercase flex items-center gap-2">
                        <Projector className="w-4 h-4 text-[#1a367c]" />
                        Room Status Portfolio
                    </h3>

                    <div className="space-y-6">
                        {halls.map((hall) => (
                            <motion.div
                                key={hall.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all pl-6"
                            >
                                {/* Status Line */}
                                <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-r-lg ${hall.status === 'Available' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>

                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#1a367c]">{hall.name}</h2>
                                        <div className="text-xs text-[#8892b0] mt-1 flex items-center gap-2">
                                            <span>{hall.capacity}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span>{hall.floor}</span>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 text-[0.65rem] font-bold rounded-lg uppercase tracking-wider border 
                                        ${hall.status === 'Available'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        {hall.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                                    {hall.amenities.map(item => (
                                        <span key={item} className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Active Room Bookings */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 min-h-[500px]">
                    <h3 className="text-xs font-bold text-[#8892b0] tracking-widest uppercase flex items-center gap-2 mb-8">
                        <Users className="w-4 h-4 text-[#f9b012]" />
                        Active Room Bookings
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-50">
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider w-1/4">Hall</th>
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider w-1/4">Booked By</th>
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider w-1/4">Time</th>
                                    <th className="pb-4 text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider w-1/4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {activeBookings.map((booking) => (
                                    <motion.tr
                                        key={booking.bookingId}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="py-6 font-bold text-[#1a367c] text-sm">
                                            {booking.hallId}
                                        </td>
                                        <td className="py-6 text-sm font-semibold text-slate-700">
                                            {booking.employee}
                                        </td>
                                        <td className="py-6 text-xs font-medium text-slate-500">
                                            {booking.time}
                                        </td>
                                        <td className="py-6 text-right">
                                            <button
                                                onClick={() => handleReleaseClick(booking)}
                                                className="px-4 py-2 rounded-lg bg-red-50 text-red-500 text-[0.65rem] font-bold uppercase tracking-wide hover:bg-red-100 hover:text-red-700 transition-all border border-red-100 shadow-sm"
                                            >
                                                RELEASE
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                                {activeBookings.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-slate-400 text-xs italic">
                                            No active room bookings.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Release Reason Modal */}
            <AnimatePresence>
                {isReleaseModalOpen && selectedBooking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsReleaseModalOpen(false)}
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
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-5 h-5 text-red-500" />
                                        <h2 className="text-lg font-bold text-[#1a367c]">Release Booking</h2>
                                    </div>
                                    <p className="text-xs text-[#8892b0] font-medium uppercase tracking-wider">
                                        {selectedBooking.hallId} • {selectedBooking.employee}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsReleaseModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-red-700 font-medium">
                                    You are about to cancel an active meeting booking. This action cannot be undone.
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#1a367c] uppercase tracking-wider mb-2">
                                        Reason for Cancellation <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <textarea
                                            value={releaseReason}
                                            onChange={(e) => setReleaseReason(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 text-sm font-medium transition-all min-h-[100px] resize-none"
                                            placeholder="e.g. Urgent maintenance required, Double booking..."
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsReleaseModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={confirmRelease}
                                        disabled={!releaseReason.trim()}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all
                                            ${!releaseReason.trim()
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'}`}
                                    >
                                        Confirm Release
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ConferenceBooking;
