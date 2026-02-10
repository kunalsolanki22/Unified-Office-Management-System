import { useState } from 'react';
import { Card } from '../../components/ui/Card';

const generateSlots = (floor, count) =>
    Array.from({ length: count }, (_, i) => ({
        id: `${floor}-${String(i + 1).padStart(2, '0')}`,
        floor,
        status: Math.random() > 0.4 ? 'Occupied' : 'Available',
        assignedTo: Math.random() > 0.4 ? 'Employee' : '-',
    }));

const groundFloor = generateSlots('G', 30);
const firstFloor = generateSlots('F1', 30);

function ParkingSlots() {
    const [slots] = useState({ ground: groundFloor, first: firstFloor });
    const [activeFloor, setActiveFloor] = useState('ground');

    const current = slots[activeFloor];
    const available = current.filter(s => s.status === 'Available').length;
    const occupied = current.filter(s => s.status === 'Occupied').length;

    return (
        <div>
            <div className="mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Parking Manager</p>
                <h1 className="text-3xl font-bold text-slate-900">
                    Slot <span className="text-orange-400">Map</span>
                </h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Floor-wise Slot Availability</p>
            </div>

            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setActiveFloor('ground')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-widest ${activeFloor === 'ground' ? 'bg-[#1a3a5c] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    Ground Floor
                </button>
                <button
                    onClick={() => setActiveFloor('first')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium uppercase tracking-widest ${activeFloor === 'first' ? 'bg-[#1a3a5c] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    First Floor
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div> Available ({available})
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div> Occupied ({occupied})
                </div>
            </div>

            <Card>
                <div className="grid grid-cols-6 md:grid-cols-10 gap-3">
                    {current.map(slot => (
                        <div
                            key={slot.id}
                            className={`rounded-lg p-3 text-center text-xs font-medium border ${
                                slot.status === 'Available'
                                    ? 'bg-green-50 border-green-200 text-green-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                            }`}
                        >
                            {slot.id}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default ParkingSlots;