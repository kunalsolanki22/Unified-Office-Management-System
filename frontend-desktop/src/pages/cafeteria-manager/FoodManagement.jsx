import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import InventoryTable from '../../components/cafeteria-manager/InventoryTable';
import OrdersTable from '../../components/cafeteria-manager/OrdersTable';
import AddFoodModal from '../../components/cafeteria-manager/AddFoodModal';

const FoodManagement = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Mock Data
    const [inventory, setInventory] = useState([
        { id: 1, name: 'Executive Veg Thali', category: 'Main Course', price: 12.00, status: 'Available' },
        { id: 2, name: 'Chicken Burger', category: 'Snacks', price: 8.50, status: 'Available' },
        { id: 3, name: 'Cold Coffee', category: 'Beverages', price: 4.00, status: 'Out of Stock' },
    ]);

    const [orders, setOrders] = useState([
        { id: 'ORD-881', emp: 'Sarah Wilson', items: 'Executive Veg Thali', total: 12.00, status: 'Pending' },
        { id: 'ORD-882', emp: 'Mike Ross', items: 'Chicken Burger (x2)', total: 17.00, status: 'Completed' },
        { id: 'ORD-883', emp: 'Rachel Zane', items: 'Cold Coffee', total: 4.00, status: 'Pending' }
    ]);

    // Handlers
    const handleAddFood = (newItem) => {
        setInventory([...inventory, { ...newItem, id: Date.now() }]);
    };

    const handleDeleteItem = (id) => {
        setInventory(inventory.filter(item => item.id !== id));
    };

    const handleToggleStatus = (id) => {
        setInventory(inventory.map(item =>
            item.id === id
                ? { ...item, status: item.status === 'Available' ? 'Unavailable' : 'Available' }
                : item
        ));
    };

    const handleUpdateOrderStatus = (id, newStatus) => {
        setOrders(orders.map(order =>
            order.id === id ? { ...order, status: newStatus } : order
        ));
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1a367c] tracking-tight">Inventory & Orders</h1>
                    <p className="text-sm text-[#8892b0] font-medium mt-1">Manage inventory and process incoming orders.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-4 h-4" /> New Item
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all border-b-2 ${activeTab === 'inventory'
                        ? 'text-[#1a367c] border-[#f9b012]'
                        : 'text-[#8892b0] border-transparent hover:text-[#1a367c]'
                        }`}
                >
                    Inventory
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-3 text-sm font-bold tracking-wide uppercase transition-all border-b-2 ${activeTab === 'orders'
                        ? 'text-[#1a367c] border-[#f9b012]'
                        : 'text-[#8892b0] border-transparent hover:text-[#1a367c]'
                        }`}
                >
                    Incoming Orders
                </button>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'inventory' ? (
                    <InventoryTable inventory={inventory} onDelete={handleDeleteItem} onToggleStatus={handleToggleStatus} />
                ) : (
                    <OrdersTable orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
                )}
            </div>

            {/* Modals */}
            <AddFoodModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddFood}
            />
        </div>
    );
};

export default FoodManagement;
