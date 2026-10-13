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
    ArrowRightLeft,
    CornerDownLeft,
    Plus,
    Clock,
    Ticket,
    QrCode,
    Printer,
    FileText,
    History,
    AlertTriangle,
    CheckCircle,
    Activity,
    ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";
import StatusBadge from "../../components/Common/StatusBadge";
import AssetCustodyModal from "../../components/Assets/AssetCustodyModal";
import MaintenanceModal from "../../components/Assets/MaintenanceModal";

export default function AssetDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState("overview");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Modals
    const [custodyModal, setCustodyModal] = useState({
        isOpen: false,
        mode: "assign", // "assign" | "transfer" | "return" | "status"
    });

    const [maintenanceModal, setMaintenanceModal] = useState({
        isOpen: false,
        schedule: null,
        mode: "schedule", // "schedule" | "complete"
    });

    const canManage = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager", "technician"].includes(r.name || r)
    );
    const canDelete = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager"].includes(r.name || r)
    );

    const { data: asset, isLoading, isError } = useQuery({
        queryKey: ["asset-detail", id],
        queryFn: () => api.get(`/assets/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/assets/${id}`),
        onSuccess: () => {
            toast.success("Asset deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["assets-dashboard"] });
            navigate("/assets");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete asset");
        },
    });

    if (isLoading) {
        return (
            <div className="page-container space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    ))}
                </div>
                <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
        );
    }

    if (isError || !asset) {
        return (
            <div className="page-container">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={24} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                        Asset Not Found
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        This equipment record may have been removed or is unavailable.
                    </p>
                    <Link
                        to="/assets"
                        className="btn btn-primary btn-sm inline-flex items-center gap-2"
                    >
                        <ArrowLeft size={16} /> Back to Asset Registry
                    </Link>
                </div>
            </div>
        );
    }

    const histories = asset.histories || [];
    const maintenanceSchedules = asset.maintenanceSchedules || [];
    const tickets = asset.tickets || [];
    const custodian = asset.assignedUser || asset.assigned_user;

    const isWarrantyExpired =
        asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date();
    const isMaintenanceDue =
        asset.next_maintenance_date &&
        new Date(asset.next_maintenance_date) <= new Date(Date.now() + 14 * 86400000);

    const handlePrintTag = () => {
        window.print();
    };

    return (
        <div className="page-container space-y-6">
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        <ArrowLeft size={14} />
                        <Link to="/assets" className="hover:text-blue-600 transition">
                            Asset Inventory
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono">
                            {asset.asset_code}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {asset.name}
                        </h1>
                        <StatusBadge value={asset.status} label={asset.status || "active"} size="sm" />
                        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                            Condition: {asset.condition || "Good"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Link
                        to={`/tickets/create?asset_id=${asset.id}`}
                        className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                        title="Raise IT Ticket for this Asset"
                    >
                        <Ticket size={14} className="text-purple-600" />
                        <span>Raise Ticket</span>
                    </Link>

                    {canManage && (
                        <>
                            <button
                                type="button"
                                onClick={() =>
                                    setCustodyModal({
                                        isOpen: true,
                                        mode: custodian ? "transfer" : "assign",
                                    })
                                }
                                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                            >
                                <ArrowRightLeft size={14} className="text-blue-600" />
                                <span>{custodian ? "Transfer Custody" : "Assign Asset"}</span>
                            </button>

                            {custodian && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCustodyModal({
                                            isOpen: true,
                                            mode: "return",
                                        })
                                    }
                                    className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                                >
                                    <CornerDownLeft size={14} className="text-amber-600" />
                                    <span>Return to Pool</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() =>
                                    setCustodyModal({
                                        isOpen: true,
                                        mode: "status",
                                    })
                                }
                                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                                title="Change lifecycle status"
                            >
                                <Activity size={14} className="text-teal-600" />
                                <span>Lifecycle Status</span>
                            </button>

                            <Link
                                to={`/assets/${id}/edit`}
                                className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                            >
                                <Edit size={14} />
                                <span>Edit</span>
                            </Link>
                        </>
                    )}

                    {canDelete && (
                        <button
                            type="button"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                            <Trash2 size={14} />
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick KPI Header Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="card p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Category</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                        {asset.category || "General Hardware"}
                    </span>
                </div>

                <div className="card p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Serial Number</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono truncate block mt-0.5">
                        {asset.serial_number || "—"}
                    </span>
                </div>

                <div className="card p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Current Custodian</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                        {custodian
                            ? `${custodian.first_name} ${custodian.last_name}`
                            : "Unassigned (Pool)"}
                    </span>
                </div>

                <div className="card p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Location / Branch</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                        {asset.branch?.name || asset.location || "Main Campus"}
                    </span>
                </div>

                <div className="card p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Next Maintenance</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span
                            className={`text-sm font-bold ${
                                isMaintenanceDue ? "text-amber-600" : "text-slate-800 dark:text-slate-100"
                            }`}
                        >
                            {asset.next_maintenance_date ? asset.next_maintenance_date.slice(0, 10) : "Not Set"}
                        </span>
                        {isMaintenanceDue && (
                            <Clock size={13} className="text-amber-500 shrink-0" />
                        )}
                    </div>
                </div>

                <div className="card p-3">
                    <span className="text-[11px] font-medium text-slate-400 block">Warranty Status</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span
                            className={`text-sm font-bold ${
                                isWarrantyExpired
                                    ? "text-rose-600"
                                    : asset.warranty_expiry
                                    ? "text-emerald-600"
                                    : "text-slate-800 dark:text-slate-100"
                            }`}
                        >
                            {asset.warranty_expiry ? asset.warranty_expiry.slice(0, 10) : "No Warranty"}
                        </span>
                        {isWarrantyExpired && (
                            <AlertTriangle size={13} className="text-rose-500 shrink-0" />
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-sm font-medium">
                <button
                    type="button"
                    onClick={() => setActiveTab("overview")}
                    className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-2 shrink-0 ${
                        activeTab === "overview"
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                    <Laptop size={15} />
                    <span>Overview & Specs</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("custody")}
                    className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-2 shrink-0 ${
                        activeTab === "custody"
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                    <User size={15} />
                    <span>Custody & Location ({histories.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("maintenance")}
                    className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-2 shrink-0 ${
                        activeTab === "maintenance"
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                    <Wrench size={15} />
                    <span>Preventive Maintenance ({maintenanceSchedules.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("tickets")}
                    className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-2 shrink-0 ${
                        activeTab === "tickets"
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                    <Ticket size={15} />
                    <span>Linked Tickets ({tickets.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className={`px-3 py-1.5 rounded-lg transition inline-flex items-center gap-2 shrink-0 ${
                        activeTab === "qr"
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                >
                    <QrCode size={15} />
                    <span>Printable Asset Tag</span>
                </button>
            </div>

            {/* TAB CONTENT */}

            {/* TAB 1: OVERVIEW & SPECS */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Technical & Hardware Specs */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="card p-6 space-y-4">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Cpu size={18} className="text-blue-600" />
                                <span>Hardware & Network Specifications</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Brand</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.brand || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Model</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.model || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Sub-Category</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.sub_category || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Hostname</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                        {asset.hostname || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">IP Address</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                        {asset.ip_address || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">MAC Address</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                        {asset.mac_address || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">OS / Firmware</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.os_version || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Last Maintenance</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.last_maintenance_date ? asset.last_maintenance_date.slice(0, 10) : "Never serviced"}
                                    </span>
                                </div>
                            </div>

                            {asset.specifications && (
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs text-slate-400 font-medium block mb-1">
                                        Technical Details & Memory Configuration
                                    </span>
                                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800 whitespace-pre-wrap font-mono">
                                        {asset.specifications}
                                    </div>
                                </div>
                            )}

                            {asset.notes && (
                                <div className="pt-2">
                                    <span className="text-xs text-slate-400 font-medium block mb-1">
                                        Operational Notes
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {asset.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Procurement & Warranty Details */}
                    <div className="space-y-6">
                        <div className="card p-6 space-y-4">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <DollarSign size={18} className="text-emerald-600" />
                                <span>Procurement & AMC</span>
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Vendor / Supplier</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.vendor?.name || "Standard Hospital IT Supplier"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Purchase Date</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.purchase_date ? asset.purchase_date.slice(0, 10) : "—"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Procurement Cost</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-emerald-600">
                                        {asset.cost ? `₹${Number(asset.cost).toLocaleString()}` : "—"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Warranty Expiry</span>
                                    <span
                                        className={`font-semibold ${
                                            isWarrantyExpired
                                                ? "text-rose-600"
                                                : "text-slate-800 dark:text-slate-200"
                                        }`}
                                    >
                                        {asset.warranty_expiry ? asset.warranty_expiry.slice(0, 10) : "—"}{" "}
                                        {isWarrantyExpired && "(Expired)"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Annual Maintenance Contract (AMC)</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.amc_expiry ? asset.amc_expiry.slice(0, 10) : "No AMC Active"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-slate-400 font-medium block">Depreciation Rate</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {asset.depreciation_rate ? `${asset.depreciation_rate}% / year` : "15% (IT Standard)"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: CUSTODY & LOCATION */}
            {activeTab === "custody" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Custodian & Department Card */}
                    <div className="card p-6 space-y-4">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <User size={18} className="text-blue-600" />
                            <span>Current Custody Status</span>
                        </h2>

                        {custodian ? (
                            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                                <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                                    Primary Custodian
                                </div>
                                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    {custodian.first_name} {custodian.last_name}
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    Employee ID: {custodian.employee_id || "N/A"}
                                </div>
                                {custodian.email && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Email: {custodian.email}
                                    </div>
                                )}
                                {custodian.phone && (
                                    <div className="text-xs text-slate-600 dark:text-slate-400">
                                        Phone: {custodian.phone}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center text-xs text-slate-500">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Currently In Stock Pool
                                </p>
                                <p>Not assigned to any individual employee. Available for issuance.</p>
                            </div>
                        )}

                        <div className="space-y-3 pt-2 text-xs">
                            <div>
                                <span className="text-slate-400 font-medium block">Allocated Department</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {asset.department?.name || "Central IT Department"}
                                </span>
                            </div>

                            <div>
                                <span className="text-slate-400 font-medium block">Branch Campus</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {asset.branch?.name || "Main Hospital Complex"}
                                </span>
                            </div>

                            <div>
                                <span className="text-slate-400 font-medium block">Physical Location / Room</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {asset.location || "Room / Shelf not specified"}
                                </span>
                            </div>
                        </div>

                        {canManage && (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCustodyModal({
                                            isOpen: true,
                                            mode: custodian ? "transfer" : "assign",
                                        })
                                    }
                                    className="btn btn-primary btn-sm flex-1 inline-flex items-center justify-center gap-1.5"
                                >
                                    <ArrowRightLeft size={14} />
                                    <span>{custodian ? "Transfer Custody" : "Assign Staff"}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Timeline of Movement & Custody History */}
                    <div className="lg:col-span-2 card p-6 space-y-4">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <History size={18} className="text-blue-600" />
                            <span>Custody & Movement Timeline ({histories.length})</span>
                        </h2>

                        {histories.length > 0 ? (
                            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                                {histories.map((h) => (
                                    <div key={h.id} className="relative group">
                                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 group-hover:scale-125 transition-transform" />
                                        <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                                    {h.action || "Activity"}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {h.created_at ? new Date(h.created_at).toLocaleString() : ""}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                {h.description}
                                            </p>
                                            {h.performer && (
                                                <div className="text-[10px] text-slate-400 mt-1.5">
                                                    Recorded by: {h.performer.first_name} {h.performer.last_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                No historical movements or custody changes recorded yet.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: PREVENTIVE MAINTENANCE */}
            {activeTab === "maintenance" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                Preventive Maintenance Schedule & Service History
                            </h2>
                            <p className="text-xs text-slate-500">
                                Scheduled inspections, thermal servicing, calibrations, and recurring maintenance
                            </p>
                        </div>
                        {canManage && (
                            <button
                                type="button"
                                onClick={() =>
                                    setMaintenanceModal({
                                        isOpen: true,
                                        schedule: null,
                                        mode: "schedule",
                                    })
                                }
                                className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                            >
                                <Plus size={14} />
                                <span>Schedule Service</span>
                            </button>
                        )}
                    </div>

                    <div className="card">
                        <div className="table-wrapper">
                            <table className="table text-xs">
                                <thead>
                                    <tr>
                                        <th>Service Task</th>
                                        <th>Type & Frequency</th>
                                        <th>Due / Scheduled Date</th>
                                        <th>Assigned Technician / Vendor</th>
                                        <th>Status</th>
                                        <th>Completion Details</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maintenanceSchedules.length > 0 ? (
                                        maintenanceSchedules.map((ms) => {
                                            const isOverdue =
                                                ms.status === "scheduled" &&
                                                new Date(ms.scheduled_date) < new Date();

                                            return (
                                                <tr key={ms.id}>
                                                    <td>
                                                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                                            {ms.title}
                                                        </div>
                                                        {ms.description && (
                                                            <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                                                                {ms.description}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                                                            {ms.maintenance_type || "Preventive"}
                                                        </span>
                                                        <div className="text-slate-400 capitalize text-[10px]">
                                                            {ms.frequency || "Quarterly"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                            {ms.scheduled_date ? ms.scheduled_date.slice(0, 10) : "—"}
                                                        </div>
                                                        {isOverdue && (
                                                            <span className="text-[10px] text-rose-500 font-bold block">
                                                                Overdue
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {ms.assignedUser ? (
                                                            <span>
                                                                {ms.assignedUser.first_name} {ms.assignedUser.last_name}
                                                            </span>
                                                        ) : ms.vendor ? (
                                                            <span>Vendor: {ms.vendor.name}</span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Internal IT Team</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                ms.status === "completed"
                                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                                    : isOverdue
                                                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                                            }`}
                                                        >
                                                            {ms.status === "completed" ? "Completed" : isOverdue ? "Overdue" : "Scheduled"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {ms.status === "completed" ? (
                                                            <div className="text-[11px] text-slate-600 dark:text-slate-400">
                                                                <div>Done: {ms.completed_at ? ms.completed_at.slice(0, 10) : "Yes"}</div>
                                                                {ms.cost && <div>Cost: ₹{Number(ms.cost).toLocaleString()}</div>}
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Pending execution</span>
                                                        )}
                                                    </td>
                                                    <td className="text-right">
                                                        {canManage && ms.status !== "completed" && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setMaintenanceModal({
                                                                        isOpen: true,
                                                                        schedule: ms,
                                                                        mode: "complete",
                                                                    })
                                                                }
                                                                className="btn btn-secondary btn-xs inline-flex items-center gap-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                            >
                                                                <CheckCircle size={12} />
                                                                <span>Complete</span>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-6 text-slate-400">
                                                No maintenance schedules defined for this asset.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: LINKED TICKETS */}
            {activeTab === "tickets" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                IT Service Desk Tickets Linked to this Asset
                            </h2>
                            <p className="text-xs text-slate-500">
                                Fault reports, breakdown tickets, and service requests affecting {asset.asset_code}
                            </p>
                        </div>
                        <Link
                            to={`/tickets/create?asset_id=${asset.id}`}
                            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                        >
                            <Plus size={14} />
                            <span>Raise New Ticket</span>
                        </Link>
                    </div>

                    <div className="card">
                        <div className="table-wrapper">
                            <table className="table text-xs">
                                <thead>
                                    <tr>
                                        <th>Ticket #</th>
                                        <th>Title & Subject</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Reported By</th>
                                        <th>Created Date</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length > 0 ? (
                                        tickets.map((t) => (
                                            <tr key={t.id}>
                                                <td className="font-mono font-bold text-blue-600">
                                                    #{t.ticket_number || t.id}
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/tickets/${t.id}`}
                                                        className="font-semibold text-slate-800 dark:text-slate-200 hover:underline block text-sm"
                                                    >
                                                        {t.title}
                                                    </Link>
                                                </td>
                                                <td>
                                                    <StatusBadge
                                                        value={t.status?.code || t.status?.name}
                                                        label={t.status?.name || "Open"}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {t.priority?.name || "Normal"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {t.creator
                                                        ? `${t.creator.first_name} ${t.creator.last_name}`
                                                        : t.requester_name || "—"}
                                                </td>
                                                <td className="text-slate-500">
                                                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                                                </td>
                                                <td className="text-right">
                                                    <Link
                                                        to={`/tickets/${t.id}`}
                                                        className="btn btn-secondary btn-xs inline-flex items-center gap-1"
                                                    >
                                                        <ExternalLink size={12} />
                                                        <span>View</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="text-center py-6 text-slate-400">
                                                No service desk tickets associated with this asset yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: PRINTABLE ASSET TAG & QR */}
            {activeTab === "qr" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                                Official Hospital IT Hardware Asset Label
                            </h2>
                            <p className="text-xs text-slate-500">
                                Print barcode & QR asset identifier tag for physical attachment to hardware
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePrintTag}
                            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                        >
                            <Printer size={15} />
                            <span>Print Asset Tag</span>
                        </button>
                    </div>

                    <div className="flex justify-center p-6 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        {/* Physical Tag Card */}
                        <div
                            id="hospital-asset-tag"
                            className="w-[380px] bg-white text-slate-900 p-5 rounded-xl border-2 border-slate-900 shadow-md space-y-3"
                        >
                            <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                                        Hospital IT Service Desk
                                    </div>
                                    <div className="text-sm font-black tracking-tight text-slate-900">
                                        PROPERTY OF HOSPITAL IT
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                    IT
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-1">
                                <div className="space-y-1">
                                    <div className="font-mono text-xl font-black text-slate-900 tracking-wider">
                                        {asset.asset_code}
                                    </div>
                                    <div className="text-xs font-bold text-slate-800 line-clamp-1">
                                        {asset.name}
                                    </div>
                                    <div className="text-[10px] text-slate-600">
                                        Category: <span className="font-semibold">{asset.category || "IT Hardware"}</span>
                                    </div>
                                    {asset.serial_number && (
                                        <div className="text-[10px] text-slate-600 font-mono">
                                            S/N: {asset.serial_number}
                                        </div>
                                    )}
                                </div>

                                {/* Visual QR Code Representation */}
                                <div className="w-20 h-20 bg-slate-100 border border-slate-900 p-1 flex flex-col items-center justify-center rounded">
                                    <QrCode size={48} className="text-slate-900" />
                                    <span className="text-[8px] font-mono text-slate-600 mt-0.5">SCAN TAG</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-300 pt-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <span>{asset.branch?.name || "Main Campus"}</span>
                                <span>{asset.department?.name || "IT Dept"}</span>
                                <span>DO NOT REMOVE</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custody Modal */}
            <AssetCustodyModal
                isOpen={custodyModal.isOpen}
                onClose={() => setCustodyModal({ isOpen: false, mode: "assign" })}
                asset={asset}
                mode={custodyModal.mode}
            />

            {/* Maintenance Modal */}
            <MaintenanceModal
                isOpen={maintenanceModal.isOpen}
                onClose={() => setMaintenanceModal({ isOpen: false, schedule: null, mode: "schedule" })}
                asset={asset}
                schedule={maintenanceModal.schedule}
                mode={maintenanceModal.mode}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Asset"
                message={`Are you sure you want to permanently delete asset "${asset.name}" (${asset.asset_code})? This action cannot be undone.`}
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
