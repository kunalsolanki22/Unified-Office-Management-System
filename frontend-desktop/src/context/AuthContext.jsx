import { createContext, useContext, useState } from 'react';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        // Simulate role assignment based on email for testing
        // In a real app, this would come from the backend API response
        let role = ROLES.CAFETERIA_MANAGER;

        if (userData.email.includes('admin')) role = ROLES.ADMIN;
        if (userData.email.includes('super')) role = ROLES.SUPER_ADMIN;
        if (userData.email.includes('team')) role = ROLES.TEAM_LEAD;
        if (userData.email.includes('attendance')) role = ROLES.ATTENDANCE_MANAGER;
        if (userData.email.includes('reporting')) role = ROLES.REPORTING_MANAGER;
        else if (userData.email.includes('manager') || userData.email.includes('cafeteria')) role = ROLES.CAFETERIA_MANAGER;

        setUser({ ...userData, role });
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
