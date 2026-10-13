import React from "react";
import { Inbox } from "lucide-react";

export default function EmptyState({
    icon: Icon = Inbox,
    title = "No data found",
    description = "There are no records matching your query or filter criteria.",
    action,
}) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <Icon size={28} strokeWidth={1.8} />
            </div>
            <h3 className="empty-state-title">{title}</h3>
            {description && <p className="empty-state-desc">{description}</p>}
            {action && <div>{action}</div>}
        </div>
    );
}
