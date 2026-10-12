import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
    isOpen = true,
    title,
    children,
    onClose,
    maxWidth = 'max-w-lg',
    subtitle,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className={`modal-container ${maxWidth} w-full`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title">{title}</h3>
                        {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="modal-close-btn"
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
}
