import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Save,
    Search,
    RefreshCw,
    Bell,
    Clock,
    Lock,
    Server,
    Sliders,
    Mail,
    FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/Shared/PageHeader";
import MetricCard from "../../components/Shared/MetricCard";
import EmptyState from "../../components/Shared/EmptyState";

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { hasPermission, isSuperAdmin, isManager } = useAuth();
    const [activeGroup, setActiveGroup] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [editedValues, setEditedValues] = useState({});
    const [savingKey, setSavingKey] = useState(null);

    // Dynamic permission check — works with Spatie permissions
    const isAdmin = isSuperAdmin() || isManager() || hasPermission("configure-settings");

    const { data: responseData, isLoading, refetch } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await api.get("/settings", { params: { flat: 1 } });
            const list = Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data?.settings)
                ? res.data.settings
                : Object.values(res.data?.data || {}).flat();
            return list;
        },
    });

    const settingsList = useMemo(() => {
        return Array.isArray(responseData) ? responseData : [];
    }, [responseData]);

    // Unique groups
    const groups = useMemo(() => {
        const set = new Set();
        settingsList.forEach((s) => {
            if (s.group) set.add(s.group);
        });
        return Array.from(set).sort();
    }, [settingsList]);

    // Filtered settings
    const filteredSettings = useMemo(() => {
        return settingsList.filter((s) => {
            const matchesGroup = activeGroup === "all" || s.group === activeGroup;
            const matchesSearch =
                !searchQuery ||
                s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.label && s.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesGroup && matchesSearch;
        });
    }, [settingsList, activeGroup, searchQuery]);

    // Update single setting mutation
    const updateSingleMutation = useMutation({
        mutationFn: async ({ key, value }) => {
            setSavingKey(key);
            return api.put(`/settings/${encodeURIComponent(key)}`, { value });
        },
        onSuccess: (_, { key }) => {
            toast.success(`Setting '${key}' saved`);
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            setSavingKey(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to update setting");
            setSavingKey(null);
        },
    });

    // Bulk save mutation
    const saveGroupMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post("/settings", { settings: payload });
        },
        onSuccess: () => {
            toast.success("Settings saved successfully");
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            setEditedValues({});
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to save settings");
        },
    });

    const handleValueChange = (key, val) => {
        setEditedValues((prev) => ({
            ...prev,
            [key]: val,
        }));
    };

    const handleSaveSingle = (setting) => {
        const val = editedValues[setting.key] !== undefined ? editedValues[setting.key] : setting.value;
        updateSingleMutation.mutate({ key: setting.key, value: val });
    };

    const handleSaveCurrentGroup = () => {
        const toSave = [];
        filteredSettings.forEach((s) => {
            if (editedValues[s.key] !== undefined) {
                toSave.push({
                    key: s.key,
                    value: editedValues[s.key],
                });
            }
        });

        if (toSave.length === 0) {
            toast("No modified settings to save in this group", { icon: "ℹ️" });
            return;
        }

        saveGroupMutation.mutate(toSave);
    };

    const getGroupIcon = (grp) => {
        switch (grp?.toLowerCase()) {
            case "security":
                return Lock;
            case "email":
            case "mail":
                return Mail;
            case "sla":
                return Clock;
            case "notifications":
                return Bell;
            case "tickets":
                return FileText;
            case "system":
            case "general":
                return Server;
            default:
                return Sliders;
        }
    };

    return (
        <div className="page-container">
            <PageHeader
                title="System Settings"
                subtitle="Configure hospital IT operations, SLA timers, notifications, and security policies"
                icon={Settings}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            title="Reload settings"
                            className="btn btn-secondary btn-sm"
                        >
                            <RefreshCw size={15} />
                            <span>Reload</span>
                        </button>
                        {isAdmin && Object.keys(editedValues).length > 0 && (
                            <button
                                onClick={handleSaveCurrentGroup}
                                disabled={saveGroupMutation.isPending}
                                className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-sm"
                            >
                                <Save size={15} />
                                <span>Save Modified ({Object.keys(editedValues).length})</span>
                            </button>
                        )}
                    </div>
                }
            />

            {/* Operational Telemetry Cards */}
            <div
                className="grid gap-3.5"
                style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
            >
                <MetricCard
                    title="Security & RBAC"
                    value="Enforced"
                    icon={ShieldCheck}
                    color="#10b981"
                    sub="Sanctum + Spatie Roles"
                />
                <MetricCard
                    title="SLA Escalation Engine"
                    value="Monitoring"
                    icon={Clock}
                    color="#0284c7"
                    sub="Active auto-escalation"
                />
                <MetricCard
                    title="System Modules"
                    value="Integrated"
                    icon={SlidersHorizontal}
                    color="#8b5cf6"
                    sub="IT Desk, Assets, KX Desk"
                />
            </div>

            {/* Toolbar: Search & Group Tabs */}
            <div className="card p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={() => setActiveGroup("all")}
                        className={`btn btn-sm ${
                            activeGroup === "all" ? "btn-primary" : "btn-secondary"
                        }`}
                    >
                        All Groups ({settingsList.length})
                    </button>
                    {groups.map((grp) => {
                        const Icon = getGroupIcon(grp);
                        const count = settingsList.filter((s) => s.group === grp).length;
                        return (
                            <button
                                key={grp}
                                onClick={() => setActiveGroup(grp)}
                                className={`btn btn-sm inline-flex items-center gap-1.5 capitalize ${
                                    activeGroup === grp ? "btn-primary" : "btn-secondary"
                                }`}
                            >
                                <Icon size={13} />
                                <span>{grp} ({count})</span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search settings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="form-control"
                    />
                </div>
            </div>

            {/* Settings Cards List */}
            <div className="card divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2" />
                        <p>Loading system configuration...</p>
                    </div>
                ) : filteredSettings.length === 0 ? (
                    <EmptyState
                        icon={SlidersHorizontal}
                        title="No settings found"
                        description={
                            searchQuery
                                ? "Try refining your search keyword."
                                : "No settings configured in this group."
                        }
                    />
                ) : (
                    filteredSettings.map((setting) => {
                        const currentValue =
                            editedValues[setting.key] !== undefined
                                ? editedValues[setting.key]
                                : setting.value ?? "";
                        const isModified =
                            editedValues[setting.key] !== undefined &&
                            editedValues[setting.key] !== setting.value;
                        const isBoolean =
                            setting.type === "boolean" ||
                            setting.value === "true" ||
                            setting.value === "false" ||
                            setting.value === true ||
                            setting.value === false;

                        return (
                            <div
                                key={setting.key}
                                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                                    isModified ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                                }`}
                            >
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                                            {setting.label || setting.key}
                                        </span>
                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                            {setting.group || "general"}
                                        </span>
                                        {setting.is_public && (
                                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 font-semibold">
                                                Public
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed font-mono">
                                        {setting.key}
                                    </p>
                                    {setting.description && (
                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                            {setting.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {isBoolean ? (
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                disabled={!isAdmin}
                                                checked={
                                                    currentValue === true ||
                                                    currentValue === "true" ||
                                                    currentValue === "1"
                                                }
                                                onChange={(e) =>
                                                    handleValueChange(
                                                        setting.key,
                                                        e.target.checked ? "true" : "false"
                                                    )
                                                }
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    ) : (
                                        <input
                                            type={setting.type === "integer" ? "number" : "text"}
                                            disabled={!isAdmin}
                                            value={currentValue}
                                            onChange={(e) =>
                                                handleValueChange(setting.key, e.target.value)
                                            }
                                            className="form-control w-56"
                                        />
                                    )}

                                    {isAdmin && (
                                        <button
                                            onClick={() => handleSaveSingle(setting)}
                                            disabled={
                                                savingKey === setting.key ||
                                                updateSingleMutation.isPending
                                            }
                                            title="Save this setting"
                                            className={`btn btn-sm ${
                                                isModified
                                                    ? "btn-primary"
                                                    : "btn-secondary text-slate-500"
                                            }`}
                                        >
                                            {savingKey === setting.key ? (
                                                <RefreshCw size={14} className="animate-spin" />
                                            ) : (
                                                <Save size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
