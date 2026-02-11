import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Phone, Edit2, Trash2, Plus, UserCheck } from 'lucide-react';

const UserDirectory = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [entityType, setEntityType] = useState('manager');

    const employees = [
        { id: 'CYG-M-001', name: 'Sarah Miller', role: 'CAFETERIA OPS', email: 's.miller@cygnet.one', phone: '+91 98765 43210', joined: 'JAN 2026', type: 'manager', avatarColor: 'bg-[#1a4d8c]' },
        { id: 'CYG-M-004', name: 'David Chen', role: 'INFRASTRUCTURE', email: 'd.chen@cygnet.one', phone: '+91 91234 56789', joined: 'FEB 2026', type: 'manager', avatarColor: 'bg-[#d35400]' },
        { id: 'CYG-E-092', name: 'Michael Ross', role: 'Mgr: Sarah Miller', email: 'm.ross@cygnet.one', phone: '+91 99887 76655', joined: 'FEB 2026', type: 'employee', avatarColor: 'bg-[#eaa300]' },
    ];

    const filteredEmployees = activeTab === 'all'
        ? employees
        : employees.filter(emp => emp.id === 'CYG-M-001' || emp.id === 'CYG-M-004'); // Mock filter for "My Team"

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] flex items-center gap-2">
                        USER DIRECTORY <span className="text-[#f9b012]">LIFECYCLE MANAGEMENT</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium mt-1 uppercase tracking-wide">
                        Onboard, Modify, and Offboard Organizational Talent
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#1a367c] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    NEW PROVISION
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b-2 border-slate-100 mb-8">
                {['all', 'team'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 relative ${activeTab === tab ? 'text-[#1a367c]' : 'text-[#8892b0] hover:text-[#1a367c]'
                            }`}
                    >
                        {tab === 'all' ? 'ALL EMPLOYEES' : 'MY TEAM'}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-[#f9b012]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#f9b012] mb-8">
                            <h3 className="text-sm font-bold text-[#1a367c] uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">
                                Onboarding Workflow
                            </h3>

                            <div className="flex gap-8 mb-6">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${entityType === 'manager' ? 'border-[#1a367c]' : 'border-slate-300'}`}>
                                        {entityType === 'manager' && <div className="w-2.5 h-2.5 bg-[#1a367c] rounded-full" />}
                                    </div>
                                    <input type="radio" name="entityType" className="hidden" checked={entityType === 'manager'} onChange={() => setEntityType('manager')} />
                                    <span className={`text-sm font-bold ${entityType === 'manager' ? 'text-[#1a367c]' : 'text-[#8892b0]'}`}>Manager Account</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${entityType === 'employee' ? 'border-[#1a367c]' : 'border-slate-300'}`}>
                                        {entityType === 'employee' && <div className="w-2.5 h-2.5 bg-[#1a367c] rounded-full" />}
                                    </div>
                                    <input type="radio" name="entityType" className="hidden" checked={entityType === 'employee'} onChange={() => setEntityType('employee')} />
                                    <span className={`text-sm font-bold ${entityType === 'employee' ? 'text-[#1a367c]' : 'text-[#8892b0]'}`}>Employee Account</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-[#8892b0] mb-2 uppercase tracking-wide">Full Name</label>
                                    <input type="text" className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm text-[#1a367c] font-medium outline-none focus:ring-2 focus:ring-[#1a367c]/20 transition-all" placeholder="e.g. John Smith" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8892b0] mb-2 uppercase tracking-wide">Employee ID</label>
                                    <input type="text" className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm text-[#1a367c] font-medium outline-none focus:ring-2 focus:ring-[#1a367c]/20 transition-all" placeholder="e.g. CYG-2026-889" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8892b0] mb-2 uppercase tracking-wide">Personal Email</label>
                                    <input type="email" className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm text-[#1a367c] font-medium outline-none focus:ring-2 focus:ring-[#1a367c]/20 transition-all" placeholder="e.g. j.smith@gmail.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8892b0] mb-2 uppercase tracking-wide">Contact Number</label>
                                    <input type="tel" className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm text-[#1a367c] font-medium outline-none focus:ring-2 focus:ring-[#1a367c]/20 transition-all" placeholder="e.g. +91 98765 43210" />
                                </div>
                            </div>

                            {entityType === 'manager' ? (
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-[#8892b0] mb-2 uppercase tracking-wide">Domain Responsibility</label>
                                    <select className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm text-[#1a367c] font-medium outline-none focus:ring-2 focus:ring-[#1a367c]/20 transition-all">
                                        <option>Cafeteria Operations</option>
                                        <option>Parking Management</option>
                                        <option>Desk Allocation</option>
                                        <option>Conference Scheduling</option>
                                        <option>Hardware Registry</option>
                                    </select>
                                </div>
                            ) : (
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-[#8892b0] mb-2 uppercase tracking-wide">Assigned Manager</label>
                                    <select className="w-full bg-[#f8f9fa] border-none rounded-lg px-4 py-3 text-sm text-[#1a367c] font-medium outline-none focus:ring-2 focus:ring-[#1a367c]/20 transition-all">
                                        <option>Select Manager...</option>
                                        <option>Sarah Miller (Regional)</option>
                                        <option>David Chen (Infrastructure)</option>
                                        <option>Elena Vance (Security)</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-6 py-3 rounded-lg text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button className="bg-[#1a367c] text-white px-6 py-3 rounded-lg text-xs font-bold hover:shadow-lg transition-all">
                                    INITIATE ONBOARDING
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] px-8 py-5 border-b border-slate-100 bg-[#f8f9fa]">
                    <div className="text-[0.65rem] font-bold text-[#8892b0] tracking-widest"></div>
                    <div className="text-[0.65rem] font-bold text-[#8892b0] tracking-widest">IDENTITY NODE</div>
                    <div className="text-[0.65rem] font-bold text-[#8892b0] tracking-widest">ROLE / ASSIGNMENT</div>
                    <div className="text-[0.65rem] font-bold text-[#8892b0] tracking-widest">CONTACT PROTOCOL</div>
                    <div className="text-[0.65rem] font-bold text-[#8892b0] tracking-widest"></div>
                </div>

                <div className="divide-y divide-slate-50">
                    {filteredEmployees.map((emp) => (
                        <div key={emp.id} className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] px-8 py-6 items-center hover:bg-slate-50 transition-colors group">
                            <div>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm ${emp.avatarColor}`}>
                                    {emp.name.charAt(0)}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-[#1a367c]">{emp.name}</div>
                                <div className="text-[0.65rem] font-semibold text-[#8892b0] mt-1 tracking-wide">ID: {emp.id} • JOINED: {emp.joined}</div>
                            </div>
                            <div>
                                <span className={`text-[0.65rem] font-bold px-3 py-1 rounded-full tracking-wide ${emp.type === 'manager'
                                        ? 'bg-orange-50 text-[#d35400]'
                                        : 'bg-green-50 text-[#166534]'
                                    }`}>
                                    {emp.role}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[#555] font-medium">
                                <Phone className="w-3.5 h-3.5 text-[#8892b0]" />
                                {emp.phone}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserDirectory;
