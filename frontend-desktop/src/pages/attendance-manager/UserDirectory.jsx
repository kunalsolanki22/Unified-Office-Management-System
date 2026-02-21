import React, { useState } from 'react';
import {
    Search,
    Phone,
    Mail,
    User
} from 'lucide-react';

const UserDirectory = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Data - In a real app, this would come from an API
    const allUsers = [
        { name: 'Sarah Miller', id: 'CYG-M-001', role: 'CAFETERIA OPS', join: 'JAN 2026', email: 'sarah.m@cygnet.one', phone: '+91 98765 43210', initial: 'S', color: 'bg-blue-600' },
        { name: 'David Chen', id: 'CYG-M-002', role: 'HARDWARE LEAD', join: 'DEC 2025', email: 'david.c@cygnet.one', phone: '+91 98765 43211', initial: 'D', color: 'bg-indigo-600' },
        { name: 'Elena Vance', id: 'CYG-M-003', role: 'SECURITY', join: 'FEB 2026', email: 'elena.v@cygnet.one', phone: '+91 98765 43212', initial: 'E', color: 'bg-purple-600' },
        { name: 'Michael Ross', id: 'CYG-E-045', role: 'FRONTEND DEV', join: 'MAR 2026', email: 'michael.r@cygnet.one', phone: '+91 98765 43213', initial: 'M', color: 'bg-green-600' },
        { name: 'Priya Patel', id: 'CYG-E-046', role: 'QA ENGINEER', join: 'MAR 2026', email: 'priya.p@cygnet.one', phone: '+91 98765 43214', initial: 'P', color: 'bg-pink-600' },
        { name: 'James Wilson', id: 'CYG-E-047', role: 'BACKEND DEV', join: 'APR 2026', email: 'james.w@cygnet.one', phone: '+91 98765 43215', initial: 'J', color: 'bg-orange-600' },
    ];

    // Filter Logic
    const filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        placeholder="Search employees by name, ID, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1a367c] focus:ring-1 focus:ring-[#1a367c] shadow-sm transition-all"
                    />
                </div>
                <div className="text-xs font-bold text-[#8892b0] uppercase tracking-wider">
                    Showing {filteredUsers.length} Users
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[50px_2fr_1.5fr_2fr] gap-4 bg-slate-50 px-6 py-4 border-b border-slate-100 text-xs font-bold text-[#8892b0] tracking-wider uppercase">
                    <div></div>
                    <div>Identity Node</div>
                    <div>Role / Assignment</div>
                    <div>Contact Protocol</div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, idx) => (
                            <div key={idx} className="grid grid-cols-[50px_2fr_1.5fr_2fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors group">
                                <div className={`w-10 h-10 ${user.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-105 transition-transform`}>
                                    {user.initial}
                                </div>
                                <div>
                                    <div className="font-bold text-[#1a367c] text-sm group-hover:text-[#2c4a96] transition-colors">{user.name}</div>
                                    <div className="text-[0.65rem] text-[#8892b0] font-medium tracking-wide mt-0.5">
                                        ID: {user.id} • JOINED: {user.join}
                                    </div>
                                </div>
                                <div>
                                    <span className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-bold tracking-wider bg-slate-100 text-slate-600 border border-slate-200 group-hover:bg-[#f9b012]/10 group-hover:text-[#f9b012] group-hover:border-[#f9b012]/20 transition-all">
                                        {user.role}
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
                            <p className="text-sm font-medium">No users found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDirectory;
