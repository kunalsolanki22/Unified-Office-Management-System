import { useState } from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const generateSlots = (floor, count) =>
    Array.from({ length: count }, (_, i) => ({
        id: `${floor}-${String(i + 1).padStart(2, '0')}`,
        status: Math.random() > 0.4 ? 'Occupied' : 'Available',
    }));

const groundFloor = generateSlots('G', 30);
const firstFloor = generateSlots('F1', 30);

function ParkingSlots() {
    const [activeFloor, setActiveFloor] = useState('ground');
    const slots = activeFloor === 'ground' ? groundFloor : firstFloor;
    const available = slots.filter(s => s.status === 'Available').length;
    const occupied = slots.filter(s => s.status === 'Occupied').length;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants}>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">Parking Manager</p>
                <h1 className="text-[1.8rem] font-extrabold text-[#1a367c]">
                    Slot <span className="text-[#f9b012]">Map</span>
                </h1>
                <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mt-1">Floor-wise Slot Availability</p>
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-3">
                {['ground', 'first'].map(floor => (
                    <button
                        key={floor}
                        onClick={() => setActiveFloor(floor)}
                        className={`px-6 py-3 rounded-xl text-xs font-bold tracking-widest transition-all ${
                            activeFloor === floor
                                ? 'bg-[#1a367c] text-white shadow-lg shadow-[#1a367c26]'
                                : 'bg-white text-[#8892b0] border border-[#e0e0e0] hover:bg-[#1a367c] hover:text-white hover:shadow-lg'
                        }`}
                    >
                        {floor === 'ground' ? 'GROUND FLOOR' : 'FIRST FLOOR'}
                    </button>
                ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex gap-6">
                <div className="flex items-center gap-2 text-xs text-[#8892b0] font-bold">
                    <div className="w-4 h-4 rounded bg-green-50 border border-green-300"></div>
                    AVAILABLE ({available})
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8892b0] font-bold">
                    <div className="w-4 h-4 rounded bg-red-50 border border-red-300"></div>
                    OCCUPIED ({occupied})
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
                <div className="grid grid-cols-6 md:grid-cols-10 gap-3">
                    {slots.map(slot => (
                        <div
                            key={slot.id}
                            className={`rounded-xl p-3 text-center text-xs font-bold border transition-all hover:-translate-y-1 ${
                                slot.status === 'Available'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-red-50 border-red-200 text-red-600'
                            }`}
                        >
                            {slot.id}
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default ParkingSlots;