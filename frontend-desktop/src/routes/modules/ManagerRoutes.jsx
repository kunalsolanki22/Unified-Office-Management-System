import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';
import Dashboard from '../../pages/manager/Dashboard';

const ManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<ManagerLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default ManagerRoutes;
