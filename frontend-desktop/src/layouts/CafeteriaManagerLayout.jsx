
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/cafeteria-manager/Sidebar';
import Header from '../components/cafeteria-manager/Header';

const CafeteriaManagerLayout = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
                    <div className="container mx-auto px-6 py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CafeteriaManagerLayout;
