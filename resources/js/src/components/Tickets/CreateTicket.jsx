import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function CreateTicket() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            source: 'self_service', impact: 'low', urgency: 'low',
            requester_name: user ? `${user.first_name} ${user.last_name}` : '',
            requester_email: user?.email || '',
        }
    });

    const selectedCategory = watch('category_id');
    const [files, setFiles] = useState([]);

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data) });
    const { data: subCategories } = useQuery({ queryKey: ['sub-categories', selectedCategory], queryFn: () => api.get('/sub-categories', { params: { category_id: selectedCategory } }).then(r => r.data), enabled: !!selectedCategory });
    const { data: priorities } = useQuery({ queryKey: ['priorities'], queryFn: () => api.get('/priorities').then(r => r.data) });
    const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/departments').then(r => r.data) });
    const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: () => api.get('/branches').then(r => r.data) });
    const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => api.get('/vendors').then(r => r.data) });

    const mutation = useMutation({
        mutationFn: (formData) => api.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
        onSuccess: (res) => {
            toast.success('Ticket raised successfully!');
            navigate(`/tickets/${res.data.data.id}`);
        },
        onError: (err) => {
            const errs = err.response?.data?.errors;
            if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
        }
    });

    const onSubmit = (data) => {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => { if (v) fd.append(k, v); });
        files.forEach(f => fd.append('attachments[]', f));
        mutation.mutate(fd);
    };

    return (
        <div style={{maxWidth: 760, margin: '0 auto'}}>
            <div className="page-header">
                <div>
                    <div className="page-title">➕ Raise a Ticket</div>
                    <div className="page-subtitle">Describe your IT issue and we'll get back to you</div>
                </div>
                <Link to="/tickets" className="btn btn-secondary">← Back</Link>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Issue Details */}
                <div className="card" style={{marginBottom:'1rem'}}>
                    <div className="card-header"><div className="card-title">📝 Issue Details</div></div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">Title *</label>
                            <input className={`form-control ${errors.title ? 'error' : ''}`} placeholder="Brief description of the issue" {...register('title', { required: 'Title is required' })} />
                            {errors.title && <span className="form-error">{errors.title.message}</span>}
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select className={`form-control ${errors.category_id ? 'error' : ''}`} {...register('category_id', { required: 'Category is required' })}>
                                    <option value="">Select category</option>
                                    {categories?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {errors.category_id && <span className="form-error">{errors.category_id.message}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sub-Category</label>
                                <select className="form-control" {...register('sub_category_id')} disabled={!selectedCategory}>
                                    <option value="">Select sub-category</option>
                                    {subCategories?.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem'}}>
                            <div className="form-group">
                                <label className="form-label">Priority *</label>
                                <select className={`form-control ${errors.priority_id ? 'error' : ''}`} {...register('priority_id', { required: 'Priority is required' })}>
                                    <option value="">Select priority</option>
                                    {priorities?.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                {errors.priority_id && <span className="form-error">{errors.priority_id.message}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Impact</label>
                                <select className="form-control" {...register('impact')}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Urgency</label>
                                <select className="form-control" {...register('urgency')}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <textarea
                                className={`form-control ${errors.description ? 'error' : ''}`}
                                rows={5}
                                placeholder="Describe the issue in detail — what happened, when, and the expected behavior..."
                                {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Minimum 10 characters' } })}
                            />
                            {errors.description && <span className="form-error">{errors.description.message}</span>}
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="card" style={{marginBottom:'1rem'}}>
                    <div className="card-header"><div className="card-title">📍 Location & Department</div></div>
                    <div className="card-body">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                            <div className="form-group">
                                <label className="form-label">Department *</label>
                                <select className={`form-control ${errors.department_id ? 'error' : ''}`} {...register('department_id', { required: 'Department is required' })}>
                                    <option value="">Select department</option>
                                    {departments?.data?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                {errors.department_id && <span className="form-error">{errors.department_id.message}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Branch</label>
                                <select className="form-control" {...register('branch_id')}>
                                    <option value="">Select branch</option>
                                    {branches?.data?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Building</label>
                                <input className="form-control" placeholder="e.g. Block A" {...register('building')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Floor / Room</label>
                                <input className="form-control" placeholder="e.g. 2nd Floor, Room 201" {...register('room_number')} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requester */}
                <div className="card" style={{marginBottom:'1rem'}}>
                    <div className="card-header"><div className="card-title">👤 Requester Info</div></div>
                    <div className="card-body">
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                            <div className="form-group">
                                <label className="form-label">Requester Name</label>
                                <input className="form-control" {...register('requester_name')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Employee ID</label>
                                <input className="form-control" {...register('requester_employee_id')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mobile</label>
                                <input className="form-control" type="tel" {...register('requester_mobile')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-control" type="email" {...register('requester_email')} />
                            </div>
                        </div>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                            <div className="form-group">
                                <label className="form-label">Source</label>
                                <select className="form-control" {...register('source')}>
                                    <option value="self_service">Self Service Portal</option>
                                    <option value="phone">Phone</option>
                                    <option value="email">Email</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="walk_in">Walk-In</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Related Vendor</label>
                                <select className="form-control" {...register('vendor_id')}>
                                    <option value="">None</option>
                                    {vendors?.data?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attachments */}
                <div className="card" style={{marginBottom:'1.5rem'}}>
                    <div className="card-header"><div className="card-title">📎 Attachments</div></div>
                    <div className="card-body">
                        <input
                            type="file"
                            multiple
                            className="form-control"
                            onChange={e => setFiles(Array.from(e.target.files))}
                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.log"
                        />
                        {files.length > 0 && (
                            <div style={{marginTop:'.75rem', display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
                                {files.map((f, i) => (
                                    <span key={i} className="badge badge-secondary">{f.name}</span>
                                ))}
                            </div>
                        )}
                        <div style={{marginTop:'.5rem', fontSize:'.78rem', color:'var(--text-muted)'}}>
                            Max 10MB per file. Supported: JPG, PNG, PDF, DOC, XLS, ZIP, TXT, LOG
                        </div>
                    </div>
                </div>

                <div style={{display:'flex', gap:'1rem', justifyContent:'flex-end'}}>
                    <Link to="/tickets" className="btn btn-secondary">Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                        {mutation.isPending ? '⏳ Raising Ticket...' : '✅ Raise Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
}
