import { Outlet } from 'react-router-dom';
import Sidebar from '../components/conference-desk-manager/Sidebar';
import Header from '../components/conference-desk-manager/Header';

const ConferenceDeskManagerLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-[#333] font-sans">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-white px-10 transition-all duration-300">
                <Header />
                <main className="flex-1 py-8 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ConferenceDeskManagerLayout;
