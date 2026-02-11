import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../constants/routes";
import { ROLES } from "../../constants/roles";
import eyeIcon from "../../assets/eye.png";
import eyeCrossIcon from "../../assets/eyecross.png";
import loginIllustration from "../../assets/login-cygnet.svg";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth(); // Use the login function from AuthContext

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const handleLogin = () => {
        setError("");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setError("Email is required");
            return;
        }
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address");
            return;
        }

        if (!password) {
            setError("Password is required");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        // AUTH LOGIC Integration
        let role = ROLES.MANAGER; // Default
        if (email.includes('super')) role = ROLES.SUPER_ADMIN;
        else if (email.includes('admin')) role = ROLES.ADMIN;
        else if (email.includes('team')) role = ROLES.TEAM_LEAD;
        else if (email.includes('attendance')) role = ROLES.ATTENDANCE_MANAGER;
        else if (email.includes('cafeteria')) role = ROLES.MANAGER;

        login({ email, role });

        toast.success("Login successful");

        // REDIRECT BASED ON ROLE
        switch (role) {
            case ROLES.SUPER_ADMIN:
                navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
                break;
            case ROLES.ADMIN:
                navigate(ROUTES.ADMIN_DASHBOARD);
                break;
            case ROLES.MANAGER:
                navigate(ROUTES.MANAGER_DASHBOARD);
                break;
            case ROLES.TEAM_LEAD:
                navigate(ROUTES.TEAM_LEAD_DASHBOARD);
                break;
            case ROLES.ATTENDANCE_MANAGER:
                navigate('/attendance-manager/dashboard');
                break;
            default:
                navigate(ROUTES.UNAUTHORIZED);
        }
    };

    const handleForgotPassword = () => {
        toast.info("Password reset link sent to your registered email");
    };

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="h-screen w-screen flex bg-slate-100 overflow-hidden">
            {/* Left Illustration (Desktop only) */}
            <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-blue-50">
                {/* Logo and illustration container - expanded to fill space */}
                <img
                    src={loginIllustration}
                    alt="Office Management Illustration"
                    onError={(e) => { e.target.style.display = 'none' }}
                    className="w-full h-full object-cover transform scale-110"
                />
                {/* Fallback Text if image missing */}
                <div className="absolute text-center p-10 pointer-events-none md:hidden lg:hidden xl:hidden 2xl:hidden block">
                    <h2 className="text-4xl font-bold text-blue-800">Unified Office</h2>
                    <p className="text-gray-600 mt-4">Manage your workspace seamlessly.</p>
                </div>
            </div>

            {/* Right Login Panel */}
            <div className="w-full md:max-w-md bg-white pb-20 flex items-center justify-center shadow-xl h-full ml-auto">
                <div className="w-full px-6 sm:px-10 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl text-gray-800">
                            <span className="font-semibold">Unified</span>
                            <span className="font-extrabold text-yellow-400">.</span>
                            <span className="font-normal">Office</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">By Cygnet.One</p>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                            ref={emailRef}
                            type="email"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                            placeholder="you@cygnet.one"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    passwordRef.current.focus();
                                }
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-2 relative">
                        <label className="block text-sm text-gray-600 mb-1">Password</label>

                        <input
                            ref={passwordRef}
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleLogin();
                                }
                            }}
                        />

                        <button
                            type="button"
                            onClick={togglePassword}
                            className="absolute right-3 top-9 focus:outline-none"
                        >
                            <img
                                src={showPassword ? eyeCrossIcon : eyeIcon}
                                alt="Toggle visibility"
                                className="w-5 h-5 opacity-70 hover:opacity-100 transition-opacity"
                            />
                        </button>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right mb-4">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Error */}
                    {error && <p className="text-sm text-red-500 mb-4 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        disabled={!email || !password}
                        className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 transform active:scale-95 ${!email || !password
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
                            }`}
                    >
                        Login
                    </button>

                    {/* Footer */}
                    <p className="text-xs text-gray-400 text-center mt-8">
                        © Cygnet Infotech Pvt. Ltd.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
