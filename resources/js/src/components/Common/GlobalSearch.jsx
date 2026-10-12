import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Ticket, Laptop, BookOpen, User, Loader2 } from 'lucide-react';
import api from '../../services/api';

export default function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    // Global keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    // Auto-focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setResults(null);
        }
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || query.trim().length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get('/search', { params: { q: query.trim() } });
                setResults(res.data?.data || null);
            } catch (err) {
                console.error('Search failed', err);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (url) => {
        setOpen(false);
        navigate(url);
    };

    const hasAnyResults = results && (
        (results.tickets?.length || 0) +
        (results.assets?.length || 0) +
        (results.articles?.length || 0) +
        (results.users?.length || 0)
    ) > 0;

    return (
        <>
            {/* Topbar trigger button */}
            <button
                type="button"
                className="topbar-search-trigger"
                onClick={() => setOpen(true)}
                title="Search anything (Ctrl+K)"
            >
                <Search size={15} className="text-slate-400" />
                <span className="search-placeholder">Search tickets, assets, users...</span>
                <kbd className="search-kbd">Ctrl K</kbd>
            </button>

            {/* Modal Dialog */}
            {open && (
                <div className="search-modal-backdrop" onClick={() => setOpen(false)}>
                    <div
                        className="search-modal-container"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="search-modal-input-wrap">
                            <Search size={18} className="text-slate-400 shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                className="search-modal-input"
                                placeholder="Search by ticket #, title, asset code, user..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {loading ? (
                                <Loader2 size={16} className="animate-spin text-blue-500 shrink-0" />
                            ) : query ? (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                    <X size={16} />
                                </button>
                            ) : null}
                        </div>

                        <div className="search-modal-results">
                            {query.trim().length < 2 && (
                                <div className="search-modal-hint">
                                    Type at least 2 characters to search across tickets, assets, articles, and users.
                                </div>
                            )}

                            {query.trim().length >= 2 && !loading && !hasAnyResults && (
                                <div className="search-modal-empty">
                                    No results found for "{query}".
                                </div>
                            )}

                            {/* Tickets */}
                            {results?.tickets?.length > 0 && (
                                <div className="search-group">
                                    <div className="search-group-header">
                                        <Ticket size={14} className="text-blue-500" />
                                        <span>Tickets ({results.tickets.length})</span>
                                    </div>
                                    {results.tickets.map((t) => (
                                        <div
                                            key={t.id}
                                            className="search-result-item"
                                            onClick={() => handleSelect(`/tickets/${t.id}`)}
                                        >
                                            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                                                {t.ticket_number}
                                            </span>
                                            <span className="truncate flex-1 text-sm font-medium">
                                                {t.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Assets */}
                            {results?.assets?.length > 0 && (
                                <div className="search-group">
                                    <div className="search-group-header">
                                        <Laptop size={14} className="text-teal-500" />
                                        <span>Assets ({results.assets.length})</span>
                                    </div>
                                    {results.assets.map((a) => (
                                        <div
                                            key={a.id}
                                            className="search-result-item"
                                            onClick={() => handleSelect(`/assets/${a.id}`)}
                                        >
                                            <span className="font-mono text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded">
                                                {a.asset_code}
                                            </span>
                                            <span className="truncate flex-1 text-sm font-medium">
                                                {a.name}
                                            </span>
                                            <span className="text-xs text-slate-400 uppercase">
                                                {a.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Articles */}
                            {results?.articles?.length > 0 && (
                                <div className="search-group">
                                    <div className="search-group-header">
                                        <BookOpen size={14} className="text-purple-500" />
                                        <span>Knowledge Base ({results.articles.length})</span>
                                    </div>
                                    {results.articles.map((art) => (
                                        <div
                                            key={art.id}
                                            className="search-result-item"
                                            onClick={() => handleSelect(`/knowledge/${art.id}`)}
                                        >
                                            <span className="truncate flex-1 text-sm font-medium">
                                                {art.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Users */}
                            {results?.users?.length > 0 && (
                                <div className="search-group">
                                    <div className="search-group-header">
                                        <User size={14} className="text-amber-500" />
                                        <span>Users ({results.users.length})</span>
                                    </div>
                                    {results.users.map((u) => (
                                        <div
                                            key={u.id}
                                            className="search-result-item"
                                            onClick={() => handleSelect(`/admin/users`)}
                                        >
                                            <span className="truncate flex-1 text-sm font-medium">
                                                {u.first_name} {u.last_name}
                                            </span>
                                            <span className="text-xs text-slate-400 truncate">
                                                {u.email}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="search-modal-footer">
                            <span>Navigate with mouse or click</span>
                            <span>Esc to close</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
