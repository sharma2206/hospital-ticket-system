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
    AlertTriangle,
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
    Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
            const fullName =
                `${user.first_name || ""} ${user.last_name || ""}`.trim();
            setValue("requester_name", fullName);
            setValue("requester_email", user.email || "");
            if (user.employee_id)
                setValue("requester_employee_id", user.employee_id);
            if (user.phone) setValue("requester_mobile", user.phone);
            if (user.department_id)
                setValue("department_id", String(user.department_id));
            if (user.branch_id) setValue("branch_id", String(user.branch_id));
        }
    }, [user, setValue]);

    const selectedCategory = watch("category_id");
    const currentPriority = watch("priority_id");

    // Reset subcategory whenever parent category changes
    useEffect(() => {
        setValue("sub_category_id", "");
    }, [selectedCategory, setValue]);

    // Safe array helper: handles both array responses and { data: [...] } wraps
    const toArray = (val) => {
        if (Array.isArray(val)) return val;
        if (Array.isArray(val?.data)) return val.data;
        return [];
    };

    // Data queries with safe fallback
    const { data: rawCategories, isLoading: isCategoriesLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: () => api.get("/categories").then((r) => r.data?.data || r.data || []),
    });

    const { data: rawSubCategories, isLoading: isSubCategoriesLoading } = useQuery(
        {
            queryKey: ["sub-categories", selectedCategory],
            queryFn: () =>
                api
                    .get("/sub-categories", {
                        params: { category_id: selectedCategory },
                    })
                    .then((r) => r.data?.data || r.data || []),
            enabled: !!selectedCategory,
        },
    );

    const { data: rawPriorities, isLoading: isPrioritiesLoading } = useQuery({
        queryKey: ["priorities"],
        queryFn: () => api.get("/priorities").then((r) => r.data?.data || r.data || []),
    });

    const { data: rawDepartments, isLoading: isDepartmentsLoading } = useQuery({
        queryKey: ["departments"],
        queryFn: () => api.get("/departments").then((r) => r.data?.data || r.data || []),
    });

    const { data: rawBranches } = useQuery({
        queryKey: ["branches"],
        queryFn: () => api.get("/branches").then((r) => r.data?.data || r.data || []),
    });

    const { data: rawVendors } = useQuery({
        queryKey: ["vendors"],
        queryFn: () => api.get("/vendors").then((r) => r.data?.data || r.data || []),
        enabled: isUserStaff,
    });

    const { data: rawAssets = [], isLoading: isAssetsLoading } = useQuery({
        queryKey: ["ticket-assets-picker"],
        queryFn: () =>
            api
                .get("/assets", { params: { per_page: 100 } })
                .then((r) => r.data?.data || r.data || []),
    });

    const categories = toArray(rawCategories);
    const subCategories = toArray(rawSubCategories);
    const priorities = toArray(rawPriorities);
    const departments = toArray(rawDepartments);
    const branches = toArray(rawBranches);
    const vendors = toArray(rawVendors);
    const assetsList = toArray(rawAssets);

    // Auto-populate location from initial or selected asset
    const selectedAssetId = watch("asset_id");
    useEffect(() => {
        if (selectedAssetId && assetsList.length) {
            const found = assetsList.find(
                (a) => String(a.id) === String(selectedAssetId),
            );
            if (found) {
                if (found.department_id)
                    setValue("department_id", String(found.department_id));
                if (found.branch_id)
                    setValue("branch_id", String(found.branch_id));
                if (found.location && !getValues("room_number")) {
                    setValue("room_number", found.location);
                }
            }
        }
    }, [selectedAssetId, assetsList, setValue, getValues]);

    // Quick issue preset templates
    const quickPresets = [
        { label: "Printer Issue", icon: "🖨️", title: "Printer offline / not responding to print jobs", catKeyword: "Hardware", desc: "Printer is not responding to print commands. Display shows offline or paper error. Need technician assistance." },
        { label: "Network / Wi-Fi", icon: "🌐", title: "Intranet / Internet disconnected", catKeyword: "Network", desc: "Unable to access hospital internal network and internet. Network indicator shows disconnected or limited connectivity." },
        { label: "HIS Portal Error", icon: "🏥", title: "HIS portal login or patient record loading error", catKeyword: "Software", desc: "Encountering error code while loading patient charts or billing module in Hospital Information System." },
        { label: "PC Not Turning On", icon: "💻", title: "Workstation desktop CPU not powering on", catKeyword: "Hardware", desc: "Computer desktop CPU is not powering on. Power button LED does not illuminate. Power socket verified." },
        { label: "Password Reset", icon: "🔑", title: "Account login locked / password reset request", catKeyword: "Account", desc: "Unable to sign in to workstation domain account. Password expired or locked out." },
    ];

    const applyPreset = (preset) => {
        setValue("title", preset.title, { shouldValidate: true });
        if (!getValues("description")) {
            setValue("description", preset.desc, { shouldValidate: true });
        }
        if (categories.length) {
            const matchedCat = categories.find((c) =>
                c.name?.toLowerCase().includes(preset.catKeyword.toLowerCase())
            );
            if (matchedCat) {
                setValue("category_id", String(matchedCat.id), { shouldValidate: true });
            }
        }
        toast.success(`Preset "${preset.label}" applied!`, { duration: 1800 });
    };

    // Ticket creation mutation
    const mutation = useMutation({
        mutationFn: (formData) =>
            api.post("/tickets", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            }),
        onSuccess: (res) => {
            const ticket = res.data?.data;
            const ticketNum = ticket?.ticket_number
                ? `#${ticket.ticket_number}`
                : "";
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
                toast.error(
                    err.response?.data?.message ||
                        "Failed to submit ticket. Please check required fields.",
                );
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
    const userDisplayName = user
        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
        : "Current User";
    const userDeptName = user?.department || "Hospital Staff";
    const userEmpId = user?.employee_id || "Staff";

    return (
        <div className="ct-page">
            {/* ── Page Header ── */}
            <div className="ct-page-header">
                <div className="ct-page-header-left">
                    <nav className="ct-breadcrumb">
                        <Link to="/tickets">Tickets</Link>
                        <span>/</span>
                        <span>New Request</span>
                    </nav>
                    <h1 className="ct-page-title">
                        <div className="ct-page-title-icon">
                            <PlusCircle size={22} />
                        </div>
                        Raise IT Ticket
                    </h1>
                    <p className="ct-page-subtitle">
                        Fill in the details below to submit your IT support request
                    </p>
                </div>
                <Link to="/tickets" className="ct-back-btn">
                    <ArrowLeft size={16} />
                    <span>Back to Tickets</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="ct-grid">

                    {/* ═══════════════════════════════════════════════════════
                        LEFT COLUMN: Issue Information & Attachments
                        ═══════════════════════════════════════════════════════ */}
                    <div className="ct-col-main">
                        <section className="ct-section">
                            <div className="ct-section-header">
                                <div className="ct-section-icon ct-section-icon-blue">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="ct-section-title">Issue Information</h2>
                                    <p className="ct-section-desc">Describe the technical problem you are experiencing</p>
                                </div>
                                <span className="ct-hint ml-auto">Required fields marked with <span className="ct-required">*</span></span>
                            </div>

                            <div className="ct-section-body">
                                {/* Quick Presets Bar */}
                                <div className="ct-presets-bar">
                                    <span className="ct-presets-label">
                                        <Sparkles size={13} className="text-amber-500" /> Quick Presets:
                                    </span>
                                    {quickPresets.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => applyPreset(p)}
                                            className="ct-preset-chip"
                                            title={`Autofill for ${p.label}`}
                                        >
                                            <span>{p.icon}</span>
                                            <span>{p.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Subject / Title */}
                                <div className="ct-field">
                                    <label className="ct-label">
                                        Subject / Title <span className="ct-required">*</span>
                                    </label>
                                    <input
                                        className={`ct-input ${errors.title ? "ct-input-error" : ""}`}
                                        placeholder="Brief summary (e.g. Billing Counter 2 printer offline, HIS login error)"
                                        autoFocus
                                        {...register("title", {
                                            required: "Please provide a ticket title",
                                            maxLength: { value: 255, message: "Title cannot exceed 255 characters" },
                                        })}
                                    />
                                    {errors.title && (
                                        <span className="ct-error"><AlertCircle size={13} /> {errors.title.message}</span>
                                    )}
                                </div>

                                {/* Category & Subcategory */}
                                <div className="ct-field-row">
                                    <div className="ct-field">
                                        <label className="ct-label">
                                            Category <span className="ct-required">*</span>
                                        </label>
                                        <div className="ct-select-wrap">
                                            <select
                                                className={`ct-select ${errors.category_id ? "ct-input-error" : ""}`}
                                                {...register("category_id", { required: "Please select a category" })}
                                                disabled={isCategoriesLoading}
                                            >
                                                <option value="">
                                                    {isCategoriesLoading ? "Loading..." : "Select Category..."}
                                                </option>
                                                {departments && categories.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.category_id && (
                                            <span className="ct-error"><AlertCircle size={13} /> {errors.category_id.message}</span>
                                        )}
                                    </div>

                                    <div className="ct-field">
                                        <label className="ct-label ct-label-optional">
                                            <span>Subcategory</span>
                                            {isSubCategoriesLoading && (
                                                <span className="ct-loading-hint">
                                                    <Loader2 size={12} className="animate-spin" /> Loading...
                                                </span>
                                            )}
                                        </label>
                                        <div className="ct-select-wrap">
                                            <select
                                                className="ct-select"
                                                {...register("sub_category_id")}
                                                disabled={!selectedCategory || isSubCategoriesLoading}
                                            >
                                                <option value="">
                                                    {!selectedCategory
                                                        ? "— Select category first —"
                                                        : isSubCategoriesLoading
                                                          ? "Loading options..."
                                                          : subCategories.length === 0
                                                            ? "— No subcategories —"
                                                            : "Select Subcategory (Optional)"}
                                                </option>
                                                {subCategories.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="ct-field">
                                    <div className="ct-label-row">
                                        <label className="ct-label">
                                            Detailed Description <span className="ct-required">*</span>
                                        </label>
                                        <span className="ct-hint">Min 10 characters</span>
                                    </div>
                                    <textarea
                                        className={`ct-textarea ${errors.description ? "ct-input-error" : ""}`}
                                        rows={5}
                                        placeholder="Describe the issue, error codes, steps performed, or patient care impact..."
                                        {...register("description", {
                                            required: "Please describe the issue in detail",
                                            minLength: { value: 10, message: "Minimum 10 characters required" },
                                        })}
                                    />
                                    {errors.description && (
                                        <span className="ct-error"><AlertCircle size={13} /> {errors.description.message}</span>
                                    )}
                                </div>

                                {/* Attachments */}
                                <div className="ct-field">
                                    <label className="ct-label ct-label-optional">
                                        <Paperclip size={14} className="ct-label-icon" />
                                        <span>Attachments (Optional)</span>
                                        <span className="ct-optional-tag">JPG, PNG, PDF, DOC, LOG (Max 10MB)</span>
                                    </label>

                                    <div
                                        className={`ct-upload-zone ${isDragging ? "ct-upload-zone-active" : ""}`}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
                                        <div className="ct-upload-icon">
                                            <UploadCloud size={24} />
                                        </div>
                                        <div className="ct-upload-text">
                                            <span className="ct-upload-primary">Click to attach file or drag here</span>
                                            <span className="ct-upload-secondary">Browse files from your computer</span>
                                        </div>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="ct-file-list">
                                            {files.map((f, i) => (
                                                <div key={i} className="ct-file-item">
                                                    <Paperclip size={14} className="ct-file-icon" />
                                                    <span className="ct-file-name" title={f.name}>{f.name}</span>
                                                    <span className="ct-file-size">({formatBytes(f.size)})</span>
                                                    <button
                                                        type="button"
                                                        className="ct-file-remove"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
                                                        title="Remove file"
                                                        aria-label="Remove file"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {files.length > 1 && (
                                                <button type="button" onClick={() => setFiles([])} className="ct-file-clear">
                                                    Clear all files
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        RIGHT COLUMN: Priority, Location & Requester
                        ═══════════════════════════════════════════════════════ */}
                    <div className="ct-col-sidebar">

                        {/* Priority Card */}
                        <section className="ct-section">
                            <div className="ct-section-header">
                                <div className="ct-section-icon ct-section-icon-amber">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <h2 className="ct-section-title">Ticket Priority <span className="ct-required">*</span></h2>
                                    <p className="ct-section-desc">Affects SLA response time</p>
                                </div>
                            </div>

                            <div className="ct-section-body">
                                <div className="ct-priority-grid">
                                    {[
                                        { id: "1", name: "Low", sla: "24h SLA", colorClass: "ct-priority-low" },
                                        { id: "2", name: "Medium", sla: "8h SLA", colorClass: "ct-priority-medium" },
                                        { id: "3", name: "High", sla: "4h SLA", colorClass: "ct-priority-high" },
                                        { id: "4", name: "Critical", sla: "1h SLA", colorClass: "ct-priority-critical" },
                                    ].map((p) => {
                                        const isSelected = String(currentPriority) === String(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setValue("priority_id", p.id)}
                                                className={`ct-priority-card ${p.colorClass} ${isSelected ? "selected" : ""}`}
                                            >
                                                <div className="ct-priority-card-check">
                                                    {isSelected && <CheckCircle2 size={15} />}
                                                </div>
                                                <span className="ct-priority-card-name">{p.name}</span>
                                                <span className="ct-priority-card-sla">{p.sla}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <input type="hidden" {...register("priority_id", { required: true })} />
                            </div>
                        </section>

                        {/* Hospital Location Card */}
                        <section className="ct-section">
                            <div className="ct-section-header">
                                <div className="ct-section-icon ct-section-icon-teal">
                                    <MapPin size={18} />
                                </div>
                                <div>
                                    <h2 className="ct-section-title">Hospital Location</h2>
                                    <p className="ct-section-desc">Help us locate the issue quickly</p>
                                </div>
                                {user?.department_id && (
                                    <span className="ct-autofill-badge ml-auto">
                                        <CheckCircle2 size={12} /> Auto-filled
                                    </span>
                                )}
                            </div>

                            <div className="ct-section-body">
                                {/* Affected Device */}
                                <div className="ct-field">
                                    <div className="ct-label-row">
                                        <label className="ct-label ct-label-optional">
                                            <Laptop size={14} className="ct-label-icon" />
                                            <span>Affected IT / Clinical Device</span>
                                        </label>
                                        <span className="ct-hint">Quick link device</span>
                                    </div>
                                    <div className="ct-select-wrap">
                                        <select className="ct-select" {...register("asset_id")} disabled={isAssetsLoading}>
                                            <option value="">— No specific device / General issue —</option>
                                            {assetsList.map((ast) => (
                                                <option key={ast.id} value={ast.id}>
                                                    {ast.asset_code} · {ast.name}{" "}
                                                    {ast.serial_number ? `(S/N: ${ast.serial_number})` : ""}{" "}
                                                    {ast.department?.name ? `[${ast.department.name}]` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Department & Branch */}
                                <div className="ct-field-row">
                                    <div className="ct-field">
                                        <label className="ct-label">
                                            Department <span className="ct-required">*</span>
                                        </label>
                                        <div className="ct-select-wrap">
                                            <select
                                                className={`ct-select ${errors.department_id ? "ct-input-error" : ""}`}
                                                {...register("department_id", { required: "Department is required" })}
                                                disabled={isDepartmentsLoading}
                                            >
                                                <option value="">
                                                    {isDepartmentsLoading ? "Loading..." : "Select Department..."}
                                                </option>
                                                {departments.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.name} {d.code ? `(${d.code})` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.department_id && (
                                            <span className="ct-error"><AlertCircle size={13} /> {errors.department_id.message}</span>
                                        )}
                                    </div>

                                    <div className="ct-field">
                                        <label className="ct-label">Branch / Campus</label>
                                        <div className="ct-select-wrap">
                                            <select className="ct-select" {...register("branch_id")}>
                                                <option value="">Main Hospital Campus</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Building & Room */}
                                <div className="ct-field-row">
                                    <div className="ct-field">
                                        <label className="ct-label">Building / Wing</label>
                                        <input className="ct-input" placeholder="e.g. OPD Wing, Block A" {...register("building")} />
                                    </div>
                                    <div className="ct-field">
                                        <label className="ct-label">Room / Bed Number</label>
                                        <input className="ct-input" placeholder="e.g. Room 204, Bed 12" {...register("room_number")} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Requester Contact Card */}
                        <section className="ct-section">
                            <div className="ct-section-header">
                                <div className="ct-section-icon ct-section-icon-purple">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h2 className="ct-section-title">Requester Contact</h2>
                                    <p className="ct-section-desc">Reported by staff member</p>
                                </div>
                                {isUserStaff && (
                                    <button
                                        type="button"
                                        onClick={() => setIsOnBehalf((prev) => !prev)}
                                        className="ct-behalf-toggle ml-auto"
                                    >
                                        {isOnBehalf ? "Log as Myself" : "+ On Behalf of Staff"}
                                    </button>
                                )}
                            </div>

                            <div className="ct-section-body">
                                {!isOnBehalf ? (
                                    <div className="ct-requester-card">
                                        <div className="ct-requester-info">
                                            <div className="ct-requester-avatar">
                                                {(user?.first_name?.[0] || "U") + (user?.last_name?.[0] || "")}
                                            </div>
                                            <div className="ct-requester-details">
                                                <div className="ct-requester-name">
                                                    {userDisplayName}
                                                    <span className="ct-requester-emp">({userEmpId})</span>
                                                </div>
                                                <div className="ct-requester-meta">
                                                    {userDeptName} • {user?.email || "No email"}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingContact((prev) => !prev)}
                                                className="ct-edit-contact-btn"
                                                title="Edit contact info"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        </div>

                                        {isEditingContact && (
                                            <div className="ct-requester-edit">
                                                <div className="ct-field-row">
                                                    <div className="ct-field">
                                                        <label className="ct-label-sm">Callback Mobile</label>
                                                        <input
                                                            className="ct-input ct-input-sm"
                                                            placeholder="e.g. +91 98765 43210"
                                                            {...register("requester_mobile")}
                                                        />
                                                    </div>
                                                    <div className="ct-field">
                                                        <label className="ct-label-sm">Alternate Email</label>
                                                        <input
                                                            className="ct-input ct-input-sm"
                                                            placeholder="e.g. staff@hospital.org"
                                                            {...register("requester_email")}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="ct-behalf-form">
                                        <div className="ct-behalf-notice">
                                            <UserCheck size={14} />
                                            <span>Logging on behalf of hospital staff member:</span>
                                        </div>
                                        <div className="ct-field-grid-2">
                                            <div className="ct-field">
                                                <label className="ct-label-sm">Staff Full Name *</label>
                                                <input
                                                    className="ct-input ct-input-sm"
                                                    placeholder="e.g. Dr. Jane Smith"
                                                    {...register("requester_name", {
                                                        required: isOnBehalf ? "Requester name is required" : false,
                                                    })}
                                                />
                                            </div>
                                            <div className="ct-field">
                                                <label className="ct-label-sm">Employee ID</label>
                                                <input
                                                    className="ct-input ct-input-sm"
                                                    placeholder="e.g. EMP-2034"
                                                    {...register("requester_employee_id")}
                                                />
                                            </div>
                                            <div className="ct-field">
                                                <label className="ct-label-sm">Mobile Contact</label>
                                                <input
                                                    className="ct-input ct-input-sm"
                                                    type="tel"
                                                    placeholder="e.g. +91 98765 43210"
                                                    {...register("requester_mobile")}
                                                />
                                            </div>
                                            <div className="ct-field">
                                                <label className="ct-label-sm">Report Channel</label>
                                                <select className="ct-select ct-select-sm" {...register("source")}>
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
                            </div>
                        </section>

                        {/* Advanced Options Accordion */}
                        <details className="ct-advanced">
                            <summary className="ct-advanced-trigger">
                                <SlidersHorizontal size={14} />
                                <span>Advanced Options (Impact, Urgency, Vendor)</span>
                                <ChevronDown size={14} className="ct-advanced-chevron" />
                            </summary>
                            <div className="ct-advanced-body">
                                <div className="ct-field-row">
                                    <div className="ct-field">
                                        <label className="ct-label-sm">Impact</label>
                                        <select className="ct-select ct-select-sm" {...register("impact")}>
                                            <option value="low">Low (Individual user)</option>
                                            <option value="medium">Medium (Department unit)</option>
                                            <option value="high">High (Entire department)</option>
                                            <option value="critical">Critical (Hospital-wide)</option>
                                        </select>
                                    </div>
                                    <div className="ct-field">
                                        <label className="ct-label-sm">Urgency</label>
                                        <select className="ct-select ct-select-sm" {...register("urgency")}>
                                            <option value="low">Low (Standard SLA)</option>
                                            <option value="medium">Medium (Normal priority)</option>
                                            <option value="high">High (Work stalled)</option>
                                            <option value="critical">Critical (Patient care)</option>
                                        </select>
                                    </div>
                                </div>
                                {isUserStaff && (
                                    <div className="ct-field">
                                        <label className="ct-label-sm">Related Vendor (Optional)</label>
                                        <select className="ct-select ct-select-sm" {...register("vendor_id")}>
                                            <option value="">None / Internal IT Support</option>
                                            {vendors.map((v) => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </details>
                    </div>
                </div>

                {/* ═══ Sticky Submit Bar ═══ */}
                <div className="ct-submit-bar">
                    <div className="ct-submit-info">
                        <ShieldCheck size={18} />
                        <span>Ticket routes automatically to IT on-duty team with SLA tracking.</span>
                    </div>
                    <div className="ct-submit-actions">
                        <Link to="/tickets" className="ct-btn-cancel">Cancel</Link>
                        <button type="submit" className="ct-btn-submit" disabled={mutation.isPending}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
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
