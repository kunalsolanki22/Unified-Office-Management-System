import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';

const mockAssets = [
    { id: 1, assetId: 'AST-001', type: 'Laptop', brand: 'Dell', model: 'Latitude 5520', status: 'Assigned', assignedTo: 'Karan Sharma' },
    { id: 2, assetId: 'AST-002', type: 'Monitor', brand: 'Samsung', model: '27" FHD', status: 'Available', assignedTo: '-' },
    { id: 3, assetId: 'AST-003', type: 'Keyboard', brand: 'Logitech', model: 'K380', status: 'Maintenance', assignedTo: '-' },
    { id: 4, assetId: 'AST-004', type: 'Laptop', brand: 'HP', model: 'EliteBook 840', status: 'Available', assignedTo: '-' },
];

function HardwareAssets() {
    const [assets, setAssets] = useState(mockAssets);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newAsset, setNewAsset] = useState({ type: '', brand: '', model: '' });

    const filtered = assets.filter(a =>
        a.assetId.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase()) ||
        a.brand.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        if (!newAsset.type || !newAsset.brand || !newAsset.model) return;
        setAssets([...assets, {
            id: assets.length + 1,
            assetId: `AST-00${assets.length + 1}`,
            ...newAsset,
            status: 'Available',
            assignedTo: '-'
        }]);
        setNewAsset({ type: '', brand: '', model: '' });
        setShowForm(false);
    };

    return (
        <div>
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Hardware Manager</p>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Asset <span className="text-orange-400">Inventory</span>
                    </h1>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Manage & Assign Hardware Assets</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#1a3a5c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16324f] uppercase tracking-widest"
                >
                    + Add Asset
                </button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <h2 className="font-semibold text-slate-800 mb-4 uppercase tracking-widest text-sm">Add New Asset</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { key: 'type', label: 'Type', placeholder: 'e.g. Laptop' },
                            { key: 'brand', label: 'Brand', placeholder: 'e.g. Dell' },
                            { key: 'model', label: 'Model', placeholder: 'e.g. Latitude 5520' },
                        ].map(field => (
                            <div key={field.key}>
                                <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">{field.label}</label>
                                <input
                                    value={newAsset[field.key]}
                                    onChange={e => setNewAsset({ ...newAsset, [field.key]: e.target.value })}
                                    placeholder={field.placeholder}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleAdd} className="bg-orange-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-500 uppercase tracking-widest">
                            Save Asset
                        </button>
                        <button onClick={() => setShowForm(false)} className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 uppercase tracking-widest">
                            Cancel
                        </button>
                    </div>
                </Card>
            )}

            <Card>
                <input
                    type="text"
                    placeholder="Search by asset ID, type or brand..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mb-4 border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(asset => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-medium text-[#1a3a5c]">{asset.assetId}</TableCell>
                                <TableCell className="text-slate-600">{asset.type}</TableCell>
                                <TableCell className="text-slate-600">{asset.brand}</TableCell>
                                <TableCell className="text-slate-600">{asset.model}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        asset.status === 'Available' ? 'bg-green-100 text-green-600' :
                                        asset.status === 'Assigned' ? 'bg-blue-100 text-blue-600' :
                                        'bg-orange-100 text-orange-600'
                                    }`}>{asset.status}</span>
                                </TableCell>
                                <TableCell className="text-slate-500">{asset.assignedTo}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

export default HardwareAssets;