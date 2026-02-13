import React from 'react';
import { Check, X } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const OrdersTable = ({ orders, onUpdateStatus }) => {
    return (
        <div className="bg-white p-6 rounded-[16px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-100">
                        <TableHead className="w-[100px] text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest pl-6">Order ID</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Employee</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Items</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Total</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest text-right pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-[#fafbfb] border-b border-slate-50 last:border-0 transition-colors">
                            <TableCell className="text-[#8892b0] text-xs font-medium pl-6 py-4">#{order.id}</TableCell>
                            <TableCell className="font-bold text-[#1a367c] text-sm py-4">{order.emp}</TableCell>
                            <TableCell className="text-xs text-slate-500 font-medium py-4">{order.items}</TableCell>
                            <TableCell className="font-bold text-[#1a367c] text-sm py-4">${order.total.toFixed(2)}</TableCell>
                            <TableCell className="py-4">
                                <Badge
                                    variant={order.status === 'Completed' ? 'success' : order.status === 'Cancelled' ? 'error' : 'warning'}
                                    className="text-[0.65rem] font-bold uppercase tracking-wide"
                                >
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 py-4">
                                {order.status !== 'Completed' && order.status !== 'Cancelled' ? (
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-50 text-green-600 hover:bg-green-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                            onClick={() => onUpdateStatus(order.id, 'Completed')}
                                        >
                                            <Check className="w-3.5 h-3.5" /> OK
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-red-50 text-red-600 hover:bg-red-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                            onClick={() => onUpdateStatus(order.id, 'Cancelled')}
                                        >
                                            <X className="w-3.5 h-3.5" /> NO
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                                        {order.status === 'Completed' ? 'Fulfilled' : 'Voided'}
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default OrdersTable;
