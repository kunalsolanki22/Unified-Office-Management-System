import React, { useState, useEffect } from 'react';
import {
    Activity,
    Megaphone,
    Calendar as CalendarIcon,
    ArrowRight,
    Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/cafeteria-manager/DashboardCard';
import AnalyticsWidget from '../../components/cafeteria-manager/AnalyticsWidget';
import RecentOrders from '../../components/cafeteria-manager/RecentOrders';
import SeatingReservations from '../../components/cafeteria-manager/SeatingReservations';
import RecentActivity from '../../components/cafeteria-manager/RecentActivity';
import Button from '../../components/ui/Button';
import { cafeteriaService } from '../../services/cafeteriaService';

const Dashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        foodOrders: 0,
        pendingReq: 0,
        seatingActive: 24 // Mock for now
    });
    const [loading, setLoading] = useState(true);

    const [reservations, setReservations] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Food Order Stats
                const statsResponse = await cafeteriaService.getDashboardStats();
                const statsData = statsResponse.data || statsResponse;

                // Fetch Seating Stats
                const seatingResponse = await cafeteriaService.getCafeteriaStats();
                const seatingData = seatingResponse.data || seatingResponse;

                // Fetch Recent Orders
                const ordersResponse = await cafeteriaService.getOrders({ page: 1, page_size: 5 });
                const ordersList = ordersResponse.data || ordersResponse.orders || [];

                const formattedOrders = Array.isArray(ordersList) ? ordersList.map(o => ({
                    id: o.order_number || o.id,
                    emp: o.user_name || 'Unknown',
                    items: Array.isArray(o.items) ? o.items.map(i => i.item_name).join(', ') : '',
                    qty: Array.isArray(o.items) ? o.items.reduce((acc, i) => acc + i.quantity, 0).toString() : '0',
                    status: o.status,
                    created_at: o.created_at
                })) : [];

                setOrders(formattedOrders);

                // Fetch Reservations
                const bookingsResponse = await cafeteriaService.getReservations({ page: 1, page_size: 5 });
                const bookingsList = bookingsResponse.data || bookingsResponse;

                const formattedReservations = Array.isArray(bookingsList) ? bookingsList.map(b => ({
                    id: String(b.id).substring(0, 8).toUpperCase(),
                    emp: b.user_name || b.user_code,
                    seat: b.table_label || b.table_code,
                    time: new Date(`${b.booking_date}T${b.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    created_at: b.created_at,
                    type: 'booking'
                })) : [];

                setReservations(formattedReservations.slice(0, 3));

                // Derive Recent Activity
                const allActivities = [
                    ...formattedOrders.map(o => ({
                        type: 'order',
                        title: `New Order #${o.id}`,
                        time: o.created_at,
                        status: 'success'
                    })),
                    ...formattedReservations.map(b => ({
                        type: 'booking',
                        title: `Table ${b.seat} Reserved`,
                        time: b.created_at,
                        status: 'warning'
                    }))
                ];

                const sortedActivities = allActivities
                    .sort((a, b) => new Date(b.time) - new Date(a.time))
                    .slice(0, 5);

                // Map correct backend field names:
                // statsData.total_orders_today  → Food Orders today
                // statsData.orders_by_status?.pending → Pending orders
                // seatingData.booked_tables     → Seating Active
                // statsData.revenue_today       → Revenue today
                setStats({
                    foodOrders: statsData.total_orders_today ?? 0,
                    pendingReq: statsData.orders_by_status?.pending ?? 0,
                    seatingActive: seatingData.booked_tables ?? 0,
                    revenueToday: statsData.revenue_today ?? 0,
                    recentActivities: sortedActivities
                });

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Top Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Operations Active */}
                <DashboardCard title="OPERATIONS ACTIVE" icon={Activity}>
                    <div className="mb-4">
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] leading-tight mb-2">
                            Service<br />Online
                        </div>
                        <p className="text-sm text-[#8892b0] leading-relaxed">
                            Manage user provisions for food and workspace allocation.
                        </p>
                    </div>
                    <Button
                        onClick={() => navigate('/cafeteria-manager/food-management')}
                        className="w-full justify-between group bg-[#1a367c] hover:bg-[#2c4a96] border-transparent"
                    >
                        <span>+ ADD FOOD ITEM</span>
                        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    </Button>
                </DashboardCard>

                {/* Organization Announcements */}
                <DashboardCard title="ORGANIZATION ANNOUNCEMENTS" icon={Megaphone}>
                    <div className="space-y-4 mt-4">
                        <div className="flex gap-3 pb-3 border-b border-slate-100">
                            <div className="text-[0.7rem] font-bold text-[#f9b012] min-w-[45px] pt-1">FEB 10</div>
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-[#1a367c] leading-snug">Town Hall Meeting</div>
                                <div className="text-xs text-[#8892b0]">Quadrimester updates with CEO.</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-[0.7rem] font-bold text-[#f9b012] min-w-[45px] pt-1">FEB 08</div>
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-[#1a367c] leading-snug">Policy Update: Remote Work</div>
                                <div className="text-xs text-[#8892b0]">Revised guidelines in HR Registry.</div>
                            </div>
                        </div>
                    </div>
                </DashboardCard>

                {/* Upcoming Holidays */}
                <DashboardCard title="UPCOMING HOLIDAYS" icon={CalendarIcon}>
                    <div className="space-y-4 mt-4 mb-auto">
                        <div className="flex gap-3 pb-3 border-b border-slate-100">
                            <div className="text-[0.7rem] font-bold text-[#f9b012] min-w-[45px] pt-1">FEB 26</div>
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-[#1a367c] leading-snug">Maha Shivratri</div>
                                <div className="text-xs text-[#8892b0]">Public Holiday</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="text-[0.7rem] font-bold text-[#f9b012] min-w-[45px] pt-1">MAR 14</div>
                            <div className="space-y-0.5">
                                <div className="text-sm font-bold text-[#1a367c] leading-snug">Holi</div>
                                <div className="text-xs text-[#8892b0]">Festival of Colors</div>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        className="w-full justify-center gap-2 mt-6"
                        onClick={() => navigate('/cafeteria-manager/holidays')}
                    >
                        VIEW CALENDAR <ArrowRight className="w-4 h-4" />
                    </Button>
                </DashboardCard>
            </div>

            {/* Analytics Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticsWidget label="Food Orders Today" value={loading ? '—' : stats.foodOrders} />
                <AnalyticsWidget label="Seating Active" value={loading ? '—' : stats.seatingActive} />
                <AnalyticsWidget label="Pending Orders" value={loading ? '—' : stats.pendingReq} />
                <AnalyticsWidget label="Revenue Today" value={loading ? '—' : `₹${Number(stats.revenueToday ?? 0).toFixed(0)}`} valueColor="text-green-600" />
            </div>

            {/* Recent Orders */}
            <div className="grid grid-cols-1 gap-6">
                <RecentOrders orders={orders} />
            </div>

            {/* Reservations & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SeatingReservations reservations={reservations} />
                <RecentActivity activities={stats.recentActivities} />
            </div>
        </div>
    );
};

export default Dashboard;
