import React from "react";
import { Search, RotateCcw } from "lucide-react";

export default function SearchFilterBar({
    search = "",
    onSearchChange,
    onSearchSubmit,
    searchPlaceholder = "Search...",
    onReset,
    children,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSearchSubmit) onSearchSubmit(e);
    };

    return (
        <div className="filter-toolbar">
            <form onSubmit={handleSubmit} className="filter-search-form">
                <input
                    type="text"
                    className="form-control"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
                {onSearchSubmit && (
                    <button
                        type="submit"
                        className="btn btn-secondary btn-sm"
                        title="Search"
                        aria-label="Search"
                    >
                        <Search size={15} />
                    </button>
                )}
            </form>

            <div className="filter-selects-wrap">
                {children}

                {onReset && (
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm inline-flex items-center gap-1.5"
                        onClick={onReset}
                        title="Reset all filters"
                    >
                        <RotateCcw size={14} />
                        <span>Reset</span>
                    </button>
                )}
            </div>
        </div>
    );
}
