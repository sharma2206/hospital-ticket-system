import React from "react";
import { Activity, Clock3, UserRound } from "lucide-react";

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
}

function getActivityText(item) {
    if (item.description) return item.description;
    if (item.notes) return item.notes;

    switch (item.change_type) {
        case "assignment": {
            const oldValue = item.old_value ? `from #${item.old_value}` : "";
            const newValue = item.new_value ? `to #${item.new_value}` : "";
            return ["Ticket assigned", oldValue, newValue]
                .filter(Boolean)
                .join(" ");
        }
        case "status_change":
            return "Ticket status updated.";
        case "reopened":
            return "Ticket reopened.";
        case "escalation":
            return "Ticket escalated.";
        default:
            return "Ticket was updated.";
    }
}

function getTypeLabel(type) {
    const labels = {
        status_change: "Status changed",
        assignment: "Assigned",
        reopened: "Ticket reopened",
        escalation: "Escalated",
        comment: "Comment added",
    };

    return labels[type] || type?.replace(/_/g, " ") || "Ticket updated";
}

export default function TicketTimeline({ items = [] }) {
    if (!items?.length) {
        return null;
    }

    return (
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
                    <Activity size={16} /> Ticket History
                </div>
            </div>

            <div style={{ display: "grid", gap: "0.9rem" }}>
                {items.slice(0, 8).map((item) => (
                    <div
                        key={
                            item.id || `${item.change_type}-${item.created_at}`
                        }
                        style={{
                            display: "grid",
                            gridTemplateColumns: "0.18rem 1fr",
                            gap: "0.85rem",
                            alignItems: "start",
                            paddingLeft: "0.15rem",
                        }}
                    >
                        <div
                            style={{
                                width: "0.2rem",
                                minHeight: "100%",
                                borderRadius: "999px",
                                background:
                                    item.change_type === "status_change"
                                        ? "var(--status-open)"
                                        : item.change_type === "assignment"
                                          ? "var(--primary)"
                                          : item.change_type === "reopened"
                                            ? "var(--warning)"
                                            : item.change_type === "escalation"
                                              ? "var(--danger)"
                                              : "var(--success)",
                            }}
                        />

                        <div
                            style={{
                                border: "1px solid var(--border)",
                                borderRadius: "0.9rem",
                                background: "#f8fafc",
                                padding: "0.8rem 0.9rem",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "0.75rem",
                                    flexWrap: "wrap",
                                    marginBottom: "0.35rem",
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>
                                    {getTypeLabel(item.change_type)}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        color: "var(--text-muted)",
                                        fontSize: ".72rem",
                                    }}
                                >
                                    <Clock3 size={12} />
                                    {formatDate(item.created_at)}
                                </div>
                            </div>

                            <div
                                style={{
                                    color: "var(--text-muted)",
                                    fontSize: ".82rem",
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {getActivityText(item)}
                            </div>

                            {(item.changed_by || item.changer) && (
                                <div
                                    style={{
                                        marginTop: "0.55rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        color: "var(--text-muted)",
                                        fontSize: ".75rem",
                                    }}
                                >
                                    <UserRound size={12} />
                                    {item.changed_by
                                        ? `${item.changed_by.first_name || ""} ${item.changed_by.last_name || ""}`.trim() ||
                                          "System"
                                        : item.changer
                                          ? `${item.changer.first_name || ""} ${item.changer.last_name || ""}`.trim() ||
                                            "System"
                                          : "System"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
