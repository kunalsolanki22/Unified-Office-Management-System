import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';

// Pages
import Login from '../pages/public/Login';
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import AdminManagement from '../pages/super-admin/AdminManagement';
import Attendance from '../pages/super-admin/Attendance';
import Holidays from '../pages/super-admin/Holidays';
import ActionHub from '../pages/super-admin/ActionHub';
import Analytics from '../pages/super-admin/Analytics';

// Placeholder Pages - Actual content to be implemented
const AdminDashboard = () => <div>Admin Dashboard</div>;
const ManagerDashboard = () => <div>Manager Dashboard</div>;
const TeamLeadDashboard = () => <div>Team Lead Dashboard</div>;
const Unauthorized = () => <div>Unauthorized</div>;
const NotFound = () => <div>404 Not Found</div>;

const AppRoutes = () => {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Public Routes */}
                <Route element={<AuthLayout />}>
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
                </Route>

                {/* Super Admin Routes */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                    <Route element={<SuperAdminLayout />}>
                        <Route path={ROUTES.SUPER_ADMIN_DASHBOARD} element={<SuperAdminDashboard />} />
                        <Route path={ROUTES.SUPER_ADMIN_ADMINS} element={<AdminManagement />} />
                        <Route path={ROUTES.SUPER_ADMIN_ATTENDANCE} element={<Attendance />} />
                        <Route path={ROUTES.SUPER_ADMIN_HOLIDAYS} element={<Holidays />} />
                        <Route path={ROUTES.SUPER_ADMIN_ACTIONS} element={<ActionHub />} />
                        <Route path={ROUTES.SUPER_ADMIN_ANALYTICS} element={<Analytics />} />
                    </Route>
                </Route>

                {/* Protected Routes (Main Layout) */}
                <Route element={<MainLayout />}>

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
                    </Route>

                    {/* Manager Routes */}
                    <Route element={<ProtectedRoutes allowedRoles={[ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                        <Route path={ROUTES.MANAGER_DASHBOARD} element={<ManagerDashboard />} />
                    </Route>

                    {/* Team Lead Routes */}
                    <Route element={<ProtectedRoutes allowedRoles={[ROLES.TEAM_LEAD, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                        <Route path={ROUTES.TEAM_LEAD_DASHBOARD} element={<TeamLeadDashboard />} />
                    </Route>

                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
