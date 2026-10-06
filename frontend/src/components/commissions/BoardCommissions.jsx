import { useState, useEffect } from 'react';
import { Layers, Plus, Users } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export function BoardCommissions({ user, showToast }) {
  const [commissions, setCommissions] = useState([]);
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', lead_member_id: '' });

  function load() {
    api.getCommissions().then(d => setCommissions(Array.isArray(d) ? d : [])).catch(() => {});
    api.getMembers().then(d => setMembers(Array.isArray(d) ? d : [])).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.createCommission({
        name: form.name,
        description: form.description,
        lead_member_id: form.lead_member_id ? parseInt(form.lead_member_id) : null,
        operator: user?.first_name || 'Bureau'
      });
      showToast('Commission créée avec succès', 'success');
      setModalOpen(false);
      setForm({ name: '', description: '', lead_member_id: '' });
      load();
    } catch (err) {
      showToast(err.message || 'Erreur création commission.', 'error');
    }
  }

  return (
    <>
      {modalOpen && (
        <Modal title="Créer un Pôle / Commission Tech" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Nom du Pôle / Commission</label>
              <input className="form-input" placeholder="Ex: Pôle Cybersécurité & Ethical Hacking" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description & Objectifs</label>
              <textarea className="form-textarea" placeholder="Description des projets et activités..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ minHeight: 100 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Responsable du Pôle</label>
              <select className="form-select" value={form.lead_member_id} onChange={e => setForm(p => ({ ...p, lead_member_id: e.target.value }))}>
                <option value="">Sélectionner un membre...</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary w-full" type="submit" style={{ marginTop: 16 }}>Créer la Commission</button>
          </form>
        </Modal>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title"><Layers size={24} style={{ color: 'var(--accent-primary-light)' }} />Commissions & Pôles Tech</h1>
          <p className="page-subtitle">Groupes de travail et pôles de spécialisation — {commissions.length} commission(s)</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} />Nouvelle Commission</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
        {commissions.length === 0 ? (
          <div className="empty-state card" style={{ padding: 48, gridColumn: '1/-1' }}>
            <Layers size={40} />
            <h3>Aucune commission</h3>
            <p>Créez des pôles thématiques pour organiser les membres par spécialité.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModalOpen(true)}><Plus size={16} /> Créer une commission</button>
          </div>
        ) : commissions.map(c => (
          <div key={c.id} className="card">
            <div className="card-header">
              <span className="badge badge-violet">{c.name}</span>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={13} /> {c.member_count}
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                {c.description || 'Pôle spécialisé du Club C-TECH.'}
              </p>
              {c.lead_member && (
                <div style={{ fontSize: 12, color: 'var(--accent-primary-light)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  👑 Lead : {c.lead_member.first_name} {c.lead_member.last_name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
