import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerLayout from '../../layouts/ManagerLayout';

const ManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<ManagerLayout />}>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
        </Routes>
    );
};

export default ManagerRoutes;