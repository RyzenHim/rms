import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiArrowLeft, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../../services/api";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">Invalid or missing reset token</p>
                    <button
                        onClick={() => navigate("/auth/login")}
                        className="text-slate-300 hover:text-white font-semibold"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            if (!password.trim() || !confirmPassword.trim()) {
                setMessageType("error");
                setMessage("Both password fields are required");
                return;
            }

            if (password.length < 6) {
                setMessageType("error");
                setMessage("Password must be at least 6 characters long");
                return;
            }

            if (password !== confirmPassword) {
                setMessageType("error");
                setMessage("Passwords do not match");
                return;
            }

            const { data } = await api.post("/auth/reset-password", {
                token,
                password,
                confirmPassword,
            });

            setMessageType("success");
            setMessage(data.message || "Password reset successfully");
            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigate("/auth/login");
            }, 2000);
        } catch (error) {
            setMessageType("error");
            setMessage(error?.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <button
                    onClick={() => navigate("/auth/login")}
                    className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors"
                >
                    <FiArrowLeft className="h-5 w-5" />
                    Back to Login
                </button>

                <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-slate-700/50 rounded-full">
                                <FiLock className="h-8 w-8 text-slate-300" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                        <p className="text-slate-400">Enter your new password below</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <FiEyeOff className="h-5 w-5" />
                                    ) : (
                                        <FiEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                    className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <FiEyeOff className="h-5 w-5" />
                                    ) : (
                                        <FiEye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {message && (
                            <div
                                className={`p-3 rounded-lg text-sm ${messageType === "success"
                                    ? "bg-slate-700/50 text-slate-300 border border-slate-600"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                    }`}
                            >
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-slate-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

