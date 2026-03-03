import { useAuth } from '../../context/AuthContext';

import ProfileDropdown from '../shared/ProfileDropdown';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="h-[90px] flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-transparent pt-2.5 mb-8">
            <div>
                <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">
                    Conference & Desk Manager Portal
                </p>
                <h2 className="text-[1.1rem] text-[#1a367c] font-bold">Have a good day 😊</h2>
            </div>

            <div className="flex items-center gap-6">
                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;
