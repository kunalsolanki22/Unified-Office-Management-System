import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

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
        <div>
            <div className="mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Hardware Manager</p>
                <h1 className="text-3xl font-bold text-slate-900">
                    Hardware <span className="text-orange-400">Requests</span>
                </h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Review & Process Employee Requests</p>
            </div>

            <Card>
                <input
                    type="text"
                    placeholder="Search by employee or type..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mb-4 border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Request Type</TableHead>
                            <TableHead>Urgency</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium text-slate-800">{req.employee}</TableCell>
                                <TableCell className="text-slate-600">{req.type}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        req.urgency === 'High' ? 'bg-red-100 text-red-600' :
                                        req.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-green-100 text-green-600'
                                    }`}>{req.urgency}</span>
                                </TableCell>
                                <TableCell className="text-slate-500">{req.date}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        req.status === 'Approved' ? 'bg-green-100 text-green-600' :
                                        req.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                        'bg-yellow-100 text-yellow-600'
                                    }`}>{req.status}</span>
                                </TableCell>
                                <TableCell>
                                    {req.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApprove(req.id)} className="bg-[#1a3a5c] text-white px-3 py-1 rounded text-xs hover:bg-[#16324f] uppercase tracking-widest">
                                                Approve
                                            </button>
                                            <button onClick={() => handleReject(req.id)} className="border border-red-400 text-red-400 px-3 py-1 rounded text-xs hover:bg-red-50 uppercase tracking-widest">
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

export default HardwareRequests;