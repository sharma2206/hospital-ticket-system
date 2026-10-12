import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    Check,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function CreateTicket() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            source: "self_service",
            impact: "low",
            urgency: "low",
            requester_name: user ? `${user.first_name} ${user.last_name}` : "",
            requester_email: user?.email || "",
        },
    });

    const selectedCategory = watch("category_id");
    const [files, setFiles] = useState([]);

    // Reset subcategory whenever category changes
    useEffect(() => {
        setValue("sub_category_id", "");
    }, [selectedCategory, setValue]);

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
    const { data: priorities } = useQuery({
        queryKey: ["priorities"],
        queryFn: () => api.get("/priorities").then((r) => r.data),
    });
    const { data: departments } = useQuery({
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
    });

    const mutation = useMutation({
        mutationFn: (formData) =>
            api.post("/tickets", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            }),
        onSuccess: (res) => {
            toast.success("Ticket raised successfully!");
            navigate(`/tickets/${res.data.data.id}`);
        },
        onError: (err) => {
            const errs = err.response?.data?.errors;
            if (errs)
                Object.values(errs)
                    .flat()
                    .forEach((m) => toast.error(m));
        },
    });

    const onSubmit = (data) => {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v) fd.append(k, v);
        });
        files.forEach((f) => fd.append("attachments[]", f));
        mutation.mutate(fd);
    };

    return (
        <div className="ticket-form-wrap max-w-4xl mx-auto space-y-6">
            <div className="page-header">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <span>Raise IT Ticket</span>
                    </h1>
                    <p className="page-subtitle">
                        Describe your issue or technical request for IT resolution
                    </p>
                </div>
                <Link to="/tickets" className="btn btn-secondary btn-sm flex items-center gap-1.5">
                    <ArrowLeft size={15} />
                    <span>Back to tickets</span>
                </Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Issue Details */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <FileText size={18} className="text-blue-500" />
                            <span>Issue Details</span>
                        </div>
                    </div>
                    <div className="card-body space-y-4">
                        <div className="form-group">
                            <label className="form-label">Subject / Title *</label>
                            <input
                                className={`form-control ${errors.title ? "error" : ""}`}
                                placeholder="Brief summary of the issue (e.g. Printer offline in Billing counter 2)"
                                {...register("title", {
                                    required: "Title is required",
                                })}
                            />
                            {errors.title && (
                                <span className="form-error text-xs text-rose-500 mt-1">
                                    {errors.title.message}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select
                                    className={`form-control ${errors.category_id ? "error" : ""}`}
                                    {...register("category_id", {
                                        required: "Category is required",
                                    })}
                                >
                                    <option value="">Select category</option>
                                    {categories?.data?.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && (
                                    <span className="form-error text-xs text-rose-500 mt-1">
                                        {errors.category_id.message}
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label flex items-center justify-between">
                                    <span>Sub-Category</span>
                                    {isSubCategoriesLoading && (
                                        <span className="text-xs text-blue-500 font-normal flex items-center gap-1">
                                            <Loader2 size={11} className="animate-spin" /> Loading...
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
                                            ? "Loading subcategories..."
                                            : (subCategories?.data?.length || 0) === 0
                                            ? "— No subcategories available —"
                                            : "Select sub-category"}
                                    </option>
                                    {subCategories?.data?.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="form-group">
                                <label className="form-label">Priority *</label>
                                <select
                                    className={`form-control ${errors.priority_id ? "error" : ""}`}
                                    {...register("priority_id", {
                                        required: "Priority is required",
                                    })}
                                >
                                    <option value="">Select priority</option>
                                    {priorities?.data?.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.priority_id && (
                                    <span className="form-error text-xs text-rose-500 mt-1">
                                        {errors.priority_id.message}
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Impact</label>
                                <select className="form-control" {...register("impact")}>
                                    <option value="low">Low (Individual user)</option>
                                    <option value="medium">Medium (Department unit)</option>
                                    <option value="high">High (Entire department)</option>
                                    <option value="critical">Critical (Hospital-wide)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Urgency</label>
                                <select className="form-control" {...register("urgency")}>
                                    <option value="low">Low (Can wait standard SLA)</option>
                                    <option value="medium">Medium (Normal priority)</option>
                                    <option value="high">High (Work stalled)</option>
                                    <option value="critical">Critical (Patient care impacted)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <textarea
                                className={`form-control ${errors.description ? "error" : ""}`}
                                rows={4}
                                placeholder="Please provide detailed diagnostic information — what steps led to the issue, error codes, and what you were doing..."
                                {...register("description", {
                                    required: "Description is required",
                                    minLength: {
                                        value: 10,
                                        message: "Minimum 10 characters required",
                                    },
                                })}
                            />
                            {errors.description && (
                                <span className="form-error text-xs text-rose-500 mt-1">
                                    {errors.description.message}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Location & Department */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <MapPin size={18} className="text-teal-500" />
                            <span>Location & Department</span>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Department *</label>
                                <select
                                    className={`form-control ${errors.department_id ? "error" : ""}`}
                                    {...register("department_id", {
                                        required: "Department is required",
                                    })}
                                >
                                    <option value="">Select department</option>
                                    {departments?.data?.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.department_id && (
                                    <span className="form-error text-xs text-rose-500 mt-1">
                                        {errors.department_id.message}
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Branch</label>
                                <select className="form-control" {...register("branch_id")}>
                                    <option value="">Select branch</option>
                                    {branches?.data?.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Building / Block</label>
                                <input
                                    className="form-control"
                                    placeholder="e.g. Block A, OPD Wing"
                                    {...register("building")}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Floor / Room Number</label>
                                <input
                                    className="form-control"
                                    placeholder="e.g. 2nd Floor, Room 204"
                                    {...register("room_number")}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requester Info */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <User size={18} className="text-purple-500" />
                            <span>Requester Contact Information</span>
                        </div>
                    </div>
                    <div className="card-body space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Requester Name</label>
                                <input className="form-control" {...register("requester_name")} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Employee ID</label>
                                <input className="form-control" {...register("requester_employee_id")} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mobile Contact</label>
                                <input className="form-control" type="tel" {...register("requester_mobile")} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input className="form-control" type="email" {...register("requester_email")} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="form-group">
                                <label className="form-label">Request Source</label>
                                <select className="form-control" {...register("source")}>
                                    <option value="self_service">Self Service Portal</option>
                                    <option value="phone">Telephone Call</option>
                                    <option value="email">Email Support</option>
                                    <option value="walk_in">Direct Walk-In</option>
                                    <option value="whatsapp">Hospital Helpdesk Hotline</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Related Vendor (Optional)</label>
                                <select className="form-control" {...register("vendor_id")}>
                                    <option value="">None / Internal IT</option>
                                    {vendors?.data?.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title flex items-center gap-2">
                            <Paperclip size={18} className="text-amber-500" />
                            <span>File Attachments</span>
                        </div>
                    </div>
                    <div className="card-body space-y-3">
                        <input
                            type="file"
                            multiple
                            className="form-control"
                            onChange={(e) => setFiles(Array.from(e.target.files))}
                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.log"
                        />
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {files.map((f, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                    >
                                        <Paperclip size={12} />
                                        <span>{f.name}</span>
                                    </span>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Upload screenshots, system error logs, or document scans. Supported: JPG, PNG, PDF, DOC, XLS, ZIP, TXT (Max 10MB per file).
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link to="/tickets" className="btn btn-secondary">
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
                                <span>Submit Ticket</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
