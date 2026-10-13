import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Laptop, Eye } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/Shared/PageHeader";
import SearchFilterBar from "../../components/Shared/SearchFilterBar";
import Pagination from "../../components/Shared/Pagination";
import EmptyState from "../../components/Shared/EmptyState";
import StatusBadge from "../../components/Common/StatusBadge";

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

    const doSearch = () => {
        setFilter("search", search);
    };

    const resetFilters = () => {
        setSearchParams({});
        setSearch("");
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Asset Inventory"
                subtitle={`${pagination.total ?? 0} tracked hardware and clinical IT devices`}
                icon={Laptop}
                actions={
                    <Link
                        to="/assets/create"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={16} />
                        <span>Add Asset</span>
                    </Link>
                }
            />

            <SearchFilterBar
                search={search}
                onSearchChange={setSearch}
                onSearchSubmit={doSearch}
                searchPlaceholder="Search asset name or code..."
                onReset={filters.search || filters.category || filters.status ? resetFilters : null}
            >
                <select
                    className="form-control"
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
                    className="form-control"
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
            </SearchFilterBar>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Department</th>
                                <th>Assigned To</th>
                                <th>Location</th>
                                <th className="text-right">Action</th>
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
                                            <Link
                                                to={`/assets/${asset.id}`}
                                                className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 transition-colors block"
                                            >
                                                {asset.name}
                                            </Link>
                                            <div className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                {asset.asset_code}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {asset.category || "—"}
                                            </span>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                value={asset.status}
                                                label={asset.status || "Unknown"}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="text-xs text-slate-600 dark:text-slate-400">
                                            {asset.department?.name || "—"}
                                        </td>
                                        <td className="text-xs text-slate-700 dark:text-slate-300">
                                            {(asset.assigned_user || asset.assignedUser)
                                                ? `${(asset.assigned_user || asset.assignedUser).first_name} ${(asset.assigned_user || asset.assignedUser).last_name}`
                                                : <span className="text-slate-400 italic">Unassigned</span>}
                                        </td>
                                        <td className="text-xs text-slate-500 dark:text-slate-400">
                                            {asset.location || "—"}
                                        </td>
                                        <td className="text-right">
                                            <Link
                                                to={`/assets/${asset.id}`}
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
                                    <td colSpan={7}>
                                        <EmptyState
                                            icon={Laptop}
                                            title="No assets found"
                                            description="No assets match your search or filter settings."
                                            action={
                                                <Link to="/assets/create" className="btn btn-primary btn-sm">
                                                    <Plus size={14} /> Add First Asset
                                                </Link>
                                            }
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.last_page > 1 && (
                    <Pagination
                        currentPage={filters.page}
                        lastPage={pagination.last_page}
                        total={pagination.total}
                        from={pagination.from}
                        to={pagination.to}
                        itemLabel="assets"
                        onPageChange={(p) => setFilter("page", String(p))}
                    />
                )}
            </div>
        </div>
    );
}
