import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoutes = ({ allowedRoles, allowedManagerTypes }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Normalize to lowercase for comparison (login() uppercases values)
    const userRole = (user.role || '').toLowerCase();
    const userManagerType = (user.manager_type || '').toLowerCase();

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (allowedManagerTypes && !allowedManagerTypes.includes(userManagerType)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoutes;