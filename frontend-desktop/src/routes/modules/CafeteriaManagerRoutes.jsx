import { Routes, Route, Navigate } from 'react-router-dom';
import CafeteriaManagerLayout from '../../layouts/CafeteriaManagerLayout';

// Pages
import Dashboard from '../../pages/cafeteria-manager/Dashboard';
import MenuManagement from '../../pages/cafeteria-manager/MenuManagement';
import Orders from '../../pages/cafeteria-manager/Orders';

const CafeteriaManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<CafeteriaManagerLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="orders" element={<Orders />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default CafeteriaManagerRoutes;
