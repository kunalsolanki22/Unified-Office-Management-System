import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { parkingService } from '../../services/parkingService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function ParkingSlots() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const res = await parkingService.getSlots();
            console.log('Parking slots response:', res);
            // Backend returns: { data: { total, slots: [...] } }
            const slotsArray = res.data?.slots || res.slots || [];
            const mapped = slotsArray.map(s => ({
                id: s.slot_code,
                status: (s.status || 'available').toLowerCase(),
                occupant: s.current_occupant,
                vehicle: s.vehicle_number,
            }));
            setSlots(mapped);
        } catch (err) {
            console.error('Failed to load slots:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSlots(); }, []);

    const available = slots.filter(s => s.status === 'available').length;
    const occupied = slots.filter(s => s.status === 'occupied').length;
    const disabled = slots.filter(s => s.status === 'disabled').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-[#20323c] mb-1">
                    PARKING <span className="text-[#f9b012]">SLOTS</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Real-time Parking Slot Availability
                </p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8892b0]">
                    <div className="w-4 h-4 rounded bg-[#dcfce7] border border-[#bbf7d0]"></div>
                    AVAILABLE ({available})
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#8892b0]">
                    <div className="w-4 h-4 rounded bg-[#fee2e2] border border-[#fecaca]"></div>
                    OCCUPIED ({occupied})
                </div>
                {disabled > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-[#8892b0]">
                        <div className="w-4 h-4 rounded bg-[#f1f5f9] border border-[#e2e8f0]"></div>
                        DISABLED ({disabled})
                    </div>
                )}
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-8">
                {slots.length === 0 ? (
                    <div className="text-center py-12 text-[#8892b0] text-sm">No parking slots found</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
                        {slots.map((slot) => (
                            <motion.div
                                key={slot.id}
                                whileHover={{ y: -2, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}
                                className={`rounded-xl p-5 text-center cursor-default border transition-all ${
                                    slot.status === 'available'
                                        ? 'bg-[#dcfce7] border-[#bbf7d0] text-[#166534]'
                                        : slot.status === 'occupied'
                                            ? 'bg-[#fee2e2] border-[#fecaca] text-[#ef4444]'
                                            : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'
                                }`}
                            >
                                <div className="text-[1.4rem] font-extrabold mb-2 tracking-tight">{slot.id}</div>
                                <div className="text-[0.7rem] uppercase font-bold tracking-[0.5px]">{slot.status}</div>
                                {slot.occupant && <div className="text-[0.6rem] mt-1 opacity-75">{slot.occupant}</div>}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

export default ParkingSlots;