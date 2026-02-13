import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="layout-main">
            <header>Header Component</header>
            <div className="layout-body">
                <aside>Sidebar Component</aside>
                <main>
                    <Outlet />
                </main>
            </div>
            <footer>Footer Component</footer>
        </div>
    );
};

export default MainLayout;
