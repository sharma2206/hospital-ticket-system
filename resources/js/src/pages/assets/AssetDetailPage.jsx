import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    CalendarClock,
    Cpu,
    HardDrive,
    MapPin,
    ShieldCheck,
} from "lucide-react";
import api from "../../services/api";

export default function AssetDetailPage() {
    const { id } = useParams();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["asset-detail", id],
        queryFn: () => api.get(`/assets/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="card" style={{ padding: "1.25rem" }}>
                <div
                    className="skeleton skeleton-text"
                    style={{
                        width: "200px",
                        height: "28px",
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
                <p style={{ margin: "0 0 1rem" }}>Asset could not be loaded.</p>
                <Link to="/assets" className="btn btn-secondary">
                    Back to assets
                </Link>
            </div>
        );
    }

    const history = data.histories || [];
    const maintenance = data.maintenanceSchedules || [];

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
                        <Link to="/assets" className="table-link">
                            Assets
                        </Link>
                    </div>
                    <div className="page-title">
                        {data.asset_code || "Asset"} · {data.name}
                    </div>
                </div>
                <span
                    className="badge"
                    style={{
                        background: `${data.status === "active" ? "#dcfce7" : "#f1f5f9"}`,
                        color: data.status === "active" ? "#166534" : "#334155",
                    }}
                >
                    {data.status || "Unknown"}
                </span>
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
                        <Cpu size={16} /> Category
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.category || "—"}
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
                        <HardDrive size={16} /> Serial
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.serial_number || "—"}
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
                        <MapPin size={16} /> Location
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.location || "—"}
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
                        <ShieldCheck size={16} /> Condition
                    </div>
                    <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>
                        {data.condition || "—"}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.3fr 0.9fr",
                    gap: "1rem",
                }}
            >
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Asset Overview</div>
                    </div>
                    <div style={{ display: "grid", gap: "0.9rem" }}>
                        <div>
                            <strong>Brand/Model:</strong> {data.brand || "—"}{" "}
                            {data.model ? `· ${data.model}` : ""}
                        </div>
                        <div>
                            <strong>Assigned user:</strong>{" "}
                            {data.assignedUser
                                ? `${data.assignedUser.first_name} ${data.assignedUser.last_name}`
                                : "Unassigned"}
                        </div>
                        <div>
                            <strong>Department:</strong>{" "}
                            {data.department?.name || "—"}
                        </div>
                        <div>
                            <strong>Branch:</strong> {data.branch?.name || "—"}
                        </div>
                        <div>
                            <strong>Vendor:</strong> {data.vendor?.name || "—"}
                        </div>
                        <div>
                            <strong>Hostname:</strong> {data.hostname || "—"}
                        </div>
                        <div>
                            <strong>IP address:</strong>{" "}
                            {data.ip_address || "—"}
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Maintenance</div>
                    </div>
                    <div style={{ display: "grid", gap: "0.8rem" }}>
                        <div>
                            <strong>Purchase date:</strong>{" "}
                            {data.purchase_date
                                ? new Date(
                                      data.purchase_date,
                                  ).toLocaleDateString()
                                : "—"}
                        </div>
                        <div>
                            <strong>Warranty expiry:</strong>{" "}
                            {data.warranty_expiry
                                ? new Date(
                                      data.warranty_expiry,
                                  ).toLocaleDateString()
                                : "—"}
                        </div>
                        <div>
                            <strong>AMC expiry:</strong>{" "}
                            {data.amc_expiry
                                ? new Date(data.amc_expiry).toLocaleDateString()
                                : "—"}
                        </div>
                        <div>
                            <strong>Next maintenance:</strong>{" "}
                            {data.next_maintenance_date
                                ? new Date(
                                      data.next_maintenance_date,
                                  ).toLocaleDateString()
                                : "—"}
                        </div>
                        <div>
                            <strong>Cost:</strong>{" "}
                            {data.cost
                                ? `₹${Number(data.cost).toLocaleString()}`
                                : "—"}
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
                        <div className="card-title">Specifications</div>
                    </div>
                    <div
                        style={{
                            color: "var(--text-muted)",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.7,
                        }}
                    >
                        {data.specifications ||
                            data.notes ||
                            "No specifications recorded."}
                    </div>
                </div>

                <div className="card" style={{ padding: "1.25rem" }}>
                    <div
                        className="card-header"
                        style={{ padding: 0, marginBottom: "1rem" }}
                    >
                        <div className="card-title">Maintenance Schedule</div>
                    </div>
                    {maintenance.length ? (
                        <div style={{ display: "grid", gap: "0.8rem" }}>
                            {maintenance.map((entry) => (
                                <div
                                    key={entry.id}
                                    style={{
                                        border: "1px solid var(--border)",
                                        borderRadius: "10px",
                                        padding: "0.8rem",
                                        background: "#f8fafc",
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>
                                        {entry.title || "Maintenance task"}
                                    </div>
                                    <div
                                        style={{
                                            color: "var(--text-muted)",
                                            fontSize: ".8rem",
                                            marginTop: "0.2rem",
                                        }}
                                    >
                                        {entry.description || "No description"}
                                    </div>
                                    <div
                                        style={{
                                            color: "var(--text-muted)",
                                            fontSize: ".75rem",
                                            marginTop: "0.25rem",
                                        }}
                                    >
                                        {entry.scheduled_date
                                            ? new Date(
                                                  entry.scheduled_date,
                                              ).toLocaleDateString()
                                            : "—"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: "var(--text-muted)" }}>
                            No scheduled maintenance.
                        </div>
                    )}
                </div>
            </div>

            {history.length > 0 && (
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
                            <CalendarClock size={16} /> Audit History
                        </div>
                    </div>
                    <div style={{ display: "grid", gap: "0.8rem" }}>
                        {history.map((entry) => (
                            <div
                                key={entry.id}
                                style={{
                                    borderLeft: "3px solid var(--primary)",
                                    paddingLeft: "0.8rem",
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    {entry.action || "Update"}
                                </div>
                                <div
                                    style={{
                                        color: "var(--text-muted)",
                                        fontSize: ".8rem",
                                        marginTop: "0.2rem",
                                    }}
                                >
                                    {entry.description ||
                                        "Asset activity recorded."}
                                </div>
                                <div
                                    style={{
                                        color: "var(--text-muted)",
                                        fontSize: ".75rem",
                                        marginTop: "0.25rem",
                                    }}
                                >
                                    {entry.created_at
                                        ? new Date(
                                              entry.created_at,
                                          ).toLocaleString()
                                        : "—"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
