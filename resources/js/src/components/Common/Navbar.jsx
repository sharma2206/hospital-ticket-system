import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const { user, logout } = useAuth();
    return (
        <nav className="bg-blue-800 text-white px-6 py-3 flex justify-between items-center">
            <div className="flex gap-6 items-center">
                <span className="font-bold text-lg">🏥 HIMS Support</span>
                <Link to="/dashboard" className="hover:underline text-sm">
                    Dashboard
                </Link>
                <Link to="/tickets" className="hover:underline text-sm">
                    Tickets
                </Link>
                <Link to="/tickets/create" className="hover:underline text-sm">
                    + New Ticket
                </Link>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <span>
                    {user?.name}{" "}
                    <span className="text-blue-300">({user?.role})</span>
                </span>
                <button
                    onClick={logout}
                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}
