import { Outlet } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import Header from '../components/admin/Header';

const AdminLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-[#333] font-sans">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-white px-10 transition-all duration-300">
                <Header />
                <main className="flex-1 py-8 animate-fade-in pb-20">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
