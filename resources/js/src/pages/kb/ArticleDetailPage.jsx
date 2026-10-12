import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    BookOpenText,
    CalendarDays,
    Eye,
    Tags,
    UserRound,
} from "lucide-react";
import api from "../../services/api";

export default function ArticleDetailPage() {
    const { id } = useParams();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["article-detail", id],
        queryFn: () => api.get(`/knowledge/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="card" style={{ padding: "1.25rem" }}>
                <div
                    className="skeleton skeleton-text"
                    style={{
                        width: "220px",
                        height: "28px",
                        marginBottom: "0.75rem",
                    }}
                />
                <div
                    className="skeleton skeleton-card"
                    style={{ height: "250px" }}
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
                    Article could not be loaded.
                </p>
                <Link to="/knowledge" className="btn btn-secondary">
                    Back to knowledge base
                </Link>
            </div>
        );
    }

    const tags = Array.isArray(data.tags) ? data.tags : [];
    const linkedTickets = data.tickets || [];

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
                        <Link to="/knowledge" className="table-link">
                            Knowledge base
                        </Link>
                    </div>
                    <div className="page-title">{data.title}</div>
                </div>
                <span
                    className="badge"
                    style={{
                        background:
                            data.status === "published" ? "#dcfce7" : "#fef3c7",
                        color:
                            data.status === "published" ? "#166534" : "#92400e",
                    }}
                >
                    {data.status || "draft"}
                </span>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
                        <UserRound size={16} /> Author
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.author
                            ? `${data.author.first_name} ${data.author.last_name}`
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
                        <CalendarDays size={16} /> Published
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.published_at
                            ? new Date(data.published_at).toLocaleDateString()
                            : "Not published"}
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
                        <Eye size={16} /> Views
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.views ?? 0}
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
                        <Tags size={16} /> Category
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.category?.name || "General"}
                    </div>
                </div>
            </div>

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
                        <BookOpenText size={16} /> Article
                    </div>
                </div>
                <div
                    style={{ color: "var(--text-muted)", lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{
                        __html:
                            data.content ||
                            "<p>No article content available.</p>",
                    }}
                />
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
                        <div className="card-title">Symptoms</div>
                    </div>
                    <div
                        style={{
                            color: "var(--text-muted)",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                        }}
                    >
                        {data.symptoms || "No symptoms recorded."}
                    </div>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Summary</div>
                    </div>
                    <div
                        style={{
                            color: "var(--text-muted)",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                        }}
                    >
                        {data.solution_summary || "No summary available."}
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
                        <div className="card-title">Tags</div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                        }}
                    >
                        {tags.length ? (
                            tags.map((tag, index) => (
                                <span
                                    key={`${tag}-${index}`}
                                    className="badge"
                                    style={{
                                        background: "#e0f2fe",
                                        color: "#075985",
                                    }}
                                >
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span style={{ color: "var(--text-muted)" }}>
                                No tags
                            </span>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Linked Tickets</div>
                    </div>
                    {linkedTickets.length ? (
                        <div style={{ display: "grid", gap: "0.6rem" }}>
                            {linkedTickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    to={`/tickets/${ticket.id}`}
                                    className="table-link"
                                >
                                    {ticket.ticket_number} · {ticket.title}
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: "var(--text-muted)" }}>
                            No linked tickets.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
