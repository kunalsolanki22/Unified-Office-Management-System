import { Routes, Route, Navigate } from 'react-router-dom';
import CafeteriaManagerLayout from '../../layouts/CafeteriaManagerLayout';

// Pages
import Dashboard from '../../pages/cafeteria-manager/Dashboard';
import FoodManagement from '../../pages/cafeteria-manager/FoodManagement';
import DeskManagement from '../../pages/cafeteria-manager/DeskManagement';
import UserDirectory from '../../pages/cafeteria-manager/UserDirectory';
import Attendance from '../../pages/super-admin/Attendance'; // Reused for Attendance
import Approvals from '../../pages/attendance-manager/Approvals'; // Reused for Approvals
import Holidays from '../../pages/cafeteria-manager/Holidays'; // Dedicated Page
import MyAttendance from '../../pages/attendance-manager/MyAttendance'; // Reused for My Attendance
import ActionHub from '../../pages/super-admin/ActionHub'; // Reused for Services

const CafeteriaManagerRoutes = () => {
    return (
        <Routes>
            <Route element={<CafeteriaManagerLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="user-directory" element={<UserDirectory />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="holidays" element={<Holidays />} />
                <Route path="food-management" element={<FoodManagement />} />
                <Route path="desk-management" element={<DeskManagement />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="services" element={<ActionHub />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default CafeteriaManagerRoutes;
