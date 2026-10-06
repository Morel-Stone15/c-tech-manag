import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, zIndex: 9999,
      background: 'rgba(13, 20, 39, 0.94)', border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-lg)', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-card)',
      backdropFilter: 'blur(16px)'
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>Installer C-TECH</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Application officielle du Club</div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={handleInstall}><Download size={14} />Installer</button>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
    </div>
  );
}
