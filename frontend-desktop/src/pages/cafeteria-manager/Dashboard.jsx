import React, { useState, useEffect } from 'react';
import {
    Activity,
    Megaphone,
    Calendar as CalendarIcon,
    CalendarDays,
    ArrowRight,
    Plus,
    Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../../components/cafeteria-manager/DashboardCard';
import AnalyticsWidget from '../../components/cafeteria-manager/AnalyticsWidget';
import RecentOrders from '../../components/cafeteria-manager/RecentOrders';
import SeatingReservations from '../../components/cafeteria-manager/SeatingReservations';
import RecentActivity from '../../components/cafeteria-manager/RecentActivity';
import Button from '../../components/ui/Button';
import { cafeteriaService } from '../../services/cafeteriaService';
import { holidayService } from '../../services/holidayService';

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

    const [holidays, setHolidays] = useState([]);
    const [loadingHolidays, setLoadingHolidays] = useState(true);

    const formatHolidayDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    };

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
                const ordersList = ordersResponse?.data?.orders || ordersResponse?.data || (Array.isArray(ordersResponse) ? ordersResponse : []);

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
                const bookingsList = bookingsResponse?.data?.bookings || bookingsResponse?.data || (Array.isArray(bookingsResponse) ? bookingsResponse : []);

                const formattedReservations = Array.isArray(bookingsList) ? bookingsList.map(b => ({
                    id: String(b.id).substring(0, 8).toUpperCase(),
                    emp: b.user_name || b.user_code,
                    seat: b.table_label || b.table_code,
                    time: new Date(`${b.booking_date}T${b.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    created_at: b.created_at,
                    type: 'booking'
                })) : [];

                setReservations(formattedReservations.slice(0, 5));

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

        // Fetch holidays separately
        const fetchHolidays = async () => {
            try {
                setLoadingHolidays(true);
                const res = await holidayService.getHolidays({ upcoming_only: true, page_size: 3 });
                setHolidays(res?.data ?? []);
            } catch { setHolidays([]); }
            finally { setLoadingHolidays(false); }
        };
        fetchHolidays();
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
                        {loadingHolidays ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                            </div>
                        ) : holidays.length > 0 ? (
                            holidays.map((h) => (
                                <div key={h.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
                                    <div className="text-[0.7rem] font-bold text-[#f9b012] min-w-[45px] pt-1">
                                        {formatHolidayDate(h.date)}
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="text-sm font-bold text-[#1a367c] leading-snug">{h.name}</div>
                                        <div className="text-xs text-[#8892b0]">{h.holiday_type || 'Public Holiday'}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-[#8892b0]">
                                <CalendarDays className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs font-medium">No upcoming holidays</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/cafeteria-manager/holidays')}
                        className="w-full bg-[#f8f9fa] text-[#1a367c] py-3 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 hover:bg-[#1a367c] hover:text-white transition-all group/btn mt-6"
                    >
                        VIEW CALENDAR
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
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
