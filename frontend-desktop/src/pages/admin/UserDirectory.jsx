import React, { useState, useEffect } from 'react';
import {
    Search,
    Phone,
    Mail,
    User,
    RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

const UserDirectory = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            
            const res = await fetch('http://localhost:8000/api/v1/users/directory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error('Failed to fetch users');
            
            const data = await res.json();
            console.log('Users directory response:', data);
            
            const usersArray = data.data || [];
            
            const colors = [
                'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600',
                'bg-red-600', 'bg-orange-600', 'bg-amber-600', 'bg-yellow-600',
                'bg-lime-600', 'bg-green-600', 'bg-emerald-600', 'bg-teal-600'
            ];
            
            const mapped = usersArray.map((u, idx) => ({
                id: u.id || idx,
                name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                userId: u.user_code,
                email: u.email,
                phone: u.phone || 'N/A',
                department: u.department || 'N/A',
                initial: (u.full_name || u.first_name || 'U').charAt(0).toUpperCase(),
                color: colors[idx % colors.length]
            })).filter(u => u.email);
            
            setAllUsers(mapped);
            setFilteredUsers(mapped);
        } catch (err) {
            console.error('Failed to load users:', err);
            toast.error('Failed to load employee directory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        const filtered = allUsers.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchQuery, allUsers]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-[#8892b0] font-medium">Loading employee directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-[#1e3a8a] mb-2">
                        USER DIRECTORY <span className="text-[#FFB012]">LIFECYCLE MANAGEMENT</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] tracking-wide uppercase font-medium">
                        View Organizational Talent and Roles
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="border border-slate-200 text-[#8892b0] px-4 py-3 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> REFRESH
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892b0]" />
                    <input
                        type="text"
                        placeholder="Search employees by name, ID, email, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] shadow-sm transition-all"
                    />
                </div>
                <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">
                    Showing {filteredUsers.length} of {allUsers.length}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="grid grid-cols-[50px_2fr_1.5fr_2fr_1.5fr] gap-4 bg-slate-50 px-6 py-4 border-b border-slate-100 text-xs font-bold text-[#8892b0] tracking-wider uppercase">
                    <div></div>
                    <div>Name</div>
                    <div>Department</div>
                    <div>Contact</div>
                    <div>User Code</div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, idx) => (
                            <div key={idx} className="grid grid-cols-[50px_2fr_1.5fr_2fr_1.5fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                                <div className={`w-10 h-10 ${user.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                    {user.initial}
                                </div>
                                <div>
                                    <div className="font-bold text-[#1e3a8a] text-sm group-hover:text-[#2c4a96] transition-colors">{user.name}</div>
                                </div>
                                <div>
                                    <span className="inline-block px-2 py-1 rounded-full text-[0.65rem] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
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
                                <div className="text-sm text-[#8892b0] font-medium">
                                    {user.userId}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-[#8892b0]">
                            <User className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No users found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDirectory;
