import React, { useState, useEffect, useCallback } from 'react';
import {
    Briefcase,
    Send,
    PlusCircle,
    Loader2,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { projectService } from '../../services/projectService';
import { cafeteriaService } from '../../services/cafeteriaService';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-500', icon: Clock },
    submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-600', icon: AlertCircle },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-600', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600', icon: XCircle },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-600', icon: Clock },
    completed: { label: 'Completed', color: 'bg-purple-100 text-purple-600', icon: CheckCircle },
};

const ProjectProposal = () => {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        justification: '',
        duration_days: 30,
        deadline: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setLoadingProjects(true);
            const [projRes, userRes] = await Promise.all([
                projectService.getProjects({ page_size: 50 }),
                cafeteriaService.getUserDirectory({ page_size: 100 })
            ]);
            setProjects(projRes?.data ?? []);
            setUsers(userRes?.data ?? []);
        } catch {
            toast.error('Failed to load data.');
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const [selectedMembers, setSelectedMembers] = useState([]);

    const toggleMember = (userCode) => {
        if (selectedMembers.includes(userCode)) {
            setSelectedMembers(prev => prev.filter(code => code !== userCode));
        } else {
            setSelectedMembers(prev => [...prev, userCode]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || form.description.trim().length < 10) {
            toast.error('Title required. Description must be at least 10 chars.');
            return;
        }
        try {
            setSubmitting(true);
            // Create project (status: draft)
            const created = await projectService.createProject({
                title: form.title,
                description: form.description,
                justification: form.justification || null,
                duration_days: Number(form.duration_days) || 30,
                start_date: new Date().toISOString().split('T')[0],
                members: selectedMembers.map(code => ({ user_code: code, role: 'member' }))
            });
            const projectId = created?.data?.id;
            if (projectId) {
                // Submit for approval
                await projectService.submitProject(projectId);
                toast.success('Project proposal submitted for approval!');
            } else {
                toast.success('Project created!');
            }
            setForm({ title: '', description: '', justification: '', duration_days: 30, deadline: '' });
            setSelectedMembers([]);
            fetchData();
        } catch (err) {
            const msg = err?.response?.data?.detail || 'Failed to submit proposal.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                    PROJECT <span className="text-[#FFB012]">PROPOSAL</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Request New Projects & Monitor Team Initiatives
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-8">
                {/* Create Project Form */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
                    <h3 className="text-lg font-bold text-[#1e3a8a] mb-6 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-[#FFB012]" />
                        PROPOSE NEW INITIATIVE
                    </h3>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">PROJECT TITLE *</label>
                            <input
                                type="text"
                                required
                                value={form.title}
                                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                placeholder="e.g. Q1 Marketing Campaign"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">DESCRIPTION *</label>
                            <textarea
                                rows="3"
                                required
                                value={form.description}
                                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all resize-none"
                                placeholder="Outline project goals and scope..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">JUSTIFICATION</label>
                            <textarea
                                rows="2"
                                value={form.justification}
                                onChange={(e) => setForm(f => ({ ...f, justification: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all resize-none"
                                placeholder="Why is this project needed?"
                            />
                        </div>

                        {/* Team Members Selection */}
                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">TEAM MEMBERS</label>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                {users.length > 0 ? (
                                    users.map(u => (
                                        <div key={u.user_code} className="flex items-center gap-2 mb-2 last:mb-0">
                                            <input
                                                type="checkbox"
                                                id={`user-${u.user_code}`}
                                                checked={selectedMembers.includes(u.user_code)}
                                                onChange={() => toggleMember(u.user_code)}
                                                className="rounded border-slate-300 text-[#1e3a8a] focus:ring-[#1e3a8a]"
                                            />
                                            <label htmlFor={`user-${u.user_code}`} className="text-sm text-slate-700 cursor-pointer select-none truncate">
                                                {u.first_name} {u.last_name} <span className="text-slate-400 text-xs">({u.user_code})</span>
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-slate-400 italic">No users available</div>
                                )}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selectedMembers.map(code => {
                                    const u = users.find(u => u.user_code === code);
                                    if (!u) return null;
                                    return (
                                        <span key={code} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                                            {u.first_name} {u.last_name}
                                            <button
                                                type="button"
                                                onClick={() => toggleMember(code)}
                                                className="hover:text-blue-900"
                                            >
                                                <XCircle className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">DURATION (DAYS)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.duration_days}
                                    onChange={(e) => setForm(f => ({ ...f, duration_days: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">DEADLINE</label>
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-[#1e3a8a] text-white py-3.5 rounded-xl text-sm font-bold tracking-wider hover:bg-[#2c4a96] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 mt-4 disabled:opacity-60"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {submitting ? 'SUBMITTING...' : 'SUBMIT PROPOSAL'}
                        </button>
                    </form>
                </div>

                {/* Project List */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-[#1e3a8a] tracking-widest flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#FFB012]" />
                        MY PROPOSALS
                    </h3>
                    {loadingProjects ? (
                        <div className="bg-white rounded-2xl p-8 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                        </div>
                    ) : projects.length > 0 ? (
                        projects.map((p) => {
                            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                            const Icon = cfg.icon;
                            return (
                                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-[#1e3a8a] text-sm">{p.title}</div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.65rem] font-bold tracking-wide ${cfg.color}`}>
                                            <Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#8892b0] mb-3 line-clamp-2">{p.description}</p>
                                    <div className="flex items-center gap-4 text-[0.65rem] text-[#8892b0] font-medium">
                                        <span>Code: <span className="font-bold text-[#1e3a8a]">{p.project_code}</span></span>
                                        <span>Duration: <span className="font-bold text-[#1e3a8a]">{p.duration_days}d</span></span>
                                        {p.end_date && <span>Due: <span className="font-bold text-[#1e3a8a]">{formatDate(p.end_date)}</span></span>}
                                    </div>
                                    {p.status === 'rejected' && p.rejection_reason && (
                                        <div className="mt-3 text-xs bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                            <div>
                                                <span className="font-bold block mb-0.5">Rejection Reason:</span>
                                                {p.rejection_reason}
                                            </div>
                                        </div>
                                    )}
                                    {p.member_count > 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-500">
                                            <span className="font-bold">{p.member_count}</span> members assigned
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[200px]">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Briefcase className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="text-[#1e3a8a] font-bold mb-1">No Active Proposals</h4>
                            <p className="text-sm text-[#8892b0]">Submitted project proposals will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectProposal;
