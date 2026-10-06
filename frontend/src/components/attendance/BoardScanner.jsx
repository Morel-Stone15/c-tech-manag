import { useState, useEffect } from 'react';
import { ScanLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';

export function BoardScanner({ user, showToast }) {
  const [memberNumber, setMemberNumber] = useState('');
  const [eventName, setEventName] = useState('Atelier Cybersécurité C-TECH');
  const [lastScan, setLastScan] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!memberNumber.trim()) return;
    setLoading(true);
    try {
      const res = await api.scanAttendance({
        member_number: memberNumber.trim().toUpperCase(),
        event_name: eventName,
        operator: user?.first_name || 'Bureau'
      });
      setLastScan(res);
      showToast(res.message, 'success');
      setMemberNumber('');
    } catch (err) {
      showToast(err.message || 'Erreur lors du scan.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">Scanner QR Code de Présence</h1><p className="page-subtitle">Validez la présence des membres aux événements</p></div>
      </div>

      <div className="form-grid-2">
          <div className="card">
            <div className="card-header"><div className="card-header-title"><ScanLine size={18} />Émargement Présence</div></div>
            <div className="card-body">
              <form onSubmit={handleManualSubmit}>
                <div className="form-group">
                  <label className="form-label">Nom de l'Événement</label>
                  <input className="form-input" value={eventName} onChange={e => setEventName(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Numéro de Membre (ou scan QR)</label>
                  <input
                    className="form-input"
                    placeholder="Ex: CT-2026-0001"
                    value={memberNumber}
                    onChange={e => setMemberNumber(e.target.value)}
                    autoFocus
                    required
                    style={{ fontSize: 18, fontFamily: 'var(--font-mono)', letterSpacing: 2, textTransform: 'uppercase' }}
                  />
                </div>

                <button className="btn btn-primary w-full" type="submit" disabled={loading}>
                  {loading ? 'Validation...' : <><ScanLine size={18} /> Valider la Présence</>}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-header-title"><CheckCircle2 size={18} />Dernier Pointage Validé</div></div>
            <div className="card-body" style={{ textAlign: 'center', padding: 36 }}>
              {lastScan ? (
                <div>
                  <Avatar member={lastScan.member} size="xl" className="mx-auto" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>{lastScan.member.first_name} {lastScan.member.last_name}</h3>
                  <div style={{ color: 'var(--accent-primary-light)', fontFamily: 'var(--font-mono)', fontWeight: 700, margin: '6px 0 16px' }}>
                    {lastScan.member.member_number}
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: 13, padding: '6px 16px' }}>
                    ✓ Présence Confirmée — {lastScan.attendance.event_name}
                  </span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  <ScanLine size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  Scannez un QR code ou saisissez un numéro de membre pour valider sa présence.
                </div>
              )}
            </div>
          </div>
      </div>
    </>
  );
}
