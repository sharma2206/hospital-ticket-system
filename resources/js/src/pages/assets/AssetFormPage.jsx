import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

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
        queryKey: ["asset-assigned-users"],
        queryFn: () => api.get("/it-staff").then((r) => r.data.data || []),
    });

    useEffect(() => {
        if (!isEdit) return;

        api.get(`/assets/${id}`).then((r) => {
            const asset = r.data.data || {};
            setForm({
                ...emptyForm,
                ...asset,
                vendor_id: asset.vendor_id || "",
                department_id: asset.department_id || "",
                branch_id: asset.branch_id || "",
                assigned_user_id: asset.assigned_user_id || "",
                purchase_date: asset.purchase_date
                    ? asset.purchase_date.slice(0, 10)
                    : "",
                warranty_expiry: asset.warranty_expiry
                    ? asset.warranty_expiry.slice(0, 10)
                    : "",
                amc_expiry: asset.amc_expiry
                    ? asset.amc_expiry.slice(0, 10)
                    : "",
                next_maintenance_date: asset.next_maintenance_date
                    ? asset.next_maintenance_date.slice(0, 10)
                    : "",
            });
        });
    }, [id, isEdit]);

    const mutation = useMutation({
        mutationFn: (payload) =>
            isEdit
                ? api.put(`/assets/${id}`, payload)
                : api.post("/assets", payload),
        onSuccess: () => navigate("/assets"),
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        const payload = { ...form };
        Object.keys(payload).forEach((key) => {
            if (payload[key] === "" || payload[key] === null)
                payload[key] = null;
        });
        mutation.mutate(payload);
    };

    return (
        <div
            className="asset-form-wrap"
            style={{ display: "grid", gap: "1rem" }}
        >
            <div className="page-header">
                <div>
                    <div className="page-title">
                        {isEdit ? "Edit Asset" : "Add Asset"}
                    </div>
                    <div className="page-subtitle">
                        Inventory and lifecycle tracking
                    </div>
                </div>
            </div>

            <form
                className="card"
                onSubmit={handleSubmit}
                style={{ padding: "1.25rem", display: "grid", gap: "1rem" }}
            >
                <div className="asset-form-grid">
                    <div className="form-group">
                        <label className="form-label">Asset code</label>
                        <input
                            className="form-input"
                            value={form.asset_code}
                            onChange={(e) =>
                                setForm({ ...form, asset_code: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            className="form-input"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input
                            className="form-input"
                            value={form.category}
                            onChange={(e) =>
                                setForm({ ...form, category: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sub category</label>
                        <input
                            className="form-input"
                            value={form.sub_category || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    sub_category: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>

                <div className="asset-form-grid">
                    <div className="form-group">
                        <label className="form-label">Brand</label>
                        <input
                            className="form-input"
                            value={form.brand || ""}
                            onChange={(e) =>
                                setForm({ ...form, brand: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Model</label>
                        <input
                            className="form-input"
                            value={form.model || ""}
                            onChange={(e) =>
                                setForm({ ...form, model: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Serial number</label>
                        <input
                            className="form-input"
                            value={form.serial_number || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    serial_number: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={form.status || "active"}
                            onChange={(e) =>
                                setForm({ ...form, status: e.target.value })
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="retired">Retired</option>
                            <option value="disposed">Disposed</option>
                        </select>
                    </div>
                </div>

                <div className="asset-form-grid">
                    <div className="form-group">
                        <label className="form-label">Vendor</label>
                        <select
                            className="form-select"
                            value={form.vendor_id || ""}
                            onChange={(e) =>
                                setForm({ ...form, vendor_id: e.target.value })
                            }
                        >
                            <option value="">None</option>
                            {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <select
                            className="form-select"
                            value={form.department_id || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    department_id: e.target.value,
                                })
                            }
                        >
                            <option value="">None</option>
                            {departments.map((department) => (
                                <option
                                    key={department.id}
                                    value={department.id}
                                >
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Branch</label>
                        <select
                            className="form-select"
                            value={form.branch_id || ""}
                            onChange={(e) =>
                                setForm({ ...form, branch_id: e.target.value })
                            }
                        >
                            <option value="">None</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Assigned user</label>
                        <select
                            className="form-select"
                            value={form.assigned_user_id || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    assigned_user_id: e.target.value,
                                })
                            }
                        >
                            <option value="">Unassigned</option>
                            {staff.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="asset-form-grid">
                    <div className="form-group">
                        <label className="form-label">Condition</label>
                        <select
                            className="form-select"
                            value={form.condition || "good"}
                            onChange={(e) =>
                                setForm({ ...form, condition: e.target.value })
                            }
                        >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Purchase date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.purchase_date || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    purchase_date: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Warranty expiry</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.warranty_expiry || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    warranty_expiry: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">AMC expiry</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.amc_expiry || ""}
                            onChange={(e) =>
                                setForm({ ...form, amc_expiry: e.target.value })
                            }
                        />
                    </div>
                </div>

                <div className="asset-form-grid">
                    <div className="form-group">
                        <label className="form-label">Cost</label>
                        <input
                            type="number"
                            className="form-input"
                            value={form.cost || ""}
                            onChange={(e) =>
                                setForm({ ...form, cost: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Depreciation rate</label>
                        <input
                            type="number"
                            className="form-input"
                            value={form.depreciation_rate || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    depreciation_rate: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                            className="form-input"
                            value={form.location || ""}
                            onChange={(e) =>
                                setForm({ ...form, location: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">
                            Next maintenance date
                        </label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.next_maintenance_date || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    next_maintenance_date: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>

                <div className="asset-form-grid">
                    <div className="form-group">
                        <label className="form-label">IP address</label>
                        <input
                            className="form-input"
                            value={form.ip_address || ""}
                            onChange={(e) =>
                                setForm({ ...form, ip_address: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">MAC address</label>
                        <input
                            className="form-input"
                            value={form.mac_address || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    mac_address: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Hostname</label>
                        <input
                            className="form-input"
                            value={form.hostname || ""}
                            onChange={(e) =>
                                setForm({ ...form, hostname: e.target.value })
                            }
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">OS version</label>
                        <input
                            className="form-input"
                            value={form.os_version || ""}
                            onChange={(e) =>
                                setForm({ ...form, os_version: e.target.value })
                            }
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Specifications</label>
                    <textarea
                        className="form-textarea"
                        rows={4}
                        value={form.specifications || ""}
                        onChange={(e) =>
                            setForm({ ...form, specifications: e.target.value })
                        }
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-textarea"
                        rows={3}
                        value={form.notes || ""}
                        onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                        }
                    />
                </div>

                <div className="asset-form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/assets")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending
                            ? "Saving..."
                            : isEdit
                              ? "Update Asset"
                              : "Create Asset"}
                    </button>
                </div>
            </form>
        </div>
    );
}
