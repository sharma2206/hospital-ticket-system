import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Layers,
    Send,
    Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
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
        queryFn: async () => {
            const r = await api.get("/karexpert-categories");
            return Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
        },
    });

    const { data: priorities = [] } = useQuery({
        queryKey: ["priorities"],
        queryFn: async () => {
            const r = await api.get("/priorities");
            return Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
        },
    });

    const { data: modules = [] } = useQuery({
        queryKey: ["karexpert-modules"],
        queryFn: async () => {
            const r = await api.get("/karexpert-modules");
            return Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
        },
    });

    const mutation = useMutation({
        mutationFn: (payload) => api.post("/karexpert/tickets", payload),
        onSuccess: (res) => {
            toast.success("KareXpert ticket raised successfully");
            const id = res?.data?.data?.id;
            if (id) navigate(`/karexpert/tickets/${id}`);
            else navigate("/karexpert/tickets");
        },
        onError: (err) => {
            const errs = err.response?.data?.errors;
            if (errs) {
                Object.values(errs).flat().forEach((msg) => toast.error(msg));
            } else {
                toast.error(err.response?.data?.message || "Failed to raise KareXpert ticket");
            }
        },
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        mutation.mutate(form);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <span>Raise KareXpert Issue</span>
                    </h1>
                    <p className="page-subtitle">
                        Report HMS application bugs, workflow issues, or change requests to KareXpert
                    </p>
                </div>
                <Link to="/karexpert/tickets" className="btn btn-secondary btn-sm flex items-center gap-1.5">
                    <ArrowLeft size={15} />
                    <span>Back to KX tickets</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                <div className="form-group">
                    <label className="form-label">Issue Title *</label>
                    <input
                        className="form-control"
                        placeholder="Brief summary of KareXpert issue (e.g. Billing module invoice print freeze)"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="form-label">KareXpert Module *</label>
                        <select
                            className="form-control"
                            value={form.karexpert_module}
                            onChange={(e) => setForm({ ...form, karexpert_module: e.target.value })}
                            required
                        >
                            <option value="">Select Module...</option>
                            {Array.isArray(modules) && modules.map((m, idx) => {
                                const val = typeof m === 'object' ? (m.value ?? m.label ?? m.name) : m;
                                const lbl = typeof m === 'object' ? (m.label ?? m.name ?? m.value) : m;
                                return (
                                    <option key={val ?? idx} value={val}>
                                        {lbl}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category *</label>
                        <select
                            className="form-control"
                            value={form.category_id}
                            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                            required
                        >
                            <option value="">Select Category...</option>
                            {Array.isArray(categories) && categories.map((c) => (
                                <option key={c.id ?? c.code} value={c.id}>
                                    {c.name ?? c.title ?? c.code}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-group">
                        <label className="form-label">Priority *</label>
                        <select
                            className="form-control"
                            value={form.priority_id}
                            onChange={(e) => setForm({ ...form, priority_id: e.target.value })}
                            required
                        >
                            <option value="">Select Priority...</option>
                            {Array.isArray(priorities) && priorities.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">KareXpert Ref ID (Optional)</label>
                        <input
                            className="form-control"
                            placeholder="e.g. KX-BUG-4892"
                            value={form.karexpert_ref_id}
                            onChange={(e) => setForm({ ...form, karexpert_ref_id: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">KX Engineer Contact (Optional)</label>
                        <input
                            className="form-control"
                            placeholder="Name / Phone of KX rep"
                            value={form.karexpert_contact}
                            onChange={(e) => setForm({ ...form, karexpert_contact: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Detailed Description *</label>
                    <textarea
                        className="form-control"
                        rows={5}
                        placeholder="Provide full description of the bug, patient ID or bill # affected, error message, and steps to reproduce..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        required
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Link to="/karexpert/tickets" className="btn btn-secondary">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="btn btn-primary flex items-center gap-2"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Raising Ticket...</span>
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                <span>Raise to KareXpert</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
