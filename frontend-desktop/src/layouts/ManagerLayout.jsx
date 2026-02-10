import { Outlet } from 'react-router-dom';
import Sidebar from '../components/manager/Sidebar';
import Header from '../components/manager/Header';

const ManagerLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased overflow-x-hidden">
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

export default ManagerLayout;