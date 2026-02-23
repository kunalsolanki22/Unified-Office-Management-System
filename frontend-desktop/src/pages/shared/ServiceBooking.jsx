import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Plus, Minus, X, Check, CheckCircle, Car, Monitor, Users, HardDrive, Coffee, Clock, Send } from 'lucide-react';
import { cafeteriaService } from '../../services/cafeteriaService';
import { deskService } from '../../services/deskService';
import { parkingService } from '../../services/parkingService';
import { hardwareService } from '../../services/hardwareService';

const FOOD_ICONS = ['🍛', '🥗', '🥪', '🍔', '🍝', '🍲', '🥘', '🍜', '🌮', '🥙'];

const TAB_MAP = { cafeteria: 'cafeteria', desk: 'desk', parking: 'parking', conference: 'conference', hardware: 'hardware' };

const ServiceBooking = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') || 'cafeteria';
    const initialTab = TAB_MAP[tabParam] || 'cafeteria';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [cafeSubTab, setCafeSubTab] = useState('menu'); // 'menu' | 'tables'

    // Cafeteria state
    const [foodItems, setFoodItems] = useState([]);
    const [loadingFood, setLoadingFood] = useState(true);
    const [cart, setCart] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(null);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [myOrders, setMyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Table state
    const [cafeTables, setCafeTables] = useState([]);
    const [cafeBookings, setCafeBookings] = useState([]);
    const [loadingTables, setLoadingTables] = useState(true);
    const [selectedTable, setSelectedTable] = useState(null);
    const [bookingTable, setBookingTable] = useState(false);
    const [tableBooked, setTableBooked] = useState(null);
    const [myTableReservations, setMyTableReservations] = useState([]);
    // Helper for dynamic slots
    const getNextSlot = (offsetMinutes = 0) => {
        const now = new Date();
        now.setMinutes(Math.ceil((now.getMinutes() + offsetMinutes) / 10) * 10, 0, 0);
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const [showTableModal, setShowTableModal] = useState(false);
    const [tableForm, setTableForm] = useState({
        start_time: getNextSlot(10),
        duration: 30,
        guest_count: 1,
    });

    // Desk state
    const [desks, setDesks] = useState([]);
    const [deskBookings, setDeskBookings] = useState([]);
    const [loadingDesks, setLoadingDesks] = useState(true);
    const [selectedDesk, setSelectedDesk] = useState(null);
    const [bookingDesk, setBookingDesk] = useState(false);
    const [deskBooked, setDeskBooked] = useState(null);

    // Parking state
    const [mySlot, setMySlot] = useState(null);
    const [loadingParking, setLoadingParking] = useState(true);
    const [allocatingParking, setAllocatingParking] = useState(false);
    const [releasingParking, setReleasingParking] = useState(false);

    // Conference state
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [roomBookingForm, setRoomBookingForm] = useState({
        booking_date: new Date().toISOString().split('T')[0],
        start_time: getNextSlot(10),
        end_time: getNextSlot(70),
        title: '',
        attendees_count: 1,
    });
    const [bookingRoom, setBookingRoom] = useState(false);
    const [roomBooked, setRoomBooked] = useState(null);

    // Hardware state
    const [hwForm, setHwForm] = useState({
        request_type: 'new_asset',
        title: '',
        description: '',
        priority: 'medium',
    });
    const [submittingHw, setSubmittingHw] = useState(false);
    const [hwSubmitted, setHwSubmitted] = useState(null);

    // Fetch food items
    useEffect(() => {
        const fetchFoodData = async () => {
            setLoadingFood(true);
            try {
                const res = await cafeteriaService.getFoodItems({ is_available: true, page_size: 50 });
                // Robust data mapping: handle both { data: [...] } and directly [...]
                const items = res?.data || (Array.isArray(res) ? res : []);
                setFoodItems(items);
            } catch (err) {
                console.error('Error loading food items:', err);
                setFoodItems([]);
            } finally {
                setLoadingFood(false);
            }
        };
        fetchFoodData();
    }, []);

    const fetchOrdersData = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingOrders(true);
            const res = await cafeteriaService.getMyOrders({ page_size: 10 });
            const orders = res?.data || (Array.isArray(res) ? res : []);
            setMyOrders(orders);
        } catch (err) {
            console.error('Error loading my orders:', err);
            setMyOrders([]);
        } finally {
            if (showLoading) setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchOrdersData();
        const interval = setInterval(() => fetchOrdersData(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch cafeteria tables
    const fetchTableData = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingTables(true);
            const [tablesResult, bookingsResult, myBookingsResult] = await Promise.allSettled([
                cafeteriaService.getTables({ is_active: true }),
                cafeteriaService.getReservations({ booking_date: new Date().toISOString().split('T')[0] }),
                cafeteriaService.getMyTableBookings()
            ]);
            if (tablesResult.status === 'fulfilled') {
                const tablesRes = tablesResult.value;
                setCafeTables(tablesRes?.data || (Array.isArray(tablesRes) ? tablesRes : []));
            }
            if (bookingsResult.status === 'fulfilled') {
                const bookingsRes = bookingsResult.value;
                setCafeBookings(bookingsRes?.data || (Array.isArray(bookingsRes) ? bookingsRes : []));
            }
            if (myBookingsResult.status === 'fulfilled') {
                const myBookingsRes = myBookingsResult.value;
                setMyTableReservations(myBookingsRes?.data || (Array.isArray(myBookingsRes) ? myBookingsRes : []));
            }
        } catch (err) {
            console.error('Error fetching tables:', err);
        } finally {
            if (showLoading) setLoadingTables(false);
        }
    };

    useEffect(() => {
        fetchTableData();
        const interval = setInterval(() => fetchTableData(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch desks + bookings
    const fetchDesks = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingDesks(true);
            const [desksRes, bookingsRes] = await Promise.all([
                deskService.getDesks({ page_size: 100 }),
                deskService.getDeskBookings({ page_size: 100 })
            ]);
            setDesks(desksRes?.data || []);

            const today = new Date().toISOString().split('T')[0];
            const activeBookings = (bookingsRes?.data || []).filter(b => {
                const status = (b.status || '').toLowerCase();
                return (status === 'confirmed' || status === 'checked_in') &&
                    b.start_date <= today && b.end_date >= today;
            });
            setDeskBookings(activeBookings);
        } catch (err) {
            console.error('Error loading desks:', err);
        } finally {
            if (showLoading) setLoadingDesks(false);
        }
    };

    useEffect(() => {
        fetchDesks();
        const interval = setInterval(() => fetchDesks(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch parking
    const fetchParking = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingParking(true);
            const res = await parkingService.mySlot();
            const slotData = res?.data || res;
            if (slotData?.has_active_parking && slotData?.slot) {
                setMySlot(slotData.slot);
            } else {
                setMySlot(null);
            }
        } catch (err) {
            console.error('Error loading parking:', err);
            setMySlot(null);
        } finally {
            if (showLoading) setLoadingParking(false);
        }
    };

    useEffect(() => {
        fetchParking();
        const interval = setInterval(() => fetchParking(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch conference rooms
    const fetchRooms = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingRooms(true);
            const res = await deskService.getRooms({ page_size: 50 });
            setRooms(res?.data || (Array.isArray(res) ? res : []));
        } catch (err) {
            console.error('Error loading rooms:', err);
            setRooms([]);
        } finally {
            if (showLoading) setLoadingRooms(false);
        }
    };

    useEffect(() => {
        fetchRooms();
        const interval = setInterval(() => fetchRooms(false), 30000);
        return () => clearInterval(interval);
    }, []);

    // Cart helpers
    const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const addToCart = (itemId) => setCart(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
    const removeFromCart = (itemId) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[itemId] > 1) newCart[itemId]--;
            else delete newCart[itemId];
            return newCart;
        });
    };
    const getCartItems = () => Object.entries(cart).map(([itemId, qty]) => {
        const item = foodItems.find(f => f.id === itemId);
        return { ...item, quantity: qty };
    }).filter(Boolean);
    const getGrandTotal = () => getCartItems().reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    // Place food order
    const handlePlaceOrder = async () => {
        try {
            setPlacingOrder(true);
            const items = Object.entries(cart).map(([food_item_id, quantity]) => ({ food_item_id, quantity }));
            const res = await cafeteriaService.createFoodOrder({ items });

            // If we're here, order was created successfully
            setOrderPlaced(res?.data || res);
            setTableBooked(null); // Clear any table booking screen
            setCart({});
            setShowSummary(false);

            // Refresh orders in background
            try {
                const ordersRes = await cafeteriaService.getOrders({ page_size: 10, status: 'pending,preparing,ready' });
                setMyOrders(ordersRes?.data || (Array.isArray(ordersRes) ? ordersRes : []));
            } catch (refreshErr) {
                console.warn('Background refresh for orders failed:', refreshErr);
            }
        } catch (err) {
            console.error('Error placing order:', err);
            alert(err?.response?.data?.detail || 'Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    // Table helpers
    const bookedTableIds = new Set(cafeBookings.map(b => b.table_id));
    const isTableBooked = (tableId) => bookedTableIds.has(tableId);

    const calculateEndTime = (startTime, duration) => {
        if (!startTime) return '';
        const [h, m] = startTime.split(':').map(Number);
        const totalMin = h * 60 + m + duration;
        const endH = Math.floor(totalMin / 60) % 24;
        const endM = totalMin % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    };

    const handleBookTable = async () => {
        if (!selectedTable) return;
        const today = new Date().toISOString().split('T')[0];
        const endTime = calculateEndTime(tableForm.start_time, tableForm.duration);
        try {
            setBookingTable(true);
            await cafeteriaService.createBooking({
                table_id: selectedTable.id,
                booking_date: today,
                start_time: tableForm.start_time,
                end_time: endTime,
                guest_count: tableForm.guest_count,
            });

            // success
            setTableBooked(selectedTable);
            setOrderPlaced(null);
            setShowTableModal(false);
            setSelectedTable(null);

            // Refresh tables and bookings in background
            try {
                const [tablesRes, bookingsRes, myBookingsRes] = await Promise.all([
                    cafeteriaService.getTables({ is_active: true }),
                    cafeteriaService.getReservations({ booking_date: today }),
                    cafeteriaService.getMyTableBookings()
                ]);
                setCafeTables(tablesRes?.data || (Array.isArray(tablesRes) ? tablesRes : []));
                setCafeBookings(bookingsRes?.data || (Array.isArray(bookingsRes) ? bookingsRes : []));
                setMyTableReservations(myBookingsRes?.data || (Array.isArray(myBookingsRes) ? myBookingsRes : []));
            } catch (refreshErr) {
                console.warn('Background refresh for tables failed:', refreshErr);
            }
        } catch (err) {
            console.error('Error booking table:', err);
            alert(err?.response?.data?.detail || 'Failed to book table. Please try again.');
        } finally {
            setBookingTable(false);
        }
    };

    // Desk helpers
    const bookedDeskIds = new Set(deskBookings.map(b => b.desk_id));
    const isDeskBooked = (deskId) => bookedDeskIds.has(deskId);

    const handleBookDesk = async () => {
        if (!selectedDesk) return;
        try {
            setBookingDesk(true);
            const today = new Date().toISOString().split('T')[0];
            await deskService.createDeskBooking({ desk_id: selectedDesk.id, start_date: today, end_date: today, notes: 'Booked via Service Hub' });
            setDeskBooked(selectedDesk);
            setSelectedDesk(null);
            const bookingsRes = await deskService.getDeskBookings({ page_size: 100 });
            const todayStr = new Date().toISOString().split('T')[0];
            const activeBookings = (bookingsRes?.data || []).filter(b => {
                const status = (b.status || '').toLowerCase();
                return (status === 'confirmed' || status === 'checked_in') && b.start_date <= todayStr && b.end_date >= todayStr;
            });
            setDeskBookings(activeBookings);
        } catch (err) {
            console.error('Error booking desk:', err);
            alert(err?.response?.data?.detail || 'Failed to book desk. Please try again.');
        } finally {
            setBookingDesk(false);
        }
    };

    // Parking handlers
    const handleAllocateParking = async () => {
        try {
            setAllocatingParking(true);
            const res = await parkingService.allocate();
            const slotData = res?.data || res;
            // allocate returns { slot_code, vehicle_number, ... } at top level
            setMySlot({ slot_code: slotData.slot_code, ...slotData });
        } catch (err) {
            console.error('Error allocating parking:', err);
            alert(err?.response?.data?.detail || 'No parking slots available right now.');
        } finally {
            setAllocatingParking(false);
        }
    };

    const handleReleaseParking = async () => {
        try {
            setReleasingParking(true);
            await parkingService.release();
            setMySlot(null);
        } catch (err) {
            console.error('Error releasing parking:', err);
            alert(err?.response?.data?.detail || 'Failed to release parking.');
        } finally {
            setReleasingParking(false);
        }
    };

    // Conference room booking
    const handleBookRoom = async () => {
        if (!selectedRoom || !roomBookingForm.title) return;
        try {
            setBookingRoom(true);
            const res = await deskService.createRoomBooking({
                room_id: selectedRoom.id,
                booking_date: roomBookingForm.booking_date,
                start_time: roomBookingForm.start_time,
                end_time: roomBookingForm.end_time,
                title: roomBookingForm.title,
                attendees_count: roomBookingForm.attendees_count,
            });
            setRoomBooked(res?.data || res);
            setShowRoomModal(false);
            setSelectedRoom(null);
            setRoomBookingForm({ booking_date: new Date().toISOString().split('T')[0], start_time: '09:00', end_time: '10:00', title: '', attendees_count: 1 });
        } catch (err) {
            console.error('Error booking room:', err);
            alert(err?.response?.data?.detail || 'Failed to book conference room.');
        } finally {
            setBookingRoom(false);
        }
    };

    // Hardware request
    const handleSubmitHwRequest = async () => {
        if (!hwForm.title || !hwForm.description) return;
        try {
            setSubmittingHw(true);
            const res = await hardwareService.createRequest(hwForm);
            setHwSubmitted(res?.data || res);
            setHwForm({ request_type: 'new_asset', title: '', description: '', priority: 'medium' });
        } catch (err) {
            console.error('Error submitting request:', err);
            alert(err?.response?.data?.detail || 'Failed to submit request.');
        } finally {
            setSubmittingHw(false);
        }
    };

    const handleBack = () => navigate(-1);

    return (
        <div className="min-h-[80vh] flex items-start justify-center py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[750px] bg-white rounded-[28px] shadow-lg border border-slate-100 p-8 relative"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={handleBack} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-[#1a367c]" />
                    </button>
                    <div className="text-center">
                        <p className="text-xs font-bold tracking-[0.2em] text-[#8892b0] mb-1">SERVICE HUB</p>
                        <h1 className="text-xl font-extrabold text-[#1a367c]">Service Booking</h1>
                    </div>
                    <div className="w-10 h-10" />
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-slate-50 rounded-xl p-1 mb-8 gap-1">
                    {Object.values(TAB_MAP).map(tabKey => (
                        <button
                            key={tabKey}
                            onClick={() => setActiveTab(tabKey)}
                            className={`flex-1 py-3 rounded-lg text-[0.6rem] font-bold tracking-wider transition-all flex flex-col items-center gap-1 ${activeTab === tabKey
                                ? 'bg-white text-[#1a367c] shadow-sm border border-slate-200'
                                : 'text-[#8892b0] hover:text-[#1a367c]'
                                }`}
                        >
                            {tabKey === 'cafeteria' && <Coffee className="w-4 h-4" />}
                            {tabKey === 'desk' && <Monitor className="w-4 h-4" />}
                            {tabKey === 'parking' && <Car className="w-4 h-4" />}
                            {tabKey === 'conference' && <Users className="w-4 h-4" />}
                            {tabKey === 'hardware' && <HardDrive className="w-4 h-4" />}
                            {tabKey.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Cafeteria Sub-tabs */}
                {activeTab === 'cafeteria' && (
                    <div className="flex gap-4 mb-6">
                        {['menu', 'tables'].map(sub => (
                            <button
                                key={sub}
                                onClick={() => setCafeSubTab(sub)}
                                className={`px-4 py-2 rounded-full text-[0.65rem] font-bold tracking-widest transition-all ${cafeSubTab === sub
                                    ? 'bg-[#f9b012] text-white shadow-md'
                                    : 'bg-slate-50 text-[#8892b0] hover:bg-slate-100'
                                    }`}
                            >
                                {sub.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}

                {/* ===== CAFETERIA TAB ===== */}
                {activeTab === 'cafeteria' && !orderPlaced && !tableBooked && (
                    <div className="space-y-8">
                        {cafeSubTab === 'menu' ? (
                            <div className="space-y-8">
                                {/* Menu Items */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold tracking-widest text-[#8892b0] mb-4">AVAILABLE MENU</h3>
                                    {loadingFood ? (
                                        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
                                    ) : foodItems.length === 0 ? (
                                        <div className="text-center py-12 text-[#8892b0] bg-slate-50 rounded-2xl"><p className="text-sm font-medium">No food items available</p></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {foodItems.map((item, idx) => (
                                                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                    className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 hover:shadow-md transition-all">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                                                        {FOOD_ICONS[idx % FOOD_ICONS.length]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-[#1a367c] text-sm">{item.name}</h3>
                                                        <p className="font-extrabold text-[#1a367c] text-sm mt-0.5">₹{parseFloat(item.price).toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {cart[item.id] ? (
                                                            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-100">
                                                                <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded-md transition-colors text-red-500">
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <span className="text-sm font-bold text-[#1a367c] w-4 text-center">{cart[item.id]}</span>
                                                                <button onClick={() => addToCart(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-green-50 rounded-md transition-colors text-green-500">
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => addToCart(item.id)} className="bg-[#1a367c] text-white px-4 py-2 rounded-lg text-[0.6rem] font-bold tracking-wider hover:bg-[#2c4a96] transition-colors">ADD</button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* My Recent Orders */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold tracking-widest text-[#8892b0] mb-4">MY RECENT ORDERS</h3>
                                    {loadingOrders ? (
                                        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-200" /></div>
                                    ) : myOrders.length === 0 ? (
                                        <div className="text-center py-8 text-[#8892b0] border border-dashed border-slate-200 rounded-2xl"><p className="text-[0.65rem] font-medium italic">No recent orders found</p></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {myOrders.slice(0, 3).map((order) => (
                                                <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#1a367c] flex-shrink-0">
                                                            <Clock className="w-5 h-5" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[0.7rem] font-bold text-[#1a367c]">Order #{order.order_number}</p>
                                                            <p className="text-[0.6rem] text-[#8892b0] truncate" title={order.items?.map(i => i.item_name).join(', ')}>
                                                                {order.items?.map(i => i.item_name).join(', ') || 'No items'}
                                                            </p>
                                                            <p className="text-[0.55rem] text-slate-400 mt-0.5">{new Date(order.created_at).toLocaleDateString()} • ₹{parseFloat(order.total_amount).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-[0.55rem] font-bold tracking-widest whitespace-nowrap flex-shrink-0 ${order.status === 'completed' ? 'bg-green-50 text-green-600' : order.status === 'confirmed' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {order.status.toUpperCase()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => cartCount > 0 && setShowSummary(true)} disabled={cartCount === 0}
                                    className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest transition-all ${cartCount > 0 ? 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                    CONFIRM ORDER ({cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'})
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Table Grid — Zone Grouped */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold tracking-widest text-[#8892b0] mb-4">SELECT A TABLE</h3>
                                    {loadingTables ? (
                                        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
                                    ) : cafeTables.length === 0 ? (
                                        <div className="text-center py-12 text-[#8892b0] bg-slate-50 rounded-2xl"><p className="text-sm font-medium">No tables available</p></div>
                                    ) : (() => {
                                        const detectZone = (t) => {
                                            const label = (t.table_label || '').toLowerCase();
                                            if (label.includes('window')) return 'WINDOW';
                                            if (label.includes('corner')) return 'CORNER';
                                            if (label.includes('open area') || label.includes('open')) return 'OPEN';
                                            if (label.includes('quiet')) return 'QUIET';
                                            const type = (t.table_type || 'regular').toLowerCase();
                                            if (type.includes('center') || type.includes('large')) return 'CENTER';
                                            if (type.includes('round')) return 'ROUND';
                                            if (type.includes('high')) return 'HIGH';
                                            return 'OTHER';
                                        };
                                        const zoneNames = { WINDOW: 'Window Desks', CORNER: 'Corner Desks', OPEN: 'Open Area', QUIET: 'Quiet Zone', CENTER: 'Center Tables (Large)', ROUND: 'Round Tables', HIGH: 'High Top Tables', OTHER: 'Other Tables' };
                                        const zoneOrder = ['WINDOW', 'CORNER', 'OPEN', 'QUIET', 'CENTER', 'ROUND', 'HIGH', 'OTHER'];
                                        const zonePrefix = { WINDOW: 'A', CORNER: 'B', OPEN: 'C', QUIET: 'D', CENTER: 'E', ROUND: 'F', HIGH: 'G', OTHER: 'H' };
                                        const zones = {};
                                        cafeTables.forEach(t => { const z = detectZone(t); if (!zones[z]) zones[z] = []; zones[z].push(t); });
                                        Object.keys(zones).forEach(z => zones[z].sort((a, b) => (a.table_label || '').localeCompare(b.table_label || '')));
                                        return (
                                            <div className="space-y-8 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
                                                {zoneOrder.filter(z => zones[z]).map(z => {
                                                    const zoneTables = zones[z];
                                                    const prefix = zonePrefix[z] || 'Z';
                                                    const freeCount = zoneTables.filter(t => !isTableBooked(t.id)).length;
                                                    return (
                                                        <div key={z}>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-[0.7rem] font-bold text-[#8892b0]">{zoneNames[z]}</span>
                                                                <span className="text-[0.65rem] font-extrabold text-green-600 tracking-wide">{freeCount} FREE</span>
                                                            </div>
                                                            <div className="flex justify-center">
                                                                <div className="bg-[#fafbfb] rounded-[20px] border-2 border-slate-100 border-dashed px-6 py-5 inline-flex flex-wrap gap-3 justify-center">
                                                                    {zoneTables.map((table, idx) => {
                                                                        const booked = isTableBooked(table.id);
                                                                        const isSelected = selectedTable?.id === table.id;
                                                                        const shortLabel = `${prefix}${idx + 1}`;
                                                                        return (
                                                                            <button key={table.id} disabled={booked}
                                                                                onClick={() => setSelectedTable(isSelected ? null : table)}
                                                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-bold transition-all duration-200 border ${booked
                                                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed border-slate-100'
                                                                                    : isSelected
                                                                                        ? 'bg-[#1a367c] text-white shadow-lg scale-110 ring-2 ring-offset-2 ring-[#1a367c] border-transparent'
                                                                                        : 'bg-white text-[#1a367c] border-slate-200 hover:border-[#1a367c] hover:shadow-md cursor-pointer'
                                                                                    }`}>
                                                                                {shortLabel}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Legend */}
                                <div className="flex justify-center gap-8 py-3 border-t border-slate-50">
                                    {[
                                        { color: 'bg-white border border-slate-200', label: 'Available' },
                                        { color: 'bg-[#1a367c]', label: 'Selected' },
                                        { color: 'bg-slate-100', label: 'Booked' },
                                    ].map(({ color, label }) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <div className={`w-3.5 h-3.5 rounded-md ${color}`} />
                                            <span className="text-[0.55rem] font-bold text-[#8892b0] uppercase tracking-wider">{label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* My Table Bookings */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold tracking-widest text-[#8892b0] mb-4">MY TABLE RESERVATIONS</h3>
                                    {loadingTables ? (
                                        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-200" /></div>
                                    ) : myTableReservations.length === 0 ? (
                                        <div className="text-center py-8 text-[#8892b0] border border-dashed border-slate-200 rounded-2xl"><p className="text-[0.65rem] font-medium italic">No table reservations found</p></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {myTableReservations.slice(0, 2).map((booking) => (
                                                <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[#1a367c]">
                                                            <Monitor className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[0.7rem] font-bold text-[#1a367c]">{booking.table_label || booking.table_code}</p>
                                                            <p className="text-[0.6rem] text-[#8892b0]">{booking.booking_date} • {booking.start_time} - {booking.end_time}</p>
                                                        </div>
                                                    </div>
                                                    <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[0.55rem] font-bold tracking-widest">
                                                        {booking.status.toUpperCase()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => selectedTable && setShowTableModal(true)} disabled={!selectedTable || bookingTable}
                                    className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 ${selectedTable ? 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                    {bookingTable && <Loader2 className="w-4 h-4 animate-spin" />}BOOK TABLE
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== ORDER PLACED SCREEN ===== */}
                {activeTab === 'cafeteria' && orderPlaced && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-[#22c55e]" /></div>
                        <h2 className="text-xl font-extrabold text-[#1a367c] mb-2">Order Placed!</h2>
                        <p className="text-sm text-[#8892b0] mb-8">Your food is being prepared. Order <span className="text-[#22c55e] font-semibold">#{orderPlaced.order_number || 'ORD-' + Math.floor(Math.random() * 9999)}</span></p>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold text-[#22c55e]">Order Number</span><span className="text-sm font-bold text-[#1a367c]">#{orderPlaced.order_number || 'PENDING'}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm font-semibold text-[#22c55e]">Status</span><span className="text-sm font-bold text-[#1a367c]">PREPARING</span></div>
                        </div>
                        <button onClick={() => { setOrderPlaced(null); setCart({}); }} className="bg-[#1a367c] text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">DONE</button>
                    </motion.div>
                )}

                {/* ===== TABLE BOOKED SCREEN ===== */}
                {activeTab === 'cafeteria' && tableBooked && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-[#22c55e]" /></div>
                        <h2 className="text-xl font-extrabold text-[#1a367c] mb-2">Table Reserved!</h2>
                        <p className="text-sm text-[#8892b0] mb-8">Table <span className="text-[#22c55e] font-semibold">{tableBooked.table_label || tableBooked.table_code}</span> has been reserved for today.</p>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-[#8892b0]">Date</span><span className="text-sm font-bold text-[#1a367c]">Today</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-[#8892b0]">Time</span><span className="text-sm font-bold text-[#1a367c]">{tableForm.start_time} — {calculateEndTime(tableForm.start_time, tableForm.duration)}</span></div>
                        </div>
                        <button onClick={() => setTableBooked(null)} className="bg-[#1a367c] text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">VIEW ALL TABLES</button>
                    </motion.div>
                )}

                {/* ===== BOOK DESK TAB ===== */}
                {activeTab === 'desk' && !deskBooked && (
                    <div>
                        {loadingDesks ? (
                            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                        ) : desks.length === 0 ? (
                            <div className="text-center py-16 text-[#8892b0]"><p className="text-sm font-medium">No desks available</p></div>
                        ) : (
                            <div className="mb-8">
                                {/* Desk Grid to match DeskBooking.jsx */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-2 custom-scrollbar content-start">
                                    {desks
                                        .filter(d => d.is_active && d.status?.toUpperCase() !== 'MAINTENANCE')
                                        .sort((a, b) => (a.desk_label || '').localeCompare(b.desk_label || '', undefined, { numeric: true }))
                                        .map(desk => {
                                            const booked = isDeskBooked(desk.id);
                                            const isSelected = selectedDesk?.id === desk.id;
                                            return (
                                                <button
                                                    key={desk.id}
                                                    disabled={booked}
                                                    onClick={() => setSelectedDesk(isSelected ? null : desk)}
                                                    className={`rounded-2xl p-4 text-center cursor-pointer border transition-all flex flex-col items-center justify-center gap-2 min-h-[110px] ${booked
                                                        ? 'bg-[#1a367c] border-[#1a367c] text-white shadow-lg shadow-[#1a367c]/20 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-[#1a367c] text-white shadow-lg scale-105 ring-2 ring-offset-2 ring-[#1a367c] border-transparent'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#f9b012] hover:text-[#f9b012] hover:shadow-md'
                                                        }`}
                                                >
                                                    <Monitor className={`w-5 h-5 ${booked ? 'text-[#f9b012]' : isSelected ? 'text-white' : 'text-slate-400'}`} />
                                                    <span className={`text-[0.7rem] font-bold font-mono ${booked || isSelected ? 'text-white' : 'text-[#1a367c]'}`}>{desk.desk_code}</span>
                                                    <span className={`text-[0.6rem] font-medium leading-tight ${booked || isSelected ? 'opacity-80' : 'opacity-70'}`}>{desk.desk_label}</span>
                                                    {desk.has_monitor && !booked && <span className="text-[0.5rem] opacity-60">🖥 Monitor</span>}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                        {desks.length > 0 && (
                            <div className="flex justify-center gap-6 mb-8 mt-2">
                                {[
                                    { color: 'bg-white border border-slate-200', label: 'Available' },
                                    { color: 'bg-[#1a367c]', label: 'Selected' },
                                    { color: 'bg-[#1a367c] border-[#1a367c] opacity-90', label: 'Booked' },
                                ].map(({ color, label }) => (
                                    <div key={label} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-sm ${color}`} />
                                        <span className="text-[0.6rem] font-bold text-[#8892b0] uppercase tracking-wider">{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={handleBookDesk} disabled={!selectedDesk || bookingDesk}
                            className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 ${selectedDesk ? 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                            {bookingDesk && <Loader2 className="w-4 h-4 animate-spin" />}CONFIRM DESK BOOKING
                        </button>
                    </div>
                )}

                {/* ===== DESK BOOKED SCREEN ===== */}
                {activeTab === 'desk' && deskBooked && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-[#22c55e]" /></div>
                        <h2 className="text-xl font-extrabold text-[#1a367c] mb-2">Desk Booked!</h2>
                        <p className="text-sm text-[#8892b0] mb-8">Desk <span className="text-[#22c55e] font-semibold">{deskBooked.desk_label || deskBooked.desk_code}</span> has been reserved for today.</p>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm font-semibold text-[#22c55e]">Desk</span><span className="text-sm font-bold text-[#1a367c]">{deskBooked.desk_label || deskBooked.desk_code}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm font-semibold text-[#22c55e]">Date</span><span className="text-sm font-bold text-[#1a367c]">{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span></div>
                        </div>
                        <button onClick={() => setDeskBooked(null)} className="bg-[#1a367c] text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">BOOK ANOTHER DESK</button>
                    </motion.div>
                )}

                {/* ===== SMART PARKING TAB ===== */}
                {activeTab === 'parking' && (
                    <div>
                        {loadingParking ? (
                            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                        ) : mySlot ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                                <div className="bg-slate-50 rounded-[28px] p-10 mb-8">
                                    <div className="w-20 h-20 bg-[#1a367c] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Car className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-extrabold text-[#1a367c] mb-2">{mySlot.slot_label || mySlot.slot_code || '---'}</h3>
                                    <p className="text-xs font-bold tracking-widest text-[#22c55e] uppercase">PARKING ASSIGNED</p>
                                </div>
                                <button onClick={handleReleaseParking} disabled={releasingParking}
                                    className="bg-red-500 text-white px-10 py-4 rounded-2xl text-xs font-bold tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-2 mx-auto">
                                    {releasingParking && <Loader2 className="w-4 h-4 animate-spin" />}RELEASE SLOT
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                                <div className="bg-slate-50 rounded-[28px] p-10 mb-8">
                                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Car className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-300 mb-2">---</h3>
                                    <p className="text-xs font-bold tracking-widest text-[#8892b0] uppercase">NO PARKING ASSIGNED</p>
                                </div>
                                <button onClick={handleAllocateParking} disabled={allocatingParking}
                                    className="bg-[#1a367c] text-white px-10 py-4 rounded-2xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all flex items-center justify-center gap-2 mx-auto shadow-lg">
                                    {allocatingParking && <Loader2 className="w-4 h-4 animate-spin" />}TAP TO PARK
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* ===== CONFERENCE ROOM TAB ===== */}
                {activeTab === 'conference' && !roomBooked && (
                    <div>
                        {loadingRooms ? (
                            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                        ) : rooms.length === 0 ? (
                            <div className="text-center py-16 text-[#8892b0]"><p className="text-sm font-medium">No conference rooms available</p></div>
                        ) : (
                            <div className="space-y-4 mb-8">
                                <p className="text-xs font-bold tracking-widest text-[#8892b0] mb-4">AVAILABLE ROOMS</p>
                                {rooms.map((room, idx) => (
                                    <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                        onClick={() => { setSelectedRoom(room); setShowRoomModal(true); }}
                                        className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group">
                                        <div className="w-14 h-14 bg-[#1a367c] rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:bg-[#f9b012] transition-colors">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#1a367c] text-sm">{room.room_label || room.room_code}</h3>
                                            <p className="text-[0.65rem] text-[#8892b0] font-medium">
                                                Capacity: {room.capacity || 'N/A'} • {room.floor ? `Floor ${room.floor}` : 'Main Building'}
                                            </p>
                                        </div>
                                        <div className="text-[0.65rem] font-bold text-[#22c55e] tracking-wider uppercase flex-shrink-0">
                                            {room.status === 'available' ? 'AVAILABLE' : room.status?.toUpperCase() || 'ACTIVE'}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ===== CONFERENCE BOOKED SCREEN ===== */}
                {activeTab === 'conference' && roomBooked && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-[#22c55e]" /></div>
                        <h2 className="text-xl font-extrabold text-[#1a367c] mb-2">Room Booked!</h2>
                        <p className="text-sm text-[#8892b0] mb-8">Your conference room has been reserved.</p>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-[#8892b0]">Room</span><span className="text-sm font-bold text-[#f9b012]">{roomBooked.room_label || roomBooked.room_code || 'Conference Room'}</span></div>
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-[#8892b0]">Date</span><span className="text-sm font-bold text-[#1a367c]">{roomBooked.booking_date}</span></div>
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-[#8892b0]">Time</span><span className="text-sm font-bold text-[#1a367c]">{roomBooked.start_time} – {roomBooked.end_time}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-[#8892b0]">Status</span><span className="text-sm font-bold text-[#22c55e]">{(roomBooked.status || 'pending').toUpperCase()}</span></div>
                        </div>
                        <button onClick={() => setRoomBooked(null)} className="bg-[#1a367c] text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">BOOK ANOTHER ROOM</button>
                    </motion.div>
                )}

                {/* ===== HARDWARE REQUEST TAB ===== */}
                {activeTab === 'hardware' && !hwSubmitted && (
                    <div className="space-y-6">
                        <p className="text-xs font-bold tracking-widest text-[#8892b0] mb-2">NEW IT REQUEST</p>

                        {/* Request Type */}
                        <div>
                            <label className="text-xs font-bold text-[#1a367c] tracking-wider block mb-2">REQUEST TYPE</label>
                            <select value={hwForm.request_type} onChange={e => setHwForm(p => ({ ...p, request_type: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium focus:outline-none focus:border-[#1a367c] transition-colors">
                                <option value="new_asset">New Asset</option>
                                <option value="new">New Request</option>
                                <option value="repair">Repair</option>
                                <option value="replacement">Replacement</option>
                                <option value="software_install">Software Install</option>
                                <option value="access_request">Access Request</option>
                                <option value="network_issue">Network Issue</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-[#1a367c] tracking-wider block mb-2">TITLE</label>
                            <input type="text" value={hwForm.title} onChange={e => setHwForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief summary of your request"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1a367c] transition-colors" />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-[#1a367c] tracking-wider block mb-2">DESCRIPTION</label>
                            <textarea value={hwForm.description} onChange={e => setHwForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide details about your request (min 10 characters)" rows={4}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1a367c] transition-colors resize-none" />
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="text-xs font-bold text-[#1a367c] tracking-wider block mb-2">PRIORITY</label>
                            <div className="flex gap-2">
                                {['low', 'medium', 'high', 'critical'].map(p => (
                                    <button key={p} onClick={() => setHwForm(prev => ({ ...prev, priority: p }))}
                                        className={`flex-1 py-3 rounded-xl text-[0.65rem] font-bold tracking-wider transition-all ${hwForm.priority === p
                                            ? p === 'critical' ? 'bg-red-500 text-white' : p === 'high' ? 'bg-orange-500 text-white' : p === 'medium' ? 'bg-[#f9b012] text-white' : 'bg-[#22c55e] text-white'
                                            : 'bg-slate-50 border border-slate-200 text-[#8892b0] hover:border-[#1a367c]'}`}>
                                        {p.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button onClick={handleSubmitHwRequest} disabled={submittingHw || !hwForm.title || hwForm.description.length < 10}
                            className={`w-full py-4 rounded-2xl text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 ${hwForm.title && hwForm.description.length >= 10 ? 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                            {submittingHw && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Send className="w-4 h-4" />
                            SUBMIT REQUEST
                        </button>
                    </div>
                )}

                {/* ===== HARDWARE SUBMITTED SCREEN ===== */}
                {activeTab === 'hardware' && hwSubmitted && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                        <div className="w-16 h-16 bg-[#dcfce7] rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-8 h-8 text-[#22c55e]" /></div>
                        <h2 className="text-xl font-extrabold text-[#1a367c] mb-2">Request Submitted!</h2>
                        <p className="text-sm text-[#8892b0] mb-8">Your IT request has been submitted for review. Request <span className="text-[#f9b012] font-semibold">#{hwSubmitted.request_number || 'REQ-' + Math.floor(Math.random() * 9999)}</span></p>
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-[#8892b0]">Type</span><span className="text-sm font-bold text-[#1a367c]">{(hwSubmitted.request_type || '').replace(/_/g, ' ').toUpperCase()}</span></div>
                            <div className="flex justify-between items-center mb-3"><span className="text-sm text-[#8892b0]">Priority</span><span className="text-sm font-bold text-[#f9b012]">{(hwSubmitted.priority || 'medium').toUpperCase()}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-[#8892b0]">Status</span><span className="text-sm font-bold text-[#22c55e]">{(hwSubmitted.status || 'pending').toUpperCase()}</span></div>
                        </div>
                        <button onClick={() => setHwSubmitted(null)} className="bg-[#1a367c] text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">SUBMIT ANOTHER</button>
                    </motion.div>
                )}

                {/* ===== ORDER SUMMARY MODAL ===== */}
                <AnimatePresence>
                    {showSummary && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSummary(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-extrabold text-[#1a367c]">Order Summary</h2>
                                    <button onClick={() => setShowSummary(false)} className="text-[#8892b0] hover:text-[#1a367c] transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-4 mb-6">
                                    {getCartItems().map(item => (
                                        <div key={item.id} className="flex justify-between items-start">
                                            <div><p className="font-bold text-[#1a367c] text-sm">{item.name}</p><p className="text-xs text-[#8892b0]">{item.quantity} x ₹{parseFloat(item.price).toFixed(2)}</p></div>
                                            <p className="font-bold text-[#1a367c] text-sm">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-100 pt-4 mb-6">
                                    <div className="flex justify-between items-center"><span className="text-sm font-semibold text-[#8892b0]">Grand Total</span><span className="text-xl font-extrabold text-[#22c55e]">₹{getGrandTotal().toFixed(2)}</span></div>
                                </div>
                                <button onClick={handlePlaceOrder} disabled={placingOrder}
                                    className="w-full bg-[#1a367c] text-white py-4 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all flex items-center justify-center gap-2">
                                    {placingOrder && <Loader2 className="w-4 h-4 animate-spin" />}CHECKOUT & PAY
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== CAFETERIA TABLE BOOKING MODAL ===== */}
                <AnimatePresence>
                    {showTableModal && selectedTable && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTableModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()} className="relative bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-md z-10 overflow-hidden">

                                {/* Header */}
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[#1a367c] shadow-sm">
                                            <Coffee className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-[#1a367c] tracking-tight">BOOK TABLE</h2>
                                            <p className="text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest leading-none mt-1">
                                                {selectedTable.table_code} · Seats {selectedTable.capacity}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowTableModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-[#8892b0] hover:bg-slate-100 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Start Time */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">START TIME</label>
                                        <input type="time" value={tableForm.start_time} onChange={e => setTableForm(p => ({ ...p, start_time: e.target.value }))}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 text-sm text-[#1a367c] font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1a367c]/10 transition-all" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Duration */}
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">DURATION</label>
                                            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-200">
                                                <button onClick={() => setTableForm(p => ({ ...p, duration: Math.max(10, p.duration - 10) }))} disabled={tableForm.duration <= 10}
                                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all"><Minus className="w-3.5 h-3.5" /></button>
                                                <div className="text-center">
                                                    <div className="text-sm font-extrabold text-[#1a367c]">
                                                        {tableForm.duration < 60 ? `${tableForm.duration}m` : `${Math.floor(tableForm.duration / 60)}h${tableForm.duration % 60 ? ` ${tableForm.duration % 60}m` : ''}`}
                                                    </div>
                                                    <div className="text-[0.5rem] text-[#8892b0] font-bold">10 min — 1.5 hrs</div>
                                                </div>
                                                <button onClick={() => setTableForm(p => ({ ...p, duration: Math.min(90, p.duration + 10) }))} disabled={tableForm.duration >= 90}
                                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all"><Plus className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>

                                        {/* Guests */}
                                        <div className="space-y-2">
                                            <label className="text-[0.65rem] font-bold text-[#8892b0] uppercase tracking-wider block ml-1">GUESTS</label>
                                            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 border border-slate-200">
                                                <button onClick={() => setTableForm(p => ({ ...p, guest_count: Math.max(1, p.guest_count - 1) }))} disabled={tableForm.guest_count <= 1}
                                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all"><Minus className="w-3.5 h-3.5" /></button>
                                                <div className="text-center">
                                                    <div className="text-sm font-extrabold text-[#1a367c]">{tableForm.guest_count}</div>
                                                    <div className="text-[0.5rem] text-[#8892b0] font-bold">max {selectedTable.capacity}</div>
                                                </div>
                                                <button onClick={() => setTableForm(p => ({ ...p, guest_count: Math.min(selectedTable.capacity, p.guest_count + 1) }))} disabled={tableForm.guest_count >= selectedTable.capacity}
                                                    className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#1a367c] hover:bg-slate-100 disabled:opacity-30 shadow-sm transition-all"><Plus className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-[#1a367c]/5 rounded-[24px] p-5 border border-[#1a367c]/10">
                                        <div className="flex items-center justify-between text-[#1a367c]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <span className="text-[0.65rem] font-bold uppercase tracking-widest">TODAY</span>
                                            </div>
                                            <div className="text-right text-[#1a367c]">
                                                <div className="text-sm font-black tracking-tight">{tableForm.start_time} → {calculateEndTime(tableForm.start_time, tableForm.duration)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <button onClick={handleBookTable} disabled={bookingTable}
                                        className="w-full py-5 rounded-[24px] bg-[#1a367c] text-white text-[0.75rem] font-black tracking-[0.2em] hover:bg-[#142a5e] transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3 uppercase">
                                        {bookingTable ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>BOOKING...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>CONFIRM BOOKING</span>
                                                <Check className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ===== CONFERENCE ROOM BOOKING MODAL ===== */}
                <AnimatePresence>
                    {showRoomModal && selectedRoom && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRoomModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[420px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#1a367c] rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
                                        <div>
                                            <h2 className="text-base font-extrabold text-[#1a367c]">Book Room</h2>
                                            <p className="text-[0.65rem] text-[#8892b0]">{selectedRoom.room_label || selectedRoom.room_code}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowRoomModal(false)} className="text-[#8892b0] hover:text-[#1a367c] transition-colors"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-[#8892b0] tracking-wider block mb-2">DATE</label>
                                        <input type="date" value={roomBookingForm.booking_date} onChange={e => setRoomBookingForm(p => ({ ...p, booking_date: e.target.value }))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium focus:outline-none focus:border-[#1a367c]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-[#8892b0] tracking-wider block mb-2">START TIME</label>
                                            <input type="time" value={roomBookingForm.start_time} onChange={e => setRoomBookingForm(p => ({ ...p, start_time: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium focus:outline-none focus:border-[#1a367c]" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[#8892b0] tracking-wider block mb-2">END TIME</label>
                                            <input type="time" value={roomBookingForm.end_time} onChange={e => setRoomBookingForm(p => ({ ...p, end_time: e.target.value }))}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium focus:outline-none focus:border-[#1a367c]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#8892b0] tracking-wider block mb-2">MEETING TITLE</label>
                                        <input type="text" value={roomBookingForm.title} onChange={e => setRoomBookingForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Sprint Planning"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium placeholder:text-slate-300 focus:outline-none focus:border-[#1a367c]" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#8892b0] tracking-wider block mb-2">ATTENDEES</label>
                                        <input type="number" min={1} value={roomBookingForm.attendees_count} onChange={e => setRoomBookingForm(p => ({ ...p, attendees_count: parseInt(e.target.value) || 1 }))}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#1a367c] font-medium focus:outline-none focus:border-[#1a367c]" />
                                    </div>
                                    <button onClick={handleBookRoom} disabled={bookingRoom || !roomBookingForm.title}
                                        className={`w-full py-4 rounded-xl text-xs font-bold tracking-widest transition-all flex items-center justify-center gap-2 ${roomBookingForm.title ? 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                        {bookingRoom && <Loader2 className="w-4 h-4 animate-spin" />}
                                        CONFIRM BOOKING ✓
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ServiceBooking;
