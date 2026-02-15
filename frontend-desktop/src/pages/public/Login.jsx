import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import eyeIcon from "../../assets/eye.png";
import eyeCrossIcon from "../../assets/eyecross.png";
import loginIllustration from "../../assets/login-cygnet.svg";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, user, getRedirectPath } = useAuth();
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    useEffect(() => {
        if (user) navigate(getRedirectPath(user));
    }, [user]);

    const handleLogin = async () => {
        setError("");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) { setError("Email is required"); return; }
        if (!emailRegex.test(email)) { setError("Please enter a valid email address"); return; }
        if (!password) { setError("Password is required"); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters long"); return; }

        setLoading(true);
        try {
            const userData = await login(email, password);
            toast.success("Login successful");
            navigate(getRedirectPath(userData));
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex bg-slate-100 overflow-hidden">
            <div className="hidden md:flex flex-1 flex-col overflow-hidden bg-blue-50">
                <img
                    src={loginIllustration}
                    alt="Office Management Illustration"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    className="w-full h-full object-cover transform scale-110"
                />
            </div>
            <div className="w-full md:max-w-md bg-white pb-20 flex items-center justify-center shadow-xl h-full ml-auto">
                <div className="w-full px-6 sm:px-10 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl text-gray-800">
                            <span className="font-semibold">Unified</span>
                            <span className="font-extrabold text-yellow-400">.</span>
                            <span className="font-normal">Office</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">By Cygnet.One</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                            ref={emailRef}
                            type="email"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                            placeholder="you@cygnet.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") passwordRef.current.focus(); }}
                        />
                    </div>
                    <div className="mb-2 relative">
                        <label className="block text-sm text-gray-600 mb-1">Password</label>
                        <input
                            ref={passwordRef}
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 focus:outline-none">
                            <img src={showPassword ? eyeCrossIcon : eyeIcon} alt="Toggle" className="w-5 h-5 opacity-70 hover:opacity-100" />
                        </button>
                    </div>
                    <div className="text-right mb-4">
                        <button type="button" className="text-sm text-blue-600 hover:underline">Forgot password?</button>
                    </div>
                    {error && (
                        <p className="text-sm text-red-500 mb-4 bg-red-50 p-2 rounded border border-red-100">{error}</p>
                    )}
                    <button
                        onClick={handleLogin}
                        disabled={!email || !password || loading}
                        className={`w-full py-2.5 rounded-lg font-medium transition-all duration-200 ${
                            !email || !password || loading
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                        }`}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-8">© Cygnet Infotech Pvt. Ltd.</p>
                </div>
            </div>
        </div>
    );
}

export default Login;