import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const ProfileDropdown = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Password change states
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('All fields are required');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await authService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword,
                passwordData.confirmPassword
            );
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert("Password changed successfully");
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleHierarchyLabel = () => {
        if (!user) return 'Co-Founder'; // fallback
        // Based on user role
        switch (user.role?.toLowerCase()) {
            case 'super_admin': return 'Co-Founder';
            case 'admin': return 'Administrator';
            case 'manager':
                return user.manager_type ? `${user.manager_type.replace('_', ' ')} Manager` : 'Manager';
            case 'team_lead':
                return user.department ? `${user.department} Team Lead` : 'Team Lead';
            case 'employee':
                return user.department ? `${user.department} Employee` : 'Employee';
            default: return 'User';
        }
    };

    const name = user?.full_name || user?.name || user?.first_name || 'SUPER ADMIN';
    const email = user?.email || 'admin@cygnet.one';
    const phone = user?.phone || '+1 (555) 123-4567';
    const initial = name.charAt(0).toUpperCase();

    return (
        <div className="relative" ref={dropdownRef}>
            {/* User Profile Hook */}
            <div
                className="flex items-center gap-3 pl-4 border-l border-slate-200 ml-2 cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="text-right hidden sm:block">
                    <div className="text-[0.75rem] font-bold text-[#1a367c] uppercase">{name}</div>
                    <div className="text-[0.65rem] text-[#f9b012] font-semibold text-right capitalize">
                        {getRoleHierarchyLabel()}
                    </div>
                </div>
                <div className="w-10 h-10 bg-[#1a367c] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-50">
                    {initial}
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-4 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    {/* Header Section */}
                    <div className="bg-[#2a4382] p-4 flex items-center gap-4 text-white">
                        <div className="w-12 h-12 bg-white text-[#1a367c] rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                            {initial}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold truncate text-sm uppercase">{name}</div>
                            <div className="text-xs text-blue-200 truncate capitalize">{getRoleHierarchyLabel()}</div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="p-4 space-y-4">
                        <div>
                            <div className="text-[0.65rem] font-bold text-[#8ba3c7] uppercase tracking-wider mb-1">Number</div>
                            <div className="text-sm font-medium text-slate-800">{phone}</div>
                        </div>

                        <div>
                            <div className="text-[0.65rem] font-bold text-[#8ba3c7] uppercase tracking-wider mb-1">Email</div>
                            <div className="text-sm font-medium text-slate-800 break-all">{email}</div>
                        </div>

                        <div>
                            <div className="text-[0.65rem] font-bold text-[#8ba3c7] uppercase tracking-wider mb-2">Password</div>

                            {!isChangingPassword ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-lg leading-none tracking-widest text-[#1a367c] mt-1">••••••••</span>
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="bg-[#f9b012] hover:bg-[#e09e10] text-[#1a367c] text-xs font-bold px-4 py-1.5 rounded-md transition-colors shadow-sm"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-[#f8f9fc] p-3 rounded-lg border border-slate-100 mt-2 space-y-3">
                                    <div>
                                        <div className="text-[0.65rem] font-bold text-[#8ba3c7] mb-1">Current Password</div>
                                        <input
                                            type="password"
                                            placeholder="Current password"
                                            className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#1a367c] focus:ring-1 focus:ring-[#1a367c] bg-white text-slate-800 placeholder-slate-400"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[0.65rem] font-bold text-[#8ba3c7] mb-1">New Password</div>
                                        <input
                                            type="password"
                                            placeholder="New password"
                                            className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#1a367c] focus:ring-1 focus:ring-[#1a367c] bg-white text-slate-800 placeholder-slate-400"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-[0.65rem] font-bold text-[#8ba3c7] mb-1">Confirm Password</div>
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            className="w-full text-sm px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:border-[#1a367c] focus:ring-1 focus:ring-[#1a367c] bg-white text-slate-800 placeholder-slate-400"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                    {error && <div className="text-red-500 text-xs font-semibold">{error}</div>}
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isLoading}
                                            className="flex-1 bg-[#f9b012] hover:bg-[#e09e10] text-[#1a367c] text-sm font-bold py-2 rounded-md transition-colors disabled:opacity-50 shadow-sm"
                                        >
                                            {isLoading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsChangingPassword(false);
                                                setError('');
                                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                            }}
                                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-[#8ba3c7] text-sm font-bold py-2 rounded-md transition-colors shadow-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={handleLogout}
                            className="w-full py-2 bg-white border border-red-500 text-red-500 text-sm font-bold rounded-md hover:bg-red-50 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
