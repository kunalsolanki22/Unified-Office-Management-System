import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';

const mockRequests = [
    { id: 1, employee: 'Karan Sharma', vehicle: 'MH 01 AB 1234', type: 'Car', floor: 'Ground', status: 'Pending', date: '10 Feb 2026' },
    { id: 2, employee: 'Priya Verma', vehicle: 'MH 02 CD 5678', type: 'Bike', floor: 'First', status: 'Pending', date: '10 Feb 2026' },
    { id: 3, employee: 'Marcus Bell', vehicle: 'MH 03 EF 9012', type: 'Car', floor: 'Ground', status: 'Approved', date: '09 Feb 2026' },
    { id: 4, employee: 'Elena Vance', vehicle: 'MH 04 GH 3456', type: 'Bike', floor: 'Ground', status: 'Rejected', date: '09 Feb 2026' },
];

function ParkingRequests() {
    const [requests, setRequests] = useState(mockRequests);
    const [search, setSearch] = useState('');

    const filtered = requests.filter(r =>
        r.employee.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle.toLowerCase().includes(search.toLowerCase())
    );

    const handleApprove = (id) => setRequests(requests.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    const handleReject = (id) => setRequests(requests.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));

    return (
        <div>
            <div className="mb-8">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Parking Manager</p>
                <h1 className="text-3xl font-bold text-slate-900">
                    Parking <span className="text-orange-400">Requests</span>
                </h1>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Review & Approve Employee Requests</p>
            </div>

            <Card>
                <input
                    type="text"
                    placeholder="Search by employee or vehicle..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mb-4 border border-slate-200 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Vehicle No.</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Preferred Floor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium text-slate-800">{req.employee}</TableCell>
                                <TableCell className="text-slate-600">{req.vehicle}</TableCell>
                                <TableCell className="text-slate-600">{req.type}</TableCell>
                                <TableCell className="text-slate-600">{req.floor}</TableCell>
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

export default ParkingRequests;