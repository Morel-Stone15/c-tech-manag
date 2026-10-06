import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function Toast({ msg, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />,
    error: <AlertTriangle size={18} style={{ color: 'var(--accent-rose)' }} />,
    info: <Info size={18} style={{ color: 'var(--accent-cyan)' }} />,
    warning: <AlertTriangle size={18} style={{ color: 'var(--accent-amber)' }} />
  };

  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        {icons[type] || icons.info}
        <span style={{ flex: 1 }}>{msg}</span>
        <button className="toast-close" onClick={onClose}>
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
