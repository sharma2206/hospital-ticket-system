import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
    Package,
    FilePlus2,
    CheckCircle2,
    Clock,
    Rocket,
    CheckCheck,
    Layers,
    PieChart as PieChartIcon,
    BarChart3,
    Plus,
    Activity,
} from "lucide-react";
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
    Legend,
} from "recharts";
import api from "../../services/api";
import MetricCard from "../Shared/MetricCard";
import PageHeader from "../Shared/PageHeader";

const COLORS = [
    "#2563eb",
    "#0d9488",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#10b981",
];

const statConfigs = [
    { key: "total", label: "Total KX Tickets", icon: Package, color: "#2563eb", sub: "Total reported to KX" },
    { key: "raised", label: "Raised", icon: FilePlus2, color: "#0284c7", sub: "New issues logged" },
    { key: "acknowledged", label: "Acknowledged", icon: CheckCircle2, color: "#0d9488", sub: "Accepted by KareXpert" },
    { key: "karexpert_working", label: "In Progress", icon: Clock, color: "#f59e0b", sub: "Under development / fix" },
    { key: "awaiting_deployment", label: "Awaiting Deployment", icon: Rocket, color: "#8b5cf6", sub: "Ready for hospital staging" },
    { key: "deployed", label: "Deployed", icon: CheckCheck, color: "#16a34a", sub: "Live in production" },
];

export default function KxDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ["karexpert-dashboard"],
        queryFn: () => api.get("/karexpert/dashboard").then((r) => r.data),
        refetchInterval: 60000,
    });

    const summary = data?.summary || {};
    const byPriority = Object.entries(data?.by_priority || {}).map(
        ([name, count]) => ({ name, count })
    );
    const byModule = Object.entries(data?.by_module || {}).map(
        ([name, count]) => ({ name, count })
    );
    const byCategory = Object.entries(data?.by_category || {}).map(
        ([name, count]) => ({ name, count })
    );

    return (
        <div className="page-container">
            <PageHeader
                title="KareXpert HMS Integration"
                subtitle="Vendor escalation tracking, patch deployment stages, and L3 support issues"
                icon={Activity}
                actions={
                    <Link
                        to="/karexpert/tickets/create"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Raise to KX</span>
                    </Link>
                }
            />

            {/* KPI Metrics Strip */}
            <div
                className="grid gap-3.5"
                style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                }}
            >
                {statConfigs.map((stat) => (
                    <MetricCard
                        key={stat.key}
                        title={stat.label}
                        value={summary[stat.key]}
                        icon={stat.icon}
                        color={stat.color}
                        sub={stat.sub}
                        isLoading={isLoading}
                    />
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Module-wise Issues */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <Layers size={18} className="text-blue-500" />
                            <span>HMS Module Distribution</span>
                        </div>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="skeleton h-56 w-full rounded-xl" />
                        ) : byModule.length > 0 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <BarChart data={byModule} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                        interval={0}
                                        angle={-25}
                                        textAnchor="end"
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '0.75rem',
                                            color: 'var(--text)',
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#2563eb"
                                        radius={[6, 6, 0, 0]}
                                        name="Tickets"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                                No module tickets logged
                            </div>
                        )}
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <PieChartIcon size={18} className="text-purple-500" />
                            <span>KareXpert Priority Breakdown</span>
                        </div>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="skeleton h-56 w-full rounded-xl" />
                        ) : byPriority.length > 0 ? (
                            <ResponsiveContainer width="100%" height={230}>
                                <PieChart>
                                    <Pie
                                        data={byPriority}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                    >
                                        {byPriority.map((entry, i) => (
                                            <Cell
                                                key={i}
                                                fill={COLORS[i % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '0.75rem',
                                            color: 'var(--text)',
                                        }}
                                    />
                                    <Legend iconSize={9} wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                                No priority data available
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
