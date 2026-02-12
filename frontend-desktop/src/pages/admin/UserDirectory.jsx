import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Mail, ChevronDown, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const UserDirectory = () => {
    const [activeTab, setActiveTab] = useState('managers');
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [entityType, setEntityType] = useState('manager'); // newUser removed

    const [managers, setManagers] = useState([
        { id: 1, name: 'Sarah Miller', joined: 'JAN 2026', role: 'CAFETERIA OPS', email: 's.miller@cygnet.one', phone: '+91 98765 43210', initial: 'S', color: 'bg-blue-800' },
        { id: 2, name: 'David Chen', joined: 'FEB 2026', role: 'INFRASTRUCTURE', email: 'd.chen@cygnet.one', phone: '+91 91234 56789', initial: 'D', color: 'bg-slate-700' },
    ]);

    const [employees, setEmployees] = useState([
        { id: 1, name: 'Michael Ross', joined: 'FEB 2026', manager: 'Sarah Miller', email: 'm.ross@cygnet.one', phone: '+91 99887 76655', initial: 'M', color: 'bg-orange-600' },
    ]);

    const handleAddUser = () => {
        // Logic to add user woud/could go here
        toast.success('Onboarding Initiated Successfully');
        setShowForm(false);
    };

    const handleEdit = (user) => {
        toast.info(`Editing User: ${user.name}`);
    };

    const handleDelete = (id, type) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            if (type === 'manager') {
                setManagers(prev => prev.filter(m => m.id !== id));
            } else {
                setEmployees(prev => prev.filter(e => e.id !== id));
            }
            toast.error("User Removed from Directory");
        }
    };

    const filteredData = activeTab === 'managers'
        ? managers.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : employees.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.manager.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* ... (Header section remains same) */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                    USER DIRECTORY <span className="text-[#f9b012]">LIFECYCLE MANAGEMENT</span>
                </h1>
                <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                    Onboard, Modify, and Offboard Organizational Talent
                </p>
            </div>

            {/* Tabs & Action */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-0 gap-4">
                <div className="flex gap-8">
                    {['managers', 'employees'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 border-b-2 
                                ${activeTab === tab
                                    ? 'text-[#1a367c] border-[#f9b012]'
                                    : 'text-[#8892b0] border-transparent hover:text-[#1a367c]'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 mb-2">
                    {/* Search Bar */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm w-[250px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search directory..."
                            className="ml-3 bg-transparent border-none outline-none text-xs font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-[#1a367c] text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> NEW PROVISION
                    </button>
                </div>
            </div>

            {/* Onboarding Form (remains same) */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-[#f9b012] overflow-hidden"
                    >
                        {/* ... (keep form content exactly as is) ... */}
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide border-b border-slate-100 pb-2">ONBOARDING WORKFLOW</h3>

                        {/* Entity Selector */}
                        <div className="flex gap-6 mb-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entityType"
                                    checked={entityType === 'manager'}
                                    onChange={() => setEntityType('manager')}
                                    className="accent-[#1a367c]"
                                />
                                <span className="text-sm font-bold text-[#1a367c]">Manager Account</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entityType"
                                    checked={entityType === 'employee'}
                                    onChange={() => setEntityType('employee')}
                                    className="accent-[#1a367c]"
                                />
                                <span className="text-sm font-bold text-[#1a367c]">Employee Account</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">FULL NAME</label>
                                <input type="text" placeholder="e.g. John Smith" className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">EMPLOYEE ID</label>
                                <input type="text" placeholder="e.g. CYG-2026-889" className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">PERSONAL EMAIL ADDRESS</label>
                                <input type="email" placeholder="e.g. j.smith@gmail.com" className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">CONTACT NUMBER</label>
                                <input type="tel" placeholder="e.g. +91 98765 43210" className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium" />
                            </div>

                            {entityType === 'manager' ? (
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">DOMAIN RESPONSIBILITY</label>
                                    <div className="relative">
                                        <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium appearance-none">
                                            <option>Cafeteria Operations</option>
                                            <option>Parking Management</option>
                                            <option>Desk Allocation</option>
                                            <option>Conference Scheduling</option>
                                            <option>Hardware Registry</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892b0] pointer-events-none" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">ASSIGNED MANAGER</label>
                                    <div className="relative">
                                        <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium appearance-none">
                                            <option>Select Manager...</option>
                                            <option>Sarah Miller (Regional)</option>
                                            <option>David Chen (Infrastructure)</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892b0] pointer-events-none" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddUser}
                                className="px-6 py-3 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10"
                            >
                                INITIATE ONBOARDING
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Table */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
                <div className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] pb-4 border-b border-slate-100 mb-4 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div></div>
                    <div>IDENTITY NODE</div>
                    <div>ROLE / ASSIGNMENT</div>
                    <div>CONTACT PROTOCOL</div>
                    <div></div>
                </div>

                <div className="space-y-1">
                    {filteredData.length > 0 ? (
                        filteredData.map((user) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-[0.5fr_2fr_2fr_2fr_0.5fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors group border-b border-slate-50 last:border-0"
                            >
                                <div>
                                    <div className={`w-9 h-9 ${user.color} text-white rounded-lg flex items-center justify-center font-bold shadow-sm`}>
                                        {user.initial}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c]">{user.name}</div>
                                    <div className="text-[0.65rem] text-[#8892b0] font-medium mt-0.5 tracking-wide">JOINED: {user.joined}</div>
                                </div>
                                <div>
                                    <span className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide uppercase ${activeTab === 'managers' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                                        {activeTab === 'managers' ? user.role : `Mgr: ${user.manager}`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[#555] font-medium">
                                    <Mail className="w-3.5 h-3.5 text-[#b0b0b0]" />
                                    {user.phone}
                                </div>
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id, activeTab === 'managers' ? 'manager' : 'employee')}
                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
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

export default UserDirectory;
