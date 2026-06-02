import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
    const { user, logout, isStaff } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : '?';

    const isLinkActive = (path, exact = false, queryKey = null) => {
        const currentPath = location.pathname;
        const currentSearch = location.search;

        if (queryKey) {
            const params = new URLSearchParams(currentSearch);
            return currentPath === path && params.has(queryKey);
        }

        if (exact) {
            return currentPath === path;
        }

        if (path === '/tickets') {
            if (currentPath === '/tickets/create') return false;
            const params = new URLSearchParams(currentSearch);
            if (params.has('my_tickets') || params.has('is_escalated')) return false;
            return currentPath.startsWith('/tickets');
        }

        if (path === '/karexpert/tickets') {
            if (currentPath === '/karexpert/tickets/create') return false;
            return currentPath.startsWith('/karexpert/tickets');
        }

        return currentPath === path || currentPath.startsWith(path + '/');
    };

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🏥</div>
                    <div>
                        <h1>HIMS Support</h1>
                        <span>IT Ticket System</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <div className="sidebar-section-title">Main</div>
                        <NavLink to="/dashboard" className={() => `sidebar-link ${isLinkActive('/dashboard', true) ? 'active' : ''}`}>
                            <span className="sidebar-link-icon">📊</span> Dashboard
                        </NavLink>
                        <NavLink to="/tickets" className={() => `sidebar-link ${isLinkActive('/tickets') ? 'active' : ''}`}>
                            <span className="sidebar-link-icon">🎫</span> All Tickets
                        </NavLink>
                        <NavLink to="/tickets/create" className={() => `sidebar-link ${isLinkActive('/tickets/create', true) ? 'active' : ''}`}>
                            <span className="sidebar-link-icon">➕</span> Raise Ticket
                        </NavLink>
                    </div>

                    {isStaff() && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Management</div>
                            <NavLink to="/tickets?my_tickets=1" className={() => `sidebar-link ${isLinkActive('/tickets', false, 'my_tickets') ? 'active' : ''}`}>
                                <span className="sidebar-link-icon">👤</span> My Assigned
                            </NavLink>
                            <NavLink to="/tickets?is_escalated=1" className={() => `sidebar-link ${isLinkActive('/tickets', false, 'is_escalated') ? 'active' : ''}`}>
                                <span className="sidebar-link-icon">🚨</span> Escalated
                            </NavLink>
                        </div>
                    )}

                    {isStaff() && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title" style={{color:'#a78bfa'}}>KareXpert</div>
                            <NavLink to="/karexpert" end className={() => `sidebar-link kx-sidebar-link ${isLinkActive('/karexpert', true) ? 'active' : ''}`}>
                                <span className="sidebar-link-icon">📋</span> KX Dashboard
                            </NavLink>
                            <NavLink to="/karexpert/tickets" className={() => `sidebar-link kx-sidebar-link ${isLinkActive('/karexpert/tickets') ? 'active' : ''}`}>
                                <span className="sidebar-link-icon">📝</span> KX Tickets
                            </NavLink>
                            <NavLink to="/karexpert/tickets/create" className={() => `sidebar-link kx-sidebar-link ${isLinkActive('/karexpert/tickets/create', true) ? 'active' : ''}`}>
                                <span className="sidebar-link-icon">📤</span> Raise to KX
                            </NavLink>
                        </div>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || 'User'}</div>
                        <div className="sidebar-user-role">{user?.role?.replace('_', ' ') || 'User'}</div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link" style={{padding:'.4rem',width:'auto'}} title="Logout">
                        <span style={{fontSize:'1.1rem'}}>🚪</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
