import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({
    title,
    value,
    icon: Icon,
    color = '#2563eb', // Default blue
    sub,
    trend,
    isLoading = false,
    onClick,
}) {
    if (isLoading) {
        return (
            <div className="metric-card">
                <div className="metric-card-top">
                    <div className="skeleton" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem' }} />
                    <div className="skeleton" style={{ width: '45px', height: '18px', borderRadius: '999px' }} />
                </div>
                <div className="skeleton skeleton-text" style={{ width: '60%', height: '12px', marginBottom: '0.4rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%', height: '28px', marginBottom: '0.4rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '75%', height: '10px' }} />
            </div>
        );
    }

    return (
        <div
            className={`metric-card ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div className="metric-card-top">
                <div
                    className="metric-icon-wrap"
                    style={{
                        backgroundColor: `${color}18`,
                        color: color,
                    }}
                >
                    {Icon ? <Icon size={20} strokeWidth={2.2} /> : null}
                </div>

                {trend && (
                    <span
                        className="metric-trend-pill"
                        style={{
                            backgroundColor: trend.isPositive !== false ? '#dcfce7' : '#fee2e2',
                            color: trend.isPositive !== false ? '#15803d' : '#b91c1c',
                        }}
                    >
                        {trend.isPositive !== false ? (
                            <TrendingUp size={12} strokeWidth={2.5} />
                        ) : (
                            <TrendingDown size={12} strokeWidth={2.5} />
                        )}
                        <span>{typeof trend === 'object' ? trend.value : trend}</span>
                    </span>
                )}
            </div>

            <div className="metric-title">{title}</div>
            
            <div className="metric-value">
                {value !== null && value !== undefined ? value : '—'}
            </div>

            {sub && <div className="metric-sub">{sub}</div>}
        </div>
    );
}
