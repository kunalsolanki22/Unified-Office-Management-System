import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw } from 'lucide-react';
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

function HardwareRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await hardwareService.getRequests();
            console.log('Hardware requests response:', res);
            
            // Backend returns: { data: [...], total, page, page_size }
            const requestsArray = res.data || [];
            const mapped = requestsArray.map(r => ({
                id: r.id,
                employee: r.user_name || r.requested_by || '—',
                type: r.request_type || r.title || '—',
                priority: (r.priority || 'medium').charAt(0).toUpperCase() + (r.priority || 'medium').slice(1).toLowerCase(),
                status: (r.status || 'pending').charAt(0).toUpperCase() + (r.status || 'pending').slice(1).toLowerCase(),
                date: r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—',
            }));
            setRequests(mapped);
        } catch (err) {
            console.error('Failed to load requests:', err);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const filtered = requests.filter(r =>
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
    );

    const handleApprove = async (id) => {
        try {
            await hardwareService.approveRequest(id, 'approve', 'Approved by manager');
            toast.success('Request approved!');
            await fetchRequests();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to approve request');
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
                <button
                    onClick={fetchRequests}
                    className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> REFRESH
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm border border-slate-100 p-6">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input
                        type="text"
                        placeholder="SEARCH EMPLOYEE OR TYPE..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium border-none"
                    />
                </div>

                <div className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_1.5fr] pb-4 border-b border-slate-100 mb-2 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div>EMPLOYEE</div>
                    <div>REQUEST TYPE</div>
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
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-[2fr_2fr_1fr_1.5fr_1fr_1.5fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors group"  
                            >
                                <div className="text-sm font-bold text-[#1a367c]">{req.employee}</div>
                                <div className="text-sm text-[#8892b0]">{req.type}</div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide ${
                                        req.priority === 'High' ? 'bg-red-50 text-red-500' :
                                        req.priority === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>{req.priority}</span>
                                </div>
                                <div className="text-sm text-[#8892b0]">{req.date}</div>
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide ${
                                        req.status === 'Approved' ? 'bg-green-50 text-green-600' :
                                        req.status === 'Rejected' ? 'bg-red-50 text-red-500' :
                                        'bg-[#fff8e6] text-[#f9b012]'
                                    }`}>{req.status}</span>
                                </div>
                                <div>
                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleApprove(req.id)}
                                                className="bg-[#1a367c] text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all"
                                            >
                                                APPROVE
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req.id)}
                                                className="border border-red-200 text-red-500 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all"
                                            >
                                                REJECT
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
export default HardwareRequests;