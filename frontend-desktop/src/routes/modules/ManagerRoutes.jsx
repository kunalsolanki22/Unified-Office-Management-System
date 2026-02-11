import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Dashboard from '../../pages/manager/Dashboard';
import { ROUTES } from '../../constants/routes';

const ManagerRoutes = () => {
    return (
        <Routes>
            {/* Using MainLayout for Manager, similar to original AppRoutes structure */}
            <Route element={<MainLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default ManagerRoutes;
