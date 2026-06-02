import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STAT_CONFIG = [
    { key: 'total',               label: 'Total Tickets',       icon: '📋', color: '#6366f1', bg: '#eef2ff' },
    { key: 'raised',              label: 'Raised',              icon: '📤', color: '#f59e0b', bg: '#fffbeb' },
    { key: 'acknowledged',        label: 'Acknowledged',        icon: '👁️', color: '#8b5cf6', bg: '#f5f3ff' },
    { key: 'karexpert_working',   label: 'Working',             icon: '⚙️', color: '#0ea5e9', bg: '#f0f9ff' },
    { key: 'awaiting_deployment', label: 'Awaiting Deploy',     icon: '🚀', color: '#f97316', bg: '#fff7ed' },
    { key: 'deployed',            label: 'Deployed',            icon: '✅', color: '#10b981', bg: '#ecfdf5' },
];

const MODULE_ICONS = {
    OPD: '🏥', IPD: '🛏️', Billing: '💳', Pharmacy: '💊',
    Laboratory: '🔬', Radiology: '📡', Emergency: '🚑',
    OT: '🔪', Reports: '📊', MIS: '📈', Admin: '⚙️', Other: '📁',
};

export default function KarexpertDashboard() {
    const [data, setData] = useState(null);

    useEffect(() => {
        api.get('/karexpert/dashboard').then(res => setData(res.data)).catch(() => {});
    }, []);

    if (!data) return <div className="loading-screen"><div className="spinner" /></div>;

    const s = data.summary;

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                        <span className="kx-brand-icon">K</span>
                        KareXpert Tickets
                    </h1>
                    <p className="page-subtitle">HMS Vendor Ticket Tracking & Management</p>
                </div>
                <Link to="/karexpert/tickets/create" className="btn btn-kx">
                    📤 Raise to KareXpert
                </Link>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid" style={{gridTemplateColumns:'repeat(6, 1fr)'}}>
                {STAT_CONFIG.map(st => (
                    <div className="stat-card kx-stat-card" key={st.key} style={{'--stat-color': st.color}}>
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
                <div className="card kx-card">
                    <div className="card-header">
                        <span className="card-title">Recent KareXpert Tickets</span>
                        <Link to="/karexpert/tickets" className="btn btn-secondary btn-sm">View All</Link>
                    </div>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket</th>
                                    <th>Title</th>
                                    <th>Module</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recent_tickets?.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <Link to={`/karexpert/tickets/${t.id}`} className="table-link kx-link">
                                                {t.ticket_number}
                                            </Link>
                                        </td>
                                        <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</td>
                                        <td>
                                            <span className="kx-module-badge">
                                                {MODULE_ICONS[t.karexpert_module] || '📁'} {t.karexpert_module || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge kx-badge-${t.status?.name || 'raised'}`}>
                                                <span className={`badge-dot kx-dot-${t.status?.name || 'raised'}`}></span>
                                                {(t.status?.name || 'raised').replace(/_/g,' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!data.recent_tickets || data.recent_tickets.length === 0) && (
                                    <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>No KareXpert tickets yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* By Module */}
                <div className="card kx-card">
                    <div className="card-header">
                        <span className="card-title">Tickets by HMS Module</span>
                    </div>
                    <div className="card-body">
                        {data.by_module && Object.entries(data.by_module).length > 0 ? (
                            Object.entries(data.by_module).map(([mod, count]) => {
                                const max = Math.max(...Object.values(data.by_module));
                                const pct = max > 0 ? (count / max) * 100 : 0;
                                return (
                                    <div key={mod} style={{marginBottom:'.85rem'}}>
                                        <div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',marginBottom:'.3rem'}}>
                                            <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'.35rem'}}>
                                                {MODULE_ICONS[mod] || '📁'} {mod}
                                            </span>
                                            <span style={{fontWeight:700,color:'#6366f1'}}>{count}</span>
                                        </div>
                                        <div style={{background:'#eef2ff',borderRadius:6,height:8,overflow:'hidden'}}>
                                            <div style={{background:'linear-gradient(90deg,#6366f1,#818cf8)',height:'100%',width:`${pct}%`,borderRadius:6,transition:'width .6s ease'}} />
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

            {/* Status + Category Breakdown */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginTop:'1.25rem'}}>
                <div className="card kx-card">
                    <div className="card-header"><span className="card-title">By Status</span></div>
                    <div className="card-body" style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                        {data.by_status && Object.entries(data.by_status).map(([status, count]) => (
                            <div key={status} style={{textAlign:'center',flex:1,minWidth:80,padding:'.75rem',background:'#f8fafc',borderRadius:'var(--radius-sm)'}}>
                                <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--text)'}}>{count}</div>
                                <div className={`badge kx-badge-${status}`} style={{marginTop:'.35rem'}}>
                                    <span className={`badge-dot kx-dot-${status}`}></span>
                                    {status.replace(/_/g,' ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card kx-card">
                    <div className="card-header"><span className="card-title">By Category</span></div>
                    <div className="card-body" style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                        {data.by_category && Object.entries(data.by_category).map(([category, count]) => (
                            <div key={category} style={{textAlign:'center',flex:1,minWidth:80,padding:'.75rem',background:'#f8fafc',borderRadius:'var(--radius-sm)'}}>
                                <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--text)'}}>{count}</div>
                                <div style={{fontSize:'.72rem',fontWeight:600,color:'#6366f1',marginTop:'.35rem'}}>{category}</div>
                            </div>
                        ))}
                        {(!data.by_category || Object.entries(data.by_category).length === 0) && (
                            <div style={{textAlign:'center',padding:'1rem',color:'var(--text-muted)',fontSize:'.85rem',width:'100%'}}>No data</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
