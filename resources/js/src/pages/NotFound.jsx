export default function NotFound() {
    return (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:'1rem',textAlign:'center'}}>
            <div style={{fontSize:'5rem'}}>🔍</div>
            <h1 style={{fontSize:'2rem',fontWeight:800}}>404</h1>
            <p style={{color:'var(--text-muted)'}}>Page not found</p>
            <a href="/dashboard" className="btn btn-primary">← Back to Dashboard</a>
        </div>
    );
}
