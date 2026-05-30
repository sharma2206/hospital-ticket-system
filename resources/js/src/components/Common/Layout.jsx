import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout() {
    const { user, logout, isStaff } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : '?';

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
                        <NavLink to="/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <span className="sidebar-link-icon">📊</span> Dashboard
                        </NavLink>
                        <NavLink to="/tickets" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <span className="sidebar-link-icon">🎫</span> All Tickets
                        </NavLink>
                        <NavLink to="/tickets/create" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <span className="sidebar-link-icon">➕</span> Raise Ticket
                        </NavLink>
                    </div>

                    {isStaff() && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-title">Management</div>
                            <NavLink to="/tickets?my_tickets=1" className="sidebar-link">
                                <span className="sidebar-link-icon">👤</span> My Assigned
                            </NavLink>
                            <NavLink to="/tickets?is_escalated=1" className="sidebar-link">
                                <span className="sidebar-link-icon">🚨</span> Escalated
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
