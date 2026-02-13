import { Routes, Route, Navigate } from 'react-router-dom';
import ParkingLayout from '../../layouts/ParkingLayout';

// Parking specific pages
import ParkingDashboard from '../../pages/parking/ParkingDashboard';
import ParkingSlots from '../../pages/parking/ParkingSlots';
import ParkingRequests from '../../pages/parking/ParkingRequests';
import Holidays from '../../pages/parking/Holidays';

// Shared pages from reporting-manager (reuse Akanksha's work)
import UserDirectory from '../../pages/reporting-manager/UserDirectory';
import Attendance from '../../pages/reporting-manager/AttendanceValidation';
import MyAttendance from '../../pages/reporting-manager/MyAttendance';
import Services from '../../pages/reporting-manager/ActionHub';

const ParkingRoutes = () => {
    return (
        <Routes>
            <Route element={<ParkingLayout />}>
                <Route path="dashboard"      element={<ParkingDashboard />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="attendance"     element={<Attendance />} />
                <Route path="requests"       element={<ParkingRequests />} />
                <Route path="slots"          element={<ParkingSlots />} />
                <Route path="holidays"       element={<Holidays />} />
                <Route path="my-attendance"  element={<MyAttendance />} />
                <Route path="services"       element={<Services />} />
                <Route path="*"              element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default ParkingRoutes;