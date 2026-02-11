import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Dashboard from '../../pages/team-lead/Dashboard';
import { ROUTES } from '../../constants/routes';

const TeamLeadRoutes = () => {
    return (
        <Routes>
            {/* Using MainLayout for Team Lead */}
            <Route element={<MainLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default TeamLeadRoutes;
