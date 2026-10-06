import { X } from 'lucide-react';

export function Modal({ title, children, onClose, footer, size = '' }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel ${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
