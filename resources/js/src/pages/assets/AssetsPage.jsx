import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
    Plus,
    Laptop,
    Eye,
    Download,
    Layers,
    Wrench,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    UserCheck,
    Clock,
    ArrowRightLeft,
    CornerDownLeft,
    Edit,
    Filter,
    RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/Shared/PageHeader";
import MetricCard from "../../components/Shared/MetricCard";
import Pagination from "../../components/Shared/Pagination";
import EmptyState from "../../components/Shared/EmptyState";
import StatusBadge from "../../components/Common/StatusBadge";
import AssetCategoryModal from "../../components/Assets/AssetCategoryModal";
import AssetCustodyModal from "../../components/Assets/AssetCustodyModal";

export default function AssetsPage() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [isExporting, setIsExporting] = useState(false);

    // Modals
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [custodyModal, setCustodyModal] = useState({
        isOpen: false,
        asset: null,
        mode: "assign",
    });

    const canManage = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager", "technician"].includes(r.name || r)
    );

    const filters = {
        search: searchParams.get("search") || "",
        category: searchParams.get("category") || "",
        status: searchParams.get("status") || "",
        branch_id: searchParams.get("branch_id") || "",
        department_id: searchParams.get("department_id") || "",
        assigned: searchParams.get("assigned") || "",
        unassigned: searchParams.get("unassigned") || "",
        maintenance_due: searchParams.get("maintenance_due") || "",
        warranty_expiring_soon: searchParams.get("warranty_expiring_soon") || "",
        page: searchParams.get("page") || 1,
        per_page: searchParams.get("per_page") || 15,
    };

    // Dashboard Metrics
    const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
        queryKey: ["assets-dashboard"],
        queryFn: () => api.get("/assets/dashboard").then((r) => r.data?.data || {}),
    });

    // Assets Registry
    const { data, isLoading } = useQuery({
        queryKey: ["assets", filters],
        queryFn: () => api.get("/assets", { params: filters }).then((r) => r.data),
        keepPreviousData: true,
    });

    // Filter Options
    const { data: categories = [] } = useQuery({
        queryKey: ["asset-categories"],
        queryFn: () => api.get("/assets/categories").then((r) => r.data?.data || []),
    });

    const { data: branches = [] } = useQuery({
        queryKey: ["branches"],
        queryFn: () => api.get("/branches").then((r) => r.data?.data || []),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: () => api.get("/departments").then((r) => r.data?.data || []),
    });

    const assets = data?.data || [];
    const pagination = data?.pagination || {};
    const counts = dashboardData?.counts || {};

    const setFilter = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        params.set("page", "1");
        setSearchParams(params);
    };

    const doSearch = (e) => {
        e?.preventDefault();
        setFilter("search", search);
    };

    const resetFilters = () => {
        setSearchParams({});
        setSearch("");
    };

    const toggleQuickFilter = (type) => {
        const params = new URLSearchParams(searchParams);
        params.delete("assigned");
        params.delete("unassigned");
        params.delete("maintenance_due");
        params.delete("warranty_expiring_soon");
        params.delete("status");

        if (type === "assigned") params.set("assigned", "1");
        else if (type === "unassigned") params.set("unassigned", "1");
        else if (type === "maintenance_due") params.set("maintenance_due", "1");
        else if (type === "warranty_expiring_soon") params.set("warranty_expiring_soon", "1");
        else if (type === "maintenance") params.set("status", "maintenance");

        params.set("page", "1");
        setSearchParams(params);
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await api.get("/assets/export", {
                params: filters,
                responseType: "blob",
            });
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `hospital_assets_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Assets exported successfully to CSV");
        } catch (err) {
            toast.error("Failed to export assets");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="page-container space-y-6">
            <PageHeader
                title="Hospital IT Asset Management"
                subtitle="Complete hardware registry, custody tracking, preventive maintenance, and warranty lifecycle"
                icon={Laptop}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                            >
                                <Layers size={15} />
                                <span>Categories</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                        >
                            <Download size={15} />
                            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
                        </button>

                        {canManage && (
                            <Link
                                to="/assets/create"
                                className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus size={16} />
                                <span>Add Asset</span>
                            </Link>
                        )}
                    </div>
                }
            />

            {/* Dashboard Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard
                    title="Total Assets"
                    value={counts.total ?? 0}
                    icon={Laptop}
                    color="#2563eb"
                    sub="Tracked inventory"
                    isLoading={isDashboardLoading}
                    onClick={() => resetFilters()}
                />
                <MetricCard
                    title="Active / In-Service"
                    value={counts.active ?? 0}
                    icon={CheckCircle2}
                    color="#16a34a"
                    sub="Operational units"
                    isLoading={isDashboardLoading}
                    onClick={() => setFilter("status", "active")}
                />
                <MetricCard
                    title="Assigned to Staff"
                    value={counts.assigned ?? 0}
                    icon={UserCheck}
                    color="#0284c7"
                    sub="In active custody"
                    isLoading={isDashboardLoading}
                    onClick={() => toggleQuickFilter("assigned")}
                />
                <MetricCard
                    title="In Stock / Pool"
                    value={counts.available ?? 0}
                    icon={Layers}
                    color="#0d9488"
                    sub="Ready for issuance"
                    isLoading={isDashboardLoading}
                    onClick={() => toggleQuickFilter("unassigned")}
                />
                <MetricCard
                    title="Maintenance Due"
                    value={counts.maintenance_due_soon ?? 0}
                    icon={Wrench}
                    color="#f59e0b"
                    sub="Service within 14d"
                    isLoading={isDashboardLoading}
                    onClick={() => toggleQuickFilter("maintenance_due")}
                />
                <MetricCard
                    title="Warranty Expiring"
                    value={counts.warranty_expiring_soon ?? 0}
                    icon={AlertTriangle}
                    color="#ef4444"
                    sub="Expiring within 30d"
                    isLoading={isDashboardLoading}
                    onClick={() => toggleQuickFilter("warranty_expiring_soon")}
                />
            </div>

            {/* Advanced Filters Bar */}
            <div className="card p-4 space-y-3">
                <form onSubmit={doSearch} className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="form-control pl-9 w-full"
                            placeholder="Search asset code (AST-...), name, serial no, model, hostname..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Laptop
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="form-control text-xs w-auto min-w-[140px]"
                            value={filters.category}
                            onChange={(e) => setFilter("category", e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control text-xs w-auto min-w-[130px]"
                            value={filters.status}
                            onChange={(e) => setFilter("status", e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="repair">In Repair</option>
                            <option value="inactive">Inactive / Stock</option>
                            <option value="retired">Retired</option>
                            <option value="disposed">Disposed</option>
                        </select>

                        <select
                            className="form-control text-xs w-auto min-w-[140px]"
                            value={filters.department_id}
                            onChange={(e) => setFilter("department_id", e.target.value)}
                        >
                            <option value="">All Departments</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="form-control text-xs w-auto min-w-[130px]"
                            value={filters.branch_id}
                            onChange={(e) => setFilter("branch_id", e.target.value)}
                        >
                            <option value="">All Branches</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="btn btn-primary btn-sm px-4">
                            Filter
                        </button>

                        {(filters.search ||
                            filters.category ||
                            filters.status ||
                            filters.department_id ||
                            filters.branch_id ||
                            filters.assigned ||
                            filters.unassigned ||
                            filters.maintenance_due ||
                            filters.warranty_expiring_soon) && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="btn btn-secondary btn-sm inline-flex items-center gap-1"
                                title="Reset all filters"
                            >
                                <RotateCcw size={14} />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </form>

                {/* Quick Segment Filter Pills */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs overflow-x-auto">
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] shrink-0">
                        Quick Views:
                    </span>
                    <button
                        type="button"
                        onClick={() => resetFilters()}
                        className={`px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                            !filters.assigned &&
                            !filters.unassigned &&
                            !filters.maintenance_due &&
                            !filters.warranty_expiring_soon &&
                            !filters.status
                                ? "bg-blue-600 text-white font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        All Assets ({counts.total ?? 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleQuickFilter("assigned")}
                        className={`px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                            filters.assigned
                                ? "bg-blue-600 text-white font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        Assigned ({counts.assigned ?? 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleQuickFilter("unassigned")}
                        className={`px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                            filters.unassigned
                                ? "bg-blue-600 text-white font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        In Stock / Available ({counts.available ?? 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleQuickFilter("maintenance_due")}
                        className={`px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                            filters.maintenance_due
                                ? "bg-amber-600 text-white font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        Maintenance Due ({counts.maintenance_due_soon ?? 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => toggleQuickFilter("warranty_expiring_soon")}
                        className={`px-2.5 py-1 rounded-full text-xs transition shrink-0 ${
                            filters.warranty_expiring_soon
                                ? "bg-rose-600 text-white font-semibold"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                    >
                        Warranty Alert ({counts.warranty_expiring_soon ?? 0})
                    </button>
                </div>
            </div>

            {/* Asset Registry Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Asset Identification</th>
                                <th>Category</th>
                                <th>Brand & Model</th>
                                <th>Location & Branch</th>
                                <th>Assigned Custodian</th>
                                <th>Status</th>
                                <th>Service / Warranty</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(6)
                                    .fill(0)
                                    .map((_, index) => (
                                        <tr key={index}>
                                            {Array(8)
                                                .fill(0)
                                                .map((__, cell) => (
                                                    <td key={cell}>
                                                        <div className="skeleton skeleton-text" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : assets.length ? (
                                assets.map((asset) => {
                                    const custodian = asset.assigned_user || asset.assignedUser;
                                    const isWarrantyExpired =
                                        asset.warranty_expiry &&
                                        new Date(asset.warranty_expiry) < new Date();

                                    return (
                                        <tr key={asset.id}>
                                            {/* Asset Identification */}
                                            <td>
                                                <Link
                                                    to={`/assets/${asset.id}`}
                                                    className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 transition-colors block text-sm"
                                                >
                                                    {asset.name}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                                                    <span>{asset.asset_code}</span>
                                                    {asset.serial_number && (
                                                        <>
                                                            <span>·</span>
                                                            <span title="Serial Number">
                                                                S/N: {asset.serial_number}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td>
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                    {asset.category || "—"}
                                                </span>
                                            </td>

                                            {/* Brand & Model */}
                                            <td>
                                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    {asset.brand || "—"}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {asset.model || "—"}
                                                </div>
                                            </td>

                                            {/* Location & Branch */}
                                            <td>
                                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                    {asset.branch?.name || "Main Campus"}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {asset.department?.name || asset.location || "Central IT"}
                                                </div>
                                            </td>

                                            {/* Assigned Custodian */}
                                            <td>
                                                {custodian ? (
                                                    <div>
                                                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                                            <UserCheck size={12} className="text-blue-500" />
                                                            <span>{`${custodian.first_name} ${custodian.last_name}`}</span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 font-mono">
                                                            {custodian.employee_id ? `ID: ${custodian.employee_id}` : ""}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                        In Stock / Pool
                                                    </span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <StatusBadge
                                                    value={asset.status}
                                                    label={asset.status || "active"}
                                                    size="sm"
                                                />
                                            </td>

                                            {/* Service / Warranty indicators */}
                                            <td>
                                                {asset.next_maintenance_date && (
                                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                        <Clock size={11} className="text-amber-500" />
                                                        <span>Due: {asset.next_maintenance_date.slice(0, 10)}</span>
                                                    </div>
                                                )}
                                                {asset.warranty_expiry && (
                                                    <div
                                                        className={`text-[10px] mt-0.5 font-medium ${
                                                            isWarrantyExpired
                                                                ? "text-rose-500"
                                                                : "text-slate-400"
                                                        }`}
                                                    >
                                                        Warranty: {asset.warranty_expiry.slice(0, 10)}{" "}
                                                        {isWarrantyExpired && "(Expired)"}
                                                    </div>
                                                )}
                                                {!asset.next_maintenance_date && !asset.warranty_expiry && (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1">
                                                    <Link
                                                        to={`/assets/${asset.id}`}
                                                        className="btn btn-secondary btn-xs inline-flex items-center gap-1"
                                                        title="View Asset Details"
                                                    >
                                                        <Eye size={12} />
                                                        <span>View</span>
                                                    </Link>

                                                    {canManage && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setCustodyModal({
                                                                        isOpen: true,
                                                                        asset,
                                                                        mode: custodian ? "transfer" : "assign",
                                                                    })
                                                                }
                                                                className="btn btn-secondary btn-xs inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                                title={custodian ? "Transfer Custody" : "Assign Asset"}
                                                            >
                                                                <ArrowRightLeft size={12} />
                                                                <span>{custodian ? "Transfer" : "Assign"}</span>
                                                            </button>

                                                            {custodian && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setCustodyModal({
                                                                            isOpen: true,
                                                                            asset,
                                                                            mode: "return",
                                                                        })
                                                                    }
                                                                    className="btn btn-secondary btn-xs inline-flex items-center gap-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                                    title="Return to Stock Pool"
                                                                >
                                                                    <CornerDownLeft size={12} />
                                                                    <span>Return</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8}>
                                        <EmptyState
                                            icon={Laptop}
                                            title="No assets found"
                                            description="No equipment matches your search or filter configuration."
                                            action={
                                                canManage && (
                                                    <Link to="/assets/create" className="btn btn-primary btn-sm">
                                                        <Plus size={14} /> Add First Asset
                                                    </Link>
                                                )
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

            {/* Category Management Modal */}
            <AssetCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
            />

            {/* Custody Assignment / Transfer Modal */}
            <AssetCustodyModal
                isOpen={custodyModal.isOpen}
                onClose={() => setCustodyModal({ isOpen: false, asset: null, mode: "assign" })}
                asset={custodyModal.asset}
                mode={custodyModal.mode}
            />
        </div>
    );
}
