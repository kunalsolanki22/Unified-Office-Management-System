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

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const ordersData = await cafeteriaService.getOrders();
                // map orders to expected format if needed, assuming API returns array
                // API structure might be different, but we'll assume a list of orders
                const formattedOrders = ordersData.map(o => ({
                    id: o.id || `ORD-${Math.floor(Math.random() * 1000)}`,
                    emp: o.employee_name || 'Unknown',
                    items: o.items || 'Items',
                    qty: o.quantity || '1',
                    status: o.status || 'Pending'
                }));

                setOrders(formattedOrders.slice(0, 5)); // Take recent 5

                const pendingCount = ordersData.filter(o => o.status === 'Pending').length;

                setStats(prev => ({
                    ...prev,
                    foodOrders: ordersData.length,
                    pendingReq: pendingCount
                }));
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Mock Data for Reservations (until API is clear)
    const reservations = [
        { id: 'RSV-04', emp: 'Jessica Pearson', seat: 'Desk A-12', time: '1:00 PM' },
        { id: 'RSV-05', emp: 'Donna Paulsen', seat: 'Desk B-05', time: '2:30 PM' },
        { id: 'RSV-06', emp: 'Alex Williams', seat: 'Desk A-08', time: '4:00 PM' },
    ];

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
                <AnalyticsWidget label="Food Orders" value={stats.foodOrders} />
                <AnalyticsWidget label="Seating Active" value={stats.seatingActive} />
                <AnalyticsWidget label="Pending Req" value={stats.pendingReq} />
                {/* Low Stock removed as per previous intent/lack of data */}
            </div>

            {/* Recent Orders */}
            <div className="grid grid-cols-1 gap-6">
                <RecentOrders orders={orders} />
            </div>

            {/* Reservations & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SeatingReservations reservations={reservations} />
                <RecentActivity />
            </div>
        </div>
    );
};

export default Dashboard;
