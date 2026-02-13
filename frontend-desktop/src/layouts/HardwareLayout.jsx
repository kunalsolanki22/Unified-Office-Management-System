import { Outlet } from 'react-router-dom';
import HardwareSidebar from '../components/hardware/HardwareSidebar';
import Header from '../components/manager/Header';

const HardwareLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-[#f4f7f6] text-[#333] font-sans">
            <HardwareSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header outside scroll — fixes notification dropdown clipping */}
                <div className="bg-white px-10">
                    <Header />
                </div>
                {/* Only content scrolls */}
                <main className="flex-1 overflow-y-auto bg-white px-10 pb-20">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default HardwareLayout;