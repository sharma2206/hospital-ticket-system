import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpenText, Plus, Eye } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/Shared/PageHeader";
import SearchFilterBar from "../../components/Shared/SearchFilterBar";
import Pagination from "../../components/Shared/Pagination";
import EmptyState from "../../components/Shared/EmptyState";
import StatusBadge from "../../components/Common/StatusBadge";

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

    const doSearch = () => {
        setFilter("search", search);
    };

    const resetFilters = () => {
        setSearchParams({});
        setSearch("");
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Knowledge Base"
                subtitle={`${pagination.total ?? 0} published guides, SOPs, and troubleshooting resolutions`}
                icon={BookOpenText}
                actions={
                    <Link
                        to="/knowledge/create"
                        className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={16} />
                        <span>New Article</span>
                    </Link>
                }
            />

            <SearchFilterBar
                search={search}
                onSearchChange={setSearch}
                onSearchSubmit={doSearch}
                searchPlaceholder="Search article title or solution summary..."
                onReset={filters.search || filters.status ? resetFilters : null}
            >
                <select
                    className="form-control"
                    value={filters.status}
                    onChange={(e) => setFilter("status", e.target.value)}
                    style={{ maxWidth: "170px" }}
                >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </SearchFilterBar>

            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Article Title</th>
                                <th>Status</th>
                                <th>Category</th>
                                <th>Views</th>
                                <th>Author</th>
                                <th>Updated</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5)
                                    .fill(0)
                                    .map((_, index) => (
                                        <tr key={index}>
                                            {Array(7)
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
                                        <td className="max-w-md">
                                            <Link
                                                to={`/knowledge/${article.id}`}
                                                className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-600 transition-colors block"
                                            >
                                                {article.title}
                                            </Link>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {article.solution_summary ||
                                                    "No summary provided"}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                value={article.status || "draft"}
                                                label={article.status || "draft"}
                                                size="sm"
                                            />
                                        </td>
                                        <td>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {article.category?.name || "General"}
                                            </span>
                                        </td>
                                        <td className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                                            {article.views ?? 0}
                                        </td>
                                        <td className="text-xs text-slate-700 dark:text-slate-300">
                                            {article.author
                                                ? `${article.author.first_name} ${article.author.last_name}`
                                                : "—"}
                                        </td>
                                        <td className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {article.updated_at
                                                ? new Date(article.updated_at).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="text-right">
                                            <Link
                                                to={`/knowledge/${article.id}`}
                                                className="btn btn-secondary btn-xs inline-flex items-center gap-1"
                                            >
                                                <Eye size={12} />
                                                <span>Read</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7}>
                                        <EmptyState
                                            icon={BookOpenText}
                                            title="No knowledge articles found"
                                            description="No knowledge base documentation matches your search criteria."
                                            action={
                                                <Link to="/knowledge/create" className="btn btn-primary btn-sm">
                                                    <Plus size={14} /> Create First Article
                                                </Link>
                                            }
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination && pagination.last_page > 1 && (
                    <Pagination
                        currentPage={filters.page}
                        lastPage={pagination.last_page}
                        total={pagination.total}
                        from={pagination.from}
                        to={pagination.to}
                        itemLabel="articles"
                        onPageChange={(p) => setFilter("page", String(p))}
                    />
                )}
            </div>
        </div>
    );
}
