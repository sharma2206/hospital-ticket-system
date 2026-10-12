import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught React Error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-5">
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                            <AlertCircle size={30} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Application Exception</h2>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                An unexpected UI component error occurred while rendering this view.
                            </p>
                        </div>

                        {this.state.error?.message && (
                            <div className="p-3 bg-slate-900/80 rounded-lg text-left text-xs font-mono text-rose-300 border border-slate-800 overflow-x-auto max-h-32">
                                {this.state.error.message}
                            </div>
                        )}

                        <div className="flex items-center gap-3 justify-center pt-2">
                            <button
                                type="button"
                                onClick={this.handleReload}
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                            >
                                <RefreshCw size={14} /> Reload Page
                            </button>
                            <button
                                type="button"
                                onClick={this.handleGoHome}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                            >
                                <Home size={14} /> Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
