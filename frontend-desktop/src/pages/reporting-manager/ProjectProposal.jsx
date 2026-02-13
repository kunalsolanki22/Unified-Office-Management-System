import React from 'react';
import {
    Briefcase,
    Send,
    PlusCircle
} from 'lucide-react';

const ProjectProposal = () => {
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
                    <form className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">PROJECT TITLE</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                                placeholder="e.g. Q1 Marketing Campaign"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">DESCRIPTION</label>
                            <textarea
                                rows="4"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all resize-none"
                                placeholder="Outline project goals and scope..."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">ASSIGN TEAM MEMBERS</label>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                {['Sarah Miller', 'David Chen', 'Elena Vance', 'Marcus Bell', 'Priya Verma', 'James Carter'].map((name, index) => (
                                    <label key={index} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${index === 0 ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                                        <input type="checkbox" defaultChecked={index === 0} className="w-4 h-4 text-[#1e3a8a] rounded border-slate-300 focus:ring-[#1e3a8a]" />
                                        <span className="text-sm font-medium text-[#1e3a8a]">{name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#8892b0] tracking-wider mb-2">DEADLINE</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-[#1e3a8a] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
                            />
                        </div>

                        <button type="button" className="w-full bg-[#1e3a8a] text-white py-3.5 rounded-xl text-sm font-bold tracking-wider hover:bg-[#2c4a96] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 mt-4">
                            <Send className="w-4 h-4" />
                            SUBMIT PROPOSAL
                        </button>
                    </form>
                </div>

                {/* Project List */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-[#1e3a8a] font-bold mb-1">No Active Proposals</h4>
                        <p className="text-sm text-[#8892b0]">Submitted project proposals will appear here for tracking.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectProposal;
