export default function Form({ children, onSubmit }) {
    return (
        <form className="form-card" onSubmit={onSubmit}>
            {children}
        </form>
    );
}
