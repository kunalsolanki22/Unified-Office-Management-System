import { Routes, Route, Navigate } from 'react-router-dom';
import AttendanceManagerLayout from '../../layouts/AttendanceManagerLayout';

// Pages
import Dashboard from '../../pages/attendance-manager/Dashboard';
import UserDirectory from '../../pages/shared/UserDirectory';
import Attendance from '../../pages/attendance-manager/Attendance';
import Approvals from '../../pages/attendance-manager/Approvals';
import Holidays from '../../pages/attendance-manager/Holidays';
import ActionHub from '../../pages/attendance-manager/ActionHub';
import MyAttendance from '../../pages/attendance-manager/MyAttendance';
import ServiceBooking from '../../pages/shared/ServiceBooking';

const AttendanceManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<AttendanceManagerLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admin" element={<UserDirectory />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="action-hub" element={<ActionHub />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="service-booking" element={<ServiceBooking />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default AttendanceManagerRoutes;
