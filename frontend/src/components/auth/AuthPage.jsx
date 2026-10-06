import { useState } from 'react';
import {
  CreditCard, Shield, UserPlus, Eye, EyeOff, Mail, Camera, ArrowLeft
} from 'lucide-react';
import { ALL_FILIERES, ALL_NIVEAUX } from '../../constants/data';
import { api } from '../../services/api';
import { Toast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { AntigravityCanvas } from '../common/AntigravityCanvas';

export function AuthPage({ onLogin, initialTab = 'member', onBackToHome }) {
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [regSuccess, setRegSuccess] = useState(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [memberData, setMemberData] = useState({ member_number: '', pin: '' });
  const [bureauData, setBureauData] = useState({ member_number: 'CT-ADMIN', pin: '' });

  const [regData, setRegData] = useState({ first_name: '', last_name: '', major: ALL_FILIERES[0], level: ALL_NIVEAUX[0], email: '', phone: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  async function handleMemberLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(memberData);
      showToast('Connexion réussie !', 'success');
      setTimeout(() => onLogin(res.member), 400);
    } catch (err) {
      showToast(err.message || 'Identifiant ou PIN incorrect.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBureauLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(bureauData);
      if (!res.member.is_bureau) {
        showToast('Accès refusé : Ce compte n\'a pas les privilèges Bureau.', 'error');
        return;
      }
      showToast('Connexion Espace Bureau réussie !', 'success');
      setTimeout(() => onLogin(res.member), 400);
    } catch (err) {
      showToast(err.message || 'Erreur de connexion.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPin(e) {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    try {
      const res = await api.forgotPin({ email: forgotInput.trim() });
      showToast(res.message, 'success');
      setForgotOpen(false);
      setForgotInput('');
    } catch (err) {
      showToast(err.message || 'Erreur lors de la récupération.', 'error');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(regData).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      const res = await api.register(fd);
      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      setRegSuccess(res);
    } catch (err) {
      showToast(err.message || 'Erreur serveur lors de l\'inscription.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  if (regSuccess) {
    return (
      <div className="auth-container">
        <AntigravityCanvas />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Inscription Validée !</h2>
          <p className="text-muted" style={{ marginBottom: 20, fontSize: 13 }}>
            Votre carte virtuelle a été générée et envoyée par email avec votre code de départ.
          </p>
          <div className="card" style={{ textAlign: 'left', marginBottom: 18, background: 'rgba(99,102,241,0.08)' }}>
            <div className="card-body" style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 13, minWidth: 140, color: 'var(--text-secondary)' }}>Numéro membre :</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary-light)', fontSize: 16 }}>
                    {regSuccess.member.member_number}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 13, minWidth: 140, color: 'var(--text-secondary)' }}>Code de départ (24h) :</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 22, letterSpacing: 6, color: '#fff' }}>
                    {regSuccess.pin}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button className="btn btn-primary w-full" onClick={() => { setRegSuccess(null); setTab('member'); }}>
            Se Connecter Maintenant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <AntigravityCanvas />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {forgotOpen && (
        <Modal title="Récupération du Code PIN" onClose={() => setForgotOpen(false)}>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Saisissez votre <strong>adresse email</strong> ou <strong>numéro membre</strong>. Un nouveau PIN temporaire vous sera envoyé.
          </p>
          <form onSubmit={handleForgotPin}>
            <div className="form-group">
              <label className="form-label">Email ou N° de membre</label>
              <input
                className="form-input"
                placeholder="votre.email@clubtech.org ou CT-2026-0001"
                value={forgotInput}
                onChange={e => setForgotInput(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="flex justify-between gap-2" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setForgotOpen(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                {forgotLoading ? 'Envoi...' : 'Envoyer nouveau PIN'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="auth-card">
        {onBackToHome && (
          <button onClick={onBackToHome} className="btn btn-ghost btn-sm" style={{ marginBottom: 16, paddingLeft: 0 }}>
            <ArrowLeft size={16} /> Retour à l'accueil
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="Logo C-TECH" style={{ height: 48, width: 'auto', marginBottom: 8, filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.5))' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>C-TECH</h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            Portail Membre & Administration
          </p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'member' ? 'active' : ''}`} onClick={() => setTab('member')}>
            <CreditCard size={14} style={{ marginRight: 6 }} /> Espace Membre
          </button>
          <button className={`auth-tab ${tab === 'bureau' ? 'active' : ''}`} onClick={() => setTab('bureau')}>
            <Shield size={14} style={{ marginRight: 6 }} /> Espace Bureau
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            <UserPlus size={14} style={{ marginRight: 6 }} /> Inscription
          </button>
        </div>

        {tab === 'member' && (
          <form onSubmit={handleMemberLogin}>
            <div className="form-group">
              <label className="form-label">Email ou N° de Membre</label>
              <input className="form-input" placeholder="CT-2026-0001 ou email" value={memberData.member_number}
                onChange={e => setMemberData(p => ({ ...p, member_number: e.target.value }))} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Code PIN</label>
              <div className="input-icon-wrapper" style={{ display: 'flex' }}>
                <input className="form-input" type={showPin ? 'text' : 'password'} placeholder="••••••" value={memberData.pin}
                  onChange={e => setMemberData(p => ({ ...p, pin: e.target.value }))} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button type="button" onClick={() => setForgotOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary-light)', fontSize: 12.5, cursor: 'pointer' }}>
                Code PIN oublié ?
              </button>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Connexion en cours...' : 'Se Connecter à mon Espace'}
            </button>
          </form>
        )}

        {tab === 'bureau' && (
          <form onSubmit={handleBureauLogin}>
            <div className="form-group">
              <label className="form-label">Identifiant Administrateur</label>
              <input className="form-input" value={bureauData.member_number}
                onChange={e => setBureauData(p => ({ ...p, member_number: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Code PIN Admin</label>
              <input className="form-input" type="password" placeholder="••••••" value={bureauData.pin}
                onChange={e => setBureauData(p => ({ ...p, pin: e.target.value }))} required autoFocus />
            </div>
            <button className="btn btn-primary w-full" type="submit" style={{ marginTop: 14 }} disabled={loading}>
              {loading ? 'Vérification...' : 'Accéder à l\'Espace Bureau'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Prénom</label>
                <input className="form-input" value={regData.first_name} onChange={e => setRegData(p => ({ ...p, first_name: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Nom</label>
                <input className="form-input" value={regData.last_name} onChange={e => setRegData(p => ({ ...p, last_name: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input className="form-input" type="email" placeholder="votre.email@clubtech.org" value={regData.email} onChange={e => setRegData(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-input" placeholder="+212 600000000" value={regData.phone} onChange={e => setRegData(p => ({ ...p, phone: e.target.value }))} required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Filière / Domaine</label>
                <select className="form-select" value={regData.major} onChange={e => setRegData(p => ({ ...p, major: e.target.value }))}>
                  {ALL_FILIERES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Niveau d'étude</label>
                <select className="form-select" value={regData.level} onChange={e => setRegData(p => ({ ...p, level: e.target.value }))}>
                  {ALL_NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Photo de profil (optionnel)</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="form-input" />
            </div>
            <button className="btn btn-primary w-full" type="submit" style={{ marginTop: 10 }} disabled={loading}>
              {loading ? 'Création de la carte...' : 'Créer mon Compte & Générer ma Carte'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
