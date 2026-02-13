import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
// Import a calendar component or placeholder if not available in the reporting manager scope yet
// Using a placeholder for now to ensure no import errors, but structure matches Attendance Manager
const CalendarPlaceholder = () => (
    <div className="bg-[#f8f9fa] rounded-2xl p-4 h-full flex flex-col items-center justify-center min-h-[250px] text-slate-400 font-medium">
        Calendar Widget
    </div>
);

const MyAttendance = () => {
    // State for form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('Present');
    const [checkInTime, setCheckInTime] = useState(null);
    const [checkOutTime, setCheckOutTime] = useState(null);
    const [workDone, setWorkDone] = useState('');

    // Mock Data for Logs
    const [logs, setLogs] = useState([
        { id: 1, date: 'Feb 10, 2026', in: '09:00 AM', out: '--:--', summary: 'Portal Development (In Progress)', status: 'Active' },
        { id: 2, date: 'Feb 09, 2026', in: '09:15 AM', out: '06:30 PM', summary: 'User Directory Implementation', status: 'Verified' },
    ]);

    const handleCheckIn = () => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckInTime(now);
    };

    const handleCheckOut = () => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setCheckOutTime(now);
    };

    const handleSubmit = () => {
        if (!checkInTime) return; // Basic validation

        const newLog = {
            id: Date.now(),
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            in: checkInTime,
            out: checkOutTime || '--:--',
            summary: workDone || 'No summary provided',
            status: checkOutTime ? 'Verified' : 'Active'
        };

        setLogs([newLog, ...logs]);
        // Reset form slightly
        setWorkDone('');
        setCheckInTime(null);
        setCheckOutTime(null);
        toast.success("Attendance Log Submitted");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-10"
        >
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c] uppercase">
                    MY ATTENDANCE & LOGS <span className="text-[#f9b012]">PERSONAL REGISTRY</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Track daily work hours & manage leave requests
                </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">

                {/* Left Column: Log Daily Activity */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 flex items-center gap-2 uppercase tracking-wide">
                            <CalendarIcon className="w-4 h-4" /> LOG DAILY ACTIVITY
                        </h3>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">DATE</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">STATUS</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full bg-[#f8f9fa] p-3 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                >
                                    <option>Present</option>
                                    <option>Work from Home</option>
                                    <option>On Duty</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">CHECK IN TIME</label>
                                <button
                                    onClick={handleCheckIn}
                                    disabled={checkInTime}
                                    className={`w-full py-4 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg 
                                        ${checkInTime
                                            ? 'bg-green-50 text-green-600 border border-green-100 shadow-none cursor-default'
                                            : 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-blue-900/20'}`}
                                >
                                    {checkInTime ? <><CheckCircle className="w-4 h-4" /> {checkInTime}</> : <><Plus className="w-4 h-4" /> CHECK IN</>}
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">CHECK OUT TIME</label>
                                <button
                                    onClick={handleCheckOut}
                                    disabled={!checkInTime || checkOutTime}
                                    className={`w-full py-4 rounded-xl text-xs font-bold tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg 
                                        ${checkOutTime
                                            ? 'bg-slate-100 text-slate-500 border border-slate-200 shadow-none cursor-default'
                                            : (!checkInTime ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#1a367c] text-white hover:bg-[#2c4a96] shadow-blue-900/20')}`}
                                >
                                    {checkOutTime ? <><Clock className="w-4 h-4" /> {checkOutTime}</> : <><X className="w-4 h-4" /> CHECK OUT</>}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">WORK DONE</label>
                            <textarea
                                value={workDone}
                                onChange={(e) => setWorkDone(e.target.value)}
                                className="w-full bg-[#f8f9fa] p-4 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium placeholder:text-[#999] min-h-[100px]"
                                placeholder="Brief summary of tasks completed..."
                            ></textarea>
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="bg-[#1a367c] text-white px-8 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 w-fit"
                    >
                        SUBMIT ENTRY
                    </button>
                </div>

                {/* Right Column: Overview */}
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-[#1a367c] mb-6 uppercase tracking-wide">OVERVIEW</h3>

                    {/* Calendar Wrapper */}
                    <div className="flex-1 mb-6">
                        <CalendarPlaceholder />
                    </div>

                    <div className="flex justify-between items-center mb-6 text-xs font-bold">
                        <div className="text-[#8892b0]">Days Present: <span className="text-[#1a367c]">18</span></div>
                        <div className="text-[#8892b0]">Pending Logs: <span className="text-[#1a367c]">0</span></div>
                    </div>

                    <button
                        onClick={() => toast.info('Leave application form opening...')}
                        className="w-full border border-red-100 bg-red-50 text-red-500 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-red-100 transition-all uppercase"
                    >
                        + APPLY FOR LEAVE
                    </button>
                </div>
            </div>

            {/* Submitted Logs Section */}
            <div>
                <h3 className="text-sm font-bold text-[#1a367c] mb-6 uppercase tracking-wide">SUBMITTED LOGS</h3>
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 text-left">
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase pl-4">Date</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">In</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase">Out</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase w-1/2">Work Summary</th>
                                <th className="pb-4 pt-2 text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase text-right pr-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-slate-50 last:border-none hover:bg-[#fafbfb] transition-colors">
                                    <td className="py-5 pl-4 font-bold text-[#1a367c]">{log.date}</td>
                                    <td className="py-5 font-medium text-slate-600">{log.in}</td>
                                    <td className="py-5 font-medium text-slate-600">{log.out}</td>
                                    <td className="py-5 text-slate-600">{log.summary}</td>
                                    <td className="py-5 text-right pr-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wide uppercase 
                                            ${log.status === 'Active' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-400 italic font-medium">No logs submitted yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default MyAttendance;
