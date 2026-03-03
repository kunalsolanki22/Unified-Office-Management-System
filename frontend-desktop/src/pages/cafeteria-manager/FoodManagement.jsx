import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import InventoryTable from '../../components/cafeteria-manager/InventoryTable';
import OrdersTable from '../../components/cafeteria-manager/OrdersTable';
import AddFoodModal from '../../components/cafeteria-manager/AddFoodModal';
import { cafeteriaService } from '../../services/cafeteriaService';

const FoodManagement = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const response = await cafeteriaService.getFoodItems({ page: 1, page_size: 100 });
            const itemsList = response.data || response.items || [];

            const formattedItems = itemsList.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category_name || 'General',
                price: item.price !== undefined ? parseFloat(item.price) : 0,
                status: item.is_available ? 'Available' : (item.is_active ? 'Unavailable' : 'Out of Stock')
            }));
            setInventory(formattedItems);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            toast.error("Failed to load inventory items.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await cafeteriaService.getOrders({ page: 1, page_size: 20 });
            const ordersList = response.data || response.orders || [];

            // Helper to format items string
            const formatItems = (items) => {
                if (!items || items.length === 0) return 'No Items';
                return items.map(i => `${i.item_name} ${i.quantity > 1 ? `(x${i.quantity})` : ''}`).join(', ');
            };

            const formattedOrders = ordersList.map(order => ({
                id: order.id,
                orderNumber: order.order_number,
                emp: order.user_name || `User ${order.user_code ? order.user_code.substring(0, 6) : 'Unknown'}`,
                items: formatItems(order.items),
                total: parseFloat(order.total_amount),
                status: order.status
            }));
            setOrders(formattedOrders);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'inventory') {
            fetchInventory();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    // Handlers
    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleModalSubmit = async (formData) => {
        try {
            const payload = {
                name: formData.name,
                category_name: formData.category, // Backend expects category_name
                price: formData.price,
                is_available: formData.status === 'Available',
                // Default values
                description: '',
                preparation_time_minutes: 15,
                is_active: true
            };

            let promise;
            if (editingItem) {
                promise = cafeteriaService.updateFoodItem(editingItem.id, payload);
            } else {
                promise = cafeteriaService.createFoodItem(payload);
            }

            await toast.promise(promise, {
                pending: editingItem ? 'Updating item...' : 'Adding item...',
                success: editingItem ? 'Item updated successfully!' : 'Item added successfully!',
                error: 'Failed to save item. Please try again.'
            });

            fetchInventory();
        } catch (error) {
            console.error("Failed to save food item", error);
            // Toast handled by promise
        }
    };



    const handleToggleStatus = async (id) => {
        const item = inventory.find(i => i.id === id);
        if (!item) return;
        const newStatus = item.status === 'Available' ? false : true;

        toast.promise(
            async () => {
                await cafeteriaService.updateFoodItem(id, { is_available: newStatus });
                fetchInventory();
            },
            {
                pending: 'Updating status...',
                success: 'Status updated!',
                error: 'Failed to update status.'
            }
        );
    };

    const handleUpdateOrderStatus = async (id, newStatus) => {
        toast.promise(
            async () => {
                await cafeteriaService.updateOrderStatus(id, newStatus);
                fetchOrders();
            },
            {
                pending: 'Updating order status...',
                success: `Order marked as ${newStatus}!`,
                error: 'Failed to update order status.'
            }
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#1a367c] tracking-tight">Inventory & Orders</h1>
                    <p className="text-sm text-[#8892b0] font-medium mt-1">Manage inventory and process incoming orders.</p>
                </div>
                {activeTab === 'inventory' && (
                    <Button onClick={handleOpenAdd} className="gap-2 shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-4 h-4" /> New Item
                    </Button>
                )}
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
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="text-gray-500 font-medium">Loading data...</div>
                    </div>
                ) : (
                    activeTab === 'inventory' ? (
                        <InventoryTable
                            items={inventory}
                            onToggleStatus={handleToggleStatus}
                            onEdit={handleOpenEdit}
                        />
                    ) : (
                        <OrdersTable orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
                    )
                )}
            </div>

            {/* Modals */}
            <AddFoodModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleModalSubmit}
                initialData={editingItem}
            />
        </div>
    );
};

export default FoodManagement;
