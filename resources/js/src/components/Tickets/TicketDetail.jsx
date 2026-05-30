import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TicketDetail() {
    const { id } = useParams();
    const { isStaff } = useAuth();
    const [ticket, setTicket] = useState(null);
    const [comment, setComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [itStaff, setItStaff] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchTicket = () => api.get(`/tickets/${id}`).then(res => setTicket(res.data)).catch(() => {});

    useEffect(() => {
        fetchTicket();
        if (isStaff()) {
            api.get('/it-staff').then(res => setItStaff(res.data || [])).catch(() => {});
            api.get('/ticket-statuses').then(res => setStatuses(res.data.data || [])).catch(() => {});
            api.get('/priorities').then(res => setPriorities(res.data.data || [])).catch(() => {});
        }
    }, [id]);

    const updateField = (field, value) => {
        if (field === 'status_id') {
            api.put(`/tickets/${id}/status`, { status_id: value }).then(fetchTicket);
        } else {
            api.put(`/tickets/${id}`, { [field]: value }).then(fetchTicket);
        }
    };

    const submitComment = async () => {
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/tickets/${id}/comments`, { comment, is_internal: isInternal });
            setComment('');
            setIsInternal(false);
            fetchTicket();
        } catch {} finally { setSubmitting(false); }
    };

    const handleEscalate = () => {
        if (confirm('Escalate this ticket?')) {
            api.post(`/tickets/${id}/escalate`, { reason: 'Escalated by staff' }).then(fetchTicket);
        }
    };

    if (!ticket) return <div className="loading-screen"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
                    <Link to="/tickets" className="btn btn-secondary btn-sm btn-icon">←</Link>
                    <div>
                        <h1 className="page-title">{ticket.ticket_number}</h1>
                        <p className="page-subtitle">Created {new Date(ticket.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                </div>
                <div style={{display:'flex',gap:'.5rem'}}>
                    <span className={`badge badge-${ticket.status?.name || 'open'}`}>
                        <span className={`badge-dot badge-dot-${ticket.status?.name || 'open'}`}></span>
                        {(ticket.status?.name || 'open').replace('_',' ')}
                    </span>
                    <span className={`badge badge-${ticket.priority?.name || 'medium'}`}>{ticket.priority?.name || 'medium'}</span>
                    {ticket.is_escalated && <span className="badge badge-critical">🚨 Escalated</span>}
                </div>
            </div>

            <div className="detail-grid">
                {/* Left: Ticket Info + Comments */}
                <div>
                    {/* Title & Description */}
                    <div className="card" style={{marginBottom:'1.25rem'}}>
                        <div className="card-header">
                            <span className="card-title">{ticket.title}</span>
                        </div>
                        <div className="card-body">
                            <p style={{fontSize:'.9rem',color:'#475569',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{ticket.description}</p>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Comments ({ticket.comments?.length || 0})</span>
                        </div>
                        <div className="card-body">
                            {ticket.comments?.length > 0 ? (
                                <div style={{marginBottom:'1.25rem'}}>
                                    {ticket.comments.map(c => (
                                        <div key={c.id} className={`comment ${c.is_internal ? 'comment-internal' : 'comment-public'}`}>
                                            <div className="comment-header">
                                                <span className="comment-author">
                                                    {c.user?.first_name} {c.user?.last_name}
                                                    {c.is_internal && <span className="comment-internal-badge" style={{marginLeft:'.5rem'}}>🔒 Internal</span>}
                                                </span>
                                                <span className="comment-time">{new Date(c.created_at).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="comment-body">{c.comment}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{textAlign:'center',padding:'1.5rem',color:'var(--text-muted)',fontSize:'.85rem'}}>No comments yet</div>
                            )}

                            {/* Add Comment */}
                            <div style={{borderTop:'1px solid var(--border)',paddingTop:'1rem'}}>
                                <textarea className="form-textarea" rows="3" value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Write a comment..." />
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'.5rem'}}>
                                    {isStaff() && (
                                        <label style={{display:'flex',alignItems:'center',gap:'.4rem',fontSize:'.8rem',color:'var(--text-muted)',cursor:'pointer'}}>
                                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                                            Internal note (staff only)
                                        </label>
                                    )}
                                    <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={submitting} style={{marginLeft:'auto'}}>
                                        {submitting ? 'Sending...' : '💬 Add Comment'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Meta + Management */}
                <div>
                    {/* Ticket Info */}
                    <div className="card" style={{marginBottom:'1.25rem'}}>
                        <div className="card-header"><span className="card-title">Details</span></div>
                        <div className="card-body">
                            <div className="detail-meta-grid">
                                <div className="detail-meta-item">
                                    <div className="detail-meta-label">Department</div>
                                    <div className="detail-meta-value">{ticket.department?.name || '—'}</div>
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
                                    <div className="detail-meta-label">Assigned To</div>
                                    <div className="detail-meta-value">{ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : 'Unassigned'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff Management Panel */}
                    {isStaff() && (
                        <div className="card" style={{marginBottom:'1.25rem'}}>
                            <div className="card-header"><span className="card-title">Manage Ticket</span></div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-select" value={ticket.status_id}
                                        onChange={e => updateField('status_id', e.target.value)}>
                                        {statuses.map(s => <option key={s.id} value={s.id}>{s.name.replace('_',' ')}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={ticket.priority_id}
                                        onChange={e => updateField('priority_id', e.target.value)}>
                                        {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Assign To</label>
                                    <select className="form-select" value={ticket.assigned_to || ''}
                                        onChange={e => updateField('assigned_to', e.target.value || null)}>
                                        <option value="">Unassigned</option>
                                        {itStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                {!ticket.is_escalated && (
                                    <button className="btn btn-danger btn-sm" style={{width:'100%',justifyContent:'center'}} onClick={handleEscalate}>
                                        🚨 Escalate Ticket
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
