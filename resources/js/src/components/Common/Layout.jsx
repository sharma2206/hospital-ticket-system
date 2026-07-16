import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const navItems = [
    {
        section: 'Main',
        items: [
            { to: '/dashboard', icon: '📊', label: 'Dashboard', exact: true },
            { to: '/tickets', icon: '🎫', label: 'All Tickets' },
            { to: '/tickets/create', icon: '➕', label: 'Raise Ticket', exact: true },
        ]
    },
    {
        section: 'Management',
        staffOnly: true,
        items: [
            { to: '/tickets?my_tickets=1', icon: '👤', label: 'My Assigned', queryKey: 'my_tickets' },
            { to: '/tickets?is_escalated=1', icon: '🚨', label: 'Escalated', queryKey: 'is_escalated' },
            { to: '/tickets?sla_breached=1', icon: '⏰', label: 'SLA Breached', queryKey: 'sla_breached' },
        ]
    },
    {
        section: 'Assets & Maintenance',
        staffOnly: true,
        items: [
            { to: '/assets', icon: '🖥️', label: 'Assets' },
        ]
    },
    {
        section: 'Knowledge Base',
        items: [
            { to: '/knowledge', icon: '📚', label: 'Knowledge Base' },
        ]
    },
    {
        section: 'KareXpert',
        staffOnly: true,
        kx: true,
        items: [
            { to: '/karexpert', icon: '📋', label: 'KX Dashboard', exact: true },
            { to: '/karexpert/tickets', icon: '📝', label: 'KX Tickets' },
            { to: '/karexpert/tickets/create', icon: '📤', label: 'Raise to KX', exact: true },
        ]
    },
    {
        section: 'Administration',
        managerOnly: true,
        items: [
            { to: '/admin/users', icon: '👥', label: 'Users' },
            { to: '/admin/roles', icon: '🔐', label: 'Roles & Permissions' },
            { to: '/admin/departments', icon: '🏢', label: 'Departments' },
            { to: '/admin/branches', icon: '🏥', label: 'Branches' },
            { to: '/reports', icon: '📈', label: 'Reports' },
            { to: '/admin/audit-log', icon: '🔍', label: 'Audit Log' },
            { to: '/settings', icon: '⚙️', label: 'Settings' },
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

    const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : '?';

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

    return (
        <div className="app-layout">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🏥</div>
                    <div>
                        <h1>HIMS Support</h1>
                        <span>IT Service Desk</span>
                    </div>
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
                                {section.items.map(item => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={() => `sidebar-link ${section.kx ? 'kx-sidebar-link' : ''} ${isLinkActive(item) ? 'active' : ''}`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <span className="sidebar-link-icon">{item.icon}</span>
                                        {item.label}
                                        {item.label === 'Escalated' && unreadCount > 0 && (
                                            <span className="sidebar-link-badge">{unreadCount}</span>
                                        )}
                                    </NavLink>
                                ))}
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
                    <div style={{display:'flex', gap:'.4rem'}}>
                        <button
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            className="sidebar-link"
                            style={{padding:'.4rem', width:'auto'}}
                            title="Toggle theme"
                        >
                            <span style={{fontSize:'1rem'}}>{theme === 'dark' ? '☀️' : '🌙'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="sidebar-link"
                            style={{padding:'.4rem', width:'auto'}}
                            title="Logout"
                        >
                            <span style={{fontSize:'1rem'}}>🚪</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Topbar */}
                <div className="topbar">
                    <div className="topbar-left">
                        <button
                            className="btn btn-secondary btn-sm mobile-menu-btn"
                            onClick={() => setSidebarOpen(o => !o)}
                        >
                            ☰
                        </button>
                        <div>
                            <div className="topbar-title">
                                {location.pathname.replace('/', '').split('/').map(s =>
                                    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                                ).join(' › ') || 'Dashboard'}
                            </div>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <NotificationBell count={unreadCount} />
                        <div className="topbar-user">
                            <div className="sidebar-avatar" style={{width:32, height:32, fontSize:'.75rem'}}>{initials}</div>
                        </div>
                    </div>
                </div>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NotificationBell({ count }) {
    const [open, setOpen] = useState(false);
    const { data } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications?per_page=8').then(r => r.data),
        enabled: open,
    });

    const markAllRead = async () => {
        await api.post('/notifications/mark-all-read');
    };

    return (
        <div className="notif-bell-wrapper">
            <button className="notif-bell-btn" onClick={() => setOpen(o => !o)}>
                🔔
                {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
            </button>
            {open && (
                <>
                    <div className="notif-overlay" onClick={() => setOpen(false)} />
                    <div className="notif-dropdown">
                        <div className="notif-header">
                            <span className="notif-title">Notifications</span>
                            <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                        </div>
                        <div className="notif-list">
                            {data?.data?.length ? data.data.map(n => (
                                <div key={n.id} className={`notif-item ${!n.read_at ? 'unread' : ''}`}>
                                    <div className="notif-item-title">{n.title}</div>
                                    <div className="notif-item-msg">{n.message}</div>
                                    <div className="notif-item-time">{new Date(n.created_at).toLocaleString()}</div>
                                </div>
                            )) : (
                                <div className="notif-empty">No notifications</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
