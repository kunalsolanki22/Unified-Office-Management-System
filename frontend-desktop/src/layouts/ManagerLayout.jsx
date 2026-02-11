import { Outlet } from 'react-router-dom';
import Sidebar from '../components/manager/Sidebar';
import Header from '../components/manager/Header';

const ManagerLayout = () => {
    return (
        <div className="flex min-h-screen bg-[#f8f9fa]">
            <div className="sticky top-0 h-screen">
                <Sidebar />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8">
                    <Header />
                </div>
                <main className="flex-1 px-8 pb-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManagerLayout;