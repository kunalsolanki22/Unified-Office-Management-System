import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Check, X, AlertCircle, FolderOpen, BarChart3, CheckCircle, XCircle, Filter, Loader2, Zap, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { projectService } from '../../services/projectService';

const ProjectApprovals = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const res = await projectService.getProjects({ page_size: 100 });
            setProjects(res?.data ?? []);
        } catch (err) {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Derived stats
    const stats = [
        {
            label: 'Pending Projects',
            value: projects.filter(p => p.status === 'pending_approval').length,
            icon: FolderOpen,
            color: 'text-[#f9b012]'
        },
        {
            label: 'Approved Projects',
            value: projects.filter(p => p.status === 'approved' || p.status === 'in_progress' || p.status === 'completed').length,
            icon: CheckCircle,
            color: 'text-emerald-500'
        },
        {
            label: 'Rejected Projects',
            value: projects.filter(p => p.status === 'rejected').length,
            icon: XCircle,
            color: 'text-red-500'
        },
        {
            label: 'Total Projects',
            value: projects.length,
            icon: BarChart3,
            color: 'text-violet-500'
        },
    ];

    const handleAction = async (id, action) => {
        if (action === 'reject') {
            setSelectedProjectId(id);
            setShowRejectModal(true);
            setRejectionReason('');
            return;
        }

        try {
            setActionLoading(id);
            await projectService.approveProject(id, 'approve');
            toast.success('Project approved successfully');
            fetchProjects();
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Failed to approve project');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please enter a rejection reason.");
            return;
        }

        try {
            setActionLoading(selectedProjectId);
            await projectService.approveProject(selectedProjectId, 'reject', '', rejectionReason);
            toast.success('Project rejected successfully');
            setShowRejectModal(false);
            fetchProjects();
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Failed to reject project');
        } finally {
            setActionLoading(null);
            setSelectedProjectId(null);
            setRejectionReason('');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
            case 'pending_approval': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'in_progress': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'completed': return 'bg-purple-50 text-purple-600 border-purple-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Rejection Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
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
                                    disabled={actionLoading === selectedProjectId}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center"
                                >
                                    {actionLoading === selectedProjectId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <div className="text-2xl font-bold text-[#1a367c] mb-1">{loading ? '—' : stat.value}</div>
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
                        <button onClick={fetchProjects} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors" title="Refresh">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-12 flex justify-center text-slate-300">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : projects.length > 0 ? (
                        projects.map((project) => (
                            <div key={project.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className={`px-2.5 py-0.5 rounded-md text-[0.65rem] font-bold uppercase tracking-wider border ${getStatusColor(project.status)}`}>
                                                {project.status?.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs font-bold text-[#8892b0]">{project.project_code}</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs font-bold text-[#8892b0]">Submitted: {formatDate(project.created_at)}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-[#1a367c] mb-1">{project.title}</h4>
                                        <p className="text-sm text-slate-500 mb-3">{project.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#8892b0]">
                                            <div className="flex items-center gap-1.5" title="Project Lead">
                                                <div className="w-6 h-6 rounded-full bg-[#1a367c] text-white flex items-center justify-center text-[0.6rem] font-bold">
                                                    {(project.requested_by_name || 'U').charAt(0)}
                                                </div>
                                                {project.requested_by_name || project.requested_by_code}
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Duration">
                                                <Clock className="w-3.5 h-3.5" />
                                                {project.duration_days} Days
                                            </div>
                                            {project.approved_by_name && (
                                                <div className="flex items-center gap-1.5 text-emerald-600" title="Approved By">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Approved by {project.approved_by_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {project.status === 'pending_approval' && (
                                        <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
                                            <button
                                                onClick={() => handleAction(project.id, 'reject')}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all text-sm font-bold disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleAction(project.id, 'approve')}
                                                disabled={!!actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a367c] text-white hover:bg-[#2c4a96] transition-all text-sm font-bold shadow-lg shadow-blue-900/20 disabled:opacity-50"
                                            >
                                                {actionLoading === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                    <><Check className="w-4 h-4" /> Approve</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400 italic">No projects found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectApprovals;
