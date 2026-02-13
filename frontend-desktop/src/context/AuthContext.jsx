import { createContext, useContext, useState } from 'react';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        let role = ROLES.MANAGER;
        let manager_type = null;

        if (userData.email.includes('super')) {
            role = ROLES.SUPER_ADMIN;
        } else if (userData.email.includes('admin')) {
            role = ROLES.ADMIN;
        } else if (userData.email.includes('team')) {
            role = ROLES.TEAM_LEAD;
        } else if (
            userData.email.includes('parking') ||
            userData.email.includes('it') ||
            userData.email.includes('hardware') ||
            userData.email.includes('manager')
        ) {
            role = ROLES.MANAGER;
            if (userData.email.includes('parking')) {
                manager_type = 'parking';
            } else {
                manager_type = 'it_support';
            }
        }

        setUser({ ...userData, role, manager_type });
    };

    const getRedirectPath = (userObj) => {
        const u = userObj || user;
        if (!u) return '/login';

        if (u.role === ROLES.SUPER_ADMIN) return '/super-admin/dashboard';
        if (u.role === ROLES.ADMIN) return '/admin/dashboard';
        if (u.role === ROLES.TEAM_LEAD) return '/team-lead/dashboard';
        if (u.role === ROLES.MANAGER) {
            if (u.manager_type === 'parking') return '/parking/dashboard';
            return '/hardware/dashboard';
        }
        return '/login';
    };

    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, login, logout, getRedirectPath }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);