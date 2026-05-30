import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function CreateTicket() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '', description: '', department_id: '',
        category_id: '', priority_id: '',
    });
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/departments'),
            api.get('/categories'),
            api.get('/priorities'),
        ]).then(([deptRes, catRes, priRes]) => {
            setDepartments(deptRes.data.data || []);
            setCategories(catRes.data.data || []);
            setPriorities(priRes.data.data || []);
            setLoading(false);
        }).catch(() => {
            setError('Failed to load form data');
            setLoading(false);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.department_id || !form.category_id || !form.priority_id) {
            setError('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/tickets', form);
            navigate(`/tickets/${res.data.data?.id || res.data.id}`);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to create ticket');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

    return (
        <div style={{maxWidth:720}}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Raise New Ticket</h1>
                    <p className="page-subtitle">Submit an IT support request</p>
                </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Title <span className="form-required">*</span></label>
                            <input className="form-input" placeholder="Brief description of the issue"
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description <span className="form-required">*</span></label>
                            <textarea className="form-textarea" rows="5"
                                placeholder="Provide detailed information about the issue, steps to reproduce, location, etc."
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})} />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Department <span className="form-required">*</span></label>
                                <select className="form-select" value={form.department_id}
                                    onChange={e => setForm({...form, department_id: e.target.value})}>
                                    <option value="">Select department...</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category <span className="form-required">*</span></label>
                                <select className="form-select" value={form.category_id}
                                    onChange={e => setForm({...form, category_id: e.target.value})}>
                                    <option value="">Select category...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Priority <span className="form-required">*</span></label>
                            <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                                {priorities.map(p => (
                                    <label key={p.id} style={{
                                        display:'flex',alignItems:'center',gap:'.4rem',
                                        padding:'.5rem 1rem',borderRadius:'var(--radius-sm)',cursor:'pointer',
                                        border: form.priority_id == p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                                        background: form.priority_id == p.id ? '#f0fdfa' : 'var(--bg-card)',
                                        fontWeight: form.priority_id == p.id ? 600 : 400,
                                        fontSize:'.85rem', transition:'all var(--transition)',
                                    }}>
                                        <input type="radio" name="priority" value={p.id}
                                            checked={form.priority_id == p.id}
                                            onChange={e => setForm({...form, priority_id: e.target.value})}
                                            style={{display:'none'}} />
                                        <span className={`badge badge-${p.name}`}>{p.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Submitting...' : '🎫 Submit Ticket'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
