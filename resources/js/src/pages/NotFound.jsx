import { Link } from "react-router-dom";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center mb-2 shadow-sm border border-cyan-100 dark:border-cyan-900/50">
                <FileQuestion size={40} />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">404</h1>
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">Page Not Found</p>
            <p className="text-xs text-slate-400 max-w-sm mb-2">
                The requested URL or operational screen does not exist or has been relocated.
            </p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition shadow-sm">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>
        </div>
    );
}
