import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    CalendarClock,
    Cpu,
    HardDrive,
    MapPin,
    ShieldCheck,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    Laptop,
    Server,
    Wrench,
    User,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";

export default function AssetDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const canManage = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager", "technician"].includes(r.name || r)
    );
    const canDelete = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager"].includes(r.name || r)
    );

    const { data, isLoading, isError } = useQuery({
        queryKey: ["asset-detail", id],
        queryFn: () => api.get(`/assets/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/assets/${id}`),
        onSuccess: () => {
            toast.success("Asset deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            navigate("/assets");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete asset");
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    ))}
                </div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    Asset Not Found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    This asset may have been removed or is temporarily unavailable.
                </p>
                <Link
                    to="/assets"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                >
                    <ArrowLeft size={16} /> Back to Assets
                </Link>
            </div>
        );
    }

    const history = data.histories || [];
    const maintenance = data.maintenanceSchedules || [];

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
            case "in_service":
                return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400";
            case "maintenance":
            case "in_repair":
                return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400";
            case "retired":
            case "decommissioned":
                return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
            default:
                return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400";
        }
    };

    return (
        <div className="page-container space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        <ArrowLeft size={14} />
                        <Link to="/assets" className="hover:text-cyan-600 transition">
                            Asset Inventory
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                            {data.asset_code || `AST-${data.id}`}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {data.name}
                    </h1>
                </div>

                <div className="flex items-center gap-2.5">
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${getStatusStyle(
                            data.status
                        )}`}
                    >
                        {data.status || "Active"}
                    </span>

                    {canManage && (
                        <Link
                            to={`/assets/${id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                            <Edit size={14} /> Edit Asset
                        </Link>
                    )}

                    {canDelete && (
                        <button
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold transition"
                        >
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shrink-0">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {data.category || data.category_name || "Hardware"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                        <HardDrive size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Serial Number</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                            {data.serial_number || "—"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Location</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {data.location || "Hospital Facility"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Condition</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                            {data.condition || "Good"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Overview & Specs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <Laptop size={18} className="text-cyan-600" />
                            Asset Specifications & Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">Brand & Model</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {data.brand || "—"} {data.model ? `· ${data.model}` : ""}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">Assigned Custodian</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {data.assignedUser
                                        ? `${data.assignedUser.first_name} ${data.assignedUser.last_name}`
                                        : "Unassigned / IT Pool"}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">Department</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {data.department?.name || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">Hospital Branch</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {data.branch?.name || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">Network Hostname</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                    {data.hostname || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">Static / IP Address</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                    {data.ip_address || "—"}
                                </span>
                            </div>
                        </div>

                        {data.specifications && (
                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs text-slate-400 font-medium block mb-1.5">
                                    Technical Specifications
                                </span>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                                    {data.specifications}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Maintenance Schedule */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <Wrench size={18} className="text-cyan-600" />
                            Preventive Maintenance Schedules ({maintenance.length})
                        </h2>
                        {maintenance.length > 0 ? (
                            <div className="space-y-3">
                                {maintenance.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                                    >
                                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                            {entry.title || "Routine Service Check"}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {entry.description || "No service notes."}
                                        </p>
                                        <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
                                            <Calendar size={13} />
                                            <span>
                                                Scheduled:{" "}
                                                {entry.scheduled_date
                                                    ? new Date(entry.scheduled_date).toLocaleDateString()
                                                    : "—"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">No scheduled maintenance tasks for this asset.</p>
                        )}
                    </div>

                    {/* Audit History */}
                    {history.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                                <CalendarClock size={18} className="text-cyan-600" />
                                Asset Lifecycle & Audit History
                            </h2>
                            <div className="space-y-3">
                                {history.map((h) => (
                                    <div
                                        key={h.id}
                                        className="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2.5 last:border-0"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-slate-700 dark:text-slate-300 font-semibold">
                                                {h.action || "Asset Update"}
                                            </p>
                                            <p className="text-slate-500 mt-0.5">
                                                {h.description || "Operational activity recorded"}
                                            </p>
                                            <span className="text-slate-400 text-[11px] mt-1 block">
                                                {h.created_at ? new Date(h.created_at).toLocaleString() : "—"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Procurement & Vendor Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <DollarSign size={18} className="text-cyan-600" />
                            Procurement & Warranty
                        </h2>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Vendor / Supplier</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {data.vendor?.name || "Authorized IT Distributor"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Purchase Date</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {data.purchase_date
                                    ? new Date(data.purchase_date).toLocaleDateString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Warranty Expiry</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {data.warranty_expiry
                                    ? new Date(data.warranty_expiry).toLocaleDateString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">AMC Coverage Expiry</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {data.amc_expiry
                                    ? new Date(data.amc_expiry).toLocaleDateString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Procurement Cost</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {data.cost ? `₹${Number(data.cost).toLocaleString()}` : "—"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Asset"
                message={`Are you sure you want to permanently delete asset "${data.name}" (${data.asset_code})? This action cannot be undone.`}
                confirmText="Yes, Delete Asset"
                type="danger"
                onConfirm={() => {
                    setIsDeleteDialogOpen(false);
                    deleteMutation.mutate();
                }}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    );
}
