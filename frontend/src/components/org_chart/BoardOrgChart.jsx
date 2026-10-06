import { useState, useEffect } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';

export function BoardOrgChart({ user, showToast }) {
  const [chart, setChart] = useState([]);
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ role_name: '', member_id: '', parent_id: '', order: 0 });

  function load() {
    api.getOrgChart().then(d => setChart(Array.isArray(d) ? d : [])).catch(() => {});
    api.getMembers().then(d => setMembers(Array.isArray(d) ? d : [])).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await api.addOrgRole({
        role_name: form.role_name,
        member_id: form.member_id ? parseInt(form.member_id) : null,
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        order: parseInt(form.order) || 0,
        operator: user?.first_name || 'Bureau'
      });
      showToast('Poste ajouté à l\'organigramme', 'success');
      setModalOpen(false);
      setForm({ role_name: '', member_id: '', parent_id: '', order: 0 });
      load();
    } catch (err) {
      showToast(err.message || 'Erreur lors de la création.', 'error');
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Supprimer le poste "${name}" ?`)) return;
    try {
      await api.deleteOrgRole(id, user?.first_name || 'Bureau');
      showToast('Poste supprimé', 'success');
      load();
    } catch (err) {
      showToast('Erreur lors de la suppression.', 'error');
    }
  }

  const categoryColors = ['indigo', 'violet', 'cyan', 'emerald', 'amber', 'rose'];

  return (
    <>
      {modalOpen && (
        <Modal title="Ajouter un Poste au Bureau" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Titre du Poste</label>
              <input
                className="form-input"
                placeholder="Ex: Vice-Président Technologique"
                value={form.role_name}
                onChange={e => setForm(p => ({ ...p, role_name: e.target.value }))}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Membre Attribué (optionnel)</label>
              <select className="form-select" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}>
                <option value="">Aucun (Poste vacant)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.member_number})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Poste Parent (optionnel)</label>
              <select className="form-select" value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))}>
                <option value="">Aucun (poste racine)</option>
                {chart.map(c => (
                  <option key={c.id} value={c.id}>{c.role_name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
              <button className="btn btn-primary" type="submit">Enregistrer le Poste</button>
            </div>
          </form>
        </Modal>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            <Building2 size={24} style={{ color: 'var(--accent-primary-light)' }} />
            Organigramme du Bureau
          </h1>
          <p className="page-subtitle">Structure hiérarchique et rôles exécutifs — {chart.length} poste(s)</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Ajouter un Poste
          </button>
        </div>
      </div>

      {chart.length === 0 ? (
        <div className="empty-state card" style={{ padding: 48 }}>
          <Building2 size={40} />
          <h3>Organigramme vide</h3>
          <p>Ajoutez les postes du bureau pour construire la structure hiérarchique.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Ajouter le premier poste
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 'var(--space-5)'
        }}>
          {chart.map((item, idx) => (
            <div key={item.id} className="card" style={{ transition: 'all 0.25s' }}>
              <div className="card-header">
                <span className={`badge badge-${categoryColors[idx % categoryColors.length]}`}>
                  {item.role_name}
                </span>
                <button
                  className="btn btn-danger btn-icon sm"
                  title="Supprimer"
                  onClick={() => handleDelete(item.id, item.role_name)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="card-body">
                {item.member ? (
                  <div className="flex items-center gap-3">
                    <Avatar member={item.member} size="lg" />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{item.member.first_name} {item.member.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.member.major}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{item.member.member_number}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
                    Poste non attribué
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
