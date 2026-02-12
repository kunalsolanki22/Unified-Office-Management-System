import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

import HardwareDashboard from '../../pages/manager/HardwareDashboard';
import HardwareRequests from '../../pages/manager/HardwareRequests';
import HardwareAssets from '../../pages/manager/HardwareAssets';
import HardwareVendors from '../../pages/manager/HardwareVendors';
import ParkingDashboard from '../../pages/manager/ParkingDashboard';
import ParkingSlots from '../../pages/manager/ParkingSlots';
import ParkingRequests from '../../pages/manager/ParkingRequests';
import Holidays from '../../pages/manager/Holidays';

const ManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<ManagerLayout />}>
                <Route path="dashboard" element={<HardwareDashboard />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="hardware/dashboard" element={<HardwareDashboard />} />
                <Route path="hardware/requests" element={<HardwareRequests />} />
                <Route path="hardware/assets" element={<HardwareAssets />} />
                <Route path="hardware/vendors" element={<HardwareVendors />} />
                <Route path="parking/dashboard" element={<ParkingDashboard />} />
                <Route path="parking/slots" element={<ParkingSlots />} />
                <Route path="parking/requests" element={<ParkingRequests />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default ManagerRoutes;