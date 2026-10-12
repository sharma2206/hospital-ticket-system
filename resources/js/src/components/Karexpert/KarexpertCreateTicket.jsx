import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const initialForm = {
    title: "",
    description: "",
    category_id: "",
    priority_id: "",
    karexpert_module: "",
    karexpert_ref_id: "",
    karexpert_contact: "",
};

export default function KxTicketCreate() {
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);

    const { data: categories = [] } = useQuery({
        queryKey: ["karexpert-categories"],
        queryFn: () =>
            api.get("/karexpert-categories").then((r) => r.data.data || []),
    });

    const { data: priorities = [] } = useQuery({
        queryKey: ["priorities"],
        queryFn: () => api.get("/priorities").then((r) => r.data.data || []),
    });

    const { data: modules = [] } = useQuery({
        queryKey: ["karexpert-modules"],
        queryFn: () =>
            api.get("/karexpert-modules").then((r) => r.data.data || []),
    });

    const mutation = useMutation({
        mutationFn: (payload) => api.post("/karexpert/tickets", payload),
        onSuccess: (res) => {
            const id = res?.data?.data?.id;
            if (id) navigate(`/karexpert/tickets/${id}`);
            else navigate("/karexpert/tickets");
        },
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">✍️ Create KareXpert Ticket</div>
                    <div className="page-subtitle">
                        Log a new application or workflow issue
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="card"
                style={{ padding: "1.25rem", display: "grid", gap: "1rem" }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                            className="form-input"
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select
                            className="form-select"
                            value={form.priority_id}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    priority_id: e.target.value,
                                })
                            }
                            required
                        >
                            <option value="">Select</option>
                            {priorities.map((priority) => (
                                <option key={priority.id} value={priority.id}>
                                    {priority.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Module</label>
                        <select
                            className="form-select"
                            value={form.karexpert_module}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    karexpert_module: e.target.value,
                                })
                            }
                            required
                        >
                            <option value="">Select</option>
                            {modules.map((module) => (
                                <option key={module.value} value={module.value}>
                                    {module.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={form.category_id}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    category_id: e.target.value,
                                })
                            }
                            required
                        >
                            <option value="">Select</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                    }}
                >
                    <div className="form-group">
                        <label className="form-label">Reference ID</label>
                        <input
                            className="form-input"
                            value={form.karexpert_ref_id}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    karexpert_ref_id: e.target.value,
                                })
                            }
                            placeholder="Optional"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contact</label>
                        <input
                            className="form-input"
                            value={form.karexpert_contact}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    karexpert_contact: e.target.value,
                                })
                            }
                            placeholder="Optional"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        className="form-textarea"
                        rows={7}
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                        required
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: ".75rem",
                    }}
                >
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/karexpert/tickets")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Submitting..." : "Create Ticket"}
                    </button>
                </div>
            </form>
        </div>
    );
}
