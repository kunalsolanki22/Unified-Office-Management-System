import React, { useState, useEffect } from 'react';
import { cafeteriaService } from '../../services/cafeteriaService';
import { ShoppingBag, ChevronLeft, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const fetchMyOrders = async () => {
        try {
            setIsLoading(true);
            const response = await cafeteriaService.getMyFoodOrders();
            setOrders(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching my orders:', err);
            setError('Failed to load order history. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        const s = status.toLowerCase();
        if (s.includes('completed') || s.includes('delivered')) {
            return {
                bg: 'bg-green-100',
                text: 'text-green-600',
                icon: <CheckCircle2 size={12} />
            };
        }
        if (s.includes('pending') || s.includes('preparing') || s.includes('confirmed')) {
            return {
                bg: 'bg-amber-100',
                text: 'text-amber-600',
                icon: <Clock size={12} />
            };
        }
        if (s.includes('cancel') || s.includes('reject')) {
            return {
                bg: 'bg-red-100',
                text: 'text-red-600',
                icon: <XCircle size={12} />
            };
        }
        return {
            bg: 'bg-slate-100',
            text: 'text-slate-600',
            icon: <AlertCircle size={12} />
        };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ChevronLeft className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#1a367c]">
                            MY FOOD <span className="text-[#f9b012]">ORDERS</span>
                        </h1>
                        <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                            Your recent order history
                        </p>
                    </div>
                </div>
                <ShoppingBag className="text-[#1a367c] opacity-20" size={40} />
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a367c]"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-[24px] text-center">
                    {error}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white p-16 rounded-[24px] shadow-sm border border-slate-100 text-center space-y-4">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                        <ShoppingBag size={32} className="text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-[#1a367c]">No Orders Yet</h3>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            You haven't placed any food orders yet. Head over to the menu to satisfy your cravings!
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/cafeteria/services')}
                        className="px-6 py-2 bg-[#1a367c] text-white rounded-xl font-bold hover:bg-[#152a5c] transition-colors"
                    >
                        Order Now
                    </button>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusStyle = getStatusStyle(order.status);
                            return (
                                <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-[#1a367c]">Order #{order.order_number || order.id.slice(0, 8)}</span>
                                            <span className="text-xs text-slate-400">• {formatDate(order.created_at)}</span>
                                        </div>
                                        <div className="text-xs text-[#8892b0]">
                                            {order.items?.map(item => `${item.quantity}x ${item.food_item_name}`).join(', ') || 'Processing items...'}
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <div className="font-bold text-[#1a367c] text-sm">₹{order.total_amount}</div>
                                        <span className={`flex items-center gap-1.5 text-[0.65rem] font-extrabold px-2.5 py-1.5 ${statusStyle.bg} ${statusStyle.text} rounded-lg uppercase tracking-wider`}>
                                            {statusStyle.icon}
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
