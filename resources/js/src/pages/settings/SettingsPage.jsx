import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Settings,
    ShieldCheck,
    SlidersHorizontal,
    Save,
    Search,
    CheckCircle2,
    RefreshCw,
    Bell,
    Clock,
    Lock,
    Server,
    Sliders,
    Layers,
    Mail,
    FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [activeGroup, setActiveGroup] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [editedValues, setEditedValues] = useState({});
    const [savingKey, setSavingKey] = useState(null);

    const isAdmin = user?.roles?.some((r) =>
        ["super_admin", "admin", "it_manager"].includes(r.name || r)
    );

    const { data: responseData, isLoading, refetch } = useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await api.get("/settings", { params: { flat: 1 } });
            // Support both flat list or object structure
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Settings className="text-cyan-600" size={24} />
                        System Settings
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure hospital IT operations, SLA timers, notifications, and security policies.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        title="Reload settings"
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        <RefreshCw size={16} />
                    </button>
                    {isAdmin && Object.keys(editedValues).length > 0 && (
                        <button
                            onClick={handleSaveCurrentGroup}
                            disabled={saveGroupMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                            <Save size={15} />
                            Save Modified ({Object.keys(editedValues).length})
                        </button>
                    )}
                </div>
            </div>

            {/* Operational Status Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-medium">Security & RBAC</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Sanctum + Role Guards
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-medium">SLA Escalation Engine</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Active & Monitoring
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                        <SlidersHorizontal size={20} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-medium">System Modules</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            IT Desk, Assets, KareXpert
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar: Search & Group Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                        onClick={() => setActiveGroup("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                            activeGroup === "all"
                                ? "bg-cyan-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition ${
                                    activeGroup === grp
                                        ? "bg-cyan-600 text-white shadow-sm"
                                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                                }`}
                            >
                                <Icon size={13} />
                                {grp} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="relative w-full md:w-64">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Search settings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </div>

            {/* Settings Cards List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <div className="animate-spin inline-block w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full mb-2" />
                        <p>Loading system configuration...</p>
                    </div>
                ) : filteredSettings.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-sm">
                        <SlidersHorizontal size={28} className="mx-auto text-slate-400 mb-2" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                            No settings found
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {searchQuery ? "Try refining your search keyword" : "No settings configured in this group."}
                        </p>
                    </div>
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
                                    isModified ? "bg-cyan-50/30 dark:bg-cyan-950/20" : ""
                                }`}
                            >
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                                            {setting.label || setting.key}
                                        </span>
                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                            {setting.group || "general"}
                                        </span>
                                        {setting.is_public && (
                                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">
                                                Public
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
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
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                                        </label>
                                    ) : (
                                        <input
                                            type={setting.type === "integer" ? "number" : "text"}
                                            disabled={!isAdmin}
                                            value={currentValue}
                                            onChange={(e) =>
                                                handleValueChange(setting.key, e.target.value)
                                            }
                                            className="w-56 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                                            className={`p-2 rounded-lg text-xs font-medium transition ${
                                                isModified
                                                    ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
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
