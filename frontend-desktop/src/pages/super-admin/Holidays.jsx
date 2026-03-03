import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Bookmark, Search, Loader2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import Calendar from '../../components/ui/Calendar';
import { holidayService } from '../../services/holidayService';

const HOLIDAY_TYPES = [
    { value: 'national', label: 'National' },
    { value: 'festival', label: 'Festival' },
    { value: 'company', label: 'Company' },
    { value: 'religious', label: 'Religious' },
    { value: 'optional', label: 'Optional' },
];

const Holidays = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [holidayType, setHolidayType] = useState('company');
    const [eventDescription, setEventDescription] = useState('');
    const [isOptional, setIsOptional] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState(null); // { type: 'success' | 'error', text: string }

    const fetchHolidays = useCallback(async () => {
        try {
            setLoading(true);
            const res = await holidayService.getHolidays({ upcoming_only: false, page_size: 100 });
            setHolidays(res?.data ?? []);
        } catch {
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

    const handleCreateHoliday = async (e) => {
        e.preventDefault();
        if (!eventName.trim() || !eventDate) return;

        try {
            setSubmitting(true);
            setFormMessage(null);
            await holidayService.createHoliday({
                name: eventName.trim(),
                date: eventDate,
                holiday_type: holidayType,
                description: eventDescription.trim() || null,
                is_optional: isOptional,
            });

            // Reset form
            setEventName('');
            setEventDate('');
            setHolidayType('company');
            setEventDescription('');
            setIsOptional(false);
            setFormMessage({ type: 'success', text: 'Holiday proclaimed successfully!' });

            // Refresh list
            await fetchHolidays();

            // Auto-clear success message
            setTimeout(() => setFormMessage(null), 4000);
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to create holiday';
            setFormMessage({ type: 'error', text: msg });
            setTimeout(() => setFormMessage(null), 5000);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatus = (dateStr) => {
        if (!dateStr) return 'SCHEDULED';
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) return 'COMPLETED';
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        if (diff <= 30) return 'UPCOMING';
        return 'SCHEDULED';
    };

    const getStatusColor = (status) => {
        if (status === 'COMPLETED') return 'text-green-500';
        if (status === 'UPCOMING') return 'text-[#f9b012]';
        return 'text-slate-400';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDayName = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
    };

    const calendarEvents = holidays.map(h => ({
        date: formatDate(h.date),
        name: h.name,
        day: getDayName(h.date),
        category: h.holiday_type || 'PUBLIC',
        status: getStatus(h.date),
        color: getStatusColor(getStatus(h.date))
    }));

    const filteredHolidays = holidays.filter(h =>
        h.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.holiday_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatDate(h.date).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    HOLIDAY <span className="text-[#f9b012]">REGISTRY</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Manage Global Off-Days for the Administrative Force
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                <Calendar events={calendarEvents} />

                {/* Proclaim Holiday Form */}
                <form onSubmit={handleCreateHoliday} className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-[#1a367c] mb-6">PROCLAIM HOLIDAY</h3>

                    {formMessage && (
                        <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl text-xs font-bold ${formMessage.type === 'success'
                                ? 'bg-green-50 text-green-600'
                                : 'bg-red-50 text-red-500'
                            }`}>
                            {formMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {formMessage.text}
                        </div>
                    )}

                    <div className="space-y-5 flex-1">
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider block">EVENT NAME</label>
                            <input
                                type="text"
                                placeholder="e.g. Maha Shivratri"
                                value={eventName}
                                onChange={e => setEventName(e.target.value)}
                                required
                                className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium placeholder:text-[#999]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider block">EXECUTION DATE</label>
                            <input
                                type="date"
                                value={eventDate}
                                onChange={e => setEventDate(e.target.value)}
                                required
                                className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium placeholder:text-[#999]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider block">HOLIDAY TYPE</label>
                            <select
                                value={holidayType}
                                onChange={e => setHolidayType(e.target.value)}
                                className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium appearance-none cursor-pointer"
                            >
                                {HOLIDAY_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider block">DESCRIPTION (OPTIONAL)</label>
                            <input
                                type="text"
                                placeholder="Brief description..."
                                value={eventDescription}
                                onChange={e => setEventDescription(e.target.value)}
                                className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium placeholder:text-[#999]"
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isOptional}
                                onChange={e => setIsOptional(e.target.checked)}
                                className="w-4 h-4 rounded accent-[#1a367c]"
                            />
                            <span className="text-xs font-bold text-[#8892b0] tracking-wider">OPTIONAL HOLIDAY</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !eventName.trim() || !eventDate}
                        className="w-full mt-6 bg-[#1a367c] text-white py-4 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> COMMITTING...</>
                        ) : (
                            <><Plus className="w-4 h-4" /> COMMIT TO REGISTRY</>
                        )}
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <div className="flex items-center gap-3 text-[#1a367c] font-bold text-lg">
                        <Bookmark className="w-5 h-5" />
                        ANNOUNCED HOLIDAYS
                    </div>
                    <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm w-[250px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search holidays..."
                            className="ml-3 bg-transparent border-none outline-none text-xs font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#f8f9fa] text-left">
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Date</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Event Name</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Day</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Category</th>
                                <th className="p-6 text-[0.75rem] font-bold text-[#8892b0] tracking-widest uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredHolidays.length > 0 ? (
                                filteredHolidays.map((h) => {
                                    const status = getStatus(h.date);
                                    return (
                                        <tr key={h.id} className="border-b border-slate-50 hover:bg-[#fafbfb] transition-colors last:border-none">
                                            <td className="p-6 text-sm font-bold text-[#1a367c]">{formatDate(h.date)}</td>
                                            <td className="p-6 text-sm font-medium text-[#1a367c]">{h.name}</td>
                                            <td className="p-6 text-sm text-[#8892b0]">{getDayName(h.date)}</td>
                                            <td className="p-6">
                                                <span className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide bg-[#f9b012]/10 text-[#f9b012] uppercase">
                                                    {h.holiday_type || 'PUBLIC'}
                                                </span>
                                            </td>
                                            <td className={`p-6 text-xs font-bold tracking-wide uppercase ${getStatusColor(status)}`}>
                                                {status}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400 text-sm font-medium italic">
                                        {searchQuery ? 'No holidays match your search.' : 'No holidays found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default Holidays;
