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
                    {orders.map((order) => {
                        const status = order.status ? String(order.status).toUpperCase().trim() : '';

                        return (
                            <TableRow key={order.id} className="hover:bg-[#fafbfb] border-b border-slate-50 last:border-0 transition-colors">
                                <TableCell className="text-[#8892b0] text-xs font-medium pl-6 py-4">#{order.orderNumber || order.id}</TableCell>
                                <TableCell className="font-bold text-[#1a367c] text-sm py-4">{order.emp}</TableCell>
                                <TableCell className="text-xs text-slate-500 font-medium py-4">{order.items}</TableCell>
                                <TableCell className="font-bold text-[#1a367c] text-sm py-4">${order.total.toFixed(2)}</TableCell>
                                <TableCell className="py-4">
                                    <Badge
                                        variant={
                                            status === 'DELIVERED' ? 'success' :
                                                status === 'CANCELLED' ? 'error' :
                                                    status === 'READY' ? 'info' :
                                                        status === 'PREPARING' ? 'warning' : 'default'
                                        }
                                        className="text-[0.65rem] font-bold uppercase tracking-wide"
                                    >
                                        {status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6 py-4">
                                    {status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                                onClick={() => onUpdateStatus(order.id, 'preparing')}
                                            >
                                                Prepare
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-red-50 text-red-600 hover:bg-red-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                    {status === 'PREPARING' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                                onClick={() => onUpdateStatus(order.id, 'ready')}
                                            >
                                                Ready
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-red-50 text-red-600 hover:bg-red-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                    {status === 'READY' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-50 text-green-600 hover:bg-green-100 border-none h-8 px-3 gap-1 rounded-lg text-xs font-bold"
                                                onClick={() => onUpdateStatus(order.id, 'delivered')}
                                            >
                                                Deliver
                                            </Button>
                                        </div>
                                    )}
                                    {(status === 'DELIVERED' || status === 'CANCELLED') && (
                                        <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                                            {status}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div >
    );
};

export default OrdersTable;
