import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, CheckCircle2, Calendar, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import Modal from "../Shared/Modal";

export default function MaintenanceModal({
    isOpen,
    onClose,
    asset,
    schedule = null, // if passed, we are completing or editing this schedule
    mode = "schedule", // "schedule" | "complete"
}) {
    const queryClient = useQueryClient();

    // Scheduling fields
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [maintenanceType, setMaintenanceType] = useState("preventive");
    const [scheduledDate, setScheduledDate] = useState("");
    const [frequency, setFrequency] = useState("quarterly");
    const [assignedTo, setAssignedTo] = useState("");
    const [vendorId, setVendorId] = useState("");
    const [estimatedCost, setEstimatedCost] = useState("");

    // Completion fields
    const [workPerformed, setWorkPerformed] = useState("");
    const [partsReplaced, setPartsReplaced] = useState("");
    const [actualCost, setActualCost] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (schedule) {
            setTitle(schedule.title || "");
            setDescription(schedule.description || "");
            setMaintenanceType(schedule.maintenance_type || "preventive");
            setScheduledDate(schedule.scheduled_date ? schedule.scheduled_date.slice(0, 10) : "");
            setFrequency(schedule.frequency || "quarterly");
            setAssignedTo(schedule.assigned_to ? String(schedule.assigned_to) : "");
            setVendorId(schedule.vendor_id ? String(schedule.vendor_id) : "");
            setEstimatedCost(schedule.cost || "");
        } else {
            setTitle("Routine Preventive Maintenance");
            setDescription("Standard hospital IT diagnostic, thermal paste inspection, and firmware check.");
            setMaintenanceType("preventive");
            const d = new Date();
            d.setDate(d.getDate() + 30);
            setScheduledDate(d.toISOString().slice(0, 10));
            setFrequency("quarterly");
            setAssignedTo("");
            setVendorId(asset?.vendor_id ? String(asset.vendor_id) : "");
            setEstimatedCost("");
        }
        setWorkPerformed("");
        setPartsReplaced("");
        setActualCost("");
        setNotes("");
    }, [schedule, asset, isOpen, mode]);

    const { data: staff = [] } = useQuery({
        queryKey: ["it-staff-list"],
        queryFn: () => api.get("/it-staff").then((r) => r.data?.data || []),
        enabled: isOpen,
    });

    const { data: vendors = [] } = useQuery({
        queryKey: ["vendors"],
        queryFn: () => api.get("/vendors").then((r) => r.data?.data || []),
        enabled: isOpen,
    });

    const scheduleMutation = useMutation({
        mutationFn: (payload) => api.post("/maintenance-schedules", payload),
        onSuccess: () => {
            toast.success("Maintenance scheduled successfully");
            queryClient.invalidateQueries({ queryKey: ["asset-detail", String(asset?.id)] });
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["assets-dashboard"] });
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to schedule maintenance");
        },
    });

    const completeMutation = useMutation({
        mutationFn: (payload) =>
            api.post(`/maintenance-schedules/${schedule.id}/complete`, payload),
        onSuccess: () => {
            toast.success("Maintenance marked as completed & next schedule updated!");
            queryClient.invalidateQueries({ queryKey: ["asset-detail", String(asset?.id)] });
            queryClient.invalidateQueries({ queryKey: ["assets"] });
            queryClient.invalidateQueries({ queryKey: ["assets-dashboard"] });
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to complete maintenance");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === "complete") {
            completeMutation.mutate({
                work_performed: workPerformed,
                parts_replaced: partsReplaced || null,
                cost: actualCost ? Number(actualCost) : null,
                notes: notes || null,
            });
        } else {
            scheduleMutation.mutate({
                asset_id: asset.id,
                title,
                description,
                maintenance_type: maintenanceType,
                scheduled_date: scheduledDate,
                frequency,
                assigned_to: assignedTo ? Number(assignedTo) : null,
                vendor_id: vendorId ? Number(vendorId) : null,
                cost: estimatedCost ? Number(estimatedCost) : null,
            });
        }
    };

    if (!asset) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "complete" ? "Complete Maintenance Task" : "Schedule Preventive Maintenance"}
            subtitle={`Asset: ${asset.asset_code} · ${asset.name}`}
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "complete" ? (
                    <>
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                                {schedule?.title || "Scheduled Service"}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                Frequency: {schedule?.frequency || "Quarterly"} · Due:{" "}
                                {schedule?.scheduled_date ? schedule.scheduled_date.slice(0, 10) : "N/A"}
                            </span>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Work Performed *</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Details of service performed, diagnostic results, dust cleaning, OS patch..."
                                value={workPerformed}
                                onChange={(e) => setWorkPerformed(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Parts Replaced</label>
                                <input
                                    className="form-control"
                                    placeholder="e.g. CMOS battery, power supply"
                                    value={partsReplaced}
                                    onChange={(e) => setPartsReplaced(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Maintenance Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={actualCost}
                                    onChange={(e) => setActualCost(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Technician Notes</label>
                            <input
                                className="form-control"
                                placeholder="Next inspection notes or observations"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Task Title *</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Quarterly Battery Calibration"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Maintenance Type *</label>
                                <select
                                    className="form-control"
                                    value={maintenanceType}
                                    onChange={(e) => setMaintenanceType(e.target.value)}
                                >
                                    <option value="preventive">Preventive Maintenance</option>
                                    <option value="corrective">Corrective Repair</option>
                                    <option value="calibration">Clinical Calibration</option>
                                    <option value="inspection">Safety & Audit Inspection</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Recurrence Frequency *</label>
                                <select
                                    className="form-control"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                >
                                    <option value="one_time">One Time</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly (3 Months)</option>
                                    <option value="biannual">Bi-Annual (6 Months)</option>
                                    <option value="yearly">Yearly (Annual)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Scheduled Date *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Estimated Cost (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    placeholder="0.00"
                                    value={estimatedCost}
                                    onChange={(e) => setEstimatedCost(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="form-group">
                                <label className="form-label text-xs font-medium">Assigned Technician</label>
                                <select
                                    className="form-control"
                                    value={assignedTo}
                                    onChange={(e) => setAssignedTo(e.target.value)}
                                >
                                    <option value="">— Internal IT Staff —</option>
                                    {staff.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.first_name} {s.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label text-xs font-medium">External Vendor / AMC</label>
                                <select
                                    className="form-control"
                                    value={vendorId}
                                    onChange={(e) => setVendorId(e.target.value)}
                                >
                                    <option value="">— None (In-House) —</option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Task Checklist & Description</label>
                            <textarea
                                className="form-control"
                                rows={2}
                                placeholder="Service checklist, parts to check..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                        disabled={scheduleMutation.isPending || completeMutation.isPending}
                    >
                        <Save size={14} />
                        <span>
                            {scheduleMutation.isPending || completeMutation.isPending
                                ? "Saving..."
                                : mode === "complete"
                                ? "Complete & Reschedule"
                                : "Schedule Maintenance"}
                        </span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}
