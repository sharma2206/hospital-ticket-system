import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import TicketTimeline from "./TicketTimeline";

function DetailLabel({ label, value }) {
    return (
        <div style={{ display: "grid", gap: "0.25rem" }}>
            <div
                style={{
                    fontSize: ".72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                }}
            >
                {label}
            </div>
            <div style={{ fontWeight: 600 }}>{value || "—"}</div>
        </div>
    );
}

export default function TicketDetail() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const { isStaff } = useAuth();
    const [comment, setComment] = useState("");
    const [isInternal, setIsInternal] = useState(false);
    const [newStatusId, setNewStatusId] = useState("");
    const [resolutionNotes, setResolutionNotes] = useState("");

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
        mutationFn: (payload) =>
            api.put(`/tickets/${id}/status`, payload),
        onSuccess: () => {
            toast.success("Status updated");
            setNewStatusId("");
            setResolutionNotes("");
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: (err) => {
            const msg =
                err.response?.data?.message || "Failed to update status";
            toast.error(msg);
        },
    });

    const assignTicket = useMutation({
        mutationFn: (userId) =>
            api.put(`/tickets/${id}/assign`, { assigned_to: userId }),
        onSuccess: () => {
            toast.success("Ticket assigned");
            queryClient.invalidateQueries({ queryKey: ["ticket-detail", id] });
        },
        onError: () => toast.error("Failed to assign ticket"),
    });

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

    if (isLoading) {
        return (
            <div style={{ display: "grid", gap: "1rem" }}>
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="skeleton skeleton-text"
                        style={{
                            width: "180px",
                            height: "24px",
                            marginBottom: "0.75rem",
                        }}
                    />
                    <div
                        className="skeleton skeleton-text"
                        style={{ width: "120px", height: "14px" }}
                    />
                </div>
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="skeleton skeleton-card"
                        style={{ height: "200px" }}
                    />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div
                className="card"
                style={{ padding: "2rem", textAlign: "center" }}
            >
                <p style={{ margin: "0 0 1rem" }}>
                    Ticket could not be loaded.
                </p>
                <Link to="/tickets" className="btn btn-secondary">
                    Back to tickets
                </Link>
            </div>
        );
    }

    const priorityColor = data.priority?.color || "#475569";
    const statusColor = data.status?.color || "#475569";
    const requesterName =
        [data.requester_name, data.requester_employee_id]
            .filter(Boolean)
            .join(" • ") || "—";

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div style={{ display: "grid", gap: "0.35rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                        }}
                    >
                        <ArrowLeft size={14} />
                        <Link to="/tickets" className="table-link">
                            Tickets
                        </Link>
                    </div>
                    <div className="page-title">
                        {data.ticket_number || `Ticket #${data.id}`}
                    </div>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        flexWrap: "wrap",
                    }}
                >
                    <span
                        className="badge"
                        style={{
                            background: `${statusColor}22`,
                            color: statusColor,
                        }}
                    >
                        {data.status?.name || "Unknown"}
                    </span>
                    <span
                        className="badge"
                        style={{
                            background: `${priorityColor}22`,
                            color: priorityColor,
                        }}
                    >
                        {data.priority?.name || "Unassigned"}
                    </span>
                    <span
                        className="badge"
                        style={{
                            background:
                                data.sla_status?.color === "red"
                                    ? "#fee2e288"
                                    : data.sla_status?.color === "green"
                                    ? "#dcfce788"
                                    : "#fef3c788",
                            color:
                                data.sla_status?.color === "red"
                                    ? "#991b1b"
                                    : data.sla_status?.color === "green"
                                    ? "#166534"
                                    : "#92400e",
                        }}
                    >
                        {data.sla_status?.label || "No SLA"}
                    </span>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                }}
            >
                <div className="card" style={{ padding: "1rem 1.1rem" }}>
                    <div
                        style={{
                            fontSize: ".75rem",
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }}
                    >
                        Subject
                    </div>
                    <div
                        style={{
                            fontSize: "1.15rem",
                            fontWeight: 700,
                            marginTop: "0.35rem",
                        }}
                    >
                        {data.title}
                    </div>
                </div>
                <div className="card" style={{ padding: "1rem 1.1rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "var(--text-muted)",
                        }}
                    >
                        <UserRound size={16} /> Requester
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                        {requesterName}
                    </div>
                </div>
                <div className="card" style={{ padding: "1rem 1.1rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "var(--text-muted)",
                        }}
                    >
                        <FolderOpen size={16} /> Department
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                        {data.department?.name || "—"}
                    </div>
                </div>
                <div className="card" style={{ padding: "1rem 1.1rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "var(--text-muted)",
                        }}
                    >
                        <Clock3 size={16} /> SLA
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                        {data.sla_status?.label || "No SLA status"}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr",
                    gap: "1rem",
                }}
            >
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Description</div>
                    </div>
                    <div
                        style={{
                            color: "var(--text-muted)",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                        }}
                    >
                        {data.description || "No description provided."}
                    </div>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Summary</div>
                    </div>
                    <div style={{ display: "grid", gap: "0.9rem" }}>
                        <DetailLabel
                            label="Assigned to"
                            value={
                                data.assignee
                                    ? `${data.assignee.first_name} ${data.assignee.last_name}`
                                    : "Unassigned"
                            }
                        />
                        <DetailLabel
                            label="Category"
                            value={data.category?.name || "—"}
                        />
                        <DetailLabel
                            label="Branch"
                            value={data.branch?.name || "—"}
                        />
                        <DetailLabel
                            label="Source"
                            value={data.source || "—"}
                        />
                        <DetailLabel
                            label="Created"
                            value={
                                data.created_at
                                    ? new Date(data.created_at).toLocaleString()
                                    : "—"
                            }
                        />
                        <DetailLabel
                            label="Updated"
                            value={
                                data.updated_at
                                    ? new Date(data.updated_at).toLocaleString()
                                    : "—"
                            }
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: "1.25rem" }}>
                <div
                    className="card-header"
                    style={{ padding: 0, marginBottom: "1rem" }}
                >
                    <div className="card-title">Ticket Details</div>
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    <DetailLabel
                        label="Priority"
                        value={data.priority?.name || "—"}
                    />
                    <DetailLabel
                        label="Status"
                        value={data.status?.name || "—"}
                    />
                    <DetailLabel
                        label="Department"
                        value={data.department?.name || "—"}
                    />
                    <DetailLabel
                        label="Asset"
                        value={data.asset ? data.asset.name : "—"}
                    />
                    <DetailLabel
                        label="Vendor"
                        value={data.vendor?.name || "—"}
                    />
                    <DetailLabel
                        label="Resolution deadline"
                        value={
                            data.due_date
                                ? new Date(data.due_date).toLocaleString()
                                : "—"
                        }
                    />
                </div>
            </div>

            {/* ── IT Staff Action Panel ─────────────────────────────── */}
            {isStaff() && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    {/* Status Change */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div
                            className="card-header"
                            style={{ padding: 0, marginBottom: "1rem" }}
                        >
                            <div
                                className="card-title"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <RefreshCw size={16} /> Update Status
                            </div>
                        </div>
                        <form
                            onSubmit={handleStatusChange}
                            style={{ display: "grid", gap: "0.85rem" }}
                        >
                            <div className="form-group">
                                <label className="form-label">New Status</label>
                                <select
                                    className="form-control"
                                    value={newStatusId}
                                    onChange={(e) =>
                                        setNewStatusId(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Select status…
                                    </option>
                                    {statuses.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Resolution / Notes
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Optional notes about this status change…"
                                    value={resolutionNotes}
                                    onChange={(e) =>
                                        setResolutionNotes(e.target.value)
                                    }
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={
                                    !newStatusId || changeStatus.isPending
                                }
                            >
                                <CheckCircle2 size={14} />
                                {changeStatus.isPending
                                    ? "Updating…"
                                    : "Update Status"}
                            </button>
                        </form>
                    </div>

                    {/* Assign Ticket */}
                    <div className="card" style={{ padding: "1.25rem" }}>
                        <div
                            className="card-header"
                            style={{ padding: 0, marginBottom: "1rem" }}
                        >
                            <div
                                className="card-title"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                }}
                            >
                                <UserRound size={16} /> Assign / Reassign
                            </div>
                        </div>
                        <div style={{ display: "grid", gap: "0.85rem" }}>
                            <div className="form-group">
                                <label className="form-label">
                                    Current assignee
                                </label>
                                <div style={{ fontWeight: 600 }}>
                                    {data.assignee
                                        ? `${data.assignee.first_name} ${data.assignee.last_name}`
                                        : "Unassigned"}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    Assign to
                                </label>
                                <select
                                    className="form-control"
                                    defaultValue=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            assignTicket.mutate(
                                                parseInt(e.target.value),
                                            );
                                            e.target.value = "";
                                        }
                                    }}
                                >
                                    <option value="">
                                        Select IT staff…
                                    </option>
                                    {itStaff.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name}
                                            {u.designation
                                                ? ` (${u.designation})`
                                                : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Comment Input ─────────────────────────────────────── */}
            <div className="card" style={{ padding: "1.25rem" }}>
                <div
                    className="card-header"
                    style={{ padding: 0, marginBottom: "1rem" }}
                >
                    <div
                        className="card-title"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <MessageSquareText size={16} /> Add Comment
                    </div>
                </div>
                <form
                    onSubmit={handleCommentSubmit}
                    style={{ display: "grid", gap: "0.85rem" }}
                >
                    <div className="form-group">
                        <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Write a comment or update for this ticket…"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                        }}
                    >
                        {isStaff() && (
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    fontSize: "0.82rem",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isInternal}
                                    onChange={(e) =>
                                        setIsInternal(e.target.checked)
                                    }
                                />
                                Internal note (hidden from requester)
                            </label>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                !comment.trim() || postComment.isPending
                            }
                            style={{ marginLeft: "auto" }}
                        >
                            <Send size={14} />
                            {postComment.isPending ? "Posting…" : "Post Comment"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Existing Comments + History ───────────────────────── */}
            {(data.comments?.length || data.history?.length) && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                    }}
                >
                    {data.comments?.length > 0 && (
                        <div className="card" style={{ padding: "1.25rem" }}>
                            <div
                                className="card-header"
                                style={{ padding: 0, marginBottom: "1rem" }}
                            >
                                <div
                                    className="card-title"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                    }}
                                >
                                    <MessageSquareText size={16} /> Comments (
                                    {data.comments.length})
                                </div>
                            </div>
                            <div style={{ display: "grid", gap: "0.8rem" }}>
                                {data.comments.map((c) => (
                                    <div
                                        key={c.id}
                                        style={{
                                            border: "1px solid var(--border)",
                                            borderRadius: "10px",
                                            padding: "0.8rem",
                                            background: c.is_internal
                                                ? "rgba(124, 58, 237, 0.05)"
                                                : "var(--bg)",
                                            borderColor: c.is_internal
                                                ? "rgba(124,58,237,0.2)"
                                                : "var(--border)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "0.4rem",
                                                gap: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: ".8rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {c.user
                                                    ? `${c.user.first_name} ${c.user.last_name}`
                                                    : "User"}
                                            </div>
                                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                                {c.is_internal && (
                                                    <span
                                                        style={{
                                                            fontSize: "0.66rem",
                                                            background: "rgba(124,58,237,0.12)",
                                                            color: "#7c3aed",
                                                            padding: "0.15rem 0.4rem",
                                                            borderRadius: "999px",
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        Internal
                                                    </span>
                                                )}
                                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                    {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                color: "var(--text-muted)",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {c.comment || c.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.history?.length > 0 && (
                        <TicketTimeline items={data.history} />
                    )}
                </div>
            )}
        </div>
    );
}
