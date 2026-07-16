import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0f766e','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#10b981','#f97316'];

function StatCard({ label, value, icon, color = '#0f766e', sub }) {
    return (
        <div className="stat-card" style={{'--stat-color': color}}>
            <div className="stat-card-icon" style={{background: color + '20'}}>{icon}</div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value" style={{color}}>{value ?? 0}</div>
            {sub && <div className="stat-card-change">{sub}</div>}
        </div>
    );
}

export default function AdminDashboard() {
    const { isStaff } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard').then(r => r.data),
        refetchInterval: 60000,
    });

    if (isLoading) return (
        <div>
            <div className="page-header"><div className="page-title">Dashboard</div></div>
            <div className="stats-grid">
                {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="stat-card"><div className="skeleton skeleton-card" /></div>
                ))}
            </div>
        </div>
    );

    const s = data?.summary || {};
    const trend = data?.trend || [];
    const byPriority = data?.by_priority || [];
    const byDept = data?.by_department || [];
    const byBranch = data?.by_branch || [];
    const byCategory = data?.by_category || [];
    const techWorkload = data?.technician_workload || [];
    const recentTickets = data?.recent_tickets || [];

    const avgResH = s.avg_resolution_min ? `~${Math.round(s.avg_resolution_min / 60)}h avg resolution` : '';
    const avgRespM = s.avg_response_min ? `~${s.avg_response_min}m avg response` : '';

    return (
        <div>
            <div className="page-header">
                <div>
                    <div className="page-title">📊 IT Service Desk Dashboard</div>
                    <div className="page-subtitle">Real-time overview of all IT support operations</div>
                </div>
            </div>

            {/* KPI Strip */}
            <div className="stats-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))'}}>
                <StatCard label="Total Tickets"  value={s.total}       icon="🎫" color="#0f766e" />
                <StatCard label="Open"           value={s.open}        icon="📂" color="#f59e0b" />
                <StatCard label="In Progress"    value={s.in_progress} icon="⚙️" color="#3b82f6" />
                <StatCard label="Resolved"       value={s.resolved}    icon="✅" color="#10b981" />
                <StatCard label="SLA Breached"   value={s.sla_breached} icon="⏰" color="#ef4444" />
                <StatCard label="Overdue"        value={s.overdue}     icon="🚨" color="#f97316" />
                <StatCard label="Today"          value={s.today}       icon="📅" color="#8b5cf6" />
                <StatCard label="This Month"     value={s.monthly}     icon="📆" color="#0891b2" sub={avgResH} />
                {isStaff() && <StatCard label="Unassigned" value={s.unassigned} icon="👁️" color="#dc2626" />}
                {isStaff() && <StatCard label="My Assigned" value={s.my_assigned} icon="👤" color="#0f766e" />}
                <StatCard label="Escalated"      value={s.escalated}   icon="🔺" color="#b91c1c" />
                <StatCard label="Satisfaction"   value={s.avg_satisfaction ? `${s.avg_satisfaction}/5` : 'N/A'} icon="⭐" color="#f59e0b" sub={avgRespM} />
            </div>

            {/* Charts Row 1 */}
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
                <div className="card">
                    <div className="card-header"><div className="card-title">📈 Ticket Trend (30 Days)</div></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{fontSize:10}} />
                                <Tooltip />
                                <Area type="monotone" dataKey="count" stroke="#0f766e" fill="url(#tg)" strokeWidth={2} name="Tickets" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><div className="card-title">🎯 Priority Distribution</div></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={byPriority} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                    {byPriority.map((entry, i) => (
                                        <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
                <div className="card">
                    <div className="card-header"><div className="card-title">🏢 Department-wise Tickets</div></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={byDept} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" tick={{fontSize:10}} />
                                <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={100} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#0f766e" radius={[0,4,4,0]} name="Tickets" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><div className="card-title">🏥 Branch-wise Tickets</div></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={byBranch}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{fontSize:10}} />
                                <YAxis tick={{fontSize:10}} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} name="Tickets" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Technician Workload + Recent Tickets */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1rem'}}>
                {isStaff() && techWorkload.length > 0 && (
                    <div className="card">
                        <div className="card-header"><div className="card-title">👨‍💻 Technician Workload</div></div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={techWorkload} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" tick={{fontSize:10}} />
                                    <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={80} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#f59e0b" radius={[0,4,4,0]} name="Assigned" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="card" style={{flex:1}}>
                    <div className="card-header">
                        <div className="card-title">🕐 Recent Tickets</div>
                        <a href="/tickets" className="btn btn-secondary btn-sm">View All</a>
                    </div>
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ticket #</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTickets.map(t => (
                                    <tr key={t.id}>
                                        <td><a href={`/tickets/${t.id}`} className="table-link">{t.ticket_number}</a></td>
                                        <td style={{maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.title}</td>
                                        <td>
                                            <span className="badge" style={{background: t.status?.color + '20', color: t.status?.color}}>
                                                {t.status?.name}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge" style={{background: t.priority?.color + '20', color: t.priority?.color}}>
                                                {t.priority?.name}
                                            </span>
                                        </td>
                                        <td style={{fontSize:'.78rem', color:'var(--text-muted)'}}>{new Date(t.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {!recentTickets.length && (
                                    <tr><td colSpan={5} style={{textAlign:'center', color:'var(--text-muted)', padding:'2rem'}}>No tickets yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
