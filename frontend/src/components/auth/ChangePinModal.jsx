import { useState } from 'react';
import { Shield, Key, Check } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export function ChangePinModal({ user, member, onClose, showToast, onPinChanged }) {
  // Support both `user` and `member` prop names for backwards compatibility
  const currentUser = user || member;
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPin !== confirmPin) {
      showToast('Les nouveaux codes PIN ne correspondent pas.', 'error');
      return;
    }
    if (newPin.length < 4) {
      showToast('Le code PIN doit comporter au moins 4 caractères.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePin({
        member_id: currentUser.id,
        old_pin: oldPin,
        new_pin: newPin
      });
      showToast(res.message || 'Code PIN modifié avec succès !', 'success');
      if (onPinChanged) onPinChanged(res.member);
      onClose();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la modification du PIN.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Changer mon Code PIN" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Ancien Code PIN</label>
          <input
            type="password"
            className="form-input"
            value={oldPin}
            onChange={e => setOldPin(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Nouveau Code PIN</label>
          <input
            type="password"
            className="form-input"
            value={newPin}
            onChange={e => setNewPin(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Confirmer le Nouveau Code PIN</label>
          <input
            type="password"
            className="form-input"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-between gap-3" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Modification...' : <><Check size={16} /> Enregistrer le nouveau PIN</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
