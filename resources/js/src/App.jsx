import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login        from './components/Auth/Login';
import Layout       from './components/Common/Layout';
import Dashboard    from './components/Dashboard/AdminDashboard';
import TicketList   from './components/Tickets/TicketList';
import TicketCreate from './components/Tickets/CreateTicket';
import TicketDetail from './components/Tickets/TicketDetail';
import KxDashboard      from './components/Karexpert/KarexpertDashboard';
import KxTicketList      from './components/Karexpert/KarexpertTicketList';
import KxTicketCreate    from './components/Karexpert/KarexpertCreateTicket';
import KxTicketDetail    from './components/Karexpert/KarexpertTicketDetail';
import './styles/global.css';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<PrivateRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/dashboard"       element={<Dashboard />} />
                            <Route path="/tickets"         element={<TicketList />} />
                            <Route path="/tickets/create"  element={<TicketCreate />} />
                            <Route path="/tickets/:id"     element={<TicketDetail />} />
                            {/* KareXpert Routes */}
                            <Route path="/karexpert"               element={<KxDashboard />} />
                            <Route path="/karexpert/tickets"       element={<KxTicketList />} />
                            <Route path="/karexpert/tickets/create" element={<KxTicketCreate />} />
                            <Route path="/karexpert/tickets/:id"   element={<KxTicketDetail />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

