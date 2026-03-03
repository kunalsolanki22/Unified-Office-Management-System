import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="layout-auth">
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default AuthLayout;
