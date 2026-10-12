import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Clock3,
    FolderOpen,
    Info,
    MessageSquareText,
    UserRound,
} from "lucide-react";
import api from "../../services/api";
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

    const { data, isLoading, isError } = useQuery({
        queryKey: ["ticket-detail", id],
        queryFn: () => api.get(`/tickets/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

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
                                    <MessageSquareText size={16} /> Comments
                                </div>
                            </div>
                            <div style={{ display: "grid", gap: "0.8rem" }}>
                                {data.comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        style={{
                                            border: "1px solid var(--border)",
                                            borderRadius: "10px",
                                            padding: "0.8rem",
                                            background: "#f8fafc",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: ".8rem",
                                                fontWeight: 600,
                                                marginBottom: "0.4rem",
                                            }}
                                        >
                                            {comment.user
                                                ? `${comment.user.first_name} ${comment.user.last_name}`
                                                : "User"}
                                        </div>
                                        <div
                                            style={{
                                                color: "var(--text-muted)",
                                                whiteSpace: "pre-wrap",
                                            }}
                                        >
                                            {comment.comment || comment.message}
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
