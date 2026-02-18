import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await authService.login(email, password);
        localStorage.setItem('access_token', data.data.access_token);
        const meData = await authService.me();
        const userData = meData.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    const getRedirectPath = (userData) => {
        if (!userData) return '/login';

        const role = userData.role;
        const managerType = userData.manager_type;

        // Super Admin
        if (role === 'super_admin') return '/super-admin/dashboard';

        // Admin
        if (role === 'admin') return '/admin/dashboard';

        // Managers
        if (role === 'manager') {
            if (managerType === 'parking') return '/parking-manager/dashboard';
            if (managerType === 'it_support') return '/hardware-manager/dashboard';
            if (managerType === 'attendance') return '/attendance-manager/dashboard';
            if (managerType === 'cafeteria') return '/cafeteria-manager/dashboard';
            if (managerType === 'desk_conference') return '/conference-desk-manager/dashboard';
            return '/login'; // Fallback if manager type is unknown
        }

        // Team Lead
        if (role === 'team_lead') return '/reporting-manager/dashboard';

        // Employee
        if (role === 'employee') return '/employee/dashboard';

        return '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, getRedirectPath }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
