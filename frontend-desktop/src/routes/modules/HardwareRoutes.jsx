import { Routes, Route, Navigate } from 'react-router-dom';
import HardwareLayout from '../../layouts/HardwareLayout';
<<<<<<< HEAD
=======

// Hardware specific pages
>>>>>>> recovery
import HardwareDashboard from '../../pages/hardware/HardwareDashboard';
import HardwareRequests from '../../pages/hardware/HardwareRequests';
import HardwareAssets from '../../pages/hardware/HardwareAssets';
import HardwareVendors from '../../pages/hardware/HardwareVendors';
import Holidays from '../../pages/hardware/Holidays';

<<<<<<< HEAD
=======
// Shared pages from reporting-manager (reuse Akanksha's work)
import UserDirectory from '../../pages/reporting-manager/UserDirectory';
import Attendance from '../../pages/reporting-manager/AttendanceValidation';
import MyAttendance from '../../pages/reporting-manager/MyAttendance';
import Services from '../../pages/reporting-manager/ActionHub';

>>>>>>> recovery
const HardwareRoutes = () => {
    return (
        <Routes>
            <Route element={<HardwareLayout />}>
                <Route path="dashboard" element={<HardwareDashboard />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="requests" element={<HardwareRequests />} />
                <Route path="assets" element={<HardwareAssets />} />
                <Route path="vendors" element={<HardwareVendors />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="services" element={<Services />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default HardwareRoutes;