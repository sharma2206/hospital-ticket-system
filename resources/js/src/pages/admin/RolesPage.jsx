import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ShieldCheck,
    Plus,
    Pencil,
    Trash2,
    Copy,
    Search,
    ChevronDown,
    ChevronUp,
    Users,
    Lock,
    Unlock,
    Check,
    X,
    Save,
    AlertTriangle,
    RefreshCw,
    CheckSquare,
    Square,
    Eye,
    Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/Shared/PageHeader";
import MetricCard from "../../components/Shared/MetricCard";
import EmptyState from "../../components/Shared/EmptyState";
import ConfirmDialog from "../../components/Shared/ConfirmDialog";
import StatusBadge from "../../components/Common/StatusBadge";

// ─── Constants ────────────────────────────────────────────────────────────────
const PROTECTED_ROLES = ["super_admin"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roleBadgeColor(roleName) {
    const map = {
        super_admin:      { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
        admin:            { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4" },
        it_manager:       { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd" },
        team_lead:        { bg: "#e0f2fe", color: "#0369a1", border: "#7dd3fc" },
        technician:       { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
        dept_coordinator: { bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
        employee:         { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
        vendor:           { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
        it_staff:         { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
    };
    return map[roleName] || { bg: "#f1f5f9", color: "#334155", border: "#cbd5e1" };
}

function formatRoleName(name) {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Permission Matrix Component ──────────────────────────────────────────────
function PermissionMatrix({ role, groups, onSave, onCancel, isSaving }) {
    const [selected, setSelected] = useState(
        () => new Set(role.permissions?.map((p) => p.id) ?? [])
    );
    const [permSearch, setPermSearch] = useState("");
    const [dirty, setDirty] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState(() => {
        const init = {};
        groups.forEach((g) => (init[g.group] = true));
        return init;
    });

    const toggle = useCallback((id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
        setDirty(true);
    }, []);

    const toggleGroup = useCallback((groupPerms, checked) => {
        setSelected((prev) => {
            const next = new Set(prev);
            groupPerms.forEach((p) => (checked ? next.add(p.id) : next.delete(p.id)));
            return next;
        });
        setDirty(true);
    }, []);

    const filteredGroups = useMemo(() => {
        if (!permSearch.trim()) return groups;
        const q = permSearch.toLowerCase();
        return groups
            .map((g) => ({
                ...g,
                permissions: g.permissions.filter((p) => p.name.toLowerCase().includes(q)),
            }))
            .filter((g) => g.permissions.length > 0);
    }, [groups, permSearch]);

    const handleSave = () => {
        if (!dirty) {
            toast("No changes to save", { icon: "ℹ️" });
            return;
        }
        onSave(Array.from(selected));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Toolbar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ position: "relative", flex: "1", minWidth: 200 }}>
                    <Search
                        size={14}
                        style={{
                            position: "absolute",
                            left: "0.65rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)",
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search permissions…"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        style={{
                            width: "100%",
                            paddingLeft: "2rem",
                            paddingRight: "0.75rem",
                            paddingTop: "0.45rem",
                            paddingBottom: "0.45rem",
                            fontSize: "0.8rem",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--bg)",
                            color: "var(--text)",
                            outline: "none",
                        }}
                    />
                </div>
                <div
                    style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {selected.size} permission{selected.size !== 1 ? "s" : ""} selected
                    {dirty && (
                        <span
                            style={{
                                marginLeft: "0.5rem",
                                color: "#f59e0b",
                                fontWeight: 600,
                            }}
                        >
                            • Unsaved
                        </span>
                    )}
                </div>
            </div>

            {/* Group Sections */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {filteredGroups.map((group) => {
                    const groupIds = group.permissions.map((p) => p.id);
                    const allChecked = groupIds.every((id) => selected.has(id));
                    const someChecked = groupIds.some((id) => selected.has(id));
                    const isExpanded = expandedGroups[group.group] ?? true;

                    return (
                        <div
                            key={group.group}
                            style={{
                                border: "1px solid var(--border)",
                                borderRadius: 10,
                                overflow: "hidden",
                                background: "var(--bg-card)",
                            }}
                        >
                            {/* Group Header */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "0.65rem 1rem",
                                    background: allChecked
                                        ? "rgba(16, 185, 129, 0.08)"
                                        : someChecked
                                        ? "rgba(59, 130, 246, 0.06)"
                                        : "var(--bg)",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    borderBottom: isExpanded ? "1px solid var(--border)" : "none",
                                }}
                                onClick={() =>
                                    setExpandedGroups((prev) => ({
                                        ...prev,
                                        [group.group]: !prev[group.group],
                                    }))
                                }
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.6rem",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleGroup(group.permissions, !allChecked);
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            color: allChecked
                                                ? "#10b981"
                                                : someChecked
                                                ? "#3b82f6"
                                                : "var(--text-muted)",
                                            padding: 0,
                                        }}
                                        title={allChecked ? "Deselect all" : "Select all"}
                                    >
                                        {allChecked ? (
                                            <CheckSquare size={16} />
                                        ) : someChecked ? (
                                            <CheckSquare
                                                size={16}
                                                style={{ opacity: 0.5 }}
                                            />
                                        ) : (
                                            <Square size={16} />
                                        )}
                                    </button>
                                    <span
                                        style={{
                                            fontWeight: 600,
                                            fontSize: "0.82rem",
                                            color: "var(--text)",
                                        }}
                                    >
                                        {group.group}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "0.7rem",
                                            color: "var(--text-muted)",
                                            background: "var(--bg)",
                                            padding: "0.1rem 0.45rem",
                                            borderRadius: 9999,
                                            border: "1px solid var(--border)",
                                        }}
                                    >
                                        {groupIds.filter((id) => selected.has(id)).length}/
                                        {group.permissions.length}
                                    </span>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp size={15} color="var(--text-muted)" />
                                ) : (
                                    <ChevronDown size={15} color="var(--text-muted)" />
                                )}
                            </div>

                            {/* Permission Checkboxes */}
                            {isExpanded && (
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fill, minmax(200px, 1fr))",
                                        gap: "0.3rem",
                                        padding: "0.75rem 1rem",
                                    }}
                                >
                                    {group.permissions.map((perm) => {
                                        const isChecked = selected.has(perm.id);
                                        return (
                                            <label
                                                key={perm.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    cursor: "pointer",
                                                    padding: "0.35rem 0.5rem",
                                                    borderRadius: 7,
                                                    background: isChecked
                                                        ? "rgba(16,185,129,0.07)"
                                                        : "transparent",
                                                    border: `1px solid ${isChecked ? "rgba(16,185,129,0.3)" : "transparent"}`,
                                                    transition: "background 0.15s",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggle(perm.id)}
                                                    style={{ width: 14, height: 14, cursor: "pointer" }}
                                                />
                                                <span
                                                    style={{
                                                        fontSize: "0.78rem",
                                                        fontFamily: "monospace",
                                                        color: isChecked
                                                            ? "#059669"
                                                            : "var(--text-muted)",
                                                        fontWeight: isChecked ? 600 : 400,
                                                    }}
                                                >
                                                    {perm.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--border)",
                    marginTop: "0.25rem",
                }}
            >
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    style={{
                        padding: "0.5rem 1.2rem",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg)",
                        color: "var(--text)",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        fontWeight: 500,
                    }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.5rem 1.4rem",
                        borderRadius: 8,
                        border: "none",
                        background: dirty ? "#2563eb" : "#64748b",
                        color: "#fff",
                        fontSize: "0.82rem",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        opacity: isSaving ? 0.7 : 1,
                    }}
                >
                    {isSaving ? (
                        <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                        <Save size={14} />
                    )}
                    {isSaving ? "Saving…" : "Save Permissions"}
                </button>
            </div>
        </div>
    );
}

// ─── Role Form Modal ──────────────────────────────────────────────────────────
function RoleFormModal({ role, onClose, onSuccess }) {
    const [name, setName] = useState(role?.name ?? "");
    const [error, setError] = useState("");
    const isEdit = Boolean(role);
    const isProtected = isEdit && PROTECTED_ROLES.includes(role.name);

    const mutation = useMutation({
        mutationFn: (payload) =>
            isEdit
                ? api.put(`/roles/${role.id}`, payload)
                : api.post("/roles", payload),
        onSuccess: (res) => {
            toast.success(isEdit ? "Role updated" : "Role created");
            onSuccess(res.data.data);
        },
        onError: (err) => {
            const msg =
                err.response?.data?.errors?.name?.[0] ||
                err.response?.data?.message ||
                "Failed to save role";
            setError(msg);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (!name.trim()) {
            setError("Role name is required");
            return;
        }
        mutation.mutate({ name: name.trim() });
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "var(--bg-card)",
                    borderRadius: 14,
                    padding: "1.75rem",
                    width: "100%",
                    maxWidth: 440,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    border: "1px solid var(--border)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontWeight: 700,
                            fontSize: "1.05rem",
                            color: "var(--text)",
                        }}
                    >
                        <ShieldCheck size={18} color="#2563eb" />
                        {isEdit ? "Edit Role" : "Create New Role"}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            padding: "0.25rem",
                            borderRadius: 6,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                marginBottom: "0.4rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Role Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isProtected}
                            placeholder="e.g. security_auditor"
                            style={{
                                width: "100%",
                                padding: "0.65rem 0.9rem",
                                borderRadius: 9,
                                border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
                                background: isProtected ? "var(--bg)" : "var(--bg-card)",
                                color: "var(--text)",
                                fontSize: "0.88rem",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            autoFocus={!isProtected}
                        />
                        {isProtected && (
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#f59e0b",
                                    marginTop: "0.4rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                }}
                            >
                                <Lock size={12} />
                                This role name is protected and cannot be changed.
                            </p>
                        )}
                        {error && (
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#ef4444",
                                    marginTop: "0.4rem",
                                }}
                            >
                                {error}
                            </p>
                        )}
                    </div>

                    <div
                        style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "0.6rem 0.8rem",
                            marginBottom: "1.25rem",
                            display: "flex",
                            gap: "0.4rem",
                            alignItems: "flex-start",
                        }}
                    >
                        <Info size={13} style={{ marginTop: 1, flexShrink: 0, color: "#3b82f6" }} />
                        <span>
                            Use lowercase letters, numbers, and underscores (e.g.{" "}
                            <code>billing_manager</code>). Permissions are assigned
                            separately after creation.
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "0.6rem",
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: "0.55rem 1.1rem",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                                background: "var(--bg)",
                                color: "var(--text)",
                                fontSize: "0.83rem",
                                cursor: "pointer",
                                fontWeight: 500,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending || isProtected}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                                padding: "0.55rem 1.3rem",
                                borderRadius: 8,
                                border: "none",
                                background: "#2563eb",
                                color: "#fff",
                                fontSize: "0.83rem",
                                cursor: mutation.isPending ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                opacity: mutation.isPending ? 0.7 : 1,
                            }}
                        >
                            {mutation.isPending ? (
                                <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                            ) : (
                                <Save size={14} />
                            )}
                            {isEdit ? "Update Role" : "Create Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ role, onConfirm, onCancel, isDeleting }) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1100,
                background: "rgba(0,0,0,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
        >
            <div
                style={{
                    background: "var(--bg-card)",
                    borderRadius: 14,
                    padding: "1.75rem",
                    width: "100%",
                    maxWidth: 400,
                    border: "1px solid var(--border)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        marginBottom: "1rem",
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "rgba(239,68,68,0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <AlertTriangle size={20} color="#ef4444" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)" }}>
                            Delete Role
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            This action cannot be undone
                        </div>
                    </div>
                </div>

                <p
                    style={{
                        fontSize: "0.85rem",
                        color: "var(--text)",
                        marginBottom: "0.5rem",
                        lineHeight: 1.6,
                    }}
                >
                    Are you sure you want to delete the role{" "}
                    <strong>"{formatRoleName(role.name)}"</strong>?{" "}
                    {role.users_count > 0 && (
                        <span style={{ color: "#f59e0b" }}>
                            ⚠️ {role.users_count} user
                            {role.users_count !== 1 ? "s" : ""} will lose this role.
                        </span>
                    )}
                </p>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "0.6rem",
                        marginTop: "1.25rem",
                    }}
                >
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        style={{
                            padding: "0.55rem 1.1rem",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: "var(--bg)",
                            color: "var(--text)",
                            fontSize: "0.83rem",
                            cursor: "pointer",
                            fontWeight: 500,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.55rem 1.3rem",
                            borderRadius: 8,
                            border: "none",
                            background: "#ef4444",
                            color: "#fff",
                            fontSize: "0.83rem",
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            opacity: isDeleting ? 0.7 : 1,
                        }}
                    >
                        {isDeleting ? (
                            <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                            <Trash2 size={14} />
                        )}
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Duplicate Role Modal ─────────────────────────────────────────────────────
function DuplicateModal({ role, onClose, onSuccess }) {
    const [name, setName] = useState(`${role.name}_copy`);
    const [error, setError] = useState("");

    const mutation = useMutation({
        mutationFn: (payload) => api.post(`/roles/${role.id}/duplicate`, payload),
        onSuccess: (res) => {
            toast.success("Role duplicated");
            onSuccess(res.data.data);
        },
        onError: (err) => {
            setError(
                err.response?.data?.errors?.name?.[0] ||
                    err.response?.data?.message ||
                    "Failed to duplicate role"
            );
        },
    });

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    background: "var(--bg-card)",
                    borderRadius: 14,
                    padding: "1.75rem",
                    width: "100%",
                    maxWidth: 420,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    border: "1px solid var(--border)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1.25rem",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontWeight: 700,
                            fontSize: "1rem",
                        }}
                    >
                        <Copy size={16} color="#7c3aed" />
                        Duplicate "{formatRoleName(role.name)}"
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        <X size={18} />
                    </button>
                </div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
                    New Role Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "0.65rem 0.9rem",
                        borderRadius: 9,
                        border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
                        background: "var(--bg-card)",
                        color: "var(--text)",
                        fontSize: "0.88rem",
                        outline: "none",
                        boxSizing: "border-box",
                        marginBottom: "0.4rem",
                    }}
                    autoFocus
                />
                {error && <p style={{ fontSize: "0.75rem", color: "#ef4444", marginBottom: "0.5rem" }}>{error}</p>}
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                    All permissions from "{role.name}" will be copied to the new role.
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                    <button onClick={onClose} style={{ padding: "0.55rem 1.1rem", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "0.83rem", cursor: "pointer" }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => { setError(""); if (name.trim()) mutation.mutate({ name: name.trim() }); else setError("Name is required"); }}
                        disabled={mutation.isPending}
                        style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.3rem", borderRadius: 8, border: "none", background: "#7c3aed", color: "#fff", fontSize: "0.83rem", cursor: "pointer", fontWeight: 600 }}
                    >
                        {mutation.isPending ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Copy size={14} />}
                        Duplicate
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main RolesPage ───────────────────────────────────────────────────────────
export default function RolesPage() {
    const qc = useQueryClient();
    const { isSuperAdmin, isManager } = useAuth();
    const canManage = isSuperAdmin() || isManager();

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState("asc");
    const [selectedRole, setSelectedRole] = useState(null);
    const [showPermMatrix, setShowPermMatrix] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [deleteRole, setDeleteRole] = useState(null);
    const [duplicateRole, setDuplicateRole] = useState(null);

    // ── Fetch roles ─────────────────────────────────────────────────────────
    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ["roles-full", sortBy, sortDir],
        queryFn: () =>
            api.get("/roles", { params: { sort_by: sortBy, sort_dir: sortDir } })
               .then((r) => r.data.data ?? []),
    });

    // ── Fetch permissions (grouped) ─────────────────────────────────────────
    const { data: permissionsData } = useQuery({
        queryKey: ["permissions-grouped"],
        queryFn: () => api.get("/roles/permissions").then((r) => r.data),
    });

    const permGroups = permissionsData?.groups ?? [];

    // ── Filtered roles ──────────────────────────────────────────────────────
    const filteredRoles = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rolesData ?? [];
        return (rolesData ?? []).filter((r) => r.name.toLowerCase().includes(q));
    }, [rolesData, search]);

    // ── Sync permissions mutation ────────────────────────────────────────────
    const syncPermMutation = useMutation({
        mutationFn: ({ roleId, permissions }) =>
            api.post(`/roles/${roleId}/permissions`, { permissions }),
        onSuccess: (res) => {
            toast.success("Permissions saved successfully");
            qc.invalidateQueries({ queryKey: ["roles-full"] });
            if (selectedRole?.id === res.data.data?.id) {
                setSelectedRole(res.data.data);
            }
            setShowPermMatrix(false);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to save permissions");
        },
    });

    // ── Delete mutation ──────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (roleId) => api.delete(`/roles/${roleId}`),
        onSuccess: (_, roleId) => {
            toast.success("Role deleted");
            qc.invalidateQueries({ queryKey: ["roles-full"] });
            if (selectedRole?.id === roleId) {
                setSelectedRole(null);
                setShowPermMatrix(false);
            }
            setDeleteRole(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to delete role");
            setDeleteRole(null);
        },
    });

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDir("asc");
        }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return null;
        return sortDir === "asc" ? (
            <ChevronUp size={12} style={{ display: "inline", marginLeft: 3 }} />
        ) : (
            <ChevronDown size={12} style={{ display: "inline", marginLeft: 3 }} />
        );
    };

    // ─ Stats cards ──────────────────────────────────────────────────────────
    const totalUsers = (rolesData ?? []).reduce((s, r) => s + (r.users_count ?? 0), 0);
    const totalPerms = (rolesData ?? []).reduce((s, r) => s + (r.permissions?.length ?? 0), 0);

    return (
        <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div className="page-container">
                <PageHeader
                    title="Roles & Permissions"
                    subtitle="Create, edit, and assign permissions to roles dynamically"
                    icon={ShieldCheck}
                    actions={
                        canManage && (
                            <button
                                id="btn-create-role"
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <Plus size={16} />
                                <span>Create Role</span>
                            </button>
                        )
                    }
                />

                {/* ── Stats Row ────────────────────────────────────────────── */}
                <div
                    className="grid gap-3.5"
                    style={{
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    }}
                >
                    <MetricCard
                        title="Total Roles"
                        value={rolesData?.length ?? 0}
                        color="#2563eb"
                        icon={ShieldCheck}
                        sub="Configured security roles"
                    />
                    <MetricCard
                        title="Total Users"
                        value={totalUsers}
                        color="#7c3aed"
                        icon={Users}
                        sub="Assigned staff members"
                    />
                    <MetricCard
                        title="Permissions In Use"
                        value={totalPerms}
                        color="#059669"
                        icon={Lock}
                        sub="Active permission grants"
                    />
                </div>

                {/* ── Main layout: roles list + permission matrix ───────── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: showPermMatrix ? "1fr 1.4fr" : "1fr",
                        gap: "1rem",
                        alignItems: "start",
                    }}
                >
                    {/* ── Roles Table ──────────────────────────────────────── */}
                    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                        {/* Table toolbar */}
                        <div
                            style={{
                                padding: "1rem 1rem 0.75rem",
                                borderBottom: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                                <Search
                                    size={14}
                                    style={{
                                        position: "absolute",
                                        left: "0.65rem",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "var(--text-muted)",
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search roles…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        width: "100%",
                                        paddingLeft: "2rem",
                                        paddingRight: "0.75rem",
                                        paddingTop: "0.45rem",
                                        paddingBottom: "0.45rem",
                                        fontSize: "0.82rem",
                                        borderRadius: 8,
                                        border: "1px solid var(--border)",
                                        background: "var(--bg)",
                                        color: "var(--text)",
                                        outline: "none",
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => qc.invalidateQueries({ queryKey: ["roles-full"] })}
                                title="Refresh"
                                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "0.4rem", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="table-wrapper" style={{ overflowX: "auto" }}>
                            <table className="table" style={{ width: "100%" }}>
                                <thead>
                                    <tr>
                                        <th
                                            style={{ cursor: "pointer", userSelect: "none" }}
                                            onClick={() => handleSort("name")}
                                        >
                                            Role <SortIcon field="name" />
                                        </th>
                                        <th
                                            style={{ cursor: "pointer", userSelect: "none" }}
                                            onClick={() => handleSort("users_count")}
                                        >
                                            Users <SortIcon field="users_count" />
                                        </th>
                                        <th>Permissions</th>
                                        {canManage && <th style={{ width: 130 }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rolesLoading ? (
                                        Array(5)
                                            .fill(0)
                                            .map((_, i) => (
                                                <tr key={i}>
                                                    {[140, 50, 80, 100].map((w, j) => (
                                                        <td key={j}>
                                                            <div
                                                                className="skeleton skeleton-text"
                                                                style={{ width: w, height: 14 }}
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                    ) : filteredRoles.length === 0 ? (
                                        <tr>
                                            <td colSpan={canManage ? 4 : 3} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                                                <ShieldCheck size={28} style={{ margin: "0 auto 0.5rem", display: "block", opacity: 0.3 }} />
                                                No roles found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRoles.map((role) => {
                                            const colors = roleBadgeColor(role.name);
                                            const isSelected = selectedRole?.id === role.id && showPermMatrix;
                                            const isProtected = PROTECTED_ROLES.includes(role.name);
                                            return (
                                                <tr
                                                    key={role.id}
                                                    style={{
                                                        background: isSelected
                                                            ? "rgba(37,99,235,0.07)"
                                                            : undefined,
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => {
                                                        setSelectedRole(role);
                                                        setShowPermMatrix(true);
                                                    }}
                                                >
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <span
                                                                style={{
                                                                    display: "inline-block",
                                                                    padding: "0.2rem 0.65rem",
                                                                    borderRadius: 9999,
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 700,
                                                                    background: colors.bg,
                                                                    color: colors.color,
                                                                    border: `1px solid ${colors.border}`,
                                                                    fontFamily: "monospace",
                                                                    letterSpacing: "0.03em",
                                                                }}
                                                            >
                                                                {role.name}
                                                            </span>
                                                            {isProtected && (
                                                                <Lock size={11} color="#f59e0b" title="Protected role" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem" }}>
                                                            <Users size={12} color="var(--text-muted)" />
                                                            {role.users_count ?? 0}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            style={{
                                                                fontSize: "0.78rem",
                                                                color: "#2563eb",
                                                                background: "#dbeafe",
                                                                borderRadius: 9999,
                                                                padding: "0.15rem 0.6rem",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {role.permissions?.length ?? 0}
                                                        </span>
                                                    </td>
                                                    {canManage && (
                                                        <td onClick={(e) => e.stopPropagation()}>
                                                            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "nowrap" }}>
                                                                <button
                                                                    id={`btn-edit-role-${role.id}`}
                                                                    title="Edit role name"
                                                                    onClick={() => setEditRole(role)}
                                                                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.5rem", cursor: "pointer", color: "var(--text-muted)" }}
                                                                >
                                                                    <Pencil size={13} />
                                                                </button>
                                                                <button
                                                                    id={`btn-perms-role-${role.id}`}
                                                                    title="Manage permissions"
                                                                    onClick={() => { setSelectedRole(role); setShowPermMatrix(true); }}
                                                                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#2563eb" }}
                                                                >
                                                                    <Lock size={13} />
                                                                </button>
                                                                <button
                                                                    id={`btn-dup-role-${role.id}`}
                                                                    title="Duplicate role"
                                                                    onClick={() => setDuplicateRole(role)}
                                                                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#7c3aed" }}
                                                                >
                                                                    <Copy size={13} />
                                                                </button>
                                                                {!isProtected && (
                                                                    <button
                                                                        id={`btn-del-role-${role.id}`}
                                                                        title="Delete role"
                                                                        onClick={() => setDeleteRole(role)}
                                                                        style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "0.3rem 0.5rem", cursor: "pointer", color: "#ef4444" }}
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Permission Matrix Panel ──────────────────────────── */}
                    {showPermMatrix && selectedRole && (
                        <div className="card" style={{ padding: "1.25rem" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "1rem",
                                    flexWrap: "wrap",
                                    gap: "0.5rem",
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Lock size={15} color="#2563eb" />
                                        Permissions:{" "}
                                        <span
                                            style={{
                                                ...roleBadgeColor(selectedRole.name),
                                                padding: "0.15rem 0.6rem",
                                                borderRadius: 9999,
                                                fontSize: "0.78rem",
                                                fontFamily: "monospace",
                                                border: `1px solid ${roleBadgeColor(selectedRole.name).border}`,
                                            }}
                                        >
                                            {selectedRole.name}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                        {selectedRole.users_count ?? 0} user{selectedRole.users_count !== 1 ? "s" : ""} affected
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowPermMatrix(false); setSelectedRole(null); }}
                                    style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "0.3rem 0.5rem", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {canManage ? (
                                permGroups.length > 0 ? (
                                    <PermissionMatrix
                                        key={selectedRole.id}
                                        role={selectedRole}
                                        groups={permGroups}
                                        isSaving={syncPermMutation.isPending}
                                        onSave={(permIds) =>
                                            syncPermMutation.mutate({
                                                roleId: selectedRole.id,
                                                permissions: permIds,
                                            })
                                        }
                                        onCancel={() => { setShowPermMatrix(false); setSelectedRole(null); }}
                                    />
                                ) : (
                                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                                        <RefreshCw size={22} style={{ margin: "0 auto 0.5rem", display: "block", animation: "spin 1s linear infinite" }} />
                                        Loading permissions…
                                    </div>
                                )
                            ) : (
                                /* Read-only view for non-managers */
                                <div>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                                        <Eye size={13} style={{ display: "inline", marginRight: 4 }} />
                                        View-only — you do not have permission to edit roles.
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                        {selectedRole.permissions?.map((p) => (
                                            <span
                                                key={p.id}
                                                style={{
                                                    padding: "0.2rem 0.65rem",
                                                    borderRadius: 9999,
                                                    fontSize: "0.73rem",
                                                    fontFamily: "monospace",
                                                    background: "#ecfeff",
                                                    color: "#0f766e",
                                                    border: "1px solid #99f6e4",
                                                }}
                                            >
                                                {p.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Permission Reference Legend ───────────────────────── */}
                <div className="card" style={{ padding: "1.25rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                        <Info size={15} color="#3b82f6" />
                        Permission Reference
                    </div>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: "0.5rem",
                        }}
                    >
                        {(permissionsData?.data ?? []).map((p) => (
                            <div
                                key={p.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "0.35rem 0.6rem",
                                    borderRadius: 7,
                                    border: "1px solid var(--border)",
                                    fontSize: "0.75rem",
                                    fontFamily: "monospace",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <Check size={11} color="#10b981" style={{ flexShrink: 0 }} />
                                {p.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Modals ────────────────────────────────────────────────── */}
            {(showCreateModal || editRole) && (
                <RoleFormModal
                    role={editRole}
                    onClose={() => { setShowCreateModal(false); setEditRole(null); }}
                    onSuccess={() => {
                        qc.invalidateQueries({ queryKey: ["roles-full"] });
                        setShowCreateModal(false);
                        setEditRole(null);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={!!deleteRole}
                title="Delete Role"
                message={`Are you sure you want to delete the role "${formatRoleName(deleteRole?.name || '')}"? ${deleteRole?.users_count > 0 ? `⚠️ ${deleteRole.users_count} user(s) will lose this role.` : 'This action cannot be undone.'}`}
                confirmText="Delete Role"
                variant="danger"
                isLoading={deleteMutation.isPending}
                onConfirm={() => deleteMutation.mutate(deleteRole.id)}
                onCancel={() => setDeleteRole(null)}
            />

            {duplicateRole && (
                <DuplicateModal
                    role={duplicateRole}
                    onClose={() => setDuplicateRole(null)}
                    onSuccess={() => {
                        qc.invalidateQueries({ queryKey: ["roles-full"] });
                        setDuplicateRole(null);
                    }}
                />
            )}
        </>
    );
}
