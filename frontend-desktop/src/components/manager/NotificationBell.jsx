import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mockNotifications = [
    { id: 1, title: 'New Hardware Request', message: 'Karan Sharma requested a new laptop', time: '5 min ago', unread: true },
    { id: 2, title: 'Asset Assignment', message: 'Laptop AST-004 assigned successfully', time: '1 hour ago', unread: true },
    { id: 3, title: 'Parking Request Approved', message: 'Slot A-05 assigned to Priya Verma', time: '2 hours ago', unread: false },
    { id: 4, title: 'System Update', message: 'Dashboard features updated', time: '1 day ago', unread: false },
];

const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(mockNotifications);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => n.unread).length;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const removeNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
                <Bell className="w-5 h-5 text-[#1a367c]" strokeWidth={2} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#f9b012] rounded-full border-2 border-white"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[9999]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-[#1a367c]">Notifications</h3>
                                {unreadCount > 0 && (
                                    <p className="text-xs text-[#8892b0] mt-0.5">{unreadCount} unread</p>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-[#f9b012] font-semibold hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-[#8892b0]">No notifications</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors relative group ${
                                            notif.unread ? 'bg-blue-50/30' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-[#1a367c]">{notif.title}</h4>
                                                    {notif.unread && (
                                                        <span className="w-2 h-2 bg-[#f9b012] rounded-full"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#8892b0] mt-1">{notif.message}</p>
                                                <p className="text-xs text-[#8892b0] mt-1.5">{notif.time}</p>
                                            </div>
                                            <button
                                                onClick={() => removeNotification(notif.id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded"
                                            >
                                                <X className="w-3.5 h-3.5 text-slate-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;