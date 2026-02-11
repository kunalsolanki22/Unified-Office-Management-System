import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Search, Plus } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

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
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="flex justify-between items-start">
                <div>
                    <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">Hardware Manager</p>
                    <h1 className="text-[1.8rem] font-extrabold text-[#1a367c]">
                        Asset <span className="text-[#f9b012]">Inventory</span>
                    </h1>
                    <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mt-1">Manage & Assign Hardware Assets</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest flex items-center gap-2 hover:bg-[#2c4a96] transition-all hover:shadow-lg hover:shadow-blue-900/20"
                >
                    <Plus className="w-4 h-4" /> ADD ASSET
                </button>
            </motion.div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 overflow-hidden"
                    >
                        <h2 className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mb-6">New Asset Details</h2>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { key: 'type', label: 'TYPE', placeholder: 'e.g. Laptop' },
                                { key: 'brand', label: 'BRAND', placeholder: 'e.g. Dell' },
                                { key: 'model', label: 'MODEL', placeholder: 'e.g. Latitude 5520' },
                            ].map(field => (
                                <div key={field.key}>
                                    <label className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] font-bold block mb-2">{field.label}</label>
                                    <input
                                        value={newAsset[field.key]}
                                        onChange={e => setNewAsset({ ...newAsset, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full bg-[#f8f9fa] border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-xs focus:outline-none focus:border-[#1a367c]"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAdd} className="bg-[#1a367c] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">
                                SAVE ASSET
                            </button>
                            <button onClick={() => setShowForm(false)} className="bg-slate-100 text-[#8892b0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-200 transition-all">
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] border border-[#e0e0e0] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input
                        type="text"
                        placeholder="SEARCH ASSETS..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border-none bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium"
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {['Asset ID', 'Type', 'Brand', 'Model', 'Status', 'Assigned To'].map(h => (
                                <TableHead key={h} className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">{h}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(asset => (
                            <TableRow key={asset.id}>
                                <TableCell className="font-bold text-[#1a367c] text-sm">{asset.assetId}</TableCell>
                                <TableCell className="text-[#8892b0] text-sm">{asset.type}</TableCell>
                                <TableCell className="text-[#8892b0] text-sm">{asset.brand}</TableCell>
                                <TableCell className="text-[#8892b0] text-sm">{asset.model}</TableCell>
                                <TableCell>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                                        asset.status === 'Available' ? 'bg-green-50 text-green-600' :
                                        asset.status === 'Assigned' ? 'bg-blue-50 text-blue-600' :
                                        'bg-[#fff8e6] text-[#f9b012]'
                                    }`}>{asset.status}</span>
                                </TableCell>
                                <TableCell className="text-[#8892b0] text-sm">{asset.assignedTo}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </motion.div>
        </motion.div>
    );
}

export default HardwareAssets;