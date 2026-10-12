import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";

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

    const doSearch = (event) => {
        event.preventDefault();
        setFilter("search", search);
    };

    const logs = data?.data || [];

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">🧾 Audit Logs</div>
                    <div className="page-subtitle">
                        System activity and operational history
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
                <div
                    style={{
                        display: "flex",
                        gap: ".75rem",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                    }}
                >
                    <form
                        onSubmit={doSearch}
                        style={{
                            display: "flex",
                            gap: ".5rem",
                            flex: 1,
                            minWidth: "220px",
                        }}
                    >
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search description or IP"
                        />
                        <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                        >
                            <Search size={15} />
                        </button>
                    </form>

                    <select
                        className="form-select"
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
                        className="form-select"
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
                </div>
            </div>

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
                                            <span
                                                className="badge"
                                                style={{
                                                    background: "#dbeafe",
                                                    color: "#1d4ed8",
                                                }}
                                            >
                                                {log.action || "—"}
                                            </span>
                                        </td>
                                        <td>{log.module || "—"}</td>
                                        <td>
                                            {log.user
                                                ? `${log.user.first_name} ${log.user.last_name}`
                                                : "System"}
                                        </td>
                                        <td>{log.description || "—"}</td>
                                        <td
                                            style={{
                                                fontFamily: "monospace",
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            {log.ip_address || "—"}
                                        </td>
                                        <td
                                            style={{
                                                color: "var(--text-muted)",
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            {log.created_at
                                                ? new Date(
                                                      log.created_at,
                                                  ).toLocaleString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            textAlign: "center",
                                            padding: "2rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No audit logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
