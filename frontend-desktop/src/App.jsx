import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
    );
}

export default App;
