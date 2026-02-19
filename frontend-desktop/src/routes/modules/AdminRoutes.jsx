import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';


// Pages
import Dashboard from '../../pages/admin/Dashboard';
import UserDirectory from '../../pages/shared/UserDirectory';
import ApprovalsHub from '../../pages/admin/ApprovalsHub';
import AttendanceValidation from '../../pages/admin/AttendanceValidation';
import Holidays from '../../pages/admin/Holidays';
import ActionHub from '../../pages/admin/ActionHub';
import MyAttendance from '../../pages/admin/MyAttendance';
import ServiceBooking from '../../pages/shared/ServiceBooking';

import ProjectApprovals from '../../pages/admin/ProjectApprovals';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="project-approvals" element={<ProjectApprovals />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="approvals-hub" element={<ApprovalsHub />} />
                <Route path="attendance-validation" element={<AttendanceValidation />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="action-hub" element={<ActionHub />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="service-booking" element={<ServiceBooking />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
