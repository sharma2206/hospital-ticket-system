import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    CircleDashed,
    Clock,
    FileText,
    History,
    Layers,
    MessageSquareText,
    RefreshCw,
    Save,
    Send,
    Tag,
    UserCheck,
    UserRound,
    ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import StatusBadge from "../Common/StatusBadge";

export default function KxTicketDetail() {
    const { id } = useParams();
    const queryClient = useQueryClient();

    // Form state for updating ticket
    const [statusId, setStatusId] = useState("");
    const [refId, setRefId] = useState("");
    const [contact, setContact] = useState("");
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [newComment, setNewComment] = useState("");

    const { data: ticket, isLoading, isError, refetch } = useQuery({
        queryKey: ["karexpert-ticket-detail", id],
        queryFn: () => api.get(`/karexpert/tickets/${id}`).then((r) => r.data),
        enabled: !!id,
    });

    const { data: statusesData } = useQuery({
        queryKey: ["karexpert-statuses"],
        queryFn: () => api.get("/karexpert-statuses").then((r) => r.data.data || []),
    });

    useEffect(() => {
        if (ticket) {
            setStatusId(ticket.status_id ? String(ticket.status_id) : "");
            setRefId(ticket.karexpert_ref_id || "");
            setContact(ticket.karexpert_contact || "");
            setResolutionNotes(ticket.resolution_notes || "");
        }
    }, [ticket]);

    // Mutation: Update KareXpert ticket
    const updateMutation = useMutation({
        mutationFn: (payload) => api.put(`/karexpert/tickets/${id}`, payload),
        onSuccess: () => {
            toast.success("KareXpert ticket updated successfully");
            queryClient.invalidateQueries({ queryKey: ["karexpert-ticket-detail", id] });
            queryClient.invalidateQueries({ queryKey: ["karexpert-tickets"] });
            queryClient.invalidateQueries({ queryKey: ["karexpert-dashboard"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update ticket");
        },
    });

    // Mutation: Post Comment
    const commentMutation = useMutation({
        mutationFn: (commentText) => api.post(`/tickets/${id}/comments`, { comment: commentText }),
        onSuccess: () => {
            toast.success("Comment added");
            setNewComment("");
            queryClient.invalidateQueries({ queryKey: ["karexpert-ticket-detail", id] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to post comment");
        },
    });

    const handleUpdate = (e) => {
        e.preventDefault();
        const payload = {};
        if (statusId) payload.status_id = Number(statusId);
        payload.karexpert_ref_id = refId;
        payload.karexpert_contact = contact;
        if (resolutionNotes) payload.resolution_notes = resolutionNotes;
        updateMutation.mutate(payload);
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        commentMutation.mutate(newComment.trim());
    };

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

    if (isError || !ticket) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
                    <CircleDashed size={24} />
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                    KareXpert Ticket Not Found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    This ticket might not exist or isn't marked as a KareXpert vendor ticket.
                </p>
                <Link
                    to="/karexpert/tickets"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
                >
                    <ArrowLeft size={16} /> Back to KareXpert Tickets
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        <ArrowLeft size={14} />
                        <Link to="/karexpert/tickets" className="hover:text-cyan-600 transition">
                            KareXpert Tickets
                        </Link>
                        <span>/</span>
                        <span className="text-slate-700 dark:text-slate-300">
                            {ticket.ticket_number || `KX-${ticket.id}`}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {ticket.title}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {ticket.status && (
                        <StatusBadge
                            code={ticket.status.code || ticket.status.name}
                            label={ticket.status.name}
                            color={ticket.status.color}
                        />
                    )}
                    {ticket.priority && (
                        <span
                            className="px-2.5 py-1 text-xs font-semibold rounded-full border"
                            style={{
                                backgroundColor: `${ticket.priority.color || '#64748b'}15`,
                                borderColor: `${ticket.priority.color || '#64748b'}40`,
                                color: ticket.priority.color || '#64748b',
                            }}
                        >
                            {ticket.priority.name} Priority
                        </span>
                    )}
                    <button
                        onClick={() => refetch()}
                        title="Refresh details"
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Top Metric / Quick Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shrink-0">
                        <Layers size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">KareXpert Module</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {ticket.karexpert_module || "General"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                        <Tag size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">KareXpert Ref ID</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {ticket.karexpert_ref_id || "Not assigned"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                        <UserRound size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Created By</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {ticket.creator
                                ? `${ticket.creator.first_name} ${ticket.creator.last_name}`
                                : "Hospital Staff"}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Vendor Contact</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {ticket.karexpert_contact || "Vendor Support"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Details, Comments, Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-cyan-600" />
                            Problem Description
                        </h2>
                        <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                            {ticket.description || "No detailed description provided."}
                        </div>

                        {ticket.resolution_notes && (
                            <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                                    <CheckCircle2 size={15} /> Resolution Notes
                                </h3>
                                <div className="text-sm text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    {ticket.resolution_notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments Thread & Submission */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <MessageSquareText size={18} className="text-cyan-600" />
                            Comments & Coordination ({ticket.comments?.length || 0})
                        </h2>

                        <div className="space-y-4 mb-6">
                            {ticket.comments && ticket.comments.length > 0 ? (
                                ticket.comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                                                    {comment.user?.first_name?.[0] || "U"}
                                                </div>
                                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                    {comment.user
                                                        ? `${comment.user.first_name} ${comment.user.last_name}`
                                                        : "Hospital User"}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {comment.created_at
                                                    ? new Date(comment.created_at).toLocaleString()
                                                    : ""}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap pl-9">
                                            {comment.comment || comment.message}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic">No comments posted yet.</p>
                            )}
                        </div>

                        {/* Add Comment Input */}
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add an internal note or vendor update..."
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <button
                                type="submit"
                                disabled={commentMutation.isPending || !newComment.trim()}
                                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50"
                            >
                                <Send size={15} /> Post
                            </button>
                        </form>
                    </div>

                    {/* Activity / History */}
                    {ticket.history && ticket.history.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                                <History size={18} className="text-cyan-600" />
                                Audit Trail & History
                            </h2>
                            <div className="space-y-3">
                                {ticket.history.map((h) => (
                                    <div
                                        key={h.id}
                                        className="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-800/60 pb-2.5 last:border-0"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-slate-700 dark:text-slate-300 font-medium">
                                                {h.description || `${h.change_type} updated`}
                                            </p>
                                            <span className="text-slate-400">
                                                By {h.changed_by?.first_name || "System"} •{" "}
                                                {new Date(h.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Update Controls & Metadata */}
                <div className="space-y-6">
                    {/* Status Update Form */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                            <Save size={18} className="text-cyan-600" />
                            Manage KareXpert Ticket
                        </h2>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusId}
                                    onChange={(e) => setStatusId(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    <option value="">Select status</option>
                                    {statusesData?.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                    KareXpert Reference ID
                                </label>
                                <input
                                    type="text"
                                    value={refId}
                                    onChange={(e) => setRefId(e.target.value)}
                                    placeholder="e.g. KX-9874"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                    Contact / Vendor Spoc
                                </label>
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="e.g. support@karexpert.com"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                    Resolution Notes
                                </label>
                                <textarea
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Resolution details or deployment patch info..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                            >
                                <Save size={15} />
                                {updateMutation.isPending ? "Saving..." : "Save KareXpert Updates"}
                            </button>
                        </form>
                    </div>

                    {/* Context info */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            Context & Links
                        </h2>

                        {ticket.parentTicket && (
                            <div>
                                <div className="text-xs text-slate-400 font-medium">Internal Hospital Ticket</div>
                                <Link
                                    to={`/tickets/${ticket.parentTicket.id}`}
                                    className="text-sm font-semibold text-cyan-600 hover:underline flex items-center gap-1.5 mt-0.5"
                                >
                                    <span>{ticket.parentTicket.ticket_number}</span>
                                    <ExternalLink size={13} />
                                </Link>
                                <div className="text-xs text-slate-500 truncate mt-0.5">
                                    {ticket.parentTicket.title}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Category</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {ticket.category?.name || "General IT"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Created On</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-slate-400 font-medium">Last Updated</div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : "—"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
