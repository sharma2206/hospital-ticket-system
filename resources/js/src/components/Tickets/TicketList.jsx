import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function SLABadge({ status }) {
    if (!status) return null;
    return <span className={`sla-badge sla-${status.status}`}>{status.label}</span>;
}

export default function TicketList() {
    const { isStaff } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState('');

    const filters = {
        status_id:    searchParams.get('status_id') || '',
        priority_id:  searchParams.get('priority_id') || '',
        department_id:searchParams.get('department_id') || '',
        branch_id:    searchParams.get('branch_id') || '',
        assigned_to:  searchParams.get('assigned_to') || '',
        is_escalated: searchParams.get('is_escalated') || '',
        sla_breached: searchParams.get('sla_breached') || '',
        my_tickets:   searchParams.get('my_tickets') || '',
        sort_by:      searchParams.get('sort_by') || 'created_at',
        sort_order:   searchParams.get('sort_order') || 'desc',
        page:         searchParams.get('page') || 1,
        per_page:     searchParams.get('per_page') || 15,
        search:       searchParams.get('search') || '',
    };

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['tickets', filters],
        queryFn: () => api.get('/tickets', { params: filters }).then(r => r.data),
        keepPreviousData: true,
    });

    const { data: statusData } = useQuery({ queryKey: ['ticket-statuses'], queryFn: () => api.get('/ticket-statuses').then(r => r.data) });
    const { data: priorityData } = useQuery({ queryKey: ['priorities'], queryFn: () => api.get('/priorities').then(r => r.data) });
    const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/departments').then(r => r.data) });
    const { data: branchData } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('/branches').then(r => r.data) });

    const setFilter = (key, val) => {
        const p = new URLSearchParams(searchParams);
        if (val) p.set(key, val); else p.delete(key);
        p.set('page', 1);
        setSearchParams(p);
    };

    const clearFilters = () => setSearchParams({});

    const doSearch = (e) => {
        e.preventDefault();
        setFilter('search', search);
    };

    const tickets = data?.data || [];
    const pagination = data?.pagination || {};

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title">🎫 Tickets</div>
                    <div className="page-subtitle">{pagination.total ?? 0} total tickets</div>
                </div>
                <Link to="/tickets/create" className="btn btn-primary">➕ Raise Ticket</Link>
            </div>

            {/* Filters */}
            <div className="card" style={{marginBottom:'1rem', padding:'1rem'}}>
                <div style={{display:'flex', gap:'.75rem', flexWrap:'wrap', alignItems:'flex-end'}}>
                    <form onSubmit={doSearch} style={{display:'flex', gap:'.4rem', flex:1, minWidth:200}}>
                        <input
                            className="form-control"
                            placeholder="Search tickets, #number, requester..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{flex:1}}
                        />
                        <button className="btn btn-secondary btn-sm" type="submit">🔍</button>
                    </form>

                    <select className="form-control" style={{width:'auto'}} value={filters.status_id} onChange={e => setFilter('status_id', e.target.value)}>
                        <option value="">All Status</option>
                        {statusData?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <select className="form-control" style={{width:'auto'}} value={filters.priority_id} onChange={e => setFilter('priority_id', e.target.value)}>
                        <option value="">All Priority</option>
                        {priorityData?.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <select className="form-control" style={{width:'auto'}} value={filters.department_id} onChange={e => setFilter('department_id', e.target.value)}>
                        <option value="">All Departments</option>
                        {deptData?.data?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>

                    {isStaff() && (
                        <>
                            <select className="form-control" style={{width:'auto'}} value={filters.branch_id} onChange={e => setFilter('branch_id', e.target.value)}>
                                <option value="">All Branches</option>
                                {branchData?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <select className="form-control" style={{width:'auto'}} value={filters.is_escalated} onChange={e => setFilter('is_escalated', e.target.value)}>
                                <option value="">Escalation</option>
                                <option value="1">Escalated Only</option>
                            </select>
                            <select className="form-control" style={{width:'auto'}} value={filters.sla_breached} onChange={e => setFilter('sla_breached', e.target.value)}>
                                <option value="">SLA</option>
                                <option value="1">Breached Only</option>
                            </select>
                        </>
                    )}

                    <button className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Ticket #</th>
                                <th>Title</th>
                                <th>Department</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>SLA</th>
                                {isStaff() && <th>Assigned To</th>}
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        {Array(9).fill(0).map((_, j) => (
                                            <td key={j}><div className="skeleton skeleton-text" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : tickets.length ? tickets.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <Link to={`/tickets/${t.id}`} className="table-link" style={{fontFamily:'monospace', fontSize:'.8rem'}}>
                                            {t.ticket_number}
                                        </Link>
                                        {t.is_escalated && <span style={{marginLeft:'.3rem', fontSize:'.7rem'}}>🚨</span>}
                                    </td>
                                    <td style={{maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                        <Link to={`/tickets/${t.id}`} className="table-link">{t.title}</Link>
                                    </td>
                                    <td><span style={{fontSize:'.8rem'}}>{t.department?.name || '—'}</span></td>
                                    <td>
                                        <span className="badge" style={{background:t.priority?.color+'20', color:t.priority?.color}}>
                                            {t.priority?.name}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge" style={{background:t.status?.color+'20', color:t.status?.color}}>
                                            {t.status?.name}
                                        </span>
                                    </td>
                                    <td><SLABadge status={t.sla_status} /></td>
                                    {isStaff() && (
                                        <td style={{fontSize:'.8rem'}}>
                                            {t.assignee ? `${t.assignee.first_name} ${t.assignee.last_name}` : <span style={{color:'var(--text-light)'}}>Unassigned</span>}
                                        </td>
                                    )}
                                    <td style={{fontSize:'.78rem', color:'var(--text-muted)'}}>
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <Link to={`/tickets/${t.id}`} className="btn btn-secondary btn-xs">View</Link>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={9} style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>
                                    <div style={{fontSize:'2rem', marginBottom:'.5rem'}}>🎫</div>
                                    No tickets found. <Link to="/tickets/create">Raise one?</Link>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderTop:'1px solid var(--border)'}}>
                        <span style={{fontSize:'.82rem', color:'var(--text-muted)'}}>
                            Showing {pagination.from}–{pagination.to} of {pagination.total}
                        </span>
                        <div style={{display:'flex', gap:'.4rem'}}>
                            {Array.from({length: Math.min(pagination.last_page, 10)}, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    className={`btn btn-sm ${+filters.page === p ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setFilter('page', p)}
                                >{p}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
