import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Mail, Search } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { userService } from '../../services/userService';

const AdminManagement = () => {
    const { user } = useAuth();
    // Allow modification only for Super Admin and Admin roles
    const canModify = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user?.role);

    const [showForm, setShowForm] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newAdmin, setNewAdmin] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'ADMIN',
        phone: '',
        vehicle_number: '',
        vehicle_type: 'none'
    });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers({ role: ROLES.ADMIN });
            const data = response.data || response;
            // Format for display
            const formattedAdmins = Array.isArray(data) ? data.map(admin => ({
                id: admin.id,
                name: `${admin.first_name} ${admin.last_name}`,
                email: admin.email,
                role: admin.role,
                date: new Date(admin.created_at).toLocaleDateString(),
                initial: admin.first_name ? admin.first_name[0].toUpperCase() : 'A',
                avatarColor: 'bg-blue-800', // You could randomize this
                roleColor: 'bg-blue-50 text-blue-800'
            })) : [];
            setAdmins(formattedAdmins);
        } catch (error) {
            console.error("Failed to fetch admins", error);
            toast.error("Failed to load admins");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async () => {
        try {
            if (!newAdmin.first_name || !newAdmin.last_name || !newAdmin.password) {
                toast.error("Please fill required fields (Name, Password)");
                return;
            }

            // Backend requires first_name, last_name, vehicle info
            const payload = {
                ...newAdmin,
                vehicle_number: newAdmin.vehicle_number || "XX-00-XX-0000", // Default if skipped, though user should provide
                vehicle_type: newAdmin.vehicle_type || "none"
            };

            await userService.createUser(payload);
            toast.success("Admin created successfully!");
            setShowForm(false);
            setNewAdmin({
                first_name: '',
                last_name: '',
                email: '',
                password: '',
                role: 'ADMIN',
                phone: '',
                vehicle_number: '',
                vehicle_type: 'none'
            });
            fetchAdmins(); // Refresh data
        } catch (error) {
            console.error("Create admin error", error);
            const msg = error.response?.data?.detail || "Failed to create admin";
            toast.error(msg);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Revoke admin privileges?')) {
            setAdmins(admins.filter(a => a.id !== id));
            toast.info('Admin privileges revoked.');
        }
    };

    const handleEdit = (admin) => {
        toast.info(`Editing ${admin.name} - Feature coming soon!`);
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
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">FIRST NAME</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sarah"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.first_name}
                                    onChange={e => setNewAdmin({ ...newAdmin, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">LAST NAME</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Miller"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.last_name}
                                    onChange={e => setNewAdmin({ ...newAdmin, last_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">EMAIL ADDRESS (OPTIONAL)</label>
                                <input
                                    type="email"
                                    placeholder="Auto-generated if empty"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.email}
                                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">PASSWORD</label>
                                <input
                                    type="password"
                                    placeholder="Min 8 chars"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.password}
                                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">PHONE</label>
                                <input
                                    type="text"
                                    placeholder="10 digits"
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.phone}
                                    onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">ROLE</label>
                                <input
                                    type="text"
                                    value="ADMIN"
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
                                        <button
                                            onClick={() => handleEdit(admin)}
                                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                        >
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
