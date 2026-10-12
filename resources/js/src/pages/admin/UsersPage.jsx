import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Check,
    Pencil,
    Plus,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    UserCog,
    X,
} from "lucide-react";
import api from "../../services/api";

const emptyForm = {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    department_id: "",
    branch_id: "",
    employee_id: "",
    designation: "",
    role: "employee",
    is_active: true,
};

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const { data: usersResponse, isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const { data } = await api.get("/users", {
                params: { per_page: 100 },
            });
            return data;
        },
    });

    const { data: departments = [] } = useQuery({
        queryKey: ["admin-departments-lite"],
        queryFn: async () => {
            const { data } = await api.get("/departments");
            return data?.data ?? [];
        },
    });

    const { data: branches = [] } = useQuery({
        queryKey: ["admin-branches-lite-users"],
        queryFn: async () => {
            const { data } = await api.get("/branches");
            return data?.data ?? [];
        },
    });

    const { data: roles = [] } = useQuery({
        queryKey: ["admin-roles"],
        queryFn: async () => {
            const { data } = await api.get("/roles");
            return data?.data ?? [];
        },
    });

    const users = usersResponse?.data ?? [];

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter((user) => {
            const haystack = [
                user.first_name,
                user.last_name,
                user.email,
                user.employee_id,
                user.designation,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [users, search]);

    const saveUser = useMutation({
        mutationFn: async (payload) => {
            if (editingId) {
                return api.put(`/users/${editingId}`, payload);
            }
            return api.post("/users", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setForm(emptyForm);
            setEditingId(null);
        },
    });

    const deleteUser = useMutation({
        mutationFn: async (id) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });

    const handleSave = (event) => {
        event.preventDefault();
        const payload = {
            ...form,
            department_id: form.department_id || null,
            branch_id: form.branch_id || null,
            is_active: !!form.is_active,
            role: form.role,
            password: form.password || undefined,
        };
        saveUser.mutate(payload);
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setForm({
            first_name: user.first_name ?? "",
            last_name: user.last_name ?? "",
            email: user.email ?? "",
            password: "",
            phone: user.phone ?? "",
            department_id: user.department_id ?? "",
            branch_id: user.branch_id ?? "",
            employee_id: user.employee_id ?? "",
            designation: user.designation ?? "",
            role: user.roles?.[0]?.name ?? "employee",
            is_active: !!user.is_active,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

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
                        <UserCog size={20} /> Users
                    </div>
                    <div className="page-subtitle">
                        System user management, assignments, and roles.
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
                <form
                    onSubmit={handleSave}
                    style={{ display: "grid", gap: "1rem" }}
                >
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "0.9rem",
                        }}
                    >
                        <div className="form-group">
                            <label className="form-label">First name</label>
                            <input
                                className="form-input"
                                value={form.first_name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        first_name: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last name</label>
                            <input
                                className="form-input"
                                value={form.last_name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        last_name: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Password {editingId ? "(optional)" : ""}
                            </label>
                            <input
                                className="form-input"
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        password: e.target.value,
                                    })
                                }
                                placeholder={
                                    editingId
                                        ? "Leave blank to keep current"
                                        : "Enter password"
                                }
                                required={!editingId}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input
                                className="form-input"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm({ ...form, phone: e.target.value })
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Employee ID</label>
                            <input
                                className="form-input"
                                value={form.employee_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        employee_id: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <select
                                className="form-select"
                                value={form.department_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        department_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">No department</option>
                                {departments.map((department) => (
                                    <option
                                        key={department.id}
                                        value={department.id}
                                    >
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Branch</label>
                            <select
                                className="form-select"
                                value={form.branch_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        branch_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">No branch</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Designation</label>
                            <input
                                className="form-input"
                                value={form.designation}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        designation: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                className="form-select"
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                            >
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "1rem",
                            flexWrap: "wrap",
                        }}
                    >
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "0.85rem",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        is_active: e.target.checked,
                                    })
                                }
                            />
                            Active
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            {editingId ? (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                >
                                    <X size={14} /> Cancel
                                </button>
                            ) : null}
                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={saveUser.isPending}
                            >
                                {saveUser.isPending ? (
                                    "Saving..."
                                ) : editingId ? (
                                    <>
                                        <Save size={14} /> Save changes
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} /> Add user
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1rem",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ position: "relative", minWidth: 220 }}>
                        <Search
                            size={14}
                            style={{
                                position: "absolute",
                                left: "0.8rem",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#64748b",
                            }}
                        />
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search users"
                            style={{ paddingLeft: "2.2rem" }}
                        />
                    </div>
                    <div className="page-subtitle">
                        {filteredUsers.length} user(s)
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Branch</th>
                                <th>Employee ID</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            textAlign: "center",
                                            padding: "2rem",
                                            color: "#64748b",
                                        }}
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredUsers.length ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {user.first_name}{" "}
                                                {user.last_name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#64748b",
                                                }}
                                            >
                                                {user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="badge badge-open"
                                                style={{
                                                    background: "#e0f2fe",
                                                    color: "#075985",
                                                }}
                                            >
                                                {user.roles?.[0]?.name ??
                                                    "user"}
                                            </span>
                                        </td>
                                        <td>{user.department?.name || "—"}</td>
                                        <td>{user.branch?.name || "—"}</td>
                                        <td>{user.employee_id || "—"}</td>
                                        <td>
                                            <span
                                                className={`badge ${user.is_active ? "badge-open" : "badge-closed"}`}
                                            >
                                                {user.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.35rem",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() =>
                                                        handleEdit(user)
                                                    }
                                                >
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => {
                                                        if (window.confirm(`Are you sure you want to delete user "${user.first_name} ${user.last_name}" (${user.email})?`)) {
                                                            deleteUser.mutate(user.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        style={{
                                            textAlign: "center",
                                            padding: "2rem",
                                            color: "#64748b",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "grid",
                                                placeItems: "center",
                                                gap: "0.4rem",
                                            }}
                                        >
                                            <ShieldCheck size={28} />
                                            No users found.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
