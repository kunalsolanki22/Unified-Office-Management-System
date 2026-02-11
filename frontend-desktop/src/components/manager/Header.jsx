import NotificationBell from './NotificationBell';

const Header = () => {
    return (
        <header className="h-[90px] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-100 border-b border-transparent pt-5">
            <div>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5">
                    MANAGER PORTAL
                </p>
                <h2 className="text-[1.1rem] text-[#1a367c] font-bold">
                    Have a good day 😊
                </h2>
            </div>

            <div className="flex items-center gap-5">
                <NotificationBell />
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-[0.75rem] font-bold text-[#1a367c]">IT MANAGER</div>
                        <div className="text-[0.65rem] text-[#f9b012] font-semibold">Hardware & Parking</div>
                    </div>
                    <div className="w-10 h-10 bg-[#1a367c] text-white rounded-full flex items-center justify-center font-semibold">
                        PM
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;