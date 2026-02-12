import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, User, Briefcase, Mail, Phone, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

const UserDirectory = () => {
    const [activeTab, setActiveTab] = useState('all-employees');
    const [showForm, setShowForm] = useState(false);
    const [entityType, setEntityType] = useState('manager');
    const { user } = useAuth();
    const isReadOnly = user?.role === ROLES.ATTENDANCE_MANAGER;

    const handleOnboard = () => {
        toast.success(`Onboarding initiated for ${entityType} account.`);
        setShowForm(false);
    };

    const handleEdit = (name) => toast.info(`Editing ${name}...`);
    const handleDelete = (name) => {
        if (confirm(`Remove ${name}?`)) toast.error(`${name} removed.`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-[#1a367c]">
                    USER DIRECTORY <span className="text-[#f9b012]">LIFECYCLE MANAGEMENT</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#8892b0] font-medium">
                    Onboard, Modify, and Offboard Organizational Talent
                </p>
            </div>

            <div className="flex border-b-2 border-slate-100 mb-6">
                {['all-employees', 'my-team'].map((tab) => (
                    <div
                        key={tab}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all mb-[-2px]
                            ${activeTab === tab
                                ? 'text-[#1a367c] border-[#f9b012]'
                                : 'text-[#8892b0] border-transparent hover:text-[#1a367c]'
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.replace('-', ' ')}
                    </div>
                ))}
            </div>

            <div className="flex justify-end mb-5">
                {!isReadOnly && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-[#1a367c] hover:bg-[#2c4a96] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest shadow-lg shadow-[#1a367c]/30 transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        NEW PROVISION
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl p-8 shadow-sm border border-[#f9b012] mb-6 overflow-hidden"
                    >
                        <h3 className="text-[1.1rem] font-bold text-[#1a367c] mb-6 flex items-center gap-2">
                            ONBOARDING WORKFLOW
                        </h3>

                        <div className="flex gap-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entityType"
                                    className="accent-[#1a367c]"
                                    checked={entityType === 'manager'}
                                    onChange={() => setEntityType('manager')}
                                />
                                <span className="text-sm font-semibold text-[#1a367c]">Manager Account</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entityType"
                                    className="accent-[#1a367c]"
                                    checked={entityType === 'employee'}
                                    onChange={() => setEntityType('employee')}
                                />
                                <span className="text-sm font-semibold text-[#1a367c]">Employee Account</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div className="space-y-2">
                                <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">FULL NAME</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" className="w-full bg-slate-50 border-none rounded-lg py-3 pl-10 pr-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20" placeholder="e.g. John Smith" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">EMPLOYEE ID</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" className="w-full bg-slate-50 border-none rounded-lg py-3 pl-10 pr-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20" placeholder="e.g. CYG-2026-889" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                            <div className="space-y-2">
                                <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">PERSONAL EMAIL ADDRESS</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="email" className="w-full bg-slate-50 border-none rounded-lg py-3 pl-10 pr-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20" placeholder="e.g. j.smith@gmail.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">CONTACT NUMBER</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="tel" className="w-full bg-slate-50 border-none rounded-lg py-3 pl-10 pr-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20" placeholder="e.g. +91 98765 43210" />
                                </div>
                            </div>
                        </div>

                        {entityType === 'manager' && (
                            <div className="space-y-2">
                                <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">DOMAIN RESPONSIBILITY</label>
                                <select className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20">
                                    <option>Cafeteria Operations</option>
                                    <option>Parking Management</option>
                                    <option>Desk Allocation</option>
                                    <option>Conference Scheduling</option>
                                    <option>Hardware Registry</option>
                                </select>
                            </div>
                        )}

                        {entityType === 'employee' && (
                            <div className="space-y-2">
                                <label className="text-[0.7rem] text-[#8892b0] font-bold uppercase tracking-wider block">ASSIGNED MANAGER</label>
                                <select className="w-full bg-slate-50 border-none rounded-lg py-3 px-4 text-sm text-[#1a367c] focus:ring-2 focus:ring-[#1a367c]/20">
                                    <option>Select Manager...</option>
                                    <option>Sarah Miller (Regional)</option>
                                    <option>David Chen (Infrastructure)</option>
                                    <option>Elena Vance (Security)</option>
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                                onClick={() => setShowForm(false)}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleOnboard}
                                className="bg-[#1a367c] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide hover:bg-[#2c4a96] transition-colors shadow-lg shadow-[#1a367c]/20"
                            >
                                INITIATE ONBOARDING
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] pb-4 border-b border-slate-100 text-[0.7rem] font-bold text-[#8892b0] tracking-widest uppercase">
                    <div></div>
                    <div>IDENTITY NODE</div>
                    <div>ROLE / ASSIGNMENT</div>
                    <div>CONTACT PROTOCOL</div>
                    <div></div>
                </div>

                {activeTab === 'all-employees' && (
                    <div className="mt-2">
                        <div className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] items-center py-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <div className="w-9 h-9 bg-[#1a4d8c] text-white rounded-lg flex items-center justify-center font-semibold text-sm">S</div>
                            <div>
                                <div className="font-semibold text-[#1a367c] text-sm">Sarah Miller</div>
                                <div className="text-[0.7rem] text-[#8892b0] mt-0.5">ID: CYG-M-001 • JOINED: JAN 2026</div>
                            </div>
                            <div>
                                <span className="inline-block px-3 py-1.5 rounded-full text-[0.7rem] font-semibold bg-orange-50 text-orange-700">CAFETERIA OPS</span>
                            </div>
                            <div className="text-[0.85rem] text-slate-600 flex items-center gap-2">
                                +91 98765 43210
                            </div>
                            <div className="flex items-center">
                                {!isReadOnly && (
                                    <>
                                        <button
                                            onClick={() => handleEdit('Sarah Miller')}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center mr-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('Sarah Miller')}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {/* More rows... */}
                    </div>
                )}

                {activeTab === 'my-team' && (
                    <div className="mt-2">
                        <div className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] items-center py-5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <div className="w-9 h-9 bg-[#f9b012] text-white rounded-lg flex items-center justify-center font-semibold text-sm">D</div>
                            <div>
                                <div className="font-semibold text-[#1a367c] text-sm">David Chen</div>
                                <div className="text-[0.7rem] text-[#8892b0] mt-0.5">ID: CYG-M-004 • JOINED: FEB 2026</div>
                            </div>
                            <div>
                                <span className="inline-block px-3 py-1.5 rounded-full text-[0.7rem] font-semibold bg-orange-50 text-orange-700">INFRASTRUCTURE</span>
                            </div>
                            <div className="text-[0.85rem] text-slate-600 flex items-center gap-2">
                                +91 91234 56789
                            </div>
                            <div className="flex items-center">
                                {!isReadOnly && (
                                    <>
                                        <button
                                            onClick={() => handleEdit('David Chen')}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center mr-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete('David Chen')}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDirectory;
