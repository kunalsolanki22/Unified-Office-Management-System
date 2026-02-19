import { useState, useEffect } from 'react';
import { Search, Phone, Mail, User } from 'lucide-react';
import { userService } from '../../services/userService';

const colors = [
    'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-green-600',
    'bg-pink-600', 'bg-orange-600', 'bg-teal-600', 'bg-red-600',
];

const UserDirectory = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const fetchUsers = async (search = '') => {
        try {
            setLoading(true);
            const params = { page_size: 50 };
            if (search.trim()) params.search = search.trim();
            const res = await userService.getDirectory(params);
            console.log('User directory response:', res);

            const usersArray = res.data || [];
            setTotal(res.total || usersArray.length);

            const mapped = usersArray.map((u, idx) => ({
                id: u.id,
                name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—',
                userCode: u.user_code || '—',
                email: u.email || '—',
                phone: u.phone || '—',
                department: u.department || '—',
                role: u.role || '—',
                isActive: u.is_active !== false,
                initial: (u.full_name || u.first_name || '?')[0].toUpperCase(),
                color: colors[idx % colors.length],
            }));
            setUsers(mapped);
        } catch (err) {
            console.error('Failed to load user directory:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#1a367c] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[#8892b0] font-medium">Loading directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                    USER <span className="text-[#FFB012]">DIRECTORY</span>
                </h1>
                <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                    Organizational Employee Contact Lookup
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892b0]" />
                    <input
                        type="text"
                        placeholder="Search by name, email, code, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] shadow-sm transition-all"
                    />
                </div>
                <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">
                    Showing {users.length} of {total} Users
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-[50px_2fr_1fr_1fr_2fr] gap-4 bg-slate-50 px-6 py-4 border-b border-slate-100 text-xs font-bold text-[#8892b0] tracking-wider uppercase">
                    <div></div>
                    <div>Employee</div>
                    <div>Code</div>
                    <div>Department</div>
                    <div>Contact</div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <div key={user.id} className="grid grid-cols-[50px_2fr_1fr_1fr_2fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                                <div className={`w-10 h-10 ${user.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                    {user.initial}
                                </div>
                                <div>
                                    <div className="font-bold text-[#1e3a8a] text-sm group-hover:text-[#2c4a96] transition-colors">
                                        {user.name}
                                    </div>
                                    <div className="text-[0.65rem] text-[#8892b0] font-medium tracking-wide mt-0.5">
                                        {user.role.toUpperCase().replace('_', ' ')}
                                        {!user.isActive && (
                                            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[0.6rem] font-bold">INACTIVE</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm font-mono text-[#1a367c] font-bold">{user.userCode}</div>
                                <div>
                                    <span className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-[#FFB012]/10 group-hover:text-[#FFB012] group-hover:border-[#FFB012]/20 transition-all">
                                        {user.department}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Mail className="w-3 h-3 text-[#8892b0]" /> {user.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Phone className="w-3 h-3 text-[#8892b0]" /> {user.phone}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#8892b0]">
                            <User className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">
                                {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDirectory;