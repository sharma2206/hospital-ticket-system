import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const KX_MODULES = [
    { value: 'OPD',        label: 'OPD',                icon: '🏥' },
    { value: 'IPD',        label: 'IPD',                icon: '🛏️' },
    { value: 'Billing',    label: 'Billing',            icon: '💳' },
    { value: 'Pharmacy',   label: 'Pharmacy',           icon: '💊' },
    { value: 'Laboratory', label: 'Laboratory',         icon: '🔬' },
    { value: 'Radiology',  label: 'Radiology',          icon: '📡' },
    { value: 'Emergency',  label: 'Emergency',          icon: '🚑' },
    { value: 'OT',         label: 'Operation Theatre',  icon: '🔪' },
    { value: 'Reports',    label: 'Reports',            icon: '📊' },
    { value: 'MIS',        label: 'MIS',                icon: '📈' },
    { value: 'Admin',      label: 'Admin Module',       icon: '⚙️' },
    { value: 'Other',      label: 'Other',              icon: '📁' },
];

export default function KarexpertCreateTicket() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [form, setForm] = useState({
        title: '',
        description: '',
        karexpert_module: '',
        category_id: '',
        priority_id: '',
        karexpert_ref_id: '',
        karexpert_contact: '',
        parent_ticket_id: searchParams.get('parent_ticket_id') || '',
    });

    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [parentTicket, setParentTicket] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/karexpert-categories'),
            api.get('/priorities'),
        ]).then(([catRes, priRes]) => {
            setCategories(catRes.data.data || []);
            setPriorities(priRes.data.data || []);
            setLoading(false);
        }).catch(() => {
            setError('Failed to load form data');
            setLoading(false);
        });

        // If parent ticket is linked, fetch its info
        if (form.parent_ticket_id) {
            api.get(`/tickets/${form.parent_ticket_id}`).then(res => {
                setParentTicket(res.data);
            }).catch(() => {});
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.karexpert_module || !form.category_id || !form.priority_id) {
            setError('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const payload = { ...form };
            if (!payload.parent_ticket_id) delete payload.parent_ticket_id;
            if (!payload.karexpert_ref_id) delete payload.karexpert_ref_id;
            if (!payload.karexpert_contact) delete payload.karexpert_contact;

            const res = await api.post('/karexpert/tickets', payload);
            navigate(`/karexpert/tickets/${res.data.data?.id || res.data.id}`);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to create KareXpert ticket');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

    return (
        <div style={{maxWidth:780}}>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                        <span className="kx-brand-icon">K</span>
                        Raise to KareXpert
                    </h1>
                    <p className="page-subtitle">Submit a ticket to the KareXpert HMS team</p>
                </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            {/* Linked Internal Ticket */}
            {parentTicket && (
                <div className="kx-linked-ticket" style={{marginBottom:'1.25rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.8rem',color:'var(--text-muted)',marginBottom:'.35rem'}}>
                        🔗 Linked to Internal Ticket
                    </div>
                    <div style={{fontSize:'.9rem',fontWeight:600}}>
                        {parentTicket.ticket_number} — {parentTicket.title}
                    </div>
                </div>
            )}

            <div className="card kx-card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Title <span className="form-required">*</span></label>
                            <input className="form-input" placeholder="Brief description of the issue for KareXpert"
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description <span className="form-required">*</span></label>
                            <textarea className="form-textarea" rows="5"
                                placeholder="Detailed description of the issue, steps to reproduce, affected patients/workflows, screenshots info, etc."
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})} />
                        </div>

                        {/* HMS Module Selection */}
                        <div className="form-group">
                            <label className="form-label">HMS Module <span className="form-required">*</span></label>
                            <div className="kx-module-grid">
                                {KX_MODULES.map(m => (
                                    <label key={m.value} className={`kx-module-option ${form.karexpert_module === m.value ? 'active' : ''}`}
                                        onClick={() => setForm({...form, karexpert_module: m.value})}>
                                        <span className="kx-module-option-icon">{m.icon}</span>
                                        <span className="kx-module-option-label">{m.label}</span>
                                        <input type="radio" name="module" value={m.value}
                                            checked={form.karexpert_module === m.value}
                                            onChange={() => {}} style={{display:'none'}} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Category <span className="form-required">*</span></label>
                                <select className="form-select" value={form.category_id}
                                    onChange={e => setForm({...form, category_id: e.target.value})}>
                                    <option value="">Select category...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority <span className="form-required">*</span></label>
                                <select className="form-select" value={form.priority_id}
                                    onChange={e => setForm({...form, priority_id: e.target.value})}>
                                    <option value="">Select priority...</option>
                                    {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Optional KareXpert fields */}
                        <div style={{borderTop:'1px solid var(--border)',paddingTop:'1rem',marginTop:'.5rem'}}>
                            <div style={{fontSize:'.8rem',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'.75rem'}}>
                                Optional KareXpert Details
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">KareXpert Reference ID</label>
                                    <input className="form-input" placeholder="e.g., KX-2026-12345"
                                        value={form.karexpert_ref_id}
                                        onChange={e => setForm({...form, karexpert_ref_id: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">KareXpert Contact Person</label>
                                    <input className="form-input" placeholder="Name of KareXpert contact"
                                        value={form.karexpert_contact}
                                        onChange={e => setForm({...form, karexpert_contact: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-kx" disabled={submitting}>
                                {submitting ? 'Submitting...' : '📤 Raise to KareXpert'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/karexpert/tickets')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
