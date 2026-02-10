import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import ManagerLayout from '../layouts/ManagerLayout';

// Public
import Login from '../pages/public/Login';

// Super Admin
import SuperAdminDashboard from '../pages/super-admin/Dashboard';
import AdminManagement from '../pages/super-admin/AdminManagement';
import Attendance from '../pages/super-admin/Attendance';
import Holidays from '../pages/super-admin/Holidays';
import ActionHub from '../pages/super-admin/ActionHub';
import Analytics from '../pages/super-admin/Analytics';

// Manager — Hardware
import HardwareDashboard from '../pages/manager/HardwareDashboard';
import HardwareRequests from '../pages/manager/HardwareRequests';
import HardwareAssets from '../pages/manager/HardwareAssets';
import HardwareVendors from '../pages/manager/HardwareVendors';

// Manager — Parking
import ParkingDashboard from '../pages/manager/ParkingDashboard';
import ParkingSlots from '../pages/manager/ParkingSlots';
import ParkingRequests from '../pages/manager/ParkingRequests';

// Placeholders
const AdminDashboard = () => <div>Admin Dashboard</div>;
const TeamLeadDashboard = () => <div>Team Lead Dashboard</div>;
const Unauthorized = () => <div>Unauthorized</div>;

const AppRoutes = () => {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Public */}
                <Route element={<AuthLayout />}>
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
                </Route>

                {/* Super Admin */}
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

                {/* Manager */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route element={<ManagerLayout />}>
                        <Route path={ROUTES.MANAGER_DASHBOARD} element={<HardwareDashboard />} />
                        <Route path={ROUTES.HARDWARE_DASHBOARD} element={<HardwareDashboard />} />
                        <Route path={ROUTES.HARDWARE_REQUESTS} element={<HardwareRequests />} />
                        <Route path={ROUTES.HARDWARE_ASSETS} element={<HardwareAssets />} />
                        <Route path={ROUTES.HARDWARE_VENDORS} element={<HardwareVendors />} />
                        <Route path={ROUTES.PARKING_DASHBOARD} element={<ParkingDashboard />} />
                        <Route path={ROUTES.PARKING_SLOTS} element={<ParkingSlots />} />
                        <Route path={ROUTES.PARKING_REQUESTS} element={<ParkingRequests />} />
                    </Route>
                </Route>

                {/* Admin */}
                <Route element={<MainLayout />}>
                    <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                        <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
                    </Route>
                    <Route element={<ProtectedRoutes allowedRoles={[ROLES.TEAM_LEAD, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                        <Route path={ROUTES.TEAM_LEAD_DASHBOARD} element={<TeamLeadDashboard />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;