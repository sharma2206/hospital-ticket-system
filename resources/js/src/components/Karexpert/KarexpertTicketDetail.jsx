import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Building2,
    CircleDashed,
    ClipboardList,
    MessageSquareText,
    UserRound,
} from "lucide-react";
import api from "../../services/api";

export default function KxTicketDetail() {
    const { id } = useParams();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["karexpert-ticket-detail", id],
        queryFn: () => api.get(`/karexpert/tickets/${id}`).then((r) => r.data),
        enabled: !!id,
    });

    if (isLoading) {
        return (
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
                    className="skeleton skeleton-card"
                    style={{ height: "220px" }}
                />
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
                    KareXpert ticket could not be loaded.
                </p>
                <Link to="/karexpert/tickets" className="btn btn-secondary">
                    Back to KareXpert tickets
                </Link>
            </div>
        );
    }

    const ticket = data;
    const statusColor = ticket.status?.color || "#475569";
    const priorityColor = ticket.priority?.color || "#475569";

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
                        <Link to="/karexpert/tickets" className="table-link">
                            KareXpert
                        </Link>
                    </div>
                    <div className="page-title">
                        {ticket.ticket_number || `Ticket #${ticket.id}`}
                    </div>
                </div>
                <div
                    style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}
                >
                    <span
                        className="badge"
                        style={{
                            background: `${statusColor}22`,
                            color: statusColor,
                        }}
                    >
                        {ticket.status?.name || "Unknown"}
                    </span>
                    <span
                        className="badge"
                        style={{
                            background: `${priorityColor}22`,
                            color: priorityColor,
                        }}
                    >
                        {ticket.priority?.name || "Normal"}
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
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "var(--text-muted)",
                        }}
                    >
                        <ClipboardList size={16} /> Module
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {ticket.karexpert_module || "—"}
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
                        <Building2 size={16} /> Ref ID
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {ticket.karexpert_ref_id || "—"}
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
                        <UserRound size={16} /> Created by
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {ticket.creator
                            ? `${ticket.creator.first_name} ${ticket.creator.last_name}`
                            : "Unknown"}
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
                        <CircleDashed size={16} /> Contact
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {ticket.karexpert_contact || "—"}
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: "1.25rem" }}>
                <div
                    className="card-header"
                    style={{ padding: 0, marginBottom: "1rem" }}
                >
                    <div className="card-title">Issue Details</div>
                </div>
                <div style={{ display: "grid", gap: "1rem" }}>
                    <div>
                        <div
                            style={{
                                fontSize: ".72rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: "var(--text-muted)",
                                marginBottom: "0.35rem",
                            }}
                        >
                            Title
                        </div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                            {ticket.title}
                        </div>
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: ".72rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: "var(--text-muted)",
                                marginBottom: "0.35rem",
                            }}
                        >
                            Description
                        </div>
                        <div
                            style={{
                                color: "var(--text-muted)",
                                whiteSpace: "pre-wrap",
                                lineHeight: 1.7,
                            }}
                        >
                            {ticket.description || "No description provided."}
                        </div>
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                }}
            >
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Context</div>
                    </div>
                    <div style={{ display: "grid", gap: "0.8rem" }}>
                        <div>
                            <strong>Category:</strong>{" "}
                            {ticket.category?.name || "—"}
                        </div>
                        <div>
                            <strong>Parent ticket:</strong>{" "}
                            {ticket.parentTicket
                                ? `${ticket.parentTicket.ticket_number} · ${ticket.parentTicket.title}`
                                : "—"}
                        </div>
                        <div>
                            <strong>Created at:</strong>{" "}
                            {ticket.created_at
                                ? new Date(ticket.created_at).toLocaleString()
                                : "—"}
                        </div>
                        <div>
                            <strong>Updated at:</strong>{" "}
                            {ticket.updated_at
                                ? new Date(ticket.updated_at).toLocaleString()
                                : "—"}
                        </div>
                    </div>
                </div>

                {ticket.comments?.length > 0 && (
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
                            {ticket.comments.map((comment) => (
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
                                            fontWeight: 600,
                                            marginBottom: "0.3rem",
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
            </div>
        </div>
    );
}
