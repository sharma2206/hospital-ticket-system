import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import api from "../../services/api";

export default function AssetsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    const filters = {
        search: searchParams.get("search") || "",
        category: searchParams.get("category") || "",
        status: searchParams.get("status") || "",
        page: searchParams.get("page") || 1,
        per_page: searchParams.get("per_page") || 15,
    };

    const { data, isLoading } = useQuery({
        queryKey: ["assets", filters],
        queryFn: () =>
            api.get("/assets", { params: filters }).then((r) => r.data),
        keepPreviousData: true,
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["asset-categories"],
        queryFn: () =>
            api.get("/assets/categories").then((r) => r.data.data || []),
    });

    const assets = data?.data || [];
    const pagination = data?.pagination || {};

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

    const statusColors = {
        active: "#16a34a",
        inactive: "#64748b",
        maintenance: "#f59e0b",
        retired: "#ef4444",
        disposed: "#111827",
    };

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">💻 Asset Inventory</div>
                    <div className="page-subtitle">
                        {pagination.total ?? 0} tracked assets
                    </div>
                </div>
                <Link to="/assets/create" className="btn btn-primary">
                    <Plus size={16} /> Add Asset
                </Link>
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
                            placeholder="Search asset name or code"
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
                        value={filters.category}
                        onChange={(e) => setFilter("category", e.target.value)}
                        style={{ maxWidth: "180px" }}
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilter("status", e.target.value)}
                        style={{ maxWidth: "160px" }}
                    >
                        <option value="">All status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                        <option value="disposed">Disposed</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Department</th>
                                <th>Assigned</th>
                                <th>Location</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(6)
                                    .fill(0)
                                    .map((_, index) => (
                                        <tr key={index}>
                                            {Array(7)
                                                .fill(0)
                                                .map((__, cell) => (
                                                    <td key={cell}>
                                                        <div className="skeleton skeleton-text" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : assets.length ? (
                                assets.map((asset) => (
                                    <tr key={asset.id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>
                                                {asset.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: ".76rem",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {asset.asset_code}
                                            </div>
                                        </td>
                                        <td>{asset.category || "—"}</td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background: `${statusColors[asset.status] || "#e2e8f0"}22`,
                                                    color:
                                                        statusColors[
                                                            asset.status
                                                        ] || "#475569",
                                                }}
                                            >
                                                {asset.status || "Unknown"}
                                            </span>
                                        </td>
                                        <td>{asset.department?.name || "—"}</td>
                                        <td>
                                            {(asset.assigned_user || asset.assignedUser)
                                                ? `${(asset.assigned_user || asset.assignedUser).first_name} ${(asset.assigned_user || asset.assignedUser).last_name}`
                                                : "Unassigned"}
                                        </td>
                                        <td>{asset.location || "—"}</td>
                                        <td>
                                            <Link
                                                to={`/assets/${asset.id}`}
                                                className="btn btn-secondary btn-sm"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            textAlign: "center",
                                            padding: "2rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No assets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="card">
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={filters.page <= 1}
                            onClick={() => setFilter("page", String(Number(filters.page) - 1))}
                        >
                            &larr;
                        </button>
                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                            .filter(p => {
                                const current = Number(filters.page);
                                return p === 1 || p === pagination.last_page || Math.abs(p - current) <= 2;
                            })
                            .reduce((acc, p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p, i) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${i}`} style={{ padding: '0 0.25rem', color: 'var(--text-muted)' }}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        className={`pagination-btn ${Number(filters.page) === p ? 'active' : ''}`}
                                        onClick={() => setFilter("page", String(p))}
                                    >
                                        {p}
                                    </button>
                                )
                            )
                        }
                        <button
                            className="pagination-btn"
                            disabled={Number(filters.page) >= pagination.last_page}
                            onClick={() => setFilter("page", String(Number(filters.page) + 1))}
                        >
                            &rarr;
                        </button>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            {pagination.total} total assets
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
