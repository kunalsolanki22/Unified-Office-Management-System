import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import AuthLayout from '../layouts/AuthLayout';

// Module Routes
import SuperAdminRoutes from './modules/SuperAdminRoutes';
import AdminRoutes from './modules/AdminRoutes';
import ManagerRoutes from './modules/ManagerRoutes';
import TeamLeadRoutes from './modules/TeamLeadRoutes';

// Pages
import Login from '../pages/public/Login';

const Unauthorized = () => <div>Unauthorized</div>;

const AppRoutes = () => {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Public Routes */}
                <Route element={<AuthLayout />}>
                    <Route path={ROUTES.LOGIN} element={<Login />} />
                    <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
                </Route>

                {/* Super Admin Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                    <Route path="/super-admin/*" element={<SuperAdminRoutes />} />
                </Route>

                {/* Admin Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/admin/*" element={<AdminRoutes />} />
                </Route>

                {/* Manager Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/manager/*" element={<ManagerRoutes />} />
                </Route>

                {/* Team Lead Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.TEAM_LEAD, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/team-lead/*" element={<TeamLeadRoutes />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
