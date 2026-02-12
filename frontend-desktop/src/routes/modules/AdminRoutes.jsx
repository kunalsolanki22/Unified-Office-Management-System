import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';


// Pages
import Dashboard from '../../pages/admin/Dashboard';
import UserDirectory from '../../pages/admin/UserDirectory';
import Attendance from '../../pages/admin/Attendance';
import Holidays from '../../pages/admin/Holidays';
import ActionHub from '../../pages/admin/ActionHub';
import MyAttendance from '../../pages/admin/MyAttendance';

import ProjectApprovals from '../../pages/admin/ProjectApprovals';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="project-approvals" element={<ProjectApprovals />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="action-hub" element={<ActionHub />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
