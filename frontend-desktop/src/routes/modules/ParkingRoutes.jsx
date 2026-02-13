import { Routes, Route, Navigate } from 'react-router-dom';
import ParkingLayout from '../../layouts/ParkingLayout';

import ParkingDashboard from '../../pages/parking/ParkingDashboard';
import ParkingSlots from '../../pages/parking/ParkingSlots';
import ParkingRequests from '../../pages/parking/ParkingRequests';
import Holidays from '../../pages/parking/Holidays';

const ParkingRoutes = () => {
    return (
        <Routes>
            <Route element={<ParkingLayout />}>
                <Route path="dashboard" element={<ParkingDashboard />} />
                <Route path="slots" element={<ParkingSlots />} />
                <Route path="requests" element={<ParkingRequests />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
                <Route path="user-directory" element={<div className="p-8 text-[#1a367c] font-bold">User Directory — Coming Soon</div>} />
                <Route path="attendance" element={<div className="p-8 text-[#1a367c] font-bold">Attendance — Coming Soon</div>} />
                <Route path="my-attendance" element={<div className="p-8 text-[#1a367c] font-bold">My Attendance — Coming Soon</div>} />
                <Route path="services" element={<div className="p-8 text-[#1a367c] font-bold">Services — Coming Soon</div>} />
            </Route>
        </Routes>
    );
};

export default ParkingRoutes;