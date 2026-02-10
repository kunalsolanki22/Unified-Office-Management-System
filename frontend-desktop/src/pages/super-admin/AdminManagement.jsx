import { useState } from 'react';
import { Plus, Search, Trash2, Shield, AlertCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../utils/cn';

const initialAdmins = [
    { id: 1, name: 'Sarah Miller', email: 's.miller@cygnet.one', role: 'Regional Admin', assigned: 'Jan 12, 2026', avatar: 'S', color: 'bg-blue-900' },
    { id: 2, name: 'David Chen', email: 'd.chen@cygnet.one', role: 'Infrastructure Lead', assigned: 'Feb 05, 2026', avatar: 'D', color: 'bg-blue-900' },
    { id: 3, name: 'Elena Vance', email: 'e.vance@cygnet.one', role: 'Security Admin', assigned: 'Dec 22, 2025', avatar: 'E', color: 'bg-blue-900' },
    { id: 4, name: 'Marcus Bell', email: 'm.bell@cygnet.one', role: 'Food Admin', assigned: 'Nov 15, 2025', avatar: 'M', color: 'bg-blue-900' },
    { id: 5, name: 'Priya Verma', email: 'p.verma@cygnet.one', role: 'Desk Admin', assigned: 'Oct 30, 2025', avatar: 'P', color: 'bg-blue-900' },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const AdminManagement = () => {
    const [admins, setAdmins] = useState(initialAdmins);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
            >
                <div>
                    <h1 className="text-3xl font-bold text-blue-900 uppercase tracking-tight">
                        Admin <span className="text-orange-500">Master Registry</span>
                    </h1>
                    <p className="text-slate-400 mt-1 text-xs font-bold uppercase tracking-widest">Provision and revoke command-level authorities</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-900 hover:bg-blue-800 text-white shadow-xl shadow-blue-900/20 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Provision Admin
                </Button>
            </motion.div>

            <Card className="p-0 overflow-visible border-none shadow-none bg-transparent">
                <div className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 p-8 min-h-[500px]">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="relative w-full max-w-[300px]">
                            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Command Node..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-slate-50 text-xs font-bold text-slate-700 placeholder:text-slate-400 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse mt-4">
                        <thead className="border-b border-transparent">
                            <tr>
                                <th className="px-6 py-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Command Node</th>
                                <th className="px-6 py-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Auth Protocol</th>
                                <th className="px-6 py-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em]">Access Link</th>
                                <th className="px-6 py-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.15em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="divide-y divide-slate-50"
                        >
                            {filteredAdmins.map((admin) => (
                                <motion.tr
                                    key={admin.id}
                                    variants={item}
                                    className="group hover:bg-slate-50/30 transition-colors"
                                >
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0", admin.color)}>
                                                {admin.avatar}
                                            </div>
                                            <div>
                                                <div className="font-bold text-blue-900 text-sm mb-1">{admin.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Assigned: {admin.assigned}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 text-blue-900 text-[10px] font-bold uppercase tracking-wider">
                                            {admin.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
                                            <div className="text-slate-400">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500">{admin.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="flex items-center justify-end">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New Admin">
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">New admins will receive an encrypted onboarding link. 2FA setup is mandatory for Command Node access.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Full Name</label>
                            <Input placeholder="e.g. Jonathan Ive" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Address</label>
                            <Input placeholder="e.g. j.ive@cygnet.one" className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Role Authority</label>
                            <div className="relative">
                                <select className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none">
                                    <option>Regional Admin</option>
                                    <option>Infrastructure Lead</option>
                                    <option>Security Admin</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-4 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl hover:bg-slate-100">Cancel</Button>
                        <Button className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-lg shadow-blue-900/20">Commit to Registry</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminManagement;
