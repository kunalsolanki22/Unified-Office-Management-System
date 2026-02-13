import { Routes, Route, Navigate } from 'react-router-dom';
import ConferenceDeskManagerLayout from '../../layouts/ConferenceDeskManagerLayout';

// Pages
import Dashboard from '../../pages/conference-desk-manager/Dashboard';
import UserDirectory from '../../pages/conference-desk-manager/UserDirectory';
import Attendance from '../../pages/conference-desk-manager/Attendance';
import Approvals from '../../pages/conference-desk-manager/Approvals';
import Holidays from '../../pages/conference-desk-manager/Holidays';
import ActionHub from '../../pages/conference-desk-manager/ActionHub';
import MyAttendance from '../../pages/conference-desk-manager/MyAttendance';
import DeskBooking from '../../pages/conference-desk-manager/DeskBooking';
import ConferenceBooking from '../../pages/conference-desk-manager/ConferenceBooking';

const ConferenceDeskManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<ConferenceDeskManagerLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="action-hub" element={<ActionHub />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="desk-booking" element={<DeskBooking />} />
                <Route path="conference-booking" element={<ConferenceBooking />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default ConferenceDeskManagerRoutes;
