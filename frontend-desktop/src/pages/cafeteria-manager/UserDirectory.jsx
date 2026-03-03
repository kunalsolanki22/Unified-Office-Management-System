import React, { useState, useEffect, useCallback } from 'react';
import { Search, Phone, Mail, User, Loader2 } from 'lucide-react';
import { cafeteriaService } from '../../services/cafeteriaService';

// Deterministic avatar color from name
const AVATAR_COLORS = [
    'bg-blue-600', 'bg-indigo-600', 'bg-purple-600',
    'bg-green-600', 'bg-pink-600', 'bg-orange-600',
    'bg-teal-600', 'bg-rose-600', 'bg-cyan-600', 'bg-amber-600'
];
const getAvatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const UserDirectory = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);

    const fetchUsers = useCallback(async (search = '') => {
        try {
            setLoading(true);
            setError(null);
            const params = { page: 1, page_size: 100 };
            if (search.trim()) params.search = search.trim();
            const res = await cafeteriaService.getUserDirectory(params);
            // PaginatedResponse: { data: [...], total, page, page_size }
            const list = res?.data ?? res ?? [];
            setUsers(Array.isArray(list) ? list : []);
            setTotal(res?.total ?? (Array.isArray(list) ? list.length : 0));
        } catch (err) {
            console.error('Failed to fetch user directory:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search — hit backend with search param
    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(searchQuery), 350);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchUsers]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[#1a367c] mb-2">
                    USER DIRECTORY <span className="text-[#f9b012]">LIFECYCLE MANAGEMENT</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    View Organizational Talent and Roles
                </p>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892b0]" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, email, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a367c] focus:ring-1 focus:ring-[#1a367c] shadow-sm transition-all"
                    />
                </div>
                <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">
                    {loading ? 'Loading...' : `Showing ${users.length}${total > users.length ? ` of ${total}` : ''} Users`}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[50px_2fr_1.5fr_2fr] gap-4 bg-slate-50 px-6 py-4 border-b border-slate-100 text-xs font-bold text-[#8892b0] tracking-wider uppercase">
                    <div></div>
                    <div>Identity Node</div>
                    <div>Department / Role</div>
                    <div>Contact Protocol</div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[#8892b0] gap-3">
                            <Loader2 className="w-8 h-8 animate-spin opacity-40" />
                            <p className="text-sm font-medium">Loading users...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-red-400 gap-2">
                            <p className="text-sm font-medium">{error}</p>
                            <button
                                onClick={() => fetchUsers(searchQuery)}
                                className="text-xs font-bold text-[#1a367c] hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : users.length > 0 ? (
                        users.map((user) => {
                            const fullName = user.full_name || `${user.first_name} ${user.last_name}`.trim();
                            const initial = fullName.charAt(0).toUpperCase();
                            const avatarColor = getAvatarColor(fullName);
                            return (
                                <div
                                    key={user.user_code}
                                    className="grid grid-cols-[50px_2fr_1.5fr_2fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group"
                                >
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 ${avatarColor} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                        {initial}
                                    </div>

                                    {/* Identity */}
                                    <div>
                                        <div className="font-bold text-[#1a367c] text-sm group-hover:text-[#2c4a96] transition-colors">
                                            {fullName}
                                        </div>
                                        <div className="text-[0.65rem] text-[#8892b0] font-medium tracking-wide mt-0.5">
                                            ID: {user.user_code}
                                            {!user.is_active && (
                                                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 text-[0.55rem] font-bold">INACTIVE</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <span className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-[#f9b012]/10 group-hover:text-[#f9b012] group-hover:border-[#f9b012]/20 transition-all">
                                            {user.department || 'General'}
                                        </span>
                                    </div>

                                    {/* Contact */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Mail className="w-3 h-3 text-[#8892b0] shrink-0" />
                                            <span className="truncate">{user.email || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Phone className="w-3 h-3 text-[#8892b0] shrink-0" />
                                            {user.phone ? `+91 ${user.phone}` : '—'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#8892b0]">
                            <User className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">
                                {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDirectory;
