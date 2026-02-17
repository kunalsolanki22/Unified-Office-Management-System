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

        // Normalize to uppercase to match frontend constants
        if (userData.role) userData.role = userData.role.toUpperCase();
        if (userData.manager_type) userData.manager_type = userData.manager_type.toUpperCase();

        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    const getRedirectPath = (userData) => {
        const role = userData?.role;
        const managerType = userData?.manager_type;
        if (role === 'SUPER_ADMIN') return '/super-admin/dashboard';
        if (role === 'ADMIN') return '/admin/dashboard';
        if (role === 'MANAGER') {
            if (managerType === 'PARKING') return '/parking/dashboard';
            if (managerType === 'IT_SUPPORT') return '/hardware/dashboard';
            if (managerType === 'ATTENDANCE') return '/attendance-manager/dashboard';
            if (managerType === 'CAFETERIA') return '/cafeteria-manager/dashboard';
            if (managerType === 'DESK_CONFERENCE') return '/conference-desk-manager/dashboard';
        }
        if (role === 'TEAM_LEAD') return '/reporting-manager/dashboard';
        if (role === 'EMPLOYEE') return '/employee/dashboard';
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