import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Briefcase, Clock, AlertCircle, Plus, X, Check, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { leaveService } from '../../services/leaveService';

const LeaveProposal = () => {
    // State
    const [balances, setBalances] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        is_half_day: false,
        half_day_type: '', // first_half, second_half
        emergency_contact: '',
        emergency_phone: ''
    });

    const fetchBalance = useCallback(async () => {
        try {
            setLoading(true);
            const res = await leaveService.getBalance();
            setBalances(res?.data ?? []);
        } catch (error) {
            toast.error("Failed to fetch leave balance");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            const res = await leaveService.getMyLeaves({ page_size: 20 });
            setHistory(res?.data ?? []);
        } catch (error) {
            // silent fail or toast
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBalance();
        fetchHistory();
    }, [fetchBalance, fetchHistory]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.leave_type || !formData.start_date || !formData.end_date) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setSubmitting(true);

            // Clean data
            const payload = {
                leave_type: formData.leave_type,
                start_date: formData.start_date,
                end_date: formData.end_date,
                reason: formData.reason,
                is_half_day: formData.is_half_day,
                ...(formData.is_half_day && { half_day_type: formData.half_day_type }),
                emergency_contact: formData.emergency_contact,
                emergency_phone: formData.emergency_phone
            };

            await leaveService.createLeave(payload);
            toast.success("Leave request submitted successfully!");
            setShowForm(false);
            setFormData({
                leave_type: '',
                start_date: '',
                end_date: '',
                reason: '',
                is_half_day: false,
                half_day_type: '',
                emergency_contact: '',
                emergency_phone: ''
            });
            fetchBalance(); // Refresh balance
            fetchHistory(); // Refresh history
        } catch (error) {
            const msg = error?.response?.data?.detail || "Failed to submit leave request";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            approved: 'bg-green-100 text-green-700 border-green-200',
            rejected: 'bg-red-100 text-red-700 border-red-200',
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
            approved_by_team_lead: 'bg-blue-50 text-blue-600 border-blue-200'
        };
        return map[status?.toLowerCase()] || 'bg-slate-100 text-slate-500';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header / Apply Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-[#1a367c] uppercase tracking-wide">Leave Management</h2>
                    <p className="text-xs text-[#8892b0] font-medium">View balances and track your leave requests</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1a367c] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 hover:bg-[#2c4a96] transition-all"
                >
                    {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel Request' : 'Apply Leave'}
                </button>
            </div>

            {/* Leave Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {balances.map((bal, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Briefcase className="w-12 h-12 text-[#1a367c]" />
                        </div>
                        <h3 className="text-xs font-bold text-[#8892b0] uppercase tracking-wider mb-2">{bal.leave_type_name || bal.leave_type}</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-extrabold text-[#1a367c]">{parseFloat(bal.available_days)}</span>
                            <span className="text-xs font-bold text-slate-400 mb-1.5">/ {parseFloat(bal.total_days)} days</span>
                        </div>
                        <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#f9b012] rounded-full"
                                style={{ width: `${(parseFloat(bal.used_days) / parseFloat(bal.total_days)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Application Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-50 border border-slate-200 rounded-[24px] p-8"
                >
                    <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-wide mb-6 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> New Leave Request
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Leave Type</label>
                                <select
                                    name="leave_type"
                                    value={formData.leave_type}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {balances.map(b => (
                                        <option key={b.id} value={b.leave_type}>{b.leave_type_name || b.leave_type}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    min={formData.start_date}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_half_day"
                                    checked={formData.is_half_day}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded text-[#1a367c] focus:ring-[#1a367c]"
                                />
                                <span className="text-xs font-bold text-[#1a367c] uppercase tracking-wide">Half Day Leave</span>
                            </label>

                            {formData.is_half_day && (
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="half_day_type"
                                            value="first_half"
                                            checked={formData.half_day_type === 'first_half'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-[#1a367c] focus:ring-[#1a367c]"
                                        />
                                        <span className="text-xs font-medium text-slate-600">First Half</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="half_day_type"
                                            value="second_half"
                                            checked={formData.half_day_type === 'second_half'}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-[#1a367c] focus:ring-[#1a367c]"
                                        />
                                        <span className="text-xs font-medium text-slate-600">Second Half</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Reason</label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 resize-none"
                                placeholder="Please describe the reason for your leave..."
                            ></textarea>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Emergency Contact Name</label>
                                <input
                                    type="text"
                                    name="emergency_contact"
                                    value={formData.emergency_contact}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Emergency Phone</label>
                                <input
                                    type="tel"
                                    name="emergency_phone"
                                    value={formData.emergency_phone}
                                    onChange={handleChange}
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#1a367c] focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 rounded-xl bg-[#1a367c] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#2c4a96] shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-60"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Submit Request</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Application History */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 overflow-hidden">
                <h3 className="text-sm font-bold text-[#1a367c] mb-6 uppercase tracking-wide">Leave History</h3>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase pl-4">Type</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Dates</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Total Days</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Reason</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Approved By</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase text-right pr-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {historyLoading ? (
                                <tr><td colSpan="6" className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></td></tr>
                            ) : history.length > 0 ? (
                                history.map((req) => (
                                    <tr key={req.id} className="border-b border-slate-50 last:border-none hover:bg-[#fafbfb]">
                                        <td className="py-4 pl-4 font-bold text-[#1a367c]">{req.leave_type_name || req.leave_type}</td>
                                        <td className="py-4 font-medium text-slate-600">
                                            {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 text-slate-600 font-mono">{parseFloat(req.total_days)}</td>
                                        <td className="py-4 text-slate-500 max-w-xs truncate">{req.reason || '-'}</td>
                                        <td className="py-4 text-slate-600">
                                            {req.approver_name ? <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> {req.approver_name}</span> : '-'}
                                        </td>
                                        <td className="py-4 text-right pr-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full text-[0.65rem] font-bold tracking-wide uppercase border ${getStatusBadge(req.status)}`}>
                                                {req.status?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="py-8 text-center text-slate-400 italic">No leave history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaveProposal;
