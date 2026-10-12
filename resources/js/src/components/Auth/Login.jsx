import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Hospital,
    Mail,
    Lock,
    ArrowRight,
    Eye,
    EyeOff,
    ShieldCheck,
    UserCheck,
    Wrench,
    User,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError("Please fill in all credentials");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await login(form.email, form.password);
            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickFill = (email, password = "password") => {
        setForm({ email, password });
        setError("");
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Ambient Background Gradient Glows */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Brand Logo Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-400 text-white shadow-lg shadow-cyan-600/30 mb-4 ring-4 ring-cyan-500/20">
                        <Hospital size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        HIMS IT Service Desk
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Enterprise Hospital Ticket & Asset Operations
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
                    {error && (
                        <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0 text-rose-400" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                                Staff Email
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-600 bg-slate-900/60 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                    placeholder="name@hospital.org"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-600 bg-slate-900/60 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign In to Desk</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Fill Buttons */}
                    <div className="mt-8 pt-5 border-t border-slate-700/60 text-center">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1.5">
                            <ShieldCheck size={13} className="text-cyan-400" />
                            Quick Demo Fill
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => handleQuickFill("admin@example.com")}
                                className="px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/60 flex items-center justify-center gap-1.5 transition text-left"
                            >
                                <ShieldCheck size={13} className="text-cyan-400 shrink-0" />
                                <span className="font-medium truncate">Super Admin</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickFill("it1@example.com")}
                                className="px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/60 flex items-center justify-center gap-1.5 transition text-left"
                            >
                                <Wrench size={13} className="text-teal-400 shrink-0" />
                                <span className="font-medium truncate">IT Technician</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickFill("billing@example.com")}
                                className="px-3 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/60 flex items-center justify-center gap-1.5 transition text-left col-span-2"
                            >
                                <User size={13} className="text-indigo-400 shrink-0" />
                                <span className="font-medium truncate">Hospital Staff (Billing)</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-6 text-xs text-slate-500">
                    Hospital IT Operations & Ticketing Platform • HIPAA / NABH Compliant
                </div>
            </div>
        </div>
    );
}
