import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';

const RecentOrders = ({ orders }) => {
    // Ensure orders is an array
    const safeOrders = Array.isArray(orders) ? orders : [];

    return (
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-[#1a367c]">Recent Food Orders</div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-100">
                        <TableHead className="w-[80px] text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest pl-4">ID</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Employee</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Food Item</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest text-center">Qty</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest text-right pr-4">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {safeOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                                No recent orders found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        safeOrders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-[#fafbfb] border-b border-slate-50 last:border-0 transition-colors">
                                <TableCell className="text-[#8892b0] text-[0.7rem] font-medium pl-4 py-3">{order.id.toString().substring(0, 8)}</TableCell>
                                <TableCell className="font-bold text-[#1a367c] text-sm py-3">{order.emp}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-medium py-3 truncate max-w-[120px]" title={order.items}>{order.items}</TableCell>
                                <TableCell className="font-bold text-[#1a367c] text-sm text-center py-3">{order.qty || '01'}</TableCell>
                                <TableCell className="text-right pr-4 py-3">
                                    <Badge
                                        variant={order.status === 'COMPLETED' ? 'success' : order.status === 'PENDING' ? 'warning' : 'outline'}
                                        className="text-[0.65rem] font-bold uppercase tracking-wide"
                                    >
                                        {order.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default RecentOrders;
