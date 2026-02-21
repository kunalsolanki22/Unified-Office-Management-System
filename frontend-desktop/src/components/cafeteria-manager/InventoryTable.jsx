import React, { useState, useEffect } from 'react';
import { Trash2, Ban, CheckCircle, Pencil } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cafeteriaService } from '../../services/cafeteriaService';

const InventoryTable = ({ items, onDelete, onToggleStatus, onEdit }) => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(!items);

    useEffect(() => {
        if (items) {
            setInventory(items);
            setLoading(false);
            return;
        }

        const fetchInventory = async () => {
            try {
                // Fetch only first 5 items for dashboard view if no items prop
                const response = await cafeteriaService.getFoodItems({ page: 1, page_size: 5 });
                const itemsList = response.data || response.items || [];

                const formattedItems = itemsList.map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category_name || 'General',
                    price: item.price !== undefined ? parseFloat(item.price) : 0,
                    status: item.is_available ? 'Available' : 'Unavailable'
                }));

                setInventory(formattedItems);
            } catch (error) {
                console.error("Failed to fetch inventory", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInventory();
    }, [items]);

    if (loading) {
        return <div className="text-center py-4 text-sm text-gray-500">Loading menu items...</div>;
    }

    // Helper to format price safely
    const formatPrice = (price) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
    };

    return (
        <div className="bg-white p-6 rounded-[16px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-[#1a367c]">Menu Items</div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-slate-100">
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest pl-6">Item Name</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Category</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Price</TableHead>
                        <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest">Status</TableHead>
                        {/* Only show Actions if handlers are provided */}
                        {(onDelete || onToggleStatus || onEdit) && (
                            <TableHead className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-widest text-right pr-6">Actions</TableHead>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {inventory.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={(onDelete || onToggleStatus || onEdit) ? 5 : 4} className="text-center py-8 text-gray-500 text-sm">
                                No menu items found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        inventory.map((item) => (
                            <TableRow key={item.id} className="hover:bg-[#fafbfb] border-b border-slate-50 last:border-0 transition-colors">
                                <TableCell className="font-bold text-[#1a367c] text-sm pl-6 py-4">{item.name}</TableCell>
                                <TableCell className="text-xs font-bold text-[#8892b0] tracking-wide uppercase py-4">{item.category}</TableCell>
                                <TableCell className="font-bold text-[#1a367c] text-sm py-4">${formatPrice(item.price)}</TableCell>
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
                                        {onToggleStatus && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`${item.status === 'Available' ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'} h-8 w-8 p-0 rounded-full`}
                                                onClick={() => onToggleStatus(item.id)}
                                                title={item.status === 'Available' ? "Mark as Unavailable" : "Mark as Available"}
                                            >
                                                {item.status === 'Available' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </Button>
                                        )}
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0 rounded-full"
                                                onClick={() => onEdit(item)}
                                                title="Edit Item"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                                                onClick={() => onDelete(item.id)}
                                                title="Delete Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default InventoryTable;
