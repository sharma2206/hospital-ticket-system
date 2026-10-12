import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    FolderOpen,
    MessageSquareText,
    RefreshCw,
    Send,
    UserRound,
    UserCheck,
    AlertTriangle,
    PauseCircle,
    PlayCircle,
    RotateCcw,
    Trash2,
    Paperclip,
    Download,
    Upload,
    Building2,
    Laptop,
    Shield,
    Calendar,
    FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TicketTimeline from "./TicketTimeline";
import StatusBadge from "../Common/StatusBadge";
import ConfirmDialog from "../Shared/ConfirmDialog";

function DetailLabel({ label, value, icon: Icon }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {Icon && <Icon size={12} />}
                <span>{label}</span>
            </div>
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {value || "—"}
            </div>
        </div>
    );
}

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isStaff, isManager, user } = useAuth();

    const [comment, setComment] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [newStatusId, setNewStatusId] = useState("");
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [attachmentFile, setAttachmentFile] = useState(null);

    // Confirmation dialog states
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        action: null,
        variant: "danger",
        confirmText: "Confirm",
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["ticket-detail", id],
        queryFn: () => api.get(`/tickets/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

    const { data: statuses = [] } = useQuery({
        queryKey: ["ticket-statuses"],
        queryFn: () => api.get("/ticket-statuses").then((r) => r.data?.data || r.data || []),
    });

    const { data: itStaff = [] } = useQuery({
        queryKey: ["it-staff"],
        queryFn: () => api.get("/it-staff").then((r) => r.data.data || []),
        enabled: isStaff(),
    });

    // ── Mutations ────────────────────────────────────────────────────────

    const postComment = useMutation({
        mutationFn: (payload) => api.post(`/tickets/${id}/comments`, payload),
        onSuccess: () => {
            toast.success("Comment posted");
            setComment("");
            setIsInternal(false);
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to post comment"),
    });

    const changeStatus = useMutation({
        mutationFn: (payload) => api.put(`/tickets/${id}/status`, payload),
        onSuccess: () => {
            toast.success("Status updated successfully");
            setNewStatusId("");
            setResolutionNotes("");
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to update status";
            toast.error(msg);
        },
    });

    const assignTicket = useMutation({
        mutationFn: (userId) => api.post(`/tickets/${id}/assign`, { assigned_to: userId }),
        onSuccess: () => {
            toast.success("Ticket assigned successfully");
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to assign ticket";
            toast.error(msg);
        },
    });

    const escalateTicket = useMutation({
        mutationFn: () => api.post(`/tickets/${id}/escalate`, { reason: "Escalated by staff member" }),
        onSuccess: () => {
            toast.success("Ticket escalated successfully");
            setConfirmModal({ ...confirmModal, isOpen: false });
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to escalate ticket"),
    });

    const reopenTicket = useMutation({
        mutationFn: () => api.post(`/tickets/${id}/reopen`, { reason: "Reopened by user/staff" }),
        onSuccess: () => {
            toast.success("Ticket reopened");
            setConfirmModal({ ...confirmModal, isOpen: false });
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to reopen ticket"),
    });

    const toggleSLA = useMutation({
        mutationFn: (isPaused) =>
            isPaused
                ? api.post(`/tickets/${id}/resume-sla`)
                : api.post(`/tickets/${id}/pause-sla`),
        onSuccess: (res, isPaused) => {
            toast.success(isPaused ? "SLA resumed" : "SLA paused");
            setConfirmModal({ ...confirmModal, isOpen: false });
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to update SLA state"),
    });

    const deleteTicket = useMutation({
        mutationFn: () => api.delete(`/tickets/${id}`),
        onSuccess: () => {
            toast.success("Ticket deleted successfully");
            navigate("/tickets");
        },
        onError: () => toast.error("Failed to delete ticket"),
    });

    const uploadAttachment = useMutation({
        mutationFn: (file) => {
            const fd = new FormData();
            fd.append("file", file);
            return api.post(`/tickets/${id}/attachments`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Attachment uploaded");
            setAttachmentFile(null);
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to upload attachment"),
    });

    const deleteAttachment = useMutation({
        mutationFn: (attachmentId) =>
            api.delete(`/tickets/${id}/attachments/${attachmentId}`),
        onSuccess: () => {
            toast.success("Attachment deleted");
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to delete attachment"),
    });

    // ── Handlers ─────────────────────────────────────────────────────────

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        postComment.mutate({ comment: comment.trim(), is_internal: isInternal });
    };

    const handleStatusChange = (e) => {
        e.preventDefault();
        if (!newStatusId) return;
        changeStatus.mutate({
            status_id: parseInt(newStatusId),
            resolution_notes: resolutionNotes || undefined,
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAttachment.mutate(file);
            e.target.value = "";
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="card p-6">
                    <div className="skeleton h-8 w-48 mb-3 rounded" />
                    <div className="skeleton h-4 w-32 rounded" />
                </div>
                <div className="card p-6">
                    <div className="skeleton h-48 w-full rounded" />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card p-8 text-center space-y-3">
                <AlertTriangle size={36} className="mx-auto text-amber-500" />
                <h3 className="font-bold text-base">Ticket could not be loaded</h3>
                <p className="text-sm text-slate-500">
                    The requested ticket may have been deleted or you lack permission to view it.
                </p>
                <Link to="/tickets" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
                    <ArrowLeft size={14} />
                    <span>Back to tickets</span>
                </Link>
            </div>
        );
    }

    const requesterName =
        [data.requester_name, data.requester_employee_id]
            .filter(Boolean)
            .join(" • ") || "—";

    const isClosedOrResolved = ["RESOLVED", "CLOSED"].includes(data.status?.code);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="page-header">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Link to="/tickets" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                            <ArrowLeft size={14} />
                            <span>Tickets</span>
                        </Link>
                        <span>/</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                            {data.ticket_number || `#${data.id}`}
                        </span>
                    </div>
                    <h1 className="page-title text-xl font-bold flex items-center gap-2">
                        <span>{data.title}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                        value={data.status?.code || data.status?.name}
                        label={data.status?.name}
                        color={data.status?.color}
                    />
                    <StatusBadge
                        value={data.priority?.name}
                        label={data.priority?.name}
                        color={data.priority?.color}
                    />

                    {/* Operational Action Buttons */}
                    {isStaff() && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            {!data.is_escalated && !isClosedOrResolved && (
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-xs flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    onClick={() =>
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Escalate Ticket",
                                            message: `Are you sure you want to escalate ticket ${data.ticket_number}? This will notify senior support supervisors.`,
                                            action: () => escalateTicket.mutate(),
                                            variant: "warning",
                                            confirmText: "Escalate Ticket",
                                        })
                                    }
                                >
                                    <AlertTriangle size={13} />
                                    <span>Escalate</span>
                                </button>
                            )}

                            {isClosedOrResolved && (
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-xs flex items-center gap-1 text-amber-600 hover:bg-amber-50"
                                    onClick={() =>
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Reopen Ticket",
                                            message: `Reopen ticket ${data.ticket_number} and return it to active workflow?`,
                                            action: () => reopenTicket.mutate(),
                                            variant: "primary",
                                            confirmText: "Reopen Ticket",
                                        })
                                    }
                                >
                                    <RotateCcw size={13} />
                                    <span>Reopen</span>
                                </button>
                            )}

                            {!isClosedOrResolved && (
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-xs flex items-center gap-1"
                                    onClick={() =>
                                        setConfirmModal({
                                            isOpen: true,
                                            title: data.is_sla_paused ? "Resume SLA" : "Pause SLA",
                                            message: data.is_sla_paused
                                                ? "Resume the SLA timer for this ticket?"
                                                : "Pause the SLA timer while waiting for customer response or external vendor?",
                                            action: () => toggleSLA.mutate(data.is_sla_paused),
                                            variant: "primary",
                                            confirmText: data.is_sla_paused ? "Resume SLA" : "Pause SLA",
                                        })
                                    }
                                >
                                    {data.is_sla_paused ? (
                                        <>
                                            <PlayCircle size={13} className="text-emerald-500" />
                                            <span>Resume SLA</span>
                                        </>
                                    ) : (
                                        <>
                                            <PauseCircle size={13} className="text-amber-500" />
                                            <span>Pause SLA</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {isManager() && (
                                <button
                                    type="button"
                                    className="btn btn-danger btn-xs flex items-center gap-1"
                                    onClick={() =>
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Delete Ticket",
                                            message: `Are you sure you want to permanently delete ticket ${data.ticket_number}? This action will be recorded in the audit trail.`,
                                            action: () => deleteTicket.mutate(),
                                            variant: "danger",
                                            confirmText: "Delete Permanently",
                                        })
                                    }
                                >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stat Pill Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase mb-1">
                        <UserRound size={15} />
                        <span>Requester</span>
                    </div>
                    <div className="font-semibold text-sm truncate">{requesterName}</div>
                    <div className="text-xs text-slate-500 truncate">{data.requester_email || data.creator?.email || "No email"}</div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase mb-1">
                        <UserCheck size={15} />
                        <span>Technician</span>
                    </div>
                    <div className="font-semibold text-sm truncate">
                        {data.assignee
                            ? `${data.assignee.first_name} ${data.assignee.last_name}`
                            : "Unassigned"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                        {data.assignee?.email || "Not yet assigned"}
                    </div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase mb-1">
                        <FolderOpen size={15} />
                        <span>Department</span>
                    </div>
                    <div className="font-semibold text-sm truncate">{data.department?.name || "—"}</div>
                    <div className="text-xs text-slate-500 truncate">{data.branch?.name || "Main Branch"}</div>
                </div>

                <div className="card p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase mb-1">
                        <Clock3 size={15} />
                        <span>SLA Status</span>
                    </div>
                    <div className="font-semibold text-sm truncate">
                        {data.sla_status?.label || "Standard SLA"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                        {data.due_date ? `Due: ${new Date(data.due_date).toLocaleDateString()}` : "No SLA limit"}
                    </div>
                </div>
            </div>

            {/* Main Columns: Details + Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Description, Attachments, Comments */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="card p-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                            <FileText size={16} />
                            <span>Description</span>
                        </h2>
                        <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            {data.description || "No description provided."}
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="card p-5">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <Paperclip size={16} />
                                <span>Attachments ({data.attachments?.length || 0})</span>
                            </h2>
                            <label className="btn btn-secondary btn-xs cursor-pointer inline-flex items-center gap-1.5">
                                <Upload size={13} />
                                <span>Upload File</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploadAttachment.isPending}
                                />
                            </label>
                        </div>

                        {data.attachments?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {data.attachments.map((att) => (
                                    <div
                                        key={att.id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Paperclip size={16} className="text-blue-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                    {att.file_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {(att.file_size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <a
                                                href={`/storage/${att.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary btn-xs p-1.5"
                                                title="Download / View"
                                            >
                                                <Download size={13} />
                                            </a>
                                            {isStaff() && (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteAttachment.mutate(att.id)}
                                                    className="btn btn-secondary btn-xs p-1.5 text-rose-500 hover:bg-rose-50"
                                                    title="Delete attachment"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 text-center py-4">
                                No attachments uploaded for this ticket.
                            </p>
                        )}
                    </div>

                    {/* Comments & Conversation */}
                    <div className="card p-5 space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <MessageSquareText size={18} className="text-blue-500" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Comments & Activity ({data.comments?.length || 0})
                            </h2>
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={handleCommentSubmit} className="space-y-3">
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Add an update, solution steps, or request clarification..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                {isStaff() ? (
                                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isInternal}
                                            onChange={(e) => setIsInternal(e.target.checked)}
                                            className="rounded border-slate-300"
                                        />
                                        <span>Internal note (staff only, hidden from requester)</span>
                                    </label>
                                ) : <div />}
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm flex items-center gap-1.5 ml-auto"
                                    disabled={!comment.trim() || postComment.isPending}
                                >
                                    <Send size={14} />
                                    <span>{postComment.isPending ? "Posting..." : "Post Comment"}</span>
                                </button>
                            </div>
                        </form>

                        {/* Comment List */}
                        <div className="space-y-3 pt-2">
                            {data.comments?.map((c) => (
                                <div
                                    key={c.id}
                                    className={`p-4 rounded-xl border text-sm space-y-1.5 ${
                                        c.is_internal
                                            ? "bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40"
                                            : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                                                {c.user?.first_name?.[0] || "U"}
                                            </div>
                                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                                                {c.user ? `${c.user.first_name} ${c.user.last_name}` : "User"}
                                            </span>
                                            {c.is_internal && (
                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                                                    Internal
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] text-slate-400">
                                            {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                                        </span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed pl-8">
                                        {c.comment || c.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    {data.history?.length > 0 && (
                        <div className="card p-5">
                            <TicketTimeline items={data.history} />
                        </div>
                    )}
                </div>

                {/* Right Column: Actions & Meta Summary */}
                <div className="space-y-6">
                    {/* IT Staff Management Panel */}
                    {isStaff() && (
                        <div className="card p-5 space-y-5 border-l-4 border-l-blue-600">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <RefreshCw size={16} className="text-blue-600" />
                                <span>Support Controls</span>
                            </h3>

                            {/* Status Update */}
                            <form onSubmit={handleStatusChange} className="space-y-3">
                                <div className="form-group">
                                    <label className="form-label">Change Status</label>
                                    <select
                                        className="form-control"
                                        value={newStatusId}
                                        onChange={(e) => setNewStatusId(e.target.value)}
                                    >
                                        <option value="">Select new status...</option>
                                        {statuses.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Resolution / Closure Note</label>
                                    <textarea
                                        className="form-control"
                                        rows={2}
                                        placeholder="Optional notes for this update..."
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                                    disabled={!newStatusId || changeStatus.isPending}
                                >
                                    <CheckCircle2 size={14} />
                                    <span>{changeStatus.isPending ? "Updating..." : "Update Status"}</span>
                                </button>
                            </form>

                            {/* Assign Technician */}
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                <label className="form-label">Assign / Reassign Staff</label>
                                <select
                                    className="form-control"
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            assignTicket.mutate(parseInt(e.target.value));
                                            e.target.value = "";
                                        }
                                    }}
                                    disabled={assignTicket.isPending}
                                >
                                    <option value="">Select IT staff member...</option>
                                    {itStaff.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name} {u.designation ? `(${u.designation})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Metadata Summary Card */}
                    <div className="card p-5 space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Ticket Information
                        </h3>
                        <div className="grid grid-cols-1 gap-3.5 text-sm">
                            <DetailLabel label="Category" value={data.category?.name} icon={FolderOpen} />
                            <DetailLabel label="Sub-Category" value={data.sub_category?.name || data.subCategory?.name} />
                            <DetailLabel label="Branch / Campus" value={data.branch?.name} icon={Building2} />
                            <DetailLabel label="Request Source" value={data.source} />
                            {data.asset && (
                                <DetailLabel
                                    label="Related Asset"
                                    value={`${data.asset.asset_code} · ${data.asset.name}`}
                                    icon={Laptop}
                                />
                            )}
                            {data.vendor && (
                                <DetailLabel label="Associated Vendor" value={data.vendor.name} icon={Shield} />
                            )}
                            <DetailLabel
                                label="Created Date"
                                value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
                                icon={Calendar}
                            />
                            <DetailLabel
                                label="Last Updated"
                                value={data.updated_at ? new Date(data.updated_at).toLocaleString() : "—"}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div>
    );
}
