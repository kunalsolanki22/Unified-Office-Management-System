import React from 'react';
import { Trash2, Ban, CheckCircle } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const InventoryTable = ({ inventory, onDelete, onToggleStatus }) => {
    return (
        <div className="bg-white p-6 rounded-[16px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-100">
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest pl-6">Item Name</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Category</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Price</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest text-right pr-6">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventory.map((item) => (
                        <TableRow key={item.id} className="hover:bg-[#fafbfb] border-b border-slate-50 last:border-0 transition-colors">
                            <TableCell className="font-bold text-[#1a367c] text-sm pl-6 py-4">{item.name}</TableCell>
                            <TableCell className="text-xs font-bold text-[#8892b0] tracking-wide uppercase py-4">{item.category}</TableCell>
                            <TableCell className="font-bold text-[#1a367c] text-sm py-4">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="py-4">
                                <Badge
                                    variant={item.status === 'Available' ? 'success' : 'warning'}
                                    className="text-[0.65rem] font-bold uppercase tracking-wide"
                                >
                                    {item.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-right pr-6">
                                <div className="flex justify-end gap-2 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`${item.status === 'Available' ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'} h-8 w-8 p-0 rounded-full`}
                                        onClick={() => onToggleStatus(item.id)}
                                        title={item.status === 'Available' ? "Mark as Unavailable" : "Mark as Available"}
                                    >
                                        {item.status === 'Available' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                                        onClick={() => onDelete(item.id)}
                                        title="Delete Item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default InventoryTable;
