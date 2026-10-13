import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    Laptop,
    Sparkles,
    Building2,
    DollarSign,
    Cpu,
    Calendar,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import PageHeader from "../../components/Shared/PageHeader";

const emptyForm = {
    asset_code: "",
    name: "",
    category: "",
    sub_category: "",
    brand: "",
    model: "",
    serial_number: "",
    purchase_date: "",
    warranty_expiry: "",
    amc_expiry: "",
    vendor_id: "",
    department_id: "",
    branch_id: "",
    assigned_user_id: "",
    status: "active",
    condition: "good",
    cost: "",
    depreciation_rate: "",
    location: "",
    ip_address: "",
    mac_address: "",
    hostname: "",
    os_version: "",
    specifications: "",
    notes: "",
    next_maintenance_date: "",
};

export default function AssetFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [form, setForm] = useState(emptyForm);

    // Queries
    const { data: categories = [] } = useQuery({
        queryKey: ["active-asset-categories"],
        queryFn: () =>
            api.get("/asset-categories", { params: { active: 1 } }).then((r) => r.data?.data || []),
    });

    const { data: vendors = [] } = useQuery({
        queryKey: ["vendors"],
        queryFn: () => api.get("/vendors").then((r) => r.data.data || []),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: () => api.get("/departments").then((r) => r.data.data || []),
    });

    const { data: branches = [] } = useQuery({
        queryKey: ["branches"],
        queryFn: () => api.get("/branches").then((r) => r.data.data || []),
    });

    const { data: staff = [] } = useQuery({
        queryKey: ["all-users-asset-form"],
        queryFn: () => api.get("/users", { params: { per_page: 100 } }).then((r) => r.data?.data || []),
    });

    // Populate data in edit mode
    useEffect(() => {
        if (!isEdit) return;

        api.get(`/assets/${id}`)
            .then((r) => {
                const asset = r.data.data || {};
                setForm({
                    ...emptyForm,
                    ...asset,
                    vendor_id: asset.vendor_id || "",
                    department_id: asset.department_id || "",
                    branch_id: asset.branch_id || "",
                    assigned_user_id: asset.assigned_user_id || "",
                    purchase_date: asset.purchase_date ? asset.purchase_date.slice(0, 10) : "",
                    warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.slice(0, 10) : "",
                    amc_expiry: asset.amc_expiry ? asset.amc_expiry.slice(0, 10) : "",
                    next_maintenance_date: asset.next_maintenance_date
                        ? asset.next_maintenance_date.slice(0, 10)
                        : "",
                });
            })
            .catch(() => {
                toast.error("Failed to load asset details");
                navigate("/assets");
            });
    }, [id, isEdit, navigate]);

    const mutation = useMutation({
        mutationFn: (payload) =>
            isEdit ? api.put(`/assets/${id}`, payload) : api.post("/assets", payload),
        onSuccess: (res) => {
            const saved = res.data?.data;
            toast.success(isEdit ? "Asset updated successfully" : "Asset registered successfully");
            navigate(saved?.id ? `/assets/${saved.id}` : "/assets");
        },
        onError: (err) => {
            const errs = err.response?.data?.errors;
            if (errs) {
                Object.values(errs)
                    .flat()
                    .forEach((msg) => toast.error(msg));
            } else {
                toast.error(err.response?.data?.message || "Failed to save asset");
            }
        },
    });

    const handleGenerateCode = () => {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        setForm((prev) => ({ ...prev, asset_code: `AST-${year}-${rand}` }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const payload = { ...form };
        Object.keys(payload).forEach((key) => {
            if (payload[key] === "" || payload[key] === null) {
                payload[key] = null;
            }
        });
        mutation.mutate(payload);
    };

    return (
        <div className="page-container space-y-6">
            <PageHeader
                title={isEdit ? `Edit Asset: ${form.name || form.asset_code}` : "Register New IT Asset"}
                subtitle="Complete hardware specification, custody location, and warranty registration"
                icon={Laptop}
                actions={
                    <Link to="/assets" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
                        <ArrowLeft size={15} />
                        <span>Back to Assets</span>
                    </Link>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1: IDENTIFICATION */}
                <div className="card p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Laptop size={16} className="text-blue-600" />
                            <span>1. Asset Identification</span>
                        </h2>
                        {!isEdit && (
                            <button
                                type="button"
                                onClick={handleGenerateCode}
                                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                            >
                                <Sparkles size={13} />
                                <span>Auto-Generate Code</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Asset Code *</label>
                            <input
                                className="form-control font-mono"
                                placeholder="AST-2026-0001"
                                value={form.asset_code}
                                onChange={(e) => setForm({ ...form, asset_code: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group sm:col-span-2">
                            <label className="form-label text-xs font-medium">Asset Name / Title *</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Dell Latitude 5440 Laptop - Nursing Station"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Category *</label>
                            <input
                                list="asset-categories-datalist"
                                className="form-control"
                                placeholder="Select or type category..."
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                required
                            />
                            <datalist id="asset-categories-datalist">
                                {categories.map((c) => (
                                    <option key={c.id || c.name} value={c.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Sub-Category</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Workstation, Thermal, Wireless"
                                value={form.sub_category || ""}
                                onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Brand / Manufacturer</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Dell, HP, Cisco, Zebra"
                                value={form.brand || ""}
                                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Model</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Latitude 5440, LaserJet Pro"
                                value={form.model || ""}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Serial Number</label>
                            <input
                                className="form-control font-mono"
                                placeholder="e.g. 7X89B12"
                                value={form.serial_number || ""}
                                onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: LOCATION & CUSTODY */}
                <div className="card p-5 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Building2 size={16} className="text-blue-600" />
                        <span>2. Hospital Location & Custody</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Department</label>
                            <select
                                className="form-control"
                                value={form.department_id || ""}
                                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                            >
                                <option value="">— Select Department —</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} {d.code ? `(${d.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Branch / Campus</label>
                            <select
                                className="form-control"
                                value={form.branch_id || ""}
                                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                            >
                                <option value="">— Select Campus —</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Room / Bed / Desk Location</label>
                            <input
                                className="form-control"
                                placeholder="e.g. OPD Room 204, Nursing Counter A"
                                value={form.location || ""}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Assigned Custodian (Staff)</label>
                            <select
                                className="form-control"
                                value={form.assigned_user_id || ""}
                                onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                            >
                                <option value="">— Unassigned (In Stock Pool) —</option>
                                {staff.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.first_name} {u.last_name} {u.employee_id ? `(${u.employee_id})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Asset Condition</label>
                            <select
                                className="form-control"
                                value={form.condition || "good"}
                                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                            >
                                <option value="good">Good (Fully Operational)</option>
                                <option value="fair">Fair (Normal Wear, Operable)</option>
                                <option value="poor">Poor (Requires Service)</option>
                                <option value="damaged">Damaged (Faulty)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Lifecycle Status</label>
                            <select
                                className="form-control"
                                value={form.status || "active"}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                            >
                                <option value="active">Active (In Service)</option>
                                <option value="maintenance">Maintenance</option>
                                <option value="repair">In Repair</option>
                                <option value="inactive">Inactive / Stock</option>
                                <option value="retired">Retired</option>
                                <option value="disposed">Disposed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* SECTION 3: PROCUREMENT & WARRANTY */}
                <div className="card p-5 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <DollarSign size={16} className="text-emerald-600" />
                        <span>3. Procurement & Warranty Tracking</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Vendor / Supplier</label>
                            <select
                                className="form-control"
                                value={form.vendor_id || ""}
                                onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                            >
                                <option value="">— Select Vendor —</option>
                                {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Purchase Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.purchase_date || ""}
                                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Procurement Cost (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={form.cost || ""}
                                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Warranty Expiry Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.warranty_expiry || ""}
                                onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">AMC Coverage Expiry Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.amc_expiry || ""}
                                onChange={(e) => setForm({ ...form, amc_expiry: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Next Scheduled Maintenance Date</label>
                            <input
                                type="date"
                                className="form-control"
                                value={form.next_maintenance_date || ""}
                                onChange={(e) => setForm({ ...form, next_maintenance_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 4: TECHNICAL & NETWORK */}
                <div className="card p-5 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Cpu size={16} className="text-blue-600" />
                        <span>4. Network & Operating System Configuration</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Hostname</label>
                            <input
                                className="form-control font-mono"
                                placeholder="e.g. OPD-WS-01.hosp.local"
                                value={form.hostname || ""}
                                onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Static / IP Address</label>
                            <input
                                className="form-control font-mono"
                                placeholder="e.g. 192.168.10.45"
                                value={form.ip_address || ""}
                                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">MAC Address</label>
                            <input
                                className="form-control font-mono"
                                placeholder="e.g. 00:1A:2B:3C:4D:5E"
                                value={form.mac_address || ""}
                                onChange={(e) => setForm({ ...form, mac_address: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">OS / Firmware Version</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Windows 11 Pro 23H2"
                                value={form.os_version || ""}
                                onChange={(e) => setForm({ ...form, os_version: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Technical Specifications</label>
                            <textarea
                                className="form-control font-mono text-xs"
                                rows={3}
                                placeholder="CPU: Intel Core i5-1345U&#10;RAM: 16GB DDR5&#10;Storage: 512GB NVMe SSD"
                                value={form.specifications || ""}
                                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Operational Notes</label>
                            <textarea
                                className="form-control text-xs"
                                rows={3}
                                placeholder="Special software installed, clinical peripheral attachments..."
                                value={form.notes || ""}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Link to="/assets" className="btn btn-secondary btn-sm">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                        disabled={mutation.isPending}
                    >
                        <Save size={15} />
                        <span>{mutation.isPending ? "Saving Asset..." : isEdit ? "Update Asset" : "Register Asset"}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
