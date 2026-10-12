import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';

export default function ConfirmDialog({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // danger, warning, primary
    isLoading = false,
    onConfirm,
    onCancel,
}) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <AlertCircle className="w-6 h-6 text-red-500" />,
            iconBg: 'bg-red-50 dark:bg-red-950/40 text-red-600',
            btnClass: 'btn btn-danger',
        },
        warning: {
            icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
            iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600',
            btnClass: 'btn btn-warning',
        },
        primary: {
            icon: <HelpCircle className="w-6 h-6 text-blue-500" />,
            iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600',
            btnClass: 'btn btn-primary',
        },
    };

    const currentStyle = variantStyles[variant] || variantStyles.primary;

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div
                className="modal-container max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start gap-3 p-5">
                    <div className={`p-2.5 rounded-xl shrink-0 ${currentStyle.iconBg}`}>
                        {currentStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors"
                        disabled={isLoading}
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl">
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`${currentStyle.btnClass} btn-sm`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
