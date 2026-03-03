import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Mail, Search, X, UserCheck, UserX, Phone, Car, Shield, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { userService } from '../../services/userService';

const INITIAL_FORM = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'admin',
    phone: '',
    vehicle_number: '',
    vehicle_type: 'car',
    department: '',
};

const InputField = ({ label, type = 'text', placeholder, value, onChange, required, children, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        {children || (
            <input
                type={type}
                placeholder={placeholder}
                className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                value={value}
                onChange={onChange}
            />
        )}
    </div>
);

const AdminManagement = () => {
    const { user } = useAuth();
    const canModify = user?.role?.toLowerCase() === ROLES.SUPER_ADMIN;

    const [showForm, setShowForm] = useState(false);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ ...INITIAL_FORM });
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Edit modal state
    const [editModal, setEditModal] = useState(false);
    const [editAdmin, setEditAdmin] = useState(null);
    const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '', department: '' });
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers({ role: 'admin' });
            const data = response?.data || response?.users || response;
            const list = Array.isArray(data) ? data : [];
            const formattedAdmins = list.map(admin => ({
                id: admin.id,
                user_code: admin.user_code,
                first_name: admin.first_name,
                last_name: admin.last_name,
                name: `${admin.first_name} ${admin.last_name}`,
                email: admin.email,
                phone: admin.phone || '—',
                role: admin.role,
                department: admin.department || '',
                is_active: admin.is_active,
                date: admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—',
                initial: admin.first_name ? admin.first_name[0].toUpperCase() : 'A',
            }));
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
                toast.error("Please fill required fields (First Name, Last Name, Password)");
                return;
            }
            if (newAdmin.password.length < 8) {
                toast.error("Password must be at least 8 characters");
                return;
            }

            setSubmitting(true);

            const payload = {
                first_name: newAdmin.first_name.trim(),
                last_name: newAdmin.last_name.trim(),
                email: newAdmin.email?.trim() || undefined,
                password: newAdmin.password,
                role: 'admin',
                phone: newAdmin.phone?.trim() || undefined,
                vehicle_number: newAdmin.vehicle_number?.trim() || 'GJ-00-AB-0000',
                vehicle_type: newAdmin.vehicle_type || 'car',
                department: newAdmin.department?.trim() || undefined,
            };

            await userService.createUser(payload);
            toast.success("Admin created successfully!");
            setShowForm(false);
            setNewAdmin({ ...INITIAL_FORM });
            setShowPassword(false);
            fetchAdmins();
        } catch (error) {
            console.error("Create admin error", error);
            console.error("Response data:", JSON.stringify(error.response?.data, null, 2));
            const detail = error.response?.data?.detail;
            let msg = "Failed to create admin";
            if (typeof detail === 'string') {
                msg = detail;
            } else if (Array.isArray(detail)) {
                msg = detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
            } else if (detail) {
                msg = JSON.stringify(detail);
            }
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (admin) => {
        if (!confirm(`Are you sure you want to remove admin "${admin.name}"? This will soft-delete the account.`)) return;
        try {
            await userService.deleteUser(admin.id);
            toast.success(`Admin "${admin.name}" removed successfully`);
            fetchAdmins();
        } catch (error) {
            console.error("Delete admin error", error);
            const msg = error.response?.data?.detail || "Failed to remove admin";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    const handleToggleActive = async (admin) => {
        try {
            await userService.toggleActive(admin.id);
            toast.success(`Admin "${admin.name}" ${admin.is_active ? 'deactivated' : 'activated'} successfully`);
            fetchAdmins();
        } catch (error) {
            console.error("Toggle active error", error);
            const msg = error.response?.data?.detail || "Failed to toggle admin status";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    const handleEditOpen = (admin) => {
        setEditAdmin(admin);
        setEditData({
            first_name: admin.first_name,
            last_name: admin.last_name,
            phone: admin.phone === '—' ? '' : admin.phone,
            department: admin.department || '',
        });
        setEditModal(true);
    };

    const handleEditSave = async () => {
        try {
            if (!editData.first_name || !editData.last_name) {
                toast.error("First name and last name are required");
                return;
            }
            setEditSubmitting(true);
            const payload = {};
            if (editData.first_name !== editAdmin.first_name) payload.first_name = editData.first_name.trim();
            if (editData.last_name !== editAdmin.last_name) payload.last_name = editData.last_name.trim();
            if ((editData.phone || '') !== (editAdmin.phone === '—' ? '' : editAdmin.phone)) payload.phone = editData.phone?.trim() || null;
            if ((editData.department || '') !== (editAdmin.department || '')) payload.department = editData.department?.trim() || null;

            if (Object.keys(payload).length === 0) {
                toast.info("No changes detected");
                setEditModal(false);
                return;
            }

            await userService.updateUser(editAdmin.id, payload);
            toast.success(`Admin "${editAdmin.name}" updated successfully`);
            setEditModal(false);
            setEditAdmin(null);
            fetchAdmins();
        } catch (error) {
            console.error("Update admin error", error);
            const msg = error.response?.data?.detail || "Failed to update admin";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setEditSubmitting(false);
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.user_code || '').toLowerCase().includes(searchQuery.toLowerCase())
    );



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
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

                    <button
                        onClick={fetchAdmins}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>

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

            {/* Create Form */}
            <AnimatePresence>
                {showForm && canModify && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">PROVISION NEW ADMINISTRATOR</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            <InputField
                                label="FIRST NAME" required placeholder="e.g. Sarah"
                                value={newAdmin.first_name}
                                onChange={e => setNewAdmin({ ...newAdmin, first_name: e.target.value })}
                            />
                            <InputField
                                label="LAST NAME" required placeholder="e.g. Miller"
                                value={newAdmin.last_name}
                                onChange={e => setNewAdmin({ ...newAdmin, last_name: e.target.value })}
                            />
                            <InputField
                                label="EMAIL ADDRESS (OPTIONAL)" type="email" placeholder="Auto-generated if empty"
                                value={newAdmin.email}
                                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                            />
                            <InputField label="PASSWORD" required placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special">
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special"
                                        className="w-full bg-[#f8f9fa] p-3 pr-10 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                        value={newAdmin.password}
                                        onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </InputField>
                            <InputField
                                label="PHONE" placeholder="10 digits"
                                value={newAdmin.phone}
                                onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                            />
                            <InputField
                                label="DEPARTMENT" placeholder="e.g. Operations"
                                value={newAdmin.department}
                                onChange={e => setNewAdmin({ ...newAdmin, department: e.target.value })}
                            />
                            <InputField
                                label="VEHICLE NUMBER" placeholder="XX-00-XX-0000 (optional)"
                                value={newAdmin.vehicle_number}
                                onChange={e => setNewAdmin({ ...newAdmin, vehicle_number: e.target.value })}
                            />
                            <InputField label="VEHICLE TYPE">
                                <select
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newAdmin.vehicle_type}
                                    onChange={e => setNewAdmin({ ...newAdmin, vehicle_type: e.target.value })}
                                >
                                    <option value="car">Car</option>
                                    <option value="bike">Bike</option>
                                </select>
                            </InputField>
                            <InputField label="ROLE">
                                <input
                                    type="text"
                                    value="ADMIN"
                                    readOnly
                                    className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none text-[#8892b0] font-medium cursor-not-allowed"
                                />
                            </InputField>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowForm(false); setNewAdmin({ ...INITIAL_FORM }); setShowPassword(false); }}
                                className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={handleAddAdmin}
                                disabled={submitting}
                                className="px-6 py-3 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? (
                                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> CREATING...</>
                                ) : (
                                    '+ CREATE ADMIN'
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admin Table */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
                <div className={`grid ${canModify ? 'grid-cols-[0.4fr_2fr_1.2fr_2fr_1fr_1fr]' : 'grid-cols-[0.4fr_2fr_1.2fr_2fr_1fr]'} pb-4 border-b border-slate-100 mb-4 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest`}>
                    <div></div>
                    <div>COMMAND NODE</div>
                    <div>STATUS</div>
                    <div>ACCESS LINK</div>
                    <div>PHONE</div>
                    {canModify && <div className="text-right">ACTIONS</div>}
                </div>

                <div className="space-y-1">
                    {loading ? (
                        <div className="p-8 text-center">
                            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
                            <p className="text-slate-400 text-sm font-medium">Loading admins...</p>
                        </div>
                    ) : filteredAdmins.length > 0 ? (
                        filteredAdmins.map((admin) => (
                            <motion.div
                                key={admin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`grid ${canModify ? 'grid-cols-[0.4fr_2fr_1.2fr_2fr_1fr_1fr]' : 'grid-cols-[0.4fr_2fr_1.2fr_2fr_1fr]'} items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors group`}
                            >
                                {/* Avatar */}
                                <div>
                                    <div className={`w-9 h-9 ${admin.is_active ? 'bg-blue-800' : 'bg-slate-400'} text-white rounded-lg flex items-center justify-center font-bold shadow-sm text-sm`}>
                                        {admin.initial}
                                    </div>
                                </div>

                                {/* Name & Date */}
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c]">{admin.name}</div>
                                    <div className="text-[0.65rem] text-[#8892b0] font-medium mt-0.5 tracking-wide">
                                        {admin.user_code && <span className="mr-2 text-blue-500">{admin.user_code}</span>}
                                        ASSIGNED: {admin.date}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <span className={`px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-wide inline-flex items-center gap-1.5 ${admin.is_active
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-red-50 text-red-600'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        {admin.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>

                                {/* Email */}
                                <div className="flex items-center gap-2 text-sm text-[#555] font-medium truncate">
                                    <Mail className="w-3.5 h-3.5 text-[#b0b0b0] flex-shrink-0" />
                                    <span className="truncate">{admin.email}</span>
                                </div>

                                {/* Phone */}
                                <div className="flex items-center gap-2 text-sm text-[#555] font-medium">
                                    <Phone className="w-3.5 h-3.5 text-[#b0b0b0] flex-shrink-0" />
                                    <span className="truncate">{admin.phone}</span>
                                </div>

                                {/* Actions */}
                                {canModify && (
                                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditOpen(admin)}
                                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            title="Edit Admin"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(admin)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${admin.is_active
                                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                }`}
                                            title={admin.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {admin.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(admin)}
                                            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            title="Remove Admin"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                            {searchQuery ? 'No matching admins found.' : 'No admins created yet. Click "ADD ADMIN" to get started.'}
                        </div>
                    )}
                </div>

                {/* Summary Footer */}
                {!loading && admins.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center px-4">
                        <div className="text-[0.7rem] text-[#8892b0] font-medium tracking-wide">
                            TOTAL: {admins.length} ADMIN{admins.length !== 1 ? 'S' : ''} &nbsp;|&nbsp;
                            <span className="text-emerald-600">{admins.filter(a => a.is_active).length} ACTIVE</span> &nbsp;|&nbsp;
                            <span className="text-red-500">{admins.filter(a => !a.is_active).length} INACTIVE</span>
                        </div>
                        {searchQuery && (
                            <div className="text-[0.7rem] text-blue-500 font-medium">
                                Showing {filteredAdmins.length} of {admins.length}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editModal && editAdmin && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[20px] p-8 shadow-xl w-full max-w-lg mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-[#1a367c] tracking-wide">EDIT ADMINISTRATOR</h3>
                                <button
                                    onClick={() => setEditModal(false)}
                                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-2">
                                    <div className="w-10 h-10 bg-blue-800 text-white rounded-lg flex items-center justify-center font-bold">
                                        {editAdmin.initial}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[#1a367c]">{editAdmin.name}</div>
                                        <div className="text-[0.65rem] text-blue-500 font-medium">{editAdmin.user_code} · {editAdmin.email}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="FIRST NAME" required placeholder="First name"
                                        value={editData.first_name}
                                        onChange={e => setEditData({ ...editData, first_name: e.target.value })}
                                    />
                                    <InputField
                                        label="LAST NAME" required placeholder="Last name"
                                        value={editData.last_name}
                                        onChange={e => setEditData({ ...editData, last_name: e.target.value })}
                                    />
                                </div>
                                <InputField
                                    label="PHONE" placeholder="10 digits"
                                    value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })}
                                />
                                <InputField
                                    label="DEPARTMENT" placeholder="e.g. Operations"
                                    value={editData.department}
                                    onChange={e => setEditData({ ...editData, department: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setEditModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleEditSave}
                                    disabled={editSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {editSubmitting ? (
                                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> SAVING...</>
                                    ) : (
                                        'SAVE CHANGES'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminManagement;
