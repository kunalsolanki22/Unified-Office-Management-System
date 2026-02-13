import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Calendar, Check, X, User, Users, AlertCircle, Clock, DollarSign, Zap, Filter, FolderOpen, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ProjectApprovals = () => {
    // Mock Data
    const [stats] = useState([
        { label: 'Pending Projects', value: 12, trend: '+2 this week', icon: FolderOpen, color: 'text-[#f9b012]' },
        { label: 'Approved Projects', value: 48, trend: 'Last 30 days', icon: CheckCircle, color: 'text-emerald-500' },
        { label: 'Rejected Projects', value: 5, trend: 'Requires Review', icon: XCircle, color: 'text-red-500' },
        { label: 'Total Budget', value: '$1.2M', trend: 'Allocated', icon: BarChart3, color: 'text-violet-500' },
    ]);

    const [projects, setProjects] = useState([
        { id: 'PRJ-2024-001', name: 'AI Analytics Dashboard', lead: 'Sarah Jenkins', dept: 'Engineering', budget: '$150,000', status: 'Pending', submitted: 'Feb 10, 2024', priority: 'High', description: 'Implementation of AI-driven analytics for customer behavior tracking.' },
        { id: 'PRJ-2024-002', name: 'Cloud Migration Phase 2', lead: 'Mike Ross', dept: 'IT Ops', budget: '$85,000', status: 'Pending', submitted: 'Feb 11, 2024', priority: 'Medium', description: 'Second phase of migrating legacy servers to AWS infrastructure.' },
        { id: 'PRJ-2024-003', name: 'HR Portal Revamp', lead: 'Jessica Pearson', dept: 'Human Resources', budget: '$45,000', status: 'Approved', submitted: 'Feb 09, 2024', priority: 'Low', description: 'Modernizing the internal HR portal for better employee experience.' },
    ]);


    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleAction = (id, action) => {
        if (action === 'reject') {
            setSelectedProjectId(id);
            setShowRejectModal(true);
            setRejectionReason('');
            return;
        }

        // Approve Logic
        setProjects(prev => prev.map(proj =>
            proj.id === id ? { ...proj, status: 'Approved' } : proj
        ));
        toast.success(`Project ${id} Approved`);
    };

    const handleRejectSubmit = () => {
        if (!rejectionReason.trim()) {
            toast.error("Please enter a rejection reason.");
            return;
        }

        setProjects(prev => prev.map(proj =>
            proj.id === selectedProjectId ? { ...proj, status: 'Rejected' } : proj
        ));

        setShowRejectModal(false);
        toast.info(`Project ${selectedProjectId} Rejected`);
        setSelectedProjectId(null);
        setRejectionReason('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Rejected': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#1a367c] flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Reject Project Proposal
                            </h3>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this project proposal. This will be sent to the project lead.
                        </p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-sm font-medium text-[#1a367c] placeholder:text-slate-400 resize-none mb-6"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-[#1a367c] uppercase tracking-tight">
                    PROJECT <span className="text-[#f9b012]">APPROVALS</span>
                </h1>
                <p className="text-xs font-medium text-[#8892b0] tracking-wide mt-1">
                    Review and manage department project proposals
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.color.replace('text', 'bg')}/10 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-[#1a367c] mb-1">{stat.value}</div>
                        <div className="text-xs font-medium text-[#8892b0] uppercase tracking-wide">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Project List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[#1a367c] flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#f9b012]" />
                        Recent Proposals
                    </h3>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {projects.map((project) => (
                        <div key={project.id} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                            {project.status}
                                        </span>
                                        <span className="text-xs font-bold text-[#8892b0]">{project.id}</span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs font-bold text-[#8892b0]">{project.submitted}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-[#1a367c] mb-1">{project.name}</h4>
                                    <p className="text-sm text-slate-500 mb-3">{project.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#8892b0]">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-[#1a367c] text-white flex items-center justify-center text-[0.6rem]">
                                                {project.lead.charAt(0)}
                                            </div>
                                            {project.lead}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5" />
                                            {project.dept}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            {project.budget}
                                        </div>
                                    </div>
                                </div>

                                {project.status === 'Pending' && (
                                    <div className="flex items-center gap-3 self-start lg:self-center">
                                        <button
                                            onClick={() => handleAction(project.id, 'reject')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all text-sm font-bold"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAction(project.id, 'approve')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a367c] text-white hover:bg-[#2c4a96] transition-all text-sm font-bold shadow-lg shadow-blue-900/20"
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProjectApprovals;
