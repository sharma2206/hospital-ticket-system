import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_FLOW = [
    { name: 'raised',              label: 'Raised',           icon: '📤', color: '#f59e0b' },
    { name: 'acknowledged',        label: 'Acknowledged',     icon: '👁️', color: '#8b5cf6' },
    { name: 'karexpert_working',   label: 'Working',          icon: '⚙️', color: '#0ea5e9' },
    { name: 'awaiting_deployment', label: 'Awaiting Deploy',  icon: '🚀', color: '#f97316' },
    { name: 'deployed',            label: 'Deployed',         icon: '✅', color: '#10b981' },
];

const MODULE_ICONS = {
    OPD: '🏥', IPD: '🛏️', Billing: '💳', Pharmacy: '💊',
    Laboratory: '🔬', Radiology: '📡', Emergency: '🚑',
    OT: '🔪', Reports: '📊', MIS: '📈', Admin: '⚙️', Other: '📁',
};

export default function KarexpertTicketDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [statuses, setStatuses] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [editingRef, setEditingRef] = useState(false);
    const [editingContact, setEditingContact] = useState(false);
    const [refId, setRefId] = useState('');
    const [contact, setContact] = useState('');

    const fetchTicket = () => api.get(`/karexpert/tickets/${id}`).then(res => {
        setTicket(res.data);
        setRefId(res.data.karexpert_ref_id || '');
        setContact(res.data.karexpert_contact || '');
    }).catch(() => {});

    useEffect(() => {
        fetchTicket();
        api.get('/karexpert-statuses').then(res => setStatuses(res.data.data || [])).catch(() => {});
    }, [id]);

    const updateField = (data) => {
        api.put(`/karexpert/tickets/${id}`, data).then(fetchTicket);
    };

    const submitComment = async () => {
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/tickets/${id}/comments`, { comment, is_internal: true });
            setComment('');
            fetchTicket();
        } catch {} finally { setSubmitting(false); }
    };

    if (!ticket) return <div className="loading-screen"><div className="spinner" /></div>;

    const currentStatusIdx = STATUS_FLOW.findIndex(s => s.name === ticket.status?.name);

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
                    <Link to="/karexpert/tickets" className="btn btn-secondary btn-sm btn-icon">←</Link>
                    <div>
                        <h1 className="page-title" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                            <span className="kx-brand-icon" style={{width:28,height:28,fontSize:'.75rem'}}>K</span>
                            {ticket.ticket_number}
                        </h1>
                        <p className="page-subtitle">
                            Created {new Date(ticket.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </p>
                    </div>
                </div>
                <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                    <span className={`badge kx-badge-${ticket.status?.name || 'raised'}`}>
                        <span className={`badge-dot kx-dot-${ticket.status?.name || 'raised'}`}></span>
                        {(ticket.status?.name || 'raised').replace(/_/g,' ')}
                    </span>
                    <span className={`badge badge-${ticket.priority?.name || 'medium'}`}>{ticket.priority?.name || 'medium'}</span>
                    <span className="kx-module-badge">
                        {MODULE_ICONS[ticket.karexpert_module] || '📁'} {ticket.karexpert_module}
                    </span>
                </div>
            </div>

            {/* Status Timeline */}
            <div className="card kx-card" style={{marginBottom:'1.25rem'}}>
                <div className="card-body" style={{padding:'1.5rem'}}>
                    <div className="kx-status-timeline">
                        {STATUS_FLOW.map((step, idx) => {
                            const isActive = idx <= currentStatusIdx;
                            const isCurrent = idx === currentStatusIdx;
                            return (
                                <div key={step.name} className={`kx-timeline-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div className="kx-timeline-node" style={{
                                        background: isActive ? step.color : '#e2e8f0',
                                        color: isActive ? '#fff' : '#94a3b8',
                                        boxShadow: isCurrent ? `0 0 0 4px ${step.color}33` : 'none',
                                    }}>
                                        {step.icon}
                                    </div>
                                    <div className="kx-timeline-label" style={{
                                        color: isActive ? step.color : 'var(--text-muted)',
                                        fontWeight: isCurrent ? 700 : 500,
                                    }}>
                                        {step.label}
                                    </div>
                                    {idx < STATUS_FLOW.length - 1 && (
                                        <div className="kx-timeline-connector" style={{
                                            background: idx < currentStatusIdx ? step.color : '#e2e8f0',
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                {/* Left Column: Ticket Info + Comments */}
                <div>
                    {/* Title & Description */}
                    <div className="card kx-card" style={{marginBottom:'1.25rem'}}>
                        <div className="card-header">
                            <span className="card-title">{ticket.title}</span>
                        </div>
                        <div className="card-body">
                            <p style={{fontSize:'.9rem',color:'#475569',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{ticket.description}</p>
                        </div>
                    </div>

                    {/* Linked Internal Ticket */}
                    {ticket.parent_ticket && (
                        <div className="kx-linked-ticket" style={{marginBottom:'1.25rem'}}>
                            <div style={{fontSize:'.75rem',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:'.35rem'}}>
                                🔗 Linked Internal Ticket
                            </div>
                            <Link to={`/tickets/${ticket.parent_ticket.id}`} className="table-link" style={{fontWeight:600}}>
                                {ticket.parent_ticket.ticket_number}
                            </Link>
                            <span style={{color:'var(--text-muted)',fontSize:'.85rem',marginLeft:'.5rem'}}>{ticket.parent_ticket.title}</span>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="card kx-card">
                        <div className="card-header">
                            <span className="card-title">Internal Notes ({ticket.comments?.length || 0})</span>
                        </div>
                        <div className="card-body">
                            {ticket.comments?.length > 0 ? (
                                <div style={{marginBottom:'1.25rem'}}>
                                    {ticket.comments.map(c => (
                                        <div key={c.id} className="comment comment-internal">
                                            <div className="comment-header">
                                                <span className="comment-author">
                                                    {c.user?.first_name} {c.user?.last_name}
                                                </span>
                                                <span className="comment-time">{new Date(c.created_at).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="comment-body">{c.comment}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{textAlign:'center',padding:'1.5rem',color:'var(--text-muted)',fontSize:'.85rem'}}>No notes yet</div>
                            )}

                            <div style={{borderTop:'1px solid var(--border)',paddingTop:'1rem'}}>
                                <textarea className="form-textarea" rows="3" value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Add an internal note about KareXpert communication..." />
                                <div style={{display:'flex',justifyContent:'flex-end',marginTop:'.5rem'}}>
                                    <button className="btn btn-kx btn-sm" onClick={submitComment} disabled={submitting}>
                                        {submitting ? 'Saving...' : '📝 Add Note'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details + Management */}
                <div>
                    {/* KareXpert Details */}
                    <div className="card kx-card" style={{marginBottom:'1.25rem'}}>
                        <div className="card-header"><span className="card-title">KareXpert Details</span></div>
                        <div className="card-body">
                            <div className="detail-meta-grid">
                                <div className="detail-meta-item">
                                    <div className="detail-meta-label">HMS Module</div>
                                    <div className="detail-meta-value" style={{display:'flex',alignItems:'center',gap:'.35rem'}}>
                                        {MODULE_ICONS[ticket.karexpert_module] || '📁'} {ticket.karexpert_module || '—'}
                                    </div>
                                </div>
                                <div className="detail-meta-item">
                                    <div className="detail-meta-label">Category</div>
                                    <div className="detail-meta-value">{ticket.category?.name || '—'}</div>
                                </div>
                                <div className="detail-meta-item">
                                    <div className="detail-meta-label">Created By</div>
                                    <div className="detail-meta-value">{ticket.creator?.first_name} {ticket.creator?.last_name}</div>
                                </div>
                                <div className="detail-meta-item">
                                    <div className="detail-meta-label">Priority</div>
                                    <div className="detail-meta-value">
                                        <span className={`badge badge-${ticket.priority?.name || 'medium'}`}>{ticket.priority?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Editable KareXpert Ref ID */}
                            <div style={{marginTop:'1rem',padding:'.75rem',background:'#f8fafc',borderRadius:'var(--radius-sm)'}}>
                                <div className="detail-meta-label" style={{marginBottom:'.35rem'}}>KareXpert Reference ID</div>
                                {editingRef ? (
                                    <div style={{display:'flex',gap:'.35rem'}}>
                                        <input className="form-input" value={refId} onChange={e => setRefId(e.target.value)}
                                            placeholder="e.g., KX-2026-12345" style={{flex:1,padding:'.4rem .6rem'}} />
                                        <button className="btn btn-kx btn-sm" onClick={() => { updateField({karexpert_ref_id: refId}); setEditingRef(false); }}>Save</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingRef(false)}>✕</button>
                                    </div>
                                ) : (
                                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                        <span style={{fontWeight:600,color: ticket.karexpert_ref_id ? '#6366f1' : 'var(--text-muted)'}}>
                                            {ticket.karexpert_ref_id || 'Not set'}
                                        </span>
                                        <button className="btn btn-secondary btn-sm" style={{padding:'.25rem .5rem',fontSize:'.72rem'}}
                                            onClick={() => setEditingRef(true)}>✏️ Edit</button>
                                    </div>
                                )}
                            </div>

                            {/* Editable Contact */}
                            <div style={{marginTop:'.5rem',padding:'.75rem',background:'#f8fafc',borderRadius:'var(--radius-sm)'}}>
                                <div className="detail-meta-label" style={{marginBottom:'.35rem'}}>KareXpert Contact</div>
                                {editingContact ? (
                                    <div style={{display:'flex',gap:'.35rem'}}>
                                        <input className="form-input" value={contact} onChange={e => setContact(e.target.value)}
                                            placeholder="Contact person name" style={{flex:1,padding:'.4rem .6rem'}} />
                                        <button className="btn btn-kx btn-sm" onClick={() => { updateField({karexpert_contact: contact}); setEditingContact(false); }}>Save</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingContact(false)}>✕</button>
                                    </div>
                                ) : (
                                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                        <span style={{fontWeight:600,color: ticket.karexpert_contact ? 'var(--text)' : 'var(--text-muted)'}}>
                                            {ticket.karexpert_contact || 'Not set'}
                                        </span>
                                        <button className="btn btn-secondary btn-sm" style={{padding:'.25rem .5rem',fontSize:'.72rem'}}
                                            onClick={() => setEditingContact(true)}>✏️ Edit</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Management */}
                    <div className="card kx-card" style={{marginBottom:'1.25rem'}}>
                        <div className="card-header"><span className="card-title">Update Status</span></div>
                        <div className="card-body">
                            <div className="form-group">
                                <label className="form-label">Current Status</label>
                                <select className="form-select" value={ticket.status_id}
                                    onChange={e => updateField({ status_id: e.target.value })}>
                                    {statuses.map(s => (
                                        <option key={s.id} value={s.id}>{s.name.replace(/_/g,' ')}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Quick Status Buttons */}
                            <div style={{display:'flex',flexDirection:'column',gap:'.5rem',marginTop:'.5rem'}}>
                                {STATUS_FLOW.map((step, idx) => {
                                    const statusObj = statuses.find(s => s.name === step.name);
                                    const isActive = ticket.status?.name === step.name;
                                    if (!statusObj) return null;
                                    return (
                                        <button key={step.name}
                                            className={`kx-status-btn ${isActive ? 'active' : ''}`}
                                            style={{
                                                '--btn-color': step.color,
                                                opacity: isActive ? 1 : 0.7,
                                            }}
                                            onClick={() => !isActive && updateField({ status_id: statusObj.id })}
                                            disabled={isActive}>
                                            <span>{step.icon}</span>
                                            <span>{step.label}</span>
                                            {isActive && <span style={{marginLeft:'auto',fontSize:'.7rem'}}>● Current</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    {ticket.history?.length > 0 && (
                        <div className="card kx-card">
                            <div className="card-header"><span className="card-title">History</span></div>
                            <div className="card-body">
                                {ticket.history.map(h => (
                                    <div key={h.id} style={{
                                        padding:'.5rem 0',borderBottom:'1px solid var(--border)',
                                        fontSize:'.8rem',color:'var(--text-muted)',
                                    }}>
                                        <div style={{fontWeight:600,color:'var(--text)',marginBottom:'.15rem'}}>
                                            {h.change_type?.replace(/_/g,' ')}
                                        </div>
                                        {h.description && <div>{h.description}</div>}
                                        <div style={{fontSize:'.72rem',marginTop:'.15rem'}}>
                                            {h.changed_by_user && `${h.changed_by_user.first_name} ${h.changed_by_user.last_name} • `}
                                            {new Date(h.created_at).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
