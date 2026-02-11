import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Megaphone, Calendar, ChevronRight, Plus, Utensils, Armchair, Clock, AlertCircle, Search } from 'lucide-react';

const Dashboard = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const [foodOrders] = useState([
        { id: '#ORD-881', employee: 'Sarah Wilson', item: 'Executive Veg Thali', qty: '01', status: 'Preparing', statusColor: 'bg-orange-50 text-orange-700' },
        { id: '#ORD-882', employee: 'Mike Ross', item: 'Chicken Burger', qty: '02', status: 'Completed', statusColor: 'bg-green-50 text-green-700' },
    ]);
    const [seatingReservations] = useState([
        { id: '#RSV-04', employee: 'Jessica Pearson', seat: 'Desk A-12', time: '1:00 PM' },
    ]);

    const [foodSearch, setFoodSearch] = useState('');
    const [seatingSearch, setSeatingSearch] = useState('');

    const filteredFoodOrders = foodOrders.filter(order =>
        order.employee.toLowerCase().includes(foodSearch.toLowerCase()) ||
        order.item.toLowerCase().includes(foodSearch.toLowerCase()) ||
        order.id.toLowerCase().includes(foodSearch.toLowerCase())
    );

    const filteredSeatingReservations = seatingReservations.filter(res =>
        res.employee.toLowerCase().includes(seatingSearch.toLowerCase()) ||
        res.seat.toLowerCase().includes(seatingSearch.toLowerCase()) ||
        res.id.toLowerCase().includes(seatingSearch.toLowerCase())
    );

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
        >
            {/* TOP GRID: OPERATIONS | ANNOUNCEMENTS | HOLIDAYS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Operations Active Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[320px] group"
                >
                    <div>
                        <div className="text-sm font-bold text-[#8892b0] tracking-widest mb-4 flex items-center gap-2 uppercase">
                            <Shield className="w-[18px] h-[18px]" />
                            OPERATIONS ACTIVE
                        </div>
                        <div className="text-[2.2rem] font-extrabold text-[#1a367c] mb-2 leading-[1.2]">
                            Service<br />Online
                        </div>
                        <div className="text-sm text-[#8892b0] leading-relaxed">
                            Manage user provisions for food and workspace allocation.
                        </div>
                    </div>
                    <div>
                        <button className="bg-[#1a367c] text-white border-0 py-3 px-6 rounded-xl text-[0.8rem] font-bold tracking-wide cursor-pointer uppercase flex items-center gap-2 hover:bg-[#152a61] transition-colors">
                            + ADD FOOD ITEM
                            <Plus className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-1 bg-[#f9b012] rounded-full mt-6 transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>

                {/* Announcements Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[320px] group"
                >
                    <div>
                        <div className="text-sm font-bold text-[#8892b0] tracking-widest mb-4 flex items-center gap-2 uppercase">
                            <Megaphone className="w-[18px] h-[18px]" />
                            ORGANIZATION ANNOUNCEMENTS
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex gap-3 pb-3 border-b border-slate-100">
                                <div className="text-[0.7rem] text-[#f9b012] font-bold min-w-[40px]">FEB 10</div>
                                <div className="text-[0.85rem] text-[#1a367c] leading-snug">
                                    <strong>Town Hall Meeting</strong><br />
                                    <span className="text-[0.75rem] text-[#8892b0]">Quadrimester updates with CEO.</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-[0.7rem] text-[#f9b012] font-bold min-w-[40px]">FEB 08</div>
                                <div className="text-[0.85rem] text-[#1a367c] leading-snug">
                                    <strong>Policy Update: Remote Work</strong><br />
                                    <span className="text-[0.75rem] text-[#8892b0]">Revised guidelines in HR Registry.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Consistent yellow line effect */}
                    <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                </motion.div>

                {/* Upcoming Holidays Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[320px] group"
                >
                    <div>
                        <div className="text-sm font-bold text-[#8892b0] tracking-widest mb-4 flex items-center gap-2 uppercase">
                            <Calendar className="w-[18px] h-[18px]" />
                            UPCOMING HOLIDAYS
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                            <div className="flex gap-3 pb-3 border-b border-slate-100">
                                <div className="text-[0.7rem] text-[#f9b012] font-bold">FEB 26</div>
                                <div className="text-[0.85rem] text-[#1a367c]">
                                    <strong>Maha Shivratri</strong><br />
                                    <span className="text-[0.75rem] text-[#8892b0]">Public Holiday</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-[0.7rem] text-[#f9b012] font-bold">MAR 14</div>
                                <div className="text-[0.85rem] text-[#1a367c]">
                                    <strong>Holi</strong><br />
                                    <span className="text-[0.75rem] text-[#8892b0]">Festival of Colors</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <button className="bg-[#1a367c] text-white border-0 py-3 px-6 rounded-xl text-[0.8rem] font-bold tracking-wide cursor-pointer uppercase flex items-center justify-center gap-2 hover:bg-[#152a61] transition-colors w-full">
                            VIEW CALENDAR
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="w-10 h-1 bg-[#f9b012] rounded-full mt-6 transition-all duration-300 group-hover:w-20"></div>
                    </div>
                </motion.div>
            </div>

            {/* ANALYTICS WIDGETS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Food Orders Widget */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-[#1a367c]"><Utensils size={18} /></div>
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Food Orders</div>
                    </div>
                    <div className="text-[1.8rem] font-extrabold text-[#1a367c]">142</div>
                </motion.div>
                {/* Seating Active Widget */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg text-green-700"><Armchair size={18} /></div>
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Seating Active</div>
                    </div>
                    <div className="text-[1.8rem] font-extrabold text-[#1a367c]">24</div>
                </motion.div>
                {/* Pending Req Widget */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock size={18} /></div>
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Pending Req</div>
                    </div>
                    <div className="text-[1.8rem] font-extrabold text-[#1a367c]">07</div>
                </motion.div>
                {/* Low Stock Widget */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600"><AlertCircle size={18} /></div>
                        <div className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Low Stock</div>
                    </div>
                    <div className="text-[1.8rem] font-extrabold text-[#e74c3c]">03</div>
                </motion.div>
            </div>

            {/* RECENT FOOD ORDERS */}
            <motion.div
                variants={itemVariants}
                className="mb-8"
            >
                <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
                        <div className="text-sm font-extrabold text-[#1a367c] tracking-widest uppercase">Recent Food Orders</div>
                        {/* Search Bar */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 shadow-sm w-full md:w-[200px]">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                className="ml-2 bg-transparent border-none outline-none text-[0.7rem] font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                                value={foodSearch}
                                onChange={(e) => setFoodSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Custom Grid Table to match SS Exact Layout */}
                    <div className="grid gap-y-4">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_2fr_2fr_1fr_1.5fr] pb-4 border-b border-slate-100 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">
                            <div>ID</div><div>EMPLOYEE</div><div>FOOD ITEM</div><div>QTY</div><div>STATUS</div>
                        </div>
                        {filteredFoodOrders.length > 0 ? (
                            filteredFoodOrders.map((order, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_2fr_2fr_1fr_1.5fr] items-center text-[0.85rem] text-[#1a367c] font-medium py-2 hover:bg-[#fafbfb] rounded-lg transition-colors px-1">
                                    <div className="text-[#8892b0] text-[0.75rem]">{order.id}</div>
                                    <div>{order.employee}</div>
                                    <div>{order.item}</div>
                                    <div>{order.qty}</div>
                                    <div><span className={`${order.statusColor} px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase`}>{order.status}</span></div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-400 text-sm font-medium italic">
                                No orders found.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* DESK RESERVATIONS AND ACTIVITY */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 pb-10">
                {/* Seating Reservations */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100"
                >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
                        <div className="text-sm font-extrabold text-[#1a367c] tracking-widest uppercase">Seating Reservations</div>
                        {/* Search Bar */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 shadow-sm w-full md:w-[200px]">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search seating..."
                                className="ml-2 bg-transparent border-none outline-none text-[0.7rem] font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                                value={seatingSearch}
                                onChange={(e) => setSeatingSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-y-4">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr] pb-4 border-b border-slate-100 text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">
                            <div>ID</div><div>EMPLOYEE</div><div>SEAT</div><div>TIME</div>
                        </div>
                        {filteredSeatingReservations.length > 0 ? (
                            filteredSeatingReservations.map((res, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr] items-center text-[0.85rem] text-[#1a367c] font-medium py-2 hover:bg-[#fafbfb] rounded-lg transition-colors px-1">
                                    <div className="text-[#8892b0] text-[0.75rem]">{res.id}</div>
                                    <div>{res.employee}</div>
                                    <div className="font-bold">{res.seat}</div>
                                    <div>{res.time}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 text-slate-400 text-sm font-medium italic">
                                No reservations found.
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100"
                >
                    <div className="text-sm font-extrabold text-[#1a367c] tracking-widest mb-5 uppercase">Recent Activity</div>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3 items-start">
                            <div className="w-1 h-10 bg-green-500 rounded-full mt-1"></div>
                            <div>
                                <p className="text-[0.8rem] font-bold text-[#1a367c]">Stock Updated</p>
                                <p className="text-[0.65rem] text-[#8892b0]">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <div className="w-1 h-10 bg-[#f9b012] rounded-full mt-1"></div>
                            <div>
                                <p className="text-[0.8rem] font-bold text-[#1a367c]">Desk B-02 Cancelled</p>
                                <p className="text-[0.65rem] text-[#8892b0]">1 hour ago</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
