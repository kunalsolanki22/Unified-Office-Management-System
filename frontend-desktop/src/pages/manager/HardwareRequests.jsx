import { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Search } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const mockRequests = [
    { id: 1, employee: 'Karan Sharma', type: 'New Laptop', urgency: 'High', status: 'Pending', date: '10 Feb 2026' },
    { id: 2, employee: 'Priya Verma', type: 'Mouse Replacement', urgency: 'Low', status: 'Pending', date: '10 Feb 2026' },
    { id: 3, employee: 'Marcus Bell', type: 'Monitor Repair', urgency: 'Medium', status: 'Approved', date: '09 Feb 2026' },
    { id: 4, employee: 'Elena Vance', type: 'Keyboard', urgency: 'Low', status: 'Rejected', date: '09 Feb 2026' },
    { id: 5, employee: 'David Chen', type: 'Docking Station', urgency: 'Medium', status: 'Pending', date: '08 Feb 2026' },
];

function HardwareRequests() {
    const [requests, setRequests] = useState(mockRequests);
    const [search, setSearch] = useState('');

    const filtered = requests.filter(r =>
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase())
    );

    const handleApprove = (id) => setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    const handleReject = (id) => setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants}>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">Hardware Manager</p>
                <h1 className="text-[1.8rem] font-extrabold text-[#1a367c]">
                    Hardware <span className="text-[#f9b012]">Requests</span>
                </h1>
                <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mt-1">Review & Process Employee Requests</p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center bg-[#f8f9fa] rounded-full px-5 py-2.5 w-[300px] border border-[#e0e0e0] mb-6">
                    <Search className="w-4 h-4 text-[#b0b0b0]" />
                    <input
                        type="text"
                        placeholder="SEARCH EMPLOYEE OR TYPE..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border-none bg-transparent outline-none ml-2.5 w-full text-[0.8rem] tracking-wide text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-[0.7rem] placeholder:tracking-[1.5px] font-medium"
                    />
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">Employee</TableHead>
                            <TableHead className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">Request Type</TableHead>
                            <TableHead className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">Urgency</TableHead>
                            <TableHead className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">Date</TableHead>
                            <TableHead className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">Status</TableHead>
                            <TableHead className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-bold text-[#1a367c] text-sm">{req.employee}</TableCell>
                                <TableCell className="text-[#8892b0] text-sm">{req.type}</TableCell>
                                <TableCell>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                                        req.urgency === 'High' ? 'bg-red-50 text-red-500' :
                                        req.urgency === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>{req.urgency}</span>
                                </TableCell>
                                <TableCell className="text-[#8892b0] text-sm">{req.date}</TableCell>
                                <TableCell>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                                        req.status === 'Approved' ? 'bg-green-50 text-green-600' :
                                        req.status === 'Rejected' ? 'bg-red-50 text-red-500' :
                                        'bg-[#fff8e6] text-[#f9b012]'
                                    }`}>{req.status}</span>
                                </TableCell>
                                <TableCell>
                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApprove(req.id)} className="bg-[#1a367c] text-white px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">
                                                APPROVE
                                            </button>
                                            <button onClick={() => handleReject(req.id)} className="border border-red-300 text-red-500 px-4 py-1.5 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all">
                                                REJECT
                                            </button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </motion.div>
        </motion.div>
    );
}

export default HardwareRequests;