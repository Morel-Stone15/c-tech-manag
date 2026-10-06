import { useState } from 'react';
import { Mail, MessageSquare, Send, Bell, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { ALL_FILIERES, ALL_NIVEAUX } from '../../constants/data';
import { DiscussionView } from '../discussion/DiscussionView';

export function BoardCommunication({ user, showToast }) {
  const [tab, setTab] = useState('mass');
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', major: '', level: '' });
  const [sending, setSending] = useState(false);

  async function sendMassEmail(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.sendMassEmail({ ...emailForm, operator: user?.first_name || 'Bureau' });
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast(res.message, 'success');
      setEmailForm({ subject: '', body: '', major: '', level: '' });
    } catch (err) {
      showToast('Erreur lors de l\'envoi de l\'email groupé.', 'error');
    } finally {
      setSending(false);
    }
  }

  const filieres = ['', ...ALL_FILIERES];
  const niveaux = ['', ...ALL_NIVEAUX];

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Mail size={24} style={{ color: 'var(--accent-primary-light)' }} />Communication</h1>
          <p className="page-subtitle">Email groupé & discussion interne du club</p>
        </div>
      </div>

      <div className="page-body">
        <div className="auth-tabs" style={{ marginBottom: 24, maxWidth: 420 }}>
          <button className={`auth-tab ${tab === 'mass' ? 'active' : ''}`} onClick={() => setTab('mass')}>
            <Mail size={15} style={{ marginRight: 6 }} /> Email Groupé
          </button>
          <button className={`auth-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
            <MessageSquare size={15} style={{ marginRight: 6 }} /> Discussion Bureau
          </button>
        </div>

        {tab === 'mass' && (
          <div className="card" style={{ maxWidth: 640 }}>
            <div className="card-header"><div className="card-header-title"><Send size={18} />Envoi d'Email Massif Personnalisé</div></div>
            <div className="card-body">
              <form onSubmit={sendMassEmail}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Filière Cible (Optionnel)</label>
                    <select className="form-select" value={emailForm.major} onChange={e => setEmailForm(p => ({ ...p, major: e.target.value }))}>
                      {filieres.map(f => <option key={f} value={f}>{f || 'Toutes les filières'}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Niveau Cible (Optionnel)</label>
                    <select className="form-select" value={emailForm.level} onChange={e => setEmailForm(p => ({ ...p, level: e.target.value }))}>
                      {niveaux.map(n => <option key={n} value={n}>{n || 'Tous les niveaux'}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Objet de l'Email</label>
                  <input className="form-input" placeholder="Ex: Invitation Hackathon AI 2026..." value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Message Personnalisé (Administrateur)</label>
                  <textarea className="form-textarea" style={{ minHeight: 180 }} placeholder="Rédigez ici le message exact qui sera adressé aux membres ciblés..." value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} required />
                </div>

                <button className="btn btn-primary w-full" type="submit" disabled={sending}>
                  {sending ? 'Envoi en cours...' : <><Send size={16} /> Envoyer l'Email Groupé</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'chat' && <DiscussionView member={user} showToast={showToast} />}
      </div>
    </>
  );
}
