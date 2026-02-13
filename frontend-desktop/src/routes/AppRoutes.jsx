import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

// Layouts
import AuthLayout from '../layouts/AuthLayout';

// Module Routes
import SuperAdminRoutes from './modules/SuperAdminRoutes';
import AdminRoutes from './modules/AdminRoutes';

import TeamLeadRoutes from './modules/TeamLeadRoutes';
import AttendanceManagerRoutes from './modules/AttendanceManagerRoutes'; // Attendance Manager Routes
import CafeteriaManagerRoutes from './modules/CafeteriaManagerRoutes';
import ReportingManagerRoutes from './modules/ReportingManagerRoutes';


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



                {/* Team Lead Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.TEAM_LEAD, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/team-lead/*" element={<TeamLeadRoutes />} />
                </Route>

                {/* Attendance Manager Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.ATTENDANCE_MANAGER, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/attendance-manager/*" element={<AttendanceManagerRoutes />} />
                </Route>

                {/* Cafeteria Manager Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.CAFETERIA_MANAGER, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/cafeteria-manager/*" element={<CafeteriaManagerRoutes />} />
                </Route>

                {/* Reporting Manager Module */}
                <Route element={<ProtectedRoutes allowedRoles={[ROLES.REPORTING_MANAGER, ROLES.SUPER_ADMIN]} />}>
                    <Route path="/reporting-manager/*" element={<ReportingManagerRoutes />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
