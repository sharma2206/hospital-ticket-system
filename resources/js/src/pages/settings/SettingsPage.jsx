import { useQuery } from "@tanstack/react-query";
import { Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import api from "../../services/api";

export default function SettingsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const { data } = await api.get("/settings");
            return data?.data ?? [];
        },
    });

    const settings = Array.isArray(data) ? data : [];

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <div className="page-header">
                <div>
                    <div
                        className="page-title"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <Settings size={20} /> Settings
                    </div>
                    <div className="page-subtitle">
                        System settings and operational preferences.
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
                <div style={{ display: "grid", gap: "1rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#0f172a",
                            fontWeight: 700,
                        }}
                    >
                        <ShieldCheck size={18} /> Platform security
                    </div>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Key</th>
                                    <th>Value</th>
                                    <th>Group</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            style={{
                                                textAlign: "center",
                                                padding: "2rem",
                                                color: "#64748b",
                                            }}
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : settings.length ? (
                                    settings.map((setting) => (
                                        <tr key={setting.key}>
                                            <td>{setting.key}</td>
                                            <td>{setting.value ?? "—"}</td>
                                            <td>
                                                {setting.group || "general"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            style={{
                                                textAlign: "center",
                                                padding: "2rem",
                                                color: "#64748b",
                                            }}
                                        >
                                            No settings configured yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        color: "#0f172a",
                        fontWeight: 700,
                    }}
                >
                    <SlidersHorizontal size={18} /> Operational summary
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "1rem",
                        marginTop: "1rem",
                    }}
                >
                    <div
                        className="card"
                        style={{ padding: "1rem", background: "#f8fafc" }}
                    >
                        <div className="page-subtitle">Authentication</div>
                        <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>
                            JWT + API guards
                        </div>
                    </div>
                    <div
                        className="card"
                        style={{ padding: "1rem", background: "#f8fafc" }}
                    >
                        <div className="page-subtitle">Workflow</div>
                        <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>
                            Ticket lifecycle enabled
                        </div>
                    </div>
                    <div
                        className="card"
                        style={{ padding: "1rem", background: "#f8fafc" }}
                    >
                        <div className="page-subtitle">Notifications</div>
                        <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>
                            Active
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
