import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Building,
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
    city: "",
    address: "",
    phone: "",
    manager_id: "",
    is_active: true,
};

export default function BranchesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const { data: branches = [], isLoading } = useQuery({
        queryKey: ["admin-branches"],
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

    const filteredBranches = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return branches;
        return branches.filter((branch) => {
            const haystack = [
                branch.name,
                branch.code,
                branch.city,
                branch.address,
                branch.phone,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [branches, search]);

    const saveBranch = useMutation({
        mutationFn: async (payload) => {
            if (editingId) {
                return api.put(`/branches/${editingId}`, payload);
            }
            return api.post("/branches", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
            setForm(emptyForm);
            setEditingId(null);
        },
    });

    const deleteBranch = useMutation({
        mutationFn: async (id) => api.delete(`/branches/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-branches"] });
        },
    });

    const handleSave = (event) => {
        event.preventDefault();
        const payload = {
            ...form,
            manager_id: form.manager_id || null,
            is_active: !!form.is_active,
        };
        saveBranch.mutate(payload);
    };

    const handleEdit = (branch) => {
        setEditingId(branch.id);
        setForm({
            name: branch.name ?? "",
            code: branch.code ?? "",
            city: branch.city ?? "",
            address: branch.address ?? "",
            phone: branch.phone ?? "",
            manager_id: branch.manager_id ?? "",
            is_active: !!branch.is_active,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Branches"
                subtitle="Overview of hospital campuses, physical facilities, and location contacts"
                icon={Building}
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
                            <label className="form-label">Branch name</label>
                            <input
                                className="form-input"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="e.g. Main Campus"
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
                                placeholder="e.g. MAIN"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <input
                                className="form-input"
                                value={form.city}
                                onChange={(e) =>
                                    setForm({ ...form, city: e.target.value })
                                }
                                placeholder="City"
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
                                placeholder="+0000000000"
                            />
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
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                            className="form-textarea"
                            value={form.address}
                            onChange={(e) =>
                                setForm({ ...form, address: e.target.value })
                            }
                            placeholder="Complete address"
                            rows={3}
                        />
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
                                type="submit"
                                className="btn btn-primary"
                                disabled={saveBranch.isPending}
                            >
                                {saveBranch.isPending ? (
                                    "Saving..."
                                ) : editingId ? (
                                    <>
                                        <Save size={14} /> Save changes
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} /> Add branch
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
                            placeholder="Search branches"
                            style={{ paddingLeft: "2.2rem" }}
                        />
                    </div>
                    <div className="page-subtitle">
                        {filteredBranches.length} branch(es)
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>City</th>
                                <th>Manager</th>
                                <th>Status</th>
                                <th>Counts</th>
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
                            ) : filteredBranches.length ? (
                                filteredBranches.map((branch) => (
                                    <tr key={branch.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {branch.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    color: "#64748b",
                                                }}
                                            >
                                                {branch.address || "No address"}
                                            </div>
                                        </td>
                                        <td>{branch.code}</td>
                                        <td>{branch.city || "—"}</td>
                                        <td>
                                            {branch.manager?.first_name
                                                ? `${branch.manager.first_name} ${branch.manager.last_name}`
                                                : "—"}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${branch.is_active ? "badge-open" : "badge-closed"}`}
                                            >
                                                {branch.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    fontSize: "0.8rem",
                                                    color: "#475569",
                                                }}
                                            >
                                                {branch.tickets_count ?? 0}{" "}
                                                tickets /{" "}
                                                {branch.departments_count ?? 0}{" "}
                                                depts /{" "}
                                                {branch.users_count ?? 0} users
                                            </div>
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
                                                        handleEdit(branch)
                                                    }
                                                >
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() =>
                                                        deleteBranch.mutate(
                                                            branch.id,
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
                                            <Building size={28} />
                                            No branches found.
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
