import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    UserCheck,
    ArrowRightLeft,
    CornerDownLeft,
    Activity,
    Save,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import Modal from "../Shared/Modal";

export default function AssetCustodyModal({
    isOpen,
    onClose,
    asset,
    mode = "assign", // "assign" | "transfer" | "return" | "status"
}) {
    const queryClient = useQueryClient();

    // Form fields
    const [userId, setUserId] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [location, setLocation] = useState("");
    const [condition, setCondition] = useState("good");
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState("active");

    useEffect(() => {
        if (asset) {
            setDepartmentId(asset.department_id ? String(asset.department_id) : "");
            setBranchId(asset.branch_id ? String(asset.branch_id) : "");
            setLocation(asset.location || "");
            setCondition(asset.condition || "good");
            setStatus(asset.status || "active");
            setUserId(asset.assigned_user_id ? String(asset.assigned_user_id) : "");
            setNotes("");
        }
    }, [asset, mode, isOpen]);

    // Data options
    const { data: users = [] } = useQuery({
        queryKey: ["all-staff-users"],
        queryFn: () => api.get("/users", { params: { per_page: 100 } }).then((r) => r.data?.data || []),
        enabled: isOpen,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["departments"],
        queryFn: () => api.get("/departments").then((r) => r.data?.data || r.data || []),
        enabled: isOpen,
    });

    const { data: branches = [] } = useQuery({
        queryKey: ["branches"],
        queryFn: () => api.get("/branches").then((r) => r.data?.data || r.data || []),
        enabled: isOpen,
    });

    const deptList = Array.isArray(departments) ? departments : (Array.isArray(departments?.data) ? departments.data : []);
    const branchList = Array.isArray(branches) ? branches : (Array.isArray(branches?.data) ? branches.data : []);

    const mutation = useMutation({
        mutationFn: (payload) => {
            if (mode === "assign") {
                return api.post(`/assets/${asset.id}/assign`, payload);
            }
            if (mode === "transfer") {
                return api.post(`/assets/${asset.id}/transfer`, payload);
            }
            if (mode === "return") {
                return api.post(`/assets/${asset.id}/return`, payload);
            }
            if (mode === "status") {
                return api.post(`/assets/${asset.id}/status`, payload);
            }
        },
        onSuccess: (res) => {
            toast.success(res.data?.message || "Asset custody updated successfully");
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["asset-detail", String(asset?.id)] });
            queryClient.invalidateQueries({ queryKey: ["assets-dashboard"] });
            onClose();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Operation failed";
            toast.error(msg);
        },
    });

    if (!asset) return null;

    const titles = {
        assign: "Assign Asset Custody",
        transfer: "Transfer Asset Custody",
        return: "Return Asset to Inventory Pool",
        status: "Update Asset Lifecycle Status",
    };

    const subtitles = {
        assign: `Assign ${asset.asset_code} (${asset.name}) to a staff member or department`,
        transfer: `Transfer custody of ${asset.asset_code} with handover records`,
        return: `De-allocate ${asset.asset_code} and return to stock or maintenance pool`,
        status: `Change operational state for ${asset.asset_code}`,
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === "assign") {
            if (!userId && !departmentId) {
                toast.error("Please select an employee or department for assignment");
                return;
            }
            mutation.mutate({
                assigned_user_id: userId ? Number(userId) : null,
                department_id: departmentId ? Number(departmentId) : null,
                branch_id: branchId ? Number(branchId) : null,
                location: location || null,
                condition,
                notes,
            });
        } else if (mode === "transfer") {
            if (!userId) {
                toast.error("Please select the recipient employee");
                return;
            }
            mutation.mutate({
                to_user_id: Number(userId),
                to_department_id: departmentId ? Number(departmentId) : null,
                to_branch_id: branchId ? Number(branchId) : null,
                to_location: location || null,
                condition,
                handover_notes: notes,
            });
        } else if (mode === "return") {
            mutation.mutate({
                return_condition: condition,
                return_location: location || "Central IT Warehouse",
                notes: notes || "Returned to inventory pool",
            });
        } else if (mode === "status") {
            mutation.mutate({
                status,
                notes,
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={titles[mode]}
            subtitle={subtitles[mode]}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Context Pill */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                        <span className="text-slate-400 block font-mono">{asset.asset_code}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{asset.name}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block">Current Holder</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                            {(asset.assignedUser || asset.assigned_user)
                                ? `${(asset.assignedUser || asset.assigned_user).first_name} ${(asset.assignedUser || asset.assigned_user).last_name}`
                                : "Unassigned / Stock"}
                        </span>
                    </div>
                </div>

                {/* Status Mode */}
                {mode === "status" && (
                    <div className="form-group">
                        <label className="form-label text-xs font-medium">Lifecycle Status *</label>
                        <select
                            className="form-control"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                        >
                            <option value="active">Active (In Service)</option>
                            <option value="maintenance">Maintenance (Routine Inspection)</option>
                            <option value="repair">In Repair (Damaged / External Vendor)</option>
                            <option value="inactive">Inactive (Stored in Pool)</option>
                            <option value="retired">Retired (End of Life)</option>
                            <option value="disposed">Disposed (Scrapped / E-waste)</option>
                        </select>
                    </div>
                )}

                {/* Custodian Selection for Assign & Transfer */}
                {(mode === "assign" || mode === "transfer") && (
                    <div className="form-group">
                        <label className="form-label text-xs font-medium">
                            {mode === "transfer" ? "New Custodian (Employee) *" : "Assign To Employee"}
                        </label>
                        <select
                            className="form-control"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required={mode === "transfer"}
                        >
                            <option value="">— Select Hospital Staff Member —</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name} {u.employee_id ? `(${u.employee_id})` : ""} {u.department?.name ? `· ${u.department.name}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Department & Branch */}
                {(mode === "assign" || mode === "transfer") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Department</label>
                            <select
                                className="form-control"
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                            >
                                <option value="">— Select Department —</option>
                                {deptList.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Branch / Campus</label>
                            <select
                                className="form-control"
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                            >
                                <option value="">— Select Branch —</option>
                                {branchList.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Location / Room */}
                {mode !== "status" && (
                    <div className="form-group">
                        <label className="form-label text-xs font-medium">
                            {mode === "return" ? "Storage Location / Shelf" : "Room / Floor / Desk Location"}
                        </label>
                        <input
                            className="form-control"
                            placeholder={mode === "return" ? "e.g. IT Warehouse Rack B-4" : "e.g. ICU Bed 4, OPD Room 201"}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                )}

                {/* Condition */}
                {mode !== "status" && (
                    <div className="form-group">
                        <label className="form-label text-xs font-medium">Condition at Handover / Return</label>
                        <select
                            className="form-control"
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                        >
                            <option value="good">Good (Fully Operational)</option>
                            <option value="fair">Fair (Normal Wear, Operable)</option>
                            <option value="poor">Poor (Requires Attention)</option>
                            <option value="damaged">Damaged (Needs Repair)</option>
                        </select>
                    </div>
                )}

                {/* Handover / Return / Transition Notes */}
                <div className="form-group">
                    <label className="form-label text-xs font-medium">
                        {mode === "transfer" ? "Handover & Custody Notes" : mode === "return" ? "Return Reason & Notes" : "Operational Remarks"}
                    </label>
                    <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Any physical damages, accessories returned (chargers, cables), or reason..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                        disabled={mutation.isPending}
                    >
                        <Save size={14} />
                        <span>{mutation.isPending ? "Processing..." : "Confirm Action"}</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
