import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

export default function TicketList() {
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({});
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        priority: searchParams.get('priority') || '',
        department: searchParams.get('department') || '',
        search: '',
        is_escalated: searchParams.get('is_escalated') || '',
        my_tickets: searchParams.get('my_tickets') || '',
        page: 1,
    });

    useEffect(() => {
        api.get('/departments').then(res => setDepartments(res.data.data || [])).catch(() => {});
    }, []);

    const fetchTickets = () => {
        setLoading(true);
        const params = {};
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
        api.get('/tickets', { params })
            .then(res => {
                setTickets(res.data.data || []);
                setPagination(res.data.pagination || {});
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchTickets(); }, [filters]);

    const setFilter = (key, value) => setFilters(f => ({...f, [key]: value, page: 1}));

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        {filters.my_tickets ? 'My Assigned Tickets' : filters.is_escalated ? 'Escalated Tickets' : 'All Tickets'}
                    </h1>
                    <p className="page-subtitle">{pagination.total || 0} tickets found</p>
                </div>
                <Link to="/tickets/create" className="btn btn-primary">➕ Raise Ticket</Link>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input type="text" className="search-input" placeholder="Search tickets..."
                        value={filters.search}
                        onChange={e => setFilter('search', e.target.value)} />
                </div>
                <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>
                <select className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <select className="filter-select" value={filters.department} onChange={e => setFilter('department', e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
                {(filters.status || filters.priority || filters.department || filters.search) && (
                    <button className="btn btn-secondary btn-sm"
                        onClick={() => setFilters({status:'',priority:'',department:'',search:'',is_escalated:'',my_tickets:'',page:1})}>
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-screen" style={{minHeight:200}}><div className="spinner" /></div>
                    ) : tickets.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎫</div>
                            <div className="empty-state-title">No tickets found</div>
                            <p style={{color:'var(--text-muted)',fontSize:'.85rem'}}>Try adjusting your filters or create a new ticket</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket #</th>
                                    <th>Title</th>
                                    <th>Department</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assigned To</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td><Link to={`/tickets/${t.id}`} className="table-link">{t.ticket_number}</Link></td>
                                        <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</td>
                                        <td>{t.department?.name || '—'}</td>
                                        <td><span style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{t.category?.name || '—'}</span></td>
                                        <td><span className={`badge badge-${t.priority?.name || 'medium'}`}>{t.priority?.name || '—'}</span></td>
                                        <td>
                                            <span className={`badge badge-${t.status?.name || 'open'}`}>
                                                <span className={`badge-dot badge-dot-${t.status?.name || 'open'}`}></span>
                                                {(t.status?.name || 'open').replace('_',' ')}
                                            </span>
                                        </td>
                                        <td>{t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name}` : <span style={{color:'var(--text-light)'}}>Unassigned</span>}</td>
                                        <td style={{whiteSpace:'nowrap',fontSize:'.8rem',color:'var(--text-muted)'}}>
                                            {new Date(t.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div className="pagination" style={{padding:'1rem 1.25rem', borderTop:'1px solid var(--border)'}}>
                        <div className="pagination-info">
                            Showing {pagination.from}–{pagination.to} of {pagination.total}
                        </div>
                        <div className="pagination-buttons">
                            <button className="pagination-btn" disabled={pagination.current_page <= 1}
                                onClick={() => setFilters(f => ({...f, page: f.page - 1}))}>← Prev</button>
                            {Array.from({length: Math.min(pagination.last_page, 5)}, (_, i) => i + 1).map(p => (
                                <button key={p} className={`pagination-btn ${pagination.current_page === p ? 'active' : ''}`}
                                    onClick={() => setFilters(f => ({...f, page: p}))}>{p}</button>
                            ))}
                            <button className="pagination-btn" disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => setFilters(f => ({...f, page: f.page + 1}))}>Next →</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
