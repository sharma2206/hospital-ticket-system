import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STAT_CONFIG = [
    { key: 'total',       label: 'Total Tickets',   icon: '🎫', color: '#0f766e', bg: '#f0fdfa' },
    { key: 'open',        label: 'Open',             icon: '📂', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'in_progress', label: 'In Progress',      icon: '⚡', color: '#3b82f6', bg: '#eff6ff' },
    { key: 'resolved',    label: 'Resolved',         icon: '✅', color: '#10b981', bg: '#ecfdf5' },
    { key: 'critical',    label: 'Critical',         icon: '🔴', color: '#ef4444', bg: '#fef2f2' },
];

const STAFF_STATS = [
    { key: 'unassigned',  label: 'Unassigned',       icon: '📋', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'my_assigned', label: 'My Assigned',      icon: '👤', color: '#0ea5e9', bg: '#f0f9ff' },
];

export default function Dashboard() {
    const [data, setData] = useState(null);
    const { isStaff } = useAuth();

    useEffect(() => {
        api.get('/dashboard').then(res => setData(res.data)).catch(() => {});
    }, []);

    if (!data) return <div className="loading-screen"><div className="spinner" /></div>;

    const s = data.summary;
    const allStats = [...STAT_CONFIG, ...(isStaff() ? STAFF_STATS : [])];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Hospital IT Support Overview</p>
                </div>
                <Link to="/tickets/create" className="btn btn-primary">➕ Raise Ticket</Link>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                {allStats.map(st => (
                    <div className="stat-card" key={st.key} style={{'--stat-color': st.color}}>
                        <div className="stat-card-icon" style={{background: st.bg, color: st.color}}>{st.icon}</div>
                        <div className="stat-card-label">{st.label}</div>
                        <div className="stat-card-value" style={{color: st.color}}>
                            {s[st.key] ?? 0}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem'}}>
                {/* Recent Tickets */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Recent Tickets</span>
                        <Link to="/tickets" className="btn btn-secondary btn-sm">View All</Link>
                    </div>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent_tickets?.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <Link to={`/tickets/${t.id}`} className="table-link">{t.ticket_number}</Link>
                                        </td>
                                        <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</td>
                                        <td><span className={`badge badge-${t.status?.name || 'open'}`}>
                                            <span className={`badge-dot badge-dot-${t.status?.name || 'open'}`}></span>
                                            {(t.status?.name || 'open').replace('_',' ')}
                                        </span></td>
                                        <td><span className={`badge badge-${t.priority?.name || 'medium'}`}>{t.priority?.name || 'medium'}</span></td>
                                    </tr>
                                ))}
                                {(!data.recent_tickets || data.recent_tickets.length === 0) && (
                                    <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No tickets yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* By Department */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Tickets by Department</span>
                    </div>
                    <div className="card-body">
                        {data.by_department && Object.entries(data.by_department).length > 0 ? (
                            Object.entries(data.by_department).map(([dept, count]) => {
                                const max = Math.max(...Object.values(data.by_department));
                                const pct = max > 0 ? (count / max) * 100 : 0;
                                return (
                                    <div key={dept} style={{marginBottom:'.85rem'}}>
                                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',marginBottom:'.3rem'}}>
                                            <span style={{fontWeight:500}}>{dept}</span>
                                            <span style={{fontWeight:700,color:'var(--primary)'}}>{count}</span>
                                        </div>
                                        <div style={{background:'#f0fdfa',borderRadius:6,height:8,overflow:'hidden'}}>
                                            <div style={{background:'linear-gradient(90deg,var(--primary),var(--primary-light))',height:'100%',width:`${pct}%`,borderRadius:6,transition:'width .6s ease'}} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">No data yet</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* By Status / Priority */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginTop:'1.25rem'}}>
                <div className="card">
                    <div className="card-header"><span className="card-title">By Status</span></div>
                    <div className="card-body" style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                        {data.by_status && Object.entries(data.by_status).map(([status, count]) => (
                            <div key={status} style={{textAlign:'center',flex:1,minWidth:80,padding:'.75rem',background:'#f8fafc',borderRadius:'var(--radius-sm)'}}>
                                <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--text)'}}>{count}</div>
                                <div className={`badge badge-${status}`} style={{marginTop:'.35rem'}}>
                                    <span className={`badge-dot badge-dot-${status}`}></span>
                                    {status.replace('_',' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><span className="card-title">By Priority</span></div>
                    <div className="card-body" style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                        {data.by_priority && Object.entries(data.by_priority).map(([priority, count]) => (
                            <div key={priority} style={{textAlign:'center',flex:1,minWidth:80,padding:'.75rem',background:'#f8fafc',borderRadius:'var(--radius-sm)'}}>
                                <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--text)'}}>{count}</div>
                                <div className={`badge badge-${priority}`} style={{marginTop:'.35rem'}}>{priority}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
