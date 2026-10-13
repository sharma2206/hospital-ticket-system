import React from "react";

export default function PageHeader({
    title,
    subtitle,
    icon: Icon,
    actions,
    breadcrumbs,
}) {
    return (
        <div className="page-header">
            <div className="page-header-title-wrap">
                {breadcrumbs && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">
                        {breadcrumbs}
                    </div>
                )}
                <div className="page-title-row">
                    {Icon && (
                        <div className="page-title-icon">
                            <Icon size={20} strokeWidth={2.2} />
                        </div>
                    )}
                    <h1 className="page-title">{title}</h1>
                </div>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>

            {actions && <div className="page-actions">{actions}</div>}
        </div>
    );
}
