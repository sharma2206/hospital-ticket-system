import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Ticket,
    FolderOpen,
    Clock,
    CheckCircle2,
    AlertOctagon,
    AlertTriangle,
    CalendarDays,
    Calendar,
    UserX,
    UserCheck,
    Flame,
    Star,
    TrendingUp,
    LineChart as LineChartIcon,
    PieChart as PieChartIcon,
    Building2,
    Hospital,
    Users,
    ArrowUpRight,
    Plus,
    LayoutDashboard,
    ListOrdered,
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import MetricCard from "../Shared/MetricCard";
import PageHeader from "../Shared/PageHeader";
import StatusBadge from "../Common/StatusBadge";

const COLORS = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
];

export default function AdminDashboard() {
    const { isStaff, user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => api.get("/dashboard").then((r) => r.data),
        refetchInterval: 60000,
    });

    const s = data?.summary || {};
    const trend = data?.trend || [];
    const byPriority = data?.by_priority || [];
    const byDept = data?.by_department || [];
    const byBranch = data?.by_branch || [];
    const byCategory = data?.by_category || [];
    const techWorkload = data?.technician_workload || [];
    const recentTickets = data?.recent_tickets || [];

    const avgResH = s.avg_resolution_min
        ? `~${Math.round(s.avg_resolution_min / 60)}h avg resolution`
        : "No resolution data";
    const avgRespM = s.avg_response_min
        ? `~${s.avg_response_min}m first response`
        : "No response data";

    return (
        <div className="page-container">
            <PageHeader
                title="IT Operations Overview"
                subtitle="Real-time telemetry and service metrics for hospital IT operations"
                icon={LayoutDashboard}
                actions={
                    <Link
                        to="/tickets/create"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Raise Ticket</span>
                    </Link>
                }
            />

            {/* KPI Metrics Grid */}
            <div
                className="grid gap-3.5"
                style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                }}
            >
                <MetricCard
                    title="Total Tickets"
                    value={s.total}
                    icon={Ticket}
                    color="#2563eb"
                    sub="All time volume"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Open Tickets"
                    value={s.open}
                    icon={FolderOpen}
                    color="#f59e0b"
                    sub="Awaiting triage"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="In Progress"
                    value={s.in_progress}
                    icon={Clock}
                    color="#0284c7"
                    sub="Under active investigation"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Resolved"
                    value={s.resolved}
                    icon={CheckCircle2}
                    color="#10b981"
                    sub="Completed successfully"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="SLA Breached"
                    value={s.sla_breached}
                    icon={AlertOctagon}
                    color="#ef4444"
                    sub="Service target exceeded"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Overdue"
                    value={s.overdue}
                    icon={AlertTriangle}
                    color="#f97316"
                    sub="Due date expired"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Created Today"
                    value={s.today}
                    icon={CalendarDays}
                    color="#8b5cf6"
                    sub="Incoming today"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="This Month"
                    value={s.monthly}
                    icon={Calendar}
                    color="#0891b2"
                    sub={avgResH}
                    isLoading={isLoading}
                />
                {isStaff() && (
                    <MetricCard
                        title="Unassigned"
                        value={s.unassigned}
                        icon={UserX}
                        color="#dc2626"
                        sub="Needs technician"
                        isLoading={isLoading}
                    />
                )}
                {isStaff() && (
                    <MetricCard
                        title="My Assigned"
                        value={s.my_assigned}
                        icon={UserCheck}
                        color="#0d9488"
                        sub="Assigned to you"
                        isLoading={isLoading}
                    />
                )}
                <MetricCard
                    title="Escalated"
                    value={s.escalated}
                    icon={Flame}
                    color="#b91c1c"
                    sub="Priority escalations"
                    isLoading={isLoading}
                />
                <MetricCard
                    title="Satisfaction"
                    value={s.avg_satisfaction ? `${s.avg_satisfaction}/5` : "N/A"}
                    icon={Star}
                    color="#f59e0b"
                    sub={avgRespM}
                    isLoading={isLoading}
                />
            </div>

            {/* Charts Row 1: Trend & Priority Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 30-Day Trend */}
                <div className="card lg:col-span-2">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <LineChartIcon size={18} className="text-blue-500" />
                            <span>Ticket Volume Trend (30 Days)</span>
                        </div>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="skeleton h-56 w-full rounded-xl" />
                        ) : (
                            <ResponsiveContainer width="100%" height={230}>
                                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                                        tickFormatter={(d) => d.slice(5)}
                                    />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--bg-card)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '0.75rem',
                                            boxShadow: 'var(--shadow)',
                                            color: 'var(--text)',
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#2563eb"
                                        fill="url(#trendGradient)"
                                        strokeWidth={2.5}
                                        name="Tickets"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <PieChartIcon size={18} className="text-purple-500" />
                            <span>Priority Breakdown</span>
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
                                                fill={entry.color || COLORS[i % COLORS.length]}
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
                                No priority data recorded
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Department & Branch Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Department Distribution */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <Building2 size={18} className="text-teal-500" />
                            <span>Department-wise Tickets</span>
                        </div>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="skeleton h-48 w-full rounded-xl" />
                        ) : byDept.length > 0 ? (
                            <ResponsiveContainer width="100%" height={210}>
                                <BarChart data={byDept} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                                        width={90}
                                    />
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
                                        fill="#0d9488"
                                        radius={[0, 6, 6, 0]}
                                        name="Tickets"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                                No department data
                            </div>
                        )}
                    </div>
                </div>

                {/* Branch Distribution */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <Hospital size={18} className="text-indigo-500" />
                            <span>Branch-wise Tickets</span>
                        </div>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="skeleton h-48 w-full rounded-xl" />
                        ) : byBranch.length > 0 ? (
                            <ResponsiveContainer width="100%" height={210}>
                                <BarChart data={byBranch} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
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
                                        fill="#6366f1"
                                        radius={[6, 6, 0, 0]}
                                        name="Tickets"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                                No branch data
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Technician Workload & Recent Tickets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {isStaff() && techWorkload.length > 0 && (
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title flex items-center gap-2">
                                <Users size={18} className="text-amber-500" />
                                <span>Technician Workload</span>
                            </div>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={techWorkload} layout="vertical" margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                                        width={85}
                                    />
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
                                        fill="#f59e0b"
                                        radius={[0, 6, 6, 0]}
                                        name="Active Assigned"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className={`card ${isStaff() && techWorkload.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <ListOrdered size={18} className="text-blue-500" />
                            <span>Recent Ticket Activity</span>
                        </div>
                        <Link to="/tickets" className="btn btn-secondary btn-xs flex items-center gap-1">
                            <span>View All</span>
                            <ArrowUpRight size={14} />
                        </Link>
                    </div>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket #</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map((t) => (
                                    <tr key={t.id}>
                                        <td>
                                            <Link
                                                to={`/tickets/${t.id}`}
                                                className="table-link font-mono font-medium text-xs text-blue-600 dark:text-blue-400"
                                            >
                                                {t.ticket_number}
                                            </Link>
                                        </td>
                                        <td className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                                            {t.title}
                                        </td>
                                        <td>
                                            <StatusBadge
                                                value={t.status?.code || t.status?.name}
                                                label={t.status?.name}
                                                color={t.status?.color}
                                                size="sm"
                                            />
                                        </td>
                                        <td>
                                            <StatusBadge
                                                value={t.priority?.name}
                                                label={t.priority?.name}
                                                color={t.priority?.color}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {!recentTickets.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center text-slate-400 py-10"
                                        >
                                            No recent tickets recorded
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
