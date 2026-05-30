import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [form, setForm]       = useState({ email: '', password: '' });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const { login }             = useAuth();
    const navigate              = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        setError('');
        try {
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="login-brand-icon">🏥</div>
                    <h1>HIMS IT Support</h1>
                    <p>Hospital IT Ticket Management System</p>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" placeholder="your@email.com"
                            value={form.email}
                            onChange={e => setForm({...form, email: e.target.value})}
                            autoFocus />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}
                        style={{width:'100%', justifyContent:'center', padding:'.7rem', marginTop:'.5rem'}}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{textAlign:'center', marginTop:'1.5rem', fontSize:'.75rem', color:'var(--text-muted)'}}>
                    <div style={{marginBottom:'.35rem'}}>Demo Credentials:</div>
                    <div><strong>Admin:</strong> admin@example.com / password</div>
                    <div><strong>IT Staff:</strong> it1@example.com / password</div>
                    <div><strong>User:</strong> billing@example.com / password</div>
                </div>
            </div>
        </div>
    );
}
