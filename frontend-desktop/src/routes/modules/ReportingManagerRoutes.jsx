import { Routes, Route, Navigate } from 'react-router-dom';
import ReportingManagerLayout from '../../layouts/ReportingManagerLayout';
import Dashboard from '../../pages/reporting-manager/Dashboard';
import UserDirectory from '../../pages/shared/UserDirectory';
import AttendanceValidation from '../../pages/reporting-manager/AttendanceValidation';
import Approvals from '../../pages/reporting-manager/Approvals';
import ProjectProposal from '../../pages/reporting-manager/ProjectProposal';
import Holidays from '../../pages/reporting-manager/Holidays';
import PlaceholderPage from '../../pages/reporting-manager/PlaceholderPage';
import ActionHub from '../../pages/reporting-manager/ActionHub';
import MyAttendance from '../../pages/reporting-manager/MyAttendance';
import ServiceBooking from '../../pages/shared/ServiceBooking';

const ReportingManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<ReportingManagerLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="attendance-validation" element={<AttendanceValidation />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="project-proposal" element={<ProjectProposal />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="action-hub" element={<ActionHub />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="service-booking" element={<ServiceBooking />} />
                <Route path="placeholder" element={<PlaceholderPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default ReportingManagerRoutes;
