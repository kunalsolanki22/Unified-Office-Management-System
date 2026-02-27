import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, X, Package, CheckCircle } from 'lucide-react';
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

const extractAssetType = (description) => {
    if (!description) return '';
    const match = description.match(/^\[Asset Type: (.+?)\]/);
    return match ? match[1] : '';
};

function HardwareRequests() {
    const [requests, setRequests] = useState([]);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Assignment modal state
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningRequest, setAssigningRequest] = useState(null);
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [assignNotes, setAssignNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await hardwareService.getRequests();
            console.log('Hardware requests response:', res);
            const requestsArray = res.data || [];

            const mapped = requestsArray.map(r => ({
                id: r.id,
                employee: r.user_name || r.requested_by || '—',
                user_code: r.user_code || r.requested_by_code || '',
                type: r.request_type || r.title || '—',
                assetType: extractAssetType(r.description),
                description: r.description || '',
                priority: (r.priority || 'medium').charAt(0).toUpperCase() + (r.priority || 'medium').slice(1).toLowerCase(),
                status: (r.status || 'pending').charAt(0).toUpperCase() + (r.status || 'pending').slice(1).toLowerCase(),
                rawStatus: (r.status || 'pending').toLowerCase(),
                date: r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—',
                assigned_asset: r.assigned_to_code || r.assigned_asset_code || null,
            }));
            setRequests(mapped);
        } catch (err) {
            console.error('Failed to load requests:', err);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableAssets = async () => {
        try {
            const res = await hardwareService.getAssets({ page_size: 100 });
            const assets = (res.data || []).filter(a => (a.status || '').toLowerCase() === 'available');
            setAvailableAssets(assets);
        } catch (err) {
            console.error('Failed to load assets:', err);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchAvailableAssets();
    }, []);

    const filtered = requests.filter(r =>
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase()) ||
        r.assetType.toLowerCase().includes(search.toLowerCase())
    );

    const pendingRequests = filtered.filter(r => r.rawStatus === 'pending');
    const processedRequests = filtered.filter(r => r.rawStatus !== 'pending');

    // Step 1: Approve the request, then open assignment modal
    const handleApprove = async (req) => {
        try {
            setSubmitting(true);
            await hardwareService.approveRequest(req.id, 'approve', 'Approved by manager');
            toast.success('Request approved! Now assign an asset.');
            await fetchRequests();

            // Open assignment modal
            setAssigningRequest(req);
            setSelectedAssetId('');
            setAssignNotes('');
            setShowAssignModal(true);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to approve request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id) => {
        try {
            await hardwareService.approveRequest(id, 'reject', '', 'Rejected by manager');
            toast.info('Request rejected');
            await fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to reject request');
        }
    };

    // Step 2: Assign selected asset to the employee
    const handleAssignAsset = async () => {
        if (!selectedAssetId) {
            toast.error('Please select an asset to assign');
            return;
        }
        try {
            setSubmitting(true);
            const userCode = assigningRequest.user_code;
            await hardwareService.assignAsset(selectedAssetId, userCode, assignNotes || `Assigned for request: ${assigningRequest.type}`);
            toast.success(`Asset assigned to ${assigningRequest.employee}!`);
            setShowAssignModal(false);
            setAssigningRequest(null);
            await fetchRequests();
            await fetchAvailableAssets();
        } catch (err) {
            console.error('Assign error:', err);
            toast.error(err.response?.data?.detail || 'Failed to assign asset');
        } finally {
            setSubmitting(false);
        }
    };

    // Open assign modal for already-approved requests that haven't been assigned yet
    const handleAssignForApproved = (req) => {
        setAssigningRequest(req);
        setSelectedAssetId('');
        setAssignNotes('');
        setShowAssignModal(true);
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
            <motion.div variants={itemVariants} className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        HARDWARE <span className="text-[#f9b012]">REQUESTS</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Review & Process Employee Requests
                    </p>
                </div>
                <button onClick={() => { fetchRequests(); fetchAvailableAssets(); }}
                    className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> REFRESH
                </button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 px-6 py-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-700">
                    <Package className="w-5 h-5" />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">Pending</div>
                        <div className="text-sm font-bold">{pendingRequests.length} requests</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 rounded-xl border bg-green-50 border-green-200 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">Available Assets</div>
                        <div className="text-sm font-bold">{availableAssets.length} ready to assign</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-700">
                    <Package className="w-5 h-5" />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">Processed</div>
                        <div className="text-sm font-bold">{processedRequests.length} requests</div>
                    </div>
                </div>
            </motion.div>

            {/* Requests Table */}
            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input type="text" placeholder="SEARCH EMPLOYEE, TYPE OR ASSET..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium border-none" />
                </div>

                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr_1fr_2fr] pb-4 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div>EMPLOYEE</div>
                    <div>REQUEST TYPE</div>
                    <div>ASSET TYPE</div>
                    <div>PRIORITY</div>
                    <div>DATE</div>
                    <div>STATUS</div>
                    <div>ACTIONS</div>
                </div>

                <div className="space-y-1">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-[#8892b0] text-sm">No requests found</div>
                    ) : (
                        filtered.map((req) => (
                            <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1.5fr_1fr_2fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors">
                                <div className="text-sm font-bold text-[#1a367c]">{req.employee}</div>
                                <div className="text-sm text-[#8892b0]">{req.type}</div>
                                <div className="text-sm text-[#1a367c] font-medium">{req.assetType || '—'}</div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide ${
                                        req.priority === 'High' ? 'bg-red-50 text-red-500' :
                                        req.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                                        req.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>{req.priority}</span>
                                </div>
                                <div className="text-sm text-[#8892b0]">{req.date}</div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide ${
                                        req.rawStatus === 'approved' ? 'bg-green-50 text-green-600' :
                                        req.rawStatus === 'rejected' ? 'bg-red-50 text-red-500' :
                                        'bg-[#fff8e6] text-[#f9b012]'
                                    }`}>{req.status}</span>
                                </div>
                                <div className="flex gap-2">
                                    {req.rawStatus === 'pending' && (
                                        <>
                                            <button onClick={() => handleApprove(req)} disabled={submitting}
                                                className="bg-[#1a367c] text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all disabled:opacity-50">
                                                APPROVE
                                            </button>
                                            <button onClick={() => handleReject(req.id)}
                                                className="border border-red-200 text-red-500 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all">
                                                REJECT
                                            </button>
                                        </>
                                    )}
                                    {req.rawStatus === 'approved' && !req.assigned_asset && (
                                        <button onClick={() => handleAssignForApproved(req)}
                                            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-green-700 transition-all flex items-center gap-1">
                                            <Package className="w-3 h-3" /> ASSIGN ASSET
                                        </button>
                                    )}
                                    {req.assigned_asset && (
                                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> {req.assigned_asset}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            {/* Assignment Modal */}
            <AnimatePresence>
                {showAssignModal && assigningRequest && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                        onClick={() => setShowAssignModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-[24px] shadow-2xl border border-slate-100 p-8 w-[560px] max-h-[80vh] overflow-y-auto">

                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[#1a367c]">Assign Asset</h3>
                                <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Request Summary */}
                            <div className="bg-blue-50 rounded-xl p-4 mb-6">
                                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Request Details</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-[#8892b0]">Employee:</span> <span className="font-bold text-[#1a367c]">{assigningRequest.employee}</span></div>
                                    <div><span className="text-[#8892b0]">Request:</span> <span className="font-bold text-[#1a367c]">{assigningRequest.type}</span></div>
                                    <div><span className="text-[#8892b0]">Asset Type:</span> <span className="font-bold text-[#1a367c]">{assigningRequest.assetType || 'Any'}</span></div>
                                    <div><span className="text-[#8892b0]">Priority:</span> <span className="font-bold text-[#1a367c]">{assigningRequest.priority}</span></div>
                                </div>
                            </div>

                            {/* Asset Selection */}
                            <div className="mb-5">
                                <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">SELECT ASSET TO ASSIGN</label>
                                <select value={selectedAssetId} onChange={e => setSelectedAssetId(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors">
                                    <option value="">Choose an asset...</option>
                                    {availableAssets.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.asset_code} — {a.asset_type || a.category || ''} {a.brand ? `(${a.brand} ${a.model || ''})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {availableAssets.length === 0 && (
                                    <p className="text-xs text-red-500 mt-2">No available assets. Add new assets first.</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="mb-6">
                                <label className="text-[0.7rem] font-bold text-[#8892b0] tracking-widest mb-2 block">NOTES (OPTIONAL)</label>
                                <textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)}
                                    placeholder="e.g. Assigned new Dell laptop for onboarding"
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1a367c] outline-none focus:border-[#1a367c] transition-colors resize-none" />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button onClick={handleAssignAsset} disabled={submitting || !selectedAssetId}
                                    className="flex-1 bg-[#1a367c] text-white py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    <Package className="w-4 h-4" />
                                    {submitting ? 'ASSIGNING...' : 'ASSIGN ASSET'}
                                </button>
                                <button onClick={() => setShowAssignModal(false)}
                                    className="border border-slate-200 text-[#8892b0] px-6 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all">
                                    SKIP FOR NOW
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default HardwareRequests;