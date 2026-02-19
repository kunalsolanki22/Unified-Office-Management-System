import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { hardwareService } from '../../services/hardwareService';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function HardwareAssets() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [newAsset, setNewAsset] = useState({ asset_type: '', vendor: '', model: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const res = await hardwareService.getAssets();
            console.log('Hardware assets response:', res);

            const assetsArray = res.data || [];
            const mapped = assetsArray.map(a => ({
                id: a.id,
                assetId: a.asset_code,
                type: a.asset_type,
                name: a.name,
                vendor: a.vendor || '—',
                model: a.model || '—',
                status: (a.status || 'available').charAt(0).toUpperCase() + (a.status || 'available').slice(1).toLowerCase(),
                assignedTo: a.current_assignment?.user_name || '—',
            }));
            setAssets(mapped);
        } catch (err) {
            console.error('Failed to load assets:', err);
            toast.error('Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAssets(); }, []);

    const filtered = assets.filter(a =>
        a.assetId.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase()) ||
        a.vendor.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async () => {
        if (!newAsset.asset_type || !newAsset.vendor || !newAsset.model) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            setSubmitting(true);
            await hardwareService.createAsset({
                name: `${newAsset.vendor} ${newAsset.model}`,
                asset_type: newAsset.asset_type.toUpperCase(),
                vendor: newAsset.vendor,
                model: newAsset.model,
            });
            toast.success(`Asset added successfully!`);
            setNewAsset({ asset_type: '', vendor: '', model: '' });
            setShowForm(false);
            await fetchAssets();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to add asset');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        ASSET <span className="text-[#f9b012]">INVENTORY</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Manage & Assign Hardware Assets
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchAssets}
                        className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> REFRESH
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-[#1a367c] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> ADD ASSET
                    </button>
                </div>
            </motion.div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">ADD NEW ASSET</h3>
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">TYPE</label>
                                <select
                                    value={newAsset.asset_type}
                                    onChange={e => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                >
                                    <option value="">Select type</option>
                                    <option value="LAPTOP">Laptop</option>
                                    <option value="MONITOR">Monitor</option>
                                    <option value="KEYBOARD">Keyboard</option>
                                    <option value="MOUSE">Mouse</option>
                                    <option value="HEADSET">Headset</option>
                                    <option value="DOCKING_STATION">Docking Station</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            {[
                                { key: 'vendor', label: 'VENDOR', placeholder: 'e.g. Dell' },
                                { key: 'model', label: 'MODEL', placeholder: 'e.g. Latitude 5520' },
                            ].map(field => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">{field.label}</label>
                                    <input
                                        value={newAsset[field.key]}
                                        onChange={e => setNewAsset({ ...newAsset, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                                CANCEL
                            </button>
                            <button onClick={handleAdd} disabled={submitting} className={`px-6 py-3 rounded-xl text-white text-xs font-bold transition-colors shadow-lg shadow-blue-900/10 ${submitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1a367c] hover:bg-[#2c4a96]'}`}>
                                {submitting ? 'SAVING...' : '+ SAVE ASSET'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input
                        type="text"
                        placeholder="SEARCH ASSETS..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium border-none"
                    />
                </div>

                <div className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr_1.5fr] pb-4 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div>ASSET ID</div>
                    <div>TYPE</div>
                    <div>VENDOR</div>
                    <div>MODEL</div>
                    <div>STATUS</div>
                    <div>ASSIGNED TO</div>
                </div>

                <div className="space-y-1">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-[#8892b0] text-sm">No assets found</div>
                    ) : (
                        filtered.map((asset) => (
                            <motion.div
                                key={asset.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-[1fr_1fr_1fr_1.5fr_1fr_1.5fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors"
                            >
                                <div className="text-sm font-bold text-[#1a367c]">{asset.assetId}</div>
                                <div className="text-sm text-[#8892b0]">{asset.type}</div>
                                <div className="text-sm text-[#8892b0]">{asset.vendor}</div>
                                <div className="text-sm text-[#8892b0]">{asset.model}</div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide ${
                                        asset.status === 'Available' ? 'bg-green-50 text-green-600' :
                                        asset.status === 'Assigned' ? 'bg-blue-50 text-blue-600' :
                                        'bg-[#fff8e6] text-[#f9b012]'
                                    }`}>{asset.status}</span>
                                </div>
                                <div className="text-sm text-[#8892b0]">{asset.assignedTo}</div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default HardwareAssets;