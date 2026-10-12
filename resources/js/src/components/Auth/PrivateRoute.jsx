import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Hospital, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute() {
    const { user, loading } = useAuth();
    const [timeoutReached, setTimeoutReached] = useState(false);

    // Timeout safety fallback: if loading doesn't finish within 4s, break out to login
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => setTimeoutReached(true), 4000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    if (loading && !timeoutReached) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Hospital size={28} />
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-300 text-sm font-medium">
                        <Loader2 size={18} className="animate-spin text-cyan-500" />
                        <span>Loading HIMS IT Support...</span>
                    </div>
                </div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}
