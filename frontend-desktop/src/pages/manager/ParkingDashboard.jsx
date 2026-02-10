import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { MapPin, CheckSquare } from 'lucide-react';

const stats = [
    { label: 'TOTAL SLOTS', value: '60', note: 'Ground + First Floor' },
    { label: 'OCCUPIED', value: '43', note: 'Currently in use' },
    { label: 'PENDING REQUESTS', value: '05', note: 'Awaiting approval' },
];

const shortcuts = [
    { icon: MapPin, label: 'Slot Map', desc: 'View floor-wise slot availability and assign slots.', path: '/manager/parking/slots' },
    { icon: CheckSquare, label: 'Parking Requests', desc: 'Review and approve employee parking requests.', path: '/manager/parking/requests' },
];

function ParkingDashboard() {
    return (
        <div>
            <div className="mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Management Portal</p>
                <h1 className="text-3xl font-bold text-slate-900">
                    Parking <span className="text-orange-400">Manager</span>
                </h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Slot & Capacity Controls</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map(stat => (
                    <Card key={stat.label}>
                        <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                        <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{stat.note}</p>
                        <div className="h-1 w-8 bg-orange-400 mt-4 rounded"></div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shortcuts.map(item => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.label} className="bg-[#1a3a5c] border-[#1a3a5c]">
                            <Icon className="h-8 w-8 text-orange-400 mb-4" />
                            <h2 className="text-lg font-bold text-white mb-2">{item.label}</h2>
                            <p className="text-sm text-slate-300 mb-4">{item.desc}</p>
                            <Link
                                to={item.path}
                                className="inline-block bg-orange-400 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-500 uppercase tracking-widest"
                            >
                                Open
                            </Link>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default ParkingDashboard;