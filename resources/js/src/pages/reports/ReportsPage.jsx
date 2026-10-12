import { useQuery } from "@tanstack/react-query";
import { BarChart3, FileBarChart2, RefreshCw } from "lucide-react";
import api from "../../services/api";

const reportCards = [
    { key: "tickets", label: "Tickets report", endpoint: "/reports/tickets" },
    { key: "sla", label: "SLA compliance", endpoint: "/reports/sla" },
    {
        key: "technician",
        label: "Technician performance",
        endpoint: "/reports/technician",
    },
    { key: "assets", label: "Asset report", endpoint: "/reports/assets" },
];

export default function ReportsPage() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["reports-summary"],
        queryFn: async () => {
            const responses = await Promise.all(
                reportCards.map((item) => api.get(item.endpoint)),
            );
            return responses.map((response, index) => ({
                ...reportCards[index],
                data: response.data?.data ?? response.data ?? {},
            }));
        },
    });

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
                        <BarChart3 size={20} /> Reports
                    </div>
                    <div className="page-subtitle">
                        Operational and performance metrics from the production
                        backend.
                    </div>
                </div>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => refetch()}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {isLoading ? (
                <div
                    className="card"
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#64748b",
                    }}
                >
                    Loading reports...
                </div>
            ) : isError ? (
                <div
                    className="card"
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        color: "#991b1b",
                        background: "#fef2f2",
                    }}
                >
                    Unable to load report data right now.
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    {data?.map((item) => (
                        <div
                            key={item.key}
                            className="card"
                            style={{ padding: "1rem" }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>
                                    {item.label}
                                </div>
                                <FileBarChart2 size={18} color="#2563eb" />
                            </div>
                            <div
                                style={{
                                    color: "#475569",
                                    fontSize: "0.82rem",
                                }}
                            >
                                {item.data?.summary ? (
                                    <div
                                        style={{
                                            display: "grid",
                                            gap: "0.35rem",
                                        }}
                                    >
                                        {Object.entries(item.data.summary)
                                            .slice(0, 4)
                                            .map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        gap: "1rem",
                                                    }}
                                                >
                                                    <span>
                                                        {key.replace(/_/g, " ")}
                                                    </span>
                                                    <strong>{value}</strong>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div style={{ color: "#64748b" }}>
                                        Report data available
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
