import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import Layout from './components/Common/Layout';
import './styles/global.css';

// Dashboard
import AdminDashboard from './components/Dashboard/AdminDashboard';

// Tickets
import TicketList   from './components/Tickets/TicketList';
import CreateTicket from './components/Tickets/CreateTicket';
import TicketDetail from './components/Tickets/TicketDetail';

// KareXpert
import KxDashboard    from './components/Karexpert/KarexpertDashboard';
import KxTicketList   from './components/Karexpert/KarexpertTicketList';
import KxTicketCreate from './components/Karexpert/KarexpertCreateTicket';
import KxTicketDetail from './components/Karexpert/KarexpertTicketDetail';

// Admin pages
import UsersPage       from './pages/admin/UsersPage';
import RolesPage       from './pages/admin/RolesPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import BranchesPage    from './pages/admin/BranchesPage';
import AuditLogPage    from './pages/admin/AuditLogPage';
import SettingsPage    from './pages/settings/SettingsPage';

// Assets
import AssetsPage      from './pages/assets/AssetsPage';
import AssetDetailPage from './pages/assets/AssetDetailPage';
import AssetFormPage   from './pages/assets/AssetFormPage';

// Knowledge Base
import KnowledgeBasePage from './pages/kb/KnowledgeBasePage';
import ArticleDetailPage from './pages/kb/ArticleDetailPage';
import ArticleFormPage   from './pages/kb/ArticleFormPage';

// Reports
import ReportsPage from './pages/reports/ReportsPage';

// Other
import NotFound     from './pages/NotFound';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<PrivateRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard"          element={<AdminDashboard />} />

                            {/* Tickets */}
                            <Route path="/tickets"            element={<TicketList />} />
                            <Route path="/tickets/create"     element={<CreateTicket />} />
                            <Route path="/tickets/:id"        element={<TicketDetail />} />

                            {/* KareXpert */}
                            <Route path="/karexpert"                   element={<KxDashboard />} />
                            <Route path="/karexpert/tickets"           element={<KxTicketList />} />
                            <Route path="/karexpert/tickets/create"    element={<KxTicketCreate />} />
                            <Route path="/karexpert/tickets/:id"       element={<KxTicketDetail />} />

                            {/* Admin */}
                            <Route path="/admin/users"       element={<UsersPage />} />
                            <Route path="/admin/roles"       element={<RolesPage />} />
                            <Route path="/admin/departments" element={<DepartmentsPage />} />
                            <Route path="/admin/branches"    element={<BranchesPage />} />
                            <Route path="/admin/audit-log"   element={<AuditLogPage />} />

                            {/* Assets */}
                            <Route path="/assets"            element={<AssetsPage />} />
                            <Route path="/assets/create"     element={<AssetFormPage />} />
                            <Route path="/assets/:id"        element={<AssetDetailPage />} />
                            <Route path="/assets/:id/edit"   element={<AssetFormPage />} />

                            {/* Knowledge Base */}
                            <Route path="/knowledge"         element={<KnowledgeBasePage />} />
                            <Route path="/knowledge/create"  element={<ArticleFormPage />} />
                            <Route path="/knowledge/:id"     element={<ArticleDetailPage />} />
                            <Route path="/knowledge/:id/edit" element={<ArticleFormPage />} />

                            {/* Reports */}
                            <Route path="/reports"           element={<ReportsPage />} />

                            {/* Settings */}
                            <Route path="/settings"          element={<SettingsPage />} />
                        </Route>
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
