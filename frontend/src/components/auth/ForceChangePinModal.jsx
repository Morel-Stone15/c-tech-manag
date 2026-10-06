import { useState } from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export function ForceChangePinModal({ user, onPinChanged }) {
  const { currentUser, updateCurrentUser } = useAuth();
  const activeUser = user || currentUser;
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPin !== confirmPin) {
      setError('Les nouveaux codes PIN ne correspondent pas.');
      return;
    }
    if (newPin.length < 4) {
      setError('Le code PIN doit comporter au moins 4 caractères.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePin({
        member_id: activeUser.id,
        old_pin: '',
        new_pin: newPin
      });
      updateCurrentUser({ must_change_pin: false });
      if (onPinChanged) onPinChanged(res.member);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'enregistrement du PIN.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-panel" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={20} style={{ color: 'var(--accent-amber)' }} />
            Définir votre Code PIN Personnel
          </h3>
        </div>
        <div className="modal-body">
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            marginBottom: 20,
            fontSize: 13.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Bienvenue <strong style={{ color: 'var(--text-primary)' }}>{activeUser?.first_name} {activeUser?.last_name}</strong> !
            Pour des raisons de sécurité, vous devez définir votre code PIN personnel avant de continuer.
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--accent-rose)',
              fontSize: 13,
              marginBottom: 16
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nouveau Code PIN Personnel</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimum 4 caractères"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le Code PIN</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirmez votre PIN"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8 }} disabled={loading}>
              {loading ? 'Validation en cours...' : <><Check size={16} /> Enregistrer mon PIN personnel</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
