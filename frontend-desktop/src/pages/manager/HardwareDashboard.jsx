import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Monitor, ClipboardList, Package, Building2 } from 'lucide-react';

const stats = [
    { label: 'TOTAL ASSETS', value: '48', note: 'Across all categories' },
    { label: 'PENDING REQUESTS', value: '07', note: 'Awaiting your approval' },
    { label: 'ASSIGNED ASSETS', value: '35', note: 'Currently in use' },
];

const shortcuts = [
    { icon: ClipboardList, label: 'Hardware Requests', desc: 'Review and process pending hardware requests.', path: '/manager/hardware/requests' },
    { icon: Package, label: 'Asset Inventory', desc: 'Manage all assets and assign them to employees.', path: '/manager/hardware/assets' },
    { icon: Building2, label: 'Vendor Directory', desc: 'View and manage hardware suppliers.', path: '/manager/hardware/vendors' },
];

function HardwareDashboard() {
    return (
        <div>
            <div className="mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Management Portal</p>
                <h1 className="text-3xl font-bold text-slate-900">
                    Hardware <span className="text-orange-400">Registry</span>
                </h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Inventory Assignment & Asset Control</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

export default HardwareDashboard;