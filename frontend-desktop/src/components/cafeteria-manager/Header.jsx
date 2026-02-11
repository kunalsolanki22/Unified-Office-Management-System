
const Header = () => {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
                <button className="text-gray-500 focus:outline-none lg:hidden">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
            <div className="flex items-center">
                <div className="relative">
                    <button className="flex items-center text-gray-500 hover:text-gray-700 focus:outline-none">
                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">Cafeteria Manager</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
