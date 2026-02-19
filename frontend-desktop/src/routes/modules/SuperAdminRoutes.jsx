import { Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';


// Pages
import Dashboard from '../../pages/super-admin/Dashboard';
import AdminManagement from '../../pages/super-admin/AdminManagement';
import Attendance from '../../pages/super-admin/Attendance';
import ApprovalsHub from '../../pages/super-admin/ApprovalsHub';
import Holidays from '../../pages/super-admin/Holidays';
import ActionHub from '../../pages/super-admin/ActionHub';
import Analytics from '../../pages/super-admin/Analytics';
import MyAttendance from '../../pages/super-admin/MyAttendance';
import UserDirectory from '../../pages/shared/UserDirectory';
import ServiceBooking from '../../pages/shared/ServiceBooking';

const SuperAdminRoutes = () => {
    return (
        <Routes>
            <Route element={<SuperAdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admins" element={<AdminManagement />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="approvals" element={<ApprovalsHub />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="actions" element={<ActionHub />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="service-booking" element={<ServiceBooking />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default SuperAdminRoutes;
