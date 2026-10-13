import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    Check,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/Shared/PageHeader";

const emptyForm = {
    name: "",
    code: "",
    branch_id: "",
    manager_id: "",
    location: "",
    head_name: "",
    contact_no: "",
    email: "",
    is_active: true,
};

export default function DepartmentsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const { data: departments = [], isLoading } = useQuery({
        queryKey: ["admin-departments"],
        queryFn: async () => {
            const { data } = await api.get("/departments");
            return data?.data ?? [];
        },
    });

    const { data: branches = [] } = useQuery({
        queryKey: ["admin-branches-lite"],
        queryFn: async () => {
            const { data } = await api.get("/branches");
            return data?.data ?? [];
        },
    });

    const { data: staff = [] } = useQuery({
        queryKey: ["admin-it-staff"],
        queryFn: async () => {
            const { data } = await api.get("/it-staff");
            return data?.data ?? [];
        },
    });

    const filteredDepartments = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return departments;
        return departments.filter((department) => {
            const haystack = [
                department.name,
                department.code,
                department.location,
                department.head_name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [departments, search]);

    const saveDepartment = useMutation({
        mutationFn: async (payload) => {
            if (editingId) {
                return api.put(`/departments/${editingId}`, payload);
            }
            return api.post("/departments", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
            setForm(emptyForm);
            setEditingId(null);
        },
    });

    const deleteDepartment = useMutation({
        mutationFn: async (id) => api.delete(`/departments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
        },
    });

    const handleSave = (event) => {
        event.preventDefault();
        const payload = {
            ...form,
            branch_id: form.branch_id || null,
            manager_id: form.manager_id || null,
            is_active: !!form.is_active,
        };
        saveDepartment.mutate(payload);
    };

    const handleEdit = (department) => {
        setEditingId(department.id);
        setForm({
            name: department.name ?? "",
            code: department.code ?? "",
            branch_id: department.branch_id ?? "",
            manager_id: department.manager_id ?? "",
            location: department.location ?? "",
            head_name: department.head_name ?? "",
            contact_no: department.contact_no ?? "",
            email: department.email ?? "",
            is_active: !!department.is_active,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Departments"
                subtitle="Manage hospital departments, branch alignments, and leadership"
                icon={Building2}
            />

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
                            <label className="form-label">
                                Department name
                            </label>
                            <input
                                className="form-input"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="e.g. Billing"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code</label>
                            <input
                                className="form-input"
                                value={form.code}
                                onChange={(e) =>
                                    setForm({ ...form, code: e.target.value })
                                }
                                placeholder="e.g. BILL"
                                required
                            />
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
                            <label className="form-label">Manager</label>
                            <select
                                className="form-select"
                                value={form.manager_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        manager_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">No manager</option>
                                {staff.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.first_name} {user.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                className="form-input"
                                value={form.location}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        location: e.target.value,
                                    })
                                }
                                placeholder="Block A"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Head name</label>
                            <input
                                className="form-input"
                                value={form.head_name}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        head_name: e.target.value,
                                    })
                                }
                                placeholder="Department head"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact</label>
                            <input
                                className="form-input"
                                value={form.contact_no}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        contact_no: e.target.value,
                                    })
                                }
                                placeholder="+0000000000"
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
                                placeholder="dept@hospital.com"
                            />
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
                                disabled={saveDepartment.isPending}
                            >
                                {saveDepartment.isPending ? (
                                    "Saving..."
                                ) : editingId ? (
                                    <>
                                        <Save size={14} /> Save changes
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} /> Add department
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
                            placeholder="Search departments"
                            style={{ paddingLeft: "2.2rem" }}
                        />
                    </div>
                    <div className="page-subtitle">
                        {filteredDepartments.length} department(s)
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Branch</th>
                                <th>Manager</th>
                                <th>Status</th>
                                <th>Tickets</th>
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
                                            color: "#64748b",
                                            padding: "2rem",
                                        }}
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredDepartments.length ? (
                                filteredDepartments.map((department) => (
                                    <tr key={department.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {department.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#64748b",
                                                }}
                                            >
                                                {department.location ||
                                                    "No location"}
                                            </div>
                                        </td>
                                        <td>{department.code}</td>
                                        <td>
                                            {department.branch?.name ||
                                                department.branch_name ||
                                                "—"}
                                        </td>
                                        <td>
                                            {department.manager?.first_name
                                                ? `${department.manager.first_name} ${department.manager.last_name}`
                                                : "—"}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${department.is_active ? "badge-open" : "badge-closed"}`}
                                            >
                                                {department.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td>{department.tickets_count ?? 0}</td>
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
                                                        handleEdit(department)
                                                    }
                                                >
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() =>
                                                        deleteDepartment.mutate(
                                                            department.id,
                                                        )
                                                    }
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
                                            color: "#64748b",
                                            padding: "2rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "grid",
                                                placeItems: "center",
                                                gap: "0.4rem",
                                            }}
                                        >
                                            <Building2 size={28} />
                                            No departments found.
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
