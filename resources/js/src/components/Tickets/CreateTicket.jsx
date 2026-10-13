import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    FileText,
    MapPin,
    User,
    Paperclip,
    Send,
    Loader2,
    AlertCircle,
    UploadCloud,
    X,
    PlusCircle,
    Building2,
    CheckCircle2,
    ShieldCheck,
    Edit3,
    UserCheck,
    ChevronDown,
    SlidersHorizontal,
    Laptop,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../Shared/PageHeader";

export default function CreateTicket() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialAssetId = searchParams.get("asset_id") || "";
    const { user, isStaff } = useAuth();
    const isUserStaff = isStaff();

    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isOnBehalf, setIsOnBehalf] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors },
    } = useForm({
        defaultValues: {
            title: "",
            category_id: "",
            sub_category_id: "",
            priority_id: "2", // Default to Medium
            impact: "low",
            urgency: "low",
            description: "",
            department_id: "",
            branch_id: "",
            building: "",
            room_number: "",
            asset_id: initialAssetId,
            requester_name: "",
            requester_email: "",
            requester_employee_id: "",
            requester_mobile: "",
            source: "self_service",
            vendor_id: "",
        },
    });

    // Populate user defaults once authenticated user profile is available
    useEffect(() => {
        if (user) {
            const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
            setValue("requester_name", fullName);
            setValue("requester_email", user.email || "");
            if (user.employee_id) setValue("requester_employee_id", user.employee_id);
            if (user.phone) setValue("requester_mobile", user.phone);
            if (user.department_id) setValue("department_id", String(user.department_id));
            if (user.branch_id) setValue("branch_id", String(user.branch_id));
        }
    }, [user, setValue]);

    const selectedCategory = watch("category_id");
    const currentPriority = watch("priority_id");

    // Reset subcategory whenever parent category changes
    useEffect(() => {
        setValue("sub_category_id", "");
    }, [selectedCategory, setValue]);

    // Data queries
    const { data: categories, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get("/categories").then((r) => r.data),
    });

    const { data: subCategories, isLoading: isSubCategoriesLoading } = useQuery({
        queryKey: ["sub-categories", selectedCategory],
        queryFn: () =>
            api
                .get("/sub-categories", {
                    params: { category_id: selectedCategory },
                })
                .then((r) => r.data),
        enabled: !!selectedCategory,
    });

    const { data: priorities, isLoading: isPrioritiesLoading } = useQuery({
        queryKey: ["priorities"],
        queryFn: () => api.get("/priorities").then((r) => r.data),
    });

    const { data: departments, isLoading: isDepartmentsLoading } = useQuery({
        queryKey: ["departments"],
        queryFn: () => api.get("/departments").then((r) => r.data),
    });

    const { data: branches } = useQuery({
        queryKey: ["branches"],
        queryFn: () => api.get("/branches").then((r) => r.data),
    });

    const { data: vendors } = useQuery({
        queryKey: ["vendors"],
        queryFn: () => api.get("/vendors").then((r) => r.data),
        enabled: isUserStaff,
    });

    const { data: assetsList = [], isLoading: isAssetsLoading } = useQuery({
        queryKey: ["ticket-assets-picker"],
        queryFn: () => api.get("/assets", { params: { per_page: 100 } }).then((r) => r.data?.data || []),
    });

    // Auto-populate location from initial or selected asset
    const selectedAssetId = watch("asset_id");
    useEffect(() => {
        if (selectedAssetId && assetsList.length) {
            const found = assetsList.find((a) => String(a.id) === String(selectedAssetId));
            if (found) {
                if (found.department_id) setValue("department_id", String(found.department_id));
                if (found.branch_id) setValue("branch_id", String(found.branch_id));
                if (found.location && !getValues("room_number")) {
                    setValue("room_number", found.location);
                }
            }
        }
    }, [selectedAssetId, assetsList, setValue, getValues]);

    // Ticket creation mutation
    const mutation = useMutation({
        mutationFn: (formData) =>
            api.post("/tickets", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            }),
        onSuccess: (res) => {
            const ticket = res.data?.data;
            const ticketNum = ticket?.ticket_number ? `#${ticket.ticket_number}` : "";
            toast.success(`IT Ticket ${ticketNum} raised successfully!`);
            navigate(`/tickets/${ticket?.id}`);
        },
        onError: (err) => {
            const errs = err.response?.data?.errors;
            if (errs) {
                Object.values(errs)
                    .flat()
                    .forEach((m) => toast.error(m));
            } else {
                toast.error(err.response?.data?.message || "Failed to submit ticket. Please check required fields.");
            }
        },
    });

    // File handling
    const handleAppendFiles = (newFiles) => {
        const valid = [];
        newFiles.forEach((file) => {
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`"${file.name}" exceeds the 10MB size limit`);
            } else {
                valid.push(file);
            }
        });
        setFiles((prev) => [...prev, ...valid]);
    };

    const handleRemoveFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    const onSubmit = (data) => {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") {
                fd.append(k, v);
            }
        });
        files.forEach((f) => fd.append("attachments[]", f));
        mutation.mutate(fd);
    };

    // User display name & department badge
    const userDisplayName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Current User";
    const userDeptName = user?.department || "Hospital Staff";
    const userEmpId = user?.employee_id || "Staff";

    return (
        <div className="page-container max-w-5xl mx-auto w-full">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                        <Link to="/tickets" className="hover:text-blue-600 transition">
                            Tickets
                        </Link>
                        <span>/</span>
                        <span>New Request</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <PlusCircle size={22} className="text-blue-600 dark:text-blue-400" />
                        <span>Raise IT Ticket</span>
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/tickets"
                        className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                    >
                        <ArrowLeft size={14} />
                        <span>Cancel</span>
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* 2-Column Responsive Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* ── LEFT COLUMN (7 cols): The Problem & Attachments ── */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="card shadow-sm border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
                            <div className="card-header flex items-center justify-between px-4 py-3 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        Issue Information
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400">Required fields marked with *</span>
                            </div>

                            <div className="card-body p-4 sm:p-5 space-y-3.5">
                                {/* Title */}
                                <div className="form-group">
                                    <label className="form-label font-medium text-slate-700 dark:text-slate-300 text-xs">
                                        Subject / Title <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <input
                                        className={`form-control ${errors.title ? "error ring-1 ring-rose-500" : ""}`}
                                        placeholder="Brief summary (e.g. Billing Counter 2 printer offline, HIS login error)"
                                        autoFocus
                                        {...register("title", {
                                            required: "Please provide a ticket title",
                                            maxLength: {
                                                value: 255,
                                                message: "Title cannot exceed 255 characters",
                                            },
                                        })}
                                    />
                                    {errors.title && (
                                        <span className="form-error text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.title.message}
                                        </span>
                                    )}
                                </div>

                                {/* Category & Subcategory */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="form-group">
                                        <label className="form-label font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Category <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <select
                                            className={`form-control ${errors.category_id ? "error ring-1 ring-rose-500" : ""}`}
                                            {...register("category_id", {
                                                required: "Please select a category",
                                            })}
                                            disabled={isCategoriesLoading}
                                        >
                                            <option value="">
                                                {isCategoriesLoading ? "Loading..." : "Select Category..."}
                                            </option>
                                            {categories?.data?.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category_id && (
                                            <span className="form-error text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                                                <AlertCircle size={12} /> {errors.category_id.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label flex items-center justify-between font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            <span>Subcategory</span>
                                            {isSubCategoriesLoading && (
                                                <span className="text-[11px] text-blue-500 font-normal flex items-center gap-1">
                                                    <Loader2 size={10} className="animate-spin" /> Loading...
                                                </span>
                                            )}
                                        </label>
                                        <select
                                            className="form-control"
                                            {...register("sub_category_id")}
                                            disabled={!selectedCategory || isSubCategoriesLoading}
                                        >
                                            <option value="">
                                                {!selectedCategory
                                                    ? "— Select category first —"
                                                    : isSubCategoriesLoading
                                                    ? "Loading options..."
                                                    : (subCategories?.data?.length || 0) === 0
                                                    ? "— No subcategories —"
                                                    : "Select Subcategory (Optional)"}
                                            </option>
                                            {subCategories?.data?.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="form-label m-0 font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Detailed Description <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">Min 10 characters</span>
                                    </div>
                                    <textarea
                                        className={`form-control min-h-[95px] resize-y ${errors.description ? "error ring-1 ring-rose-500" : ""}`}
                                        rows={3}
                                        placeholder="Describe the issue, error codes, steps performed, or patient care impact..."
                                        {...register("description", {
                                            required: "Please describe the issue in detail",
                                            minLength: {
                                                value: 10,
                                                message: "Minimum 10 characters required",
                                            },
                                        })}
                                    />
                                    {errors.description && (
                                        <span className="form-error text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                                            <AlertCircle size={12} /> {errors.description.message}
                                        </span>
                                    )}
                                </div>

                                {/* Inline Compact Attachment Dropzone */}
                                <div className="form-group pt-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="form-label m-0 font-medium text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                                            <Paperclip size={13} className="text-slate-400" />
                                            <span>Attachments (Optional)</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">JPG, PNG, PDF, DOC, LOG (Max 10MB)</span>
                                    </div>

                                    <div
                                        className={`compact-dropzone ${isDragging ? "dragover" : ""}`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setIsDragging(true);
                                        }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setIsDragging(false);
                                            if (e.dataTransfer.files?.length) {
                                                handleAppendFiles(Array.from(e.dataTransfer.files));
                                            }
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.length) {
                                                    handleAppendFiles(Array.from(e.target.files));
                                                }
                                            }}
                                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.log"
                                        />
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                            <UploadCloud size={16} className="text-blue-500" />
                                            <span>Click to attach file or drag here</span>
                                        </div>
                                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                            Browse files
                                        </span>
                                    </div>

                                    {/* File Chips */}
                                    {files.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {files.map((f, i) => (
                                                <div key={i} className="file-chip">
                                                    <Paperclip size={11} className="text-slate-400" />
                                                    <span className="max-w-[160px] truncate" title={f.name}>
                                                        {f.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        ({formatBytes(f.size)})
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="file-chip-remove"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFile(i);
                                                        }}
                                                        title="Remove file"
                                                        aria-label="Remove file"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </div>
                                            ))}
                                            {files.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFiles([])}
                                                    className="text-[11px] text-rose-500 hover:underline px-1 self-center"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN (5 cols): Context, Location & Requester ── */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Priority Selection Card */}
                        <div className="card shadow-sm border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
                            <div className="card-header flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Ticket Priority <span className="text-rose-500 font-bold">*</span>
                                </span>
                                <span className="text-[11px] text-slate-400">Affects SLA response time</span>
                            </div>
                            <div className="card-body p-3.5">
                                {/* Segmented Priority Buttons */}
                                <div className="priority-pill-group">
                                    {[
                                        { id: "1", name: "Low", label: "24h SLA", activeClass: "active-low" },
                                        { id: "2", name: "Medium", label: "8h SLA", activeClass: "active-medium" },
                                        { id: "3", name: "High", label: "4h SLA", activeClass: "active-high" },
                                        { id: "4", name: "Critical", label: "1h SLA", activeClass: "active-critical" },
                                    ].map((p) => {
                                        const isSelected = String(currentPriority) === String(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setValue("priority_id", p.id)}
                                                className={`priority-pill-btn ${isSelected ? p.activeClass : ""}`}
                                            >
                                                <span>{p.name}</span>
                                                <span className="text-[10px] opacity-75 font-normal">{p.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <input type="hidden" {...register("priority_id", { required: true })} />
                            </div>
                        </div>

                        {/* Location & Department Card */}
                        <div className="card shadow-sm border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
                            <div className="card-header flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={15} className="text-teal-600 dark:text-teal-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Hospital Location
                                    </span>
                                </div>
                                {user?.department_id && (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                                        Auto-filled
                                    </span>
                                )}
                            </div>

                            <div className="card-body p-4 space-y-3">
                                {/* Affected IT / Clinical Device (Optional) */}
                                <div className="form-group">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="form-label m-0 font-medium text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                                            <Laptop size={13} className="text-slate-400" />
                                            <span>Affected IT / Clinical Device (Optional)</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            {isAssetsLoading ? "Loading devices..." : "Quick link device to ticket"}
                                        </span>
                                    </div>
                                    <select
                                        className="form-control"
                                        {...register("asset_id")}
                                        disabled={isAssetsLoading}
                                    >
                                        <option value="">— No specific device / General issue —</option>
                                        {assetsList.map((ast) => (
                                            <option key={ast.id} value={ast.id}>
                                                {ast.asset_code} · {ast.name} {ast.serial_number ? `(S/N: ${ast.serial_number})` : ""} {ast.department?.name ? `[${ast.department.name}]` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Department & Branch */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="form-group">
                                        <label className="form-label font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Department <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <select
                                            className={`form-control ${errors.department_id ? "error ring-1 ring-rose-500" : ""}`}
                                            {...register("department_id", {
                                                required: "Department is required",
                                            })}
                                            disabled={isDepartmentsLoading}
                                        >
                                            <option value="">
                                                {isDepartmentsLoading ? "Loading..." : "Select Department..."}
                                            </option>
                                            {departments?.data?.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} {d.code ? `(${d.code})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.department_id && (
                                            <span className="form-error text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                                                <AlertCircle size={12} /> {errors.department_id.message}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Branch / Campus
                                        </label>
                                        <select className="form-control" {...register("branch_id")}>
                                            <option value="">Main Hospital Campus</option>
                                            {branches?.data?.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Building & Room */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="form-group">
                                        <label className="form-label font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Building / Wing
                                        </label>
                                        <input
                                            className="form-control"
                                            placeholder="e.g. OPD Wing, Block A"
                                            {...register("building")}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Room / Bed Number
                                        </label>
                                        <input
                                            className="form-control"
                                            placeholder="e.g. Room 204, Bed 12"
                                            {...register("room_number")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requester Information Card */}
                        <div className="card shadow-sm border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
                            <div className="card-header flex items-center justify-between px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <User size={15} className="text-purple-600 dark:text-purple-400" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        Requester Contact
                                    </span>
                                </div>

                                {isUserStaff && (
                                    <button
                                        type="button"
                                        onClick={() => setIsOnBehalf((prev) => !prev)}
                                        className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                                    >
                                        {isOnBehalf ? "Log as Myself" : "+ On Behalf of Staff"}
                                    </button>
                                )}
                            </div>

                            <div className="card-body p-4 space-y-3">
                                {/* Regular User: Compact Verified Profile Card */}
                                {!isOnBehalf ? (
                                    <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                                    {(user?.first_name?.[0] || "U") + (user?.last_name?.[0] || "")}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                                        <span>{userDisplayName}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">
                                                            ({userEmpId})
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {userDeptName} • {user?.email || "No email"}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setIsEditingContact((prev) => !prev)}
                                                className="text-slate-400 hover:text-blue-600 p-1 rounded"
                                                title="Edit phone or alternate callback"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                        </div>

                                        {/* Optional Contact Edit Row */}
                                        {isEditingContact && (
                                            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                                                        Callback Mobile
                                                    </label>
                                                    <input
                                                        className="form-control text-xs py-1.5"
                                                        placeholder="e.g. +91 98765 43210"
                                                        {...register("requester_mobile")}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                                                        Alternate Email
                                                    </label>
                                                    <input
                                                        className="form-control text-xs py-1.5"
                                                        placeholder="e.g. staff@hospital.org"
                                                        {...register("requester_email")}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* IT Staff: "On Behalf Of" Form Inputs */
                                    <div className="space-y-3 bg-blue-50/40 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
                                        <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                            <UserCheck size={13} />
                                            <span>Logging on behalf of hospital staff member:</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            <div className="form-group">
                                                <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                    Staff Full Name *
                                                </label>
                                                <input
                                                    className="form-control text-xs py-1.5"
                                                    placeholder="e.g. Dr. Jane Smith"
                                                    {...register("requester_name", {
                                                        required: isOnBehalf ? "Requester name is required" : false,
                                                    })}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                    Employee ID
                                                </label>
                                                <input
                                                    className="form-control text-xs py-1.5"
                                                    placeholder="e.g. EMP-2034"
                                                    {...register("requester_employee_id")}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                    Mobile Contact
                                                </label>
                                                <input
                                                    className="form-control text-xs py-1.5"
                                                    type="tel"
                                                    placeholder="e.g. +91 98765 43210"
                                                    {...register("requester_mobile")}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                    Report Channel
                                                </label>
                                                <select className="form-control text-xs py-1.5" {...register("source")}>
                                                    <option value="phone">Telephone Call</option>
                                                    <option value="walk_in">Direct Walk-In</option>
                                                    <option value="whatsapp">Helpdesk WhatsApp</option>
                                                    <option value="email">Email</option>
                                                    <option value="self_service">Self Service</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Collapsible Advanced SLA & Vendor Options */}
                                <details className="group pt-1">
                                    <summary className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-between py-1">
                                        <span className="flex items-center gap-1">
                                            <SlidersHorizontal size={11} />
                                            <span>More Options (Impact, Urgency, Vendor)</span>
                                        </span>
                                        <ChevronDown
                                            size={12}
                                            className="transition-transform group-open:rotate-180"
                                        />
                                    </summary>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="form-group">
                                            <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                Impact
                                            </label>
                                            <select className="form-control text-xs py-1.5" {...register("impact")}>
                                                <option value="low">Low (Individual user)</option>
                                                <option value="medium">Medium (Department unit)</option>
                                                <option value="high">High (Entire department)</option>
                                                <option value="critical">Critical (Hospital-wide)</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                Urgency
                                            </label>
                                            <select className="form-control text-xs py-1.5" {...register("urgency")}>
                                                <option value="low">Low (Standard SLA)</option>
                                                <option value="medium">Medium (Normal priority)</option>
                                                <option value="high">High (Work stalled)</option>
                                                <option value="critical">Critical (Patient care)</option>
                                            </select>
                                        </div>

                                        {isUserStaff && (
                                            <div className="form-group sm:col-span-2">
                                                <label className="form-label text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                    Related Vendor (Optional)
                                                </label>
                                                <select
                                                    className="form-control text-xs py-1.5"
                                                    {...register("vendor_id")}
                                                >
                                                    <option value="">None / Internal IT Support</option>
                                                    {vendors?.data?.map((v) => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── STICKY / COMPACT SUBMIT BAR ── */}
                <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:px-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                        <span>Ticket routes automatically to IT on-duty team with SLA tracking.</span>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                        <Link
                            to="/tickets"
                            className="btn btn-secondary text-xs sm:text-sm px-4 py-2"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary text-xs sm:text-sm px-5 py-2 flex items-center gap-2 shadow"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Submitting Ticket...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={15} />
                                    <span>Submit IT Ticket</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
