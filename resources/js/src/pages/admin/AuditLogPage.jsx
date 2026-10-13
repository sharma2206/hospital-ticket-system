import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import PageHeader from "../../components/Shared/PageHeader";
import SearchFilterBar from "../../components/Shared/SearchFilterBar";
import Pagination from "../../components/Shared/Pagination";
import EmptyState from "../../components/Shared/EmptyState";
import StatusBadge from "../../components/Common/StatusBadge";

export default function AuditLogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    const filters = {
        search: searchParams.get("search") || "",
        action: searchParams.get("action") || "",
        module: searchParams.get("module") || "",
        page: searchParams.get("page") || 1,
        per_page: searchParams.get("per_page") || 20,
    };

    const { data, isLoading } = useQuery({
        queryKey: ["audit-logs", filters],
        queryFn: () =>
            api.get("/audit-logs", { params: filters }).then((r) => r.data),
        keepPreviousData: true,
    });

    const { data: actions = [] } = useQuery({
        queryKey: ["audit-actions"],
        queryFn: () =>
            api.get("/audit-logs/actions").then((r) => r.data.data || []),
    });

    const { data: modules = [] } = useQuery({
        queryKey: ["audit-modules"],
        queryFn: () =>
            api.get("/audit-logs/modules").then((r) => r.data.data || []),
    });

    const setFilter = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        params.set("page", "1");
        setSearchParams(params);
    };

    const doSearch = () => {
        setFilter("search", search);
    };

    const resetFilters = () => {
        setSearchParams({});
        setSearch("");
    };

    const logs = data?.data || [];
    const pagination = data?.pagination || {};

    return (
        <div className="page-container">
            <PageHeader
                title="Audit Logs"
                subtitle="System activity and operational security history"
                icon={History}
            />

            <SearchFilterBar
                search={search}
                onSearchChange={setSearch}
                onSearchSubmit={doSearch}
                searchPlaceholder="Search description or IP..."
                onReset={filters.search || filters.action || filters.module ? resetFilters : null}
            >
                <select
                    className="form-control"
                    value={filters.action}
                    onChange={(e) => setFilter("action", e.target.value)}
                    style={{ maxWidth: "180px" }}
                >
                    <option value="">All actions</option>
                    {actions.map((action) => (
                        <option key={action} value={action}>
                            {action}
                        </option>
                    ))}
                </select>

                <select
                    className="form-control"
                    value={filters.module}
                    onChange={(e) => setFilter("module", e.target.value)}
                    style={{ maxWidth: "180px" }}
                >
                    <option value="">All modules</option>
                    {modules.map((module) => (
                        <option key={module} value={module}>
                            {module}
                        </option>
                    ))}
                </select>
            </SearchFilterBar>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Module</th>
                                <th>User</th>
                                <th>Description</th>
                                <th>IP Address</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(6)
                                    .fill(0)
                                    .map((_, index) => (
                                        <tr key={index}>
                                            {Array(6)
                                                .fill(0)
                                                .map((__, cell) => (
                                                    <td key={cell}>
                                                        <div className="skeleton skeleton-text" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : logs.length ? (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>
                                            <StatusBadge
                                                value={log.action}
                                                label={log.action || "—"}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="font-semibold text-slate-800 dark:text-slate-200">
                                            {log.module || "—"}
                                        </td>
                                        <td>
                                            {log.user
                                                ? `${log.user.first_name} ${log.user.last_name}`
                                                : "System"}
                                        </td>
                                        <td className="text-slate-700 dark:text-slate-300">
                                            {log.description || "—"}
                                        </td>
                                        <td className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                            {log.ip_address || "—"}
                                        </td>
                                        <td className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {log.created_at
                                                ? new Date(log.created_at).toLocaleString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            icon={History}
                                            title="No audit logs found"
                                            description="No activity matches the current search and filter criteria."
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.last_page > 1 && (
                    <Pagination
                        currentPage={filters.page}
                        lastPage={pagination.last_page}
                        total={pagination.total}
                        from={pagination.from}
                        to={pagination.to}
                        itemLabel="logs"
                        onPageChange={(page) => setFilter("page", page)}
                    />
                )}
            </div>
        </div>
    );
}
