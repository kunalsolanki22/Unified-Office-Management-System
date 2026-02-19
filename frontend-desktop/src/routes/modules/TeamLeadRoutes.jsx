import { Routes, Route, Navigate } from 'react-router-dom';
import TeamLeadLayout from '../../layouts/TeamLeadLayout';
import Dashboard from '../../pages/team-lead/Dashboard';
import MyAttendance from '../../pages/team-lead/MyAttendance';
import Approvals from '../../pages/team-lead/Approvals';


const TeamLeadRoutes = () => {
    return (
        <Routes>
            {/* Using TeamLeadLayout for Team Lead */}
            <Route element={<TeamLeadLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
        </Routes>
    );
};

export default TeamLeadRoutes;
