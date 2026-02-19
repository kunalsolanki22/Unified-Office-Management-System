
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, Plus, X, Loader2, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import { attendanceService } from '../../services/attendanceService';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import LeaveProposal from '../../components/leave/LeaveProposal';

const MyAttendance = () => {
    const [todayStatus, setTodayStatus] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('attendance');

    // Timer State
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds
    const timerIntervalRef = useRef(null);

    const fetchStatus = useCallback(async () => {
        try {
            setLoadingStatus(true);
            const res = await attendanceService.getMyStatus();
            setTodayStatus(res?.data ?? null);

            // Calculate initial timer if checked in
            if (res?.data?.is_checked_in && res?.data?.entries) {
                const lastEntry = res.data.entries[res.data.entries.length - 1];
                if (lastEntry && !lastEntry.check_out) {
                    const checkInTime = new Date(lastEntry.check_in).getTime();
                    const now = new Date().getTime();
                    setElapsedTime(Math.floor((now - checkInTime) / 1000));
                }
            } else {
                setElapsedTime(0);
            }
        } catch { /* ignore */ }
        finally { setLoadingStatus(false); }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            setLoadingLogs(true);
            const res = await attendanceService.getMyAttendance({ page_size: 30 });
            setLogs(res?.data ?? []);
        } catch {
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
        fetchStatus();
        return () => clearInterval(timerIntervalRef.current);
    }, [fetchLogs, fetchStatus]);

    // Timer Logic
    useEffect(() => {
        if (todayStatus?.is_checked_in) {
            timerIntervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [todayStatus?.is_checked_in]);

    const formatTimer = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    const handleCheckIn = async () => {
        try {
            setCheckingIn(true);
            await attendanceService.checkIn();
            toast.success('Checked in successfully!');
            await fetchLogs();
            await fetchStatus();
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to check in.';
            toast.error(msg);
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setCheckingOut(true);
            await attendanceService.checkOut();
            toast.success('Checked out successfully!');
            await fetchLogs();
            await fetchStatus();
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to check out.';
            toast.error(msg);
        } finally {
            setCheckingOut(false);
        }
    };

    const confirmSubmit = async () => {
        try {
            setSubmitting(true);
            await attendanceService.submitAttendance(todayStatus?.attendance_id);
            toast.success('Attendance submitted for approval!');
            await fetchLogs();
            await fetchStatus();
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to submit attendance.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
            setIsSubmitModalOpen(false);
        }
    };

    const handleSubmit = () => {
        setIsSubmitModalOpen(true);
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        try {
            if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Treat "HH:MM:SS" as UTC
            const [h, m] = timeStr.split(':');
            const date = new Date();
            date.setUTCHours(parseInt(h), parseInt(m)); // Use UTC hours
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return timeStr; }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const map = {
            present: 'bg-green-50 text-green-600',
            checked_in: 'bg-orange-50 text-orange-500',
            submitted: 'bg-blue-50 text-blue-600',
            approved: 'bg-green-50 text-green-600',
            rejected: 'bg-red-50 text-red-500',
            absent: 'bg-red-50 text-red-500',
            pending_approval: 'bg-amber-50 text-amber-600'
        };
        return map[status?.toLowerCase()] || 'bg-slate-100 text-slate-500';
    };

    // Determine today's check-in/out from latest log
    const todayLog = logs[0];
    const hasCheckedIn = !!todayLog?.check_in_time; // This logic might need adjustment based on API response structure
    const hasCheckedOut = !!todayLog?.check_out_time;

    // Derived states from API
    const isCheckedIn = todayStatus?.is_checked_in;
    const canSubmit = todayStatus?.can_submit;
    const isDraft = todayStatus?.status === 'draft';
    const hasTodayRecord = todayStatus?.has_attendance;

    const daysPresent = logs.filter(l => ['approved', 'present', 'submitted', 'pending_approval'].includes(l.status)).length;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-10">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c] uppercase">
                    MY ATTENDANCE & LEAVES <span className="text-[#f9b012]">PERSONAL REGISTRY</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Track daily work hours & manage leave requests
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'attendance' ? 'text-[#1a367c]' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Daily Attendance
                    {activeTab === 'attendance' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1a367c]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('leave')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'leave' ? 'text-[#1a367c]' : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    Leave Proposal
                    {activeTab === 'leave' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1a367c]" />
                    )}
                </button>
            </div>

            {activeTab === 'attendance' ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                        {/* Left: Check In/Out Panel */}
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">

                            {/* Timer Display */}
                            <div className="absolute top-6 right-8 text-right">
                                <p className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase mb-1">SESSION DURATION</p>
                                <div className={`text-3xl font-mono font-bold ${isCheckedIn ? 'text-[#f9b012] animate-pulse' : 'text-slate-300'}`}>
                                    {formatTimer(elapsedTime)}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-[#1a367c] mb-6 flex items-center gap-2 uppercase tracking-wide">
                                    <CalendarIcon className="w-4 h-4" /> TODAY'S ATTENDANCE
                                </h3>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    {/* Check In Button */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">START</label>
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={isCheckedIn || (hasTodayRecord && !isDraft) || checkingIn}
                                            className={`w-full py-4 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg 
                                                ${isCheckedIn
                                                    ? 'bg-slate-50 text-slate-400 border border-slate-100 shadow-none cursor-not-allowed'
                                                    : (hasTodayRecord && !isDraft)
                                                        ? 'bg-slate-50 text-slate-400 border border-slate-100 shadow-none cursor-not-allowed'
                                                        : 'bg-green-600 text-white hover:bg-green-700 shadow-green-600/20 disabled:opacity-60'}`}
                                        >
                                            {checkingIn ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                <><Plus className="w-4 h-4" /> CHECK IN</>}
                                        </button>
                                    </div>

                                    {/* Check Out Button */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">PAUSE / END</label>
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={!isCheckedIn || checkingOut}
                                            className={`w-full py-4 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg 
                                                ${!isCheckedIn
                                                    ? 'bg-slate-50 text-slate-400 border border-slate-100 shadow-none cursor-not-allowed'
                                                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20 disabled:opacity-60'}`}
                                        >
                                            {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                <><Clock className="w-4 h-4" /> CHECK OUT</>}
                                        </button>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">FINISH DAY</label>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!canSubmit || submitting}
                                            className={`w-full py-4 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg 
                                                ${!canSubmit
                                                    ? 'bg-slate-50 text-slate-400 border border-slate-100 shadow-none cursor-not-allowed'
                                                    : 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-blue-900/20 disabled:opacity-60'}`}
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                <><Send className="w-4 h-4" /> SUBMIT</>}
                                        </button>
                                    </div>
                                </div>

                                {todayStatus?.entries?.length > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                                        <p className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase mb-2">TODAY'S ACTIVITY LOG</p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                            {todayStatus.entries.map((entry, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${entry.check_out ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></div>
                                                        <span className="font-mono text-slate-600">{formatTime(entry.check_in)}</span>
                                                        <span className="text-slate-300">→</span>
                                                        <span className="font-mono text-slate-600">{entry.check_out ? formatTime(entry.check_out) : 'Active...'}</span>
                                                    </div>
                                                    <div className="font-bold text-[#1a367c]">
                                                        {entry.duration_hours ? `${entry.duration_hours} hrs` : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-[#8892b0] font-medium mt-4">
                                {isCheckedIn && (
                                    <span className="flex items-center gap-1.5 text-orange-500 animate-pulse">
                                        <AlertCircle className="w-3.5 h-3.5" /> Checked In — Timer Running
                                    </span>
                                )}
                                {!isCheckedIn && canSubmit && (
                                    <span className="flex items-center gap-1.5 text-blue-600">
                                        <AlertCircle className="w-3.5 h-3.5" /> Ready to Submit — Don't forget to submit your attendance!
                                    </span>
                                )}
                                {!isCheckedIn && !canSubmit && hasTodayRecord && !isDraft && (
                                    <span className="flex items-center gap-1.5 text-green-600">
                                        <CheckCircle className="w-3.5 h-3.5" /> Attendance Submitted for Approval.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: Overview */}
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col">
                            <h3 className="text-sm font-bold text-[#1a367c] mb-6 uppercase tracking-wide">OVERVIEW</h3>

                            <div className="flex-1 flex flex-col gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#8892b0] uppercase tracking-wide">Days Present</span>
                                    <span className="text-lg font-extrabold text-[#1a367c]">
                                        {loadingLogs ? '—' : daysPresent}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#8892b0] uppercase tracking-wide">Total Logged Hours</span>
                                    <span className="text-lg font-extrabold text-[#1a367c]">
                                        {todayStatus?.total_hours || 0}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-xs font-bold text-[#8892b0] uppercase tracking-wide">Today's Status</span>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${getStatusBadge(todayStatus?.status || (isCheckedIn ? 'checked_in' : 'absent'))}`}>
                                        {todayStatus?.status?.replace('_', ' ') || (isCheckedIn ? 'Checked In' : 'Not Started')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submitted Logs Section */}
                    <div>
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 uppercase tracking-wide">ATTENDANCE LOGS</h3>
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left">
                                        <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase pl-4">Date</th>
                                        <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">In</th>
                                        <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Out</th>
                                        <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase w-1/2">Total Hours</th>
                                        <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase text-right pr-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {loadingLogs ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
                                            </td>
                                        </tr>
                                    ) : logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id} className="border-b border-slate-50 last:border-none hover:bg-[#fafbfb] transition-colors">
                                                <td className="py-5 pl-4 font-bold text-[#1a367c]">{formatDate(log.date || log.created_at)}</td>
                                                <td className="py-5 font-medium text-slate-600">{formatTime(log.first_check_in)}</td>
                                                <td className="py-5 font-medium text-slate-600">{formatTime(log.last_check_out)}</td>
                                                <td className="py-5 text-slate-600">{log.total_hours || '—'}</td>
                                                <td className="py-5 text-right pr-4">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide uppercase ${getStatusBadge(log.status)}`}>
                                                        {log.status?.replace('_', ' ') || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-slate-400 italic font-medium">No attendance logs yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <LeaveProposal />
            )}

            <ConfirmationModal
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                onConfirm={confirmSubmit}
                title="Submit Attendance"
                message="Are you sure you want to submit today's attendance? You won't be able to check in again today."
                confirmText="Submit"
                cancelText="Cancel"
            />
        </motion.div >
    );
};

export default MyAttendance;
