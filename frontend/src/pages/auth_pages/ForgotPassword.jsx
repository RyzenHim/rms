import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import api from "../../services/api";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            if (!email.trim()) {
                setMessageType("error");
                setMessage("Email is required");
                return;
            }

            const { data } = await api.post("/auth/forgot-password", { email });
            setMessageType("success");
            setMessage(data.message);
            setEmail("");
        } catch (error) {
            setMessageType("error");
            setMessage(error?.response?.data?.message || "Failed to process request");
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
                                <FiMail className="h-8 w-8 text-slate-300" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Forgot Password?</h1>
                        <p className="text-slate-400 text-sm">
                            Enter your email to receive a password reset link
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                disabled={loading}
                                className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-colors disabled:opacity-50"
                            />
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
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;


