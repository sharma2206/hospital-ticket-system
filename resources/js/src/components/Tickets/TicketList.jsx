import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
    Ticket,
    Plus,
    Search,
    RotateCcw,
    AlertTriangle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Filter,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../Common/StatusBadge";

function SLABadge({ status }) {
    if (!status) return <span className="text-xs text-slate-400">—</span>;
    
    const colorMap = {
        green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
        yellow: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
        red: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
    };

    const variant = colorMap[status.color] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200";

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variant}`}>
            {status.label}
        </span>
    );
}

export default function TicketList() {
    const { isStaff } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    const filters = {
        status_id: searchParams.get("status_id") || "",
        priority_id: searchParams.get("priority_id") || "",
        category_id: searchParams.get("category_id") || "",
        sub_category_id: searchParams.get("sub_category_id") || "",
        department_id: searchParams.get("department_id") || "",
        branch_id: searchParams.get("branch_id") || "",
        assigned_to: searchParams.get("assigned_to") || "",
        is_escalated: searchParams.get("is_escalated") || "",
        sla_breached: searchParams.get("sla_breached") || "",
        my_tickets: searchParams.get("my_tickets") || "",
        sort_by: searchParams.get("sort_by") || "created_at",
        sort_order: searchParams.get("sort_order") || "desc",
        page: searchParams.get("page") || 1,
        per_page: searchParams.get("per_page") || 15,
        search: searchParams.get("search") || "",
    };

    const { data, isLoading } = useQuery({
        queryKey: ["tickets", filters],
        queryFn: () =>
            api.get("/tickets", { params: filters }).then((r) => r.data),
        keepPreviousData: true,
    });

    const { data: statusData } = useQuery({
        queryKey: ["ticket-statuses"],
        queryFn: () => api.get("/ticket-statuses").then((r) => r.data),
    });
    const { data: priorityData } = useQuery({
        queryKey: ["priorities"],
        queryFn: () => api.get("/priorities").then((r) => r.data),
    });
    const { data: categoryData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get("/categories").then((r) => r.data),
    });
    const { data: subCategoryData } = useQuery({
        queryKey: ["sub-categories", filters.category_id],
        queryFn: () =>
            api
                .get("/sub-categories", {
                    params: { category_id: filters.category_id },
                })
                .then((r) => r.data),
        enabled: !!filters.category_id,
    });
    const { data: deptData } = useQuery({
        queryKey: ["departments"],
        queryFn: () => api.get("/departments").then((r) => r.data),
    });
    const { data: branchData } = useQuery({
        queryKey: ["branches"],
        queryFn: () => api.get("/branches").then((r) => r.data),
    });

    const setFilter = (key, val) => {
        const p = new URLSearchParams(searchParams);
        if (val) p.set(key, val);
        else p.delete(key);
        p.set("page", 1);
        setSearchParams(p);
    };

    const clearFilters = () => {
        setSearchParams({});
        setSearch("");
    };

    const doSearch = (e) => {
        e.preventDefault();
        setFilter("search", search);
    };

    const tickets = data?.data || [];
    const pagination = data?.pagination || {};

    return (
        <div className="space-y-5">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <span>IT Support Tickets</span>
                    </h1>
                    <p className="page-subtitle">
                        {pagination.total ?? 0} total tickets logged in system
                    </p>
                </div>
                <Link to="/tickets/create" className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm">
                    <Plus size={16} />
                    <span>Raise Ticket</span>
                </Link>
            </div>

            {/* Filter Toolbar */}
            <div className="card p-3.5">
                <div className="ticket-list-toolbar">
                    <form onSubmit={doSearch} className="ticket-list-search">
                        <input
                            className="form-control"
                            placeholder="Search by ticket #, title, requester..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            className="btn btn-secondary btn-sm"
                            type="submit"
                            title="Search"
                        >
                            <Search size={15} />
                        </button>
                    </form>

                    <div className="ticket-list-filters">
                        <select
                            className="form-control"
                            value={filters.status_id}
                            onChange={(e) => setFilter("status_id", e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {statusData?.data?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control"
                            value={filters.priority_id}
                            onChange={(e) => setFilter("priority_id", e.target.value)}
                        >
                            <option value="">All Priorities</option>
                            {priorityData?.data?.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control"
                            value={filters.department_id}
                            onChange={(e) => setFilter("department_id", e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {deptData?.data?.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control"
                            value={filters.category_id}
                            onChange={(e) => {
                                const p = new URLSearchParams(searchParams);
                                if (e.target.value) p.set("category_id", e.target.value);
                                else p.delete("category_id");
                                p.delete("sub_category_id");
                                p.set("page", "1");
                                setSearchParams(p);
                            }}
                        >
                            <option value="">All Categories</option>
                            {categoryData?.data?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        {filters.category_id && (
                            <select
                                className="form-control"
                                value={filters.sub_category_id}
                                onChange={(e) => setFilter("sub_category_id", e.target.value)}
                            >
                                <option value="">All Subcategories</option>
                                {subCategoryData?.data?.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {isStaff() && (
                            <>
                                <select
                                    className="form-control"
                                    value={filters.branch_id}
                                    onChange={(e) => setFilter("branch_id", e.target.value)}
                                >
                                    <option value="">All Branches</option>
                                    {branchData?.data?.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="form-control"
                                    value={filters.is_escalated}
                                    onChange={(e) => setFilter("is_escalated", e.target.value)}
                                >
                                    <option value="">Escalation</option>
                                    <option value="1">Escalated Only</option>
                                </select>
                                <select
                                    className="form-control"
                                    value={filters.sla_breached}
                                    onChange={(e) => setFilter("sla_breached", e.target.value)}
                                >
                                    <option value="">SLA Status</option>
                                    <option value="1">Breached Only</option>
                                </select>
                            </>
                        )}

                        <button
                            type="button"
                            className="btn btn-secondary btn-sm flex items-center gap-1"
                            onClick={clearFilters}
                            title="Reset filters"
                        >
                            <RotateCcw size={14} />
                            <span>Reset</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ticket #</th>
                                <th>Title</th>
                                <th>Department</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>SLA</th>
                                {isStaff() && <th>Assigned To</th>}
                                <th>Created</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                        <tr key={i}>
                                            {Array(isStaff() ? 9 : 8)
                                                .fill(0)
                                                .map((_, j) => (
                                                    <td key={j}>
                                                        <div className="skeleton skeleton-text" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : tickets.length ? (
                                tickets.map((t) => (
                                    <tr key={t.id}>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <Link
                                                    to={`/tickets/${t.id}`}
                                                    className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {t.ticket_number}
                                                </Link>
                                                {t.is_escalated && (
                                                    <span
                                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                                                        title="Escalated ticket"
                                                    >
                                                        <AlertTriangle size={10} />
                                                        ESC
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="max-w-xs font-medium text-slate-800 dark:text-slate-200">
                                            <Link
                                                to={`/tickets/${t.id}`}
                                                className="hover:text-blue-600 transition-colors block truncate"
                                            >
                                                {t.title}
                                            </Link>
                                            {t.category && (
                                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {t.category.name}
                                                    </span>
                                                    {(t.sub_category || t.subCategory) && (
                                                        <>
                                                            <span className="text-slate-300 dark:text-slate-600">/</span>
                                                            <span className="truncate">
                                                                {(t.sub_category || t.subCategory).name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="text-xs text-slate-600 dark:text-slate-400">
                                            {t.department?.name || "—"}
                                        </td>
                                        <td>
                                            <StatusBadge
                                                value={t.priority?.name}
                                                label={t.priority?.name}
                                                color={t.priority?.color}
                                                size="sm"
                                            />
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
                                            <SLABadge status={t.sla_status} />
                                        </td>
                                        {isStaff() && (
                                            <td className="text-xs">
                                                {t.assignee ? (
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {t.assignee.first_name} {t.assignee.last_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <Link
                                                to={`/tickets/${t.id}`}
                                                className="btn btn-secondary btn-xs inline-flex items-center gap-1"
                                            >
                                                <Eye size={12} />
                                                <span>View</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={isStaff() ? 9 : 8}
                                        className="text-center py-12 text-slate-400"
                                    >
                                        <Ticket size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                        <p className="font-medium text-slate-600 dark:text-slate-300">No tickets found</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Try adjusting your search or filters, or{" "}
                                            <Link to="/tickets/create" className="text-blue-600 hover:underline">
                                                raise a new ticket
                                            </Link>.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                            Showing {pagination.from}–{pagination.to} of {pagination.total} tickets
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                className="btn btn-secondary btn-xs px-2"
                                disabled={+filters.page <= 1}
                                onClick={() => setFilter("page", +filters.page - 1)}
                                title="Previous page"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from(
                                { length: Math.min(pagination.last_page, 7) },
                                (_, i) => i + 1
                            ).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`btn btn-xs min-w-7 ${
                                        +filters.page === p ? "btn-primary" : "btn-secondary"
                                    }`}
                                    onClick={() => setFilter("page", p)}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="btn btn-secondary btn-xs px-2"
                                disabled={+filters.page >= pagination.last_page}
                                onClick={() => setFilter("page", +filters.page + 1)}
                                title="Next page"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
