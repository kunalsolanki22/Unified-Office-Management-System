import React from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const MenuManagement = () => {
    const [menuItems, setMenuItems] = React.useState([
        { id: 1, name: 'Veg Sandwich', cat: 'Snacks', price: '₹120', status: 'Available' },
        { id: 2, name: 'Chicken Wrap', cat: 'Main Course', price: '₹180', status: 'Available' },
        { id: 3, name: 'Cold Coffee', cat: 'Beverages', price: '₹90', status: 'Out of Stock' }
    ]);

    const handleAdd = () => {
        toast.info("Add New Item Modal Triggered");
    };

    const handleEdit = (item) => {
        toast.info(`Editing ${item.name}`);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            setMenuItems(prev => prev.filter(item => item.id !== id));
            toast.error("Item Deleted");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    MENU <span className="text-[#f9b012]">MANAGEMENT</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Update Items, Prices, and Availability
                </p>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={handleAdd}
                        className="bg-[#1a367c] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest flex items-center gap-2 hover:bg-[#2c4a96] transition-all shadow-md">
                        <Plus className="w-4 h-4" /> ADD NEW ITEM
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-4 px-4 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-wider">Item Name</th>
                                <th className="py-4 px-4 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-wider">Category</th>
                                <th className="py-4 px-4 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-wider">Price</th>
                                <th className="py-4 px-4 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-wider">Status</th>
                                <th className="py-4 px-4 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {menuItems.map((item) => (
                                <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4 font-semibold text-[#1a367c] text-sm">{item.name}</td>
                                    <td className="py-4 px-4 text-sm text-slate-600">{item.cat}</td>
                                    <td className="py-4 px-4 font-bold text-[#1a367c] text-sm">{item.price}</td>
                                    <td className="py-4 px-4">
                                        <span className={`text-[0.65rem] font-bold px-2 py-1 rounded-md uppercase ${item.status === 'Available' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MenuManagement;
