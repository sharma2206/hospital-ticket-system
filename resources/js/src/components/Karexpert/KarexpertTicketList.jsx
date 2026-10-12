import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";

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
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">📤 KareXpert Tickets</div>
                    <div className="page-subtitle">
                        {pagination.total ?? 0} tracked tickets
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
                            minWidth: "200px",
                        }}
                    >
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search ticket # or title"
                            style={{ minWidth: "180px" }}
                        />
                        <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                        >
                            Search
                        </button>
                    </form>

                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilter("status", e.target.value)}
                        style={{ maxWidth: "170px" }}
                    >
                        <option value="">All statuses</option>
                        {statusData?.data?.map((item) => (
                            <option key={item.id} value={item.name}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="form-select"
                        value={filters.module}
                        onChange={(e) => setFilter("module", e.target.value)}
                        style={{ maxWidth: "170px" }}
                    >
                        <option value="">All modules</option>
                        {modulesData?.data?.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={clearFilters}
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ticket</th>
                                <th>Module</th>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5)
                                    .fill(0)
                                    .map((_, rowIndex) => (
                                        <tr key={rowIndex}>
                                            {Array(6)
                                                .fill(0)
                                                .map((__, cellIndex) => (
                                                    <td key={cellIndex}>
                                                        <div className="skeleton skeleton-text" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : tickets.length ? (
                                tickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                        <td>
                                            <Link
                                                to={`/karexpert/tickets/${ticket.id}`}
                                                className="table-link"
                                            >
                                                {ticket.ticket_number}
                                            </Link>
                                        </td>
                                        <td>
                                            {ticket.karexpert_module || "—"}
                                        </td>
                                        <td>
                                            <Link
                                                to={`/karexpert/tickets/${ticket.id}`}
                                                className="table-link"
                                            >
                                                {ticket.title}
                                            </Link>
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${ticket.priority?.color || "#64748b"}22`,
                                                    color:
                                                        ticket.priority
                                                            ?.color ||
                                                        "#64748b",
                                                }}
                                            >
                                                {ticket.priority?.name ||
                                                    "Normal"}
                                            </span>
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
                                        <td
                                            style={{
                                                color: "var(--text-muted)",
                                                fontSize: ".8rem",
                                            }}
                                        >
                                            {ticket.created_at
                                                ? new Date(
                                                      ticket.created_at,
                                                  ).toLocaleDateString()
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
                                            color: "var(--text-muted)",
                                            padding: "2rem",
                                        }}
                                    >
                                        No KareXpert tickets found.
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
