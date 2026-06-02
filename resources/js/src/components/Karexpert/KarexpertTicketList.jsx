import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const MODULE_ICONS = {
    OPD: '🏥', IPD: '🛏️', Billing: '💳', Pharmacy: '💊',
    Laboratory: '🔬', Radiology: '📡', Emergency: '🚑',
    OT: '🔪', Reports: '📊', MIS: '📈', Admin: '⚙️', Other: '📁',
};

const KX_STATUSES = [
    { value: 'raised', label: 'Raised' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'karexpert_working', label: 'Working' },
    { value: 'awaiting_deployment', label: 'Awaiting Deploy' },
    { value: 'deployed', label: 'Deployed' },
];

const KX_MODULES = [
    'OPD','IPD','Billing','Pharmacy','Laboratory',
    'Radiology','Emergency','OT','Reports','MIS','Admin','Other',
];

export default function KarexpertTicketList() {
    const [tickets, setTickets] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        priority: searchParams.get('priority') || '',
        module: searchParams.get('module') || '',
        search: '',
        page: 1,
    });

    const fetchTickets = () => {
        setLoading(true);
        const params = {};
        Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
        api.get('/karexpert/tickets', { params })
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
                    <h1 className="page-title" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                        <span className="kx-brand-icon">K</span>
                        KareXpert Tickets
                    </h1>
                    <p className="page-subtitle">{pagination.total || 0} tickets found</p>
                </div>
                <Link to="/karexpert/tickets/create" className="btn btn-kx">📤 Raise to KareXpert</Link>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input type="text" className="search-input" placeholder="Search KX tickets..."
                        value={filters.search}
                        onChange={e => setFilter('search', e.target.value)} />
                </div>
                <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                    <option value="">All Status</option>
                    {KX_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>
                <select className="filter-select" value={filters.module} onChange={e => setFilter('module', e.target.value)}>
                    <option value="">All Modules</option>
                    {KX_MODULES.map(m => <option key={m} value={m}>{MODULE_ICONS[m]} {m}</option>)}
                </select>
                {(filters.status || filters.priority || filters.module || filters.search) && (
                    <button className="btn btn-secondary btn-sm"
                        onClick={() => setFilters({status:'',priority:'',module:'',search:'',page:1})}>
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card kx-card">
                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-screen" style={{minHeight:200}}><div className="spinner" /></div>
                    ) : tickets.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No KareXpert tickets found</div>
                            <p style={{color:'var(--text-muted)',fontSize:'.85rem'}}>Adjust filters or raise a new ticket to KareXpert</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>KX Ticket #</th>
                                    <th>Title</th>
                                    <th>Module</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>KX Ref</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <Link to={`/karexpert/tickets/${t.id}`} className="table-link kx-link">
                                                {t.ticket_number}
                                            </Link>
                                        </td>
                                        <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                            {t.title}
                                        </td>
                                        <td>
                                            <span className="kx-module-badge">
                                                {MODULE_ICONS[t.karexpert_module] || '📁'} {t.karexpert_module || '—'}
                                            </span>
                                        </td>
                                        <td><span style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{t.category?.name || '—'}</span></td>
                                        <td><span className={`badge badge-${t.priority?.name || 'medium'}`}>{t.priority?.name || '—'}</span></td>
                                        <td>
                                            <span className={`badge kx-badge-${t.status?.name || 'raised'}`}>
                                                <span className={`badge-dot kx-dot-${t.status?.name || 'raised'}`}></span>
                                                {(t.status?.name || 'raised').replace(/_/g,' ')}
                                            </span>
                                        </td>
                                        <td>
                                            {t.karexpert_ref_id ? (
                                                <span style={{fontSize:'.8rem',fontWeight:600,color:'#6366f1'}}>{t.karexpert_ref_id}</span>
                                            ) : (
                                                <span style={{color:'var(--text-light)',fontSize:'.8rem'}}>—</span>
                                            )}
                                        </td>
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
