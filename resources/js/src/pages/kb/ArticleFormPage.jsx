import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const emptyForm = {
    title: "",
    category_id: "",
    status: "draft",
    symptoms: "",
    solution_summary: "",
    tags: "",
    content: "",
};

export default function ArticleFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [form, setForm] = useState(emptyForm);

    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get("/categories").then((r) => r.data.data || []),
    });

    useEffect(() => {
        if (!isEdit) return;

        api.get(`/knowledge/${id}`).then((r) => {
            const article = r.data.data || {};
            setForm({
                ...emptyForm,
                title: article.title || "",
                category_id: article.category_id || "",
                status: article.status || "draft",
                symptoms: article.symptoms || "",
                solution_summary: article.solution_summary || "",
                tags: Array.isArray(article.tags)
                    ? article.tags.join(", ")
                    : "",
                content: article.content || "",
            });
        });
    }, [id, isEdit]);

    const mutation = useMutation({
        mutationFn: (payload) =>
            isEdit
                ? api.put(`/knowledge/${id}`, payload)
                : api.post("/knowledge", payload),
        onSuccess: () => navigate("/knowledge"),
    });

    const submitLabel = useMemo(
        () =>
            mutation.isPending
                ? "Saving..."
                : isEdit
                  ? "Update article"
                  : "Create article",
        [mutation.isPending, isEdit],
    );

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            ...form,
            category_id: form.category_id || null,
            tags: form.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            status: form.status || "draft",
        };

        mutation.mutate(payload);
    };

    return (
        <div className="page-container" style={{ display: "grid", gap: "1.25rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">
                        {isEdit ? "Edit Article" : "Create Article"}
                    </div>
                    <div className="page-subtitle">
                        Knowledge base and troubleshooting guidance
                    </div>
                </div>
                <Link to="/knowledge" className="btn btn-secondary btn-sm">
                    Back to articles
                </Link>
            </div>

            <form
                className="card"
                onSubmit={handleSubmit}
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
                    <div
                        className="form-group"
                        style={{ gridColumn: "1 / -1" }}
                    >
                        <label className="form-label">Title</label>
                        <input
                            className="form-input"
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            placeholder="e.g. MRI scanner not connecting to PACS"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            value={form.category_id || ""}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    category_id: e.target.value,
                                })
                            }
                        >
                            <option value="">General</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={form.status}
                            onChange={(e) =>
                                setForm({ ...form, status: e.target.value })
                            }
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>

                    <div
                        className="form-group"
                        style={{ gridColumn: "1 / -1" }}
                    >
                        <label className="form-label">Tags</label>
                        <input
                            className="form-input"
                            value={form.tags}
                            onChange={(e) =>
                                setForm({ ...form, tags: e.target.value })
                            }
                            placeholder="network, pacs, scanner, troubleshooting"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Symptoms</label>
                    <textarea
                        className="form-textarea"
                        rows={4}
                        value={form.symptoms}
                        onChange={(e) =>
                            setForm({ ...form, symptoms: e.target.value })
                        }
                        placeholder="Describe the issue symptoms and conditions when it occurs."
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Summary</label>
                    <textarea
                        className="form-textarea"
                        rows={3}
                        value={form.solution_summary}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                solution_summary: e.target.value,
                            })
                        }
                        placeholder="Short resolution summary or quick guidance."
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Article content</label>
                    <textarea
                        className="form-textarea"
                        rows={12}
                        value={form.content}
                        onChange={(e) =>
                            setForm({ ...form, content: e.target.value })
                        }
                        placeholder="Write the full article content, troubleshooting steps, and resolution guidance."
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
                        onClick={() => navigate("/knowledge")}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={mutation.isPending}
                    >
                        {submitLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}
