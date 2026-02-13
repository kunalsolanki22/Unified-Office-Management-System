import { Routes, Route, Navigate } from 'react-router-dom';
import HardwareLayout from '../../layouts/HardwareLayout';
import HardwareDashboard from '../../pages/hardware/HardwareDashboard';
import HardwareRequests from '../../pages/hardware/HardwareRequests';
import HardwareAssets from '../../pages/hardware/HardwareAssets';
import HardwareVendors from '../../pages/hardware/HardwareVendors';
import Holidays from '../../pages/hardware/Holidays';

const HardwareRoutes = () => {
    return (
        <Routes>
            <Route element={<HardwareLayout />}>
                <Route path="dashboard" element={<HardwareDashboard />} />
                <Route path="requests" element={<HardwareRequests />} />
                <Route path="assets" element={<HardwareAssets />} />
                <Route path="vendors" element={<HardwareVendors />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default HardwareRoutes;