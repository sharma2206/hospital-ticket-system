import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpenText, Plus, Search } from "lucide-react";
import api from "../../services/api";

export default function KnowledgeBasePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");

    const filters = {
        search: searchParams.get("search") || "",
        status: searchParams.get("status") || "",
        page: searchParams.get("page") || 1,
        per_page: searchParams.get("per_page") || 15,
    };

    const { data, isLoading } = useQuery({
        queryKey: ["knowledge-articles", filters],
        queryFn: () =>
            api.get("/knowledge", { params: filters }).then((r) => r.data),
        keepPreviousData: true,
    });

    const articles = data?.data || [];
    const pagination = data?.pagination || {};

    const setFilter = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        params.set("page", "1");
        setSearchParams(params);
    };

    const doSearch = (event) => {
        event.preventDefault();
        setFilter("search", search);
    };

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">📚 Knowledge Base</div>
                    <div className="page-subtitle">
                        {pagination.total ?? 0} articles
                    </div>
                </div>
                <Link to="/knowledge/create" className="btn btn-primary">
                    <Plus size={16} /> New Article
                </Link>
            </div>

            <div className="card" style={{ padding: "1rem" }}>
                <div
                    style={{
                        display: "flex",
                        gap: ".75rem",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                    }}
                >
                    <form
                        onSubmit={doSearch}
                        style={{
                            display: "flex",
                            gap: ".5rem",
                            flex: 1,
                            minWidth: "240px",
                        }}
                    >
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search article title or summary"
                        />
                        <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                        >
                            <Search size={15} />
                        </button>
                    </form>

                    <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilter("status", e.target.value)}
                        style={{ maxWidth: "170px" }}
                    >
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Article</th>
                                <th>Status</th>
                                <th>Category</th>
                                <th>Views</th>
                                <th>Author</th>
                                <th>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5)
                                    .fill(0)
                                    .map((_, index) => (
                                        <tr key={index}>
                                            {Array(6)
                                                .fill(0)
                                                .map((__, cell) => (
                                                    <td key={cell}>
                                                        <div className="skeleton skeleton-text" />
                                                    </td>
                                                ))}
                                        </tr>
                                    ))
                            ) : articles.length ? (
                                articles.map((article) => (
                                    <tr key={article.id}>
                                        <td>
                                            <div style={{ fontWeight: 700 }}>
                                                {article.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: ".75rem",
                                                    color: "var(--text-muted)",
                                                }}
                                            >
                                                {article.solution_summary ||
                                                    "No summary provided"}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    background:
                                                        article.status ===
                                                        "published"
                                                            ? "#dcfce7"
                                                            : "#fef3c7",
                                                    color:
                                                        article.status ===
                                                        "published"
                                                            ? "#166534"
                                                            : "#92400e",
                                                }}
                                            >
                                                {article.status || "draft"}
                                            </span>
                                        </td>
                                        <td>
                                            {article.category?.name ||
                                                "General"}
                                        </td>
                                        <td>{article.views ?? 0}</td>
                                        <td>
                                            {article.author
                                                ? `${article.author.first_name} ${article.author.last_name}`
                                                : "—"}
                                        </td>
                                        <td
                                            style={{
                                                color: "var(--text-muted)",
                                                fontSize: ".82rem",
                                            }}
                                        >
                                            {article.updated_at
                                                ? new Date(
                                                      article.updated_at,
                                                  ).toLocaleDateString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            textAlign: "center",
                                            padding: "2rem",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No knowledge articles found.
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
