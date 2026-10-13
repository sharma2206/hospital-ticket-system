import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Tags,
    FolderTree,
    Plus,
    Search,
    Pencil,
    Trash2,
    CheckCircle2,
    XCircle,
    Layers,
    ArrowUpDown,
    Filter,
    RotateCcw,
    AlertTriangle,
    ChevronRight,
    SlidersHorizontal,
    Tag,
    Clock,
    Hash,
    ShieldAlert,
    Check,
    X,
    ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";
import PageHeader from "../../components/Shared/PageHeader";
import MetricCard from "../../components/Shared/MetricCard";

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#8b5cf6", // Purple
    "#f59e0b", // Amber
    "#ef4444", // Rose
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#64748b", // Slate
];

export default function CategoriesPage() {
    const queryClient = useAuthQueryClientFallback();
    const { hasRole } = useAuth();
    const isSuperAdmin = hasRole("super_admin") || hasRole("admin");

    const [activeTab, setActiveTab] = useState("categories"); // 'categories' | 'subcategories'
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'inactive'
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

    // Sorting
    const [categorySort, setCategorySort] = useState({ by: "name", order: "asc" });
    const [subCategorySort, setSubCategorySort] = useState({ by: "sort_order", order: "asc" });

    // Modals
    const [categoryModal, setCategoryModal] = useState({ isOpen: false, category: null });
    const [subCategoryModal, setSubCategoryModal] = useState({ isOpen: false, subCategory: null, defaultCategoryId: "" });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        variant: "danger",
        confirmText: "Confirm",
        action: null,
    });

    // Form states
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        code: "",
        description: "",
        color: "#3b82f6",
        is_active: true,
    });
    const [subCategoryForm, setSubCategoryForm] = useState({
        category_id: "",
        name: "",
        code: "",
        sort_order: 0,
        is_active: true,
    });
    const [formErrors, setFormErrors] = useState({});

    // ── Queries ─────────────────────────────────────────────────────────────
    const {
        data: categoriesData,
        isLoading: categoriesLoading,
        isError: categoriesError,
        refetch: refetchCategories,
    } = useQuery({
        queryKey: ["admin-categories", statusFilter, categorySort],
        queryFn: async () => {
            const res = await api.get("/categories", {
                params: {
                    all: 1,
                    admin: 1,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    sort_by: categorySort.by,
                    sort_order: categorySort.order,
                },
            });
            return res.data?.data || [];
        },
    });

    const {
        data: subCategoriesData,
        isLoading: subCategoriesLoading,
        isError: subCategoriesError,
        refetch: refetchSubCategories,
    } = useQuery({
        queryKey: ["admin-subcategories", selectedCategoryFilter, statusFilter, subCategorySort],
        queryFn: async () => {
            const res = await api.get("/sub-categories", {
                params: {
                    all: 1,
                    admin: 1,
                    category_id: selectedCategoryFilter !== "all" ? selectedCategoryFilter : undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    sort_by: subCategorySort.by,
                    sort_order: subCategorySort.order,
                },
            });
            return res.data?.data || [];
        },
    });

    const categories = useMemo(() => categoriesData || [], [categoriesData]);
    const subCategories = useMemo(() => subCategoriesData || [], [subCategoriesData]);

    // Filter categories by local search
    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter((c) =>
            (c.name || "").toLowerCase().includes(q) ||
            (c.code || "").toLowerCase().includes(q) ||
            (c.description || "").toLowerCase().includes(q)
        );
    }, [categories, search]);

    // Filter subcategories by local search
    const filteredSubCategories = useMemo(() => {
        const q = search.trim().toLowerCase();
        return subCategories.filter((s) => {
            const matchesCat =
                selectedCategoryFilter === "all" ||
                String(s.category_id) === String(selectedCategoryFilter);
            if (!matchesCat) return false;
            if (!q) return true;
            return (
                (s.name || "").toLowerCase().includes(q) ||
                (s.code || "").toLowerCase().includes(q) ||
                (s.category?.name || "").toLowerCase().includes(q)
            );
        });
    }, [subCategories, search, selectedCategoryFilter]);

    // Stat summaries
    const totalCategories = categories.length;
    const activeCategoriesCount = categories.filter((c) => c.is_active).length;
    const totalSubCategories = subCategories.length;
    const activeSubCategoriesCount = subCategories.filter((s) => s.is_active).length;

    // ── Category Mutations ──────────────────────────────────────────────────
    const saveCategoryMutation = useMutation({
        mutationFn: async (payload) => {
            if (categoryModal.category?.id) {
                return api.put(`/categories/${categoryModal.category.id}`, payload);
            }
            return api.post("/categories", payload);
        },
        onSuccess: (res) => {
            toast.success(res.data?.message || "Category saved successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            closeCategoryModal();
        },
        onError: (err) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                setFormErrors(errors);
                Object.values(errors).flat().forEach((m) => toast.error(m));
            } else {
                toast.error(err.response?.data?.message || "Failed to save category");
            }
        },
    });

    const toggleCategoryMutation = useMutation({
        mutationFn: (id) => api.patch(`/categories/${id}/toggle-active`),
        onSuccess: (res) => {
            toast.success(res.data?.message || "Category status updated");
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update category status");
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id) => api.delete(`/categories/${id}`),
        onSuccess: (res) => {
            toast.success(res.data?.message || "Category deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
            queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete category");
        },
    });

    // ── SubCategory Mutations ───────────────────────────────────────────────
    const saveSubCategoryMutation = useMutation({
        mutationFn: async (payload) => {
            if (subCategoryModal.subCategory?.id) {
                return api.put(`/sub-categories/${subCategoryModal.subCategory.id}`, payload);
            }
            return api.post("/sub-categories", payload);
        },
        onSuccess: (res) => {
            toast.success(res.data?.message || "Subcategory saved successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
            queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            closeSubCategoryModal();
        },
        onError: (err) => {
            const errors = err.response?.data?.errors;
            if (errors) {
                setFormErrors(errors);
                Object.values(errors).flat().forEach((m) => toast.error(m));
            } else {
                toast.error(err.response?.data?.message || "Failed to save subcategory");
            }
        },
    });

    const toggleSubCategoryMutation = useMutation({
        mutationFn: (id) => api.patch(`/sub-categories/${id}/toggle-active`),
        onSuccess: (res) => {
            toast.success(res.data?.message || "Subcategory status updated");
            queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
            queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update subcategory status");
        },
    });

    const deleteSubCategoryMutation = useMutation({
        mutationFn: (id) => api.delete(`/sub-categories/${id}`),
        onSuccess: (res) => {
            toast.success(res.data?.message || "Subcategory deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["admin-subcategories"] });
            queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete subcategory");
        },
    });

    // ── Modal Handlers ──────────────────────────────────────────────────────
    const openAddCategoryModal = () => {
        setCategoryForm({
            name: "",
            code: "",
            description: "",
            color: "#3b82f6",
            is_active: true,
        });
        setFormErrors({});
        setCategoryModal({ isOpen: true, category: null });
    };

    const openEditCategoryModal = (cat) => {
        setCategoryForm({
            name: cat.name || "",
            code: cat.code || "",
            description: cat.description || "",
            color: cat.color || "#3b82f6",
            is_active: cat.is_active ?? true,
        });
        setFormErrors({});
        setCategoryModal({ isOpen: true, category: cat });
    };

    const closeCategoryModal = () => {
        setCategoryModal({ isOpen: false, category: null });
        setFormErrors({});
    };

    const openAddSubCategoryModal = (defaultCatId = "") => {
        setSubCategoryForm({
            category_id: defaultCatId || (categories[0]?.id ? String(categories[0].id) : ""),
            name: "",
            code: "",
            sort_order: 0,
            is_active: true,
        });
        setFormErrors({});
        setSubCategoryModal({ isOpen: true, subCategory: null, defaultCategoryId: defaultCatId });
    };

    const openEditSubCategoryModal = (sub) => {
        setSubCategoryForm({
            category_id: sub.category_id || "",
            name: sub.name || "",
            code: sub.code || "",
            sort_order: sub.sort_order ?? 0,
            is_active: sub.is_active ?? true,
        });
        setFormErrors({});
        setSubCategoryModal({ isOpen: true, subCategory: sub, defaultCategoryId: "" });
    };

    const closeSubCategoryModal = () => {
        setSubCategoryModal({ isOpen: false, subCategory: null, defaultCategoryId: "" });
        setFormErrors({});
    };

    // ── Action Confirmations ────────────────────────────────────────────────
    const handleToggleCategory = (cat) => {
        if (!isSuperAdmin) {
            toast.error("Super Admin privileges required to change category status.");
            return;
        }
        if (cat.is_active) {
            setConfirmModal({
                isOpen: true,
                title: `Deactivate Category "${cat.name}"?`,
                message: `Deactivating this category will hide it from new ticket creation dropdowns. Existing tickets (${cat.tickets_count || 0}) will retain their historical references.`,
                variant: "warning",
                confirmText: "Yes, Deactivate",
                action: () => {
                    toggleCategoryMutation.mutate(cat.id);
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                },
            });
        } else {
            toggleCategoryMutation.mutate(cat.id);
        }
    };

    const handleDeleteCategory = (cat) => {
        if (!isSuperAdmin) {
            toast.error("Super Admin privileges required to delete category.");
            return;
        }
        if ((cat.tickets_count || 0) > 0) {
            toast.error(`Cannot delete category "${cat.name}" because it has ${cat.tickets_count} ticket(s) attached. Please deactivate it instead.`);
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: `Delete Category "${cat.name}"?`,
            message: `Are you sure you want to permanently delete this category? This action cannot be undone.`,
            variant: "danger",
            confirmText: "Delete Category",
            action: () => {
                deleteCategoryMutation.mutate(cat.id);
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    const handleToggleSubCategory = (sub) => {
        if (!isSuperAdmin) {
            toast.error("Super Admin privileges required to change subcategory status.");
            return;
        }
        if (sub.is_active) {
            setConfirmModal({
                isOpen: true,
                title: `Deactivate Subcategory "${sub.name}"?`,
                message: `Deactivating this subcategory will exclude it from ticket creation options. Existing tickets (${sub.tickets_count || 0}) will preserve their historical relationship.`,
                variant: "warning",
                confirmText: "Yes, Deactivate",
                action: () => {
                    toggleSubCategoryMutation.mutate(sub.id);
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                },
            });
        } else {
            toggleSubCategoryMutation.mutate(sub.id);
        }
    };

    const handleDeleteSubCategory = (sub) => {
        if (!isSuperAdmin) {
            toast.error("Super Admin privileges required to delete subcategory.");
            return;
        }
        if ((sub.tickets_count || 0) > 0) {
            toast.error(`Cannot delete subcategory "${sub.name}" because it has ${sub.tickets_count} ticket(s) attached. Please deactivate it instead.`);
            return;
        }
        setConfirmModal({
            isOpen: true,
            title: `Delete Subcategory "${sub.name}"?`,
            message: `Are you sure you want to permanently delete this subcategory? This action cannot be undone.`,
            variant: "danger",
            confirmText: "Delete Subcategory",
            action: () => {
                deleteSubCategoryMutation.mutate(sub.id);
                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
            },
        });
    };

    return (
        <div className="page-container">
            <PageHeader
                title="Categories & Subcategories"
                subtitle="Database-driven IT ticket taxonomy. Manage root issue categories, subcategories, SLAs, and routing"
                icon={FolderTree}
                actions={
                    activeTab === "categories" ? (
                        <button
                            onClick={openAddCategoryModal}
                            disabled={!isSuperAdmin}
                            title={!isSuperAdmin ? "Super Admin permissions required" : "Create new category"}
                            className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={16} />
                            <span>New Category</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => openAddSubCategoryModal()}
                            disabled={!isSuperAdmin}
                            title={!isSuperAdmin ? "Super Admin permissions required" : "Create new subcategory"}
                            className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={16} />
                            <span>New Subcategory</span>
                        </button>
                    )
                }
            />

            {/* Permission Banner if not Super Admin */}
            {!isSuperAdmin && (
                <div className="flex items-center gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                    <ShieldAlert size={18} className="shrink-0 text-amber-600" />
                    <span>
                        <strong>Read-Only Mode:</strong> Only authorized Super Administrators can create, edit, deactivate, or delete ticket categories and subcategories.
                    </span>
                </div>
            )}

            {/* Metric KPI Cards */}
            <div
                className="grid gap-3.5"
                style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                }}
            >
                <MetricCard
                    title="Total Categories"
                    value={totalCategories}
                    icon={Tags}
                    color="#2563eb"
                    sub="Root taxonomies"
                />
                <MetricCard
                    title="Active Categories"
                    value={activeCategoriesCount}
                    icon={CheckCircle2}
                    color="#10b981"
                    sub="Enabled for ticketing"
                />
                <MetricCard
                    title="Total Subcategories"
                    value={totalSubCategories}
                    icon={Layers}
                    color="#7c3aed"
                    sub="Granular classifications"
                />
                <MetricCard
                    title="Active Subcategories"
                    value={activeSubCategoriesCount}
                    icon={Tag}
                    color="#0284c7"
                    sub="Active sub-options"
                />
            </div>

            {/* Navigation Tabs & Search/Filter Controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setActiveTab("categories"); setSearch(""); }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                activeTab === "categories"
                                    ? "bg-cyan-600 text-white shadow-sm"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                        >
                            <Tags size={16} />
                            <span>Categories ({categories.length})</span>
                        </button>

                        <button
                            onClick={() => { setActiveTab("subcategories"); setSearch(""); }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                activeTab === "subcategories"
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            }`}
                        >
                            <Layers size={16} />
                            <span>Subcategories ({subCategories.length})</span>
                        </button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">Status:</span>
                        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                            {["all", "active", "inactive"].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md capitalize transition ${
                                        statusFilter === st
                                            ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                activeTab === "categories"
                                    ? "Search category name, code, description..."
                                    : "Search subcategory name, code, or parent..."
                            }
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    {activeTab === "subcategories" && (
                        <div className="flex items-center gap-2">
                            <Filter size={15} className="text-slate-400" />
                            <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="py-2 px-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (activeTab === "categories") refetchCategories();
                            else refetchSubCategories();
                        }}
                        className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition shrink-0"
                        title="Refresh data"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* ── Table View: Categories Tab ──────────────────────────────────── */}
            {activeTab === "categories" && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {categoriesLoading ? (
                        <div className="p-12 text-center text-slate-400 space-y-3">
                            <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-sm font-medium">Loading ticket categories...</div>
                        </div>
                    ) : categoriesError ? (
                        <div className="p-12 text-center text-rose-500 space-y-2">
                            <AlertTriangle size={32} className="mx-auto text-rose-500" />
                            <div className="font-semibold text-base">Failed to load categories</div>
                            <button
                                onClick={() => refetchCategories()}
                                className="mt-2 text-xs font-medium text-cyan-600 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 space-y-3">
                            <Tags size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
                            <div className="text-base font-semibold text-slate-700 dark:text-slate-300">
                                No categories found
                            </div>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                {search
                                    ? `No categories match query "${search}". Try searching another name or code.`
                                    : "No categories configured. Click '+ New Category' to create the first one."}
                            </p>
                            {isSuperAdmin && (
                                <button
                                    onClick={openAddCategoryModal}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-xs font-semibold"
                                >
                                    <Plus size={14} /> Add Category
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4">Code</th>
                                        <th className="py-3 px-4">Description</th>
                                        <th className="py-3 px-4 text-center">Subcategories</th>
                                        <th className="py-3 px-4 text-center">Attached Tickets</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredCategories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                                        >
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                                                        style={{ backgroundColor: category.color || "#3b82f6" }}
                                                    />
                                                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                                                        {category.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                                    {category.code}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                                {category.description || <span className="text-slate-300 dark:text-slate-600 italic">No description</span>}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCategoryFilter(String(category.id));
                                                        setActiveTab("subcategories");
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition"
                                                    title="View subcategories for this category"
                                                >
                                                    <Layers size={13} />
                                                    <span>{category.sub_categories_count ?? 0}</span>
                                                    <ChevronRight size={12} />
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {category.tickets_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCategory(category)}
                                                    disabled={!isSuperAdmin}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                                                        category.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                                            : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                    } ${isSuperAdmin ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-75"}`}
                                                    title={isSuperAdmin ? "Click to toggle active status" : "Status (Super Admin only)"}
                                                >
                                                    {category.is_active ? (
                                                        <>
                                                            <CheckCircle2 size={13} /> Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={13} /> Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => openAddSubCategoryModal(String(category.id))}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded transition"
                                                            title="Add subcategory under this category"
                                                        >
                                                            <Plus size={15} />
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => openEditCategoryModal(category)}
                                                            className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-800 rounded transition"
                                                            title="Edit category"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteCategory(category)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition"
                                                            title={
                                                                (category.tickets_count || 0) > 0
                                                                    ? "Cannot delete (tickets linked)"
                                                                    : "Delete category"
                                                            }
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Table View: Subcategories Tab ───────────────────────────────── */}
            {activeTab === "subcategories" && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    {subCategoriesLoading ? (
                        <div className="p-12 text-center text-slate-400 space-y-3">
                            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-sm font-medium">Loading subcategories...</div>
                        </div>
                    ) : subCategoriesError ? (
                        <div className="p-12 text-center text-rose-500 space-y-2">
                            <AlertTriangle size={32} className="mx-auto text-rose-500" />
                            <div className="font-semibold text-base">Failed to load subcategories</div>
                            <button
                                onClick={() => refetchSubCategories()}
                                className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredSubCategories.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 space-y-3">
                            <Layers size={40} className="mx-auto text-slate-300 dark:text-slate-700" />
                            <div className="text-base font-semibold text-slate-700 dark:text-slate-300">
                                No subcategories found
                            </div>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                {search
                                    ? `No subcategories match query "${search}".`
                                    : "No subcategories found for the selected filter."}
                            </p>
                            {isSuperAdmin && (
                                <button
                                    onClick={() => openAddSubCategoryModal(selectedCategoryFilter !== "all" ? selectedCategoryFilter : "")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                                >
                                    <Plus size={14} /> Add Subcategory
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4">Subcategory</th>
                                        <th className="py-3 px-4">Parent Category</th>
                                        <th className="py-3 px-4">Code</th>
                                        <th className="py-3 px-4 text-center">Sort Order</th>
                                        <th className="py-3 px-4 text-center">Attached Tickets</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredSubCategories.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                                        >
                                            <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                                                {sub.name}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {sub.category ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                                        <span
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: sub.category.color || "#3b82f6" }}
                                                        />
                                                        {sub.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs">Uncategorized</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                {sub.code ? (
                                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                                        {sub.code}
                                                    </span>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                                                {sub.sort_order ?? 0}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {sub.tickets_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSubCategory(sub)}
                                                    disabled={!isSuperAdmin}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                                                        sub.is_active
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                                            : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                    } ${isSuperAdmin ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-75"}`}
                                                    title={isSuperAdmin ? "Click to toggle active status" : "Status (Super Admin only)"}
                                                >
                                                    {sub.is_active ? (
                                                        <>
                                                            <CheckCircle2 size={13} /> Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle size={13} /> Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => openEditSubCategoryModal(sub)}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded transition"
                                                            title="Edit subcategory"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteSubCategory(sub)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded transition"
                                                            title={
                                                                (sub.tickets_count || 0) > 0
                                                                    ? "Cannot delete (tickets linked)"
                                                                    : "Delete subcategory"
                                                            }
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Modal: Category Create/Edit ─────────────────────────────────── */}
            {categoryModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Tags className="text-cyan-600" size={20} />
                                <span>{categoryModal.category ? "Edit Category" : "New Category"}</span>
                            </h2>
                            <button
                                onClick={closeCategoryModal}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                saveCategoryMutation.mutate(categoryForm);
                            }}
                            className="space-y-4"
                        >
                            {/* Category Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Category Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    placeholder="e.g. Hardware, Network, Electronic Health Record"
                                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                        formErrors.name ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                    }`}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-rose-500 mt-1">{formErrors.name[0]}</p>
                                )}
                            </div>

                            {/* Code & Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Category Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={15}
                                        value={categoryForm.code}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. HW, NET"
                                        className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                            formErrors.code ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                        }`}
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Auto-generated if left blank</p>
                                    {formErrors.code && (
                                        <p className="text-xs text-rose-500 mt-1">{formErrors.code[0]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Badge Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={categoryForm.color}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                            className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                                        />
                                        <div className="flex items-center gap-1 flex-wrap">
                                            {PRESET_COLORS.map((c) => (
                                                <button
                                                    type="button"
                                                    key={c}
                                                    onClick={() => setCategoryForm({ ...categoryForm, color: c })}
                                                    className="w-5 h-5 rounded-full border border-white dark:border-slate-800 shadow-sm transition hover:scale-110"
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Description
                                </label>
                                <textarea
                                    rows={2}
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    placeholder="Brief description of IT requests under this category..."
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>

                            {/* Active Switch */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Active Status
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Available for new ticket creation and triage
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.is_active}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeCategoryModal}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveCategoryMutation.isPending}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg transition shadow-sm"
                                >
                                    {saveCategoryMutation.isPending ? "Saving..." : categoryModal.category ? "Update Category" : "Create Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal: SubCategory Create/Edit ──────────────────────────────── */}
            {subCategoryModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Layers className="text-indigo-600" size={20} />
                                <span>{subCategoryModal.subCategory ? "Edit Subcategory" : "New Subcategory"}</span>
                            </h2>
                            <button
                                onClick={closeSubCategoryModal}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                saveSubCategoryMutation.mutate(subCategoryForm);
                            }}
                            className="space-y-4"
                        >
                            {/* Parent Category */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Parent Category *
                                </label>
                                <select
                                    required
                                    value={subCategoryForm.category_id}
                                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, category_id: e.target.value })}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        formErrors.category_id ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                    }`}
                                >
                                    <option value="">Select parent category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code}) {!c.is_active ? "— [Inactive]" : ""}
                                        </option>
                                    ))}
                                </select>
                                {formErrors.category_id && (
                                    <p className="text-xs text-rose-500 mt-1">{formErrors.category_id[0]}</p>
                                )}
                            </div>

                            {/* SubCategory Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Subcategory Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={subCategoryForm.name}
                                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                                    placeholder="e.g. Printer, Laptop, LAN Cable, PACS Imaging"
                                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        formErrors.name ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                    }`}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-rose-500 mt-1">{formErrors.name[0]}</p>
                                )}
                            </div>

                            {/* Code & Sort Order */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Subcategory Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={15}
                                        value={subCategoryForm.code}
                                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. PRT, LAP"
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={subCategoryForm.sort_order}
                                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, sort_order: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Active Switch */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                                <div>
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Active Status
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Show in ticket creation and issue classification
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={subCategoryForm.is_active}
                                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeSubCategoryModal}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveSubCategoryMutation.isPending}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition shadow-sm"
                                >
                                    {saveSubCategoryMutation.isPending ? "Saving..." : subCategoryModal.subCategory ? "Update Subcategory" : "Create Subcategory"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirmation Dialog ─────────────────────────────────────────── */}
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                confirmText={confirmModal.confirmText}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            />
        </div>
    );
}

// Fallback helper to safely retrieve queryClient
function useAuthQueryClientFallback() {
    return useQueryClient();
}
