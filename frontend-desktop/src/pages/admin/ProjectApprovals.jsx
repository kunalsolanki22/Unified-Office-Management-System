import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Calendar, Check, X, User, Users } from 'lucide-react';
import { toast } from 'react-toastify';

const ProjectApprovals = () => {
    // Mock Data based on the image
    const [requests, setRequests] = useState([
        {
            id: 'PRJ-2026-001',
            title: 'Core UI Portal Refresh',
            manager: 'Sarah Miller',
            managerRole: 'Reporting Manager',
            description: 'Modernizing the administrative core pillars with React-based microservices architecture.',
            teamCount: 5,
            teamInitials: ['JD', 'MK', 'ST', 'AL'],
            deadline: 'May 15, 2026',
            status: 'PENDING'
        },
        {
            id: 'PRJ-2026-004',
            title: 'Infrastructure Migration',
            manager: 'David Chen',
            managerRole: 'Reporting Manager',
            description: 'Moving legacy databases to high-availability node clusters in the cloud environment.',
            teamCount: 8,
            teamInitials: ['CH', 'BN', 'OP'],
            deadline: 'June 30, 2026',
            status: 'PENDING'
        }
    ]);

    const handleApprove = (id) => {
        toast.success(`Project ${id} approved successfully`);
        setRequests(requests.filter(r => r.id !== id));
    };

    const handleReject = (id) => {
        toast.error(`Project ${id} rejected`);
        setRequests(requests.filter(r => r.id !== id));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-10"
        >
            {/* Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1a367c] uppercase tracking-tight">
                            PROJECT FORMATION <span className="text-[#f9b012]">APPROVALS</span>
                        </h1>
                        <p className="text-xs font-medium text-[#8892b0] tracking-wide mt-1">
                            Review project structures, descriptions, and team assignments
                        </p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6">
                <AnimatePresence>
                    {requests.length > 0 ? (
                        requests.map((req) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow"
                            >
                                {/* Top Row: Title & Manager */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#1a367c] mb-1">{req.title}</h3>
                                        <span className="text-[0.65rem] font-bold text-[#f9b012] tracking-wider uppercase bg-[#f9b012]/10 px-2 py-1 rounded-md">
                                            REQUEST ID: #{req.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                        <div className="w-8 h-8 rounded-full bg-[#1a367c] flex items-center justify-center text-white text-xs font-bold">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[#1a367c]">{req.manager}</span>
                                            <span className="text-[0.6rem] font-bold text-[#8892b0] uppercase tracking-wide">{req.managerRole}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle Row: Grid Info */}
                                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 mb-8 pb-8 border-b border-slate-50">
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">DESCRIPTION / OBJECTIVE</label>
                                        <p className="text-sm font-bold text-[#1a367c] leading-relaxed">
                                            {req.description}
                                        </p>
                                    </div>

                                    {/* Team */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">ASSIGNED TEAM ({String(req.teamCount).padStart(2, '0')})</label>
                                        <div className="flex -space-x-2">
                                            {req.teamInitials.map((initial, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-[#1a367c] border-2 border-white flex items-center justify-center text-[0.65rem] font-bold text-white uppercase shadow-sm">
                                                    {initial}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-[#f9b012] border-2 border-white flex items-center justify-center text-[0.65rem] font-bold text-white shadow-sm z-10">
                                                +{req.teamCount - req.teamInitials.length}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider uppercase block">PROPOSED DEADLINE</label>
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#1a367c]">
                                            <Calendar className="w-4 h-4 text-[#1a367c]" />
                                            {req.deadline}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Actions */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleApprove(req.id)}
                                        className="bg-[#2ecc71] text-white px-8 py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-[#27ae60] transition-all shadow-lg shadow-green-900/10 flex items-center gap-2 uppercase"
                                    >
                                        <Check className="w-4 h-4" /> APPROVE FORMATION
                                    </button>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        className="bg-white text-[#ef4444] border border-[#ef4444]/20 px-8 py-3 rounded-lg text-xs font-bold tracking-widest hover:bg-red-50 transition-all flex items-center gap-2 uppercase"
                                    >
                                        <X className="w-4 h-4" /> REJECT REQUEST
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="bg-white rounded-[20px] p-12 text-center border border-slate-100">
                            <Briefcase className="w-12 h-12 text-[#1a367c]/20 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-[#1a367c] mb-2">ALL CAUGHT UP!</h3>
                            <p className="text-sm text-[#8892b0]">No pending project formation requests at the moment.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default ProjectApprovals;
