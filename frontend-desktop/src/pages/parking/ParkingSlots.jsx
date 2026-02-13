import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const slots = [
    { id: 'A-01', status: 'available' },
    { id: 'A-02', status: 'occupied' },
    { id: 'A-03', status: 'available' },
    { id: 'A-04', status: 'available' },
    { id: 'A-05', status: 'occupied' },
    { id: 'A-06', status: 'available' },
    { id: 'A-07', status: 'available' },
    { id: 'A-08', status: 'occupied' },
    { id: 'A-09', status: 'available' },
    { id: 'A-10', status: 'occupied' },
    { id: 'B-01', status: 'occupied' },
    { id: 'B-02', status: 'available' },
    { id: 'B-03', status: 'available' },
    { id: 'B-04', status: 'occupied' },
    { id: 'B-05', status: 'available' },
    { id: 'B-06', status: 'available' },
    { id: 'B-07', status: 'occupied' },
    { id: 'B-08', status: 'available' },
    { id: 'B-09', status: 'available' },
    { id: 'B-10', status: 'available' },
    { id: 'C-01', status: 'available' },
    { id: 'C-02', status: 'available' },
    { id: 'C-03', status: 'occupied' },
    { id: 'C-04', status: 'available' },
    { id: 'C-05', status: 'available' },
    { id: 'C-06', status: 'occupied' },
    { id: 'C-07', status: 'available' },
    { id: 'C-08', status: 'available' },
    { id: 'C-09', status: 'available' },
    { id: 'C-10', status: 'occupied' },
    { id: 'D-01', status: 'available' },
    { id: 'D-02', status: 'occupied' },
    { id: 'D-03', status: 'available' },
    { id: 'D-04', status: 'available' },
    { id: 'D-05', status: 'available' },
    { id: 'D-06', status: 'occupied' },
    { id: 'D-07', status: 'available' },
];

const available = slots.filter(s => s.status === 'available').length;
const occupied = slots.filter(s => s.status === 'occupied').length;

function ParkingSlots() {
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

            {/* Legend */}
            <motion.div variants={itemVariants} className="flex gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8892b0]">
                    <div className="w-4 h-4 rounded bg-[#dcfce7] border border-[#bbf7d0]"></div>
                    AVAILABLE ({available})
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#8892b0]">
                    <div className="w-4 h-4 rounded bg-[#fee2e2] border border-[#fecaca]"></div>
                    OCCUPIED ({occupied})
                </div>
            </motion.div>

            {/* Slots Grid */}
            <motion.div
                variants={itemVariants}
                className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-8"
            >
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '16px',
                    }}
                >
                    {slots.map((slot) => (
                        <motion.div
                            key={slot.id}
                            whileHover={{ y: -2, boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}
                            className={`rounded-xl p-5 text-center cursor-default border transition-all ${
                                slot.status === 'available'
                                    ? 'bg-[#dcfce7] border-[#bbf7d0] text-[#166534]'
                                    : 'bg-[#fee2e2] border-[#fecaca] text-[#ef4444]'
                            }`}
                        >
                            <div className="text-[1.4rem] font-extrabold mb-2 tracking-tight">{slot.id}</div>
                            <div className="text-[0.7rem] uppercase font-bold tracking-[0.5px]">
                                {slot.status === 'available' ? 'Available' : 'Occupied'}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ParkingSlots;