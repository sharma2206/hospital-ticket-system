import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Layers,
    Save,
    RotateCcw,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import Modal from "../Shared/Modal";

export default function AssetCategoryModal({ isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["asset-categories-all"],
        queryFn: () => api.get("/asset-categories").then((r) => r.data.data || []),
        enabled: isOpen,
    });

    const resetForm = () => {
        setEditingId(null);
        setName("");
        setCode("");
        setDescription("");
        setIsActive(true);
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setName(cat.name);
        setCode(cat.code || "");
        setDescription(cat.description || "");
        setIsActive(cat.is_active);
    };

    const saveMutation = useMutation({
        mutationFn: (payload) => {
            if (editingId) {
                return api.put(`/asset-categories/${editingId}`, payload);
            }
            return api.post("/asset-categories", payload);
        },
        onSuccess: () => {
            toast.success(editingId ? "Category updated successfully" : "Category created successfully");
            queryClient.invalidateQueries({ queryKey: ["asset-categories-all"] });
            queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
            resetForm();
        },
        onError: (err) => {
            const msg = err.response?.data?.message || "Failed to save category";
            toast.error(msg);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id) => api.patch(`/asset-categories/${id}/toggle-active`),
        onSuccess: (res) => {
            toast.success(res.data?.message || "Category status updated");
            queryClient.invalidateQueries({ queryKey: ["asset-categories-all"] });
            queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to toggle status");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/asset-categories/${id}`),
        onSuccess: () => {
            toast.success("Category deleted");
            queryClient.invalidateQueries({ queryKey: ["asset-categories-all"] });
            queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
            if (editingId) resetForm();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Cannot delete category with linked assets");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }
        saveMutation.mutate({
            name: name.trim(),
            code: code.trim() || null,
            description: description.trim() || null,
            is_active: isActive,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Manage IT Asset Categories"
            subtitle="Configure hardware and clinical equipment categories for asset classification"
            maxWidth="max-w-3xl"
        >
            <div className="space-y-6">
                {/* Form to Create/Edit */}
                <form
                    onSubmit={handleSubmit}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3"
                >
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            {editingId ? <Edit2 size={13} className="text-amber-500" /> : <Plus size={13} className="text-blue-500" />}
                            {editingId ? "Edit Category" : "Add New Category"}
                        </span>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            >
                                <RotateCcw size={12} /> Cancel Edit
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="form-group sm:col-span-2">
                            <label className="form-label text-xs font-medium">Category Name *</label>
                            <input
                                className="form-control"
                                placeholder="e.g. Ultrasound Machine, Core Switch, Laptop"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label text-xs font-medium">Code (Optional)</label>
                            <input
                                className="form-control uppercase"
                                placeholder="e.g. USG, SW, LAP"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="form-group sm:col-span-2">
                            <label className="form-label text-xs font-medium">Description</label>
                            <input
                                className="form-control"
                                placeholder="Brief description of this equipment type"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className="form-group flex flex-col justify-end">
                            <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <span>Active for New Assets</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                            disabled={saveMutation.isPending}
                        >
                            <Save size={14} />
                            <span>{saveMutation.isPending ? "Saving..." : editingId ? "Update Category" : "Add Category"}</span>
                        </button>
                    </div>
                </form>

                {/* Table of existing categories */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-900/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Configured Asset Categories ({categories.length})</span>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto">
                        <table className="table w-full text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm">
                                <tr>
                                    <th>Category</th>
                                    <th>Code</th>
                                    <th>Status</th>
                                    <th>Assets Linked</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-6 text-slate-400">
                                            Loading categories...
                                        </td>
                                    </tr>
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-6 text-slate-400">
                                            No asset categories found. Add one above.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((cat) => (
                                        <tr key={cat.id} className={editingId === cat.id ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                                            <td>
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {cat.name}
                                                </div>
                                                {cat.description && (
                                                    <div className="text-[11px] text-slate-400 truncate max-w-xs">
                                                        {cat.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="font-mono text-slate-500">
                                                {cat.code || "—"}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMutation.mutate(cat.id)}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                                                        cat.is_active
                                                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                            : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400"
                                                    }`}
                                                    title="Click to toggle active status"
                                                >
                                                    {cat.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                                    {cat.is_active ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                            <td className="text-slate-600 dark:text-slate-400 font-semibold">
                                                {cat.assets_count ?? 0}
                                            </td>
                                            <td className="text-right space-x-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(cat)}
                                                    className="btn btn-secondary btn-xs p-1"
                                                    title="Edit category"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                {(!cat.assets_count || cat.assets_count === 0) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm(`Delete category "${cat.name}"?`)) {
                                                                deleteMutation.mutate(cat.id);
                                                            }
                                                        }}
                                                        className="btn btn-secondary btn-xs p-1 text-rose-600 hover:bg-rose-50"
                                                        title="Delete category"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
