import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

export default function RolesPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["roles"],
        queryFn: () => api.get("/roles").then((r) => r.data.data || []),
    });

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">🛡️ Roles & Permissions</div>
                    <div className="page-subtitle">
                        Access matrix and system roles
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                }}
            >
                {isLoading
                    ? Array(4)
                          .fill(0)
                          .map((_, idx) => (
                              <div
                                  key={idx}
                                  className="card"
                                  style={{ padding: "1rem" }}
                              >
                                  <div
                                      className="skeleton skeleton-text"
                                      style={{
                                          width: "100px",
                                          height: "18px",
                                          marginBottom: "0.8rem",
                                      }}
                                  />
                                  <div
                                      className="skeleton skeleton-card"
                                      style={{ height: "80px" }}
                                  />
                              </div>
                          ))
                    : data?.map((role) => (
                          <div
                              className="card"
                              key={role.id}
                              style={{ padding: "1rem" }}
                          >
                              <div
                                  style={{
                                      fontSize: ".72rem",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                      color: "var(--text-muted)",
                                  }}
                              >
                                  Role
                              </div>
                              <div
                                  style={{
                                      fontWeight: 700,
                                      fontSize: "1.1rem",
                                      margin: "0.4rem 0 0.7rem",
                                  }}
                              >
                                  {role.name}
                              </div>
                              <div
                                  className="badge"
                                  style={{
                                      background: "#dbeafe",
                                      color: "#1d4ed8",
                                  }}
                              >
                                  {role.permissions?.length ?? 0} permissions
                              </div>
                          </div>
                      ))}
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Permissions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={2}>
                                        <div
                                            className="skeleton skeleton-card"
                                            style={{ height: "80px" }}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                data?.map((role) => (
                                    <tr key={role.id}>
                                        <td style={{ fontWeight: 600 }}>
                                            {role.name}
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "0.45rem",
                                                }}
                                            >
                                                {role.permissions?.length ? (
                                                    role.permissions.map(
                                                        (permission) => (
                                                            <span
                                                                key={
                                                                    permission.id
                                                                }
                                                                className="badge"
                                                                style={{
                                                                    background:
                                                                        "#ecfeff",
                                                                    color: "#0f766e",
                                                                }}
                                                            >
                                                                {
                                                                    permission.name
                                                                }
                                                            </span>
                                                        ),
                                                    )
                                                ) : (
                                                    <span
                                                        style={{
                                                            color: "var(--text-muted)",
                                                        }}
                                                    >
                                                        No permissions assigned
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
