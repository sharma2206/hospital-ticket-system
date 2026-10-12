import { useQuery } from "@tanstack/react-query";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import api from "../../services/api";

const COLORS = [
    "#0f766e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
];

const statMap = [
    { key: "total", label: "Total", icon: "📦", color: "#0f766e" },
    { key: "raised", label: "Raised", icon: "🆕", color: "#3b82f6" },
    {
        key: "acknowledged",
        label: "Acknowledged",
        icon: "✅",
        color: "#10b981",
    },
    {
        key: "karexpert_working",
        label: "In Progress",
        icon: "⚙️",
        color: "#f59e0b",
    },
    {
        key: "awaiting_deployment",
        label: "Awaiting Deployment",
        icon: "🚀",
        color: "#8b5cf6",
    },
    { key: "deployed", label: "Deployed", icon: "🎯", color: "#16a34a" },
];

function StatCard({ label, value, color, icon }) {
    return (
        <div className="stat-card" style={{ "--stat-color": color }}>
            <div
                className="stat-card-icon"
                style={{ background: `${color}22` }}
            >
                {icon}
            </div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value" style={{ color }}>
                {value ?? 0}
            </div>
        </div>
    );
}

export default function KxDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["karexpert-dashboard"],
        queryFn: () => api.get("/karexpert/dashboard").then((r) => r.data),
        refetchInterval: 60000,
    });

    if (isLoading) {
        return (
            <div>
                <div className="page-header">
                    <div className="page-title">KareXpert Dashboard</div>
                </div>
                <div className="stats-grid">
                    {Array(6)
                        .fill(0)
                        .map((_, i) => (
                            <div key={i} className="stat-card">
                                <div className="skeleton skeleton-card" />
                            </div>
                        ))}
                </div>
            </div>
        );
    }

    const summary = data?.summary || {};
    const byPriority = Object.entries(data?.by_priority || {}).map(
        ([name, count]) => ({ name, count }),
    );
    const byModule = Object.entries(data?.by_module || {}).map(
        ([name, count]) => ({ name, count }),
    );
    const byCategory = Object.entries(data?.by_category || {}).map(
        ([name, count]) => ({ name, count }),
    );
    const recentTickets = data?.recent_tickets || [];

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">📦 KareXpert Dashboard</div>
                    <div className="page-subtitle">
                        Operational view of all KareXpert implementation tickets
                    </div>
                </div>
            </div>

            <div
                className="stats-grid"
                style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                }}
            >
                {statMap.map((item) => (
                    <StatCard
                        key={item.key}
                        label={item.label}
                        value={summary[item.key]}
                        color={item.color}
                        icon={item.icon}
                    />
                ))}
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr",
                    gap: "1rem",
                }}
            >
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Priority Mix</div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={byPriority}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill="#2563eb"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Module Split</div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={230}>
                            <PieChart>
                                <Pie
                                    data={byModule}
                                    dataKey="count"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={3}
                                >
                                    {byModule.map((entry, index) => (
                                        <Cell
                                            key={`${entry.name}-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                }}
            >
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Category Distribution</div>
                    </div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={byCategory}>
                                <defs>
                                    <linearGradient
                                        id="kxArea"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#8b5cf6"
                                            stopOpacity={0.35}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#8b5cf6"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border)"
                                />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#8b5cf6"
                                    fill="url(#kxArea)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            Recent KareXpert Tickets
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket</th>
                                    <th>Module</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>
                                            <a
                                                href={`/karexpert/tickets/${ticket.id}`}
                                                className="table-link"
                                            >
                                                {ticket.ticket_number}
                                            </a>
                                        </td>
                                        <td>
                                            {ticket.karexpert_module || "—"}
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${ticket.status?.color || "#64748b"}22`,
                                                    color:
                                                        ticket.status?.color ||
                                                        "#64748b",
                                                }}
                                            >
                                                {ticket.status?.name ||
                                                    "Unknown"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {!recentTickets.length && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            style={{
                                                textAlign: "center",
                                                color: "var(--text-muted)",
                                                padding: "2rem",
                                            }}
                                        >
                                            No recent KareXpert tickets.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
