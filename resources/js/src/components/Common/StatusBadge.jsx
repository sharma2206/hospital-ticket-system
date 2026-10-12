import React from 'react';

const STATUS_VARIANTS = {
    // Ticket Statuses
    open: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/60' },
    in_progress: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800/60' },
    pending: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800/60' },
    resolved: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/60' },
    closed: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    
    // Priorities
    low: { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    medium: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/60' },
    high: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800/60' },
    critical: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-600', border: 'border-rose-200 dark:border-rose-800/60' },
    
    // KareXpert
    raised: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500', border: 'border-sky-200 dark:border-sky-800/60' },
    acknowledged: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500', border: 'border-teal-200 dark:border-teal-800/60' },
    karexpert_working: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800/60' },
    awaiting_deployment: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800/60' },
    deployed: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/60' },

    // Assets
    active: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/60' },
    inactive: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    maintenance: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/60' },
    retired: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-800/60' },
};

export default function StatusBadge({
    value,
    label,
    color,
    size = 'md', // sm, md
    showDot = true,
}) {
    const key = (value || '').toString().toLowerCase().replace(/[\s-]/g, '_');
    const variant = STATUS_VARIANTS[key];
    const displayLabel = label || value?.toString().replace(/_/g, ' ') || 'Unknown';

    // If explicit hex/rgb color is passed from DB
    if (color && !variant) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${
                    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.8 text-xs'
                }`}
                style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    borderColor: `${color}35`,
                }}
            >
                {showDot && (
                    <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                    />
                )}
                <span className="capitalize">{displayLabel}</span>
            </span>
        );
    }

    const {
        bg = 'bg-slate-100 dark:bg-slate-800',
        text = 'text-slate-700 dark:text-slate-300',
        dot = 'bg-slate-400',
        border = 'border-slate-200 dark:border-slate-700',
    } = variant || {};

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bg} ${text} ${border} ${
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'
            }`}
        >
            {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
            <span className="capitalize">{displayLabel}</span>
        </span>
    );
}
