import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3 } from 'lucide-react';

const MyAttendance = () => {
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [attLog, setAttLog] = useState([
        { date: 'Feb 10, 2026', in: '09:00 AM', out: '--:--', summary: 'Portal Development (In Progress)', status: 'Active' },
        { date: 'Feb 09, 2026', in: '09:15 AM', out: '06:30 PM', summary: 'User Directory Implementation', status: 'Verified' },
    ]);
    const [newEntry, setNewEntry] = useState({ date: '', in: '', out: '', summary: '', status: 'Pending' });

    const handleSubmit = () => {
        if (newEntry.date && newEntry.in && newEntry.summary) {
            const dateObj = new Date(newEntry.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            setAttLog([{ ...newEntry, date: dateStr, out: newEntry.out || '--:--' }, ...attLog]);
            setNewEntry({ date: '', in: '', out: '', summary: '', status: 'Pending' });
            alert('Attendance Logged Successfully');
        } else {
            alert('Please fill in Date, Login Time, and Work Summary');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    MY ATTENDANCE & LOGS <span className="text-[#f9b012]">PERSONAL REGISTRY</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Track Daily Work Hours & Manage Leave Requests
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                {/* Log Activity Form */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                    <h3 className="flex items-center gap-3 text-sm font-bold text-[#1a367c] mb-6 tracking-wide">
                        <Edit3 className="w-5 h-5" />
                        LOG DAILY ACTIVITY
                    </h3>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">DATE</label>
                            <input
                                type="date"
                                className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#1a367c] font-medium"
                                value={newEntry.date}
                                onChange={e => setNewEntry({ ...newEntry, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">STATUS</label>
                            <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#1a367c] font-medium">
                                <option>Present</option>
                                <option>Remote</option>
                                <option>Half-Day</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">LOGIN TIME</label>
                            <input
                                type="time"
                                className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#1a367c] font-medium"
                                value={newEntry.in}
                                onChange={e => setNewEntry({ ...newEntry, in: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">LOGOUT TIME</label>
                            <input
                                type="time"
                                className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#1a367c] font-medium"
                                value={newEntry.out}
                                onChange={e => setNewEntry({ ...newEntry, out: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">WORK DONE</label>
                        <textarea
                            rows="3"
                            placeholder="Brief summary of tasks completed..."
                            className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#1a367c] font-medium resize-none"
                            value={newEntry.summary}
                            onChange={e => setNewEntry({ ...newEntry, summary: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="bg-[#1a367c] text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/10"
                        >
                            SUBMIT ENTRY
                        </button>
                    </div>
                </div>

                {/* Right: Overview & Calendar */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                    <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">OVERVIEW</h3>

                    <div className="bg-[#f8f9fa] rounded-2xl p-6 text-center mb-6 flex-1">
                        <div className="text-sm font-bold text-[#1a367c] mb-4">FEBRUARY 2026</div>
                        <div className="grid grid-cols-7 gap-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                                <div key={d} className="text-[0.7rem] font-bold text-[#8892b0]">{d}</div>
                            ))}
                            {/* Simple placeholders matching HTML layout roughly */}
                            <div className="col-span-3"></div>
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} className={`text-xs p-1.5 rounded-lg font-medium ${i === 9 ? 'border border-[#f9b012] text-[#f9b012] font-bold' : 'text-[#8892b0]'}`}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between mb-6 text-xs text-[#8892b0] font-medium">
                        <span>Days Present: <b className="text-[#1a367c]">18</b></span>
                        <span>Pending Logs: <b className="text-[#1a367c]">0</b></span>
                    </div>

                    <button
                        onClick={() => setShowLeaveForm(!showLeaveForm)}
                        className="w-full py-3 bg-[#fff0f0] text-[#d32f2f] border border-[#ffcbcb] rounded-xl text-xs font-bold hover:bg-[#d32f2f] hover:text-white transition-colors"
                    >
                        + APPLY FOR LEAVE
                    </button>

                    <AnimatePresence>
                        {showLeaveForm && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-4 pt-4 border-t border-dashed border-slate-200 overflow-hidden"
                            >
                                <div className="space-y-3">
                                    <input type="date" className="w-full bg-[#f8f9fa] p-2 rounded border border-slate-100 text-xs" />
                                    <input type="text" placeholder="Reason for leave..." className="w-full bg-[#f8f9fa] p-2 rounded border border-slate-100 text-xs" />
                                    <button
                                        className="w-full bg-[#8892b0] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#7a83a0]"
                                        onClick={() => { alert('Leave Request Submitted'); setShowLeaveForm(false); }}
                                    >
                                        CONFIRM REQUEST
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Submitted Logs List */}
            <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="text-sm font-bold text-[#1a367c] tracking-wide">SUBMITTED LOGS</h3>
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#fff] border-b border-slate-100">
                            <th className="p-6 text-left text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Date</th>
                            <th className="p-6 text-left text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">In</th>
                            <th className="p-6 text-left text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Out</th>
                            <th className="p-6 text-left text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Work Summary</th>
                            <th className="p-6 text-left text-[0.7rem] font-bold text-[#8892b0] uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attLog.map((log, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-[#fafbfb] last:border-0 transition-colors">
                                <td className="p-6 text-sm font-bold text-[#1a367c]">{log.date}</td>
                                <td className="p-6 text-sm text-[#555]">{log.in}</td>
                                <td className="p-6 text-sm text-[#555]">{log.out}</td>
                                <td className="p-6 text-sm text-[#555]">{log.summary}</td>
                                <td className="p-6">
                                    <span className={`text-xs font-bold tracking-wide ${log.status === 'Active' ? 'text-[#f9b012]' : log.status === 'Pending' ? 'text-slate-400' : 'text-green-600'}`}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default MyAttendance;
