import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    BookOpenText,
    CalendarDays,
    Eye,
    Tags,
    UserRound,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle,
    Ticket,
    Sparkles,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";

export default function ArticleDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const canManage = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager", "technician"].includes(r.name || r)
    );

    const { data, isLoading, isError } = useQuery({
        queryKey: ["article-detail", id],
        queryFn: () => api.get(`/knowledge/${id}`).then((r) => r.data.data),
        enabled: !!id,
    });

    const publishMutation = useMutation({
        mutationFn: () => api.post(`/knowledge/${id}/publish`),
        onSuccess: () => {
            toast.success("Article published successfully");
            queryClient.invalidateQueries({ queryKey: ["article-detail", id] });
            queryClient.invalidateQueries({ queryKey: ["knowledge"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to publish article");
        },
    });

    const unpublishMutation = useMutation({
        mutationFn: () => api.post(`/knowledge/${id}/unpublish`),
        onSuccess: () => {
            toast.success("Article returned to draft");
            queryClient.invalidateQueries({ queryKey: ["article-detail", id] });
            queryClient.invalidateQueries({ queryKey: ["knowledge"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to unpublish article");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/knowledge/${id}`),
        onSuccess: () => {
            toast.success("Article deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["knowledge"] });
            navigate("/knowledge");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete article");
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    ))}
                </div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    Article Not Found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    This knowledge base article might have been unpublished or removed.
                </p>
                <Link
                    to="/knowledge"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                >
                    <ArrowLeft size={16} /> Back to Knowledge Base
                </Link>
            </div>
        );
    }

    const tags = Array.isArray(data.tags) ? data.tags : [];
    const linkedTickets = data.tickets || [];
    const isPublished = data.status === "published";

    return (
        <div className="page-container space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        <ArrowLeft size={14} />
                        <Link to="/knowledge" className="hover:text-cyan-600 transition">
                            Knowledge Base
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-300">
                            {data.category?.name || "Articles"}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {data.title}
                    </h1>
                </div>

                <div className="flex items-center gap-2.5">
                    <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border capitalize ${
                            isPublished
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                        }`}
                    >
                        {data.status || "draft"}
                    </span>

                    {canManage && (
                        <>
                            {isPublished ? (
                                <button
                                    onClick={() => unpublishMutation.mutate()}
                                    disabled={unpublishMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                                >
                                    <XCircle size={14} /> Unpublish
                                </button>
                            ) : (
                                <button
                                    onClick={() => publishMutation.mutate()}
                                    disabled={publishMutation.isPending}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                                >
                                    <CheckCircle2 size={14} /> Publish
                                </button>
                            )}

                            <Link
                                to={`/knowledge/${id}/edit`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                                <Edit size={14} /> Edit
                            </Link>

                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold transition"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Metric Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shrink-0">
                        <UserRound size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Author</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {data.author
                                ? `${data.author.first_name} ${data.author.last_name}`
                                : "Hospital IT Staff"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                        <CalendarDays size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Publish Date</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {data.published_at
                                ? new Date(data.published_at).toLocaleDateString()
                                : "Draft (Unpublished)"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                        <Eye size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Views</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {data.views ?? 0}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                        <Tags size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {data.category?.name || "General IT"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Article Content & Solution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Symptoms / Issue Diagnosis */}
                    {data.symptoms && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                                <AlertCircle size={18} className="text-amber-500" />
                                Symptoms & Diagnosis
                            </h2>
                            <div className="text-sm text-slate-700 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200/60 dark:border-amber-900/40 whitespace-pre-wrap leading-relaxed">
                                {data.symptoms}
                            </div>
                        </div>
                    )}

                    {/* Main Article Body */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <BookOpenText size={18} className="text-cyan-600" />
                            Solution & Walkthrough
                        </h2>
                        <div
                            className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed prose dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                                __html:
                                    data.content ||
                                    "<p>No detailed solution steps recorded.</p>",
                            }}
                        />
                    </div>
                </div>

                {/* Right Col: Quick Solution Summary, Tags, Linked Tickets */}
                <div className="space-y-6">
                    {data.solution_summary && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-2">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Sparkles size={18} className="text-cyan-600" />
                                Quick Summary
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                {data.solution_summary}
                            </p>
                        </div>
                    )}

                    {/* Tags */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Tags size={16} className="text-cyan-600" />
                            Indexed Keywords & Tags
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.length > 0 ? (
                                tags.map((tag, idx) => (
                                    <span
                                        key={`${tag}-${idx}`}
                                        className="px-2.5 py-1 text-xs rounded-md bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-medium"
                                    >
                                        #{tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400 italic">No tags assigned</span>
                            )}
                        </div>
                    </div>

                    {/* Linked Tickets */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Ticket size={16} className="text-cyan-600" />
                            Resolved Tickets Linked ({linkedTickets.length})
                        </h2>
                        {linkedTickets.length > 0 ? (
                            <div className="space-y-2">
                                {linkedTickets.map((t) => (
                                    <Link
                                        key={t.id}
                                        to={`/tickets/${t.id}`}
                                        className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-cyan-500/40 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs transition"
                                    >
                                        <div className="truncate mr-2">
                                            <span className="font-semibold text-cyan-600">
                                                {t.ticket_number}
                                            </span>{" "}
                                            · {t.title}
                                        </div>
                                        <ExternalLink size={12} className="text-slate-400 shrink-0" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No tickets linked yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                title="Delete Article"
                message={`Are you sure you want to permanently delete knowledge article "${data.title}"? This cannot be undone.`}
                confirmText="Yes, Delete Article"
                type="danger"
                onConfirm={() => {
                    setIsDeleteDialogOpen(false);
                    deleteMutation.mutate();
                }}
                onCancel={() => setIsDeleteDialogOpen(false)}
            />
        </div>
    );
}
