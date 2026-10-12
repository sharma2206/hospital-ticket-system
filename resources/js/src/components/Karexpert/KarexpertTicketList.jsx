import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
    Layers,
    Plus,
    Search,
    RotateCcw,
    Eye,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import StatusBadge from "../Common/StatusBadge";

export default function KxTicketList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    const filters = {
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "",
        priority: searchParams.get("priority") || "",
        module: searchParams.get("module") || "",
        page: searchParams.get("page") || 1,
        per_page: searchParams.get("per_page") || 15,
    };

    const { data, isLoading } = useQuery({
        queryKey: ["karexpert-tickets", filters],
        queryFn: () =>
            api
                .get("/karexpert/tickets", { params: filters })
                .then((r) => r.data),
        keepPreviousData: true,
    });

    const { data: statusData } = useQuery({
        queryKey: ["karexpert-statuses"],
        queryFn: () => api.get("/karexpert-statuses").then((r) => r.data),
    });

    const { data: modulesData } = useQuery({
        queryKey: ["karexpert-modules"],
        queryFn: () => api.get("/karexpert-modules").then((r) => r.data),
    });

    const setFilter = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        params.set("page", "1");
        setSearchParams(params);
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
                        <span>KareXpert HMS Tickets</span>
                    </h1>
                    <p className="page-subtitle">
                        {pagination.total ?? 0} tickets tracked in KareXpert vendor integration
                    </p>
                </div>
                <Link to="/karexpert/tickets/create" className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm">
                    <Plus size={16} />
                    <span>Raise to KX</span>
                </Link>
            </div>

            {/* Filter Toolbar */}
            <div className="card p-3.5">
                <div className="ticket-list-toolbar">
                    <form onSubmit={doSearch} className="ticket-list-search">
                        <input
                            className="form-control"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search ticket #, title, or Ref ID..."
                        />
                        <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                            title="Search"
                        >
                            <Search size={15} />
                        </button>
                    </form>

                    <div className="ticket-list-filters">
                        <select
                            className="form-control"
                            value={filters.status}
                            onChange={(e) => setFilter("status", e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {statusData?.data?.map((s) => (
                                <option key={s.id} value={s.name}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control"
                            value={filters.module}
                            onChange={(e) => setFilter("module", e.target.value)}
                        >
                            <option value="">All Modules</option>
                            {modulesData?.data?.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>

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
                                <th>KX Ticket #</th>
                                <th>Ref ID</th>
                                <th>Module</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
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
                                            {Array(8)
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
                                            <Link
                                                to={`/karexpert/tickets/${t.id}`}
                                                className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                            >
                                                {t.ticket_number}
                                            </Link>
                                        </td>
                                        <td className="text-xs font-mono text-slate-500">
                                            {t.karexpert_ref_id || "—"}
                                        </td>
                                        <td>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                                {t.karexpert_module || "General"}
                                            </span>
                                        </td>
                                        <td className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                                            <Link
                                                to={`/karexpert/tickets/${t.id}`}
                                                className="hover:text-purple-600 transition-colors"
                                            >
                                                {t.title}
                                            </Link>
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
                                                value={t.status?.name}
                                                label={t.status?.name}
                                                color={t.status?.color}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <Link
                                                to={`/karexpert/tickets/${t.id}`}
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
                                        colSpan={8}
                                        className="text-center py-12 text-slate-400"
                                    >
                                        <Layers size={36} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                        <p className="font-medium text-slate-600 dark:text-slate-300">No KareXpert tickets found</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Try adjusting filters or{" "}
                                            <Link to="/karexpert/tickets/create" className="text-purple-600 hover:underline">
                                                raise a ticket to KareXpert
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
