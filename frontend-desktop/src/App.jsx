import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import AIChatWidget from './components/ui/AIChatWidget';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
            <AIChatWidget />
            <ToastContainer position="top-right" autoClose={3000} />
        </AuthProvider>
    );
}

export default App;
