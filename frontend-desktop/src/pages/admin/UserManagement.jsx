import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Mail, Search, X, UserCheck, UserX, Phone, Shield, Eye, EyeOff, RefreshCw, ChevronDown, Users, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAuth } from '../../context/AuthContext';
import { ROLES, MANAGER_TYPES } from '../../constants/roles';
import { userService } from '../../services/userService';

const ROLE_OPTIONS = [
    { value: 'manager', label: 'Manager' },
    { value: 'team_lead', label: 'Team Lead / Reporting Manager' },
    { value: 'employee', label: 'Employee' },
];

const MANAGER_TYPE_OPTIONS = [
    { value: 'parking', label: 'Parking Manager' },
    { value: 'attendance', label: 'Attendance Manager' },
    { value: 'desk_conference', label: 'Desk & Conference Manager' },
    { value: 'cafeteria', label: 'Cafeteria Manager' },
    { value: 'it_support', label: 'IT Support Manager' },
];

const DEPARTMENT_OPTIONS = [
    'Development', 'Sales', 'AI', 'Marketing', 'HR', 'Finance', 'Operations', 'Design', 'QA', 'DevOps', 'Support'
];

const INITIAL_FORM = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'manager',
    phone: '',
    vehicle_number: '',
    vehicle_type: 'car',
    department: '',
    manager_type: '',
    team_lead_code: '',
    manager_code: '',
};

const ROLE_COLORS = {
    manager: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    team_lead: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    employee: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
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

const UserManagement = () => {
    const { user } = useAuth();
    const canModify = user?.role?.toLowerCase() === ROLES.ADMIN || user?.role?.toLowerCase() === ROLES.SUPER_ADMIN;

    const [activeTab, setActiveTab] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newUser, setNewUser] = useState({ ...INITIAL_FORM });
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Dropdowns for hierarchy
    const [managers, setManagers] = useState([]);
    const [teamLeads, setTeamLeads] = useState([]);

    // Edit modal
    const [editModal, setEditModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '', department: '' });
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchManagers();
        fetchTeamLeads();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers({});
            const data = response?.data || response?.users || response;
            const list = Array.isArray(data) ? data : [];
            // Filter out super_admin and admin from the list (Admin can only see managers, TLs, employees)
            const filtered = list.filter(u =>
                !['super_admin', 'admin'].includes((u.role || '').toLowerCase())
            );
            setUsers(filtered.map(formatUser));
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await userService.getUsers({ role: 'manager' });
            const data = response?.data || response?.users || response;
            const list = Array.isArray(data) ? data : [];
            setManagers(list.map(m => ({
                user_code: m.user_code,
                name: `${m.first_name} ${m.last_name}`,
                manager_type: m.manager_type,
            })));
        } catch { setManagers([]); }
    };

    const fetchTeamLeads = async () => {
        try {
            const response = await userService.getUsers({ role: 'team_lead' });
            const data = response?.data || response?.users || response;
            const list = Array.isArray(data) ? data : [];
            setTeamLeads(list.map(tl => ({
                user_code: tl.user_code,
                name: `${tl.first_name} ${tl.last_name}`,
                department: tl.department,
            })));
        } catch { setTeamLeads([]); }
    };

    const formatUser = (u) => ({
        id: u.id,
        user_code: u.user_code,
        first_name: u.first_name,
        last_name: u.last_name,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email,
        phone: u.phone || '—',
        role: u.role,
        manager_type: u.manager_type,
        department: u.department || '',
        is_active: u.is_active,
        team_lead_code: u.team_lead_code,
        manager_code: u.manager_code,
        date: u.created_at ? new Date(u.created_at).toLocaleDateString() : '—',
        initial: u.first_name ? u.first_name[0].toUpperCase() : '?',
    });

    const handleAddUser = async () => {
        try {
            if (!newUser.first_name || !newUser.last_name || !newUser.password) {
                toast.error("Please fill required fields (First Name, Last Name, Password)");
                return;
            }
            if (newUser.password.length < 8) {
                toast.error("Password must be at least 8 characters");
                return;
            }
            const role = newUser.role;
            if (role === 'manager' && !newUser.manager_type) {
                toast.error("Manager type is required for Manager role");
                return;
            }
            if (role === 'team_lead' && !newUser.department) {
                toast.error("Department is required for Team Lead role");
                return;
            }
            if (role === 'employee' && !newUser.team_lead_code) {
                toast.error("Please assign a Reporting Manager (Team Lead) for this Employee");
                return;
            }

            setSubmitting(true);

            const payload = {
                first_name: newUser.first_name.trim(),
                last_name: newUser.last_name.trim(),
                email: newUser.email?.trim() || undefined,
                password: newUser.password,
                role: newUser.role,
                phone: newUser.phone?.trim() || undefined,
                vehicle_number: newUser.vehicle_number?.trim() || 'GJ-00-AB-0000',
                vehicle_type: newUser.vehicle_type || 'car',
                department: newUser.department?.trim() || undefined,
            };

            if (role === 'manager') {
                payload.manager_type = newUser.manager_type;
            }
            if (role === 'team_lead') {
                // Auto-assign to attendance manager
                const attendanceMgr = managers.find(m => m.manager_type === 'attendance');
                if (attendanceMgr) {
                    payload.manager_code = attendanceMgr.user_code;
                }
            }
            if (role === 'employee') {
                payload.team_lead_code = newUser.team_lead_code;
            }

            await userService.createUser(payload);
            toast.success(`${ROLE_OPTIONS.find(r => r.value === role)?.label || 'User'} created successfully!`);
            setShowForm(false);
            setNewUser({ ...INITIAL_FORM });
            setShowPassword(false);
            fetchUsers();
            if (role === 'manager') fetchManagers();
            if (role === 'team_lead') fetchTeamLeads();
        } catch (error) {
            console.error("Create user error", error);
            const msg = error.response?.data?.detail || "Failed to create user";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (u) => {
        if (!confirm(`Remove "${u.name}"? This will soft-delete the account.`)) return;
        try {
            await userService.deleteUser(u.id);
            toast.success(`"${u.name}" removed successfully`);
            fetchUsers();
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to remove user";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    const handleToggleActive = async (u) => {
        try {
            await userService.toggleActive(u.id);
            toast.success(`"${u.name}" ${u.is_active ? 'deactivated' : 'activated'}`);
            fetchUsers();
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to toggle status";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    };

    const handleEditOpen = (u) => {
        setEditUser(u);
        setEditData({
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone === '—' ? '' : u.phone,
            department: u.department || '',
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
            if (editData.first_name !== editUser.first_name) payload.first_name = editData.first_name.trim();
            if (editData.last_name !== editUser.last_name) payload.last_name = editData.last_name.trim();
            if ((editData.phone || '') !== (editUser.phone === '—' ? '' : editUser.phone)) payload.phone = editData.phone?.trim() || null;
            if ((editData.department || '') !== (editUser.department || '')) payload.department = editData.department?.trim() || null;
            if (Object.keys(payload).length === 0) {
                toast.info("No changes detected");
                setEditModal(false);
                return;
            }
            await userService.updateUser(editUser.id, payload);
            toast.success(`"${editUser.name}" updated`);
            setEditModal(false);
            setEditUser(null);
            fetchUsers();
        } catch (error) {
            const msg = error.response?.data?.detail || "Failed to update";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setEditSubmitting(false);
        }
    };

    // Filter by tab
    const tabFiltered = users.filter(u => {
        if (activeTab === 'all') return true;
        return (u.role || '').toLowerCase() === activeTab;
    });

    // Then filter by search
    const filteredUsers = tabFiltered.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.user_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleStyle = (role) => ROLE_COLORS[(role || '').toLowerCase()] || ROLE_COLORS.employee;
    const getRoleLabel = (role, manager_type) => {
        const r = (role || '').toLowerCase();
        if (r === 'manager' && manager_type) {
            const mt = MANAGER_TYPE_OPTIONS.find(m => m.value === manager_type);
            return mt ? mt.label : 'Manager';
        }
        if (r === 'team_lead') return 'Team Lead';
        if (r === 'employee') return 'Employee';
        return role;
    };



    const tabs = [
        { key: 'all', label: 'All', count: users.length },
        { key: 'manager', label: 'Managers', count: users.filter(u => (u.role || '').toLowerCase() === 'manager').length },
        { key: 'team_lead', label: 'Team Leads', count: users.filter(u => (u.role || '').toLowerCase() === 'team_lead').length },
        { key: 'employee', label: 'Employees', count: users.filter(u => (u.role || '').toLowerCase() === 'employee').length },
    ];

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
                        USER <span className="text-[#f9b012]">MANAGEMENT</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Create & Manage Managers, Team Leads and Employees
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2.5 shadow-sm w-[250px]">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="ml-3 bg-transparent border-none outline-none text-xs font-medium text-[#1a367c] w-full placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => { fetchUsers(); fetchManagers(); fetchTeamLeads(); }}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {canModify && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-[#1a367c] text-white px-6 py-2.5 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> CREATE USER
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${activeTab === tab.key
                            ? 'bg-[#1a367c] text-white shadow-md'
                            : 'bg-white text-[#8892b0] border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
                    </button>
                ))}
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
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">CREATE NEW USER</h3>

                        {/* Role Selector */}
                        <div className="flex gap-3 mb-6">
                            {ROLE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setNewUser({ ...newUser, role: opt.value, manager_type: '', team_lead_code: '', manager_code: '', department: '' })}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${newUser.role === opt.value
                                        ? 'bg-[#1a367c] text-white shadow-md'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                            <InputField label="FIRST NAME" required placeholder="e.g. Amit"
                                value={newUser.first_name}
                                onChange={e => setNewUser({ ...newUser, first_name: e.target.value })}
                            />
                            <InputField label="LAST NAME" required placeholder="e.g. Sharma"
                                value={newUser.last_name}
                                onChange={e => setNewUser({ ...newUser, last_name: e.target.value })}
                            />
                            <InputField label="EMAIL (OPTIONAL)" type="email" placeholder="Auto-generated if empty"
                                value={newUser.email}
                                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                            />

                            {/* Password */}
                            <InputField label="PASSWORD" required>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Min 8 chars, uppercase, lowercase, digit, special"
                                        className="w-full bg-[#f8f9fa] p-3 pr-10 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </InputField>

                            <InputField label="PHONE" placeholder="10 digits"
                                value={newUser.phone}
                                onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                            />

                            <InputField label="VEHICLE NUMBER" placeholder="XX-00-XX-0000"
                                value={newUser.vehicle_number}
                                onChange={e => setNewUser({ ...newUser, vehicle_number: e.target.value })}
                            />
                            <InputField label="VEHICLE TYPE">
                                <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    value={newUser.vehicle_type}
                                    onChange={e => setNewUser({ ...newUser, vehicle_type: e.target.value })}>
                                    <option value="car">Car</option>
                                    <option value="bike">Bike</option>
                                </select>
                            </InputField>

                            {/* Conditional fields based on role */}

                            {/* MANAGER: manager_type required */}
                            {newUser.role === 'manager' && (
                                <InputField label="MANAGER TYPE" required>
                                    <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                        value={newUser.manager_type}
                                        onChange={e => setNewUser({ ...newUser, manager_type: e.target.value })}>
                                        <option value="">Select Manager Type</option>
                                        {MANAGER_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </InputField>
                            )}

                            {/* TEAM_LEAD: department required, auto-assigned to Attendance Manager */}
                            {newUser.role === 'team_lead' && (
                                <>
                                    <InputField label="DEPARTMENT" required>
                                        <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                            value={newUser.department}
                                            onChange={e => setNewUser({ ...newUser, department: e.target.value })}>
                                            <option value="">Select Department</option>
                                            {DEPARTMENT_OPTIONS.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </InputField>
                                    <div className="space-y-2">
                                        <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">REPORTS TO</label>
                                        <div className="w-full bg-emerald-50 p-3 rounded-lg text-sm text-emerald-700 font-medium flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            {managers.find(m => m.manager_type === 'attendance')
                                                ? `${managers.find(m => m.manager_type === 'attendance').name} (Attendance Manager)`
                                                : 'Attendance Manager (auto-assigned)'}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* EMPLOYEE: team_lead_code required */}
                            {newUser.role === 'employee' && (
                                <>
                                    <InputField label="DEPARTMENT" placeholder="e.g. Development"
                                        value={newUser.department}
                                        onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                                    />
                                    <InputField label="REPORTING MANAGER (TEAM LEAD)" required>
                                        <select className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                            value={newUser.team_lead_code}
                                            onChange={e => setNewUser({ ...newUser, team_lead_code: e.target.value })}>
                                            <option value="">Select Reporting Manager</option>
                                            {teamLeads.map(tl => (
                                                <option key={tl.user_code} value={tl.user_code}>
                                                    {tl.name} ({tl.user_code}) — {tl.department}
                                                </option>
                                            ))}
                                        </select>
                                    </InputField>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowForm(false); setNewUser({ ...INITIAL_FORM }); setShowPassword(false); }}
                                className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                                CANCEL
                            </button>
                            <button onClick={handleAddUser} disabled={submitting}
                                className="px-6 py-3 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {submitting ? (
                                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> CREATING...</>
                                ) : (
                                    `+ CREATE ${ROLE_OPTIONS.find(r => r.value === newUser.role)?.label?.toUpperCase() || 'USER'}`
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Users Table */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100">
                <div className="grid grid-cols-[0.4fr_2fr_1.2fr_1fr_2fr_1fr_0.8fr] pb-4 border-b border-slate-100 mb-4 px-4 text-[0.7rem] font-bold text-[#8892b0] tracking-widest">
                    <div></div>
                    <div>USER</div>
                    <div>ROLE</div>
                    <div>STATUS</div>
                    <div>EMAIL</div>
                    <div>DEPARTMENT</div>
                    {canModify && <div className="text-right">ACTIONS</div>}
                </div>

                <div className="space-y-1">
                    {loading ? (
                        <div className="p-8 text-center">
                            <RefreshCw className="w-6 h-6 text-slate-300 animate-spin mx-auto mb-2" />
                            <p className="text-slate-400 text-sm font-medium">Loading users...</p>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(u => {
                            const style = getRoleStyle(u.role);
                            return (
                                <motion.div
                                    key={u.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="grid grid-cols-[0.4fr_2fr_1.2fr_1fr_2fr_1fr_0.8fr] items-center p-4 rounded-xl hover:bg-[#fafbfb] transition-colors group"
                                >
                                    <div>
                                        <div className={`w-9 h-9 ${u.is_active ? 'bg-[#1a367c]' : 'bg-slate-400'} text-white rounded-lg flex items-center justify-center font-bold shadow-sm text-sm`}>
                                            {u.initial}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[#1a367c]">{u.name}</div>
                                        <div className="text-[0.65rem] text-[#8892b0] font-medium mt-0.5">
                                            <span className="text-blue-500 mr-2">{u.user_code}</span>
                                            {u.date}
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1.5 rounded-full text-[0.6rem] font-bold tracking-wide ${style.bg} ${style.text}`}>
                                            {getRoleLabel(u.role, u.manager_type)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6rem] font-bold ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-[#555] font-medium truncate">
                                        <Mail className="w-3.5 h-3.5 text-[#b0b0b0] flex-shrink-0" />
                                        <span className="truncate">{u.email}</span>
                                    </div>
                                    <div className="text-xs text-[#555] font-medium truncate">{u.department || '—'}</div>
                                    {canModify && (
                                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditOpen(u)}
                                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors" title="Edit">
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleToggleActive(u)}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${u.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                    }`} title={u.is_active ? 'Deactivate' : 'Activate'}>
                                                {u.is_active ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                            </button>
                                            <button onClick={() => handleDelete(u)}
                                                className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors" title="Remove">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-sm font-medium italic">
                            {searchQuery ? 'No matching users found.' : 'No users yet. Click "CREATE USER" to get started.'}
                        </div>
                    )}
                </div>

                {!loading && users.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center px-4">
                        <div className="text-[0.7rem] text-[#8892b0] font-medium tracking-wide">
                            TOTAL: {users.length} &nbsp;|&nbsp;
                            <span className="text-purple-600">{users.filter(u => (u.role || '').toLowerCase() === 'manager').length} Managers</span> &nbsp;|&nbsp;
                            <span className="text-amber-600">{users.filter(u => (u.role || '').toLowerCase() === 'team_lead').length} Team Leads</span> &nbsp;|&nbsp;
                            <span className="text-sky-600">{users.filter(u => (u.role || '').toLowerCase() === 'employee').length} Employees</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editModal && editUser && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                        onClick={() => setEditModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[20px] p-8 shadow-xl w-full max-w-lg mx-4"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-[#1a367c] tracking-wide">EDIT USER</h3>
                                <button onClick={() => setEditModal(false)}
                                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-4">
                                <div className="w-10 h-10 bg-[#1a367c] text-white rounded-lg flex items-center justify-center font-bold">{editUser.initial}</div>
                                <div>
                                    <div className="text-sm font-bold text-[#1a367c]">{editUser.name}</div>
                                    <div className="text-[0.65rem] text-blue-500 font-medium">{editUser.user_code} · {getRoleLabel(editUser.role, editUser.manager_type)}</div>
                                </div>
                            </div>
                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="FIRST NAME" required value={editData.first_name}
                                        onChange={e => setEditData({ ...editData, first_name: e.target.value })} />
                                    <InputField label="LAST NAME" required value={editData.last_name}
                                        onChange={e => setEditData({ ...editData, last_name: e.target.value })} />
                                </div>
                                <InputField label="PHONE" placeholder="10 digits" value={editData.phone}
                                    onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                                <InputField label="DEPARTMENT" placeholder="e.g. Development" value={editData.department}
                                    onChange={e => setEditData({ ...editData, department: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setEditModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors">
                                    CANCEL
                                </button>
                                <button onClick={handleEditSave} disabled={editSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2">
                                    {editSubmitting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> SAVING...</> : 'SAVE CHANGES'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default UserManagement;
