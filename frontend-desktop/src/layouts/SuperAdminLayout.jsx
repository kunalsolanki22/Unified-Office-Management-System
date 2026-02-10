import { Outlet } from 'react-router-dom';
import Sidebar from '../components/super-admin/Sidebar';
import Header from '../components/super-admin/Header';

const SuperAdminLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            <Sidebar />
            <div className="pl-64 transition-all">
                <Header />
                <main className="p-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SuperAdminLayout;
