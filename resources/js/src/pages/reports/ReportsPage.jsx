import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    FileBarChart2,
    RefreshCw,
    TrendingUp,
    Shield,
    Users,
    Monitor,
    Star,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import api from "../../services/api";

import PageHeader from "../../components/Shared/PageHeader";
import MetricCard from "../../components/Shared/MetricCard";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#0284c7"];

const periodOptions = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
];

function StatBox({ label, value, sub, color, icon }) {
    return (
        <MetricCard
            title={label}
            value={value}
            sub={sub}
            color={color || "#2563eb"}
            icon={icon}
        />
    );
}

function SectionCard({ icon, title, children, error }) {
    return (
        <div className="card">
            <div className="card-header">
                <div
                    className="card-title"
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                    {icon} {title}
                </div>
            </div>
            <div className="card-body">
                {error ? (
                    <div
                        style={{
                            padding: "1rem",
                            textAlign: "center",
                            color: "var(--danger)",
                            fontSize: "0.85rem",
                        }}
                    >
                        Failed to load — {error}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    const [days, setDays] = useState(30);

    const params = {
        from_date: new Date(Date.now() - days * 86400000)
            .toISOString()
            .slice(0, 10),
        to_date: new Date().toISOString().slice(0, 10),
    };

    const tickets = useQuery({
        queryKey: ["report-tickets", days],
        queryFn: () =>
            api.get("/reports/tickets", { params }).then((r) => r.data),
        retry: 1,
    });

    const sla = useQuery({
        queryKey: ["report-sla", days],
        queryFn: () =>
            api.get("/reports/sla", { params }).then((r) => r.data),
        retry: 1,
    });

    const technician = useQuery({
        queryKey: ["report-technician", days],
        queryFn: () =>
            api.get("/reports/technician", { params }).then((r) => r.data),
        retry: 1,
    });

    const satisfaction = useQuery({
        queryKey: ["report-satisfaction"],
        queryFn: () =>
            api.get("/reports/satisfaction").then((r) => r.data),
        retry: 1,
    });

    const assets = useQuery({
        queryKey: ["report-assets"],
        queryFn: () => api.get("/reports/assets").then((r) => r.data),
        retry: 1,
    });

    const refetchAll = () => {
        tickets.refetch();
        sla.refetch();
        technician.refetch();
        satisfaction.refetch();
        assets.refetch();
    };

    const t = tickets.data;
    const s = sla.data;
    const tech = technician.data;
    const sat = satisfaction.data;
    const asset = assets.data;

    return (
        <div className="page-container">
            <PageHeader
                title="Reports & Analytics"
                subtitle="Operational metrics, technician SLAs, and performance insights"
                icon={BarChart3}
                actions={
                    <div className="flex items-center gap-2">
                        <select
                            className="form-control"
                            style={{ maxWidth: "160px" }}
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                        >
                            {periodOptions.map((o) => (
                                <option key={o.days} value={o.days}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                            onClick={refetchAll}
                        >
                            <RefreshCw size={14} />
                            <span>Refresh</span>
                        </button>
                    </div>
                }
            />

            {/* Ticket Overview */}
            <SectionCard
                icon={<TrendingUp size={16} />}
                title="Ticket Overview"
                error={tickets.isError ? tickets.error?.message : null}
            >
                {tickets.isLoading ? (
                    <div className="skeleton skeleton-card" style={{ height: 80 }} />
                ) : (
                    <>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                gap: "0.85rem",
                                marginBottom: "1.25rem",
                            }}
                        >
                            <StatBox label="Total Tickets" value={t?.summary?.total} />
                            <StatBox label="Resolved" value={t?.summary?.resolved} color="#16a34a" />
                            <StatBox label="Closed" value={t?.summary?.closed} color="#64748b" />
                            <StatBox
                                label="SLA Breached"
                                value={t?.summary?.sla_breached}
                                color="#dc2626"
                            />
                            <StatBox label="Escalated" value={t?.summary?.escalated} color="#f59e0b" />
                            <StatBox
                                label="Avg Resolution"
                                value={
                                    t?.summary?.avg_resolution_min
                                        ? `${Math.round(t.summary.avg_resolution_min / 60)}h ${t.summary.avg_resolution_min % 60}m`
                                        : "—"
                                }
                                sub="Average resolution time"
                            />
                        </div>

                        {t?.trend?.length > 0 && (
                            <div>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        marginBottom: "0.75rem",
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    Ticket Volume Trend
                                </div>
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={t.trend}>
                                        <defs>
                                            <linearGradient id="tcg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#2563eb"
                                            fill="url(#tcg)"
                                            strokeWidth={2}
                                            name="Tickets"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {t?.by_priority?.length > 0 && (
                            <div style={{ marginTop: "1.25rem" }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        marginBottom: "0.75rem",
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    By Priority
                                </div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={t.by_priority}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                                        />
                                        <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                                        <Tooltip />
                                        <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                                            {t.by_priority.map((entry, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={entry.color || COLORS[i % COLORS.length]}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}
            </SectionCard>

            {/* SLA Compliance */}
            <SectionCard
                icon={<Shield size={16} />}
                title="SLA Compliance"
                error={sla.isError ? sla.error?.message : null}
            >
                {sla.isLoading ? (
                    <div className="skeleton skeleton-card" style={{ height: 80 }} />
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                            gap: "0.85rem",
                        }}
                    >
                        <StatBox label="Total Tickets" value={s?.summary?.total} />
                        <StatBox
                            label="Compliant"
                            value={s?.summary?.compliant}
                            color="#16a34a"
                        />
                        <StatBox
                            label="Breached"
                            value={s?.summary?.breached}
                            color="#dc2626"
                        />
                        <StatBox
                            label="Compliance Rate"
                            value={s?.summary?.compliance_rate}
                            color={
                                parseFloat(s?.summary?.compliance_rate) >= 80
                                    ? "#16a34a"
                                    : "#dc2626"
                            }
                        />
                    </div>
                )}
            </SectionCard>

            {/* Technician Performance */}
            <SectionCard
                icon={<Users size={16} />}
                title="Technician Performance"
                error={technician.isError ? technician.error?.message : null}
            >
                {technician.isLoading ? (
                    <div className="skeleton skeleton-card" style={{ height: 120 }} />
                ) : tech?.data?.length ? (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Technician</th>
                                    <th>Assigned</th>
                                    <th>Resolved</th>
                                    <th>SLA Breached</th>
                                    <th>Avg Resolution</th>
                                    <th>Resolution Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tech.data.map((row) => (
                                    <tr key={row.id}>
                                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                                        <td>{row.total_assigned}</td>
                                        <td>{row.resolved}</td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    row.sla_breached > 0
                                                        ? "badge-danger"
                                                        : "badge-success"
                                                }`}
                                            >
                                                {row.sla_breached}
                                            </span>
                                        </td>
                                        <td>
                                            {row.avg_resolution_min
                                                ? `${Math.round(row.avg_resolution_min / 60)}h ${row.avg_resolution_min % 60}m`
                                                : "—"}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    row.resolution_rate >= 80
                                                        ? "badge-success"
                                                        : row.resolution_rate >= 50
                                                        ? "badge-warning"
                                                        : "badge-danger"
                                                }`}
                                            >
                                                {row.resolution_rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem" }}>
                        No technician data for this period.
                    </div>
                )}
            </SectionCard>

            {/* Asset & Satisfaction */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                    gap: "1rem",
                }}
            >
                {/* Asset Report */}
                <SectionCard
                    icon={<Monitor size={16} />}
                    title="Asset Inventory"
                    error={assets.isError ? assets.error?.message : null}
                >
                    {assets.isLoading ? (
                        <div className="skeleton skeleton-card" style={{ height: 80 }} />
                    ) : (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                                gap: "0.75rem",
                            }}
                        >
                            <StatBox label="Total" value={asset?.summary?.total} />
                            <StatBox label="Active" value={asset?.summary?.active} color="#16a34a" />
                            <StatBox label="Maintenance" value={asset?.summary?.maintenance} color="#f59e0b" />
                            <StatBox label="Retired" value={asset?.summary?.retired} color="#64748b" />
                            <StatBox
                                label="Warranty Expiring"
                                value={asset?.summary?.warranty_expiring}
                                color="#dc2626"
                                sub="Within 30 days"
                            />
                        </div>
                    )}
                </SectionCard>

                {/* Customer Satisfaction */}
                <SectionCard
                    icon={<Star size={16} />}
                    title="Customer Satisfaction"
                    error={satisfaction.isError ? satisfaction.error?.message : null}
                >
                    {satisfaction.isLoading ? (
                        <div className="skeleton skeleton-card" style={{ height: 80 }} />
                    ) : (
                        <div style={{ display: "grid", gap: "1rem" }}>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0.75rem",
                                }}
                            >
                                <StatBox
                                    label="Avg Rating"
                                    value={sat?.summary?.average_rating ? `${sat.summary.average_rating}/5` : "—"}
                                    color="#f59e0b"
                                />
                                <StatBox
                                    label="Total Responses"
                                    value={sat?.summary?.total_responses}
                                />
                            </div>
                            {sat?.distribution?.length > 0 && (
                                <ResponsiveContainer width="100%" height={160}>
                                    <PieChart>
                                        <Pie
                                            data={sat.distribution}
                                            dataKey="count"
                                            nameKey="rating"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={65}
                                            label={({ rating, count }) => `${rating}★ (${count})`}
                                        >
                                            {sat.distribution.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}
