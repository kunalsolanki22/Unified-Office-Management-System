import { createContext, useContext, useState } from 'react';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        let role = ROLES.CAFETERIA_MANAGER;
        let manager_type = null;

        if (userData.email.includes('super')) role = ROLES.SUPER_ADMIN;
        else if (userData.email.includes('admin')) role = ROLES.ADMIN;
        else if (userData.email.includes('team')) role = ROLES.TEAM_LEAD;
        else if (userData.email.includes('attendance')) role = ROLES.ATTENDANCE_MANAGER;
        else if (userData.email.includes('reporting')) role = ROLES.REPORTING_MANAGER;
        else if (userData.email.includes('conference') || userData.email.includes('desk')) role = ROLES.CONFERENCE_DESK_MANAGER;
        else if (userData.email.includes('it') || userData.email.includes('hardware')) {
            role = ROLES.MANAGER;
            manager_type = 'it_support';
        } else if (userData.email.includes('parking')) {
            role = ROLES.MANAGER;
            manager_type = 'parking';
        } else if (userData.email.includes('manager') || userData.email.includes('cafeteria')) role = ROLES.CAFETERIA_MANAGER;

        setUser({ ...userData, role, manager_type });
    };

    const getRedirectPath = (userObj) => {
        const u = userObj || user;
        if (!u) return '/login';

        if (u.role === ROLES.SUPER_ADMIN) return '/super-admin/dashboard';
        if (u.role === ROLES.ADMIN) return '/admin/dashboard';
        if (u.role === ROLES.TEAM_LEAD) return '/team-lead/dashboard';
        if (u.role === ROLES.ATTENDANCE_MANAGER) return '/attendance-manager/dashboard';
        if (u.role === ROLES.REPORTING_MANAGER) return '/reporting-manager/dashboard';
        if (u.role === ROLES.CAFETERIA_MANAGER) return '/cafeteria-manager/dashboard';
        if (u.role === ROLES.CONFERENCE_DESK_MANAGER) return '/conference-desk-manager/dashboard';
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);