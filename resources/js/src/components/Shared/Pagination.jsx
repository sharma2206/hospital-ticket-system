import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
    currentPage = 1,
    lastPage = 1,
    total = 0,
    from = 0,
    to = 0,
    itemLabel = "items",
    onPageChange,
}) {
    if (lastPage <= 1) return null;

    const current = Number(currentPage);
    const pages = [];
    const maxVisible = 7;

    let start = Math.max(1, current - 3);
    let end = Math.min(lastPage, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let p = start; p <= end; p++) {
        pages.push(p);
    }

    return (
        <div className="pagination-container">
            <div>
                {total > 0 ? (
                    <span>
                        Showing <strong className="font-semibold text-slate-700 dark:text-slate-300">{from}</strong>–
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">{to}</strong> of{" "}
                        <strong className="font-semibold text-slate-700 dark:text-slate-300">{total}</strong> {itemLabel}
                    </span>
                ) : (
                    <span>Page {current} of {lastPage}</span>
                )}
            </div>

            <div className="pagination-actions">
                <button
                    type="button"
                    className="pagination-btn"
                    disabled={current <= 1}
                    onClick={() => onPageChange(current - 1)}
                    title="Previous page"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={15} />
                </button>

                {start > 1 && (
                    <>
                        <button
                            type="button"
                            className={`pagination-btn ${current === 1 ? "active" : ""}`}
                            onClick={() => onPageChange(1)}
                        >
                            1
                        </button>
                        {start > 2 && <span className="px-1 text-slate-400">…</span>}
                    </>
                )}

                {pages.map((p) => (
                    <button
                        key={p}
                        type="button"
                        className={`pagination-btn ${current === p ? "active" : ""}`}
                        onClick={() => onPageChange(p)}
                    >
                        {p}
                    </button>
                ))}

                {end < lastPage && (
                    <>
                        {end < lastPage - 1 && <span className="px-1 text-slate-400">…</span>}
                        <button
                            type="button"
                            className={`pagination-btn ${current === lastPage ? "active" : ""}`}
                            onClick={() => onPageChange(lastPage)}
                        >
                            {lastPage}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    className="pagination-btn"
                    disabled={current >= lastPage}
                    onClick={() => onPageChange(current + 1)}
                    title="Next page"
                    aria-label="Next page"
                >
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}
