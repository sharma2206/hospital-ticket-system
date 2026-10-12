import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Ticket,
    PlusCircle,
    UserCheck,
    AlertTriangle,
    Clock,
    Laptop,
    BookOpen,
    Activity,
    Layers,
    Send,
    Users,
    ShieldCheck,
    Building2,
    Hospital,
    FolderTree,
    BarChart3,
    History,
    Settings,
    Sun,
    Moon,
    LogOut,
    Bell,
    Menu,
    X,
    CheckCheck,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import GlobalSearch from './GlobalSearch';

const navItems = [
    {
        section: 'Main',
        items: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
            { to: '/tickets', icon: Ticket, label: 'All Tickets' },
            { to: '/tickets/create', icon: PlusCircle, label: 'Raise Ticket', exact: true },
        ]
    },
    {
        section: 'Management',
        staffOnly: true,
        items: [
            { to: '/tickets?my_tickets=1', icon: UserCheck, label: 'My Assigned', queryKey: 'my_tickets' },
            { to: '/tickets?is_escalated=1', icon: AlertTriangle, label: 'Escalated', queryKey: 'is_escalated' },
            { to: '/tickets?sla_breached=1', icon: Clock, label: 'SLA Breached', queryKey: 'sla_breached' },
        ]
    },
    {
        section: 'Assets & Inventory',
        staffOnly: true,
        items: [
            { to: '/assets', icon: Laptop, label: 'Assets' },
        ]
    },
    {
        section: 'Knowledge Base',
        items: [
            { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
        ]
    },
    {
        section: 'KareXpert Support',
        staffOnly: true,
        kx: true,
        items: [
            { to: '/karexpert', icon: Activity, label: 'KX Dashboard', exact: true },
            { to: '/karexpert/tickets', icon: Layers, label: 'KX Tickets' },
            { to: '/karexpert/tickets/create', icon: Send, label: 'Raise to KX', exact: true },
        ]
    },
    {
        section: 'Administration',
        managerOnly: true,
        items: [
            { to: '/admin/users', icon: Users, label: 'Users' },
            { to: '/admin/roles', icon: ShieldCheck, label: 'Roles & Permissions' },
            { to: '/admin/departments', icon: Building2, label: 'Departments' },
            { to: '/admin/branches', icon: Hospital, label: 'Branches' },
            { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
            { to: '/reports', icon: BarChart3, label: 'Reports' },
            { to: '/admin/audit-log', icon: History, label: 'Audit Log' },
            { to: '/settings', icon: Settings, label: 'Settings' },
        ]
    },
];

export default function Layout() {
    const { user, logout, isStaff, isManager, getUserRoleName } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname, location.search]);

    // Poll notifications
    const { data: notifData } = useQuery({
        queryKey: ['notifications-count'],
        queryFn: () => api.get('/notifications/unread-count').then(r => r.data),
        refetchInterval: 30000,
    });
    const unreadCount = notifData?.count || 0;

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : 'IT';

    const isLinkActive = (item) => {
        const p = location.pathname;
        const s = location.search;

        if (item.queryKey) {
            const params = new URLSearchParams(s);
            return p === '/tickets' && params.has(item.queryKey);
        }
        if (item.exact) return p === item.to;
        if (item.to === '/tickets') {
            if (p === '/tickets/create') return false;
            const params = new URLSearchParams(s);
            if (params.has('my_tickets') || params.has('is_escalated') || params.has('sla_breached')) return false;
            return p.startsWith('/tickets');
        }
        if (item.to.includes('/karexpert/tickets') && !item.exact) {
            if (p === '/karexpert/tickets/create') return false;
            return p.startsWith(item.to);
        }
        return p === item.to || p.startsWith(item.to + '/');
    };

    const breadcrumbs = location.pathname.replace(/^\//, '').split('/').map(s => {
        if (/^\d+$/.test(s)) return `#${s}`;
        return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    });

    return (
        <div className="app-layout">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close menu"
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <Hospital size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                            HIMS Support
                        </h1>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Hospital IT Service Desk
                        </span>
                    </div>
                    <button
                        type="button"
                        className="mobile-close-btn text-slate-400 hover:text-slate-600 md:hidden p-1"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(section => {
                        if (section.staffOnly && !isStaff()) return null;
                        if (section.managerOnly && !isManager()) return null;
                        return (
                            <div key={section.section} className="sidebar-section">
                                <div className={`sidebar-section-title ${section.kx ? 'kx-section' : ''}`}>
                                    {section.section}
                                </div>
                                {section.items.map(item => {
                                    const IconComponent = item.icon;
                                    const active = isLinkActive(item);
                                    return (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            className={() => `sidebar-link ${section.kx ? 'kx-sidebar-link' : ''} ${active ? 'active' : ''}`}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <span className="sidebar-link-icon">
                                                <IconComponent size={18} strokeWidth={active ? 2.2 : 1.8} />
                                            </span>
                                            <span className="truncate">{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">
                            {user?.first_name} {user?.last_name}
                        </div>
                        <div className="sidebar-user-role">{getUserRoleName()}</div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            className="sidebar-icon-btn"
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <Sun size={17} className="text-amber-400" />
                            ) : (
                                <Moon size={17} className="text-slate-600" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="sidebar-icon-btn hover:text-red-600 dark:hover:text-red-400"
                            title="Sign out"
                            aria-label="Sign out"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Topbar */}
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            type="button"
                            className="mobile-menu-btn"
                            onClick={() => setSidebarOpen(o => !o)}
                            aria-label="Open sidebar"
                        >
                            <Menu size={20} />
                        </button>
                        
                        <div className="breadcrumbs hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
                                Home
                            </Link>
                            {breadcrumbs.map((crumb, idx) => (
                                <span key={idx} className="flex items-center gap-1.5">
                                    <ChevronRight size={13} className="text-slate-300 dark:text-slate-600" />
                                    <span className={idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-slate-200 font-semibold' : ''}>
                                        {crumb || 'Dashboard'}
                                    </span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="topbar-right">
                        <GlobalSearch />
                        <NotificationBell count={unreadCount} />
                        <div className="topbar-user" title={`${user?.first_name} ${user?.last_name} (${getUserRoleName()})`}>
                            <div className="sidebar-avatar cursor-pointer" style={{ width: 34, height: 34, fontSize: '.75rem' }}>
                                {initials}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NotificationBell({ count }) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications?per_page=8').then(r => r.data),
        enabled: open,
    });

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        } catch (err) {
            console.error(err);
        }
    };

    const handleItemClick = async (notif) => {
        if (!notif.read_at) {
            try {
                await api.post(`/notifications/${notif.id}/read`);
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
            } catch (err) {
                console.error(err);
            }
        }
        setOpen(false);
        if (notif.ticket_id) {
            navigate(`/tickets/${notif.ticket_id}`);
        }
    };

    return (
        <div className="notif-bell-wrapper">
            <button
                type="button"
                className="notif-bell-btn"
                onClick={() => setOpen(o => !o)}
                title="Notifications"
                aria-label="View notifications"
            >
                <Bell size={18} className="text-slate-600 dark:text-slate-300" />
                {count > 0 && (
                    <span className="notif-badge">
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </button>

            {open && (
                <>
                    <div className="notif-overlay" onClick={() => setOpen(false)} />
                    <div className="notif-dropdown">
                        <div className="notif-header">
                            <div className="flex items-center gap-2">
                                <Bell size={16} className="text-blue-500" />
                                <span className="notif-title">Notifications</span>
                            </div>
                            {count > 0 && (
                                <button
                                    type="button"
                                    className="notif-mark-all flex items-center gap-1 text-xs"
                                    onClick={markAllRead}
                                >
                                    <CheckCheck size={14} />
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="notif-list">
                            {data?.data?.length ? (
                                data.data.map(n => (
                                    <div
                                        key={n.id}
                                        className={`notif-item ${!n.read_at ? 'unread' : ''}`}
                                        onClick={() => handleItemClick(n)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="notif-item-title flex items-center gap-1.5">
                                                {!n.read_at && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                                <span>{n.title}</span>
                                            </div>
                                            <span className="notif-item-time shrink-0">
                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="notif-item-msg">{n.message}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="notif-empty">
                                    <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                    No new notifications
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
