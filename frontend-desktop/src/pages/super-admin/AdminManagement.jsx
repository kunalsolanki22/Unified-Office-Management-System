import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Mail, Search } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

const AdminManagement = () => {
    const { user } = useAuth();
    // Allow modification only for Super Admin and Admin roles
    const canModify = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role);

    const [showForm, setShowForm] = useState(false);
    const [admins, setAdmins] = useState([
        { id: 1, name: 'Sarah Miller', date: 'JAN 12, 2026', role: 'REGIONAL ADMIN', email: 's.miller@cygnet.one', avatarColor: 'bg-blue-800', initial: 'S' },
        { id: 2, name: 'David Chen', date: 'FEB 05, 2026', role: 'INFRASTRUCTURE LEAD', email: 'd.chen@cygnet.one', avatarColor: 'bg-indigo-600', roleColor: 'bg-indigo-50 text-indigo-700', initial: 'D' },
        { id: 3, name: 'Elena Vance', date: 'DEC 22, 2025', role: 'SECURITY ADMIN', email: 'e.vance@cygnet.one', avatarColor: 'bg-orange-600', roleColor: 'bg-emerald-50 text-emerald-700', initial: 'E' },
    ]);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: '', date: new Date().toLocaleDateString() });
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddAdmin = () => {
        if (newAdmin.name && newAdmin.email && newAdmin.role) {
            setAdmins([
                ...admins,
                {
                    id: Date.now(),
                    ...newAdmin,
                    initial: newAdmin.name[0].toUpperCase(),
                    avatarColor: 'bg-slate-700'
                }
            ]);
            setNewAdmin({ name: '', email: '', role: '', date: new Date().toLocaleDateString() });
            setShowForm(false);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Revoke admin privileges?')) {
            setAdmins(admins.filter(a => a.id !== id));
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        ADMIN <span className="text-[#f9b012]">MASTER REGISTRY</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Provision and Revoke Command-Level Authorities
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm w-[250px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            className="ml-3 bg-transparent border-none outline-none text-xs font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {canModify && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-[#1a367c] text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 h-full"
                        >
                            <Plus className="w-4 h-4" /> ADD ADMIN
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && canModify && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">PROVISION NEW ADMINISTRATOR</h3>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">FULL NAME</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sarah Miller"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.name}
                                    onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">EMAIL ADDRESS</label>
                                <input
                                    type="email"
                                    placeholder="e.g. s.miller@cygnet.one"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.email}
                                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">INITIAL ROLE</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Regional Admin"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.role}
                                    onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">ASSIGNMENT DATE</label>
                                <input
                                    type="text"
                                    value={newAdmin.date}
                                    readOnly
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#8892b0] font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddAdmin}
                                className="px-6 py-3 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10"
                            >
                                + CREATE ADMIN
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
                <div className={`grid ${canModify ? 'grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr]' : 'grid-cols-[0.5fr_2fr_2fr_2fr]'} pb-4 border-b border-slate-100 mb-4 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest`}>
                    <div></div>
                    <div>COMMAND NODE</div>
                    <div>AUTH PROTOCOL</div>
                    <div>ACCESS LINK</div>
                    {canModify && <div></div>}
                </div>

                <div className="space-y-1">
                    {filteredAdmins.length > 0 ? (
                        filteredAdmins.map((admin) => (
                            <motion.div
                                key={admin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`grid ${canModify ? 'grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr]' : 'grid-cols-[0.5fr_2fr_2fr_2fr]'} items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors group`}
                            >
                                <div>
                                    <div className={`w-9 h-9 ${admin.avatarColor} text-white rounded-lg flex items-center justify-center font-bold shadow-sm`}>
                                        {admin.initial}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c]">{admin.name}</div>
                                    <div className="text-[0.65rem] text-[#8892b0] font-medium mt-0.5 tracking-wide">ASSIGNED: {admin.date}</div>
                                </div>
                                <div>
                                    <span className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide ${admin.roleColor || 'bg-blue-50 text-blue-800'}`}>
                                        {admin.role.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#555] font-medium">
                                    <Mail className="w-3.5 h-3.5 text-[#b0b0b0]" />
                                    {admin.email}
                                </div>
                                {canModify && (
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin.id)}
                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                            No matching records found.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AdminManagement;
